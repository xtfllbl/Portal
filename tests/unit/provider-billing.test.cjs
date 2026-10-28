const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const storage=new Map();
global.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
global.dispatchEvent=()=>{};
global.PaywizardAccessContext={profile:()=> 'maintain',session:()=>null};
const api=require('../../scripts/provider-billing-store.js');
beforeEach(()=>storage.clear());
const provider={id:'p',name:'Provider',currency:'USD',commencement:'2026-07',rates:[{effective:'2026-07',activation:5000,monthly:1000}]};
const period=(id,start,end,activation=true)=>({id,providerId:'p',sn:'WP2600000000',terminal:'Lobby Coffee',merchant:'Merchant',store:'Store',agent:'Agent',start,end,activation,reason:'Parameter push'});
test('both first-day and last-day activations start monthly fees in the next month',()=>{
 const events=api.feeEvents([period('early','2026-07-02T09:00:00Z'),period('late','2026-07-31T09:00:00Z')],provider,'2026-09');
 assert.equal(events.filter(e=>e.type==='Activation').length,2);
 assert.equal(events.filter(e=>e.type==='Monthly service'&&e.at.startsWith('2026-07')).length,0);
 assert.equal(events.filter(e=>e.type==='Monthly service'&&e.at.startsWith('2026-08')).length,2);
 assert.equal(api.total({lines:api.calculate(provider,events,'2026-Q3')}),14000);
});
test('unbinding retains the month already charged and rebind gets the same free-month rule',()=>{
 const events=api.feeEvents([period('first','2026-06-12T09:00:00Z','2026-08-05T09:00:00Z'),period('rebind','2026-09-20T09:00:00Z',null,false)],provider,'2026-10');
 assert.deepEqual(events.filter(e=>e.type==='Monthly service').map(e=>e.at.slice(0,7)).sort(),['2026-07','2026-08','2026-10']);
 assert.equal(events.filter(e=>e.type==='Historical activation').length,1);
 assert.equal(events.filter(e=>e.type==='Re-enabled')[0].amount,0);
});
test('historical activation is collected once in commencement quarter; older service fees excluded',()=>{
 const events=api.feeEvents([period('old','2026-01-12T09:00:00Z')],provider,'2026-12');
 assert.equal(api.total({lines:api.calculate(provider,events,'2026-Q3')}),8000);
 assert.equal(api.total({lines:api.calculate(provider,events,'2026-Q4')}),3000);
 assert.equal(events.filter(e=>e.type==='Monthly service'&&e.at<'2026-07').length,0);
});
test('new merchant service activation may incur another activation fee for the same physical machine',()=>{
 const events=api.feeEvents([period('first','2026-07-02T09:00:00Z','2026-08-04T09:00:00Z'),{...period('transfer','2026-08-05T09:00:00Z'),merchant:'New merchant'}],provider,'2026-09');
 assert.equal(events.filter(e=>e.type==='Activation').length,2);
});
test('future prices do not rewrite earlier calculated months',()=>{
 const changed={...provider,rates:[...provider.rates,{effective:'2026-09',activation:6000,monthly:1200}]};
 const events=api.feeEvents([period('old','2026-06-12T09:00:00Z')],changed,'2026-09');
 assert.equal(events.find(e=>e.type==='Monthly service'&&e.at.startsWith('2026-08')).amount,1000);
 assert.equal(events.find(e=>e.type==='Monthly service'&&e.at.startsWith('2026-09')).amount,1200);
});
test('unpaid revisions preserve original calculation, hide audit publicly, and reject stale checkout',()=>{
 const bill=api.load().bills.find(b=>b.providerId==='1047'),original=JSON.stringify(bill.original),lines=structuredClone(bill.lines);
 lines[0].quantity-=1;lines[0].amount-=lines[0].unit;
 const updated=api.amend(bill.id,bill.revision,lines,'Agreed quarterly charges','Commercial adjustment',false);
 assert.equal(JSON.stringify(updated.original),original);assert.equal(updated.token,bill.token);
 assert.throws(()=>api.beginPayment(bill.token,bill.revision,'stale'),/changed/);
 const publicBill=api.publicBill(bill.token);assert.equal('original' in publicBill,false);assert.equal('audit' in publicBill,false);assert.equal('eventIds' in publicBill.lines[0],false);
});
test('a processing or paid bill rejects operations edits and repeat payment',()=>{
 const bill=api.load().bills.find(b=>b.providerId==='1047');
 api.beginPayment(bill.token,bill.revision,'payment');
 assert.throws(()=>api.amend(bill.id,bill.revision,bill.lines,'','',false),/processing/);
 const paid=api.finishPayment(bill.token,'payment',{brand:'Visa',last4:'4242'});
 assert.equal(paid.status,'Paid');assert.throws(()=>api.amend(bill.id,paid.revision,bill.lines,'','',false),/paid/);
 assert.throws(()=>api.beginPayment(bill.token,paid.revision,'again'),/paid/);
});
test('draft publication at zero retains the bill without requiring payment',()=>{
 const state=api.load(),bill=state.bills[0];bill.status='Draft';bill.publishedAt=null;localStorage.setItem(api.KEY,JSON.stringify(state));const lines=bill.lines.map(line=>({...line,amount:0}));
 const result=api.amend(bill.id,bill.revision,lines,'No fees due','Waived this quarter',true,'2099-12-31');
 assert.equal(result.status,'No payment required');assert.throws(()=>api.beginPayment(result.token,result.revision,'zero'),/does not require/);
});
test('2026 demo quarters use the new defaults and preserve calculation evidence',()=>{
 const state=api.load();assert.equal(state.schema,2);
 for(const provider of state.providers){
  assert.equal(provider.rates[0].activation,200);assert.equal(provider.rates[0].monthly,799);
  const bills=state.bills.filter(b=>b.providerId===provider.id);
  assert.deepEqual(bills.map(b=>b.quarter),['2026-Q4','2026-Q3','2026-Q2','2026-Q1']);
  for(const bill of bills){assert.ok(bill.publishedAt);assert.deepEqual(bill.lines,bill.original);assert.deepEqual(bill.original,api.calculate(provider,state.events,bill.quarter));if(bill.status==='Paid')assert.equal(bill.payments[0].amount,api.total(bill));}
 }
 assert.equal(state.providers.find(p=>p.id==='1047').currency,'CAD');
 assert.equal(state.providers.find(p=>p.id==='1053').currency,'EUR');
 assert.throws(()=>api.generate('1047',api.quarterOf(api.today())),/completed quarter/);
});
test('legacy demo is backed up exactly once before rebuilding and later edits survive reload',()=>{
 const legacy={...api.seed(),schema:1};legacy.bills[0].note='Existing adjustment';legacy.bills[0].status='Paid';
 const raw=JSON.stringify(legacy);localStorage.setItem(api.KEY,raw);
 const rebuilt=api.load();assert.equal(localStorage.getItem(api.BACKUP_KEY),raw);assert.equal(rebuilt.schema,2);
 rebuilt.bills[0].note='New adjustment';localStorage.setItem(api.KEY,JSON.stringify(rebuilt));
 assert.equal(api.load().bills[0].note,'New adjustment');assert.equal(localStorage.getItem(api.BACKUP_KEY),raw);
});
test('unpaid count includes expired and processing bills, excludes drafts zero and other providers',()=>{
 const state=api.load(),bill=state.bills.find(b=>b.id==='PB-2026Q3-1047');assert.equal(api.unpaidCount('1047'),2);
 bill.expiry='2000-01-01';bill.lock={requestId:'pending'};localStorage.setItem(api.KEY,JSON.stringify(state));assert.equal(api.unpaidCount('1047'),2);
 bill.publishedAt=null;localStorage.setItem(api.KEY,JSON.stringify(state));assert.equal(api.unpaidCount('1047'),1);
 bill.publishedAt='2026-10-01';bill.lines=bill.lines.map(l=>({...l,amount:0}));localStorage.setItem(api.KEY,JSON.stringify(state));assert.equal(api.unpaidCount('1047'),1);
});
