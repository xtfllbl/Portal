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
test('blocked new tab preserves selection and focuses an actionable error',()=>{
 const elements=new Map();
 function element(id){if(!elements.has(id))elements.set(id,{value:'',hidden:true,innerHTML:'',textContent:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},querySelector(){return null;},querySelectorAll(){return [];},focus(){this.focused=true;},scrollIntoView(){this.scrolled=true;}});return elements.get(id);}
 const local=storage(),tab=storage();
 const ctx={window:{open:()=>null},document:{getElementById:element},URLSearchParams,location:{search:''},crypto:{randomUUID:()=> 'blocked'},Date,localStorage:local,sessionStorage:tab};
 vm.runInNewContext(readFileSync('scripts/entity-hierarchy-data.js','utf8'),ctx);vm.runInNewContext(readFileSync('scripts/impersonation-data.js','utf8'),ctx);vm.runInNewContext(readFileSync('scripts/impersonation.js','utf8'),ctx);
 element('userSearch').value='Alice';
 element('userRows').listeners.click({target:{closest(selector){return selector==='[data-enter]'?{dataset:{enter:'alice'}}:null;}}});
 assert.equal(element('entryError').hidden,false);assert.match(element('entryError').textContent,/Allow pop-ups/);
 assert.equal(element('entryError').focused,true);assert.equal(element('entryError').scrolled,true);assert.equal(element('userSearch').value,'Alice');
 assert.equal(JSON.parse(tab.getItem('paywizard.impersonation.selection.v1')).selected,'m-tianfu');assert.equal(local.getItem('paywizard.impersonation.handoff.blocked'),null);
});
