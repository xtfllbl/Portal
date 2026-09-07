import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBill, checkout, collect, summary, publicView, monthlyDate } from '../../server/billing-engine.mjs';
const input=(extra={})=>({id:'bill-1',merchantId:'merchant-1',merchantName:'Demo Merchant',invoice:'1001',currency:'EUR',amount:200,recurring:true,cycle:3,start:'2026-09-17',expiry:'2027-10-10',...extra});
const details=(extra={})=>({requestId:'request-1234567890',email:'demo@example.com',last4:'4242',brand:'Visa',acceptedTerms:true,recurringConsent:true,...extra});
test('first payment is immediate, remaining dates stay service anchored',()=>{
 const b=makeBill(input());checkout(b,details(),new Date('2026-09-07T12:00:00Z'));
 assert.equal(summary(b).paidInstallments,1);assert.equal(summary(b).nextPaymentDate,'2026-10-17');assert.equal(b.payments[0].amount,200);
 assert.equal(b.installments[0].due,'2026-09-17');assert.equal(b.authorization.status,'Authorized');
 collect(b,{now:new Date('2026-10-16T12:00:00Z')});assert.equal(b.payments.length,1);
 collect(b,{now:new Date('2026-10-17T12:00:00Z')});assert.equal(b.payments.length,2);
});
test('overdue installments are separate charges in oldest-first order',()=>{
 const b=makeBill(input());checkout(b,details(),new Date('2026-10-20T12:00:00Z'));
 assert.deepEqual(b.payments.map(p=>[p.installment,p.amount]),[[1,200],[2,200]]);
 assert.notEqual(b.payments[0].id,b.payments[1].id);assert.equal(summary(b).nextPaymentDate,'2026-11-17');
});
test('failure stops catch-up, retains authorization and is not automatically retried',()=>{
 const b=makeBill(input());checkout(b,details(),new Date('2026-12-20T12:00:00Z'),{failAt:2});
 assert.deepEqual(b.payments.map(p=>p.status),['Succeeded','Failed']);assert.equal(summary(b).paidInstallments,1);assert.equal(b.status,'Overdue');assert.ok(b.authorization);
 collect(b,{now:new Date('2027-01-01T12:00:00Z')});assert.equal(b.payments.length,2);
});
test('fixed term completes once and never renews',()=>{
 const b=makeBill(input());checkout(b,details(),new Date('2026-12-20T12:00:00Z'));
 assert.equal(b.status,'Paid');assert.equal(b.payments.length,3);collect(b,{now:new Date('2030-01-01')});assert.equal(b.payments.length,3);
});
test('same request is idempotent, another first payment is rejected',()=>{
 const b=makeBill(input());checkout(b,details(),new Date('2026-09-07'));checkout(b,details(),new Date('2026-09-07'));assert.equal(b.payments.length,1);
 assert.throws(()=>checkout(b,details({requestId:'request-0987654321'}),new Date('2026-09-07')),/already/);
});
test('expiry blocks initial checkout but not authorized collections',()=>{
 const b=makeBill(input({expiry:'2026-09-30'}));assert.throws(()=>checkout(b,details(),new Date('2026-10-01')),/expired/);
 checkout(b,details(),new Date('2026-09-07'));collect(b,{now:new Date('2026-10-17')});assert.equal(b.payments.length,2);
});
test('one-time payment has one record and needs no recurring consent',()=>{
 const b=makeBill(input({recurring:false}));checkout(b,details({recurringConsent:false}),new Date('2026-09-07'));assert.equal(b.payments.length,1);assert.equal(b.status,'Paid');assert.equal(b.authorization,null);
});
test('recurring authorization is explicit and public response omits internal method token and email',()=>{
 const b=makeBill(input());assert.throws(()=>checkout(b,details({recurringConsent:false}),new Date('2026-09-07')),/authorization/);
 checkout(b,details(),new Date('2026-09-07'));const view=publicView(b);assert.equal(view.authorization.last4,'4242');assert.equal(view.authorization.token,undefined);assert.equal(view.authorization.email,undefined);assert.equal(view.linkToken,undefined);assert.equal(view.deliveries,undefined);
});
test('month end clamping preserves the original anchor',()=>{
 assert.equal(monthlyDate('2026-01-31',1),'2026-02-28');assert.equal(monthlyDate('2026-01-31',2),'2026-03-31');assert.equal(monthlyDate('2028-01-31',1),'2028-02-29');
});
test('legacy paid installments remain paid without inventing card authorization or transactions',()=>{
 const b=makeBill(input({paidInstallments:1,currentInstallmentPaid:true}),new Date(),true);assert.equal(summary(b).paidInstallments,1);assert.equal(b.payments.length,0);assert.equal(b.authorization,null);
});
