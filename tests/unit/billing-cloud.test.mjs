import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createBlobRepository} from '../../server/billing-blob.mjs';
import {createCloudHandler} from '../../server/billing-cloud.mjs';

function fixture() {
 let value=null, version=0, writes=0;
 const repository=createBlobRepository({
  read:async(path,options)=>{
   assert.equal(options.access,'private');assert.equal(options.useCache,false);
   return value===null?null:{statusCode:200,stream:new Response(value).body,blob:{etag:String(version)}};
  },
  write:async(path,data,options)=>{
   await Promise.resolve();
   assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);
   if (value!==null && (!options.allowOverwrite || options.ifMatch!==String(version))) throw new BlobPreconditionFailedError();
   value=data;version++;writes++;return{etag:String(version)};
  }
 });
 return {repository,records:()=>JSON.parse(value).records,writes:()=>writes};
}
test('Blob compare-and-swap retries concurrent changes without losing records',async()=>{
 const f=fixture();
 await Promise.all(Array.from({length:5},(_,i)=>f.repository.transact(records=>records.push({id:String(i)}))));
 assert.equal(f.records().length,5);
 assert.equal(new Set(f.records().map(r=>r.id)).size,5);
 const before=f.writes();
 await f.repository.transact(records=>records.length);
 assert.equal(f.writes(),before);
});
test('cloud sessions, CORS, concurrent public payments and scheduled completion',async()=>{
 const f=fixture();let clock=new Date('2026-09-07T00:00:00Z');
 const handler=createCloudHandler({repository:f.repository,adminKey:'a'.repeat(40),cronKey:'cron-test-key',configured:true,now:()=>clock,publicOrigin:'https://demo.test'});
 async function request(path,{body,token,origin,cookie,method=body===undefined?'GET':'POST'}={}){
  let response;const headers={};
  await handler({url:'/api/billing?path='+encodeURIComponent(path),method,body,headers:{host:'demo.test',...(token?{authorization:'Bearer '+token}:{}),...(origin?{origin}:{}),...(cookie?{cookie}:{})}},
   {statusCode:200,setHeader(k,v){headers[k]=v;},end(raw){response={status:this.statusCode,data:raw?JSON.parse(raw):null,headers};}});
  return response;
 }
 assert.equal((await request('config')).data.mode,'shared');
 assert.equal((await request('records')).status,401);
 assert.equal((await request('session',{body:{accessKey:'wrong'}})).status,401);
 const login=await request('session',{body:{accessKey:'a'.repeat(40)},origin:'http://127.0.0.1:5500'});
 assert.equal(login.status,200);
 const token=login.data.token;
 assert.equal((await request('records',{cookie:login.headers['Set-Cookie'].split(';')[0]})).status,200);
 assert.equal((await request('records',{token,origin:'https://evil.test'})).status,403);
 const record={id:'cloud-bill',assignment:'standalone',amount:12,recurring:true,cycle:3,currency:'USD',start:'2026-09-17',expiry:'2026-09-30'};
 const created=await request('records',{body:record,token});assert.equal(created.status,200);
 const link=created.data.linkToken;
 const payment={requestId:'same-cloud-payment-123456',email:'demo@example.com',brand:'Visa',last4:'4242',acceptedTerms:true,recurringConsent:true};
 const payments=await Promise.all(Array.from({length:4},()=>request('public/'+link+'/pay',{body:payment})));
 assert.ok(payments.every(r=>r.status===200));
 assert.equal(f.records()[0].payments.length,1);
 assert.equal((await request('public/'+link+'/pay',{body:{...payment,requestId:'different-cloud-request-123'}})).status,400);
 const publicResult=await request('public/'+link);
 assert.equal(publicResult.data.authorization.token,undefined);
 assert.equal(publicResult.data.authorization.email,undefined);
 assert.equal(publicResult.data.linkToken,undefined);
 assert.equal((await request('records/cloud-bill/pay',{body:{...payment,merchantId:null},token})).status,400);
 await request('import',{body:{records:[record]},token});
 assert.equal(f.records()[0].payments.length,1);
 clock=new Date('2026-11-17T00:00:00Z');
 assert.equal((await request('cron')).status,401);
 assert.equal((await request('cron',{token:'cron-test-key'})).status,200);
 assert.equal(f.records()[0].payments.length,3);
 assert.equal(f.records()[0].status,'Paid');
 assert.equal((await request('records',{token})).status,401); // management session expired
 const reopened=await request('public/'+link);
 assert.equal(reopened.data.status,'Paid');
});
test('unconfigured hosted billing advertises shared mode rather than pretending to save locally',async()=>{
 const handler=createCloudHandler({repository:fixture().repository,configured:false});
 let config;await handler({url:'/api/billing/config',method:'GET',headers:{host:'demo.test'}},{setHeader(){},end(raw){config=JSON.parse(raw);}});
 assert.deepEqual(config,{mode:'shared',configured:false});
});
