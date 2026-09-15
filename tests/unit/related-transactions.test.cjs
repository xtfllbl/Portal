const {test}=require('node:test');
const assert=require('node:assert/strict');
const tx=require('../../scripts/transaction-records.js');
const record=(id,parent,extra={})=>({paywizardId:id,transId:'T-'+id,mid:'M1',transactionChannel:'P1',processorTime:'2026-01-01 00:00:00',type:parent?'Refund':'Purchase',status:'completed',amount:'10.00',currency:'USD',...(parent?{originalRecordId:parent}:{}),...extra});
test('all entry points return ancestors, siblings, descendants and all results without summing amounts',()=>{
 const rows=[record('S'),record('F','S',{status:'failed'}),record('P','S',{status:'pending'}),record('R','S'),record('V','R')];
 for(const r of rows){const g=tx.related(rows,r.paywizardId);assert.equal(g.total,5);assert.equal(g.root.paywizardId,'S');assert.equal(g.parents.get('V'),'R');assert.deepEqual(g.items.map(x=>x.amount),Array(5).fill('10.00'));assert.equal(g.totalAmount,undefined);}
});
test('only explicit references in matching merchant and channel connect',()=>{
 const rows=[record('S'),record('R',null,{originalTransId:'T-S'}),record('other','S',{mid:'M2'}),record('channel','S',{transactionChannel:'P2'}),record('same-card')];
 assert.equal(tx.related(rows,'S').total,2);assert.equal(tx.related(rows,'other').total,1);
});
test('ambiguous external references do not select an arbitrary parent',()=>{
 const rows=[record('S'),record('S2',null,{transId:'T-S'}),record('R',null,{originalTransId:'T-S'})];
 const g=tx.related(rows,'R');assert.equal(g.total,1);assert.equal(g.parents.size,0);assert.equal(g.incomplete,true);
});
test('missing parent resolves on the next load when its record arrives',()=>{
 const r=record('R','S');assert.equal(tx.related([r],'R').total,1);const g=tx.related([r,record('S')],'R');assert.equal(g.total,2);assert.equal(g.parents.get('R'),'S');
});
test('cycles terminate and flag incomplete relationships',()=>{
 const g=tx.related([record('A','B'),record('B','A')],'A');assert.equal(g.total,2);assert.equal(g.incomplete,true);assert.equal(g.root,null);
});
test('visibility is applied before traversal and counts; unknown or hidden entry is rejected',()=>{
 const rows=[record('S'),record('R','S')];const view=r=>r.paywizardId==='S';const g=tx.related(rows,'S',view);assert.equal(g.total,1);assert.equal(g.incomplete,false);assert.throws(()=>tx.related(rows,'R',view),/unavailable/);assert.throws(()=>tx.related(rows,'missing'),/unavailable/);
});
test('duplicate identities never inflate counts',()=>{const a=record('A');const g=tx.related([a,{...a}],'A');assert.equal(g.total,1);assert.equal(g.incomplete,true);});
test('shared fixtures contain a mixed-result sale and a multi-level capture group',()=>{
 const rows=tx.getRecords();const g=tx.related(rows,'PWR-DEMO-FAILED');assert.equal(g.total,5);assert.deepEqual(new Set(g.items.map(r=>r.status)),new Set(['completed','failed','pending']));
 const capture=tx.related(rows,'PWV-DEMO-REFUND-VOID');assert.equal(capture.total,7);assert.equal(capture.root.paywizardId,'PWA-20260407-100812');assert.equal(capture.parents.get('PWR-DEMO-CAPTURE-REFUND'),'PWC-DEMO-CAPTURE');
 assert.equal(rows.filter(r=>r.paywizardId.startsWith('PW-20260406-')&&r.originalTransId).length,0);
});
test('created records remain available for detail reload in the same session',()=>{
 const values=new Map();global.sessionStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 try{const r=record('NEW','PWV-260427-100183',{mid:'202604270000183',transactionChannel:'FISERV'});tx.saveRecord(r);assert.equal(tx.getRecords().find(r=>r.paywizardId==='NEW').originalRecordId,'PWV-260427-100183');assert.equal(tx.related(tx.getRecords(),'NEW').total,6);}finally{delete global.sessionStorage;}
});
test('conflicting internal and external references do not connect',()=>{const g=tx.related([record('S'),record('R','S',{originalTransId:'T-WRONG'})],'R');assert.equal(g.total,1);assert.equal(g.incomplete,true);});
test('unscoped references are not trusted',()=>{const g=tx.related([record('S',null,{mid:undefined}),record('R','S',{mid:undefined})],'R');assert.equal(g.total,1);});
