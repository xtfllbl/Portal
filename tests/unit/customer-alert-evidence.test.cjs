const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../../scripts/customer-alert-evidence.js');
const C = require('../../scripts/customer-alert-evidence-cases.js');
test('time and stock boundaries use the correct comparison', () => {
  assert.equal(E.evaluate('opc_offline', {duration:15}, {available:false,unavailableMinutes:15}).outcome,'abnormal');
  assert.equal(E.evaluate('opc_offline', {duration:15}, {available:false,unavailableMinutes:14}).outcome,'pending');
  assert.equal(E.evaluate('no_approved_transaction',{duration:2},{lastApprovedMinutes:120}).outcome,'abnormal');
  assert.equal(E.evaluate('machine_stock',{threshold:25},{bins:[{binId:'A',onHand:25,par:100}]}).outcome,'normal');
  assert.equal(E.evaluate('machine_stock',{threshold:25},{bins:[{binId:'A',onHand:2499,par:10000}]}).outcome,'abnormal');
  assert.equal(E.evaluate('any_bin',{threshold:2},{bins:[{binId:'A',onHand:2}]}).outcome,'normal');
  assert.equal(E.evaluate('sold_out',{}, {bins:[{binId:'A',onHand:0}]}).outcome,'abnormal');
  for (const temperature of [2,8]) assert.equal(E.evaluate('temperature_range',{lower:2,upper:8,unit:'C'},{temperature,unit:'C'}).outcome,'normal');
});
test('product ID matching ignores location and unrelated invalid bins', () => {
  const e=E.evaluate('selected_product',{productId:'water',productName:'Water',threshold:30},{bins:[{binId:'Z9',productId:'water',onHand:1,par:10},{binId:'A1',productId:'other',par:0}]});
  assert.equal(e.outcome,'abnormal'); assert.match(e.text,/BIN Z9/); assert.doesNotMatch(e.text,/BIN A1/);
});
test('multi-bin summary is bounded and details retain all bins', () => {
  const e=E.evaluate('any_bin',{threshold:2},{bins:['Z9','A1','B2','B1'].map(binId=>({binId,onHand:0}))});
  assert.match(e.text,/BINs below threshold: 4/); assert.match(e.text,/\+1 more/); assert.equal(e.details.length,4); assert.match(e.details[0],/A1/);
});
test('unknown never means normal or zero and resets recovery without creating incidents', () => {
  for (const observation of [null,{stale:true},{bins:[]},{bins:[{binId:'A',onHand:0,par:0}]},{bins:[{binId:'A',par:10}]}]) {
    const e=E.evaluate('machine_stock',{threshold:25},observation);
    assert.equal(e.outcome,'unknown'); assert.equal(E.advance(null,e).monitoringState,'None');
    const next=E.advance({monitoringState:'Active',recoveryHitCount:1},e);
    assert.equal(next.monitoringState,'Active'); assert.equal(next.recoveryHitCount,0);
  }
});
test('recovery changes evidence, resets on relapse, and freezes manual closure', () => {
  const normal=E.evaluate('opc_offline',{duration:15},{available:true});
  const bad=E.evaluate('opc_offline',{duration:15},{available:false,unavailableMinutes:20});
  const first=E.advance({monitoringState:'Active',recoveryHitCount:0},normal);
  assert.match(first.evidence,/Payment Service available · Recovery check 1\/2/);
  assert.equal(E.advance(first,bad).recoveryHitCount,0);
  const second=E.advance(first,normal); assert.equal(second.monitoringState,'Resolved'); assert.equal(second.evidence,'Payment Service available');
  const closed=E.advance({monitoringState:'Closed',recoveryHitCount:1,evidence:bad.text},normal);
  assert.equal(closed.monitoringState,'Closed'); assert.equal(closed.evidence,bad.text); assert.equal(closed.eventEvidence,'Payment Service available');
});
test('all catalogue cases render and cover each condition/scope/state without unresolved placeholders', () => {
  const rows=C.rows(); assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  for(const r of rows) { assert.doesNotMatch(r.evidence,/undefined|NaN|\{\w+\}/); assert.doesNotMatch(r.eventEvidence,/undefined|NaN|\{\w+\}/); }
  for(const condition of Object.keys(E.conditions)) for(const scope of ['Store','Terminal']) for(const state of ['None','Active','Resolved','Closed']) assert.ok(rows.some(r=>r.condition===condition && r.scope===scope && r.state===state),`${condition} ${scope} ${state}`);
});
