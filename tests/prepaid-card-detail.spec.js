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
