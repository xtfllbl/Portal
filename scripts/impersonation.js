(function () {
  'use strict';
  const D=window.PaywizardImpersonationData;
  const $=id=>document.getElementById(id);
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>'<span class="material-symbols-rounded" aria-hidden="true">'+name+'</span>';
  const labels={provider:'Service Provider',agent:'Agent',merchant:'Merchant',store:'Store'};
  const icons={provider:'corporate_fare',agent:'group',merchant:'storefront',store:'location_on'};
  const stateKey='paywizard.impersonation.selection.v1';
  let saved={};try{saved=JSON.parse(sessionStorage.getItem(stateKey)||'{}');}catch(_){}
  let selected=new URLSearchParams(location.search).get('entity')||saved.selected||'m-tianfu';
  if(!D.entities.some(e=>e.id===selected))selected='m-tianfu';
  const expanded=new Set(saved.expanded||['sp-wizardpos','agt-luoqiu','m-tianfu','m-yameng','m-agabae']);
  D.lineage(selected).slice(0,-1).forEach(e=>expanded.add(e.id));
  let permissionUser=saved.permissionUser===undefined?'alice':saved.permissionUser;
  $('entitySearch').value=saved.entitySearch||'';$('userSearch').value=saved.userSearch||'';
  function save(){try{sessionStorage.setItem(stateKey,JSON.stringify({selected,expanded:[...expanded],permissionUser,entitySearch:$('entitySearch').value,userSearch:$('userSearch').value}));}catch(_){} }
  function tree(focusId){
    const query=$('entitySearch').value.trim().toLowerCase();
    const matches=new Set();
    D.entities.forEach(e=>{if(!query||e.name.toLowerCase().includes(query))D.lineage(e.id).forEach(n=>matches.add(n.id));});
    const visible=[];
    function nodes(parent='',depth=0){return D.entities.filter(e=>e.parentId===parent&&matches.has(e.id)).map(e=>{
      visible.push(e.id);
      const children=D.entities.some(n=>n.parentId===e.id&&matches.has(n.id));
      const open=Boolean(query)||expanded.has(e.id);
      return `<li class="imp-tree-item" role="treeitem" data-entity="${e.id}" aria-label="${escape(e.name)}" aria-level="${depth+1}" aria-selected="${e.id===selected}" ${children?`aria-expanded="${open}"`:''} tabindex="${e.id===selected?'0':'-1'}"><div class="imp-node" style="padding-left:${depth*18+3}px">${children?`<button class="imp-toggle" tabindex="-1" data-toggle="${e.id}" aria-label="${open?'Collapse':'Expand'} ${escape(e.name)}">${icon(open?'expand_more':'chevron_right')}</button>`:'<span class="imp-leaf-spacer"></span>'}<span class="material-symbols-rounded ${e.type}" aria-hidden="true">${icons[e.type]}</span><span class="imp-node-name" title="${escape(e.name)}">${escape(e.name)}</span></div>${children&&open?'<ul role="group">'+nodes(e.id,depth+1)+'</ul>':''}</li>`;
    }).join('');}
    $('entityTree').innerHTML=nodes();$('treeEmpty').hidden=visible.length>0;
    const focusNode=$('entityTree').querySelector(`[data-entity="${focusId||selected}"]`)||$('entityTree').querySelector('[role=treeitem]');
    if(focusNode){$('entityTree').querySelectorAll('[role=treeitem]').forEach(e=>e.tabIndex=-1);focusNode.tabIndex=0;if(focusId)focusNode.focus();}
  }
  function users(){
    const query=$('userSearch').value.trim().toLowerCase();
    const direct=D.users.filter(u=>u.entityId===selected);
    const filtered=direct.filter(u=>`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(query));
    $('userRows').innerHTML=filtered.map(u=>{
      const permissions=D.roles[u.role],open=permissionUser===u.id,keys=Object.keys(permissions);
      return `<tr><td><button class="imp-user-name" data-permissions="${u.id}" aria-expanded="${open}" aria-controls="permissions-${u.id}" aria-label="${open?'Hide':'View'} permissions for ${escape(u.name)}">${icon(open?'expand_more':'chevron_right')}${escape(u.name)}</button></td><td>${escape(u.email)}</td><td>${escape(u.role)}</td><td><button class="imp-permission-link" data-permissions="${u.id}" aria-expanded="${open}" aria-controls="permissions-${u.id}" aria-label="${open?'Hide':'View'} ${escape(u.name)} permissions">${keys.length} modules</button></td><td><button class="imp-button ${open?'imp-button-primary':''}" data-enter="${u.id}" aria-label="Impersonate ${escape(u.name)} (opens in new tab)">${icon('open_in_new')}Impersonate</button></td></tr><tr id="permissions-${u.id}" ${open?'':'hidden'}><td colspan="5" class="imp-permission-cell"><div class="imp-permission-grid">${keys.map(key=>`<div class="imp-permission">${icon(D.modules[key].icon)}<div><strong>${D.modules[key].name}</strong><span>${escape(permissions[key].join(', '))}</span></div></div>`).join('')}</div></td></tr>`;
    }).join('');
    $('usersEmpty').hidden=filtered.length>0;
    $('usersEmpty').textContent=direct.length?'No users match your search.':'No users belong directly to this entity.';
  }
  function entity(){const e=D.entities.find(e=>e.id===selected);$('entityName').textContent=e.name;$('entityType').textContent=labels[e.type];$('entityTypeDetail').textContent=labels[e.type];$('entityParent').textContent=D.lineage(e.id).slice(0,-1).map(e=>e.name).join(' / ')||'Platform';users();}
  function select(id){selected=id;permissionUser=null;$('entryError').hidden=true;entity();tree(id);save();}
  function error(message){const box=$('entryError');box.textContent=message;box.hidden=false;box.scrollIntoView({block:'center',behavior:'smooth'});box.focus({preventScroll:true});}
  $('entitySearch').addEventListener('input',()=>{tree();save();});
  $('userSearch').addEventListener('input',()=>{users();save();});
  $('entityTree').addEventListener('click',event=>{const toggle=event.target.closest('[data-toggle]');const item=event.target.closest('[data-entity]');if(!item)return;if(toggle){expanded.has(toggle.dataset.toggle)?expanded.delete(toggle.dataset.toggle):expanded.add(toggle.dataset.toggle);tree(item.dataset.entity);save();}else select(item.dataset.entity);});
  $('entityTree').addEventListener('keydown',event=>{
    const item=event.target.closest('[role=treeitem]');if(!item)return;
    const id=item.dataset.entity,items=[...$('entityTree').querySelectorAll('[role=treeitem]')],i=items.indexOf(item);let target;
    if(event.key==='ArrowDown')target=items[Math.min(i+1,items.length-1)];
    else if(event.key==='ArrowUp')target=items[Math.max(i-1,0)];
    else if(event.key==='Home')target=items[0];else if(event.key==='End')target=items.at(-1);
    else if(event.key==='ArrowRight'){if(item.getAttribute('aria-expanded')==='false'){expanded.add(id);tree(id);save();}else target=item.querySelector('[role=treeitem]');}
    else if(event.key==='ArrowLeft'){if(item.getAttribute('aria-expanded')==='true'&&!$('entitySearch').value){expanded.delete(id);tree(id);save();}else target=item.parentElement.closest('[role=treeitem]');}
    else if(event.key==='Enter'||event.key===' '){select(id);}else return;
    event.preventDefault();if(target){items.forEach(n=>n.tabIndex=-1);target.tabIndex=0;target.focus();}
  });
  $('userRows').addEventListener('click',event=>{
    const disclosure=event.target.closest('[data-permissions]');
    if(disclosure){permissionUser=permissionUser===disclosure.dataset.permissions?null:disclosure.dataset.permissions;const id=disclosure.dataset.permissions;users();$('userRows').querySelector(`[data-permissions="${id}"]`).focus();save();return;}
    const button=event.target.closest('[data-enter]');if(!button)return;
    const user=D.users.find(u=>u.id===button.dataset.enter&&u.entityId===selected);if(!user){error('This user is no longer available. Select the entity again and retry.');return;}
    const target=D.entities.find(e=>e.id===selected),permissions=D.roles[user.role];
    const token=crypto.randomUUID(),key='paywizard.impersonation.handoff.'+token;
    const session={id:token,user:{id:user.id,name:user.name,email:user.email,role:user.role},entity:{...target,path:D.lineage(selected).map(e=>e.name).join(' / ')},modules:Object.keys(permissions).map(k=>({...D.modules[k],key:k,actions:permissions[k]})),profile:target.type==='store'?'unattended-store':target.type==='merchant'?'full-service-merchant':'full-service',createdAt:Date.now(),returnUrl:'48.impersonate.html?entity='+encodeURIComponent(selected)};
    save();$('entryError').hidden=true;
    try{localStorage.setItem(key,JSON.stringify(session));const popup=window.open('48.impersonate_portal.html?session='+encodeURIComponent(token),'impersonate-'+token);if(!popup){localStorage.removeItem(key);error('The browser blocked the new tab. Allow pop-ups for this site, then click Impersonate again.');}}
    catch(_){try{localStorage.removeItem(key);}catch(_){}error('Unable to open the session. Allow site storage in your browser, then try again.');}
  });
  tree();entity();
})();
