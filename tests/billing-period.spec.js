const {test,expect}=require('@playwright/test');
const domain=require('../scripts/billing-domain.js');
const now=new Date('2026-10-07T10:00:00Z');
const payer=()=>({requestId:crypto.randomUUID(),email:'payer@example.com',brand:'Visa',last4:'4242',acceptedTerms:true,recurringConsent:true});
function fixtures(){
 const b=domain.makeBill({id:'period-demo',invoice:'PERIOD-0001',merchantId:'period-merchant',merchantName:'Maple Street Coffee',currency:'USD',amount:24,recurring:true,cycle:6,start:'2026-08-07',expiry:'2027-01-01',billType:'eSIM Billing',includedData:2048},now);
 domain.checkout(b,payer(),new Date('2026-08-01T10:00:00Z'));
 delete b.notifications[0].snapshot.receiptVersion;delete b.notifications[0].snapshot.billingPeriod;
 domain.collect(b,{now:new Date('2026-09-07T09:00:00Z'),failAt:2});
 domain.collect(b,{now:new Date('2026-10-07T09:00:00Z')});
 const single=domain.makeBill({id:'one-time-demo',invoice:'ONE-TIME',assignment:'standalone',currency:'USD',amount:49,recurring:false,expiry:'2027-01-01'},now);
 const missing=domain.makeBill({id:'missing-demo',invoice:'MISSING-DATE',assignment:'standalone',currency:'USD',amount:29,recurring:true,cycle:3,start:'2026-01-31',expiry:'2027-01-01'},now);
 missing.start='';
 return [b,single,missing];
}
async function prepare(page){
 await page.clock.install({time:now});
 const bills=fixtures();
 await page.addInitScript(bills=>{
  if(window!==window.top)return;
  if(sessionStorage.getItem('period-seeded'))return;
  localStorage.setItem('paywizard-billing-local-v1',JSON.stringify(bills));
  localStorage.setItem('paywizard-platform-merchants-v1',JSON.stringify([{merchantId:'period-merchant',merchantName:'Maple Street Coffee'}]));
  localStorage.setItem('paywizard.portalAccessProfile.v1','maintain');
  sessionStorage.setItem('period-seeded','yes');
 },bills);
 await page.goto('/44.billing_overview.html');
 return bills;
}
async function openRecords(page,id){
 await page.locator('[data-id="'+id+'"] .billing-more').click();
 await page.getByRole('menuitem',{name:'View payment records',exact:true}).click();
}
for(const width of [1440,1920])test('original billing periods match all attempts in desktop records at '+width,async({page})=>{
 await page.setViewportSize({width,height:1000});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await prepare(page);
 await expect(page.getByRole('columnheader',{name:'CONTRACT PERIOD',exact:true})).toBeVisible();
 if(width===1440)await page.screenshot({path:'artifacts/billing-period-overview.png'});
 await openRecords(page,'period-demo');
 const installments=page.locator('#installmentRows tr');
 await expect(installments).toHaveCount(6);
 await expect(installments.nth(1)).toContainText('2 of 6');
 await expect(installments.nth(1)).toContainText('Sep 7, 2026 – Oct 6, 2026');
 await expect(installments.nth(5)).toContainText('Jan 7, 2027 – Feb 6, 2027');
 const attempts=page.locator('#attemptRows tr');
 await expect(attempts).toHaveCount(4);
 for(const index of [1,2]) {
  await expect(attempts.nth(index)).toContainText('2 of 6');
  await expect(attempts.nth(index)).toContainText('Sep 7, 2026 – Oct 6, 2026');
 }
 await expect(attempts.nth(1)).toContainText('Failed');
 await expect(attempts.nth(2)).toContainText('2026-10-07 09:00:00 UTC');
 expect(await page.locator('#paymentRecordsDialog th').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height===34&&getComputedStyle(e).fontSize==='11px'))).toBe(true);
 expect(await page.locator('#closePaymentRecords').evaluate(e=>e.getBoundingClientRect().height)).toBe(40);
 expect(await page.locator('#paymentRecordsDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.screenshot({path:'artifacts/billing-period-records-'+width+'.png'});
 await page.locator('#closePaymentRecords').click();
 await expect(page.locator('[data-id="period-demo"] .billing-more')).toBeFocused();
 expect(errors).toEqual([]);
});

