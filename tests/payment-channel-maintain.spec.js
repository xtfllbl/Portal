const { test, expect } = require('@playwright/test');
const storeKey = 'paywizard.maintain.payment-channels.v1';
const list = '/47.payment_channel.html';
const form = '/47.payment_channel_form.html';
test.use({ viewport: { width: 1710, height: 1000 } });

async function choose(page, field, option) {
  await page.getByRole('combobox', { name: field, exact: true }).click();
  await page.locator('.pc-picker-panel:popover-open').getByRole('option', { name: option, exact: true }).click();
  if (await page.locator('.pc-picker-panel:popover-open').count()) {
    await page.locator('.pc-picker-panel:popover-open input').press('Escape');
  }
}
async function fillQr(page, name) {
  await page.getByLabel('Channel Name*', { exact: true }).fill(name);
  await choose(page, 'Scenario Type', 'QR Payment');
  await choose(page, 'Channel Type Name', 'Prompt Pay');
  await page.getByLabel('Company Information*', { exact: true }).fill('Example Company');
  await page.getByLabel('Channel Properties*', { exact: true }).fill('Example');
  await page.getByLabel('Cost Rate (%)*', { exact: true }).fill('0.25');
  await page.getByLabel('Service Fee Range*', { exact: true }).fill('0-100');
  await page.getByLabel('Commission Settlement Period*', { exact: true }).fill('10');
  await choose(page, 'Applicable Regions (Select multiple)', 'Canada');
}

