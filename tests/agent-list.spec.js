const { test, expect } = require('@playwright/test');
const route = '/2.agent_list_iso.html';
const row = (page, name, level) => page.getByRole('treeitem', { name: name + ', L' + level, exact: true });

async function fillNewAgent(page, name) {
  const dialog = page.getByRole('dialog', { name: /Add (Level 1 Agent|Sub-agent)/ });
  await dialog.getByLabel('Agent Name').fill(name);
  await dialog.getByLabel('Contact Person').fill('Alex Cooper');
  await dialog.getByLabel('Contact Information').fill('+1 415 555 1099');
  await dialog.getByLabel('Agent Email').fill('alex@example.com');
  await dialog.getByRole('combobox', { name: 'Country or Region' }).fill('Canada');
  await dialog.getByRole('option', { name: 'Canada', exact: true }).click();
  await dialog.getByRole('checkbox', { name: '5411 — Grocery Stores' }).check();
  await dialog.getByRole('button', { name: 'Create Agent', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

test('agent tree keeps business levels, ancestor paths, selection and keyboard navigation', async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole('treeitem')).toHaveCount(8);
  await expect(row(page, 'agenttest', 1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#agentDetailTitle')).toHaveText('agenttest');
  await expect(page.getByRole('button', { name: 'View', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-action="setting"]')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search agents' }).fill('OneLeave');
  await expect(page.getByRole('treeitem')).toHaveCount(3);
  await expect(row(page, 'agenttest', 1)).toBeVisible();
  await expect(row(page, 'agdd', 2)).toBeVisible();
  await row(page, 'OneLeaveAgent', 3).click();
  await expect(page.getByRole('button', { name: 'Add Sub-agent' })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search agents' }).fill('no such agent');
  await expect(page.getByText('No agents found.')).toBeVisible();
  await expect(page.locator('#agentDetailTitle')).toHaveText('OneLeaveAgent');
  await page.getByRole('searchbox', { name: 'Search agents' }).fill('');
  await page.getByRole('button', { name: 'Collapse agenttest', exact: true }).click();
  await expect(page.getByRole('treeitem')).toHaveCount(4);
  await row(page, 'agenttest', 1).press('ArrowRight');
  await expect(page.getByRole('treeitem')).toHaveCount(8);
  await row(page, 'agenttest', 1).press('ArrowRight');
  await expect(row(page, 'twoAgent', 2)).toBeFocused();
  await row(page, 'twoAgent', 2).press('Enter');
  await expect(page.locator('#agentDetailTitle')).toHaveText('twoAgent');
  await page.getByRole('button', { name: 'wizarpos', exact: true }).click();
  await expect(page.getByRole('tree', { name: 'Agents', exact: true })).not.toBeVisible();
  await expect(page.locator('#agentDetailTitle')).toHaveText('twoAgent');
});

test('creates L1 and locked-parent sub-agents, reveals new nodes and stops at L3', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Add Level 1 Agent' }).click();
  await expect(page.locator('#createBody')).toContainText('L1');
  await expect(page.locator('#createBody')).not.toContainText('Parent Agent');
  await fillNewAgent(page, 'North Coast Payments');
  await expect(row(page, 'North Coast Payments', 1)).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Add Sub-agent' }).click();
  await expect(page.locator('#createBody')).toContainText('Parent AgentNorth Coast Payments');
  await expect(page.locator('#createBody')).toContainText('L2');
  await fillNewAgent(page, 'Harbor Payments');
  await expect(row(page, 'Harbor Payments', 2)).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('searchbox', { name: 'Search agents' }).fill('Harbor');
  await page.getByRole('button', { name: 'Add Sub-agent' }).click();
  await fillNewAgent(page, 'Downtown Payments');
  await expect(page.getByRole('searchbox', { name: 'Search agents' })).toHaveValue('');
  await expect(row(page, 'Downtown Payments', 3)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Add Sub-agent' })).toHaveCount(0);
});

test('preserves unsaved edits on canceled navigation and updates tree and saved email', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Agent Name').fill('Coastal Payments');
  await row(page, 'twoAgent', 2).click();
  await expect(page.getByRole('dialog', { name: 'Discard unsaved changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Editing', exact: true }).click();
  await expect(page.getByLabel('Agent Name')).toHaveValue('Coastal Payments');
  await page.getByLabel('Agent Email').fill('coastal@example.com');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(row(page, 'Coastal Payments', 1)).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Send Password Reset Email', exact: true }).click();
  await expect(page.locator('#confirmMessage')).toContainText('coastal@example.com');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Agent Name').fill('Discard this');
  await row(page, 'twoAgent', 2).click();
  await page.getByRole('button', { name: 'Discard Changes', exact: true }).click();
  await expect(page.locator('#agentDetailTitle')).toHaveText('twoAgent');
  await expect(row(page, 'Coastal Payments', 1)).toBeVisible();
});

test('disabling an ancestor leaves descendants enabled and keeps disabled agent selectable', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Disable', exact: true }).click();
  await expect(page.getByRole('treeitem', { name: 'agenttest, L1, Disabled', exact: true })).toBeVisible();
  await row(page, 'twoAgent', 2).click();
  await expect(page.locator('.al-status')).toHaveText('Enabled');
  await page.getByRole('treeitem', { name: 'agenttest, L1, Disabled', exact: true }).click();
  await page.getByRole('button', { name: 'Enable', exact: true }).click();
  await expect(row(page, 'agenttest', 1)).toHaveAttribute('aria-selected', 'true');
});

test('mail confirmation uses saved account, prevents repeated sends and displays recoverable failures', async ({ page }) => {
  await page.addInitScript(() => {
    window.mailRequests = [];
    window.PaywizardAgentServices = { sendPasswordResetEmail(request) {
      window.mailRequests.push(request);
      return new Promise((resolve, reject) => { window.finishMail = resolve; window.failMail = reject; });
    } };
  });
  await page.goto(route);
  await page.getByRole('button', { name: 'Send Password Reset Email', exact: true }).click();
  await expect(page.locator('#confirmMessage')).toContainText('xtfllb@gmail2.com');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => window.mailRequests.length)).toBe(0);
  await page.getByRole('button', { name: 'Send Password Reset Email', exact: true }).click();
  await page.getByRole('button', { name: 'Send Email', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await page.evaluate(() => window.failMail(new Error('mail service unavailable')));
  await expect(page.locator('#detailNotice')).toContainText('could not be sent');
  await expect(page.locator('#detailNotice')).toBeFocused();
  await page.getByRole('button', { name: 'Send Password Reset Email', exact: true }).click();
  await page.getByRole('button', { name: 'Send Email', exact: true }).click();
  await page.evaluate(() => window.finishMail());
  await expect(page.locator('#detailNotice')).toContainText('Password reset email sent to xtfllb@gmail2.com');
  expect(await page.evaluate(() => window.mailRequests)).toEqual([
    { providerId: '1002', agentId: 'r-agenttest', email: 'xtfllb@gmail2.com' }, { providerId: '1002', agentId: 'r-agenttest', email: 'xtfllb@gmail2.com' }
  ]);
});

test('searchable selectors support keyboards and keep MCC selections across filtering', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const country = page.getByRole('combobox', { name: 'Country or Region' });
  await country.fill('Canada');
  await country.press('Enter');
  await expect(country).toHaveValue('Canada');
  await expect(country).toHaveAttribute('aria-expanded', 'false');
  await country.click();
  await country.fill('no matching country');
  await expect(page.getByText('No matches', { exact: true })).toBeVisible();
  await country.press('Escape');
  await expect(country).toHaveValue('Canada');
  await page.getByRole('searchbox', { name: 'Search MCC' }).fill('Grocery');
  await page.getByRole('checkbox', { name: '5411 — Grocery Stores' }).check();
  await expect(page.getByRole('button', { name: 'Remove MCC 5999' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove MCC 5999' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#agentDetail')).toContainText('5411 — Grocery Stores');
  await expect(page.locator('#agentDetail')).not.toContainText('5999 — Misc Retail');
  await expect(page.locator('#agentDetail')).toContainText('Canada');
});

test('validation focuses visible errors in page and modal and preserves input', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(route);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Agent Name').fill('');
  await page.getByRole('searchbox', { name: 'Search MCC' }).click();
  const saveBounds = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
  const hostBounds = await page.locator('.pw-platform-content-host').boundingBox();
  expect(saveBounds.y + saveBounds.height).toBeLessThanOrEqual(hostBounds.y + hostBounds.height);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const error = page.locator('#editForm [data-form-error]');
  await expect(error).toBeFocused();
  const bounds = await error.boundingBox();
  expect(bounds.y).toBeGreaterThan(80);
  expect(bounds.y + bounds.height).toBeLessThan(720);
  await expect(page.getByLabel('Contact Person')).toHaveValue('Beaver');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Discard Changes', exact: true }).click();
  await page.getByRole('button', { name: 'Add Level 1 Agent' }).click();
  await page.getByLabel('Agent Name').fill('Incomplete Agent');
  await page.getByRole('button', { name: 'Create Agent', exact: true }).click();
  await expect(page.locator('#createForm [data-form-error]')).toBeFocused();
  const modalBounds = await page.locator('#createForm [data-form-error]').boundingBox();
  expect(modalBounds.y).toBeGreaterThan(60);
  expect(modalBounds.y + modalBounds.height).toBeLessThan(660);
  await expect(page.getByLabel('Agent Name')).toHaveValue('Incomplete Agent');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Continue Editing', exact: true }).click();
  await expect(page.getByLabel('Agent Name')).toHaveValue('Incomplete Agent');
});

test('desktop layout stays within page and action buttons remain 40px high', async ({ page }) => {
  for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size);
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    expect(await page.locator('.al-actions .al-btn').evaluateAll(nodes => nodes.map(node => [Math.round(node.getBoundingClientRect().width), Math.round(node.getBoundingClientRect().height)]))).toEqual([[40, 40], [40, 40], [40, 40], [40, 40]]);
    const heading = await page.locator('.al-detail-head').boundingBox();
    const actions = await page.locator('.al-actions').boundingBox();
    expect(actions.y).toBeGreaterThanOrEqual(heading.y);
    expect(actions.y + actions.height).toBeLessThanOrEqual(heading.y + heading.height);
    expect(actions.x + actions.width).toBeCloseTo(heading.x + heading.width, 0);
    const detail = await page.locator('#agentDetail').boundingBox();
    expect(detail.x + detail.width).toBeLessThanOrEqual(size.width);
    await page.screenshot({ path: 'artifacts/agent-list/desktop-' + size.width + '.png' });
  }
});

