import {writeFile,readFile} from 'node:fs/promises';
import domain from './billing-domain.js';
import emails from './billing-emails.js';
const directory='邮件模版html/邮件模版html/';
const at=s=>new Date(s);
const input=extra=>({id:'sample-billing',invoice:'DEMO-2027-001',merchantId:'demo-merchant',merchantName:'Maple Street Coffee',currency:'USD',amount:100,recurring:true,cycle:6,start:'2027-01-10',expiry:'2028-01-01',billType:'General Billing',notes:'Demonstration data. No real payment or email delivery.',...extra});
const payer=()=>({requestId:crypto.randomUUID(),email:'payer@example.com',brand:'Visa',last4:'4242',acceptedTerms:true,recurringConsent:true});
function bill(extra={}){return domain.makeBill(input(extra),at('2027-01-10T10:00:00Z'));}
const samples=[];
function add(name,label,notification,options={}){samples.push({name,label,notification:structuredClone(notification),options});}
let b=bill({recurring:false});domain.checkout(b,payer(),at('2027-01-10T10:00:00Z'),{failAt:1});add('billingFailureOneTimeSample','一次性扣款失败',b.notifications.at(-1));
b=bill();domain.checkout(b,payer(),at('2027-01-10T10:00:00Z'),{failAt:1});add('billingFailureFirstInstallmentSample','分期首期失败',b.notifications.at(-1));
b=bill();domain.checkout(b,payer(),at('2027-01-10T10:00:00Z'));domain.collect(b,{now:at('2027-02-10T09:00:00Z'),failAt:2});add('billingFailureScheduledSample','自动扣款失败',b.notifications.at(-1));
b=bill();domain.checkout(b,payer(),at('2027-01-10T10:00:00Z'));domain.collect(b,{now:at('2027-04-10T09:00:00Z'),failAt:3});add('billingFailureCatchUpSample','补扣部分成功后失败',b.notifications.at(-1));
add('billingReceiptCatchUpEventSample','补扣单期成功快照',b.notifications.filter(n=>n.type==='receipt').at(-1));
b=bill({assignment:'standalone',billType:'eSIM Billing',includedData:0});domain.checkout(b,payer(),at('2027-01-10T10:00:00Z'));domain.collect(b,{now:at('2027-06-10T09:00:00Z'),failAt:5});add('billingFailureFinalScheduleSample','最后计划日失败 · 独立账单',b.notifications.at(-1));
b=bill({expiry:'2027-02-01'});domain.renewLink(b,{expiry:'2027-05-01',send:true,email:'invited@example.com'},at('2027-03-15T10:00:00Z'));add('billingLinkCatchUpSample','续期后多期付款邀请',b.notifications.at(-1));
b=bill();domain.checkout(b,payer(),at('2027-01-10T10:00:00Z'));add('billingReceiptStoppedSample','停止收款后的在途成功收据',b.notifications.at(-1),{collectionStopped:true});
const renderOptions={preview:true,paymentUrl:'https://billing.example.com/43.billing_payment_link.html#demo-token',portalUrl:'https://portal.example.com/42.billing_payments.html',logoUrl:'https://billing.example.com/billingReceiptLogo.png',paywizardLogoUrl:'https://billing.example.com/paywizard-logo.png'};
for(const sample of samples){
 // Stable fixture identifiers keep regeneration reviewable; event ordering and amounts remain real domain outputs.
 const serialized=JSON.stringify(sample.notification,null,2).replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,match=>{const ids=sample.identifiers||={};return ids[match] ||= 'sample-'+(Object.keys(ids).length+1);});
 const notification=JSON.parse(serialized),output=emails.render(notification,{...renderOptions,...sample.options});
 const html=output.html.replaceAll('https://billing.example.com/billingReceiptLogo.png','billingReceiptLogo.png').replaceAll('https://billing.example.com/paywizard-logo.png','../../assets/paywizard-logo-email.png');
 await writeFile(directory+sample.name+'.json',JSON.stringify({notification,options:sample.options},null,2)+'\n');
 await writeFile(directory+sample.name+'.html',html);await writeFile(directory+sample.name+'.txt',output.text+'\n');await writeFile(directory+sample.name+'.subject.txt',output.subject+'\n');
}
await writeFile(directory+'billingPaymentFailure.html',await readFile(directory+'billingFailureCatchUpSample.html'));
await writeFile(directory+'billingFailureSamples.html','<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Billing 邮件场景</title><style>body{margin:0;background:#f4f5f7;font:16px/1.6 Arial,sans-serif;padding:24px}main{max-width:800px;margin:auto}a{display:block;padding:16px;background:white;border-radius:8px;margin:12px 0;color:#1d4ed8;text-decoration:none}</style></head><body><main><h1>Billing 邮件场景</h1>'+samples.map(s=>'<a href="'+s.name+'.html">'+s.label+'</a>').join('')+'</main></body></html>');
console.log('Rendered '+samples.length+' billing email scenarios (HTML, text, subject, JSON).');
