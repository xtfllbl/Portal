const { test, expect } = require("@playwright/test");

test.describe("Billing Attention and Notifications Integration", () => {
  test("Needs Attention tab filters bills and elevates Retry Payment button", async ({ page }) => {
    await page.goto("/44.billing_overview.html");

    const tabAll = page.locator("#tabAll");
    const tabAttention = page.locator("#tabAttention");
    await expect(tabAll).toBeVisible();
    await expect(tabAttention).toBeVisible();
    await expect(tabAll).toHaveClass(/active/);

    const countAttention = page.locator("#countAttention");
    await expect(countAttention).not.toHaveText("0");

    const attentionCountText = await countAttention.textContent();
    expect(Number(attentionCountText)).toBeGreaterThan(0);

    await tabAttention.click();
    await expect(tabAttention).toHaveClass(/active/);
    await expect(tabAll).not.toHaveClass(/active/);
    await expect(page).toHaveURL(/tab=attention/);

    const rows = page.locator("#overviewRows tr");
    expect(await rows.count()).toBeGreaterThan(0);

    const retryButtons = page.locator("#overviewRows button[data-retry]");
    const renewButtons = page.locator("#overviewRows button[data-renew]");
    expect((await retryButtons.count()) > 0 || (await renewButtons.count()) > 0).toBe(true);

    if ((await retryButtons.count()) > 0) {
      const firstRetry = retryButtons.first();
      await expect(firstRetry).toHaveText("Retry Payment");
      await firstRetry.click();
      await expect(page.locator(".billing-retry-dialog")).toBeVisible();
      await page.locator(".billing-retry-dialog [data-close]").first().click();
      await expect(page.locator(".billing-retry-dialog")).toBeHidden();
    }
  });

  test("Notification center displays Billing Alert and navigates to Attention tab", async ({ page }) => {
    await page.goto("/40.notifications.html");

    const alertsTab = page.locator(".notification-tab[data-category=\"alerts\"]");
    await alertsTab.click();
    await expect(alertsTab).toHaveClass(/active/);

    const billingAlertRows = page.locator("tr:has-text(\"Billing Alert\")");
    await expect(billingAlertRows.first()).toBeVisible();

    const detailBtn = billingAlertRows.first().locator(".detail-btn");
    await detailBtn.click();

    await expect(page).toHaveURL(/44\.billing_overview\.html\?tab=attention/);
    await expect(page.locator("#tabAttention")).toHaveClass(/active/);

    const highlightedRow = page.locator("tr.row-highlight");
    await expect(highlightedRow).toBeVisible();
  });
});
