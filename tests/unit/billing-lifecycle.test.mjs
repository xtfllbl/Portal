import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {makeBill, checkout, collect, summary, publicView, retryPayment, stopCollection, renewLink, sendLink} from '../../server/billing-engine.mjs';
import {createBillingService} from '../../server/billing-service.mjs';
import {createCloudHandler} from '../../server/billing-cloud.mjs';
const now = new Date('2026-09-09T12:00:00Z');
const input = (extra={})=>({id:crypto.randomUUID(),assignment:'merchant',merchantId:'m1',merchantName:'Demo Merchant',invoice:'1001',currency:'USD',amount:24,recurring:true,cycle:6,start:'2026-07-01',expiry:'2026-10-10',...extra});
const payment=(extra={})=>({requestId:crypto.randomUUID(),email:'payer@example.com',last4:'4242',brand:'Visa',acceptedTerms:true,recurringConsent:true,...extra});
test('stop applies before authorization and after partial payment, never resumes collection',()=>{
 for(const recurring of [false,true])for(const paid of [false,true]){
  if(!recurring&&paid)continue;
  const bill=makeBill(input({recurring}),now);
  if(paid)checkout(bill,payment(),now,{failAt:2});
  const before=structuredClone(bill.payments),unpaid=bill.installments.filter(i=>i.status!=='Paid').length;
  stopCollection(bill,{reason:'Customer request'},now);
  collect(bill,{now:new Date('2030-01-01')});
  assert.deepEqual(bill.payments,before);assert.equal(bill.installments.filter(i=>i.status!=='Paid').length,unpaid);
  assert.equal(summary(bill,now).status,'Stopped');assert.equal(summary(bill,now).linkStatus,'Disabled');assert.equal(summary(bill,now).nextPaymentDate,null);
  assert.throws(()=>checkout(bill,payment(),now),/stopped/);
  assert.throws(()=>retryPayment(bill,{source:'operator',requestId:crypto.randomUUID(),confirmed:true},now),/stopped/);
  assert.throws(()=>renewLink(bill,{expiry:'2027-01-01'},now),/Only expired/);
  assert.throws(()=>sendLink(bill,{email:'payer@example.com'},now),/no longer/);
  assert.equal(publicView(bill,now).collectionStop,undefined);assert.equal(publicView(bill,now).audit,undefined);
  assert.equal(bill.audit[0].reason,'Customer request');
 }
});
test('stop rejects drafts and paid bills; reason is optional',()=>{
 const draft=makeBill(input({status:'Draft'}),now),paid=makeBill(input({recurring:false}),now);checkout(paid,payment(),now);
 for(const b of [draft,paid])assert.throws(()=>stopCollection(b,{reason:'Done'},now),/Only issued/);
 const bill=makeBill(input(),now);stopCollection(bill,{},now);assert.equal(bill.status,'Stopped');assert.equal(bill.collectionStop.reason,'');
});
test('renew keeps token and original schedule, records audit and validates delivery atomically',()=>{
 const bill=makeBill(input({expiry:'2026-08-01'}),now),token=bill.linkToken,installments=structuredClone(bill.installments);
 assert.equal(summary(bill,now).canRenew,true);assert.throws(()=>checkout(bill,payment(),now),/expired/);
 for(const expiry of ['2026-09-09','2026-02-30','not-a-date'])assert.throws(()=>renewLink(bill,{expiry},now),/expiry/);
 const before=structuredClone(bill);assert.throws(()=>renewLink(bill,{expiry:'2026-10-09',send:true,email:'bad'},now),/email/);assert.deepEqual(bill,before);
 renewLink(bill,{expiry:'2026-10-09',send:true,email:'payer@example.com'},now);
 assert.equal(bill.linkToken,token);assert.deepEqual(bill.installments,installments);assert.equal(bill.audit[0].previousExpiry,'2026-08-01');assert.equal(bill.deliveries.length,1);
 assert.equal(summary(bill,now).linkStatus,'Valid');assert.equal(summary(bill,now).dueAmount,72);
 checkout(bill,payment({expectedInstallments:[1,2,3]}),now);assert.deepEqual(bill.payments.map(p=>p.installment),[1,2,3]);
});
test('failed first payment retains authorization and uses confirmed idempotent retry despite expired link',()=>{
 const bill=makeBill(input({expiry:'2026-09-09'}),now);checkout(bill,payment(),now,{failAt:1});
 assert.equal(summary(bill,now).canRetry,true);assert.equal(summary(bill,now).linkStatus,'Used');
 assert.throws(()=>checkout(bill,payment(),now),/already/);
 assert.throws(()=>retryPayment(bill,{source:'operator',requestId:crypto.randomUUID()},now),/Confirm/);
 assert.throws(()=>retryPayment(bill,{source:'operator',requestId:crypto.randomUUID(),confirmed:true,expectedInstallments:[1]},now),/changed/);
 const later=new Date('2026-10-09'),request={source:'operator',requestId:crypto.randomUUID(),confirmed:true,expectedInstallments:[1,2,3,4]};
 retryPayment(bill,request,later,{failAt:2});const count=bill.payments.length;
 retryPayment(bill,request,later);assert.equal(bill.payments.length,count);assert.equal(summary(bill,later).paidInstallments,1);
 collect(bill,{now:later});assert.equal(bill.payments.length,count);
 retryPayment(bill,{source:'operator',...request,requestId:crypto.randomUUID(),expectedInstallments:[2,3,4]},later);
 assert.equal(summary(bill,later).paidInstallments,4);assert.equal(summary(bill,later).status,'Active');assert.equal(summary(bill,later).linkStatus,'Used');
});
for(const backend of ['sqlite','cloud'])test(backend+' lifecycle endpoints preserve shared state, auth boundary and expired-link renewal',async()=>{
 let clock=now, documents=[],cookie='',token='';
 const directory=mkdtempSync(join(tmpdir(),'billing-lifecycle-')),filename=join(directory,'billing.sqlite');
 const service=backend==='sqlite'?createBillingService({filename,now:()=>clock,publicOrigin:'http://demo.test'}):null;
 const handler=service?.middleware||createCloudHandler({repository:{async transact(fn){const next=structuredClone(documents);const result=fn(next);documents=next;return result;}},adminKey:'a'.repeat(40),configured:true,now:()=>clock,publicOrigin:'http://demo.test'});
 async function request(path,body,auth=true){
  const req=Readable.from(body===undefined?[]:[Buffer.from(JSON.stringify(body))]);req.url='/api/billing/'+path;req.method=body===undefined?'GET':'POST';req.headers={host:'demo.test',...(auth?{cookie,authorization:'Bearer '+token}:{})};req.socket={remoteAddress:'127.0.0.1'};
  let result;await handler(req,{statusCode:200,setHeader(k,v){if(k==='Set-Cookie')cookie=v.split(';')[0];},end(raw){result={status:this.statusCode,data:JSON.parse(raw)};}},()=>{});if(path==='session')token=result.data.token||'';return result;
 }
 try{
  await request('session',{accessKey:'a'.repeat(40)});
  const source=input({expiry:'2026-08-01'}),created=await request('records',source);assert.equal(created.status,200);const link=created.data.linkToken;
  assert.equal((await request('records/'+source.id+'/renew',{expiry:'2026-10-10'},false)).status,401);
  assert.equal((await request('public/'+link+'/stop',{reason:'forbidden'},false)).status,401);
  assert.equal((await request('public/'+link+'/pay',payment(),false)).status,400);
  const renewed=await request('records/'+source.id+'/renew',{expiry:'2026-10-10',send:true,email:'payer@example.com'});assert.equal(renewed.status,200);assert.equal(renewed.data.linkToken,link);
  assert.equal((await request('public/'+link,undefined,false)).data.linkStatus,'Valid');
  assert.equal((await request('public/'+link+'/pay',payment(),false)).data.paidInstallments,3);
  const stopped=await request('records/'+source.id+'/stop',{reason:'Stop remaining collections'});assert.equal(stopped.data.status,'Stopped');
  clock=new Date('2027-01-01');service?.tick();
  const publicResult=await request('public/'+link,undefined,false);assert.equal(publicResult.data.status,'Stopped');assert.equal(publicResult.data.paidInstallments,3);assert.equal(publicResult.data.audit,undefined);
  assert.equal((await request('public/'+link+'/retry',{requestId:crypto.randomUUID(),confirmed:true},false)).status,403);
  const retryBill=makeBill(input(),now);checkout(retryBill,payment(),now,{failAt:1});clock=now;
  if(backend==='cloud')documents.push(retryBill);
  else {
   const db=new DatabaseSync(filename);db.prepare('INSERT INTO bills(id,token,document) VALUES(?,?,?)').run(retryBill.id,retryBill.linkToken,JSON.stringify(retryBill));db.close();
  }
  assert.equal((await request('records/'+retryBill.id+'/retry',{requestId:crypto.randomUUID(),confirmed:true},false)).status,401);
  assert.equal((await request('public/'+retryBill.linkToken+'/retry',{requestId:crypto.randomUUID(),confirmed:true},false)).status,403);
  assert.equal((await request('public/'+retryBill.linkToken,undefined,false)).data.canRetry,false);
  const retried=await request('records/'+retryBill.id+'/retry',{requestId:crypto.randomUUID(),confirmed:true});assert.equal(retried.status,200);assert.equal(retried.data.paidInstallments,3);assert.equal(retried.data.audit.at(-1).action,'Retry Payment');

 }finally{service?.close();rmSync(directory,{recursive:true,force:true});}
});
