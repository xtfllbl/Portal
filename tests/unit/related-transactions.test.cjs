const {test}=require('node:test');
const assert=require('node:assert/strict');
const tx=require('../../scripts/transaction-records.js');
const record=(key,parent,extra={})=>({recordKey:key,transactionId:'T-'+key,mid:'M1',transactionChannel:'P1',processorTime:'2026-01-01 00:00:00',type:parent?'Refund':'Purchase',status:'completed',amount:'10.00',currency:'USD',...(parent?{originalRecordKey:parent,originalTransactionId:'T-'+parent}:{}),...extra});

test('all entry points return ancestors, siblings and descendants without summing unlike operations',()=>{
 const rows=[record('S'),record('F','S',{status:'failed'}),record('F2','S',{status:'failed'}),record('R','S'),record('V','R')];
 for(const row of rows){const group=tx.related(rows,row.recordKey);assert.equal(group.total,5);assert.equal(group.root.recordKey,'S');assert.equal(group.parents.get('V'),'R');assert.equal(group.totalAmount,undefined);}
});
test('only explicit references in matching merchant and channel connect',()=>{
 const rows=[record('S'),record('R',null,{originalTransactionId:'T-S'}),record('other','S',{mid:'M2'}),record('channel','S',{transactionChannel:'P2'}),record('same-card')];
 assert.equal(tx.related(rows,'S').total,2);assert.equal(tx.related(rows,'other').total,1);
});
test('ambiguous external transaction ids do not select an arbitrary parent',()=>{
 const rows=[record('S'),record('S2',null,{transactionId:'T-S'}),record('R',null,{originalTransactionId:'T-S'})];
 const group=tx.related(rows,'R');assert.equal(group.total,1);assert.equal(group.parents.size,0);assert.equal(group.incomplete,true);
});
test('missing parent resolves when its record arrives and cycles terminate',()=>{
 const child=record('R','S');assert.equal(tx.related([child],'R').total,1);assert.equal(tx.related([child,record('S')],'R').parents.get('R'),'S');
 const cyclic=tx.related([record('A','B'),record('B','A')],'A');assert.equal(cyclic.total,2);assert.equal(cyclic.incomplete,true);assert.equal(cyclic.root,null);
});
test('visibility is applied before graph traversal',()=>{
 const rows=[record('S'),record('R','S')],view=row=>row.recordKey==='S';assert.equal(tx.related(rows,'S',view).total,1);assert.throws(()=>tx.related(rows,'R',view),/unavailable/);
});
test('curated fixtures contain accurate payment lifecycle relationships',()=>{
 const rows=tx.getRecords();
 const prepaid=tx.related(rows,'prepaid-refund-failed');assert.equal(prepaid.total,4);assert.deepEqual(new Set(prepaid.items.map(row=>row.status)),new Set(['completed','failed']));
 const settled=tx.related(rows,'fiserv-mc-refund-001');assert.equal(settled.total,4);assert.equal(settled.root.recordKey,'fiserv-mc-preauth-001');assert.equal(settled.parents.get('fiserv-mc-completion-001'),'fiserv-mc-preauth-001');assert.equal(settled.parents.get('fiserv-mc-refund-001'),'fiserv-mc-completion-001');
 const unsettled=tx.related(rows,'tsys-mc-void-001');assert.equal(unsettled.total,3);assert.equal(unsettled.parents.get('tsys-mc-void-001'),'tsys-mc-completion-001');
});
test('all 79 fixtures use one visible transaction id, final results and realistic optional network identifiers',()=>{
 const rows=tx.getRecords();assert.equal(rows.length,79);assert.equal(new Set(rows.map(row=>row.transactionId)).size,79);
 for(const row of rows){assert.equal('paywizardId' in row,false);assert.equal('transId' in row,false);assert.equal('transLogId' in row,false);assert.equal('transIndexCode' in row,false);if(row.rrn)assert.match(row.rrn,/^\d{12}$/);if(row.trace)assert.match(row.trace,/^\d{6}$/);if(row.status==='failed')assert.equal(row.approvalCode,'');}
 assert.deepEqual(new Set(rows.map(row=>row.status)),new Set(['completed','failed']));
 assert.ok(new Set(rows.map(row=>row.transactionId).map(value=>/^M/.test(value)?'M':/^\d+$/.test(value)?'numeric':'other')).size>=3);
});
test('detail links distinguish normal opens from related transaction switches',()=>{assert.equal(tx.detailHref('A',true),'11.transaction_detail_redesign.html?recordKey=A&from=list');assert.equal(tx.detailHref('B',true,true),'11.transaction_detail_redesign.html?recordKey=B&from=list&switched=1');assert.doesNotMatch(tx.detailHref('B',true,true),/#relatedTransactions/);});
test('created records remain available in the same session',()=>{
 const values=new Map();global.sessionStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 try{const row=record('NEW','prepaid-sale-001',{mid:'202604270000183',transactionChannel:'FISERV',originalTransactionId:'PT20260916001834'});tx.saveRecord(row);assert.equal(tx.getRecords().find(item=>item.recordKey==='NEW').originalRecordKey,'prepaid-sale-001');assert.equal(tx.related(tx.getRecords(),'NEW').total,5);}finally{delete global.sessionStorage;}
});
test('non-final transaction results cannot be saved or restored',()=>{
 const values=new Map();global.sessionStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 try{assert.throws(()=>tx.saveRecord(record('P',null,{status:'pending'})),/final Completed or Failed/);values.set('paywizard.transactionRecords.v2',JSON.stringify([record('OLD',null,{status:'pending'})]));assert.equal(tx.getRecords().some(row=>row.recordKey==='OLD'),false);}finally{delete global.sessionStorage;}
});
test('conflicting hidden and visible parent references do not connect',()=>{const group=tx.related([record('S'),record('R','S',{originalTransactionId:'T-WRONG'})],'R');assert.equal(group.total,1);assert.equal(group.incomplete,true);});
