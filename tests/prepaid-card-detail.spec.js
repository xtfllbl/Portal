const { test, expect } = require("@playwright/test");

test("card list stored value and low balance currency selectors stay linked", async ({ page }) => {
  await page.goto("/14.prepaid_card_list.html");

  await expect(page.locator("[data-stored-value-summary] + [data-low-balance-summary]")).toHaveCount(1);
  await expect(page.locator("[data-stored-value-currency]")).toHaveValue("USD");
  await expect(page.locator("[data-low-balance-currency]")).toHaveValue("USD");
  await expect(page.locator("[data-stored-value-total]")).toHaveText("$92,480.75 USD");
  await expect(page.locator("[data-stored-value-note]")).toHaveText("Stored value for 1,164 USD prepaid cards");
  await expect(page.locator("[data-low-balance-total]")).toHaveText("84");
  await expect(page.locator("[data-low-balance-note]")).toHaveText("USD cards below $10.00 USD");

  await page.locator("[data-stored-value-currency]").selectOption("EUR");
  await expect(page.locator("[data-low-balance-currency]")).toHaveValue("EUR");
  await expect(page.locator("[data-stored-value-total]")).toHaveText("€18,360.40 EUR");
  await expect(page.locator("[data-stored-value-note]")).toHaveText("Stored value for 54 EUR prepaid cards");
  await expect(page.locator("[data-low-balance-total]")).toHaveText("11");
  await expect(page.locator("[data-low-balance-note]")).toHaveText("EUR cards below €10.00 EUR");

  await page.locator("[data-low-balance-currency]").selectOption("CAD");
  await expect(page.locator("[data-stored-value-currency]")).toHaveValue("CAD");
  await expect(page.locator("[data-stored-value-total]")).toHaveText("$7,840.10 CAD");
  await expect(page.locator("[data-stored-value-note]")).toHaveText("Stored value for 30 CAD prepaid cards");
  await expect(page.locator("[data-low-balance-total]")).toHaveText("7");
  await expect(page.locator("[data-low-balance-note]")).toHaveText("CAD cards below $10.00 CAD");
});

test("card detail status summary updates after saving status changes", async ({ page }) => {
  await page.goto("/19.prepaid_card_detail.html");

  const statusSummary = page.locator("[data-detail-status]");
  await expect(statusSummary).toHaveText("Active");

  await page.locator("#status").selectOption("Suspended");
  await expect(statusSummary).toHaveText("Active");

  const saveButton = page.locator("[data-card-detail-save]");
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  await expect(statusSummary).toHaveText("Suspended");
  await expect(statusSummary).toHaveClass(/status-red/);
  await expect(saveButton).toBeHidden();
});

test("SN scope keeps selection count across pages and can show selected only", async ({ page }) => {
  await page.goto("/19.prepaid_card_detail.html");

  await page.locator('[data-merchant-scope-mode][value="sn"]').check();
  await expect(page.locator("[data-merchant-selected-count]")).toHaveText("50 selected / 50 available");
  await expect(page.locator("[data-merchant-page-summary]")).toHaveText("Showing 1-10 of 50 filtered · 50 selected across all pages");

  await page.locator('[data-merchant-row][data-scope-level="sn"]:visible [data-merchant-checkbox]').first().uncheck();
  await expect(page.locator("[data-merchant-selected-count]")).toHaveText("49 selected / 50 available");

  await page.locator("[data-merchant-page-next]").click();
  await expect(page.locator("[data-merchant-page-summary]")).toHaveText("Showing 11-20 of 50 filtered · 49 selected across all pages");
  await expect(page.locator("[data-merchant-page-indicator]")).toHaveText("Page 2 of 5");

  await page.locator("[data-merchant-selection-filter]").selectOption("selected");
  await expect(page.locator("[data-merchant-page-summary]")).toHaveText("Showing 1-10 of 49 filtered · 49 selected across all pages");
  await expect(page.locator("[data-merchant-selected-count]")).toHaveText("49 selected / 50 available");
});

test("SN scope save opens confirmation with selected terminals", async ({ page }) => {
  await page.goto("/19.prepaid_card_detail.html");

  await page.locator('[data-merchant-scope-mode][value="sn"]').check();
  await expect(page.locator("[data-merchant-selection-summary]")).toHaveText("50 selected SN across all pages");

  await page.locator("[data-card-detail-save]").click();
  const modal = page.locator("#scopeConfirm");
  await expect(modal).toHaveClass(/open/);
  await expect(modal.locator("[data-scope-confirm-summary]")).toContainText("SN Level, 50 selected / 50 available");
  await expect(modal.locator("[data-scope-confirm-rows] tr")).toHaveCount(50);
});

test("custom merchant scope save opens confirmation with selected merchants", async ({ page }) => {
  await page.goto("/19.prepaid_card_detail.html");

  await page.locator('[data-merchant-scope-mode][value="merchant"]').check();
  await page.locator('[data-merchant-selection-mode][value="custom"]').check();
  await expect(page.locator("[data-merchant-selection-summary]")).toHaveText("5 selected merchants across all pages");

  await page.locator("[data-card-detail-save]").click();
  const modal = page.locator("#scopeConfirm");
  await expect(modal).toHaveClass(/open/);
  await expect(modal.locator("[data-scope-confirm-summary]")).toContainText("Merchant Level, 5 selected / 5 available");
  await expect(modal.locator("[data-scope-confirm-rows] tr")).toHaveCount(5);
});

