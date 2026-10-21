const { test, expect } = require('@playwright/test');
const list = '/50.developer_manage.html';
const key = 'paywizard.maintain.developers.v1';
const firstId = '109325696455057696';
const dialog = page => page.locator('#dmDialog');
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
async function choose(page, label, value) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.locator('.pc-picker-panel:popover-open').getByRole('option', { name: value, exact: true }).click();
}
async function more(page, action, name = 'Atlas Integration') {
  await page.getByRole('button', { name: `More actions for ${name}`, exact: true }).click();
  await page.getByRole('menuitem', { name: action, exact: true }).click();
}
async function accept(page, name = 'Confirm') {
  await page.locator('#dmConfirm').getByRole('button', { name, exact: true }).click();
}

test('Maintain entry, compact layout, exact email search, pagination and keyboard menu', async ({ page }) => {
  await page.goto(list);
  await expect(page.getByRole('button', { name: 'Maintain', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Developer Manage', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Developer accounts' }).locator('tbody tr')).toHaveCount(20);
  expect(await page.locator('thead th').first().evaluate(e => ({height:e.getBoundingClientRect().height,font:getComputedStyle(e).fontSize}))).toEqual({height:34,font:'11px'});
  expect(await page.getByRole('button', { name: 'Edit Atlas Integration', exact: true }).evaluate(e => e.getBoundingClientRect().height)).toBe(36);
  await page.getByRole('button', { name: 'Show Client Secret for Atlas Integration' }).click();
  await expect(page.getByRole('button', { name: 'Hide Client Secret for Atlas Integration' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('searchbox', { name: 'Email', exact: true }).fill('atlas');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('No developers found.');
  await page.getByRole('searchbox', { name: 'Email', exact: true }).fill('atlas.integration@example.com');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'More actions for Atlas Integration' }).click();
  await page.getByRole('menuitem', { name: 'Resend Email', exact: true }).press('End');
  await expect(page.getByRole('menuitem', { name: 'Allowlist', exact: true })).toBeFocused();
  await page.getByRole('menuitem', { name: 'Allowlist', exact: true }).press('Escape');
  await expect(page.getByRole('button', { name: 'More actions for Atlas Integration' })).toBeFocused();
});

test('create validates, searches modal provider, auto binds, persists and locks identity on edit', async ({ page }) => {
  await page.goto(list);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmDialogError')).toBeFocused();
  await page.getByLabel('Developer Name*', { exact: true }).fill('Atlas Integration');
  await page.getByLabel('Email*', { exact: true }).fill('atlas.integration@example.com');
  await page.getByRole('combobox', { name: 'Service Provider', exact: true }).click();
  const search = page.getByRole('combobox', { name: 'Search Service Provider', exact: true });
  await search.fill('north'); await search.press('ArrowDown'); await search.press('Enter');
  await expect(page.getByRole('combobox', { name: 'Service Provider', exact: true })).toContainText('Northstar Payments');
  await page.getByLabel('IP', { exact: true }).fill('192.0.2.10,192.0.2.10');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmFieldError-name')).toContainText('already exists');
  await expect(page.locator('#dmFieldError-ips')).toContainText('duplicate');
  await page.getByLabel('Developer Name*', { exact: true }).fill('Review Integration');
  await page.getByLabel('Email*', { exact: true }).fill('review.integration@example.com');
  await page.getByLabel('IP', { exact: true }).fill('192.0.2.100, 198.51.100.10');
  await choose(page, 'Terminal auto send new merchant token by email', 'Yes');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  const saved = await read(page), created = saved.accounts.find(a => a.name === 'Review Integration');
  expect(created).toMatchObject({providerId:'provider-northstar',terminalAuto:true,ecommAuto:false,verify:true,ips:['192.0.2.100','198.51.100.10']});
  expect(saved.bindings.filter(b => b.clientId === created.id).map(b => b.entityId).sort()).toEqual(['provider-northstar','agent-maple','agent-maple-east','merchant-maple','merchant-northstar'].sort());
  expect(saved.deliveries.at(-1)).toMatchObject({clientId:created.id,email:created.email,kind:'client-credentials',simulated:true});
  await page.getByRole('button', { name: 'Edit Review Integration', exact: true }).click();
  await expect(page.getByLabel('Developer Name*', { exact: true })).toHaveAttribute('readonly', '');
  await expect(page.getByLabel('Email*', { exact: true })).toHaveAttribute('readonly', '');
  await expect(page.getByRole('combobox', { name: 'Service Provider', exact: true })).toBeDisabled();
  await page.getByLabel('Company Name', { exact: true }).fill('Updated company');
  await dialog(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#dmConfirm')).toContainText('Discard unsaved changes?');
  await accept(page, 'Continue Editing');
  await expect(page.getByLabel('Company Name', { exact: true })).toHaveValue('Updated company');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  await page.reload();
  expect((await read(page)).accounts.find(a => a.id === created.id).company).toBe('Updated company');
});

test('resend leaves secret unchanged; reset replaces it and simulates credentials email', async ({ page }) => {
  await page.goto(list); const initial = await read(page);
  await more(page, 'Resend Email'); await accept(page);
  await expect(page.locator('#dmFeedback')).toContainText('no email was sent');
  expect((await read(page)).accounts[0].secret).toBe(initial.accounts[0].secret);
  await more(page, 'Reset Secret'); await page.locator('#dmConfirm').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect((await read(page)).accounts[0].secret).toBe(initial.accounts[0].secret);
  await more(page, 'Reset Secret'); await accept(page);
  await expect(page.locator('#dmFeedback')).toContainText('Client Secret reset');
  const saved = await read(page); expect(saved.accounts[0].secret).not.toBe(initial.accounts[0].secret); expect(saved.deliveries).toHaveLength(2);
});

test('merchant binding retains multi selection through searches, permits shared accounts and unbinds one relation', async ({ page }) => {
  await page.goto(`/50.developer_binding.html?client=${firstId}&kind=merchant`);
  await page.getByRole('button', { name: 'Bind', exact: true }).click();
  expect(await page.locator('.dm-candidate-table th').first().evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(23, 24, 28)');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmDialogError')).toBeFocused();
  const choices = page.locator('#dmCandidates input:not(:disabled)');
  const first = await choices.first().getAttribute('data-candidate');
  await choices.first().check();
  await choose(page, 'Candidate rows per page', '10');
  await page.getByRole('button', { name: 'Next candidate page', exact: true }).click();
  await expect(page.locator('#dmCandidatePageCount')).toHaveText('Page 2 of 2');
  await expect(page.locator('#dmSelectedOnly')).toHaveText('Selected (1)');
  await page.getByRole('button', { name: 'First candidate page', exact: true }).click();
  await expect(page.locator(`#dmCandidates input[data-candidate="${first}"]`)).toBeChecked();
  await choose(page, 'Candidate rows per page', '20');
  await page.getByRole('searchbox', { name: 'Candidate Name', exact: true }).fill('nothing matches');
  await page.getByRole('button', { name: 'Search candidates', exact: true }).click();
  await expect(page.locator('#dmSelectedOnly')).toHaveText('Selected (1)');
  await page.getByRole('button', { name: 'Reset candidate filters', exact: true }).click();
  await page.locator(`#dmCandidates input[data-candidate="${first}"]`).uncheck();
  await page.getByRole('checkbox', { name: 'Select all available results', exact: true }).check();
  const count = await page.locator('#dmCandidates input:checked').count(); expect(count).toBeGreaterThan(1);
  await page.getByRole('button', { name: `Selected (${count})`, exact: true }).click();
  await expect(page.locator('#dmCandidates input:disabled')).toHaveCount(0);
  await expect(page.locator('#dmCandidates')).toContainText('Available ·');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  const saved = await read(page), token = saved.tokens[first + ':terminal'], others = saved.bindings.filter(b => b.entityId === first && b.clientId !== firstId).length;
  const row = page.locator(`tr[data-entity="${first}"]`);
  await row.getByRole('button', { name: /^Unbind / }).click(); await accept(page, 'Unbind');
  await expect(row).toHaveCount(0);
  const after = await read(page);
  expect(after.tokens[first + ':terminal']).toBe(token);
  expect(after.bindings.filter(b => b.entityId === first && b.clientId !== firstId)).toHaveLength(others);
});

test('platform candidates stay in provider scope, require selection and allow one per submission', async ({ page }) => {
  await page.goto(`/50.developer_binding.html?client=${firstId}&kind=plat`);
  const before = await read(page);
  await page.getByRole('button', { name: 'Bind', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmDialogError')).toContainText('Select a platform');
  await expect(page.locator('#dmCandidates')).not.toContainText('Northstar Payments');
  const candidate = page.locator('#dmCandidates input:not(:disabled)').first();
  await candidate.check(); await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  const after = await read(page); expect(after.bindings.length).toBe(before.bindings.length + 1);
});

test('allowlist validates both entry points, protects final IP and retains saved addresses when disabled', async ({ page }) => {
  await page.goto(`/50.developer_allowlist.html?client=${firstId}`);
  await page.getByRole('button', { name: 'Delete 192.0.2.10', exact: true }).click();
  await expect(page.locator('#dmError')).toBeFocused(); await expect(page.locator('tbody')).toContainText('192.0.2.10');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('IP*', { exact: true }).fill('999.1.1.1');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmFieldError-ip')).toContainText('valid IPv4');
  await page.getByLabel('IP*', { exact: true }).fill('192.0.2.10');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmFieldError-ip')).toContainText('duplicate');
  await page.getByLabel('IP*', { exact: true }).fill('198.51.100.25');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  await page.getByRole('link', { name: 'Back to Developer Manage', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Atlas Integration', exact: true }).click();
  await expect(page.getByLabel('IP', { exact: true })).toHaveValue('192.0.2.10, 198.51.100.25');
  await choose(page, 'Verify Allowlist', 'No');
  await expect(page.locator('#dmFieldWrap-ips')).not.toBeVisible();
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  await more(page, 'Allowlist');
  for (const ip of ['192.0.2.10', '198.51.100.25']) {
    await page.getByRole('button', { name: `Delete ${ip}`, exact: true }).click(); await accept(page, 'Delete');
    await expect(page.getByRole('button', { name: `Delete ${ip}`, exact: true })).toHaveCount(0);
  }
  await expect(page.locator('tbody')).toContainText('No IP addresses found.');
});

test('token reset is shared across developers and sending remains a separate local operation', async ({ page }) => {
  await page.goto(list); const before = await read(page);
  const entity = before.bindings.find(b => b.clientId === firstId && b.entityId.startsWith('m-')).entityId;
  const other = before.bindings.find(b => b.entityId === entity && b.clientId !== firstId).clientId;
  await page.goto(`/50.developer_token.html?client=${firstId}&kind=merchant&entity=${entity}`);
  await expect(page.locator('.dm-token-panel')).toHaveCount(2);
  await page.locator('[data-reset-token="terminal"]').click();
  await expect(page.locator('#dmConfirm')).toContainText('for all users');
  await accept(page, 'Reset'); await expect(page.locator('#dmFeedback')).toContainText('all associated developers');
  const after = await read(page); expect(after.tokens[entity + ':terminal']).not.toBe(before.tokens[entity + ':terminal']); expect(after.deliveries).toHaveLength(0);
  await page.goto(`/50.developer_token.html?client=${other}&kind=merchant&entity=${entity}`);
  await page.getByRole('button', { name: 'Show Terminal Token', exact: true }).click();
  await expect(page.locator('.dm-token-panel').filter({ has: page.locator('[data-send-token="terminal"]') }).locator('code')).toHaveText(after.tokens[entity + ':terminal']);
  await page.locator('[data-send-token="terminal"]').click(); await accept(page, 'Send');
  await expect(page.locator('#dmFeedback')).toContainText('no email was sent');
  expect((await read(page)).deliveries.at(-1)).toMatchObject({clientId:other,kind:'token',tokenType:'terminal'});
});

test('write failure retains input, surfaces focused error; malformed and non-operations routes are guarded', async ({ page }) => {
  await page.goto(`/50.developer_allowlist.html?client=${firstId}`);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('IP*', { exact: true }).fill('198.51.100.40');
  await page.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if (k === 'paywizard.maintain.developers.v1') throw new DOMException('Quota exceeded','QuotaExceededError'); return original.call(this,k,v); }; });
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmDialogError')).toBeFocused(); await expect(page.getByLabel('IP*', { exact: true })).toHaveValue('198.51.100.40');
  expect((await read(page)).accounts[0].ips).toEqual(['192.0.2.10']);
  page.on('dialog', d => d.accept()); await page.reload();
  await page.goto('/50.developer_token.html?client=missing&entity=missing');
  await expect(page.locator('#dmError')).toContainText('unavailable');
  await page.evaluate(() => localStorage.setItem('paywizard.portalAccessProfile.v1', 'full-service'));
  await page.goto(list); await expect(page).toHaveURL(/12\.transaction_list\.html/);
});

test('saving a previously opened edit cannot restore an old secret; platform token follows the shared reset flow', async ({ page }) => {
  await page.goto(list);
  await page.getByRole('button', { name: 'Edit Atlas Integration', exact: true }).click();
  const changed = await page.evaluate(id => window.PaywizardDeveloperStore.mutate('reset-secret', {clientId:id}).accounts.find(a => a.id === id).secret, firstId);
  await page.getByLabel('Company Name', { exact: true }).fill('Concurrent review');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click(); await expect(dialog(page)).not.toBeVisible();
  expect((await read(page)).accounts.find(a => a.id === firstId).secret).toBe(changed);
  await page.goto(`/50.developer_token.html?client=${firstId}&kind=plat&entity=sp-wizardpos`);
  await expect(page.locator('.dm-token-panel')).toHaveCount(1);
  const oldToken = (await read(page)).tokens['sp-wizardpos:platform'];
  await page.getByRole('button', { name: 'Reset', exact: true }).click(); await accept(page, 'Reset');
  await expect(page.locator('#dmFeedback')).toContainText('Shared Token reset');
  expect((await read(page)).tokens['sp-wizardpos:platform']).not.toBe(oldToken);
  await page.getByRole('button', { name: 'Send', exact: true }).click(); await accept(page, 'Send');
  await expect(page.locator('#dmFeedback')).toContainText('no email was sent');
  expect((await read(page)).deliveries.at(-1)).toMatchObject({clientId:firstId,entityId:'sp-wizardpos',tokenType:'platform'});
});

test('low desktop window keeps modal controls, dropdown search and focused errors inside the viewport', async ({ page }) => {
  await page.setViewportSize({width:1366,height:720}); await page.goto(list);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('combobox', { name: 'ECOMM auto send new merchant token by email', exact: true }).click();
  const panel = page.locator('.pc-picker-panel:popover-open');
  const box = await panel.boundingBox(); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(720);
  await panel.getByRole('combobox').fill('yes'); await panel.getByRole('combobox').press('Enter');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmDialogError')).toBeFocused();
  const error = await page.locator('#dmDialogError').boundingBox(); const header = await dialog(page).locator('header').boundingBox(); const footer = await dialog(page).locator('footer').boundingBox();
  expect(error.y).toBeGreaterThanOrEqual(header.y + header.height); expect(error.y + error.height).toBeLessThan(footer.y);
  await expect(dialog(page).getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
});
