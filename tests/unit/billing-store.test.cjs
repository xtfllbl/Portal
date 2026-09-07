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
