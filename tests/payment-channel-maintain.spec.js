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
  await expect(page.getByRole('button', { name: 'Payment', exact: true })).toHaveAttribute('aria-expanded', 'true');
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
  await page.screenshot({ path: 'artifacts/payment-channel-edit.png' });
  await page.getByRole('button', { name: 'Submit', exact: true }).scrollIntoViewIfNeeded();
  const submitBounds = await page.getByRole('button', { name: 'Submit', exact: true }).boundingBox();
  const hostBounds = await page.locator('.pw-platform-content-host').boundingBox();
  expect(submitBounds.y + submitBounds.height).toBeLessThanOrEqual(hostBounds.y + hostBounds.height);
  await page.screenshot({ path: 'artifacts/payment-channel-form-footer.png' });
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
    await expect(page.locator('.pw-platform-profile-label')).toHaveText('WizarPOS Maintain');
    await expect(page.locator('[data-pw-menu-toggle="payment"]')).toHaveAttribute('aria-expanded', 'true');
  }
  expect(errors).toEqual([]);
});

function capability(page, transaction, column) {
  const role = column === 'Send Payload Data' ? 'switch' : 'checkbox';
  return page.getByRole(role, { name: `${transaction}: ${column}`, exact: true });
}
const terminal = 'Terminal Channel';
const ecomm = 'ECOMM Channel';
const cross = 'Cross-Channel Capabilities (Terminal → ECOMM)';
const payload = 'Send Payload Data';

async function expectCrossSelection(page, names) {
  await page.getByRole('combobox', { name: cross, exact: true }).click();
  const panel = page.locator('.pc-picker-panel:popover-open');
  await panel.getByRole('button', { name: `Selected (${names.length})`, exact: true }).click();
  await expect(panel.getByRole('option')).toHaveCount(names.length);
  for (const name of names) await expect(panel.getByRole('option', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
  await panel.getByRole('combobox').press('Escape');
}

test('four-column matrix and independent Cross dropdown save and refill all capability values', async ({ page }) => {
  await page.goto(form);
  await expect(page.getByRole('table', { name: 'Processor capabilities' }).getByRole('row')).toHaveCount(25);
  await expect(page.getByRole('columnheader')).toHaveText(['Transaction Type', 'Terminal Channel', 'ECOMM Channel', 'Send Payload Data']);
  for (const width of [1280, 1710]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.locator('.pc-capability-table thead')).toHaveCSS('height', '34px');
    await expect(page.getByRole('columnheader').first()).toHaveCSS('font-size', '11px');
    expect(await page.locator('.pc-capability-scroll').evaluate(element => element.scrollWidth === element.clientWidth)).toBe(true);
    const parameters = await page.locator('[data-field="payParams"]').boundingBox();
    const crossBounds = await page.locator('[data-field="postAbilityList"]').boundingBox();
    expect(crossBounds.y).toBe(parameters.y);
    expect(crossBounds.x).toBeGreaterThan(parameters.x + parameters.width);
  }
  // Cross selection requires neither Terminal nor ECOMM support.
  await choose(page, cross, 'Refund');
  await expect(capability(page, 'Refund', terminal)).not.toBeChecked();
  await expect(capability(page, 'Refund', ecomm)).not.toBeChecked();
  await expect(capability(page, 'Purchase', payload)).toBeDisabled();
  await fillQr(page, 'Matrix QR');
  await expect(page.getByRole('combobox', { name: cross, exact: true })).toBeVisible();
  await capability(page, 'Purchase', terminal).check();
  await capability(page, 'Purchase', payload).focus();
  await capability(page, 'Purchase', payload).press('Space');
  await capability(page, 'Capture', ecomm).check();
  await page.getByRole('heading', { name: 'Processor capabilities', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/payment-channel-processor-capabilities.png' });
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(/47\.payment_channel\.html$/);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).find(record => record.name === 'Matrix QR'), storeKey);
  expect(saved.channelCapability).toMatchObject({ offAbilityList: ['Purchase'], abilityList: ['Capture'], postAbilityList: ['Refund'], payloadDataList: ['Purchase'] });
  await page.getByRole('link', { name: 'Edit Matrix QR', exact: true }).click();
  await page.reload();
  await expectCrossSelection(page, ['Refund']);
  await expect(capability(page, 'Purchase', payload)).toBeChecked();
  await expect(capability(page, 'Capture', ecomm)).toBeChecked();
  await choose(page, cross, 'Refund');
  await capability(page, 'Purchase', payload).uncheck();
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await page.getByRole('link', { name: 'Edit Matrix QR', exact: true }).click();
  await expectCrossSelection(page, ['Refund']);
  await expect(capability(page, 'Purchase', payload)).toBeChecked();
});

test('Cross dropdown supports search, keyboard and selected removal without losing other selections', async ({ page }) => {
  await page.goto(form);
  await page.getByRole('combobox', { name: cross, exact: true }).click();
  const panel = page.locator('.pc-picker-panel:popover-open');
  const search = panel.getByRole('combobox');
  await expect(panel.getByRole('option')).toHaveCount(24);
  await panel.getByRole('option', { name: 'Purchase', exact: true }).click();
  await search.fill('Refund');
  await search.press('ArrowDown');
  await search.press('Enter');
  await search.fill('');
  await panel.getByRole('button', { name: 'Selected (2)', exact: true }).click();
  await expect(panel.getByRole('option')).toHaveCount(2);
  await panel.getByRole('option', { name: 'Purchase', exact: true }).click();
  await expect(panel.getByRole('option')).toHaveCount(1);
  await expect(panel.getByRole('option', { name: 'Refund', exact: true })).toHaveAttribute('aria-selected', 'true');
  const bounds = await panel.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000);
  await search.press('Escape');
  await expect(page.getByRole('combobox', { name: cross, exact: true })).toBeFocused();
  await expectCrossSelection(page, ['Refund']);
});

