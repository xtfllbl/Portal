const { test, expect } = require('@playwright/test');

const KEY = 'pw_terminal_transaction_capabilities';
const ADD = '/5.merchant_add_device_iso.html';
const EDIT = '/5.merchant_device_settings_iso.html';
const DETAIL = '/5.merchant_detail_iso.html';
const LEADS = '/29.INTL_PSP_merchant_lead_list.html';
const cardless = (page) => page.getByRole('switch', { name: 'Supports Cardless Transactions', exact: true });
const routing = (page) => page.getByRole('switch', { name: 'Supports Transaction Routing', exact: true });

test.use({ viewport: { width: 1710, height: 950 } });

async function openLeadAssign(page) {
  await page.goto(LEADS);
  const row = page.locator('[data-table-view="upt"] tbody tr').filter({ has: page.locator('td:first-child', { hasText: '00000438' }) });
  await row.locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="terminal"]').click();
}

async function chooseLeadScenario(page, name) {
  await page.getByRole('combobox', { name: /Terminal Scenario/ }).fill(name);
  await page.getByRole('option', { name, exact: true }).click();
}

for (const [url, scenario, selected, tci] of [
  ['/1.terminalmanage.html?tab=basic', 'Standalone Terminal', false, 'TC20000115'],
  ['/1.terminalmanage_nayax.html?tab=basic', 'Vending Machine', true, 'TC36002376']
]) {
  test(`terminal details share capability defaults, cancel drafts, and preserve configuration on ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.locator('#terminalTypeButton').click();
    await expect(cardless(page)).toBeChecked({ checked: selected });
    await expect(routing(page)).toBeChecked({ checked: selected });
    await page.getByRole('menuitem', { name: 'Arcade Machine', exact: true }).click();
    await expect(cardless(page)).toBeChecked();
    await expect(routing(page)).toBeChecked();
    await routing(page).uncheck();
    await page.locator('#terminalTypeCancel').click();
    await expect(page.locator('#terminalTypeName')).toHaveText(scenario);
    await page.locator('#terminalTypeButton').click();
    await expect(cardless(page)).toBeChecked({ checked: selected });
    await page.getByRole('menuitem', { name: 'Arcade Machine', exact: true }).click();
    await routing(page).uncheck();
    await page.locator('#terminalTypeSave').click();
    await expect(page.locator('#terminalTypeName')).toHaveText('Arcade Machine');
    await page.goto(`${EDIT}?tci=${tci}`);
    await expect(page.locator('#device-terminal-scenario')).toHaveValue('Arcade Machine');
    await expect(cardless(page)).toBeChecked();
    await expect(routing(page)).not.toBeChecked();
    await page.locator('#device-terminal-scenario').selectOption('Standalone Terminal');
    await saveForm(page, '#redeployBtn');
    await page.goto(url);
    await expect(page.locator('#terminalTypeName')).toHaveText('Standalone Terminal');
    await page.locator('#terminalTypeButton').click();
    await expect(cardless(page)).not.toBeChecked();
    await expect(routing(page)).toBeDisabled();
  });
}

test('terminal details save to the existing SN-matched TCI and keep drafts on storage failure', async ({ page }) => {
  await page.goto('/1.terminalmanage.html?tab=basic&sn=REPLACEMENT87654321');
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({TC12345678:{sn:'REPLACEMENT87654321',scenario:'Coffee Machine',cardless:true,routing:false}}));
    window.originalDetailSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'pw_terminal_transaction_capabilities') throw new Error('Storage unavailable');
      return window.originalDetailSetItem.call(this, key, value);
    };
  }, KEY);
  await page.reload();
  await expect(page.locator('#terminalTypeName')).toHaveText('Coffee Machine');
  await page.locator('#terminalTypeButton').click();
  await expect(routing(page)).not.toBeChecked();
  await page.getByRole('menuitem', { name: 'Standalone Terminal', exact: true }).click();
  await page.evaluate(() => {
    window.originalDetailSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'pw_terminal_transaction_capabilities') throw new Error('Storage unavailable');
      return window.originalDetailSetItem.call(this, key, value);
    };
  });
  await page.locator('#terminalTypeSave').click();
  await expect(page.locator('#terminalTypeModal')).toHaveClass(/open/);
  await expect(page.locator('#terminalTypeName')).toHaveText('Coffee Machine');
  await expect(page.locator('.terminal-capability-error')).toBeFocused();
  await expect(page.locator('.terminal-capability-error')).toBeInViewport();
  await expect(cardless(page)).not.toBeChecked();
  await page.evaluate(() => { Storage.prototype.setItem = window.originalDetailSetItem; });
  await page.locator('#terminalTypeSave').click();
  const records = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(Object.keys(records)).toEqual(['TC12345678']);
  expect(records.TC12345678).toMatchObject({scenario:'Standalone Terminal',cardless:false,routing:false});
});

test('Leads scenario picker resets per batch, searches, and uses the shared capability rules', async ({ page }) => {
  await openLeadAssign(page);
  const picker = page.getByRole('combobox', { name: /Terminal Scenario/ });
  await expect(picker).toHaveValue('');
  await expect(cardless(page)).toBeDisabled();
  await expect(routing(page)).toBeDisabled();
  await picker.fill('Arcade');
  await expect(page.locator('.merchant-select-options [role="option"]')).toHaveCount(1);
  await picker.press('Enter');
  await expect(picker).toHaveValue('Arcade Machine');
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).toBeChecked();
  await routing(page).uncheck();
  await chooseLeadScenario(page, 'EV Charging');
  await expect(routing(page)).not.toBeChecked();
  await chooseLeadScenario(page, 'Standalone Terminal');
  await expect(cardless(page)).not.toBeChecked();
  await expect(routing(page)).toBeDisabled();
  await cardless(page).check();
  await expect(routing(page)).toBeChecked();
  await cardless(page).uncheck();
  await expect(routing(page)).not.toBeChecked();
  await page.locator('#cancelLeadAssign').click();
  await page.locator('[data-table-view="upt"] tbody tr').filter({ hasText: '00000438' }).locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(picker).toHaveValue('');
  await expect(cardless(page)).toBeDisabled();
});

test('Leads assignment storage failure retains settings, focuses error, and supports SN-based configuration fill', async ({ page }) => {
  await openLeadAssign(page);
  await page.locator('#leadAssignMerchant').selectOption('Maple Street Coffee');
  await page.locator('#leadAssignStore').selectOption('Main Store');
  await chooseLeadScenario(page, 'Coffee Machine');
  await routing(page).uncheck();
  await page.locator('#leadAssignSelectAll').uncheck();
  const checkbox = page.locator('#leadAssignSnList input:not(:disabled)').first();
  const sn = await checkbox.inputValue();
  await checkbox.check();
  await page.evaluate(() => {
    window.originalLeadSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'paywizard-upt-lead-overrides-v1') throw new Error('Storage unavailable');
      return window.originalLeadSetItem.call(this, key, value);
    };
  });
  await page.locator('#saveLeadAssign').click();
  await expect(page.locator('#leadAssignError')).toBeFocused();
  await expect(page.locator('#leadAssignError')).toBeInViewport();
  await expect(checkbox).toBeChecked();
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).not.toBeChecked();
  await page.evaluate(() => { Storage.prototype.setItem = window.originalLeadSetItem; });
  await page.locator('#saveLeadAssign').click();
  await expect(page.locator('#leadAssignModal')).toBeHidden();
  await page.goto(`${ADD}?sn=${encodeURIComponent(sn)}`);
  await expect(page.locator('#device-terminal-scenario')).toHaveValue('Coffee Machine');
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).not.toBeChecked();
});

async function saveForm(page, button) {
  await page.locator(button).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#confirmSaveDeviceBtn').click();
  await expect(page.locator('#saveDeviceConfirmModal')).toHaveClass(/is-hidden/);
}

for (const url of [ADD, EDIT, '/5.merchant_add_iso.html']) {
  test(`scenario defaults, manual routing, and keyboard dependency on ${url}`, async ({ page }) => {
    await page.goto(url);
    const onboarding = url.includes('5.merchant_add_iso');
    if (onboarding) {
      await page.locator('[data-fill-mock-stage="merchant"]').click();
      await page.locator('.wizard-step[data-step="3"]').click();
    }
    const scenario = page.locator(onboarding ? '#onboard-device-scenario' : '#device-terminal-scenario');
    await expect(cardless(page)).toBeChecked();
    await expect(routing(page)).toBeChecked();
    if (url === ADD) await page.screenshot({ path: 'artifacts/terminal-transaction-capabilities.png' });
    await routing(page).uncheck();
    for (const value of ['EV Charging', 'Arcade Machine', 'Coffee Machine']) {
      await scenario.selectOption(value);
      await expect(cardless(page)).toBeChecked();
      await expect(routing(page)).not.toBeChecked();
    }
    await scenario.selectOption('Standalone Terminal');
    await expect(cardless(page)).not.toBeChecked();
    await expect(routing(page)).not.toBeChecked();
    await expect(routing(page)).toBeDisabled();
    await cardless(page).focus();
    await page.keyboard.press('Space');
    await expect(routing(page)).toBeChecked();
    await expect(routing(page)).toBeEnabled();
    await scenario.selectOption('Terminal + ECR');
    await expect(cardless(page)).toBeChecked();
    await cardless(page).uncheck();
    await expect(routing(page)).not.toBeChecked();
    await expect(routing(page)).toBeDisabled();
    await cardless(page).check();
    await expect(routing(page)).toBeChecked();
    await scenario.selectOption('Vending Machine');
    await expect(cardless(page)).toBeChecked();
    await expect(routing(page)).toBeChecked();
    if (url !== EDIT) {
      const model = page.locator(onboarding ? '#onboard-device-model' : '#device-model');
      await model.selectOption('Q3MINI-R');
      await expect(cardless(page)).toBeHidden();
      await model.selectOption('Q2');
      await expect(cardless(page)).toBeVisible();
    }
  });
}

test('new and edited capability choices persist by TCI, while unsaved choices do not', async ({ page }) => {
  await page.goto(`${ADD}?tci=TC12345678&scenario=Standalone+Terminal`);
  await expect(cardless(page)).not.toBeChecked();
  await cardless(page).check();
  await routing(page).uncheck();
  await saveForm(page, '#saveDeviceBtn');
  await page.goto(`${EDIT}?tci=TC12345678`);
  await expect(page.locator('#device-terminal-scenario')).toHaveValue('Standalone Terminal');
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).not.toBeChecked();
  await cardless(page).uncheck();
  await page.reload();
  await expect(cardless(page)).toBeChecked();
  await routing(page).check();
  await saveForm(page, '#redeployBtn');
  await page.reload();
  await expect(routing(page)).toBeChecked();
});

test('Assign Terminal has no capability controls and preserves configuration choices on Edit Params', async ({ page }) => {
  await page.goto(`${EDIT}?tci=TC48273915&scenario=Standalone+Terminal`);
  await cardless(page).check();
  await routing(page).uncheck();
  await saveForm(page, '#redeployBtn');
  await page.goto(DETAIL);
  await page.locator('#device-page-size').selectOption('20');
  const row = page.locator('.device-grid-row[data-tci="TC48273915"]');
  async function openAssign() {
    await row.getByRole('button', { name: 'Settings', exact: true }).click();
    await row.getByRole('button', { name: 'Assign Terminal', exact: true }).click();
  }
  await openAssign();
  await expect(page.locator('#assign-terminal-modal [role="switch"]')).toHaveCount(0);
  await page.locator('#assign-terminal-modal').getByRole('button', { name: 'Cancel', exact: true }).click();
  await openAssign();
  await expect(page.locator('#assign-terminal-modal [role="switch"]')).toHaveCount(0);
  await page.locator('#assign-terminal-sn').fill('CAPABILITY-BIND-001');
  await page.getByRole('button', { name: 'Assign & Deploy', exact: true }).click();
  await expect(row).toHaveAttribute('data-sn', 'CAPABILITY-BIND-001');
  await row.getByRole('button', { name: 'Settings', exact: true }).click();
  await row.getByRole('button', { name: 'Edit Params', exact: true }).click();
  await expect(page).toHaveURL(/5\.merchant_device_settings_iso/);
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).not.toBeChecked();
});

test('storage failure keeps choices, focuses a visible error, and allows retry', async ({ page }) => {
  await page.goto(`${ADD}?tci=TC87654321`);
  await routing(page).uncheck();
  await page.evaluate((key) => {
    window.originalStorageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('Storage unavailable');
      return window.originalStorageSetItem.call(this, name, value);
    };
  }, KEY);
  await page.locator('#saveDeviceBtn').click();
  await page.locator('#confirmSaveDeviceBtn').click();
  const error = page.locator('.terminal-capability-error');
  await expect(error).toBeVisible();
  await expect(error).toBeFocused();
  await expect(error).toBeInViewport();
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).not.toBeChecked();
  await page.screenshot({ path: 'artifacts/terminal-transaction-capabilities-error.png' });
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStorageSetItem; });
  await saveForm(page, '#saveDeviceBtn');
  await expect(error).toBeHidden();
});

test('onboarding saves the capability choices with its generated TCI', async ({ page }) => {
  await page.goto('/5.merchant_add_iso.html');
  await page.locator('[data-fill-mock-stage="merchant"]').click();
  await page.locator('.wizard-step[data-step="3"]').click();
  await page.locator('#onboard-device-model').selectOption('Q2');
  await page.locator('label[for="onboard-device-provision"]').click();
  const tci = await page.locator('#onboard-device-tci').inputValue();
  await routing(page).uncheck();
  await page.locator('.wizard-panel[data-step="3"] button[data-goto="4"]').click();
  await page.locator('#onboardMerchantBtn').click();
  await expect(page.locator('#reviewHeroTitle')).toHaveText('Onboarding Complete');
  await page.goto(`${EDIT}?tci=${tci}`);
  await expect(cardless(page)).toBeChecked();
  await expect(routing(page)).not.toBeChecked();
});
