const {test}=require('node:test');
const assert=require('node:assert/strict');
const records=require('../../scripts/transaction-records.js');
const {describe}=require('../../scripts/transaction-detail-model.js');
const field=(model,group,label)=>model.groups.find(item=>item.title===group)?.fields.find(item=>item[0]===label)?.[1];

test('sparse transaction details hide unavailable optional fields and empty modules',()=>{
 const model=describe(records.getRecords().find(row=>row.recordKey==='standalone-001'));
 assert.equal(field(model,'Transaction','Transaction ID'),'735240918572600001');
 assert.equal(field(model,'Transaction','Reference Number (RRN)').length,12);
 assert.equal(field(model,'Transaction','Checkout ID'),undefined);
 assert.equal(model.groups.some(group=>group.title==='Original'),false);
 assert.equal(model.groups.some(group=>group.title==='DCC'),false);
 assert.equal(model.summary.length,8);
});
test('detailed card data keeps populated technical modules and correct amount units',()=>{
 const model=describe(records.getRecords().find(row=>row.recordKey==='detailed-visa-purchase-001'));
 assert.equal(field(model,'Transaction','Transaction Amount'),'EUR 2.50');
 assert.equal(field(model,'Amounts','Transaction Amount'),'2.50');
 assert.equal(field(model,'Amounts','Tip Amount'),'0.00');
 assert.equal(field(model,'Extra','Has MSR'),false);
 assert.equal(field(model,'EMV','EMV AID'),'A0000000031010');
 assert.equal(field(model,'Merchant','Merchant ID'),'444500187868600');
 assert.equal(model.summary.find(item=>item[0]==='External Order No.')[1],'EXT-20260913-887241');
});
test('all transaction types keep the eight-card header summary',()=>{
 for(const key of ['prepaid-sale-001','fiserv-mc-preauth-001','fiserv-mc-refund-001','tsys-mc-void-001']){
  const model=describe(records.getRecords().find(row=>row.recordKey===key));assert.equal(model.summary.length,8);assert.deepEqual(model.summary.map(item=>item[0]),['Transaction Time','External Order No.','Merchant ID','Terminal ID','Approval Code','Reference Number','Transaction ID','Terminal Name']);
 }
 assert.equal(describe(records.getRecords().find(row=>row.recordKey==='fiserv-mc-preauth-001')).summary.find(item=>item[0]==='External Order No.')[1],undefined);
});
test('one transaction id is used consistently and retired ids never render',()=>{
 const row=records.getRecords().find(item=>item.recordKey==='fiserv-mc-refund-001'),model=describe(row);
 assert.equal(field(model,'Transaction','Transaction ID'),row.transactionId);
 assert.equal(field(model,'Original','Original Transaction ID'),'84607420437');
 const labels=model.groups.flatMap(group=>group.fields.map(item=>item[0]));
 assert.equal(labels.includes('PAYWizard ID'),false);assert.equal(labels.includes('Trans Log ID'),false);assert.equal(labels.includes('Trans Index Code'),false);
});