test('updated analytics and agent list pages load without browser errors', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  for (const url of ['/2.agent_analytics.html', '/8.merchant_analytics.html', route]) {
    await page.goto(url);
    await expect(page.locator('.pw-platform-content')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

async function chooseProvider(page, query, name) {
  const selector = page.getByRole('combobox', { name: 'Service Provider', exact: true });
  await selector.fill(query);
  await page.getByRole('option', { name, exact: true }).click();
}

test('operations can browse ten providers by ID and name without mixing hierarchies', async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('[aria-label="Current account: Platform Operations"]')).toBeVisible();
  const selector = page.getByRole('combobox', { name: 'Service Provider', exact: true });
  await selector.click();
  await expect(page.getByRole('option')).toHaveCount(10);
  await selector.press('Escape');
  const providers = [
    ['1001', 'NA Service Providers', 'North America Partners'], ['1045', 'Noctoptics', 'Noctoptics Distribution'],
    ['1043', 'Paynt ISV', 'Paynt Partner Network'], ['1040', 'Dippindots', 'Dippindots Distribution'],
    ['1039', 'YoloPago', 'YoloPago Partners'], ['1037', 'ManagePay', 'ManagePay Distribution'],
    ['1036', 'JMSCPOS', 'JMSC Partner Network'], ['1029', 'MonclusVending', 'Monclus Partner Network'],
    ['1019', 'Retech Payment Systems', 'Retech Partner Network']
  ];
  for (const [id, name, agentName] of providers) {
    await chooseProvider(page, id, name + ' · ' + id);
    await expect(selector).toHaveValue(name + ' · ' + id);
    await expect(page.locator('#providerRootName')).toHaveText(name);
    await expect(page.getByRole('treeitem')).toHaveCount(6);
    await expect(page.locator('#agentDetailTitle')).toHaveText(agentName);
    await expect(page.locator('#agentDetail')).toContainText('Service Provider' + name);
    await expect(page.getByRole('treeitem', { name: 'agenttest, L1', exact: true })).toHaveCount(0);
    await expect(page.locator('[aria-label="Current account: Platform Operations"]')).toBeVisible();
  }
  await chooseProvider(page, 'wizarpos', 'wizarpos · 1002');
  await expect(page.getByRole('treeitem')).toHaveCount(8);
});

test('provider changes protect unsaved input, restore selector on cancel and keep saved records isolated', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Agent Name').fill('WizarPOS regional partner');
  await chooseProvider(page, 'Nocto', 'Noctoptics · 1045');
  await expect(page.getByRole('dialog', { name: 'Discard unsaved changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Editing', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Service Provider', exact: true })).toHaveValue('wizarpos · 1002');
  await expect(page.getByLabel('Agent Name')).toHaveValue('WizarPOS regional partner');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search agents' }).fill('regional');
  await chooseProvider(page, 'Nocto', 'Noctoptics · 1045');
  await expect(page.getByRole('searchbox', { name: 'Search agents' })).toHaveValue('');
  await page.getByRole('button', { name: 'Add Level 1 Agent' }).click();
  await expect(page.locator('#createBody')).toContainText('Service ProviderNoctoptics');
  await fillNewAgent(page, 'Optical Payment Partners');
  await expect(page.locator('#agentDetail')).toContainText('Service ProviderNoctoptics');
  await chooseProvider(page, '1002', 'wizarpos · 1002');
  await expect(page.locator('#agentDetailTitle')).toHaveText('WizarPOS regional partner');
  await expect(page.getByRole('treeitem', { name: 'Optical Payment Partners, L1', exact: true })).toHaveCount(0);
  await chooseProvider(page, '1045', 'Noctoptics · 1045');
  await expect(row(page, 'Optical Payment Partners', 1)).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Agent Name').fill('Unsaved Noctoptics');
  await chooseProvider(page, '1002', 'wizarpos · 1002');
  await page.getByRole('button', { name: 'Discard Changes', exact: true }).click();
  await expect(page.locator('#agentDetailTitle')).toHaveText('WizarPOS regional partner');
});

test('provider demo has a fixed owner and no cross-provider selector or profile switch', async ({ page }) => {
  await page.goto(route + '?scope=provider&provider=1036');
  await expect(page.getByRole('combobox', { name: 'Service Provider', exact: true })).toHaveCount(0);
  await expect(page.locator('#providerPicker')).toHaveText('JMSCPOS');
  await expect(page.locator('[aria-label="Current account: JMSCPOS Provider"]')).toBeVisible();
  await expect(page.locator('[data-pw-profile-control]')).toBeHidden();
  await expect(page.getByRole('treeitem')).toHaveCount(6);
  await page.getByRole('button', { name: 'Add Level 1 Agent' }).click();
  await expect(page.locator('#createBody')).toContainText('Service ProviderJMSCPOS');
  await expect(page.getByRole('combobox', { name: 'Business Model', exact: true })).toHaveValue('Attended-Service');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search agents' }).fill('agenttest');
  await expect(page.getByRole('treeitem')).toHaveCount(0);
});

test('level colors remain distinct from status and icon actions expose keyboard tooltips', async ({ page }) => {
  await page.goto(route);
  const colors = await page.locator('.al-tree-row').evaluateAll(nodes => [1, 2, 3].map(level => {
    const row = nodes.find(node => node.getAttribute('aria-level') === String(level));
    return [getComputedStyle(row.querySelector('.al-level')).color, getComputedStyle(row.querySelector('.al-agent-icon')).backgroundColor];
  }));
  expect(new Set(colors.map(pair => pair[0])).size).toBe(3);
  colors.forEach(pair => expect(pair[0]).toBe(pair[1]));
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  await edit.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Edit');
  await edit.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await page.getByRole('button', { name: 'Send Password Reset Email', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toHaveText('Send Password Reset Email');
  const bounds = await page.getByRole('tooltip').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(1280);
});

test('pending reset email keeps its original provider even after switching context', async ({ page }) => {
  await page.addInitScript(() => {
    window.mailRequests = [];
    window.PaywizardAgentServices = { sendPasswordResetEmail(request) {
      window.mailRequests.push(request);
      return new Promise(resolve => { window.finishMail = resolve; });
    } };
  });
  await page.goto(route);
  await chooseProvider(page, '1045', 'Noctoptics · 1045');
  await page.getByRole('button', { name: 'Send Password Reset Email', exact: true }).click();
  await expect(page.locator('#confirmMessage')).toContainText('agent.1045.1@example.com');
  await page.getByRole('button', { name: 'Send Email', exact: true }).click();
  await chooseProvider(page, '1002', 'wizarpos · 1002');
  await page.evaluate(() => window.finishMail());
  await expect(page.locator('#detailNotice')).toBeHidden();
  expect(await page.evaluate(() => window.mailRequests)).toEqual([{ providerId: '1045', agentId: 'sp-1045-agent-0', email: 'agent.1045.1@example.com' }]);
  await chooseProvider(page, '1045', 'Noctoptics · 1045');
  await expect(page.locator('#detailNotice')).toContainText('agent.1045.1@example.com');
});
