const { test, expect } = require('@playwright/test');
const token = 'a'.repeat(48);
async function fixture(recurring, state = 'initial') {
  const { makeBill, publicView, checkout } = await import('../server/billing-engine.mjs');
  const now = new Date(state === 'overdue' ? '2026-12-20T12:00:00Z' : '2026-09-07T12:00:00Z');
  const bill = makeBill({ id: 'checkout-test', merchantId: 'test-merchant', merchantName: 'Test Merchant', currency: 'EUR', amount: 200, recurring, cycle: 24, start: '2026-09-17', expiry: '2099-10-07', status: 'Active', invoice: 'test-invoice' }, now);
  if (state === 'paid') checkout(bill, { requestId: 'test-request-123456', acceptedTerms: true, recurringConsent: recurring, email: 'test@example.com', last4: '4242', brand: 'Visa' }, now);
  return publicView(bill, now);
}
async function open(page, bill) {
  await page.goto('about:blank');
  await page.route('**/api/billing/public/**', route => route.fulfill({ json: bill }));
  await page.goto('/43.billing_payment_link.html#' + token);
  await expect(page.locator('#billInformation')).toContainText('Test Merchant');
}
for (const width of [1440, 390]) {
  test(`public checkout clean one-time and recurring presentation at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await open(page, await fixture(false));
    await expect(page.locator('.bill-summary img')).toHaveCount(1);
    await expect(page.locator('.sandbox-label, .checkout-logo')).toHaveCount(0);
    await expect(page.locator('#billInformation')).not.toContainText('Paid installments');
    await expect(page.locator('#billInformation')).not.toContainText('Next payment');
    await expect(page.locator('#recurringAuthorization')).toBeHidden();
    await expect(page.locator('#recurringConsent')).toBeDisabled();
    await expect(page.locator('#submitCard')).toHaveText('Pay €200.00');
    await page.screenshot({ path: `artifacts/checkout-one-time-${width}.png`, fullPage: true });
    await page.unroute('**/api/billing/public/**');
    await open(page, await fixture(true));
    await expect(page.locator('#chargeSummary')).toContainText('Then €200.00 monthly from Oct 17, 2026.');
    await expect(page.locator('#chargeSummary')).toContainText('24 payments in total · €4,800.00 · No automatic renewal.');
    await expect(page.locator('#recurringConsentText')).toHaveText('I authorize my card to be saved and charged according to this payment schedule.');
    await expect(page.locator('#recurringConsent')).not.toBeChecked();
    await expect(page.locator('#recurringConsent')).toHaveAttribute('required', '');
    await expect(page.locator('#submitCard')).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/checkout-recurring-${width}.png`, fullPage: true });
  });
}
test('one-time success contains receipt without installment wording', async ({ page }) => {
  await open(page, await fixture(false, 'paid'));
  await expect(page.locator('#paymentResult')).toContainText('Payment amount');
  await expect(page.locator('#paymentResult')).toContainText('Succeeded');
  await expect(page.locator('#paymentResult')).toContainText('Payment ID');
  await expect(page.locator('#paymentResult')).not.toContainText(/installment|Next|No further charges/i);
});
test('overdue checkout lists each charge and authorized contract shows remaining schedule', async ({ page }) => {
  await open(page, await fixture(true, 'overdue'));
  for (let n = 1; n <= 4; n++) await expect(page.locator('#chargeSummary')).toContainText(`Installment ${n} · €200.00`);
  await expect(page.locator('#submitCard')).toHaveText('Pay 4 installments');
  await expect(page.locator('#chargeSummary')).toContainText('Charged separately, oldest first.');
  await page.unroute('**/api/billing/public/**');
  await open(page, await fixture(true, 'paid'));
  await expect(page.locator('#cardForm')).toBeHidden();
  await expect(page.locator('#paymentResult')).toContainText('1 of 24 installments paid');
  await expect(page.locator('#paymentResult')).toContainText('Oct 17, 2026');
});

test('completed contract has no future charge', async ({ page }) => {
  const bill = await fixture(true, 'paid');
  bill.status = 'Paid'; bill.paidInstallments = 24; bill.nextPaymentDate = null; bill.nextScheduledPaymentDate = null;
  await open(page, bill);
  await expect(page.locator('#paymentResult')).toContainText('24 of 24 installments paid.');
  await expect(page.locator('#paymentResult')).toContainText('No further charges.');
  await expect(page.locator('#cardForm')).toBeHidden();
});
for (const width of [1440, 390]) {
  test(`portal uses the same payment summary and equal action heights at ${width}`, async ({ page }) => {
    const bill = await fixture(true);
    await page.setViewportSize({ width, height: 960 });
    await page.route('**/api/billing/**', route => route.fulfill({ json: { records: [bill], publicOrigin: 'http://localhost' } }));
    await page.goto('/42.billing_payments.html?merchantId=test-merchant');
    await page.locator('#paymentMerchant').selectOption('test-merchant');
    await page.getByRole('button', { name: 'Pay Now' }).click();
    await expect(page.locator('#cardDialog')).toBeVisible();
    await expect(page.locator('#chargeSummary')).toContainText('Then €200.00 monthly from Oct 17, 2026.');
    await expect(page.locator('#recurringConsentText')).toHaveText('I authorize my card to be saved and charged according to this payment schedule.');
    const heights = await page.locator('#closeCard, #submitCard').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
    expect(new Set(heights).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/checkout-portal-${width}.png`, fullPage: true });
  });
}
