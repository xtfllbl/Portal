const { test, expect } = require("@playwright/test");

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
