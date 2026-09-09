const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const emails=require('../../scripts/billing-emails.js');
const base='邮件模版html/邮件模版html/';
const options={paymentUrl:'https://billing.example.com/43.html#token',portalUrl:'https://portal.example.com/42.html',logoUrl:'https://billing.example.com/logo.png'};
const fixture=name=>JSON.parse(fs.readFileSync(base+name+'.json','utf8'));
for(const name of ['billingFailureOneTimeSample','billingFailureFirstInstallmentSample','billingFailureScheduledSample','billingFailureCatchUpSample','billingFailureFinalScheduleSample','billingReceiptCatchUpEventSample','billingLinkCatchUpSample','billingReceiptStoppedSample'])test('renders '+name+' with matching text and HTML',()=>{
 const f=fixture(name),out=emails.render(f.notification,{...options,...f.options});assert.ok(out.html.includes('<!doctype html>'));assert.ok(out.text.includes(f.notification.snapshot.invoiceNumber));assert.ok(!out.html.includes('${'));assert.ok(!out.html.includes('undefined'));
 if(f.notification.type==='failure'){assert.ok(out.subject.startsWith('Payment failed'));assert.ok(out.text.includes('unsuccessful'));}
});
test('partial failure preserves successful installment while listing only unpaid debt',()=>{
 const f=fixture('billingFailureCatchUpSample'),out=emails.render(f.notification,options);assert.match(out.text,/installment 2 \(\$100.00\)/);assert.match(out.text,/Installment 3/);assert.match(out.text,/Installment 4/);assert.match(out.text,/Total due: \$200.00/);assert.match(out.text,/2027-05-10 09:00:00 UTC/);assert.match(out.text,/View Payment Status/);
});
test('standalone final failure has no merchant portal or invented automatic date',()=>{
 const f=fixture('billingFailureFinalScheduleSample'),out=emails.render(f.notification,options);assert.ok(!out.text.includes('Merchant:'));assert.ok(!out.html.includes('Access Merchant Portal'));assert.match(out.text,/No further automatic attempts/);assert.match(out.text,/Included Data: 0 MB/);
});
test('stopped receipt has neither payment CTA nor next scheduled payment',()=>{
 const f=fixture('billingReceiptStoppedSample'),out=emails.render(f.notification,{...options,...f.options});assert.match(out.text,/Collection has stopped/);assert.ok(!out.text.includes('Next payment:'));assert.ok(!out.html.includes('billing-email-action'));
});
test('renewed invitation shows separate installments, current amount and both entries',()=>{
 const f=fixture('billingLinkCatchUpSample'),out=emails.render(f.notification,options);assert.match(out.text,/Amount Due: \$300.00/);assert.match(out.text,/Installment 3/);assert.match(out.text,/Contract Total: \$600.00/);assert.match(out.html,/Access Merchant Portal/);
});
test('escapes untrusted business text and rejects executable action URLs',()=>{
 const f=fixture('billingFailureCatchUpSample');f.notification.snapshot.notes='<img src=x onerror=alert(1)>';const out=emails.render(f.notification,options);assert.ok(out.html.includes('&lt;img'));assert.ok(!out.html.includes('<img src=x'));
 assert.throws(()=>emails.render(f.notification,{...options,paymentUrl:'javascript:alert(1)'}),/HTTPS/);
 assert.throws(()=>emails.render(f.notification,{...options,logoUrl:'http://example.com/logo.png'}),/HTTPS/);
});
