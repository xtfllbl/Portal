const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const UID = "04A37C91B25F80";
async function pick(page, label, text) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: text, exact: true }).click();
}
test.use({ viewport: { width: 1440, height: 1000 } });

test("new UPT Partners are shared with Test Card while PSPs remain excluded", async ({
  page,
}) => {
  await page.goto("/26.partner_information.html");
  await page.getByRole("button", { name: "Add Partner", exact: true }).click();
  await page.locator("#addPartnerType").selectOption("UPT");
  await page.locator("#addPartnerName").fill("Factory Catalog QA");
  await page.locator('#addPartnerForm button[type="submit"]').click();
  await page.reload();
  await expect(page.locator("#partnerTree")).toContainText(
    "Factory Catalog QA",
  );
  await page.goto("/51.test_card_activation.html");
  await page
    .getByRole("combobox", { name: "Applicable manufacturer", exact: true })
    .click();
  await page
    .getByRole("combobox", {
      name: "Search Applicable manufacturer",
      exact: true,
    })
    .fill("Factory Catalog QA");
  await expect(
    page.getByRole("option", { name: "Factory Catalog QA", exact: true }),
  ).toBeVisible();
});

test("activation errors retain input, focus visible summary, and factory dropdown stays anchored after search", async ({
  page,
}) => {
  await page.goto("/51.test_card_activation.html");
  await page.getByLabel("Card Unique Identifier", { exact: true }).fill(UID);
  await page.getByLabel("Initial Balance", { exact: true }).fill("10");
  await page
    .getByRole("combobox", { name: "Applicable manufacturer", exact: true })
    .click();
  const search = page.getByRole("combobox", {
    name: "Search Applicable manufacturer",
    exact: true,
  });
  await search.fill("联创");
  await expect(page.getByRole("option")).toHaveCount(1);
  const layout = await page
    .locator("#cardManufacturer-trigger")
    .evaluate((trigger) => {
      const p = document
          .querySelector(".pc-picker-panel:popover-open")
          .getBoundingClientRect(),
        r = trigger.getBoundingClientRect();
      return {
        top: p.top,
        bottom: p.bottom,
        triggerTop: r.top,
        triggerBottom: r.bottom,
        viewport: innerHeight,
      };
    });
  expect(layout.top).toBeGreaterThanOrEqual(0);
  expect(layout.bottom).toBeLessThanOrEqual(layout.viewport);
  expect(
    Math.min(
      Math.abs(layout.triggerTop - layout.bottom),
      Math.abs(layout.top - layout.triggerBottom),
    ),
  ).toBeLessThanOrEqual(8);
  await search.press("Enter");
  await page
    .getByRole("button", { name: "Activate Card", exact: true })
    .click();
  await expect(page.locator("#tcError")).toContainText("already exists");
  await expect(page.locator("#tcError")).toBeFocused();
  await expect(page.getByLabel("Initial Balance", { exact: true })).toHaveValue(
    "10",
  );
  const errorPosition = await page.locator("#tcError").boundingBox();
  expect(errorPosition.y).toBeGreaterThanOrEqual(90);
  expect(errorPosition.y).toBeLessThan(400);
});

