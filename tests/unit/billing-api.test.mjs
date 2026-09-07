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
 assert.equal(JSON.stringify(portal.data).includes('fixture@example.com'),false);
 currentDate = new Date('2026-11-17T12:00:00Z'); service.tick();
 const completed = await request('public/'+token,undefined,false); assert.equal(completed.data.status,'Paid'); assert.equal(completed.data.payments.length,3);
 service.tick(); assert.equal((await request('records')).data.records[0].payments.length,3);
 }finally{await new Promise(resolve=>server.close(resolve));service.close();}
});