test('unknown historical periods and one-time records have no invented dates or installment count',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await prepare(page);
 await openRecords(page,'missing-demo');
 await expect(page.locator('#installmentRows tr').first().locator('td').nth(1)).toHaveText('—');
 await page.locator('#closePaymentRecords').click();
 await openRecords(page,'one-time-demo');
 await expect(page.locator('#installmentRows tr td').nth(0)).toHaveText('—');
 await expect(page.locator('#installmentRows tr td').nth(1)).toHaveText('—');
 await expect(page.locator('#attemptRows td')).toHaveAttribute('colspan','6');
 await expect(page.locator('#attemptRows')).toHaveText('No payment attempts.');
});

test('email viewer shows new snapshot periods and preserves old receipts',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});const [bill]=await prepare(page);
 await page.locator('[data-id="period-demo"] .billing-more').click();
 await page.getByRole('menuitem',{name:'View emails',exact:true}).click();
 const second=bill.notifications.find(n=>n.type==='receipt'&&n.snapshot.payment.installment===2);
 await page.locator('#billingEmailSelect').selectOption(second.id);
 await expect(page.frameLocator('#billingEmailFrame').getByText('Billing Period: Sep 7, 2026 – Oct 6, 2026',{exact:true})).toBeVisible();
 await expect(page.frameLocator('#billingEmailFrame').getByText('Installment: 2 of 6',{exact:true})).toBeVisible();
 await page.frameLocator('#billingEmailFrame').getByText('Billing Period: Sep 7, 2026 – Oct 6, 2026',{exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'artifacts/billing-period-email-viewer.png'});
 await page.getByRole('button',{name:'Plain Text',exact:true}).click();
 await expect(page.locator('#billingEmailText')).toContainText('Billing Period: Sep 7, 2026 – Oct 6, 2026');
 await page.locator('#billingEmailSelect').selectOption(bill.notifications[0].id);
 await expect(page.locator('#billingEmailText')).toContainText('Billing Cycle: Month 1 of 6');
 await expect(page.locator('#billingEmailText')).not.toContainText('Billing Period:');
});

test('merchant billing history uses the same contract-period label',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await prepare(page);
 await page.evaluate(()=>localStorage.setItem('paywizard.portalAccessProfile.v1','billing-merchant'));
 await page.goto('/42.billing_payments.html?merchantId=period-merchant');
 await page.locator('#historyTab').click();
 await expect(page.getByRole('columnheader',{name:'CONTRACT PERIOD',exact:true})).toBeVisible();
 const row=page.locator('#paymentHistoryRows tr').filter({hasText:'PERIOD-0001'});
 await expect(row).toContainText('Aug 7, 2026 – Feb 7, 2027');
 await page.screenshot({path:'artifacts/billing-period-merchant-history.png'});
});

test('customer receipt reference preserves layout and displays the covered period',async({page})=>{
 await page.setViewportSize({width:1280,height:1100});
 await page.goto('/邮件模版html/邮件模版html/billingReceiptStandaloneMonthlySample.html');
 await expect(page.getByText('Billing Period: Sep 7, 2026 – Oct 6, 2026',{exact:true})).toBeVisible();
 await expect(page.getByText('Installment: 2 of 6',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/billing-period-customer-receipt.png',fullPage:true});
 await page.goto('/邮件模版html/邮件模版html/billingReceiptOverdueInstallmentSample.html');
 await expect(page.getByText('Billing Period: Jul 7, 2026 – Aug 6, 2026',{exact:true})).toBeVisible();
 await expect(page.getByText('Paid on Sep 7, 2026, 10:30 UTC',{exact:true})).toBeVisible();
});
