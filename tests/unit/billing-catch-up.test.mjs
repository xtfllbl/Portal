import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeBill,checkout,collect,retryPayment,summary,publicView,stopCollection,sendLink} from '../../server/billing-engine.mjs';
const at = value => new Date(value);
const input = extra => ({id:crypto.randomUUID(),invoice:'CATCH-1',merchantId:'m1',merchantName:'Test Shop',currency:'USD',amount:100,recurring:true,cycle:6,start:'2027-01-10',expiry:'2027-01-31',...extra});
const payment = () => ({requestId:crypto.randomUUID(),email:'payer@example.com',brand:'Visa',last4:'4242',acceptedTerms:true,recurringConsent:true});
const retry = (bill,time,extra={}) => retryPayment(bill,{source:'operator',requestId:crypto.randomUUID(),confirmed:true,expectedInstallments:summary(bill,at(time)).dueInstallments},at(time),extra);
function authorized() {const b=makeBill(input(),at('2027-01-10T10:00:00Z'));checkout(b,payment(),at('2027-01-10T10:00:00Z'));return b;}
test('at 09:00 next schedule retries oldest failure separately through current installment',()=>{
 const b=authorized();collect(b,{now:at('2027-02-10T08:59:59Z')});assert.equal(b.payments.length,1);
 collect(b,{now:at('2027-02-10T09:00:00Z'),failAt:2});assert.equal(b.status,'Overdue');
 assert.equal(summary(b,at('2027-02-10T09:00:00Z')).nextAutomaticAttemptAt,'2027-03-10T09:00:00.000Z');
 for(const time of ['2027-02-10T10:00:00Z','2027-02-11T10:00:00Z','2027-03-10T08:59:59Z'])collect(b,{now:at(time)});
 assert.equal(b.payments.length,2);
 collect(b,{now:at('2027-03-10T09:00:00Z')});assert.deepEqual(b.payments.map(p=>[p.installment,p.status]),[[1,'Succeeded'],[2,'Failed'],[2,'Succeeded'],[3,'Succeeded']]);
 assert.equal(summary(b,at('2027-03-10T09:00:00Z')).status,'Active');
 collect(b,{now:at('2027-03-10T09:01:00Z')});assert.equal(b.payments.length,4);
 assert.equal(b.notifications.filter(n=>n.type==='receipt').length,3);assert.equal(b.notifications.filter(n=>n.type==='failure').length,1);
});
test('catch-up stops midway, receipts use per-success snapshots, retry resumes only unpaid',()=>{
 const b=authorized();collect(b,{now:at('2027-04-10T09:00:00Z'),failAt:3});
 assert.deepEqual(b.payments.map(p=>p.installment),[1,2,3]);
 const receipt=b.notifications.filter(n=>n.type==='receipt').at(-1);assert.equal(receipt.snapshot.payment.amount,100);assert.equal(receipt.snapshot.paidInstallmentCount,2);assert.equal(receipt.snapshot.overdueRemaining,true);
 const failure=b.notifications.at(-1);assert.equal(failure.snapshot.failedPayment.installment,3);assert.deepEqual(failure.snapshot.successfulPayments.map(p=>p.installment),[2]);assert.deepEqual(failure.snapshot.unpaidInstallments.map(i=>i.number),[3,4]);
 const copy=structuredClone(receipt);retry(b,'2027-04-11T10:00:00Z');assert.deepEqual(b.payments.slice(-2).map(p=>p.installment),[3,4]);assert.deepEqual(receipt,copy);
 assert.equal(summary(b,at('2027-04-11T10:00:00Z')).paidInstallments,4);
});
test('manual failure suppresses automatic collection for the UTC day, next month resumes',()=>{
 const b=authorized();collect(b,{now:at('2027-02-10T09:00:00Z'),failAt:2});
 retry(b,'2027-03-10T08:00:00Z',{failAt:2});
 assert.equal(summary(b,at('2027-03-10T08:00:00Z')).nextAutomaticAttemptAt,'2027-04-10T09:00:00.000Z');
 collect(b,{now:at('2027-03-10T09:00:00Z')});collect(b,{now:at('2027-03-11T10:00:00Z')});assert.equal(b.payments.length,3);
 collect(b,{now:at('2027-04-10T09:00:00Z')});assert.deepEqual(b.payments.slice(-3).map(p=>p.installment),[2,3,4]);
});
test('final scheduled failure has no new automatic collection dates but remains retryable',()=>{
 const b=authorized();collect(b,{now:at('2027-06-10T09:00:00Z'),failAt:5});const count=b.payments.length;
 assert.equal(summary(b,at('2027-06-10T10:00:00Z')).nextAutomaticAttemptAt,null);
 for(const time of ['2027-07-10T09:00:00Z','2030-01-01T09:00:00Z'])collect(b,{now:at(time)});
 assert.equal(b.payments.length,count);retry(b,'2027-07-11T10:00:00Z');assert.equal(b.status,'Paid');assert.deepEqual(b.payments.slice(-2).map(p=>p.installment),[5,6]);
 const last=b.notifications.at(-1);assert.equal(last.snapshot.paidInstallmentCount,6);assert.equal(last.snapshot.nextAutomaticAttemptAt,null);
});
test('late initial payment failure and old records do not replay past automatic dates',()=>{
 const b=makeBill(input({expiry:'2028-01-01'}));checkout(b,payment(),at('2027-04-15T10:00:00Z'),{failAt:2});
 delete b.scheduledRuns;delete b.collectionRounds;delete b.lastManualFailureDate;const count=b.payments.length;
 collect(b,{now:at('2027-04-16T10:00:00Z')});assert.equal(b.payments.length,count);
 collect(b,{now:at('2027-05-10T09:00:00Z')});assert.deepEqual(b.payments.slice(count).map(p=>p.installment),[2,3,4,5]);
});
test('first failure before a future start waits for the second installment date',()=>{
 const b=makeBill(input());checkout(b,payment(),at('2027-01-01T10:00:00Z'),{failAt:1});
 collect(b,{now:at('2027-01-10T09:00:00Z')});assert.equal(b.payments.length,1);
 collect(b,{now:at('2027-02-10T09:00:00Z')});assert.deepEqual(b.payments.slice(1).map(p=>p.installment),[1,2]);
});
test('same-day explicit manual retry remains available and never pays future installments',()=>{
 const b=authorized();collect(b,{now:at('2027-02-10T09:00:00Z'),failAt:2});retry(b,'2027-02-10T10:00:00Z',{failAt:2});retry(b,'2027-02-10T11:00:00Z');
 assert.equal(summary(b,at('2027-02-10T11:00:00Z')).paidInstallments,2);
});
test('notification recipients and internals never leak through public view',()=>{
 const b=makeBill(input());sendLink(b,{email:'invited@example.com'},at('2027-01-10T09:00:00Z'));checkout(b,payment(),at('2027-01-10T10:00:00Z'),{failAt:1});
 assert.equal(b.notifications[0].email,'invited@example.com');assert.equal(b.notifications[1].email,'payer@example.com');
 const view=publicView(b);for(const field of ['notifications','payerContact','collectionRounds','scheduledRuns','lastManualFailureDate'])assert.equal(view[field],undefined);
 assert.ok(!JSON.stringify(view).includes('payer@example.com'));
});
test('one-time failure produces a failure event, duplicate request does not generate another',()=>{
 const b=makeBill(input({recurring:false})),p=payment();checkout(b,p,at('2027-01-10T10:00:00Z'),{failAt:1});checkout(b,p,at('2027-01-10T10:00:00Z'));
 assert.equal(b.notifications.length,1);assert.equal(b.notifications[0].snapshot.hasAuthorization,false);assert.equal(b.notifications[0].snapshot.nextAutomaticAttemptAt,null);
});
test('unauthorized overdue records never generate automatic payments or notifications',()=>{
 const b=makeBill(input());collect(b,{now:at('2027-04-10T09:00:00Z')});assert.equal(b.notifications.length,0);assert.equal(b.payments.length,0);
});
test('stop suppresses queued failed-payment notices and any future collection',()=>{
 const b=authorized();collect(b,{now:at('2027-02-10T09:00:00Z'),failAt:2});stopCollection(b,{},at('2027-02-11T10:00:00Z'));const count=b.payments.length;
 collect(b,{now:at('2027-03-10T09:00:00Z')});assert.equal(b.payments.length,count);assert.equal(b.notifications.at(-1).status,'Suppressed');assert.equal(summary(b).nextAutomaticAttemptAt,null);
});
test('strict amounts and notes reject silent truncation, empty draft amount remains valid',()=>{
 for(const amount of [-2,.001,1.234,NaN])assert.throws(()=>makeBill(input({amount})),/amount/);
 assert.throws(()=>makeBill(input({notes:'a'.repeat(2001)})),/2000/);
 assert.equal(makeBill(input({amount:'',status:'Draft'})).amount,'');
});

test('payer retry is denied even with an existing request id; operator retry is audited',()=>{
 const bill=makeBill({id:'operator-only',assignment:'standalone',invoice:'OP',currency:'USD',amount:10,recurring:true,cycle:3,start:'2027-01-10',expiry:'2028-01-01'},new Date('2027-01-10'));
 checkout(bill,{requestId:crypto.randomUUID(),email:'payer@example.com',last4:'4242',brand:'Visa',acceptedTerms:true,recurringConsent:true},new Date('2027-01-10'));
 collect(bill,{now:new Date('2027-03-10T09:00:00Z'),failAt:2});
 const request={requestId:crypto.randomUUID(),confirmed:true};
 assert.throws(()=>retryPayment(bill,request,new Date('2027-03-11')),/Only platform/);
 retryPayment(bill,{...request,source:'operator'},new Date('2027-03-11'));
 assert.equal(bill.installments.filter(i=>i.status==='Paid').length,3);assert.equal(bill.audit.at(-1).action,'Retry Payment');assert.equal(bill.payments.at(-1).source,'operator-retry');
 assert.throws(()=>retryPayment(bill,request,new Date('2027-03-11')),/Only platform/);
});
