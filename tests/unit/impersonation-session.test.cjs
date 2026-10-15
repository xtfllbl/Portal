const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('scripts/impersonation-session.js','utf8');
const sessionKey='paywizard.impersonation.session.v1';
function storage(entries=[]){const map=new Map(entries);return {map,getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
function open(search,local,tab){const ctx={URLSearchParams,Date,localStorage:local,sessionStorage:tab,location:{search,pathname:'/48.impersonate_portal.html'},history:{replaceState(_a,_b,url){ctx.cleaned=url;}}};vm.runInNewContext(source,ctx);return ctx;}
test('handoff is consumed once without changing shared operations profile',()=>{
 const data={id:'new',createdAt:Date.now(),user:{name:'Alice'}};
 const local=storage([['paywizard.impersonation.handoff.new',JSON.stringify(data)],['paywizard.portalAccessProfile.v1','wizarpos']]);
 const tab=storage();const result=open('?session=new',local,tab);
 assert.equal(JSON.parse(tab.getItem(sessionKey)).user.name,'Alice');
 assert.equal(local.getItem('paywizard.impersonation.handoff.new'),null);
 assert.equal(local.getItem('paywizard.portalAccessProfile.v1'),'wizarpos');
 assert.equal(result.cleaned,'/48.impersonate_portal.html');
 const second=storage();open('?session=new',local,second);assert.equal(second.getItem(sessionKey),null);
});
test('expired, mismatched and malformed handoffs cannot retain an older target identity',()=>{
 for(const raw of ['{broken',JSON.stringify({id:'new',createdAt:Date.now()-61000}),JSON.stringify({id:'other',createdAt:Date.now()})]){
  const local=storage([['paywizard.impersonation.handoff.new',raw]]),tab=storage([[sessionKey,'old identity']]);
  open('?session=new',local,tab);assert.equal(tab.getItem(sessionKey),null);assert.equal(local.getItem('paywizard.impersonation.handoff.new'),null);
 }
});
test('refresh keeps only the current tab session and does not consume another handoff',()=>{
 const local=storage([['paywizard.impersonation.handoff.next','pending']]),tab=storage([[sessionKey,'current']]);
 open('',local,tab);assert.equal(tab.getItem(sessionKey),'current');assert.equal(local.getItem('paywizard.impersonation.handoff.next'),'pending');
});
test('all fixture users have exactly one known role and an existing direct entity',()=>{
 const ctx={window:{}};vm.runInNewContext(readFileSync('scripts/entity-hierarchy-data.js','utf8'),ctx);vm.runInNewContext(readFileSync('scripts/impersonation-data.js','utf8'),ctx);
 const d=ctx.window.PaywizardImpersonationData;
 for(const u of d.users){assert.equal(typeof u.role,'string');assert.ok(d.roles[u.role]);assert.ok(d.entities.some(e=>e.id===u.entityId));}
 assert.equal(d.users.filter(u=>u.entityId==='m-tianfu').length,4);
 assert.equal(d.users.filter(u=>u.entityId==='s-tianfu-airport').length,1);
 assert.equal(d.entities.filter(e=>!e.parentId).length,2);
 for(const e of ctx.window.PaywizardEntityHierarchy){const actual=d.entities.find(n=>n.id===e.id);assert.equal(actual.name,e.name);assert.equal(actual.parentId,e.parentId);}
});
function entryHarness(local=storage()){
 const elements=new Map();
 function element(id){if(!elements.has(id))elements.set(id,{value:'',hidden:true,innerHTML:'',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},querySelector(){return null;},querySelectorAll(){return [];},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}});return elements.get(id);}
 const tab=storage();let popupCalls=0;
 const ctx={window:{open:()=>{popupCalls++;return null;}},document:{getElementById:element},URLSearchParams,location:{search:''},crypto:{randomUUID:()=> 'native'},Date,localStorage:local,sessionStorage:tab};
 for(const f of ['entity-hierarchy-data.js','impersonation-data.js','impersonation.js'])vm.runInNewContext(readFileSync('scripts/'+f,'utf8'),ctx);
 const link={dataset:{enter:'alice'},href:'48.impersonate_portal.html'};
 const event={target:{closest(selector){return selector==='[data-enter]'?link:null;}},preventDefault(){this.prevented=true;}};
 return {element,local,tab,link,event,popupCalls:()=>popupCalls};
}
test('native new-tab navigation preserves handoff when programmatic popups are blocked',()=>{
 const h=entryHarness();h.element('userSearch').value='Alice';
 h.element('userRows').listeners.click(h.event);
 assert.equal(h.popupCalls(),0,'must not rely on window.open');
 assert.equal(h.event.prevented,undefined,'leave native link activation intact');
 assert.match(h.link.href,/session=native/);
 assert.match(h.element('userRows').innerHTML,/<a [^>]*target="_blank"/);
 assert.equal(JSON.parse(h.local.getItem('paywizard.impersonation.handoff.native')).user.name,'Alice Chen');
 assert.equal(h.element('entryError').hidden,true);
 assert.equal(JSON.parse(h.tab.getItem('paywizard.impersonation.selection.v1')).selected,'m-tianfu');
});
test('storage failure cancels navigation and keeps an actionable error in view',()=>{
 const local=storage();local.setItem=()=>{throw new Error('storage disabled');};
 const h=entryHarness(local);h.element('userSearch').value='Alice';h.element('userRows').listeners.click(h.event);
 assert.equal(h.event.prevented,true);assert.equal(h.popupCalls(),0);
 assert.equal(h.element('entryError').hidden,false);assert.match(h.element('entryError').textContent,/Allow site storage/);
 assert.equal(h.element('entryError').focused,true);assert.equal(h.element('entryError').scrolled,true);assert.equal(h.element('userSearch').value,'Alice');
});
test('each requested role opens an existing portal page with its exact profile',()=>{
 const fixture={window:{}};vm.runInNewContext(readFileSync('scripts/entity-hierarchy-data.js','utf8'),fixture);vm.runInNewContext(readFileSync('scripts/impersonation-data.js','utf8'),fixture);
 const d=fixture.window.PaywizardImpersonationData;
 for(const [id,profile,href] of [['olivia','full-service','12.transaction_list.html'],['alice','full-service-merchant','12.transaction_list.html'],['lucas','unattended-store','12.transaction_list.html'],['brian','billing-merchant','42.billing_payments.html']]){
  const user=d.users.find(u=>u.id===id),role=d.roles[user.role];assert.equal(role.profile,profile);
  const session={id:'target',user,entity:d.entities.find(e=>e.id===user.entityId),profile};
  const local=storage([['paywizard.portalAccessProfile.v1','wizarpos']]);
  const tab=storage([[sessionKey,JSON.stringify(session)]]);
  const ctx={window:{},sessionStorage:tab,localStorage:local,location:{pathname:'/48.impersonate_portal.html',replace(url){ctx.destination=url;}}};
  vm.runInNewContext(readFileSync('scripts/portal-access-context.js','utf8'),ctx);
  vm.runInNewContext(readFileSync('scripts/impersonation-portal.js','utf8'),ctx);
  assert.equal(ctx.destination,href);assert.equal(ctx.window.PaywizardAccessContext.profile(),profile);
  assert.equal(local.getItem('paywizard.portalAccessProfile.v1'),'wizarpos');
  tab.removeItem(sessionKey);assert.equal(ctx.window.PaywizardAccessContext.profile(),'wizarpos');
 }
});
test('invalid session falls back to the normal profile and does not open a portal target',()=>{
 for(const raw of ['{bad',JSON.stringify({id:'x',user:{name:'Alice',role:'Admin'},entity:{},profile:'unknown'}),'null']){
  const ctx={window:{},sessionStorage:storage([[sessionKey,raw]]),localStorage:storage([['paywizard.portalAccessProfile.v1','attended']]),location:{pathname:'/48.impersonate_portal.html',replace(url){ctx.destination=url;}}};
  vm.runInNewContext(readFileSync('scripts/portal-access-context.js','utf8'),ctx);vm.runInNewContext(readFileSync('scripts/impersonation-portal.js','utf8'),ctx);
  assert.equal(ctx.window.PaywizardAccessContext.profile(),'attended');assert.equal(ctx.destination,'48.impersonate.html');
 }
});