test("prepaid controls use the shared compact geometry without changing Card List actions", async ({ page }) => {
  await page.goto("/14.prepaid_card_list.html");

  await expect(page.getByRole("link", { name: "Add New Card" })).toHaveCSS("border-radius", "8px");
  await expect(page.getByRole("link", { name: "Add New Card" })).toHaveCSS("background-color", "rgb(15, 15, 16)");
  await expect(page.locator(".summary").first()).toHaveCSS("border-radius", "8px");

  const firstActions = page.locator("tbody tr").first().locator(".icon-actions");
  await expect(firstActions.locator(".icon-action")).toHaveCount(3);
  await expect(firstActions.locator(".icon-action").first()).toHaveCSS("width", "34px");
  await expect(firstActions.locator(".icon-action").first()).toHaveCSS("height", "34px");
  await expect(firstActions.locator(".icon-action").first()).toHaveCSS("border-radius", "8px");
  await expect(firstActions.getByRole("link", { name: /View transactions/ })).toBeVisible();
  await expect(firstActions.getByRole("link", { name: /Adjust balance/ })).toBeVisible();
  await expect(firstActions.getByText("Replace Card", { exact: true })).toBeHidden();
});

test("prepaid tabs use the APP Management underline pattern with ARIA keyboard navigation", async ({ page }) => {
  for (const [route, tabName] of [
    ["/15.prepaid_card_activation.html", "Single Card"],
    ["/17.prepaid_loss_replacement.html", "Replace Card"],
    ["/19.prepaid_card_detail.html", "General"]
  ]) {
    await page.goto(route);
    const tabs = page.getByRole("tablist");
    await expect(page.locator(".content-inner > .tabbed-card")).toHaveCSS("border-radius", "8px");
    await expect(tabs).toHaveCSS("border-radius", "0px");
    await expect(tabs).toHaveCSS("border-bottom-width", "1px");
    await expect(tabs).toHaveCSS("display", "flex");
    const activeTab = page.getByRole("tab", { name: tabName });
    await expect(activeTab).toHaveAttribute("aria-selected", "true");
    await expect(activeTab).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(activeTab).toHaveCSS("border-bottom-width", "2px");
  }

  await page.goto("/15.prepaid_card_activation.html");
  const singleTab = page.getByRole("tab", { name: "Single Card" });
  const batchTab = page.getByRole("tab", { name: "Batch Import" });
  await singleTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(batchTab).toBeFocused();
  await expect(batchTab).toHaveAttribute("aria-selected", "true");
  await expect(singleTab).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#batchImport")).toBeVisible();
  await expect(page.locator("#singleActivation")).toBeHidden();

  await page.goto("/19.prepaid_card_detail.html");
  const contextSummary = page.locator(".card-context-summary");
  await expect(contextSummary).toBeVisible();
  await page.getByRole("tab", { name: "History" }).click();
  await expect(contextSummary).toBeVisible();
  await expect(page.locator("#balanceHistoryTab")).toBeVisible();
});

test("Card List action deep links select the intended prepaid card", async ({ page }) => {
  const cardUid = "0418E6AA923B11";

  await page.goto(`/12.transaction_list.html?cardUid=${cardUid}`);
  await expect(page.locator("#filtersPanel")).toHaveClass(/show/);
  await expect(page.locator("#fCardPan")).toHaveValue(cardUid);
  const transactionRows = page.locator("#bodyRows .transaction-row");
  expect(await transactionRows.count()).toBeGreaterThan(0);
  expect(await page.locator("#bodyRows .account-main").allTextContents()).toEqual(
    Array(await transactionRows.count()).fill(cardUid)
  );

  await page.goto(`/16.prepaid_credit_adjustment.html?cardUid=${cardUid}`);
  await expect(page.locator("#cardLookup")).toHaveValue(cardUid);
  await expect(page.locator("#readonlyUid")).toHaveValue(cardUid);
  await expect(page.locator("[data-selected-card-holder]")).toHaveText("Marcus Hill");
  await expect(page.locator("[data-balance-display]")).toContainText("7.60");

  await page.goto(`/17.prepaid_loss_replacement.html?cardUid=${cardUid}`);
  await expect(page.locator("#lostLookup")).toHaveValue(cardUid);
  await expect(page.locator("#oldUid")).toHaveValue(cardUid);
  await expect(page.locator("#oldDisplay")).toHaveValue("EMP-CARD-002106");
  await expect(page.locator("[data-selected-card-holder]")).toHaveText("Marcus Hill");
});

test("prepaid tabs and actions stay usable at a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/15.prepaid_card_activation.html");

  const tabBounds = await page.getByRole("tablist").boundingBox();
  expect(tabBounds).not.toBeNull();
  expect(tabBounds.width).toBeLessThanOrEqual(390);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.goto("/14.prepaid_card_list.html");
  await page.locator("tbody tr").first().locator("summary.icon-action").click();
  const replacementAction = page.locator("tbody tr").first().getByText("Replace Card", { exact: true });
  await expect(replacementAction).toBeVisible();
  const actionBounds = await replacementAction.boundingBox();
  expect(actionBounds).not.toBeNull();
  expect(actionBounds.x).toBeGreaterThanOrEqual(0);
  expect(actionBounds.x + actionBounds.width).toBeLessThanOrEqual(390);
});