test('changing Terminal or ECOMM retains Cross selections while Terminal still controls Payload', async ({ page }) => {
  await page.goto(form);
  await choose(page, cross, 'Purchase');
  await capability(page, 'Purchase', terminal).check();
  await capability(page, 'Purchase', ecomm).check();
  await capability(page, 'Purchase', payload).check();
  await capability(page, 'Purchase', ecomm).uncheck();
  await expectCrossSelection(page, ['Purchase']);
  await expect(capability(page, 'Purchase', payload)).toBeChecked();
  await capability(page, 'Purchase', terminal).uncheck();
  await expectCrossSelection(page, ['Purchase']);
  await expect(capability(page, 'Purchase', payload)).not.toBeChecked();
  await expect(capability(page, 'Purchase', payload)).toBeDisabled();
  await capability(page, 'Purchase', terminal).check();
  await expect(capability(page, 'Purchase', payload)).not.toBeChecked();
});

test('legacy Cross selections no longer produce conflicts or block submission', async ({ page }) => {
  await page.goto(form + '?id=pc-02');
  const before = await page.evaluate(() => window.PaywizardPaymentChannelData.records.find(record => record.id === 'pc-02').channelCapability);
  await expectCrossSelection(page, before.postAbilityList);
  await expect(page.locator('.pc-capability-conflicts')).toBeHidden();
  await expect(page.locator('.pc-capability-table [aria-invalid=true]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(/47\.payment_channel\.html$/);
  const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).find(record => record.id === 'pc-02').channelCapability, storeKey);
  expect(after.postAbilityList).toEqual(before.postAbilityList);
  expect(after.offAbilityList).toEqual(before.offAbilityList);
  expect(after.abilityList).toEqual(before.abilityList);
  await page.getByRole('link', { name: 'Edit Nuvei Attd', exact: true }).click();
  await expectCrossSelection(page, before.postAbilityList);
});

test('legacy Payload conflicts are preserved until explicitly resolved and defaults do not change old records', async ({ page }) => {
  await page.goto(form + '?id=pc-01');
  await expect(page.getByRole('switch', { checked: true })).toHaveCount(0);
  await page.evaluate(key => {
    const records = structuredClone(window.PaywizardPaymentChannelData.records);
    const record = records.find(item => item.id === 'pc-01');
    record.channelCapability.offAbilityList = record.channelCapability.offAbilityList.filter(value => value !== 'Capture');
    record.channelCapability.postAbilityList = record.channelCapability.postAbilityList.filter(value => value !== 'Capture');
    record.channelCapability.payloadDataList = ['Capture'];
    localStorage.setItem(key, JSON.stringify(records));
  }, storeKey);
  await page.reload();
  await expect(capability(page, 'Capture', payload)).toBeChecked();
  await expect(capability(page, 'Capture', payload)).toBeEnabled();
  await expect(capability(page, 'Capture', payload)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[data-transaction="Capture"]')).toContainText('Payload Data requires Terminal support.');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key))[0].channelCapability.payloadDataList, storeKey)).toEqual(['Capture']);
  await capability(page, 'Capture', payload).uncheck();
  await expect(capability(page, 'Capture', payload)).toBeDisabled();
  await expect(page.locator('.pc-capability-conflicts')).toBeHidden();
  await capability(page, 'Purchase', payload).check();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page).toHaveURL(/47\.payment_channel\.html$/);
  await page.getByRole('link', { name: 'Edit inputronics', exact: true }).click();
  await expect(capability(page, 'Capture', payload)).not.toBeChecked();
  await expect(capability(page, 'Purchase', payload)).toBeChecked();
});
