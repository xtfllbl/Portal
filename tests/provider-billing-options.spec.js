const {test,expect}=require('@playwright/test');
test('provider workspace switches scope, supports search and keyboard, and distinguishes unconfigured providers',async({page})=>{
 await page.goto('/52.service_provider_billing_options.html?layout=a');await expect(page.locator('.pbo-main')).toContainText('Cantaloupe Inc');await expect(page.locator('.pbo-bills tbody tr')).toHaveCount(4);
 const count=await page.evaluate(()=>new Set([...PaywizardServiceProviderCatalog.records,...PaywizardProviderBilling.load().providers].map(p=>p.id)).size);await expect(page.getByRole('option')).toHaveCount(count+1);
 await page.getByRole('option',{name:/Techsupport/}).click();await expect(page.locator('.pbo-main')).toContainText('Techsupport');await expect(page.locator('.pbo-bills')).toContainText('EUR');
 await page.getByRole('option',{name:/Techsupport/}).press('Home');await expect(page.locator('.pbo-main h2')).toHaveText('All service providers');
 await page.getByRole('searchbox',{name:'Search service providers'}).fill('test1.2.0-test005');await page.getByRole('option',{name:/test1.2.0-test005/}).click();await expect(page.locator('.pbo-main')).toContainText('Fees not configured');await expect(page.getByRole('link',{name:'Set Up Fees'})).toHaveAttribute('href','52.service_fee_settings.html?provider=1052');
});
test('billing directory tree opens quarters and supports keyboard collapse and restore',async({page})=>{
 await page.goto('/52.service_provider_billing_options.html?layout=b');await expect(page.locator('.pbo-main')).toContainText('PB-2026Q3-1047');
 const leaf=page.locator('[data-tree-node="PB-2026Q1-1047"]');await leaf.click();await expect(page.locator('.pbo-main')).toContainText('PB-2026Q1-1047');await expect(page.locator('.pbo-main')).toContainText('Paid');
 await leaf.press('ArrowLeft');await expect(page.locator('[data-tree-node="1047-2026"]')).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(page.locator('[data-tree-node="1047-2026"]')).toHaveAttribute('aria-expanded','false');await page.keyboard.press('ArrowRight');await expect(leaf).toBeVisible();
});
test('provider directory drills into bills and previews one without losing provider scope',async({page})=>{
 await page.goto('/52.service_provider_billing_options.html?layout=c');await page.getByRole('link',{name:'Cantaloupe Inc',exact:true}).click();await expect(page.locator('.pbo-main h2')).toHaveText('Cantaloupe Inc');
 await page.getByRole('link',{name:'PB-2026Q3-1047',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Activation fee');await expect(page.getByRole('dialog').getByRole('link',{name:'Review Bill'})).toHaveAttribute('href','52.service_provider_bill.html?id=PB-2026Q3-1047');
 await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();await page.getByRole('button',{name:'Back to all service providers'}).click();await expect(page.locator('.pbo-directory')).toBeVisible();
});
test('Service Fee Log entries are removed and its former route redirects',async({page})=>{
 await page.goto('/52.service_provider_billing.html');await expect(page.getByRole('link',{name:'Service Fee Log',exact:true})).toHaveCount(0);await page.locator('[data-pw-menu-toggle="payment"]').click();await expect(page.locator('[data-pw-menu="payment"]')).not.toContainText('Service Fee Log');
 await page.goto('/52.service_fee_log.html');await expect(page).toHaveURL(/52.service_provider_billing.html$/);
});
test('selected provider continues into the existing bill generator and fee settings',async({page})=>{
 await page.goto('/52.service_provider_billing.html?provider=1047&generate=1');await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('combobox',{name:'Service provider',exact:true})).toContainText('Cantaloupe Inc');
 await page.goto('/52.service_fee_settings.html?provider=1047');await expect(page.locator('.pb-settings-table tbody tr')).toHaveCount(1);await expect(page.locator('.pb-settings-table')).toContainText('Cantaloupe Inc');
});
