const { test, expect } = require('@playwright/test');
const url = '/41.billing_setup.html';
const { DatabaseSync } = require('node:sqlite');
test.beforeEach(() => {
  const file = process.env.BILLING_DB_PATH;
  if (!file?.includes('paywizard-billing-e2e-')) throw new Error('An isolated billing test database is required.');
  const db = new DatabaseSync(file); db.exec('DELETE FROM bills'); db.close();
});
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
  await expect(page.locator('#billingMessage')).toHaveText('Draft saved.');
  await page.reload();
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await page.getByRole('button', { name: 'Edit draft for Tom shop' }).click();
  await expect(page.locator('#notes')).toHaveValue('Monthly service');
  await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
  const row = page.locator('#billingRows tr').first();
  await expect(row).toContainText('Active');
  await expect(row).toContainText('$288.00');
  await expect(row).toContainText('2026-09-08');
  await expect(page.getByRole('button', { name: 'Edit draft for Tom shop' })).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await expect(page.locator('#billingRows tr').first()).toContainText('2026-09-08');
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
  await expect(page.locator('#billingRows tr').first().locator('td').nth(8)).toHaveText('—');
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
    const heights = await page.locator('#billingForm .billing-actions button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
    expect(new Set(heights).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#amount')).toBeVisible();
    await page.locator('#amount').blur();
    await page.screenshot({ path: `artifacts/billing-setup-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
    await expect(page.locator('#recordsPanel')).toBeVisible();
    await expect(page.locator('#billingRows tr').first()).toHaveClass('billing-new-record');
    await expect(page.locator('#billingRows tr').first()).toContainText('$288.00');
    const filterButtons = await page.locator('#filterForm button').evaluateAll(nodes => nodes.map(n => ({ height: n.getBoundingClientRect().height, top: n.getBoundingClientRect().top })));
    expect(new Set(filterButtons.map(b => b.height)).size).toBe(1);
    expect(new Set(filterButtons.map(b => b.top)).size).toBe(1);
    await page.screenshot({ path: `artifacts/billing-records-${width}.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.billing-more').first().click();
    await page.getByRole('button', { name: 'Send Link', exact: true }).click();
    const dialogHeights = await page.locator('#sendLinkDialog button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
    expect(dialogHeights).toEqual([40, 40]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  });
}

test('unavailable billing service preserves form, permits reset and reconnects', async ({ page }) => {
  await page.route('**/api/billing/**', route => route.request().url().endsWith('/config') ? route.fulfill({json:{mode:'shared',configured:true}}) : route.fulfill({ status: 503, contentType: 'text/html', body: 'Not available' }));
  await page.goto(url);
  await expect(page.locator('#billingConnection')).toBeVisible();
  await expect(page.locator('#retryBilling')).toBeEnabled();
  await expect(page.locator('#resetForm')).toBeEnabled();
  await expect(page.locator('#saveDraft')).toBeDisabled();
  await page.locator('#notes').fill('Keep my form');
  await page.locator('#amount').fill('25');
  await page.waitForTimeout(5100);
  await expect(page.locator('#billingConnectionText')).toContainText('Your form has been kept');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#retryBilling')).toBeVisible();
  await page.unroute('**/api/billing/**');
  await page.locator('#retryBilling').click();
  await expect(page.locator('#billingConnection')).toBeHidden();
  await expect(page.locator('#saveDraft')).toBeEnabled();
  await expect(page.locator('#amount')).toHaveValue('25');
  await expect(page.locator('#notes')).toHaveValue('Keep my form');
  await page.locator('#saveDraft').click();
  await expect(page.locator('#billingRows tr').first()).toContainText('Draft');
  await page.locator('#resetForm').click();
  await expect(page.locator('#amount')).toHaveValue('');
});

test('tabs preserve form and filters; keyboard navigation selects panels', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#total')).toHaveText('Enter amount');
  await expect(page.locator('#recordsPanel')).toBeHidden();
  await page.locator('#notes').fill('Unsubmitted work');
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await expect(page.locator('#createPanel')).toBeHidden();
  await page.locator('#filterStatus').selectOption('Paid');
  await page.getByRole('button', { name: 'Search billing records' }).click();
  await page.getByRole('tab', { name: 'Billing Records' }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Create Billing' })).toBeFocused();
  await expect(page.locator('#notes')).toHaveValue('Unsubmitted work');
  await page.getByRole('tab', { name: 'Create Billing' }).press('End');
  await expect(page.locator('#filterStatus')).toHaveValue('Paid');
  await expect(page.locator('#billingRows tr').first()).toContainText('Paid');
});

test('recurring preview shows monthly amount, contract total and incomplete values', async ({ page }) => {
  await page.goto(url);
  await page.locator('#recurring').check();
  await expect(page.locator('#previewDetails')).toContainText('Select date');
  await expect(page.locator('#total')).toHaveText('Enter amount');
  await page.locator('#currency').selectOption('EUR');
  await page.locator('#amount').fill('200');
  await page.locator('#cycle').selectOption('3');
  await page.locator('#startDate').fill('2028-01-31');
  await expect(page.locator('#total')).toHaveText('€600.00');
  await expect(page.locator('#previewDetails')).toContainText('€200.00');
  await expect(page.locator('#previewDetails')).toContainText('3 monthly installments');
  await expect(page.locator('#previewDetails')).toContainText('2028-01-31');
  await page.locator('#amount').fill('');
  await expect(page.locator('#total')).toHaveText('Enter amount');
  await page.locator('#amount').fill('12');
  await page.locator('#recurring').uncheck();
  await expect(page.locator('#total')).toHaveText('€12.00');
  await expect(page.locator('#previewDetails')).not.toContainText('Monthly amount');
});

test('eSIM data survives draft reload and is visible in saved billing details', async ({ page }) => {
  await page.goto(url);
  await page.locator('#billType').selectOption('eSIM Billing');
  await page.locator('#includedData').fill('1024');
  await page.locator('#amount').fill('12');
  await expect(page.locator('#previewDetails')).toContainText('1,024 MB');
  await page.locator('#billType').selectOption('General Billing');
  await expect(page.locator('#includedData')).toBeHidden();
  await expect(page.locator('#previewDetails')).not.toContainText('Included data');
  await page.locator('#billType').selectOption('eSIM Billing');
  await page.locator('#saveDraft').click();
  await expect(page.locator('#billingMessage')).toHaveText('Draft saved.');
  await expect(page.locator('#createPanel')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await page.getByRole('button', { name: 'Edit draft for Tom shop' }).click();
  await expect(page.locator('#includedData')).toHaveValue('1024');
  await page.locator('#recurring').check();
  await expect(page.locator('#cycle')).toHaveValue('24');
  await expect(page.locator('#total')).toHaveText('$288.00');
  await page.locator('#recurring').uncheck();
  await page.getByRole('button', { name: 'Apply to Merchant Account' }).click();
  await expect(page.getByRole('tab', { name: 'Billing Records' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#billingRows tr').first()).toHaveClass('billing-new-record');
  await page.reload();
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await page.locator('.billing-more').first().click();
  await page.getByRole('button', { name: 'View billing details', exact: true }).click();
  await expect(page.locator('#savedBillingDetails')).toContainText('1,024 MB');
  await page.locator('#closeBillingDetails').click();
  await expect(page.locator('.billing-more').first()).toBeFocused();
});

test('standalone draft preserves assignment and switching back restores merchant selection', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-assignment=standalone]').click();
  await expect(page.locator('#merchant')).toBeHidden();
  await expect(page.locator('#merchant')).toBeDisabled();
  await page.locator('#notes').fill('External service');
  await page.locator('#saveDraft').click();
  await expect(page.locator('#billingMessage')).toHaveText('Draft saved.');
  await page.reload();
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await page.getByRole('button', { name: 'Edit standalone draft' }).click();
  await expect(page.locator('#billingAssignment')).toHaveValue('standalone');
  await expect(page.locator('#notes')).toHaveValue('External service');
  await expect(page.locator('#merchant')).toBeHidden();
  await expect(page.locator('#previewDetails')).not.toContainText('Merchant');
  await page.locator('[data-assignment=merchant]').click();
  await expect(page.locator('#merchant')).toHaveValue('1000000006');
  await expect(page.locator('#merchant')).toBeEnabled();
  await expect(page.locator('#applyBilling')).toHaveText('Apply to Merchant Account');
  await page.locator('#amount').fill('20');
  await page.locator('#saveDraft').click();
  await expect(page.locator('#billingMessage')).toHaveText('Draft saved.');
  await page.reload();
  await page.getByRole('tab', { name: 'Billing Records' }).click();
  await expect(page.getByRole('button', { name: 'Edit standalone draft' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit draft for Tom shop' }).click();
  await expect(page.locator('#billingAssignment')).toHaveValue('merchant');
});

for (const width of [1440, 390]) {
  test('standalone create, external payment and merchant exclusion at ' + width + 'px', async ({ page, browser }) => {
    await page.setViewportSize({width, height: 1000});
    await page.goto(url);
    const originalMerchants = await page.locator('#merchant option').allTextContents();
    for (const recurring of [false, true]) {
      await page.getByRole('tab', {name:'Create Billing'}).click();
      await page.locator('[data-assignment=standalone]').click();
      await page.locator('#billType').selectOption('eSIM Billing');
      await page.locator('#includedData').fill('1024');
      await page.locator('#amount').fill('12');
      await page.locator('#expiry').fill('2099-12-31');
      await page.locator('#notes').fill(recurring ? 'External monthly service' : 'External one-time service');
      if (recurring) {
        await page.locator('#recurring').check();
        await page.locator('#startDate').fill('2099-01-31');
        await page.locator('#cycle').selectOption('3');
      }
      await expect(page.locator('#merchant')).toBeHidden();
      await expect(page.locator('#previewDetails')).not.toContainText('Merchant');
      await expect(page.locator('#previewDetails')).toContainText('1,024 MB');
      await expect(page.locator('#total')).toHaveText(recurring ? '$36.00' : '$12.00');
      const heights = await page.locator('#billingForm .billing-actions button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
      expect(new Set(heights).size).toBe(1);
      expect(heights[0]).toBe(40);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({path: 'artifacts/standalone-' + (recurring ? 'monthly-' : 'one-time-') + width + '.png', fullPage:true});
      await page.getByRole('button', {name:'Create Payment Link', exact:true}).click();
      await expect(page.locator('#recordsPanel')).toBeVisible();
      await expect(page.locator('#filterAssignment')).toHaveValue('standalone');
      await expect(page.locator('#filterMerchant')).toBeHidden();
      const row = page.locator('#billingRows tr').first();
      await expect(row).toHaveClass('billing-new-record');
      await expect(row.locator('td').nth(0)).toHaveText('—');
      await expect(row.locator('td').nth(1)).toHaveText('—');
      await expect(row.locator('td').nth(3)).toHaveText(recurring ? 'Fixed-term monthly' : 'One-time');
      const invoice = await row.locator('td').nth(2).textContent();
      const records = (await (await page.request.get('/api/billing/records')).json()).records;
      const record = records.find(r => r.invoice === invoice);
      expect(record.merchantId).toBeNull();
      expect(record.merchantName).toBe('');
      await page.locator('.billing-more').first().click();
      await page.getByRole('button', {name:'Send Link', exact:true}).click();
      await expect(page.locator('#linkRecipient')).toHaveValue('');
      const sendHeights = await page.locator('#sendLinkDialog button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
      expect(sendHeights).toEqual([40,40]);
      await page.locator('#linkRecipient').fill('external@example.com');
      await page.locator('#confirmSendLink').click();
      await expect(page.locator('#sendLinkDialog')).toBeHidden();

      const external = await browser.newContext({viewport:{width,height:1000}});
      try {
        const checkout = await external.newPage();
        const link = new URL('/43.billing_payment_link.html#' + record.linkToken, page.url()).href;
        await checkout.goto(link);
        await expect(checkout.locator('#billInformation')).toContainText(invoice);
        await expect(checkout.locator('#billInformation .bill-details dt')).not.toContainText(['Merchant']);
        await expect(checkout.locator('#billInformation')).not.toContainText('Tom shop');
        await checkout.locator('#cardEmail').fill('external@example.com');
        await checkout.locator('#cardNumber').fill('4242424242424242');
        await checkout.locator('#cardExpiry').fill('1299');
        await checkout.locator('#cardCvc').fill('123');
        await checkout.locator('#cardholder').fill('Demo Customer');
        await checkout.locator('.card-agreements input').check();
        if (recurring) await checkout.locator('#recurringConsent').check();
        await checkout.locator('#submitCard').click();
        await expect(checkout.locator('#paymentResult')).toBeVisible();
        await expect(checkout.locator('#cardForm')).toBeHidden();
        await expect(checkout.locator('#paymentResult')).toContainText(recurring ? '1 of 3 installments paid.' : 'Thanks for your payment');
        await checkout.reload();
        await expect(checkout.locator('#paymentResult')).toBeVisible();
        await expect(checkout.locator('#cardForm')).toBeHidden();
        expect(await checkout.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      } finally { await external.close(); }

      await page.reload();
      await page.getByRole('tab', {name:'Billing Records'}).click();
      await page.locator('#filterAssignment').selectOption('standalone');
      await page.getByRole('button', {name:'Search billing records'}).click();
      const paidRow = page.locator('#billingRows tr').filter({hasText:invoice});
      await expect(paidRow).toContainText(recurring ? 'Active' : 'Paid');
      await expect(page.locator('#merchant option')).toHaveText(originalMerchants);
      await page.locator('#filterAssignment').selectOption('merchant');
      await page.getByRole('button', {name:'Search billing records'}).click();
      await expect(page.locator('#billingRows')).not.toContainText(invoice);
      await page.locator('#resetFilters').click();
      await expect(page.locator('#billingRows')).toContainText(invoice);

      const portal = await page.context().newPage();
      try {
        await portal.goto(new URL('/42.billing_payments.html?merchantId=null', page.url()).href);
        await expect(portal.locator('#paymentMerchant option[value="1000000006"]')).toHaveCount(1);
        await expect(portal.locator('#paymentMerchant option[value="null"], #paymentMerchant option[value="undefined"]')).toHaveCount(0);
        await portal.locator('#paymentMerchant').selectOption('1000000006');
        await expect(portal.locator('#pendingCards')).not.toContainText(invoice);
        await portal.locator('#historyTab').click();
        await expect(portal.locator('#paymentHistoryRows')).not.toContainText(invoice);
      } finally { await portal.close(); }
    }
  });
}
