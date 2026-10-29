const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const domain=require('../../scripts/billing-domain.js');
const emails=require('../../scripts/billing-emails.js');
const input={id:'period-test',invoice:'PERIOD-TEST',assignment:'standalone',currency:'USD',amount:24,recurring:true,cycle:6,start:'2026-08-07',expiry:'2028-01-01',billType:'General Billing'};
const payer=()=>({requestId:crypto.randomUUID(),email:'payer@example.com',brand:'Visa',last4:'4242',acceptedTerms:true,recurringConsent:true});
const options={logoUrl:'https://example.com/logo.png'};
const bill=(extra={})=>domain.makeBill({...input,...extra},new Date('2026-08-01T10:00:00Z'));

test('inclusive periods preserve month-end anchors, leap days, year crossings and final endpoint',()=>{
 for(const [start,expected] of [
  ['2027-01-31',[['2027-01-31','2027-02-27'],['2027-02-28','2027-03-30'],['2027-03-31','2027-04-29']]],
  ['2028-01-31',[['2028-01-31','2028-02-28'],['2028-02-29','2028-03-30'],['2028-03-31','2028-04-29']]],
  ['2026-12-07',[['2026-12-07','2027-01-06'],['2027-01-07','2027-02-06'],['2027-02-07','2027-03-06']]]
 ]) {
  const b=bill({start,cycle:3});
  assert.deepEqual(b.installments.map(i=>Object.values(domain.installmentPeriod(b,i.number))),expected);
 }
 assert.deepEqual(domain.installmentPeriod(bill({start:'2027-01-10'}),6),{start:'2027-06-10',end:'2027-07-09'});
});

test('unknown or inconsistent historical schedules never guess from payment dates',()=>{
 for(const extra of [{start:''},{start:'2026-02-30'},{cycle:0},{cycle:undefined},{recurring:false}])
  assert.equal(domain.installmentPeriod({...bill(),...extra},2),null);
 for(const n of [0,7,1.5,undefined,'2']) assert.equal(domain.installmentPeriod(bill(),n),null);
 const b=bill();b.installments[1].due='2026-10-10';
 assert.equal(domain.installmentPeriod(b,2),null);
 assert.equal(domain.installmentPeriod({...bill(),installments:[]},2),null);
});

test('early payment and late catch-up capture original periods, with immutable earlier receipts',()=>{
 const b=bill();domain.checkout(b,payer(),new Date('2026-08-01T10:00:00Z'));
 const first=structuredClone(b.notifications[0]);
 assert.deepEqual(first.snapshot.billingPeriod,{start:'2026-08-07',end:'2026-09-06'});
 domain.collect(b,{now:new Date('2026-09-07T09:00:00Z'),failAt:2});
 domain.collect(b,{now:new Date('2026-10-07T09:00:00Z')});
 const receipts=b.notifications.filter(n=>n.type==='receipt');
 assert.deepEqual(receipts[0],first);
 assert.deepEqual(receipts[1].snapshot.billingPeriod,{start:'2026-09-07',end:'2026-10-06'});
 assert.deepEqual(receipts[2].snapshot.billingPeriod,{start:'2026-10-07',end:'2026-11-06'});
 const copy=JSON.stringify(receipts[1]);
 domain.collect(b,{now:new Date('2026-11-07T09:00:00Z')});
 assert.equal(JSON.stringify(receipts[1]),copy);
 const rendered=emails.render(receipts[1],options);
 for(const content of [rendered.html,rendered.text]) {
  assert.match(content,/Billing Period: Sep 7, 2026 – Oct 6, 2026/);
  assert.match(content,/Installment: 2 of 6/);
  assert.match(content,/Paid on 2026-10-07/);
  assert.doesNotMatch(content,/Billing Cycle: Month/);
 }
});

test('new renderer leaves legacy receipt text and snapshot untouched',()=>{
 const b=bill();domain.checkout(b,payer(),new Date('2026-08-07T10:00:00Z'));
 const legacy=b.notifications[0];delete legacy.snapshot.receiptVersion;delete legacy.snapshot.billingPeriod;
 const original=JSON.stringify(legacy);
 const rendered=emails.render(legacy,options);
 assert.match(rendered.text,/Billing Cycle: Month 1 of 6\. 1 installments paid\./);
 assert.doesNotMatch(rendered.text,/Billing Period:|Installment: 1 of/);
 domain.collect(b,{now:new Date('2026-10-07T09:00:00Z')});
 assert.equal(JSON.stringify(legacy),original);
 assert.equal(emails.render(legacy,options).html,rendered.html);
 assert.equal(b.notifications.at(-1).snapshot.receiptVersion,2);
});

test('one-time receipts omit installment metadata; incomplete new receipt shows unknown period',()=>{
 const b=bill({recurring:false});domain.checkout(b,payer(),new Date('2026-08-07T10:00:00Z'));
 assert.equal(b.notifications[0].snapshot.billingPeriod,null);
 assert.doesNotMatch(emails.render(b.notifications[0],options).text,/Billing Period:|Installment:|Billing Cycle:/);
 const recurring=bill();domain.checkout(recurring,payer(),new Date('2026-08-07T10:00:00Z'));
 recurring.notifications[0].snapshot.billingPeriod=null;
 assert.match(emails.render(recurring.notifications[0],options).text,/Billing Period: —/);
});

test('Python reference renderer matches new dates, preserves legacy and omits one-time fields',()=>{
 const directory='邮件模版html/邮件模版html/';
 const sample=JSON.parse(fs.readFileSync(directory+'billingReceiptStandaloneMonthlySample.json','utf8'));
 const render=data=>JSON.parse(execFileSync('python3',['-c',
  'import sys,json;sys.dont_write_bytecode=True;sys.path.insert(0,sys.argv[1]);from renderBillingReceipt import render_message;print(json.dumps(render_message(json.load(sys.stdin))))',directory
 ],{input:JSON.stringify(data),encoding:'utf8'}));
 let out=render(sample);
 for(const content of [out.html,out.text]) {
  assert.match(content,/Billing Period: Sep 7, 2026 – Oct 6, 2026/);
  assert.match(content,/Installment: 2 of 6/);
 }
 delete sample.receiptVersion;delete sample.billingPeriod;
 out=render(sample);assert.match(out.text,/Billing Cycle: Month 2 of 6/);assert.doesNotMatch(out.text,/Billing Period:/);
 sample.recurring=false;out=render(sample);assert.doesNotMatch(out.text,/Billing Period:|Installment:|Billing Cycle:/);
});
