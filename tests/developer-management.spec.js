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

async function addProviders(page, names) {
  await page.getByRole('button', {name:'Add Service Providers',exact:true}).click();
  for (const name of names) await dialog(page).getByRole('checkbox', {name:'Select service provider '+name,exact:true}).check();
  await page.screenshot({path:'docs/validation/developer-management/add-service-providers.png'});
  await dialog(page).getByRole('button', {name:'Add Selected',exact:true}).click();
}

test('Maintain entry, compact layout, exact email search, pagination and keyboard menu', async ({ page }) => {
  await page.goto(list);
  await expect(page.getByRole('button', { name: 'Operations', exact: true })).toHaveAttribute('aria-expanded', 'true');
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

test('create and edit use pages, validate URLs and IPs, support multi-provider scopes and preserve unsaved changes', async ({ page }) => {
  await page.goto(list); await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page).toHaveURL(/50.developer_form.html$/);
  await page.getByRole('button', { name: 'Create Developer', exact: true }).click();
  await expect(page.locator('#dmError')).toBeFocused();
  await page.locator('#dmField-name').fill('Atlas Integration');
  await page.locator('#dmField-email').fill('atlas.integration@example.com');
  await addProviders(page, ['Northstar Payments','wizarpos']);
  await page.getByRole('checkbox', { name: 'All merchants for wizarpos', exact: true }).uncheck();
  await page.locator('#dmField-ips').fill('192.0.2.10,192.0.2.10');
  await page.getByRole('checkbox', { name: 'Transaction results', exact: true }).check();
  await page.locator('#dmField-notifyUrl').fill('not-a-url');
  await page.getByRole('button', { name: 'Create Developer', exact: true }).click();
  await expect(page.locator('#dmFieldError-name')).toContainText('already exists');
  await expect(page.locator('#dmFieldError-ips')).toContainText('duplicate');
  await expect(page.locator('#dmFieldError-notifyUrl')).toContainText('valid HTTP');
  await page.locator('#dmField-name').fill('Review Integration');
  await page.locator('#dmField-email').fill('review.integration@example.com');
  await page.locator('#dmField-ips').fill('192.0.2.100, 198.51.100.10');
  await page.locator('#dmField-notifyUrl').fill('https://example.com/transactions');
  await page.getByRole('checkbox', { name: 'Terminal token', exact: true }).check();
  await expect(page.locator('#dmError')).not.toBeVisible();
  await expect(page.locator('#dmIpEditor')).toHaveCSS('border-bottom-color','rgb(217, 221, 227)');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:1710,height:1360});
  await page.screenshot({path:'docs/validation/developer-management/add-developer-page.png'});
  await page.setViewportSize({width:1280,height:720});
  await page.getByRole('button', { name: 'Create Developer', exact: true }).click();
  await expect(page).toHaveURL(/50.developer_manage.html$/);
  const saved = await read(page), created = saved.accounts.find(a => a.name === 'Review Integration');
  expect(created).toMatchObject({providerScopes:[{providerId:'provider-northstar',allMerchants:true},{providerId:'sp-wizardpos',allMerchants:false}],terminalAuto:true,ecommAuto:false,notifyEnabled:true,verify:true,ips:['192.0.2.100','198.51.100.10']});
  const ids = saved.bindings.filter(b => b.clientId === created.id).map(b => b.entityId);
  expect(ids).toEqual(expect.arrayContaining(['provider-northstar','agent-maple','agent-maple-east','merchant-maple','merchant-northstar','sp-wizardpos']));
  expect(ids.filter(id => id.startsWith('m-'))).toHaveLength(0);
  expect(saved.deliveries).toHaveLength(1);
  await page.getByRole('button', { name: 'Edit Review Integration', exact: true }).click();
  await expect(page.locator('#dmField-name')).toHaveAttribute('readonly', '');
  await expect(page.locator('#dmField-email')).toHaveAttribute('readonly', '');
  await page.locator('#dmField-company').fill('Updated company');
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#dmConfirm')).toContainText('Discard unsaved changes?');
  await accept(page, 'Continue Editing');
  await expect(page.locator('#dmField-company')).toHaveValue('Updated company');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveURL(/50.developer_manage.html$/);
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
  const initial = await read(page), existing = initial.bindings.filter(b => b.clientId === firstId);
  await page.getByRole('button', { name: /^Bind (Merchant|Plat)$/ }).click();
  await expect(dialog(page).locator('.dm-selection-tools,.dm-selected-chips,#dmSelectedOnly,#dmClearSelected')).toHaveCount(0);
  const locked = page.locator('#dmCandidates input:disabled');
  expect(await locked.count()).toBeGreaterThan(0);
  await expect(page.locator('#dmCandidates input:disabled:not(:checked)')).toHaveCount(0);
  expect(await page.locator('.dm-candidate-table th').first().evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(23, 24, 28)');
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.locator('#dmDialogError')).toBeFocused();
  const choices = page.locator('#dmCandidates input:not(:disabled)');
  const first = await choices.first().getAttribute('data-candidate');
  await choices.first().check();
  await choose(page, 'Candidate rows per page', '10');
  await page.getByRole('button', { name: 'Next candidate page', exact: true }).click();
  await expect(page.locator('#dmCandidatePageCount')).toHaveText('Page 2 of 2');
  await page.getByRole('button', { name: 'First candidate page', exact: true }).click();
  await expect(page.locator(`#dmCandidates input[data-candidate="${first}"]`)).toBeChecked();
  await choose(page, 'Candidate rows per page', '20');
  await page.getByRole('searchbox', { name: 'Candidate Name', exact: true }).fill('nothing matches');
  await page.getByRole('button', { name: 'Search candidates', exact: true }).click();
  await expect(page.locator('#dmCandidates')).toContainText('No accounts found.');
  await page.getByRole('button', { name: 'Reset candidate filters', exact: true }).click();
  await expect(page.locator(`#dmCandidates input[data-candidate="${first}"]`)).toBeChecked();
  await page.locator(`#dmCandidates input[data-candidate="${first}"]`).uncheck();
  await page.getByRole('checkbox', { name: 'Select all available results', exact: true }).check();
  await expect(page.locator('#dmCandidates input:disabled:not(:checked)')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Select all available results', exact: true }).uncheck();
  await expect(page.locator('#dmCandidates input:checked:not(:disabled)')).toHaveCount(0);
  await expect(page.locator('#dmCandidates input:disabled:not(:checked)')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Select all available results', exact: true }).check();
  const count = await page.locator('#dmCandidates input:checked:not(:disabled)').count(); expect(count).toBeGreaterThan(1);
  await expect(page.locator('.dm-candidate-table thead th')).toHaveText(['','PAYWIZARD ID','SERVICE PROVIDER','MERCHANT NAME']);
  await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible();
  const saved = await read(page), token = saved.tokens[first + ':terminal'], others = saved.bindings.filter(b => b.entityId === first && b.clientId !== firstId).length;
  expect(saved.bindings.length).toBe(initial.bindings.length + count);
  for (const binding of existing) expect(saved.bindings).toContainEqual(binding);
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
  await page.getByRole('button', { name: /^Bind (Merchant|Plat)$/ }).click();
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
  await expect(page.locator('#dmIpChips')).toContainText('192.0.2.10');
  await expect(page.locator('#dmIpChips')).toContainText('198.51.100.25');
  await page.getByRole('checkbox', { name: 'Verify request IP', exact: true }).uncheck();
  await expect(page.locator('#dmFieldWrap-ips')).toBeVisible();
  await expect(page.locator('#dmField-ips')).toBeDisabled();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveURL(/50.developer_manage.html$/);
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
  await page.goto(list); await expect(page.locator('.pw-platform-profile-label')).toHaveText('WizarPOS Maintain');
});

test('saving a previously opened edit cannot restore an old secret; platform token follows the shared reset flow', async ({ page }) => {
  await page.goto(list);
  await page.getByRole('button', { name: 'Edit Atlas Integration', exact: true }).click();
  const changed = await page.evaluate(id => window.PaywizardDeveloperStore.mutate('reset-secret', {clientId:id}).accounts.find(a => a.id === id).secret, firstId);
  await page.getByLabel('Company Name', { exact: true }).fill('Concurrent review');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click(); await expect(page).toHaveURL(/50.developer_manage.html$/);
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

test('low desktop form keeps provider dialog controls and focused validation inside the viewport', async ({ page }) => {
  await page.setViewportSize({width:1366,height:720}); await page.goto('/50.developer_form.html');
  await page.getByRole('button', {name:'Add Service Providers',exact:true}).click();
  const box = await dialog(page).boundingBox(); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(720);
  await dialog(page).getByRole('checkbox',{name:'Select service provider Northstar Payments',exact:true}).check();
  await dialog(page).getByRole('button',{name:'Add Selected',exact:true}).click();
  await page.getByRole('button', { name: 'Create Developer', exact: true }).click();
  await expect(page.locator('#dmError')).toBeFocused();
  const error = await page.locator('#dmError').boundingBox();
  expect(error.y).toBeGreaterThanOrEqual(90); expect(error.y + error.height).toBeLessThan(720);
  expect(await page.locator('#dmField-name').evaluate(e => ({height:e.getBoundingClientRect().height,top:getComputedStyle(e).borderTopWidth,bottom:getComputedStyle(e).borderBottomWidth,radius:getComputedStyle(e).borderRadius}))).toEqual({height:40,top:'0px',bottom:'1px',radius:'0px'});
});

test('multi-provider merchant selection retains choices across provider filters and prevents all-access exclusions', async ({ page }) => {
  await page.goto(list);
  await page.evaluate(id => {
    const store = window.PaywizardDeveloperStore, a = store.read().accounts.find(a => a.id === id);
    store.mutate('update', {clientId:id,input:{...a,providerScopes:[...a.providerScopes,{providerId:'provider-northstar',allMerchants:true}]}});
  }, firstId);
  await page.goto(`/50.developer_binding.html?client=${firstId}&kind=merchant`);
  const allRow = page.locator('tr[data-entity="merchant-maple"]');
  await expect(allRow).toContainText('Northstar Payments');
  await expect(allRow.getByRole('button', {name:/^Unbind /})).toHaveCount(0);
  await page.getByRole('button', {name:/^Bind (Merchant|Plat)$/}).click();
  await choose(page, 'Candidate Service Provider', 'Northstar Payments All merchants · managed automatically');
  await expect(page.locator('#dmCandidates input:not(:disabled)')).toHaveCount(0);
  await expect(page.locator('#dmCandidates input:disabled:not(:checked)')).toHaveCount(0);
  await expect(page.locator('#dmCandidates input:checked:disabled')).toHaveCount(2);
  await choose(page, 'Candidate Service Provider', 'wizarpos Selected merchants');
  const choice = page.locator('#dmCandidates input:not(:disabled)').first();
  const selectedId = await choice.getAttribute('data-candidate'); await choice.check();
  await choose(page, 'Candidate Service Provider', 'Northstar Payments All merchants · managed automatically');
  await expect(page.locator('#dmCandidates input:checked:disabled')).toHaveCount(2);
  await expect(dialog(page).locator('.dm-selection-tools,.dm-selected-chips')).toHaveCount(0);
  await page.screenshot({path:'docs/validation/developer-management/bind-merchant-multi-provider.png'});
  await page.getByRole('button',{name:'Reset candidate filters',exact:true}).click();
  await expect(page.locator(`[data-candidate="${selectedId}"]`)).toBeChecked();
  await page.screenshot({path:'docs/validation/developer-management/bind-merchant-selection.png'});
  const before = (await read(page)).deliveries.length;
  await dialog(page).getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(dialog(page)).not.toBeVisible();
  await expect(page.locator(`tr[data-entity="${selectedId}"]`)).toContainText('wizarpos');
  expect((await read(page)).deliveries).toHaveLength(before);
  const error = await page.evaluate(id => {try {window.PaywizardDeveloperStore.mutate('unbind',{clientId:id,entityId:'merchant-maple'});} catch(e) {return e.message;}},firstId);
  expect(error).toContain('Turn off All merchants');
});

test('all-to-selected retains current merchants; removing a provider confirms counts and revokes only its bindings', async ({ page }) => {
  await page.goto(list);
  await page.evaluate(id => {
    const s = window.PaywizardDeveloperStore, a = s.read().accounts.find(a => a.id === id);
    s.mutate('update',{clientId:id,input:{...a,providerScopes:[...a.providerScopes,{providerId:'provider-northstar',allMerchants:true}]}});
  },firstId);
  const before = await read(page), oldToken = before.tokens['merchant-maple:terminal'];
  await page.goto(`/50.developer_form.html?client=${firstId}`);
  await page.getByRole('checkbox',{name:'All merchants for Northstar Payments',exact:true}).uncheck();
  await page.getByRole('button',{name:'Save Changes',exact:true}).click();
  await expect(page).toHaveURL(/50.developer_manage.html$/);
  const selected = await read(page);
  expect(selected.bindings.filter(b => b.clientId === firstId)).toEqual(before.bindings.filter(b => b.clientId === firstId));
  expect(selected.deliveries).toHaveLength(0);
  await page.goto(`/50.developer_form.html?client=${firstId}`);
  await page.getByRole('button',{name:'Remove Northstar Payments',exact:true}).click();
  await page.getByRole('button',{name:'Save Changes',exact:true}).click();
  await expect(page.locator('#dmConfirm')).toContainText('2 merchants');
  await accept(page, 'Cancel');
  expect((await read(page)).accounts.find(a => a.id === firstId).providerScopes).toHaveLength(2);
  await page.getByRole('button',{name:'Save Changes',exact:true}).click(); await accept(page,'Save Changes');
  await expect(page).toHaveURL(/50.developer_manage.html$/);
  const removed = await read(page);
  expect(removed.bindings.filter(b => b.clientId === firstId).map(b => b.entityId)).not.toContain('merchant-maple');
  expect(removed.bindings.filter(b => b.clientId !== firstId)).toEqual(before.bindings.filter(b => b.clientId !== firstId));
  expect(removed.tokens['merchant-maple:terminal']).toBe(oldToken);
  await page.goto(`/50.developer_token.html?client=${firstId}&kind=merchant&entity=merchant-maple`);
  await expect(page.locator('#dmError')).toContainText('no longer bound');
});

test('new merchant events bind and email only all-access developers once, without backfilling existing merchants', async ({ page }) => {
  await page.goto(list);
  const result = await page.evaluate(id => {
    const s = window.PaywizardDeveloperStore, a = s.read().accounts.find(a => a.id === id);
    const input = {...a,terminalAuto:true,ecommAuto:false,providerScopes:[{providerId:'provider-northstar',allMerchants:true}]};
    s.mutate('update',{clientId:id,input});
    const selected = s.read().accounts.find(a => a.id !== id);
    s.mutate('update',{clientId:selected.id,input:{...selected,terminalAuto:true,ecommAuto:true,providerScopes:[{providerId:'provider-northstar',allMerchants:false}]}});
    const before = s.read().deliveries.length;
    s.entities.push({id:'merchant-future',parentId:'agent-maple-east',name:'Future Market',type:'merchant',enabled:true,mid:'DEMO-FUTURE'});
    const next = s.read(); const again = s.read();
    const all = next.accounts.find(a => a.id === id);
    s.mutate('update',{clientId:id,input:{...all,providerScopes:[{providerId:'provider-northstar',allMerchants:false}]}});
    s.entities.push({id:'merchant-later',parentId:'provider-northstar',name:'Later Market',type:'merchant',enabled:true,mid:'DEMO-LATER'});
    const manual = s.read();
    s.mutate('update',{clientId:id,input:{...manual.accounts.find(a => a.id === id),providerScopes:[{providerId:'provider-northstar',allMerchants:true}]}});
    return {before,newBindings:next.bindings.filter(b=>b.entityId==='merchant-future'),mail:next.deliveries.slice(before),again:again.deliveries.length,manual:manual.bindings.filter(b=>b.entityId==='merchant-later'&&b.clientId===id),after:s.read().deliveries.length};
  },firstId);
  expect(result.before).toBe(0);
  expect(result.newBindings).toHaveLength(1); expect(result.newBindings[0].clientId).toBe(firstId);
  expect(result.mail).toHaveLength(1); expect(result.mail[0]).toMatchObject({clientId:firstId,entityId:'merchant-future',tokenType:'terminal',simulated:true});
  expect(result.again).toBe(1); expect(result.manual).toHaveLength(0); expect(result.after).toBe(1);
});

test('legacy accounts migrate without expanding access, sending emails or changing shared credentials', async ({ page }) => {
  await page.goto(list); const before = await read(page);
  await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key)); state.version = 1; delete state.knownMerchantIds;
    state.accounts.forEach(a => {a.providerId=a.providerScopes[0].providerId;delete a.providerScopes;delete a.notifyEnabled;delete a.settleEnabled;});
    state.accounts[0].notifyUrl='https://example.com/notify'; localStorage.setItem(key,JSON.stringify(state));
  },key);
  await page.reload();
  const migrated = await read(page);
  expect(migrated.version).toBe(2);
  expect(migrated.accounts[0].providerScopes).toEqual([{providerId:'sp-wizardpos',allMerchants:false}]);
  expect(migrated.accounts[0].notifyEnabled).toBe(true);
  expect(migrated.bindings).toEqual(before.bindings); expect(migrated.tokens).toEqual(before.tokens); expect(migrated.deliveries).toEqual(before.deliveries);
});

