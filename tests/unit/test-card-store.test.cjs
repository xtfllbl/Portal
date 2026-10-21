const { test } = require("node:test");
const assert = require("node:assert/strict");
const S = require("../../scripts/test-card-store.js");
const manufacturers = [
  { value: "p-huangjiaowan", label: "黄角湾" },
  { value: "p-taizhou-lianchuang", label: "台州联创电子有限公司" },
];
const storage = () => {
  let data = new Map();
  return {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
  };
};
const date = "2026-10-21T09:00:00.000Z";

test("dealer movement preserves eligibility, latest manufacturer and ever-bound state are authoritative", () => {
  const db = S.seed(),
    card = db.cards[0],
    dealer = db.terminals[1];
  assert.equal(
    S.acceptance(card, dealer, { currency: "USD", debit: 100 }, date),
    "",
  );
  assert.match(
    S.acceptance(card, db.terminals[2], {}, date),
    /previously been bound/,
  );
  assert.match(
    S.acceptance(card, db.terminals[3], {}, date),
    /manufacturer does not match/,
  );
  assert.match(
    S.acceptance(card, { ...dealer, inventoryHistory: [] }, {}, date),
    /no manufacturer inventory/,
  );
  assert.match(
    S.acceptance(card, dealer, { currency: "EUR" }, date),
    /Currency/,
  );
  assert.match(
    S.acceptance(card, dealer, { debit: card.balance + 1 }, date),
    /Insufficient/,
  );
});

test("manufacturer edits preserve credit and immutable transaction attribution, including switching back", () => {
  const mem = storage(),
    db = S.read(mem),
    card = db.cards[0],
    old = S.related(db.transactions, "TC-20261020-003");
  const next = S.updateCard(
    card.uid,
    { ...card, manufacturerId: manufacturers[1].value },
    card.version,
    manufacturers,
    mem,
  );
  const edited = next.cards[0];
  assert.equal(edited.balance, card.balance);
  assert.equal(edited.currency, card.currency);
  assert.equal(edited.assignmentVersion, 2);
  assert.deepEqual(S.related(next.transactions, "TC-20261020-003"), old);
  const restored = S.updateCard(
    card.uid,
    { ...edited, manufacturerId: card.manufacturerId },
    edited.version,
    manufacturers,
    mem,
  ).cards[0];
  assert.match(
    S.acceptance(
      restored,
      db.terminals[1],
      { original: db.transactions[0] },
      date,
    ),
    /read-only/,
  );
});

test("adjustment uses integer cents, rejects overdrafts and stale saves without partial mutation", () => {
  const mem = storage(),
    card = S.read(mem).cards[1];
  const next = S.adjust(
    card.uid,
    { type: "Deduct", amount: "0.10", remark: "Factory adjustment" },
    card.version,
    mem,
  );
  assert.equal(next.cards[1].balance, 750);
  const before = mem.getItem(S.KEY);
  assert.throws(
    () =>
      S.adjust(
        card.uid,
        { type: "Deduct", amount: "7.51", remark: "Factory adjustment" },
        2,
        mem,
      ),
    /exceeds/,
  );
  assert.throws(
    () =>
      S.adjust(
        card.uid,
        { type: "Top-up", amount: "1.00", remark: "Factory adjustment" },
        1,
        mem,
      ),
    /another tab/,
  );
  assert.equal(mem.getItem(S.KEY), before);
  assert.equal(S.cents("0.29"), 29);
  assert.throws(() => S.cents("0.001"), /decimal/);
  assert.throws(() => S.cents("-1"), /amount/);
});

test("batch creation is atomic and refuses duplicate cards or non-manufacturer scope", () => {
  const mem = storage();
  const row = {
    uid: "04CC0102030405",
    displayNumber: "NEW-001",
    manufacturerId: manufacturers[0].value,
    currency: "USD",
    initialBalance: "100.00",
    status: "Active",
    activatesAt: date,
    expiresAt: "",
  };
  assert.throws(
    () => S.createCards([row, row], manufacturers, mem),
    /already exists/,
  );
  assert.equal(mem.getItem(S.KEY), null);
  assert.throws(
    () =>
      S.createCards([{ ...row, manufacturerId: "PSP" }], manufacturers, mem),
    /eligible UPT/,
  );
  const next = S.createCards([row], manufacturers, mem);
  assert.equal(next.cards[0].balance, 10000);
  assert.equal(next.transactions.length, S.seed().transactions.length);
});

test("CSV parsing supports BOM, quoted commas and escaped quotes; export neutralizes spreadsheet formulas", () => {
  const head =
    "Card UID,Display Card Number,Currency,Initial Balance,Status,Activation Date,Expiration Date\r\n";
  const rows = S.parseCSV(
    "\uFEFF" +
      head +
      '04CC0102030405,"Test, ""Line A""",USD,100.00,Active,2026-10-21T00:00:00Z,\r\n',
  );
  assert.equal(rows[0].displayNumber, 'Test, "Line A"');
  assert.equal(rows[0].columnCount, 7);
  assert.throws(() => S.parseCSV("uid,name\n123,test"), /columns/);
  assert.throws(() => S.parseCSV(head + '"unclosed'), /unclosed/);
  assert.match(S.csv([['=HYPERLINK("bad")']]), /'=HYPERLINK/);
});

test("related transactions follow explicit references and include siblings without collecting unrelated same-card sales", () => {
  const related = S.related(S.seed().transactions, "TC-20261020-003");
  assert.deepEqual(
    related.map((t) => t.id),
    ["TC-20261020-002", "TC-20261020-003"],
  );
  assert.equal(S.related(S.seed().transactions, "TC-20261021-001").length, 1);
});

test("storage failures preserve the previous ledger and malformed data is never silently replaced", () => {
  const mem = storage(),
    card = S.read(mem).cards[0];
  mem.setItem(S.KEY, JSON.stringify(S.seed()));
  const before = mem.getItem(S.KEY);
  const blocked = {
    getItem: mem.getItem,
    setItem: () => {
      throw new Error("quota");
    },
  };
  assert.throws(
    () =>
      S.adjust(
        card.uid,
        { type: "Top-up", amount: "1", remark: "Factory credit" },
        1,
        blocked,
      ),
    /could not be saved/,
  );
  assert.equal(mem.getItem(S.KEY), before);
  mem.setItem(S.KEY, "{broken");
  assert.throws(() => S.read(mem), /preserved/);
  assert.equal(mem.getItem(S.KEY), "{broken");
});
