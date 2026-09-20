const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'code.js'), 'utf8');
const capture = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../docs/design/billing-figma/figma-export-manifest.json'), 'utf8'));
const desktop = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/desktop-date-fields.json'), 'utf8'));

async function fixture({omitNode, omitFont, observedDates=false, omitRangeHostFor, omitPopulatedDateFor} = {}) {
  const messages = [], mutations = [];
  const makeText = (family,characters='Sample') => ({type:'TEXT',characters,height:18,width:60,hasMissingFont:false,getStyledTextSegments:()=>[{fontName:{family,style:'Regular'}}]});
  const makeFrame = properties => ({type:'FRAME',layoutMode:'NONE',children:[],...properties,appendChild(child){this.children.push(child);child.parent=this;},resize(w,h){this.width=w;this.height=h;}});
  const nodes = new Map(capture.frames.map(spec => {
    const observed=desktop.sources.find(s=>s.state===spec.state);
    const definitions=spec.dateFields.filter(d=>(!observedDates||d.value)&&!(spec.state===omitPopulatedDateFor&&d.value));
    const fields = definitions.map((d,i) => makeFrame({id:spec.nodeId+'/'+d.id,name:'Date Picker',width:observedDates?observed.capturedDateFields[i].width:d.w,height:d.h,absoluteTransform:[[1,0,d.x],[0,1,d.y]]}));
    const text = makeText('Poppins');
    const allTexts=[text],allFrames=[...fields];
    const root={id:spec.nodeId,type:'FRAME',name:spec.state+' · Billing Figma Export',width:1440,height:observed.height,findAllWithCriteria:q=>q.types.includes('TEXT')?allTexts:allFrames,findAll:()=>[...allTexts,...allFrames]};
    const empty=spec.dateFields.filter(d=>!d.value);
    if(empty.length&&spec.state!==omitRangeHostFor){
      const span=Math.max(...empty.map(d=>d.x+d.w))-Math.min(...empty.map(d=>d.x));
      const host=makeFrame({id:spec.nodeId+'/range',name:'Fieldset',width:span+18,height:40,parent:root});
      const legend=makeFrame({id:spec.nodeId+'/legend',name:'Legend',width:70,height:16,parent:host});
      const label=makeText('Poppins','Date Range');label.parent=legend;
      allTexts.push(label);allFrames.push(host,legend);
    }
    return [spec.nodeId,root];
  }));
  const receiptText = makeText('Arial');
  nodes.set('39:2',{id:'39:2',type:'FRAME',width:798,height:779,findAllWithCriteria:()=>[receiptText],findAll:()=>[receiptText]});
  if(omitNode)nodes.delete(omitNode);
  const fonts=[['Poppins','Regular'],['Poppins','SemiBold'],['Noto Sans SC','Regular'],['Material Symbols Rounded','Regular'],['Arial','Regular']].filter(([family])=>family!==omitFont).map(([family,style])=>({fontName:{family,style}}));
  const figma={ui:{postMessage:m=>messages.push(m)},showUI(){},listAvailableFontsAsync:async()=>fonts,getNodeByIdAsync:async id=>nodes.get(id)||null,createPage(){mutations.push('createPage');throw Error('unexpected mutation')},loadFontAsync:async()=>{},createFrame(){mutations.push('createFrame');return makeFrame({id:'new-'+mutations.length});},createText(){mutations.push('createText');return makeText('Poppins');}};
  const context=vm.createContext({figma,__html__:'',setTimeout,clearTimeout,console});
  vm.runInContext(source,context);
  for(let i=0;i<40&&!messages.some(m=>m.type==='busy'&&m.value===false);i++)await new Promise(resolve=>setImmediate(resolve));
  return {messages,mutations,figma,nodes,repairDates:context.repairDates};
}
test('startup inspects all 30 captures without mutating the file',async()=>{
  const f=await fixture();const report=f.messages.filter(m=>m.type==='report').at(-1).report;
  assert.equal(report.status,'preflight-passed');assert.equal(report.source.length,30);assert.deepEqual(f.mutations,[]);
});
test('a missing source node blocks proof generation before a page is created',async()=>{
  const f=await fixture({omitNode:'5:2'});await f.figma.ui.onmessage({command:'proof'});
  assert.deepEqual(f.mutations,[]);assert.ok(f.messages.filter(m=>m.type==='report').at(-1).report.errors.some(e=>e.includes('41-03')));
});
test('a required missing font blocks generation instead of silently substituting',async()=>{
  const f=await fixture({omitFont:'Noto Sans SC'});await f.figma.ui.onmessage({command:'build'});
  assert.deepEqual(f.mutations,[]);assert.ok(f.messages.filter(m=>m.type==='report').at(-1).report.errors.some(e=>e.includes('Noto Sans SC')));
});
test('observed desktop capture plans restoration of 22 omitted empty date inputs',async()=>{
  const f=await fixture({observedDates:true});const report=f.messages.filter(m=>m.type==='report').at(-1).report;
  assert.equal(report.status,'preflight-passed');assert.equal(report.source.length,30);
  assert.equal(report.source.reduce((n,s)=>n+s.dateRepairPlan.restore.length,0),22);
  assert.deepEqual(f.mutations,[]);
  const renew=report.source.find(s=>s.state==='44-07');
  assert.equal(renew.dateRepairPlan.existing[0].field,'renewExpiry');
  assert.equal(renew.dateRepairPlan.restore.length,2);
});
test('restoring empty filters preserves the populated renewal date and enclosing range',async()=>{
  const f=await fixture({observedDates:true});const spec=capture.frames.find(s=>s.state==='44-07'),root=f.nodes.get(spec.nodeId);
  f.repairDates(root,spec);
  const filled=root.findAllWithCriteria({types:['FRAME']}).find(n=>n.name==='Paywizard export / Date / renewExpiry');
  assert.equal(filled.children.find(n=>n.name==='Date value').characters,'2026/10/20');
  const range=root.findAllWithCriteria({types:['FRAME']}).find(n=>n.name==='Fieldset');
  assert.equal(range.children.length,2);
  for(const child of range.children){
    assert.equal(child.layoutPositioning,'ABSOLUTE');
    assert.equal(child.children.find(n=>n.name==='Date value').characters,'年/月/日');
    assert.ok(child.x>=0&&child.x+child.width<=range.width);
    assert.ok(child.y>=0&&child.y+child.height<=range.height);
    assert.equal(child.strokes.length,0);
  }
});
test('missing populated dates still block generation',async()=>{
  const f=await fixture({observedDates:true,omitPopulatedDateFor:'44-07'});await f.figma.ui.onmessage({command:'proof'});
  assert.deepEqual(f.mutations,[]);assert.ok(f.messages.filter(m=>m.type==='report').at(-1).report.errors.some(e=>e.startsWith('44-07:')));
});
test('missing date-range anchor blocks restoration rather than guessing a parent',async()=>{
  const f=await fixture({observedDates:true,omitRangeHostFor:'42-02'});await f.figma.ui.onmessage({command:'proof'});
  assert.deepEqual(f.mutations,[]);assert.ok(f.messages.filter(m=>m.type==='report').at(-1).report.errors.some(e=>e.includes('42-02: expected one Date Range container')));
});
