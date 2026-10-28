const {test,expect}=require('@playwright/test');
const key='paywizard.portalAccessProfile.v1';
const profile=(page,value)=>page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key,value});

test('Maintain groups all three billing destinations with matching breadcrumbs',async({page})=>{
 await profile(page,'maintain');
 for(const [file,label] of [['44.billing_overview.html','Billing Overview'],['52.service_provider_billing.html','Service Provider Billing'],['41.billing_setup.html','Billing Setup']]){
  await page.goto('/'+file);
  const menu=page.locator('[data-pw-menu="billing"]');await expect(menu).toBeVisible();
  await expect(menu.locator('a')).toHaveCount(3);
  for(const name of ['Billing Overview','Service Provider Billing','Billing Setup'])await expect(menu.getByRole('link',{name:new RegExp('^'+name)})).toBeVisible();
  await expect(menu.locator('[aria-current="page"]')).toContainText(label);
  await expect(page.locator('.pw-platform-breadcrumb')).toContainText('Billing');
  await expect(page.locator('[data-pw-menu="payment"] a,[data-pw-menu="system"] a').filter({hasText:/^(Billing Overview|Service Provider Billing|Billing Setup)$/})).toHaveCount(0);
 }
});

test('ordinary provider portals have four 2026 quarters and an unpaid badge',async({page})=>{
 await page.goto('/12.transaction_list.html');
 for(const value of ['full-service','attended','unattended']){
  await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value});await page.goto('/52.provider_billing.html');
  await expect(page.locator('.pb-table tbody tr')).toHaveCount(4);
  for(const q of [1,2,3,4])await expect(page.locator('.pb-table tbody')).toContainText('2026 Q'+q);
  await expect(page.locator('[data-shell-provider-billing-count]')).toHaveText('2');
  await page.getByRole('combobox',{name:'Quarter',exact:true}).click();await page.getByRole('option',{name:'2026 Q4',exact:true}).click();await expect(page.locator('.pb-table tbody tr')).toHaveCount(1);
 }
});

test('WizarPOS own profile and impersonated entity have neither menu nor direct bill access',async({page})=>{
 await profile(page,'wizarpos');await page.goto('/52.provider_billing.html');await expect(page).toHaveURL(/12.transaction_list.html$/);
 await expect(page.locator('[data-pw-nav-label="Billing & Payments"]')).toHaveCount(0);
 await page.goto('/52.provider_bill.html?id=PB-2026Q3-1050');await expect(page).toHaveURL(/12.transaction_list.html$/);
 await page.evaluate(()=>sessionStorage.setItem('paywizard.impersonation.session.v1',JSON.stringify({id:'own-provider',profile:'full-service',user:{name:'Provider Admin',role:'Administrator'},entity:{id:'sp-wizardpos',name:'wizarpos',type:'provider'}})));
 await page.goto('/52.provider_bill.html?id=PB-2026Q3-sp-wizardpos');await expect(page).toHaveURL(/12.transaction_list.html$/);await expect(page.locator('[data-pw-nav-label="Billing & Payments"]')).toHaveCount(0);
});

test('unpaid reminder works outside Billing and reacts across tabs until zero',async({page,context})=>{
 await profile(page,'full-service');await page.goto('/12.transaction_list.html');const badge=page.locator('[data-shell-provider-billing-count]');await expect(badge).toHaveText('2');
 const payer=await context.newPage();await payer.goto('/52.provider_billing.html');
 for(const [quarter,remaining] of [['2026-Q3',1],['2026-Q4',0]]){
  await payer.evaluate(quarter=>{const api=PaywizardProviderBilling,bill=api.load().bills.find(b=>b.providerId==='1047'&&b.quarter===quarter);api.beginPayment(bill.token,bill.revision,'badge-'+quarter);},quarter);
  await expect(badge).toHaveText(String(remaining+1));
  await payer.evaluate(quarter=>{const api=PaywizardProviderBilling,bill=api.load().bills.find(b=>b.providerId==='1047'&&b.quarter===quarter);api.finishPayment(bill.token,'badge-'+quarter,{brand:'Visa',last4:'4242'});},quarter);
  await expect(badge).toHaveText(String(remaining));await expect(payer.locator('[data-shell-provider-billing-count]')).toHaveText(String(remaining));
 }
 await expect(badge).toBeHidden();await expect(page.locator('[data-pw-nav-label="Billing & Payments"]')).toHaveAttribute('aria-label','Billing & Payments');
});

test('legacy demo is backed up and fees reset in both stored data and setup form',async({page})=>{
 const old=JSON.stringify({schema:1,providers:[],bills:[{note:'Existing paid demo',status:'Paid'}]});
 await profile(page,'maintain');await page.addInitScript(old=>{if(!localStorage.getItem('paywizard.provider-billing.v1'))localStorage.setItem('paywizard.provider-billing.v1',old);},old);
 await page.goto('/52.service_fee_settings.html');await expect(page.locator('.pb-settings-table tbody tr').first()).toContainText('USD 2.00');await expect(page.locator('.pb-settings-table tbody tr').first()).toContainText('USD 7.99');
 expect(await page.evaluate(()=>localStorage.getItem(PaywizardProviderBilling.BACKUP_KEY))).toBe(old);
 await page.getByRole('button',{name:'Set Up Fees'}).click();await expect(page.getByLabel('Activation fee',{exact:true})).toHaveValue('2.00');await expect(page.getByLabel('Monthly service fee',{exact:true})).toHaveValue('7.99');
});

test('Portal quarter options exclude foreign and unpublished bills while Maintain includes them',async({page})=>{
 await profile(page,'full-service');await page.goto('/52.provider_billing.html');
 await page.evaluate(()=>{const api=PaywizardProviderBilling,state=api.load(),base=state.bills.find(b=>b.providerId==='1047');state.bills.push({...base,id:'foreign-quarter',providerId:'1050',quarter:'2027-Q1',status:'Draft',publishedAt:null},{...base,id:'own-draft-quarter',quarter:'2025-Q4',status:'Draft',publishedAt:null});localStorage.setItem(api.KEY,JSON.stringify(state));});
 await page.reload();await page.getByRole('combobox',{name:'Quarter',exact:true}).click();
 await expect(page.getByRole('option',{name:'2027 Q1',exact:true})).toHaveCount(0);await expect(page.getByRole('option',{name:'2025 Q4',exact:true})).toHaveCount(0);
 await page.getByRole('option',{name:'2026 Q3',exact:true}).click();await page.getByRole('combobox',{name:'Quarter',exact:true}).click();await expect(page.getByRole('option',{name:'2026 Q4',exact:true})).toBeVisible();
 await page.goto('/52.service_provider_billing.html');await page.getByRole('combobox',{name:'Quarter',exact:true}).click();await expect(page.getByRole('option',{name:'2027 Q1',exact:true})).toBeVisible();await expect(page.getByRole('option',{name:'2025 Q4',exact:true})).toBeVisible();
});
