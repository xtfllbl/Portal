import {test} from 'node:test';import assert from 'node:assert/strict';import {createServer} from 'node:http';import {createBillingService} from '../../server/billing-service.mjs';
test('shared clients, restricted public scope, idempotency and durable billing metadata',async()=>{
 let currentDate = new Date('2026-10-20T12:00:00Z');
 const service=createBillingService({filename:':memory:',now:()=>currentDate});
 const server=createServer((req,res)=>service.middleware(req,res,()=>{res.statusCode=404;res.end();}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/api/billing/';let cookie='';
 const request=async(path,value,admin=true)=>{const r=await fetch(base+path,{method:value===undefined?'GET':'POST',headers:{...(admin?{cookie}:{}),...(value===undefined?{}:{'Content-Type':'application/json'})},body:value===undefined?undefined:JSON.stringify(value)});return{status:r.status,data:await r.json(),headers:r.headers};};
 try{
 assert.equal((await request('records',undefined,false)).status,401);
 cookie=(await request('session',{})).headers.get('set-cookie').split(';')[0];
 const record={id:'fixture',merchantId:'m1',merchantName:'Fixture Merchant',invoice:'1001',currency:'EUR',amount:200,cycle:3,recurring:true,start:'2026-09-17',expiry:'2027-10-10'};
 const created=await request('records',record);assert.equal(created.status,200);const token=created.data.linkToken;
 const sent=await request('records/fixture/send',{email:'billing@example.com'});assert.equal(sent.data.deliveries[0].status,'Simulated');
 const page=await request('public/'+token,undefined,false);assert.equal(page.data.totalAmount,600);assert.equal(page.data.merchantId,'m1');assert.equal(page.data.linkToken,undefined);
 assert.equal((await request('public/'+'a'.repeat(48),undefined,false)).status,404);
 assert.equal((await request('records/fixture/pay',{merchantId:'m2'})).status,400);
 const payment={requestId:'simulated-request-12345',email:'fixture@example.com',brand:'Visa',last4:'4242',recurringConsent:true,acceptedTerms:true};
 const results=await Promise.all([request('public/'+token+'/pay',payment,false),request('public/'+token+'/pay',payment,false)]);
 assert.ok(results.every(r=>r.status===200));assert.equal(results[0].data.payments.length,2);
 const portal=await request('records');assert.equal(portal.data.records[0].paidInstallments,2);assert.equal(portal.data.records[0].payments.length,2);
 await request('import',{records:[record]});assert.equal((await request('records')).data.records[0].paidInstallments,2);
 assert.equal((await request('records',{...record,amount:1})).status,400);
 assert.equal(JSON.stringify((await request('public/'+token,undefined,false)).data).includes('fixture@example.com'),false);
 assert.equal(portal.data.records[0].notifications.filter(n=>n.type==='receipt').length,2);
 currentDate = new Date('2026-11-17T12:00:00Z'); service.tick();
 const completed = await request('public/'+token,undefined,false); assert.equal(completed.data.status,'Paid'); assert.equal(completed.data.payments.length,3);
 service.tick(); assert.equal((await request('records')).data.records[0].payments.length,3);
 }finally{await new Promise(resolve=>server.close(resolve));service.close();}
});

test('standalone links collect once or through a finite contract and reject merchant-portal payment', async () => {
 let currentDate = new Date('2026-09-07T12:00:00Z');
 const service = createBillingService({filename: ':memory:', now: () => currentDate});
 const server = createServer((req, res) => service.middleware(req, res, () => res.end()));
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const base = 'http://127.0.0.1:' + server.address().port + '/api/billing/';
 let cookie = '';
 const request = async (path, value, admin = true) => {
  const response = await fetch(base + path, {method: value === undefined ? 'GET' : 'POST', headers: {...(admin ? {cookie} : {}), 'Content-Type':'application/json'}, body: value === undefined ? undefined : JSON.stringify(value)});
  return {status:response.status, data:await response.json(), headers:response.headers};
 };
 try {
  cookie = (await request('session', {})).headers.get('set-cookie').split(';')[0];
  for (const recurring of [false, true]) {
   const id = recurring ? 'standalone-monthly' : 'standalone-once';
   const input = {id, assignment:'standalone', merchantId:'stale-merchant', merchantName:'Stale merchant', recurring, cycle:3, amount:12, currency:'USD', start:'2026-09-17', expiry:'2026-09-30', billType:'eSIM Billing', includedData:1024};
   const created = await request('records', input);
   assert.equal(created.status, 200);
   assert.equal(created.data.merchantId, null);
   assert.equal(created.data.merchantName, '');
   const token = created.data.linkToken;
   assert.equal((await request('public/' + token, undefined, false)).data.assignment, 'standalone');
   assert.equal((await request('records/' + id + '/send', {email:'external@example.com'})).status, 200);
   const payment = {requestId:'external-payment-1234567', email:'payer@example.com', brand:'Visa', last4:'4242', acceptedTerms:true, recurringConsent:recurring};
   for (const merchantId of [null, '', 'null', 'stale-merchant']) {
    assert.equal((await request('records/' + id + '/pay', {...payment, merchantId})).status, 400);
   }
   const paid = await request('public/' + token + '/pay', payment, false);
   assert.equal(paid.status, 200);
   assert.equal(paid.data.paidInstallments, 1);
   assert.equal(paid.data.status, recurring ? 'Active' : 'Paid');
   const repeated = await request('public/' + token + '/pay', payment, false);
   assert.equal(repeated.data.payments.length, 1);
   assert.equal((await request('public/' + token + '/pay', {...payment, requestId:'different-payment-123456'}, false)).status, 400);
   assert.equal((await request('records', input)).status, 400);
   await request('import', {records:[input]});
   const reopened = await request('public/' + token, undefined, false);
   assert.equal(reopened.data.payments.length, 1);
   assert.equal(reopened.data.includedData, 1024);
  }
  const expired = await request('records', {id:'expired-standalone', assignment:'standalone', currency:'USD', amount:12, expiry:'2026-09-01'});
  assert.equal((await request('public/' + expired.data.linkToken + '/pay', {requestId:'expired-request-123456'}, false)).status, 400);
  currentDate = new Date('2026-11-17T12:00:00Z');
  service.tick(); service.tick();
  const records = (await request('records')).data.records;
  const monthly = records.find(r => r.id === 'standalone-monthly');
  assert.equal(monthly.status, 'Paid');
  assert.equal(monthly.payments.length, 3);
  assert.equal(monthly.assignment, 'standalone');
  assert.equal(monthly.merchantId, null);
  assert.equal(records.find(r => r.id === 'standalone-once').payments.length, 1);
 } finally {
  await new Promise(resolve => server.close(resolve)); service.close();
 }
});
