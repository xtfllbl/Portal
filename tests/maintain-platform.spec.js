const {test, expect} = require('@playwright/test');
const profileKey = 'paywizard.portalAccessProfile.v1';
test.use({reducedMotion:'reduce'});
const identity = page => page.locator('.pw-platform-profile-label');
const nav = page => page.locator('.pw-platform-nav');
async function switchTo(page, profile) {
  await page.locator('[data-pw-profile-trigger]').click();
  await page.locator(`[data-pw-profile="${profile}"]`).click();
  await expect(identity(page)).toHaveText(profile === 'maintain' ? 'WizarPOS Maintain' : profile === 'wizarpos' ? 'WizarPOS Provider' : 'Billing-only Merchant');
}

test('platform switch retains a shared page, persists identity and separates the four menu groups', async ({page}) => {
  await page.goto('/12.transaction_list.html?demo=preserved');
  await expect(nav(page).getByRole('button', {name:'Maintain',exact:true})).toHaveCount(0);
  await switchTo(page, 'maintain');
  await expect(page).toHaveURL(/12.transaction_list.html\?demo=preserved$/);
  await expect(nav(page).locator('[data-pw-menu-toggle]')).toHaveText(['account_balance_walletPaymentexpand_more','tuneOperationsexpand_more','redeemPrepaid Cardsexpand_more','settingsSystemexpand_more']);
  await expect(page.locator('.pw-platform-breadcrumb')).toHaveText('Paymentchevron_rightTransactions');
  await page.reload(); await expect(identity(page)).toHaveText('WizarPOS Maintain');
  await switchTo(page, 'wizarpos');
  await expect(page).toHaveURL(/12.transaction_list.html\?demo=preserved$/);
  await expect(nav(page).locator('[data-pw-menu-toggle="matintain"]')).toHaveCount(0);
  await expect(nav(page).getByRole('link',{name:'Developer Manage',exact:true})).toHaveCount(0);
});

