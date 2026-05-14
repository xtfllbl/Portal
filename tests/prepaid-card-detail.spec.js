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
  await expect(page.locator("[data-merchant-selected-count]")).toHaveText("5 selected / 5 available");
  await expect(page.locator("[data-merchant-page-summary]")).toHaveText("Showing 1-3 of 5 filtered · 5 selected across all pages");

  await page.locator('[data-merchant-row][data-scope-level="sn"]:visible [data-merchant-checkbox]').first().uncheck();
  await expect(page.locator("[data-merchant-selected-count]")).toHaveText("4 selected / 5 available");

  await page.locator("[data-merchant-page-next]").click();
  await expect(page.locator("[data-merchant-page-summary]")).toHaveText("Showing 4-5 of 5 filtered · 4 selected across all pages");
  await expect(page.locator("[data-merchant-page-indicator]")).toHaveText("Page 2 of 2");

  await page.locator("[data-merchant-selection-filter]").selectOption("selected");
  await expect(page.locator("[data-merchant-page-summary]")).toHaveText("Showing 1-3 of 4 filtered · 4 selected across all pages");
  await expect(page.locator("[data-merchant-selected-count]")).toHaveText("4 selected / 5 available");
});
