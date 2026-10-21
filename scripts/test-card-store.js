/* Browser-local Test Card prototype data. No production card/transaction keys are read. */
(function (root) {
  "use strict";
  const KEY = "paywizard-test-cards-v1";
  const STATUSES = ["Active", "Not Active", "Suspended", "Expired"];
  const CURRENCIES = ["USD", "CAD", "EUR", "GBP"];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const fail = (message) => {
    throw new Error(message);
  };
  function cents(value) {
    const text = String(value ?? "").trim();
    if (!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(text))
      fail(
        "Enter an amount from 0 to 99,999,999.99 with at most 2 decimal places.",
      );
    const [whole, part = ""] = text.split(".");
    return Number(whole) * 100 + Number(part.padEnd(2, "0"));
  }
  function effectiveStatus(card, date = now()) {
    if (card.expiresAt && card.expiresAt <= date) return "Expired";
    if (card.status === "Active" && card.activatesAt > date)
      return "Not Active";
    return card.status;
  }
  function seed() {
    const raw = [
      [
        "04A37C91B25F80",
        "TEST-HJW-001",
        "p-huangjiaowan",
        "黄角湾",
        "USD",
        97200,
        "Active",
      ],
      [
        "0418E6AA923B11",
        "TEST-HJW-002",
        "p-huangjiaowan",
        "黄角湾",
        "USD",
        760,
        "Active",
      ],
      [
        "0498AD3342FF09",
        "TEST-LC-001",
        "p-taizhou-lianchuang",
        "台州联创电子有限公司",
        "EUR",
        25000,
        "Suspended",
      ],
      [
        "04F3B821C04A77",
        "TEST-AE-001",
        "p-guangzhou-ailer",
        "广州艾尔",
        "CAD",
        50000,
        "Active",
      ],
      [
        "044D779D8221F0",
        "TEST-YF-001",
        "p-hangzhou-yunfan",
        "杭州云帆终端科技有限公司",
        "USD",
        100000,
        "Not Active",
      ],
      [
        "04E8C19977A20C",
        "TEST-HJW-003",
        "p-huangjiaowan",
        "黄角湾",
        "USD",
        0,
        "Expired",
      ],
      [
        "04AF2290BC3112",
        "TEST-LC-002",
        "p-taizhou-lianchuang",
        "台州联创电子有限公司",
        "EUR",
        99000,
        "Active",
      ],
      [
        "04BA1912AA6633",
        "TEST-HJW-004",
        "p-huangjiaowan",
        "黄角湾",
        "USD",
        50000,
        "Active",
      ],
    ];
    const cards = raw.map(
      ([
        uid,
        displayNumber,
        manufacturerId,
        manufacturerName,
        currency,
        balance,
        status,
      ]) => ({
        uid,
        displayNumber,
        manufacturerId,
        manufacturerName,
        currency,
        balance,
        status,
        activatesAt: "2026-01-01T00:00:00.000Z",
        expiresAt: status === "Expired" ? "2026-09-30T00:00:00.000Z" : "",
        createdAt: "2026-10-01T02:00:00.000Z",
        assignmentVersion: 1,
        version: 1,
      }),
    );
    const terminals = [
      {
        sn: "Q3H260001",
        name: "Assembly Line A",
        manufacturerId: "p-huangjiaowan",
        inventoryHistory: ["p-huangjiaowan"],
        owner: "黄角湾",
        everBound: false,
      },
      {
        sn: "Q3H260002",
        name: "Packaging Test Bench",
        manufacturerId: "p-huangjiaowan",
        inventoryHistory: ["p-huangjiaowan"],
        owner: "黄角湾华南代理",
        everBound: false,
      },
      {
        sn: "Q3H260003",
        name: "Final Inspection",
        manufacturerId: "p-huangjiaowan",
        inventoryHistory: ["p-huangjiaowan"],
        owner: "黄角湾华南代理",
        everBound: true,
      },
      {
        sn: "Q3L260001",
        name: "Quality Control Bench",
        manufacturerId: "p-taizhou-lianchuang",
        inventoryHistory: ["p-huangjiaowan", "p-taizhou-lianchuang"],
        owner: "台州联创渠道代理",
        everBound: false,
      },
      {
        sn: "Q3A260001",
        name: "Factory Test Station",
        manufacturerId: "p-guangzhou-ailer",
        inventoryHistory: ["p-guangzhou-ailer"],
        owner: "广州艾尔",
        everBound: false,
      },
    ];
    const transactions = [
      [
        "TC-20261021-001",
        0,
        0,
        "Sale",
        3000,
        "Completed",
        100200,
        97200,
        "",
        "2026-10-21T02:18:00.000Z",
        "",
      ],
      [
        "TC-20261021-002",
        0,
        1,
        "Sale",
        1000,
        "Failed",
        97200,
        97200,
        "",
        "2026-10-21T02:20:00.000Z",
        "Currency does not match the card currency.",
      ],
      [
        "TC-20261020-003",
        0,
        1,
        "Refund",
        200,
        "Completed",
        100000,
        100200,
        "TC-20261020-002",
        "2026-10-20T08:42:00.000Z",
        "",
      ],
      [
        "TC-20261020-002",
        0,
        1,
        "Sale",
        5000,
        "Completed",
        105000,
        100000,
        "",
        "2026-10-20T08:30:00.000Z",
        "",
      ],
      [
        "TC-20261020-004",
        1,
        2,
        "Sale",
        500,
        "Failed",
        760,
        760,
        "",
        "2026-10-20T08:00:00.000Z",
        "Terminal has previously been bound to a store.",
      ],
      [
        "TC-20261019-001",
        6,
        3,
        "Sale",
        1000,
        "Completed",
        100000,
        99000,
        "",
        "2026-10-19T06:00:00.000Z",
        "",
      ],
      [
        "TC-20261019-002",
        2,
        3,
        "Sale",
        1000,
        "Failed",
        25000,
        25000,
        "",
        "2026-10-19T05:00:00.000Z",
        "Card is suspended.",
      ],
      [
        "TC-20261018-002",
        3,
        4,
        "Void",
        2500,
        "Completed",
        47500,
        50000,
        "TC-20261018-001",
        "2026-10-18T09:01:00.000Z",
        "",
      ],
      [
        "TC-20261018-001",
        3,
        4,
        "Sale",
        2500,
        "Completed",
        50000,
        47500,
        "",
        "2026-10-18T09:00:00.000Z",
        "",
      ],
      [
        "TC-20261017-001",
        0,
        3,
        "Sale",
        2000,
        "Failed",
        105000,
        105000,
        "",
        "2026-10-17T03:00:00.000Z",
        "Card manufacturer does not match the terminal manufacturer.",
      ],
    ].map(
      ([
        id,
        ci,
        ti,
        type,
        amount,
        result,
        before,
        after,
        appliesTo,
        at,
        reason,
      ]) => ({
        id,
        cardUid: cards[ci].uid,
        displayNumber: cards[ci].displayNumber,
        manufacturerId: cards[ci].manufacturerId,
        manufacturerName: cards[ci].manufacturerName,
        terminalSn: terminals[ti].sn,
        terminalName: terminals[ti].name,
        terminalManufacturerId: terminals[ti].manufacturerId,
        terminalOwner: terminals[ti].owner,
        currency: id === "TC-20261021-002" ? "EUR" : cards[ci].currency,
        type,
        amount,
        result,
        before,
        after,
        appliesTo,
        at,
        reason,
        cardCurrency: cards[ci].currency,
        assignmentVersion: 1,
      }),
    );
    const initialBalances = [
      105000, 760, 25000, 50000, 100000, 0, 100000, 50000,
    ];
    const history = cards.map((c, i) => ({
      id: "H-" + c.uid,
      cardUid: c.uid,
      at: c.createdAt,
      event: "Created",
      before: 0,
      after: initialBalances[i],
      amount: initialBalances[i],
      currency: c.currency,
      operator: "ops.manager@paywizard.io",
      remark: "Initial test credit.",
    }));
    return { schema: 1, revision: 0, cards, transactions, history, terminals };
  }
  function read(storage = root.localStorage) {
    const text = storage.getItem(KEY);
    if (!text) return seed();
    let db;
    try {
      db = JSON.parse(text);
    } catch (_) {
      fail(
        "Test card data could not be read. Reload or contact support; existing data has been preserved.",
      );
    }
    if (
      db.schema !== 1 ||
      !Array.isArray(db.cards) ||
      !Array.isArray(db.transactions) ||
      !Array.isArray(db.history)
    )
      fail(
        "Test card data has an unsupported format. Existing data has been preserved.",
      );
    return db;
  }
  function commit(db, storage = root.localStorage) {
    const current = read(storage);
    if (current.revision !== db.revision)
      fail(
        "Test card data changed in another tab. Reload before saving your changes.",
      );
    const next = { ...db, revision: db.revision + 1 };
    try {
      storage.setItem(KEY, JSON.stringify(next));
    } catch (_) {
      fail(
        "Changes could not be saved. Check browser storage availability and try again; your input has been preserved.",
      );
    }
    return next;
  }
  function validateCard(input, db, manufacturers, existingUid = "") {
    const uid = String(input.uid || "")
      .trim()
      .toUpperCase();
    if (!/^(?:[0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$/.test(uid))
      fail("Card UID must contain 8, 14 or 20 hexadecimal characters.");
    if (db.cards.some((c) => c.uid === uid && c.uid !== existingUid))
      fail("This Card UID already exists. Open the existing card instead.");
    const displayNumber = String(input.displayNumber || "").trim();
    if (displayNumber.length > 60)
      fail("Display card number must be at most 60 characters.");
    if (
      displayNumber &&
      db.cards.some(
        (c) =>
          c.uid !== existingUid &&
          c.displayNumber.toLowerCase() === displayNumber.toLowerCase(),
      )
    )
      fail(
        "This display card number already exists. Enter a different display number.",
      );
    const manufacturer = manufacturers.find(
      (m) => m.value === input.manufacturerId,
    );
    if (!manufacturer)
      fail(
        "Select an eligible UPT manufacturer. PSPs and agents cannot be selected.",
      );
    if (!CURRENCIES.includes(input.currency))
      fail("Select a supported card currency.");
    if (!STATUSES.includes(input.status)) fail("Select a valid card status.");
    if (!input.activatesAt || !Number.isFinite(Date.parse(input.activatesAt)))
      fail("Enter a valid activation date and time.");
    if (
      input.expiresAt &&
      (!Number.isFinite(Date.parse(input.expiresAt)) ||
        Date.parse(input.expiresAt) < Date.parse(input.activatesAt))
    )
      fail("Expiration date cannot be earlier than activation date.");
    return {
      uid,
      displayNumber,
      manufacturerId: manufacturer.value,
      manufacturerName: manufacturer.label,
      currency: input.currency,
      status: input.status,
      activatesAt: new Date(input.activatesAt).toISOString(),
      expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : "",
    };
  }
  function createCards(inputs, manufacturers, storage) {
    let db = clone(read(storage));
    for (const input of inputs) {
      const value = validateCard(input, db, manufacturers);
      const balance = cents(input.initialBalance);
      const card = {
        ...value,
        balance,
        createdAt: now(),
        assignmentVersion: 1,
        version: 1,
      };
      db.cards.unshift(card);
      db.history.unshift({
        id: root.crypto.randomUUID(),
        cardUid: card.uid,
        at: now(),
        event: "Created",
        before: 0,
        after: balance,
        amount: balance,
        currency: card.currency,
        operator: "ops.manager@paywizard.io",
        remark: "Initial test credit.",
      });
    }
    return commit(db, storage);
  }
  function updateCard(uid, input, version, manufacturers, storage) {
    const db = clone(read(storage)),
      card = db.cards.find((c) => c.uid === uid);
    if (!card)
      fail("Card not found. Return to Card List and select an existing card.");
    if (card.version !== version)
      fail(
        "This card was updated in another tab. Reload before saving your changes.",
      );
    const value = validateCard(
      { ...input, uid, currency: card.currency },
      db,
      manufacturers,
      uid,
    );
    const oldName = card.manufacturerName,
      changed = card.manufacturerId !== value.manufacturerId;
    Object.assign(card, {
      displayNumber: value.displayNumber,
      status: value.status,
      manufacturerId: value.manufacturerId,
      manufacturerName: value.manufacturerName,
      activatesAt: value.activatesAt,
      expiresAt: value.expiresAt,
      version: card.version + 1,
    });
    if (changed) card.assignmentVersion++;
    db.history.unshift({
      id: root.crypto.randomUUID(),
      cardUid: uid,
      at: now(),
      event: changed ? "Manufacturer Changed" : "Card Updated",
      before: card.balance,
      after: card.balance,
      amount: 0,
      currency: card.currency,
      operator: "ops.manager@paywizard.io",
      remark: changed
        ? `${oldName} → ${card.manufacturerName}`
        : "Card details updated.",
    });
    return commit(db, storage);
  }
  function adjust(uid, input, version, storage) {
    const db = clone(read(storage)),
      card = db.cards.find((c) => c.uid === uid);
    if (!card) fail("Card not found. Search for an existing card.");
    if (card.version !== version)
      fail(
        "The card balance changed in another tab. Reload and review the current balance before adjusting.",
      );
    if (!["Top-up", "Deduct"].includes(input.type))
      fail("Select Top-up or Deduct.");
    const amount = cents(input.amount),
      remark = String(input.remark || "").trim();
    if (amount === 0) fail("Adjustment amount must be greater than zero.");
    if (remark.length < 6) fail("Enter a remark of at least 6 characters.");
    const before = card.balance,
      after = before + (input.type === "Top-up" ? amount : -amount);
    if (after < 0)
      fail("Deduction exceeds the current balance. Enter a smaller amount.");
    if (after > 9999999999)
      fail(
        "The resulting balance exceeds 99,999,999.99. Enter a smaller amount.",
      );
    card.balance = after;
    card.version++;
    db.history.unshift({
      id: root.crypto.randomUUID(),
      cardUid: uid,
      at: now(),
      event: input.type,
      before,
      after,
      amount: after - before,
      currency: card.currency,
      operator: "ops.manager@paywizard.io",
      remark,
    });
    return commit(db, storage);
  }
  // Describes the agreed acceptance rules for prototype fixtures; it is not a payment endpoint.
  function acceptance(card, terminal, request = {}, date = now()) {
    if (!card || !terminal) return "Card or terminal not found.";
    if (terminal.everBound)
      return "Terminal has previously been bound to a store.";
    const history = terminal.inventoryHistory || [],
      latest = history[history.length - 1];
    if (!latest) return "Terminal has no manufacturer inventory history.";
    if (latest !== card.manufacturerId)
      return "Card manufacturer does not match the terminal manufacturer.";
    if (effectiveStatus(card, date) !== "Active") return "Card is not active.";
    if (request.currency && request.currency !== card.currency)
      return "Currency does not match the card currency.";
    if (
      request.original &&
      (request.original.manufacturerId !== card.manufacturerId ||
        request.original.assignmentVersion !== card.assignmentVersion)
    )
      return "The card manufacturer has changed. The original transaction is read-only.";
    if (request.debit !== undefined && request.debit > card.balance)
      return "Insufficient test credit.";
    return "";
  }
  function related(records, id) {
    const ids = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const t of records) {
        if (t.appliesTo && (ids.has(t.id) || ids.has(t.appliesTo))) {
          if (!ids.has(t.id) || !ids.has(t.appliesTo)) changed = true;
          ids.add(t.id);
          ids.add(t.appliesTo);
        }
      }
    }
    return records
      .filter((t) => ids.has(t.id))
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  function parseCSV(text) {
    const rows = [];
    let row = [],
      field = "",
      quoted = false;
    text = String(text).replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (quoted) {
          quoted = false;
        } else if (!field) {
          quoted = true;
        } else
          fail("Invalid CSV quoting. Download the template and try again.");
      } else if (c === "," && !quoted) {
        row.push(field);
        field = "";
      } else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
        field = "";
      } else field += c;
    }
    if (quoted) fail("CSV contains an unclosed quoted value.");
    row.push(field);
    if (row.some((v) => v.trim())) rows.push(row);
    if (rows.length < 2)
      fail(
        "The CSV contains no card rows. Download the template and add at least one card.",
      );
    const expected = [
      "Card UID",
      "Display Card Number",
      "Currency",
      "Initial Balance",
      "Status",
      "Activation Date",
      "Expiration Date",
    ];
    if (
      rows[0].length !== expected.length ||
      rows[0].some((v, i) => v.trim() !== expected[i])
    )
      fail(
        "CSV columns do not match the test card template. Download the template and try again.",
      );
    if (rows.length > 501)
      fail("Import up to 500 cards per file. Split the file and try again.");
    return rows.slice(1).map((r, i) => ({
      row: i + 2,
      uid: r[0] || "",
      displayNumber: r[1] || "",
      currency: r[2] || "",
      initialBalance: r[3] || "",
      status: r[4] || "",
      activatesAt: r[5] || "",
      expiresAt: r[6] || "",
      columnCount: r.length,
    }));
  }
  function csv(rows) {
    return (
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((value) => {
              let s = String(value ?? "");
              if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
              return '"' + s.replace(/"/g, '""') + '"';
            })
            .join(","),
        )
        .join("\r\n")
    );
  }
  const api = {
    KEY,
    STATUSES,
    CURRENCIES,
    seed,
    read,
    cents,
    effectiveStatus,
    validateCard,
    createCards,
    updateCard,
    adjust,
    acceptance,
    related,
    parseCSV,
    csv,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PaywizardTestCardStore = api;
})(typeof window !== "undefined" ? window : globalThis);
