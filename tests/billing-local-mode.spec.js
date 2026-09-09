const {test,expect}=require('@playwright/test');
for(const width of [1440,390])test('local only, expired examples and stable renewal at '+width,async({page,context})=>{
 await page.setViewportSize({width,height:950});
 await page.addInitScript(()=>localStorage.setItem('paywizard-billing-runtime-v1',JSON.stringify({mode:'shared',origin:'https://unavailable.example'})));
 const requests=[];page.on('request',r=>{if(r.url().includes('/api/billing/'))requests.push(r.url());});
 await page.goto('/44.billing_overview.html');
 await expect(page.locator('.billing-runtime')).toHaveCount(0);
 await expect(page.locator('[data-pw-menu="matintain"] a')).toHaveText(['Billing Setup','Billing Overview','SLA Alerts','Service Providers','Application Parameters']);
 await expect(page.locator('[data-pw-menu-toggle="matintain"]')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('[data-pw-menu="settings"]')).not.toContainText('Billing');

 await expect(page.locator('#overviewRows tr').first()).toContainText('RENEW-0001');
 const row=page.locator('#overviewRows tr').filter({has:page.getByRole('cell',{name:'RENEW-0001',exact:true})});
 await page.locator('#pageSize').selectOption('50');
 const merchantName=await row.locator('td').nth(2).textContent();expect(merchantName).not.toBe('—');
 const standalone=page.locator('#overviewRows tr').filter({has:page.getByRole('cell',{name:'RENEW-0002',exact:true})});
 await expect(standalone.locator('td').nth(2)).toHaveText('—');
 await page.locator('#overviewAssignment').selectOption('standalone');await page.getByRole('button',{name:'Search billing overview'}).click();
 await expect(row).toHaveCount(0);await expect(standalone.locator('td').nth(2)).toHaveText('—');
 await page.screenshot({path:'artifacts/billing-standalone-'+width+'.png',fullPage:false});
 await page.getByRole('button',{name:'Reset filters'}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();
 const download=await downloadPromise;const csv=require('node:fs').readFileSync(await download.path(),'utf8');
 expect(csv.split('\n').find(line=>line.includes('"RENEW-0002"'))).toContain(',"—",');
 expect(csv.split('\n').find(line=>line.includes('"RENEW-0001"'))).toContain(',"'+merchantName+'",');
 const url=await page.evaluate(()=>{const s=window.PaywizardBillingStore;return s.link(s.read().find(r=>r.invoice==='RENEW-0001'));});
 const payer=await context.newPage();await payer.goto(url);await expect(payer.locator('#pageError')).toContainText('expired');
 await row.getByRole('button',{name:'Renew Link',exact:true}).click();
 const heights=await page.locator('#renewDialog .billing-actions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));expect(new Set(heights).size).toBe(1);
 await page.getByRole('button',{name:'Renew',exact:true}).click();
 await expect(row.getByRole('button',{name:'Copy URL',exact:true})).toBeVisible();
 await payer.reload();await expect(payer.locator('#cardForm')).toBeVisible();
 await page.reload();await expect(row.getByRole('button',{name:'Copy URL',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>{const s=window.PaywizardBillingStore;return s.link(s.read().find(r=>r.invoice==='RENEW-0001'));})).toBe(url);
 expect(await page.evaluate(()=>window.PaywizardBillingStore.read().filter(r=>r.invoice.startsWith('RENEW-')).length)).toBe(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests).toEqual([]);
 await row.getByRole('button',{name:'Actions for invoice RENEW-0001'}).click();
 await page.getByRole('menuitem',{name:'Stop Collection',exact:true}).click();
 await expect(page.locator('#stopDialog textarea')).toHaveCount(0);
 const stopHeights=await page.locator('#stopDialog .billing-actions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));expect(new Set(stopHeights).size).toBe(1);
 await page.locator('#stopDialog').getByRole('button',{name:'Stop Collection',exact:true}).click();await expect(row).toContainText('Stopped');
 await row.getByRole('button',{name:'Actions for invoice RENEW-0001'}).click();await page.getByRole('menuitem',{name:'View billing details'}).click();
 await expect(page.locator('#billingDetailsDialog')).not.toContainText('Activity');await expect(page.locator('#billingDetailsDialog')).not.toContainText('Stop reason');
 await page.locator('#billingDetailsDialog').getByRole('button',{name:'Close'}).click();
 const create=page.getByRole('link',{name:'Create Billing',exact:true});await expect(create).toHaveCSS('background-color','rgb(17, 17, 17)');
 expect(await create.evaluate(n=>n.getBoundingClientRect().height)).toBe(await page.getByRole('button',{name:'Export',exact:true}).evaluate(n=>n.getBoundingClientRect().height));
 await page.screenshot({path:'artifacts/billing-local-'+width+'.png',fullPage:false});
});

test('Matintain is operations-only including direct routes',async({page})=>{
 for(const profile of ['full-service','attended','unattended','attended-merchant','unattended-merchant','attended-store','unattended-store','billing-merchant']){
  await page.goto('/12.transaction_list.html');
  await page.evaluate(p=>localStorage.setItem('paywizard.portalAccessProfile.v1',p),profile);
  for(const route of ['41.billing_setup.html','44.billing_overview.html','32.sla_alert_rules.html','21.service_provider.html','22.sp_payment_channel_setting.html','23.sp_merchant_list.html','3.Processor_template_new.html','3.version_provider_assign.html','6.edit_application_parameters.html']){
   await page.goto('/'+route);await expect(page).toHaveURL(profile==='billing-merchant'?/42\.billing_payments/:/12\.transaction_list/);
   await expect(page.locator('[data-pw-menu-toggle="matintain"]')).toHaveCount(0);
  }
 }
});
