const { test, expect } = require('@playwright/test');
const url = '/41.billing_setup.html';
test('recurring draft survives reload and applies once with correct totals and date', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('link', { name: 'Billing Setup', exact: true })).toBeVisible();
  await page.locator('#recurring').check();
  await page.locator('#startDate').fill('2026-09-08');
  await page.locator('#amount').fill('12');
  await page.locator('#cycle').selectOption('24');
  await expect(page.locator('#total')).toHaveText('$288.00');
  await page.locator('#notes').fill('Monthly service');
  await page.locator('#saveDraft').click();
  await page.reload();
  await page.getByRole('button', { name: 'Edit draft for Tom shop' }).click();
  await expect(page.locator('#notes')).toHaveValue('Monthly service');
  await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
  const row = page.locator('#billingRows tr').first();
  await expect(row).toContainText('Active');
  await expect(row).toContainText('$288.00');
  await expect(row).toContainText('2028-09-08');
  await expect(page.getByRole('button', { name: 'Edit draft for Tom shop' })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#billingRows tr').first()).toContainText('2028-09-08');
});
test('dropdowns, validation, one-time currency, filters and pagination', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#billType option')).toHaveText(['eSIM Billing', 'General Billing']);
  await expect(page.locator('#currency option')).toHaveCount(3);
  await expect(page.locator('#cycle option')).toHaveCount(5);
  await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
  await expect(page.locator('#amount')).toBeFocused();
  await page.locator('#currency').selectOption('EUR');
  await page.locator('#amount').fill('15');
  await expect(page.locator('#total')).toHaveText('€15.00');
  await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
  await expect(page.locator('#billingRows tr').first()).toContainText('Pending');
  await expect(page.locator('#billingRows tr').first()).toContainText('€15.00');
  await page.locator('#filterStatus').selectOption('Draft');
  await page.getByRole('button', { name: 'Search billing records' }).click();
  await expect(page.locator('#billingRows')).toContainText('No billing records found.');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#pageSummary')).toHaveText('2 / 2 (24)');
});
test('uses existing merchant identity without inserting example records', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('paywizard-platform-merchants-v1', JSON.stringify([{ merchantId: 'M-123', merchantName: 'Existing Shop' }])));
  await page.goto(url);
  await expect(page.locator('#merchant')).toHaveValue('M-123');
  await expect(page.locator('#billingRows')).toContainText('No billing records found.');
  await page.locator('#amount').fill('10');
  await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
  await expect(page.locator('#billingRows')).toContainText('Existing Shop');
  await expect(page.locator('#billingRows')).toContainText('M-123');
});
for (const width of [1440, 390]) {
  test(`layout and equal button heights at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1500 : 1000 });
    await page.goto(url);
    await page.locator('#recurring').check();
    await page.locator('#startDate').fill('2026-09-08');
    await page.locator('#amount').fill('12');
    const heights = await page.locator('.billing-actions button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
    expect(new Set(heights).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#amount')).toBeVisible();
    await page.locator('#amount').blur();
    await page.screenshot({ path: `artifacts/billing-setup-${width}.png`, fullPage: true });
  });
}
