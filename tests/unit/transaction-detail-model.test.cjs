const {test}=require('node:test');
const assert=require('node:assert/strict');
const records=require('../../scripts/transaction-records.js');
const {describe}=require('../../scripts/transaction-detail-model.js');
const titles=['Transaction','Merchant','Card','Amounts','DCC','EMV','Original','Point Of Sale','Extra'];
const field=(model,group,label)=>model.groups.find(g=>g.title===group).fields.find(f=>f[0]===label)?.[1];
test('all nine original groups and their fields remain present even with sparse records',()=>{
 const model=describe(records.getRecords().find(r=>r.paywizardId==='PW-20260407-121642'));
 assert.deepEqual(model.groups.map(g=>g.title),titles);
 assert.deepEqual(model.groups.map(g=>g.fields.length),[18,10,7,6,6,4,4,5,5]);
 assert.equal(field(model,'EMV','EMV AID'),undefined);
 assert.equal(field(model,'Point Of Sale','External Order No.'),undefined);
 assert.equal(field(model,'Transaction','Transaction Amount'),'USD 21.40');
});
test('original demo retains its own complete technical payload and distinct amount units',()=>{
 const model=describe(records.getRecords().find(r=>r.paywizardId==='1022553788583641089'));
 assert.equal(field(model,'Transaction','Transaction Amount'),'EUR 2.50');
 assert.equal(field(model,'Amounts','Transaction Amount'),250);
 assert.equal(field(model,'Amounts','Tip Amount'),0);
 assert.equal(field(model,'Extra','Has MSR'),false);
 assert.equal(field(model,'EMV','EMV AID'),'A0000000031010');
 assert.equal(field(model,'Merchant','Merchant ID'),'444500187868600');
 assert.equal(model.summary.find(f=>f[0]==='Merchant ID')[1],'MRC88214011');
 assert.equal(model.summary.find(f=>f[0]==='External Order No.')[1],'EXT-ORDER-20260327-887241');
});
test('new transactions do not borrow original demo data or treat formatted tips as raw amounts',()=>{
 const model=describe(records.getRecords().find(r=>r.paywizardId==='PWT-260427-100183'));
 assert.equal(field(model,'Amounts','Tip Amount'),undefined);
 assert.equal(field(model,'Transaction','Transaction Amount'),'USD 1.00');
 assert.equal(field(model,'Card','Card Token'),undefined);
 assert.equal(field(model,'Original','Original Transaction ID'),'TRX-100183');
});