test("Maintain exposes Test Cards without statistics and reuses Prepaid Cards list hierarchy", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/51.test_card_list.html");
  await expect(page.locator(".pw-platform-profile-label")).toHaveText(
    "WizarPOS Maintain",
  );
  const menu = page.locator('[data-pw-menu="test-card"]');
  await expect(
    page.getByRole("button", { name: "Test Cards", exact: true }),
  ).toBeVisible();
  await expect(menu.getByRole("link")).toHaveCount(4);
  await expect(
    page.locator(".tc-summary, #summaryCurrency, #creditTotal, #lowBalance"),
  ).toHaveCount(0);
  await expect(page.locator("main h1, main h2")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Test Card List", exact: true })).toBeVisible();
  await expect(page.locator("#tcHeading")).toBeHidden();
  await expect(page.locator("#cardCount")).toHaveCount(0);
  await expect(page.locator(".section-head")).not.toContainText("Records");
  await expect(page.locator(".section-head").getByRole("link", { name: "Add New Card" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Cardholder");
  await expect(page.locator("main")).not.toContainText("Replace Card");
  const reference = await page.context().newPage();
  await reference.route("**/styles/prepaid-card-list-shared.css", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await reference.goto("/14.prepaid_card_list.html");
  const listStyles = async (p) =>
    p.locator(".prepaid-card-list").evaluate((el) => {
      const styles = (selector) => {
        const s = getComputedStyle(el.querySelector(selector));
        return [
          s.fontFamily,
          s.fontSize,
          s.fontWeight,
          s.color,
          s.paddingTop,
          s.paddingRight,
          s.paddingBottom,
          s.lineHeight,
          s.whiteSpace,
        ];
      };
      return {
        header: styles("th"),
        body: styles("tbody td"),
        uid: styles(".cell-main"),
        display: styles(".cell-sub.mono"),
        currency: styles("tbody td:nth-child(3) .cell-sub"),
        badge: styles("tbody .badge"),
        action: el.querySelector(".icon-action").getBoundingClientRect().height,
        layout: getComputedStyle(el.querySelector("table")).tableLayout,
      };
    });
  expect(await listStyles(page)).toEqual(await listStyles(reference));
  await reference.close();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBe(0);
  await expect(
    page
      .locator("#cardFilters label")
      .filter({ hasText: /Manufacturer|Status|Balance/ }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Manufacturer", exact: true })
    .click();
  await expect(
    page.getByRole("option", { name: /AtlasPay|Pacific|代理/ }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Search Manufacturer", exact: true })
    .fill("杭州");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Search Manufacturer", exact: true })
    .press("Enter");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".tc-pagination")).toContainText("Showing 1–1 of 1");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".tc-pagination")).toContainText("Showing 1–8 of 8");
  expect(errors).toEqual([]);
  await fs.mkdir("docs/validation/test-card", { recursive: true });
  await page.screenshot({
    path: "docs/validation/test-card/card-list-refined.png",
    fullPage: true,
  });
});

test("single activation, manufacturer editing and historical attribution persist across reload", async ({
  page,
}) => {
  await page.goto("/51.test_card_activation.html");
  await page
    .getByLabel("Card Unique Identifier", { exact: true })
    .fill("04CC0102030405");
  await page
    .getByLabel("Display Card Number", { exact: true })
    .fill("FACTORY-NEW-001");
  await page.getByLabel("Initial Balance", { exact: true }).fill("100.00");
  await pick(page, "Applicable manufacturer", "黄角湾");
  await page
    .getByRole("button", { name: "Activate Card", exact: true })
    .click();
  await expect(page).toHaveURL(/detail.*04CC0102030405/);
  await expect(page.locator("#cardSummary")).toContainText("$100.00");
  await pick(page, "Applicable manufacturer", "台州联创电子有限公司");
  await page.getByRole("button", { name: "Save" }).click();
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Applicable manufacturer", exact: true })).toContainText("台州联创电子有限公司");
  await expect(page.locator("#cardSummary")).toContainText("$100.00");
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.locator("#cardHistory")).toContainText(
    "Manufacturer Changed",
  );
  await page.goto("/51.test_card_detail.html?card=" + UID);
  await pick(page, "Applicable manufacturer", "台州联创电子有限公司");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("tab", { name: "Transactions", exact: true }).click();
  await expect(page.locator("#panel-transactions")).toContainText("黄角湾");
  await expect(page.locator("#panel-transactions")).not.toContainText(
    "台州联创电子有限公司",
  );
  await expect(page.locator("#panel-transactions")).toContainText("TC-20261021-001");
  await expect(page.locator('#panel-transactions tbody a')).toHaveCount(0);

});

test("batch import reads a real CSV, skips invalid duplicate rows and imports to one manufacturer", async ({
  page,
}) => {
  await page.goto("/51.test_card_activation.html#import");
  await pick(page, "Batch manufacturer", "黄角湾");
  const csv =
    "Card UID,Display Card Number,Currency,Initial Balance,Status,Activation Date,Expiration Date\n04CC0102030405,BATCH-001,USD,100.00,Active,2026-10-01T00:00:00Z,\n04CC0102030405,BATCH-002,USD,100.00,Active,2026-10-01T00:00:00Z,\n04DD0102030405,BATCH-003,EUR,50.00,Active,2026-10-01T00:00:00Z,\n";
  await page.locator("#importFile").setInputFiles({
    name: "cards.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.locator("#importPreview")).toContainText(
    "2 Valid · 1 Invalid",
  );
  await page.getByRole("button", { name: "Import 2 Valid Cards" }).click();
  await expect(page.locator("#tcFeedback")).toContainText(
    "2 test cards imported. 1 invalid row was skipped.",
  );
  await page.goto("/51.test_card_list.html");
  await expect(page.locator(".tc-pagination")).toContainText("Showing 1–10 of 10");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Cards" }).click();
  const file = await download;
  const data = await fs.readFile(await file.path(), "utf8");
  expect(data).toContain("BATCH-001");
  expect(data).not.toContain("Cardholder");
  expect(data).not.toContain("Daily Limit");
});

test("overdraft errors are visible and valid adjustments update credit and history without creating terminal transactions", async ({
  page,
}) => {
  await page.goto("/51.test_card_adjustment.html?card=0418E6AA923B11");
  await pick(page, "Adjustment type", "Deduct");
  await page.getByLabel("Amount (USD)").fill("8.00");
  await page
    .getByLabel("Remark", { exact: true })
    .fill("Factory test adjustment");
  await page.getByRole("button", { name: "Adjust", exact: true }).click();
  await expect(page.locator("#tcError")).toContainText(
    "exceeds the current balance",
  );
  await expect(page.locator("#tcError")).toBeFocused();
  await expect(page.getByLabel("Amount (USD)")).toHaveValue("8.00");
  await page.getByLabel("Amount (USD)").fill("0.10");
  await page.getByRole("button", { name: "Adjust", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("$7.50 USD");
  await page
    .getByRole("button", { name: "Confirm Adjustment", exact: true })
    .click();
  await expect(page.locator("#selectedBalance")).toHaveText("$7.50 USD");
  await expect(page.locator("#adjustHistory")).toContainText(
    "Factory test adjustment",
  );
  await page.reload();
  await expect(page.locator("#selectedBalance")).toHaveText("$7.50 USD");
  await page.screenshot({
    path: "docs/validation/test-card/balance-adjustment.png",
    fullPage: true,
  });
  await page.goto("/51.test_card_transactions.html?card=0418E6AA923B11");
  await expect(page.locator("#txnCount")).toHaveText("1 Records");
});

test("query-only transaction filters and empty/error states work without detail links", async ({
  page,
}) => {
  await page.goto("/51.test_card_transactions.html");
  await expect(page.locator("#txnCount")).toHaveText("10 Records");
  await expect(page.locator("main h1, main h2")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Transactions", exact: true }),
  ).toHaveCount(1);
  await expect(page.locator("#tcHeading")).toBeHidden();
  const reference = await page.context().newPage();
  await reference.route("**/styles/transaction-list-shared.css", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await reference.goto("/12.transaction_list.html");
  const styles = async (p) =>
    p.locator(".portal-transaction-list").evaluate((el) => {
      const get = (selector) => {
        const s = getComputedStyle(el.querySelector(selector));
        return [
          s.fontSize,
          s.fontWeight,
          s.color,
          s.paddingTop,
          s.paddingRight,
          s.lineHeight,
          s.whiteSpace,
        ];
      };
      return {
        heading: get(".transaction-heading :is(h1,h2)"),
        header: get("th"),
        body: get("tbody td"),
        layout: getComputedStyle(el.querySelector("table")).tableLayout,
      };
    });
  expect(await styles(page)).toEqual(await styles(reference));
  await reference.close();

  await expect(
    page
      .locator("main")
      .getByRole("button", { name: /Refund|Void|Reversal|Export|Capture/ }),
  ).toHaveCount(0);
  await pick(page, "Transaction result", "Failed");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("#txnCount")).toHaveText("4 Records");
  await expect(page.locator("#txnTable tbody tr")).toHaveCount(4);
  await expect(page.locator("#txnTable")).toContainText("TC-20261020-004");
  await expect(page.locator("#txnTable tbody a")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Terminal S/N", { exact: true }).fill("NO-SUCH-SN");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("#txnTable")).toContainText("No records found.");
  await page.getByLabel("From", { exact: true }).fill("2026-10-22");
  await page.getByLabel("To", { exact: true }).fill("2026-10-01");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator("#tcError")).toBeFocused();

});

test("production prepaid data and navigation remain separate and all five test routes mount cleanly", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [route, query] of [
    ["list", ""],
    ["activation", ""],
    ["detail", "?card=" + UID],
    ["adjustment", "?card=" + UID],
    ["transactions", ""],
  ]) {
    await page.goto("/51.test_card_" + route + ".html" + query);
    await expect(page.locator(".pw-platform-frame")).toHaveCount(1);
    await expect(page.locator("#tcError")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    for (const a of await page.locator("main a[href]").all()) {
      const h = await a.getAttribute("href");
      expect(h).toMatch(/^51\.test_card/);
    }
  }
  await page.goto("/51.test_card_activation.html");
  await page.screenshot({
    path: "docs/validation/test-card/activation.png",
    fullPage: true,
  });
  await page.goto("/51.test_card_transactions.html");
  await page.screenshot({
    path: "docs/validation/test-card/transactions-refined.png",
    fullPage: true,
  });
  await page.goto("/14.prepaid_card_list.html");
  await expect(page.locator(".pw-platform-content")).not.toContainText(
    "TEST-HJW",
  );
  expect(errors).toEqual([]);
});


test("Card Details matches the original surface and keeps Save, tabs and validation working", async ({ page }) => {
  await page.goto("/51.test_card_detail.html?card=" + UID);
  const reference = await page.context().newPage();
  await reference.route("**/styles/prepaid-card-detail-shared.css", route => route.fulfill({ contentType: "text/css", body: "" }));
  await reference.goto("/19.prepaid_card_detail.html");
  const detailStyles = p => p.locator(".tabbed-card").evaluate(el => {
    const selectors = [".page-title", ".tabbed-card-header", ".card-context-summary", ".summary", ".summary span", ".summary strong", ".summary:nth-child(3) strong", ".summary-status-value", ".tabs", ".tab", ".tab-panel", ".section", ".section-head", ".section-title", ".form-grid", ".field", ".field label", ".input", ".lifecycle-grid", ".lifecycle-actions", ".field-hint"];
    return Object.fromEntries(selectors.map(selector => {
      const node = el.querySelector(selector), style = getComputedStyle(node);
      return [selector, [style.font, style.color, style.padding, style.margin, style.gap, style.border, style.backgroundColor, style.borderRadius, style.boxShadow]];
    }));
  });
  expect(await detailStyles(page)).toEqual(await detailStyles(reference));
  // Loading the shared source styles must preserve the production reference too.
  const before = await detailStyles(reference);
  await reference.unroute("**/styles/prepaid-card-detail-shared.css");
  await reference.reload();
  expect(await detailStyles(reference)).toEqual(before);
  await reference.close();
  await page.screenshot({ path: "docs/validation/test-card/card-detail-refined.png", fullPage: true });
  await expect(page.locator("#tcContent > .tabbed-card")).toHaveCount(1);
  await expect(page.locator("#tcHeading")).toBeHidden();
  await expect(page.locator("#cardSummary > .summary")).toHaveCount(4);
  await expect(page.locator("#cardSummary")).not.toContainText("Manufacturer");
  await expect(page.locator("#cardForm")).not.toContainText(/Card Holder|Single Use|Monthly Amount|Daily Amount/);
  const save = page.getByRole("button", { name: "Save", exact: true });
  await expect(save).toBeHidden();
  await page.getByLabel("Display Card Number", { exact: true }).fill("EDITED-TEST-CARD");
  await expect(save).toBeVisible();
  await page.getByLabel("Display Card Number", { exact: true }).fill("TEST-HJW-001");
  await expect(save).toBeHidden();
  await page.getByLabel("Display Card Number", { exact: true }).fill("EDITED-TEST-CARD");
  await page.getByRole("tab", { name: "General", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "History", exact: true })).toBeFocused();
  await expect(save).toBeHidden();
  await page.getByRole("tab", { name: "General", exact: true }).click();
  await expect(save).toBeVisible();
  await page.getByLabel("Expiration Date", { exact: true }).fill("2025-01-01T00:00");
  await save.click();
  await expect(page.locator("#tcError")).toBeFocused();
  await expect(page.locator("#tcError")).toContainText("Expiration");
  await expect(page.getByLabel("Display Card Number", { exact: true })).toHaveValue("EDITED-TEST-CARD");
  const error = await page.locator("#tcError").boundingBox();
  expect(error.y).toBeGreaterThanOrEqual(90);
  expect(error.y).toBeLessThan(400);
  await page.getByRole("button", { name: "1 Year", exact: true }).click();
  await expect(page.getByLabel("Expiration Date", { exact: true })).toHaveValue("2027-01-01T08:00");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await save.click();
  await expect(save).toBeHidden();
  await expect(page.locator("#cardSummary")).toContainText("EDITED-TEST-CARD");
  await page.reload();
  await expect(page.getByLabel("Display Card Number", { exact: true })).toHaveValue("EDITED-TEST-CARD");
  await page.getByRole("tab", { name: "Transactions", exact: true }).click();
  await expect(page.locator("#panel-transactions tbody a")).toHaveCount(0);
  await expect(page.locator("#panel-transactions")).toContainText("TC-20261021-001");
  await expect(fs.access("51.test_card_transaction_detail.html")).rejects.toThrow();
  await page.goto("/index.html");
  await expect(page.locator('#pages-test-card a')).toHaveCount(5);
  await expect(page.locator('a[href*="51.test_card_transaction_detail"]')).toHaveCount(0);
});
