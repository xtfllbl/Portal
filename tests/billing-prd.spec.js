const {test,expect}=require('@playwright/test');
const domain=require('../scripts/billing-domain.js');
const now=new Date('2027-04-10T09:00:00Z');
const payer=()=>({requestId:crypto.randomUUID(),email:'payer@example.com',last4:'4242',brand:'Visa',acceptedTerms:true,recurringConsent:true});
function fixture(){const b=domain.makeBill({id:'prd-test',invoice:'PRD-TEST',merchantId:'prd-merchant',merchantName:'PRD Shop',currency:'USD',amount:100,recurring:true,cycle:6,start:'2027-01-10',expiry:'2028-01-01',notes:'Service charge'},new Date('2027-01-10T10:00:00Z'));domain.checkout(b,payer(),new Date('2027-01-10T10:00:00Z'));domain.collect(b,{now,failAt:3});return b;}
async function prepare(page,profile='wizarpos'){
 await page.clock.install({time:now});const bill=fixture();
 await page.addInitScript(({bill,profile})=>{if(!sessionStorage.getItem('prd-seeded')){localStorage.setItem('paywizard-billing-local-v1',JSON.stringify([bill]));localStorage.setItem('paywizard-platform-merchants-v1',JSON.stringify([{merchantId:'prd-merchant',merchantName:'PRD Shop'}]));localStorage.setItem('paywizard.portalAccessProfile.v1',profile);sessionStorage.setItem('prd-seeded','yes');}},{bill,profile});
}
for(const width of [1440,390]) {
 test('overview emails retain per-payment snapshots and equal controls at '+width,async({page})=>{
  await page.setViewportSize({width,height:960});await prepare(page);await page.goto('/44.billing_overview.html');await page.locator('#overviewMerchant').fill('PRD Shop');await page.getByRole('button',{name:'Search billing overview'}).click();
  const row=page.locator('[data-id="prd-test"]');await expect(row).toContainText('Overdue');await row.getByRole('button',{name:'Actions for invoice PRD-TEST'}).click();await page.getByRole('menuitem',{name:'View emails',exact:true}).click();
  await expect(page.locator('#billingEmailMeta')).toContainText('payer@example.com');await expect(page.locator('#billingEmailNotice')).toContainText('No email was sent');
  await expect(page.frameLocator('#billingEmailFrame').getByRole('heading',{name:'Payment Failed'})).toBeVisible();
  await page.getByRole('button',{name:'Plain Text',exact:true}).click();await expect(page.locator('#billingEmailText')).toContainText('Paid successfully in this round: installment 2');await expect(page.locator('#billingEmailText')).toContainText('Total due: $200.00');
  expect(new Set(await page.locator('.billing-email-dialog .billing-actions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height))).size).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/billing-prd-emails-'+width+'.png'});
  await page.locator('#closeBillingEmails').click();await row.getByRole('button',{name:'Actions for invoice PRD-TEST'}).click();await page.getByRole('menuitem',{name:'View billing details',exact:true}).click();await expect(page.locator('#savedBillingDetails')).toContainText('Mar 10, 2027');await expect(page.locator('#savedBillingDetails')).toContainText('2027-05-10 09:00:00 UTC');
 });
 test('platform retry and payer read-only status at '+width,async({page})=>{
  await page.setViewportSize({width,height:960});await prepare(page);await page.goto('/44.billing_overview.html');
  await page.locator('#overviewMerchant').fill('PRD Shop');await page.getByRole('button',{name:'Search billing overview'}).click();
  const row=page.locator('[data-id="prd-test"]');await row.locator('.billing-more').click();
  const link=await page.getByRole('menuitem',{name:'Preview payment link'}).getAttribute('href');
  await page.getByRole('menuitem',{name:'Retry Payment',exact:true}).click();await expect(page.locator('#retryPaymentSummary')).toContainText('Installment 3');await expect(page.locator('#retryPaymentSummary')).not.toContainText('Installment 2 ·');
  expect(new Set(await page.locator('.retry-actions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height))).size).toBe(1);
  await page.screenshot({path:'artifacts/billing-platform-retry-'+width+'.png'});
  await page.locator('.retry-confirm input').check();await page.locator('.billing-retry-dialog button[type=submit]').click();await expect(row).toContainText('4 of 6');
  await page.goto(link);await expect(page.getByRole('button',{name:'Retry Payment',exact:true})).toHaveCount(0);await expect(page.locator('#paymentResult')).toContainText('4 of 6');
  await page.evaluate(()=>localStorage.setItem('paywizard.portalAccessProfile.v1','billing-merchant'));await page.goto('/42.billing_payments.html?merchantId=prd-merchant');
  await expect(page.getByRole('button',{name:'Retry Payment',exact:true})).toHaveCount(0);await page.locator('#historyTab').click();const history=page.locator('#paymentHistoryRows tr').filter({hasText:'PRD-TEST'});await expect(history).toContainText('4 of 6');await expect(history).toContainText('2027-05-10 09:00:00 UTC');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test('create draft validation and initial public payment policy at '+width,async({page})=>{
  await page.setViewportSize({width,height:960});await prepare(page);await page.goto('/41.billing_setup.html');await expect(page.locator('#notes')).toHaveAttribute('maxlength','2000');await expect(page.locator('#filterStatus option')).toHaveText(['Payment Status','Draft']);
  await page.getByRole('button',{name:'Standalone Billing',exact:false}).click();await page.locator('#amount').fill('20');await page.locator('#recurring').check();await page.locator('#startDate').fill('2027-05-10');await page.locator('#cycle').selectOption('3');await page.locator('#expiry').fill('2028-01-01');await page.locator('#notes').fill('PRD newly created demo');
  expect(new Set(await page.locator('#billingForm .billing-actions button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height))).size).toBe(1);
  await page.locator('#applyBilling').click();await expect(page).toHaveURL(/44.billing_overview/);const row=page.locator('#overviewRows tr').filter({hasText:'PRD newly created demo'});await row.locator('.billing-more').click();const link=await page.getByRole('menuitem',{name:'Preview payment link'}).getAttribute('href');await page.goto(link);
  await page.getByRole('link',{name:'Terms of Service',exact:true}).click();await expect(page.getByRole('dialog',{name:'Terms of Service · Demo'})).toBeVisible();await expect(page.locator('#billingPolicyBody')).toContainText('Demonstration only');await page.locator('.billing-policy-dialog button').click();
  await page.locator('#cardEmail').fill('new-payer@example.com');await page.locator('#cardNumber').fill('4242424242424242');await page.locator('#cardExpiry').fill('1299');await page.locator('#cardCvc').fill('123');await page.locator('#cardholder').fill('Demo Payer');await page.locator('.card-agreements input').check();await page.locator('#recurringConsent').check();await expect(page.locator('#recurringConsentText')).toContainText('09:00 UTC');await page.locator('#submitCard').click();await expect(page.locator('#paymentResult')).toContainText('1 of 3 installments paid');await expect(page.locator('#paymentResult')).toContainText('2027-06-10 09:00:00 UTC');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/billing-prd-checkout-'+width+'.png'});
 });
}
test('two tabs retry the same due installments only once',async({page,context})=>{
 await prepare(page);await page.goto('/44.billing_overview.html');
 const other=await context.newPage();await other.clock.install({time:now});await other.goto('/44.billing_overview.html');
 for(const tab of [page,other]){await tab.locator('#overviewMerchant').fill('PRD Shop');await tab.getByRole('button',{name:'Search billing overview'}).click();await tab.locator('[data-id="prd-test"] .billing-more').click();await tab.getByRole('menuitem',{name:'Retry Payment',exact:true}).click();await tab.locator('.retry-confirm input').check();}
 await Promise.all([page.locator('.billing-retry-dialog button[type=submit]').click(),other.locator('.billing-retry-dialog button[type=submit]').click()]);
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard-billing-local-v1')).find(b=>b.id==='prd-test'));
 expect(record.installments.filter(i=>i.status==='Paid')).toHaveLength(4);expect(record.payments.filter(p=>p.status==='Succeeded'&&[3,4].includes(p.installment))).toHaveLength(2);expect(record.notifications.filter(n=>n.type==='receipt')).toHaveLength(4);
});
for(const width of [800,390])test('new email samples render at '+width,async({page})=>{
 await page.setViewportSize({width,height:950});for(const file of ['billingFailureOneTimeSample','billingFailureFirstInstallmentSample','billingFailureScheduledSample','billingFailureCatchUpSample','billingFailureFinalScheduleSample','billingReceiptCatchUpEventSample','billingLinkCatchUpSample','billingReceiptStoppedSample']){
  await page.goto('/邮件模版html/邮件模版html/'+file+'.html');await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('img').evaluateAll(ns=>ns.every(n=>n.complete&&n.naturalWidth>0))).toBe(true);
  const heights=await page.locator('.billing-email-action').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));expect(new Set(heights).size).toBeLessThanOrEqual(1);
 }await page.screenshot({path:'artifacts/billing-prd-email-sample-'+width+'.png'});
});
test('local scheduled catch-up advances only once after the next 09:00 UTC boundary',async({page})=>{
 await prepare(page,'billing-merchant');await page.goto('/42.billing_payments.html?merchantId=prd-merchant');
 await page.clock.setSystemTime(new Date('2027-05-10T08:59:59Z'));await page.locator('#refreshPayments').click();
 let bill=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard-billing-local-v1')).find(b=>b.id==='prd-test'));expect(bill.payments).toHaveLength(3);
 await page.clock.setSystemTime(new Date('2027-05-10T09:00:00Z'));await page.locator('#refreshPayments').click();
 bill=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard-billing-local-v1')).find(b=>b.id==='prd-test'));expect(bill.payments.slice(-3).map(p=>p.installment)).toEqual([3,4,5]);expect(bill.payments).toHaveLength(6);
 await page.locator('#refreshPayments').click();bill=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard-billing-local-v1')).find(b=>b.id==='prd-test'));expect(bill.payments).toHaveLength(6);
});

test('overdue payer pages cannot retry or change the saved card',async({page})=>{
 await prepare(page,'billing-merchant');await page.goto('/42.billing_payments.html?merchantId=prd-merchant');
 await expect(page.getByRole('button',{name:'Retry Payment',exact:true})).toHaveCount(0);
 await expect(page.getByRole('article',{name:'Invoice PRD-TEST'})).toHaveCount(0);
 const result=await page.evaluate(async()=>{try{await window.PaywizardBillingStore.retry('prd-test',{requestId:crypto.randomUUID(),confirmed:true});return 'allowed';}catch(e){return e.message;}});expect(result).toContain('Only platform');
 const link=await page.evaluate(()=>window.PaywizardBillingStore.link(window.PaywizardBillingStore.read().find(b=>b.id==='prd-test')));await page.goto(link);
 await expect(page.locator('#paymentResult')).toContainText('Payment needs attention');await expect(page.getByRole('button',{name:'Retry Payment',exact:true})).toHaveCount(0);await expect(page.locator('#cardNumber')).not.toBeVisible();
 const publicResult=await page.evaluate(async()=>{try{await window.PaywizardBillingStore.publicBill(location.hash.slice(1),{confirmed:true},'retry');return 'allowed';}catch(e){return e.message;}});expect(publicResult).toContain('Only platform');
 await page.screenshot({path:'artifacts/billing-payer-overdue.png'});
});
