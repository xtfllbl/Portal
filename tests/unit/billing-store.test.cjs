const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('scripts/billing-store.js', 'utf8');
function setup(value) {
 const data = new Map(value===undefined?[]:[['paywizard-billing-setup-v1',value]]);
 const context={location:{origin:'http://localhost'},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},window:{PaywizardPlatformMerchantStore:{readAll:()=>[{merchantId:'m1'}]}}};
 vm.runInNewContext(source,context);return{store:context.window.PaywizardBillingStore,data,context};
}
test('existing merchant browser starts empty; no example injection',()=>{assert.equal(setup().store.read().length,0);});
test('malformed local cache is not replaced',()=>{const{store,data}=setup('{bad');assert.throws(()=>store.read());assert.equal(data.get(store.key),'{bad');});
test('cent-accurate contract total and saved merchant context',()=>{const{store}=setup();assert.equal(store.total({amount:.1,cycle:3,recurring:true}),.3);store.selectMerchant('m1');assert.equal(store.selectedMerchant(),'m1');});

test('shared state remains readable when the browser cache cannot be written',()=>{const{store,context}=setup();context.localStorage.setItem=()=>{throw new Error('quota');};store.write([{id:'shared',merchantId:'m1',paidInstallments:1}]);assert.equal(store.read()[0].paidInstallments,1);});

test('cache accepts explicit standalone records and legacy merchants without inventing ownership', () => {
 const records = [{id:'legacy',merchantId:'m1'}, {id:'standalone',assignment:'standalone',merchantId:null,merchantName:''}];
 const {store} = setup(JSON.stringify(records));
 assert.equal(store.read().length, 2);
 assert.equal(store.isMerchantRecord(store.read()[0]), true);
 assert.equal(store.isMerchantRecord(store.read()[1]), false);
 for (const bad of [{id:'missing'}, {id:'bad',assignment:'unknown',merchantId:'m1'}, {id:'conflict',assignment:'standalone',merchantId:'m1'}]) {
  assert.throws(() => setup(JSON.stringify([bad])).store.read(), /Invalid billing data/);
 }
});

test('local renewal retains the original URL and old link reads the stopped record',async()=>{
 const crypto=require('node:crypto').webcrypto,domain=require('../../scripts/billing-domain.js');
 const data=new Map([['paywizard-billing-runtime-v1',JSON.stringify({mode:'local'})],['paywizard-billing-local-v1','[]']]);
 const context={crypto,Date,URL,TextEncoder,TextDecoder,Uint8Array,btoa,atob,navigator:{},Event:class{},location:{origin:'http://localhost',href:'http://localhost/44.billing_overview.html'},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},window:{PaywizardBillingDomain:domain,PaywizardPlatformMerchantStore:{readAll:()=>[{merchantId:'m1'}]},dispatchEvent(){},addEventListener(){}}};
 vm.runInNewContext(source,context);const store=context.window.PaywizardBillingStore;await store.initialize();
 const bill=await store.save({id:'local-renew-test',assignment:'standalone',currency:'USD',amount:24,recurring:true,cycle:3,start:'2020-01-01',expiry:'2020-02-01'});
 const url=store.link(bill),token=new URL(url).hash.slice(1);
 assert.equal((await store.publicBill(token)).linkStatus,'Expired');
 const renewal=await store.renew(bill.id,{expiry:'2099-10-09'});assert.equal(store.link(renewal),url);
 assert.equal((await store.publicBill(token)).linkStatus,'Valid');
 await store.stop(bill.id,'Stop local collection');
 assert.equal((await store.publicBill(token)).status,'Stopped');
 assert.equal(store.link(store.read().find(r=>r.id===bill.id)),url);
 await assert.rejects(()=>store.publicBill(token,{requestId:crypto.randomUUID(),email:'payer@example.com',last4:'4242',brand:'Visa',acceptedTerms:true,recurringConsent:true}),/stopped/);
 assert.equal(JSON.parse(data.get('paywizard-billing-local-v1')).find(r=>r.id===bill.id).audit.length,2);
});