test('formal unavailable menus are inert; extensions and enabled menu destinations are complete', async ({page}) => {
  await page.goto('/50.developer_manage.html');
  await expect(nav(page).locator('.pw-platform-sub-item')).toHaveCount(32);
  await expect(nav(page).locator('[aria-disabled="true"]')).toHaveCount(15);
  for (const group of ['payment','operations','prepaid','system']) {
    await page.locator(`[data-pw-menu-toggle="${group}"]`).click();
    if (await page.locator(`[data-pw-menu="${group}"]`).isHidden()) await page.locator(`[data-pw-menu-toggle="${group}"]`).click();
    const disabled = page.locator(`[data-pw-menu="${group}"] [aria-disabled="true"]`);
    for (const item of await disabled.all()) {
      const url = page.url(); await item.click({force:true}); expect(page.url()).toBe(url);
      expect(await item.evaluate(el => el.tabIndex)).toBe(-1);
      await expect(item).not.toHaveAttribute('href');
    }
  }
  await expect(nav(page).locator('[data-pw-menu="system"] .pw-platform-sub-item')).toHaveText(['Role Permission','Email Configuration','Terminal Logs','Err Txn Logs','Account Management','Log Management','Password Rule Config','Reginal','Currency Settings','Billing Setup','Var Push Log','Appeals']);
  await expect(nav(page).locator('[data-pw-menu="prepaid"] a')).toHaveText(['Card List']);
  const routes = await nav(page).locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    await page.goto('/' + route);
    await expect(identity(page)).toHaveText('WizarPOS Maintain');
    await expect(nav(page).locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.pw-platform-content')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('old operations addresses select Maintain and switching out lands on the correct default', async ({page}) => {
  for (const route of ['47.payment_channel.html','49.parameter_pool.html','41.billing_setup.html','44.billing_overview.html','32.sla_alert_rules.html','21.service_provider.html','50.developer_manage.html','3.Processor_template_new.html','48.impersonate.html']) {
    await page.goto('/12.transaction_list.html');
    await page.evaluate(key => localStorage.setItem(key,'full-service'), profileKey);
    await page.goto('/' + route);
    await expect(identity(page)).toHaveText('WizarPOS Maintain');
    expect(await page.evaluate(key => localStorage.getItem(key), profileKey)).toBe('maintain');
  }
  await switchTo(page, 'wizarpos'); await expect(page).toHaveURL(/12.transaction_list.html$/);
  await page.goto('/44.billing_overview.html');
  await switchTo(page, 'billing-merchant'); await expect(page).toHaveURL(/42.billing_payments.html$/);
  await switchTo(page, 'maintain'); await expect(page).toHaveURL(/12.transaction_list.html$/);
});

test('Maintain branding survives stored Portal logos and delayed branding refreshes', async ({page}) => {
  await page.goto('/12.transaction_list.html');
  await page.evaluate(async () => {
    await window.paywizardBrandingReady;
    await window.PaywizardBranding.save({header:{file:new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="100" height="25"><rect width="100" height="25" fill="red"/></svg>'],{type:'image/svg+xml'})},terminal:null});
  });
  await expect(page.locator('.pw-platform-brand img')).toHaveAttribute('alt','System Header Logo');
  await switchTo(page, 'maintain');
  await page.evaluate(async () => { await window.paywizardBrandingReady; await window.PaywizardBranding.save(await window.PaywizardBranding.load()); });
  await expect(page.locator('.pw-platform-brand img')).toHaveAttribute('src','assets/paywizard-logo-email.png');
  await expect(page.locator('.pw-brand-platform')).toHaveText('MAINTAIN');
  await switchTo(page, 'wizarpos');
  await expect(page.locator('.pw-platform-brand img')).toHaveAttribute('alt','System Header Logo');
});

test('Customer Alerts uses operations context on shared and direct links, and restores Portal context', async ({page}) => {
  await page.goto('/50.developer_manage.html');
  await nav(page).getByRole('link',{name:'Customer Alerts',exact:true}).click();
  await expect(page.locator('[data-alert-owner-filter]')).toBeVisible();
  await switchTo(page, 'wizarpos');
  expect(new URL(page.url()).searchParams.get('role')).toBe(null);
  await expect(page.locator('[data-alert-owner-filter]')).toBeHidden();
  await switchTo(page, 'maintain');
  expect(new URL(page.url()).searchParams.get('role')).toBe('operations-manager');
  await page.goto('/39.customer_alerts.html');
  await expect(page.locator('[data-alert-owner-filter]')).toBeVisible();
});

test('Parameter Pool stays usable through merchant configuration, while Provider loses operations controls', async ({page}) => {
  await page.goto('/49.parameter_pool.html');
  await expect(page.locator('#poolRows tr')).not.toHaveCount(0);
  await page.goto('/5.merchant_add_device_iso.html');
  await expect(identity(page)).toHaveText('WizarPOS Maintain');
  await page.locator('#device-processor').selectOption('NUVEI UPT');
  await expect(page.locator('#parameterSourceInput')).toBeVisible();
  await switchTo(page, 'wizarpos');
  await expect(page.locator('#parameterSourceInput')).toHaveCount(0);
});

test('Impersonate opens the existing Portal identity and returns to the Maintain origin', async ({page,context}) => {
  await page.goto('/48.impersonate.html');
  await page.locator('#userSearch').fill('Alice');
  const targetEvent = context.waitForEvent('page');
  await page.getByRole('link',{name:'Impersonate Alice Chen (opens in new tab)'}).click();
  const target = await targetEvent;
  await expect(target.locator('.pw-impersonation-banner')).toContainText('Alice Chen');
  await expect(target.locator('.pw-platform-frame')).toHaveAttribute('data-platform','portal');
  expect(await target.evaluate(() => window.PaywizardAccessContext.profile())).toBe('full-service-merchant');
  expect(await page.evaluate(key => localStorage.getItem(key),profileKey)).toBe('maintain');
  await target.getByRole('button',{name:'End impersonation',exact:true}).click();
  await expect.poll(() => target.isClosed()).toBe(true);
  await expect(identity(page)).toHaveText('WizarPOS Maintain');
  await expect(page.locator('#userSearch')).toHaveValue('Alice');
});

test('Terminal Logs keeps the row identity, Maintain shell and working return link in details', async ({page}) => {
  await page.goto('/24.maintain_terminal_log.html');
  await page.getByRole('link',{name:'View MDB ERROR log',exact:true}).first().click();
  await expect(page).toHaveURL(/24.terminal_log_detail.html/);
  await expect(identity(page)).toHaveText('WizarPOS Maintain');
  await expect(page.locator('[data-log="sn"]')).toHaveText('WP2013Q321000014');
  await page.getByRole('link',{name:'Back to Terminal Logs'}).click();
  await expect(page.locator('#logTable')).toBeVisible();
  await expect(page.locator('[data-pw-menu-toggle="system"]')).toHaveAttribute('aria-expanded','true');
});

test('Portal retains its three prepaid operation pages while Maintain hides all cross-page entries and rejects direct access', async ({page}) => {
  const portalOnly = ['15.prepaid_card_activation.html#import','16.prepaid_credit_adjustment.html?cardUid=04A37C91B25F80','17.prepaid_loss_replacement.html?cardUid=04A37C91B25F80'];
  const operationLinks = 'a[href*="15.prepaid_card_activation.html"], a[href*="16.prepaid_credit_adjustment.html"], a[href*="17.prepaid_loss_replacement.html"]';
  await page.goto('/14.prepaid_card_list.html');
  await expect(nav(page).locator('[data-pw-menu="prepaid"] a')).toHaveText(['Card List','Activation','Balance Adjustment','Loss & Replacement']);
  await expect(page.getByRole('link',{name:'Add New Card',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Import Cards',exact:true})).toBeVisible();
  await switchTo(page,'maintain');
  await expect(page).toHaveURL(/14.prepaid_card_list.html$/);
  await expect(nav(page).locator('[data-pw-menu="prepaid"] a')).toHaveText(['Card List']);
  await expect(page.locator('.pw-platform-content').locator(operationLinks)).toHaveCount(0);
  await expect(page.locator('.pw-platform-content details.action-menu')).toHaveCount(0);
  await page.locator('.pw-platform-content a[href="19.prepaid_card_detail.html"]').first().click();
  await expect(identity(page)).toHaveText('WizarPOS Maintain');
  await expect(page.locator('.pw-platform-content').locator(operationLinks)).toHaveCount(0);
  await switchTo(page,'wizarpos');
  await expect(page).toHaveURL(/19.prepaid_card_detail.html$/);
  await expect(page.locator('.pw-platform-content a[href="16.prepaid_credit_adjustment.html"]')).toHaveCount(1);
  for (const route of portalOnly) {
    await page.goto('/' + route);
    expect(new URL(page.url()).pathname).toBe('/' + route.split(/[?#]/)[0]);
    await expect(identity(page)).toHaveText('WizarPOS Provider');
    await switchTo(page,'maintain');
    await expect(page).toHaveURL(/12.transaction_list.html$/);
    await page.goto('/' + route);
    await expect(page).toHaveURL(/12.transaction_list.html$/);
    await expect(identity(page)).toHaveText('WizarPOS Maintain');
    await switchTo(page,'wizarpos');
  }
});

test('Portal and Maintain appear in separate rows within a desktop viewport and support keyboard selection', async ({page}) => {
  await page.setViewportSize({width:1280,height:720});
  await page.goto('/50.developer_manage.html');
  await page.goto('/13.remote_control.html');
  await page.locator('[data-pw-menu-toggle="prepaid"]').click();
  await page.locator('[data-pw-profile-trigger]').click();
  const portal = page.locator('.pw-profile-platform[aria-label="PORTAL"]');
  const maintain = page.locator('.pw-profile-platform[aria-label="MAINTAIN"]');
  await expect(portal.locator('.pw-platform-profile-heading')).toHaveText('PORTAL');
  await expect(maintain.locator('.pw-platform-profile-heading')).toHaveText('MAINTAIN');
  await expect(portal.locator('.pw-platform-profile-column')).toHaveCount(3);
  await expect(portal.locator('[data-pw-profile]')).toHaveCount(10);
  await expect(maintain.locator('[data-pw-profile]')).toHaveCount(1);
  const top = await portal.boundingBox(), bottom = await maintain.boundingBox();
  expect(bottom.y).toBeGreaterThanOrEqual(top.y + top.height);
  const menu = page.locator('[data-pw-profile-menu]');
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {}))));
  await page.screenshot({path:'artifacts/maintain-platform-two-rows.png'});
  const box = await menu.boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(1280);
  const option = page.locator('[data-pw-profile="wizarpos"]'); await option.focus(); await option.press('End');
  await expect(page.locator('[data-pw-profile="maintain"]')).toBeFocused();
  await page.locator('[data-pw-profile="maintain"]').press('Escape');
  await expect(menu).toBeHidden(); await expect(page.locator('[data-pw-profile-trigger]')).toBeFocused();
});