test('list preserves screenshot records and protects system channels, including direct URLs', async ({ page }) => {
  await page.goto(list);
  await expect(page.getByRole('button', { name: 'Maintain', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(21);
  await expect(page.locator('#recordCount')).toHaveText('46 channels');
  const cash = page.locator('tbody tr').filter({ has: page.getByRole('cell', { name: 'Cash', exact: true }).first() });
  await expect(cash.getByRole('button')).toHaveCount(1);
  await expect(cash.getByRole('link')).toHaveCount(0);
  await page.getByRole('button', { name: 'View inputronics', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Commission Settlement Period');
  await expect(page.getByRole('dialog')).toContainText('Zimbabwe');
  await page.screenshot({ path: 'artifacts/payment-channel-detail.png' });
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.goto(form + '?id=pc-04');
  await expect(page.getByRole('alert')).toContainText('read-only');
  await expect(page.locator('#channelForm')).toBeHidden();
});

test('add, edit, reload, delete cancellation and confirmed delete work as a complete flow', async ({ page }) => {
  await page.goto(form);
  await fillQr(page, 'Review QR');
  await expect(page.getByLabel('Payment Package Name*', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(/47\.payment_channel\.html$/);
  await expect(page.getByRole('link', { name: 'Edit Review QR', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'View Review QR', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Edit Review QR', exact: true }).click();
  await page.getByLabel('Company Information*', { exact: true }).fill('Updated Company');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Updated Company', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Review QR', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Review QR');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Review QR', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Review QR', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Review QR', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#recordCount')).toHaveText('46 channels');
});

test('form cancellation and successful edit preserve list filters and page position', async ({ page }) => {
  await page.goto(list);
  await page.getByRole('searchbox', { name: 'Channel Name', exact: true }).fill('Nuvei');
  await page.getByRole('button', { name: 'Search channels', exact: true }).click();
  await page.getByRole('link', { name: 'Edit Nuvei-p', exact: true }).click();
  await page.getByLabel('Channel Name*', { exact: true }).fill('Unsaved rename');
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Channel Name', exact: true })).toHaveValue('Nuvei');
  await expect(page.getByRole('button', { name: 'View Nuvei-p', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await page.getByRole('link', { name: 'Edit BNC Bank', exact: true }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'View BNC Bank', exact: true })).toBeVisible();
});

test('region selection retains 249 selections while searching and supports removal and keyboard selection', async ({ page }) => {
  await page.goto(form + '?id=pc-01');
  const trigger = page.getByRole('combobox', { name: 'Applicable Regions (Select multiple)', exact: true });
  await trigger.click();
  const panel = page.locator('.pc-picker-panel:popover-open');
  const search = panel.getByRole('combobox');
  await search.fill('Canada');
  await expect(panel.getByRole('option')).toHaveCount(1);
  await expect(panel.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  await search.press('Tab');
  await panel.getByRole('button', { name: 'Select all', exact: true }).press('Tab');
  await expect(panel.getByRole('button', { name: 'Selected (249)', exact: true })).toBeFocused();
  await panel.getByRole('button', { name: 'Selected (249)', exact: true }).press('Enter');
  await panel.getByRole('option', { name: 'Canada', exact: true }).click();
  await expect(trigger).toContainText('248 items selected');
  await search.press('Escape');
  await trigger.click();
  await search.fill('Canada');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(trigger).toContainText('249 items selected');
  await search.press('Escape');
  await expect(trigger).toBeFocused();
  await choose(page, 'Scenario Type', 'QR Payment');
  await expect(page.getByRole('combobox', { name: 'Channel Type Name', exact: true })).toContainText('Select');
  await expect(page.getByRole('combobox', { name: 'Supported Card Types (Select multiple)', exact: true })).toBeHidden();
  await choose(page, 'Scenario Type', 'Card Payment');
  await expect(page.getByRole('combobox', { name: 'Supported Card Types (Select multiple)', exact: true })).toContainText('3 items selected');
});

test('source-backed Fiserv fields and cost-rate bounds are enforced with focused visible errors', async ({ page }) => {
  await page.goto(form + '?id=pc-01');
  await choose(page, 'Channel Type Name', 'Fiserv');
  await expect(page.getByLabel('app*', { exact: true })).toBeVisible();
  await page.getByLabel('Cost Rate (%)*', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const error = page.getByRole('alert');
  await expect(error).toContainText('0 to 99.99');
  await expect(error).toBeFocused();
  const bounds = await error.boundingBox();
  expect(bounds.y).toBeGreaterThan(85);
  expect(bounds.y + bounds.height).toBeLessThan(900);
  await expect(page.getByLabel('Cost Rate (%)*', { exact: true })).toHaveValue('100');
  await page.getByLabel('Cost Rate (%)*', { exact: true }).fill('99.99');
  await page.getByLabel('app*', { exact: true }).fill('APP');
  await page.getByLabel('tppId*', { exact: true }).fill('TPP');
  await page.getByLabel('serviceId*', { exact: true }).fill('160');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(/47\.payment_channel\.html$/);
});

test('storage failures preserve inputs and keep failed deletions in the list', async ({ page }) => {
  await page.addInitScript(key => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name, value) {
      if (name === key) throw new DOMException('Storage full', 'QuotaExceededError');
      return set.call(this, name, value);
    };
  }, storeKey);
  await page.goto(form + '?id=pc-01');
  await page.getByLabel('Channel Name*', { exact: true }).fill('Retained Draft');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Channel Name*', { exact: true })).toHaveValue('Retained Draft');
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Delete inputronics', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('alertdialog').getByRole('alert')).toContainText('could not be deleted');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View inputronics', exact: true })).toBeVisible();
});

test('desktop dimensions and low-screen dropdown placement remain within the viewport', async ({ page }) => {
  await page.goto(list);
  await expect(page.locator('thead th').first()).toHaveCSS('height', '34px');
  await expect(page.locator('thead th').first()).toHaveCSS('font-size', '11px');
  await expect(page.getByRole('button', { name: 'View inputronics', exact: true })).toHaveCSS('height', '36px');
  await page.screenshot({ path: 'artifacts/payment-channel-list.png' });
  await page.getByRole('link', { name: 'Edit inputronics', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Submit', exact: true })).toHaveCSS('height', '40px');
  const submitBounds = await page.getByRole('button', { name: 'Submit', exact: true }).boundingBox();
  const hostBounds = await page.locator('.pw-platform-content-host').boundingBox();
  expect(submitBounds.y + submitBounds.height).toBeLessThanOrEqual(hostBounds.y + hostBounds.height);
  await page.screenshot({ path: 'artifacts/payment-channel-edit.png' });
  await page.getByRole('combobox', { name: 'Required parameters', exact: true }).click();
  const panel = page.locator('.pc-picker-panel:popover-open');
  await expect(panel.getByRole('option')).toHaveCount(6);
  const bounds = await panel.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000);
  await page.screenshot({ path: 'artifacts/payment-channel-picker.png' });
  await panel.getByRole('combobox').press('Escape');
});

test('operations access rules apply to both new routes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/12.transaction_list.html');
  await page.evaluate(() => localStorage.setItem('paywizard.portalAccessProfile.v1', 'full-service'));
  for (const route of [list, form + '?id=pc-01']) {
    await page.goto(route);
    await expect(page).toHaveURL(/12\.transaction_list\.html/);
    await expect(page.locator('[data-pw-menu-toggle="matintain"]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