test('failed page save retains fields and callback state; disabled webhooks retain URLs without validation', async ({ page }) => {
  await page.goto(`/50.developer_form.html?client=${firstId}`);
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).check();
  await page.locator('#dmField-notifyUrl').fill('https://example.com/notify');
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).uncheck();
  await page.locator('#dmField-company').fill('Retained company');
  await page.evaluate(key => {const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Quota exceeded','QuotaExceededError');return original.call(this,k,v);};},key);
  await page.getByRole('button',{name:'Save Changes',exact:true}).click();
  await expect(page.locator('#dmError')).toBeFocused();
  await expect(page.locator('#dmError')).toContainText('could not be saved');
  await expect(page.locator('#dmField-company')).toHaveValue('Retained company');
  await expect(page.locator('#dmField-notifyUrl')).toHaveValue('https://example.com/notify');
  expect((await read(page)).accounts[0].company).not.toBe('Retained company');
});

test('checkbox settings keep stable rows and disabled values; IP chips validate and remove individually', async ({ page }) => {
  await page.goto(`/50.developer_form.html?client=${firstId}`);
  const row = page.locator('.dm-settings-row').first();
  const before = await row.boundingBox();
  await expect(page.locator('#dmField-notifyUrl')).toBeVisible(); await expect(page.locator('#dmField-notifyUrl')).toBeDisabled();
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).check();
  await page.locator('#dmField-notifyUrl').fill('https://example.com/transaction');
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).uncheck();
  await expect(page.locator('#dmField-notifyUrl')).toBeDisabled();
  await expect(page.locator('#dmField-notifyUrl')).toHaveValue('https://example.com/transaction');
  const after = await row.boundingBox(); expect(after.height).toBe(before.height);
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).fill('198.51.100.20');
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).press('Enter');
  await expect(page.locator('#dmIpChips .dm-ip-chip')).toHaveCount(2);
  for (const name of ['Transaction results', 'Automatic settlements', 'Verify request IP']) {
    await expect(page.getByRole('checkbox',{name,exact:true})).toBeVisible();
    await expect(page.getByRole('switch',{name,exact:true})).toHaveCount(0);
  }
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).check();
  await page.locator('#dmField-notifyUrl').fill('https://example.com/webhooks/transactions');
  await page.getByRole('checkbox',{name:'Automatic settlements',exact:true}).check();
  await page.locator('#dmField-settleUrl').fill('https://example.com/webhooks/settlements');
  await page.getByRole('checkbox',{name:'Automatic settlements',exact:true}).uncheck();
  await expect(page.locator('#dmFieldWrap-settleUrl .pc-required')).toBeHidden();
  await expect(page.locator('#dmField-settleUrl')).toBeDisabled();
  await page.locator('[aria-labelledby="dmWebhookTitle"]').evaluate(e=>e.scrollIntoView({block:'start'}));
  const webhooks=await page.locator('[aria-labelledby="dmWebhookTitle"]').boundingBox();
  const allowlist=await page.locator('[aria-labelledby="dmIpTitle"]').boundingBox();
  await page.screenshot({path:'docs/validation/developer-management/checkbox-settings-page.png'});
  await page.screenshot({path:'docs/validation/developer-management/checkbox-settings.png',clip:{x:webhooks.x,y:webhooks.y,width:webhooks.width,height:allowlist.y+allowlist.height-webhooks.y}});
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).uncheck();
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).check();
  await page.locator('#dmField-notifyUrl').fill('https://example.com/transaction');
  await page.getByRole('checkbox',{name:'Transaction results',exact:true}).uncheck();
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).fill('192.0.2.10');
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).press('Enter');
  await expect(page.locator('#dmFieldError-ips')).toContainText('duplicate');
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).fill('999.1.1.1');
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).press('Enter');
  await expect(page.locator('#dmFieldError-ips')).toContainText('valid IPv4');
  await page.getByRole('textbox',{name:'Add IP address',exact:true}).fill('');
  await page.getByRole('button',{name:'Remove IP 192.0.2.10',exact:true}).click();
  await page.getByRole('checkbox',{name:'Terminal token',exact:true}).check();
  await expect(page.getByRole('switch',{name:'Terminal token',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Save Changes',exact:true}).click(); await expect(page).toHaveURL(/50.developer_manage.html$/);
  const saved = (await read(page)).accounts.find(a=>a.id===firstId);
  expect(saved.ips).toEqual(['198.51.100.20']); expect(saved.notifyUrl).toBe('https://example.com/transaction'); expect(saved.notifyEnabled).toBe(false); expect(saved.terminalAuto).toBe(true);
});

test('Add service providers handles 50 records with a simplified table and retained choices', async ({ page }) => {
  await page.goto('/50.developer_form.html');
  await page.evaluate(() => {
    const s=window.PaywizardDeveloperStore;
    for(let n=1;n<=40;n++) {
      const p={id:'sp-scale-'+String(n).padStart(2,'0'),name:'Provider '+String(n).padStart(2,'0'),parentId:'',type:'provider',enabled:n!==40};
      s.providers.push(p);s.entities.push(p);
    }
  });
  await page.getByRole('button',{name:'Add Service Providers',exact:true}).click();
  await expect(page.locator('#dmProviderCount')).toContainText('50 service providers');
  await expect(page.locator('#dmProviderCandidates tr')).toHaveCount(20);
  await expect(dialog(page).locator('.dm-selection-tools,.dm-selected-chips')).toHaveCount(0);
  await dialog(page).getByRole('checkbox',{name:'Select service provider wizarpos',exact:true}).check();
  await page.getByRole('button',{name:'Next service provider page',exact:true}).click();
  await dialog(page).getByRole('checkbox',{name:'Select service provider Provider 19',exact:true}).check();
  await page.getByRole('searchbox',{name:'SP Name',exact:true}).fill('Provider 39'); await page.getByRole('button',{name:'Search service providers',exact:true}).click();
  await dialog(page).getByRole('checkbox',{name:'Select service provider Provider 39',exact:true}).check();
  await page.getByRole('searchbox',{name:'SP Name',exact:true}).fill('Provider 19'); await page.getByRole('button',{name:'Search service providers',exact:true}).click();
  await expect(dialog(page).getByRole('checkbox',{name:'Select service provider Provider 19',exact:true})).toBeChecked();
  await dialog(page).getByRole('checkbox',{name:'Select service provider Provider 19',exact:true}).uncheck();
  await page.getByRole('button',{name:'Reset service provider filters',exact:true}).click();
  await expect(dialog(page).getByRole('checkbox',{name:'Select service provider wizarpos',exact:true})).toBeChecked();
  await dialog(page).getByRole('button',{name:'Add Selected',exact:true}).click();
  await expect(page.locator('#dmProviderRows tr')).toHaveCount(2);
  await page.getByRole('button',{name:'Add Service Providers',exact:true}).click();
  await expect(dialog(page).getByRole('checkbox',{name:'Select service provider wizarpos',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Last service provider page',exact:true}).click();
  await expect(dialog(page).getByRole('checkbox',{name:'Select service provider Provider 40',exact:true})).toBeDisabled();
  await dialog(page).getByRole('checkbox',{name:'Select service provider Provider 38',exact:true}).check();
  await dialog(page).getByRole('button',{name:'Cancel',exact:true}).click(); await accept(page,'Discard Changes');
  await expect(page.locator('#dmProviderRows tr')).toHaveCount(2);
});

test('service provider catalog matches the management page and new provider platform tokens work without altering old bindings', async ({ page }) => {
  await page.goto('/21.service_provider.html');
  const displayed = await page.getByRole('table',{name:'Service provider list',exact:true}).locator('tbody tr').evaluateAll(rows=>rows.map(r=>[...r.querySelectorAll('td')].slice(0,3).map(c=>c.textContent.trim())));
  expect(displayed).toHaveLength(8);
  await page.goto('/50.developer_form.html');
  const before=await read(page);
  await page.getByRole('button',{name:'Add Service Providers',exact:true}).click();
  await expect(page.locator('#dmProviderCandidates tr')).toHaveCount(10);
  for(const [id,name,count] of displayed) {
    const row=page.locator(`#dmProviderCandidates tr:has([data-provider-candidate="${id}"])`);
    await expect(row.locator('td').nth(2)).toContainText(name);
    await expect(row.locator('td').nth(3)).toHaveText(count);
  }
  await dialog(page).getByRole('checkbox',{name:'Select service provider Techsupport',exact:true}).check();
  await page.screenshot({path:'docs/validation/developer-management/add-service-providers.png'});
  await dialog(page).getByRole('button',{name:'Add Selected',exact:true}).click();
  await expect(page.locator('#dmProviderRows button .material-symbols-rounded')).toHaveText('delete');
  await page.locator('#dmField-name').fill('Catalog Integration');await page.locator('#dmField-email').fill('catalog.integration@example.com');
  await page.getByRole('checkbox',{name:'Verify request IP',exact:true}).uncheck();
  await page.getByRole('button',{name:'Create Developer',exact:true}).click();await expect(page).toHaveURL(/50.developer_manage.html$/);
  const after=await read(page), created=after.accounts.find(a=>a.name==='Catalog Integration');
  expect(after.bindings.filter(b=>b.clientId!==created.id)).toEqual(before.bindings);
  await page.goto(`/50.developer_token.html?client=${created.id}&kind=plat&entity=1053`);
  await expect(page.locator('.dm-token-panel')).toHaveCount(1);
  await expect(page.locator('#dmError')).not.toBeVisible();
});

test('binding heading aligns name, removes edit shortcut and uses the original Bind Merchant label and file-plus icon', async ({ page }) => {
  await page.goto(`/50.developer_binding.html?client=${firstId}&kind=merchant`);
  await expect(page.getByRole('link',{name:'Edit service providers',exact:true})).toHaveCount(0);
  const bind=page.getByRole('button',{name:'Bind Merchant',exact:true});await expect(bind.locator('.material-symbols-rounded')).toHaveText('note_add');
  const diff=await page.locator('.dm-title-copy').evaluate(root=>{const bounds=node=>{const range=document.createRange();range.selectNodeContents(node);return range.getBoundingClientRect();};return Math.abs(bounds(root.querySelector('h1')).bottom-bounds(root.querySelector('.dm-object-name')).bottom);});
  expect(diff).toBeLessThanOrEqual(5);
});

test('success toast is fixed at top right, pauses on hover and can be dismissed', async ({ page }) => {
  await page.clock.install();await page.goto(list);
  await more(page,'Resend Email');await accept(page);await page.clock.runFor(200);
  const toast=page.locator('#dmFeedback .dm-toast').first();await expect(toast).toContainText('Success');
  const rect=await page.locator('#dmFeedback').boundingBox();expect(rect.y).toBe(20);expect(rect.x+rect.width).toBe(1260);
  expect(await page.locator('#dmFeedback').evaluate(e=>e.parentElement.tagName)).toBe('BODY');
  await toast.hover();await page.clock.runFor(5000);await expect(toast).toBeVisible();
  await page.screenshot({path:'docs/validation/developer-management/success-toast.png'});
  await page.mouse.move(10,10);await page.clock.runFor(201);await page.clock.runFor(2800);await expect(toast).toBeVisible();
  await page.clock.runFor(400);await expect(page.locator('#dmFeedback')).not.toBeVisible();
  await more(page,'Resend Email');await accept(page);await page.clock.runFor(200);
  await page.getByRole('button',{name:'Close notification',exact:true}).click();await expect(page.locator('#dmFeedback')).not.toBeVisible();
});
