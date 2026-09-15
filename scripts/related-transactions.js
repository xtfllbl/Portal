/* One related-record view for the list dialog and transaction detail. */
(function(){
'use strict';
const data=window.PaywizardTransactions;
const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(container,options){
 let group=null,page=0,generation=0;const size=10;
 const link=(id,label=id)=>`<a href="${esc(data.detailHref(id,options.fromList))}" data-related-id="${esc(id)}">${esc(label)}</a>`;
 function render(){
  const start=page*size,items=group.items.slice(start,start+size);
  const refs=group.items.some(r=>r.originalRecordId||r.originalTransId);
  const empty=group.total===1;
  options.onVisibility?.(!empty||refs||group.incomplete);
  if(empty){
   const reference=group.items[0].originalRecordId||group.items[0].originalTransId;
   container.innerHTML=refs||group.incomplete?`<p class="pw-related-note" role="status">Related records are unavailable.${reference?' Applies To: '+esc(reference)+'.':''}</p>`:'<p class="pw-related-note" role="status">No related transactions found.</p>';
   return;
  }
  container.innerHTML=`<div class="pw-related-meta"><span>${group.total} ${group.total===1?'transaction':'transactions'}</span>${group.root?`<span>Original Transaction: ${link(group.root.paywizardId)}</span>`:''}</div>
   ${group.incomplete?'<p class="pw-related-note" role="status">The relationship is incomplete. Only confirmed records are shown.</p>':''}
   <div class="pw-related-scroll" tabindex="0" aria-label="Related transaction records"><table class="pw-related-table"><thead><tr><th>Time (UTC)</th><th>Type</th><th>Amount</th><th>Result</th><th>Applies To</th><th>Transaction ID</th></tr></thead><tbody>${items.map(r=>{
    const parent=group.parents.get(r.paywizardId),reference=r.originalRecordId||r.originalTransId;
    return `<tr${r.paywizardId===options.id?' class="pw-related-current" aria-current="true"':''}><td>${esc(r.processorTime)}</td><td><span class="pw-related-type">${esc(r.type==='Failed'?'Unknown':r.type)}${r.paywizardId===options.id?'<span class="pw-related-current-tag">Current</span>':''}</span></td><td class="pw-related-amount">${esc(r.currency)} ${esc(r.amount)}</td><td><span class="pw-related-result ${['completed','failed','pending'].includes(r.status)?r.status:'unknown'}">${esc(data.resultLabel(r))}</span></td><td>${parent?link(parent):reference?`<span>${esc(reference)}</span><span class="pw-related-unavailable">Unavailable</span>`:'—'}</td><td>${link(r.paywizardId)}</td></tr>`;
   }).join('')}</tbody></table></div>
   ${group.total>size?`<div class="pw-related-pages"><span>${start+1}–${Math.min(start+size,group.total)} of ${group.total}</span><button type="button" data-page="current">Locate current</button><button type="button" data-page="prev" ${page===0?'disabled':''}>Previous</button><button type="button" data-page="next" ${(page+1)*size>=group.total?'disabled':''}>Next</button></div>`:''}`;
  const current=container.querySelector('.pw-related-current'),scroller=container.querySelector('.pw-related-scroll');
  if(current&&scroller)scroller.scrollTop=Math.max(0,current.offsetTop-container.querySelector('tbody').offsetTop-34);
 }
 async function refresh(){
  const ticket=++generation;options.onVisibility?.(true);
  const pending=document.createElement('p');pending.className='pw-related-note';pending.setAttribute('role','status');pending.textContent='Loading related transactions… Transaction ID: '+options.id;
  if(!group)container.replaceChildren(pending);else container.prepend(pending);
  try{
   const records=await options.load();if(ticket!==generation||!container.isConnected)return;
   group=data.related(records,options.id,options.canView);page=Math.floor(group.items.findIndex(r=>r.paywizardId===options.id)/size);render();
  }catch(error){
   if(ticket!==generation||!container.isConnected)return;
   if(group)render();else container.replaceChildren();options.onVisibility?.(true);
   const alert=document.createElement('div');alert.className='pw-related-error';alert.setAttribute('role','alert');alert.tabIndex=-1;
   alert.innerHTML=`<span>Related transactions could not be loaded for ${esc(options.id)}. Please try again.</span><button type="button" data-retry>Retry</button>`;container.prepend(alert);alert.focus({preventScroll:true});alert.scrollIntoView({block:'nearest'});
  }
 }
 container.onclick=event=>{
  const a=event.target.closest('[data-related-id]');if(a){options.beforeNavigate?.();return;}
  if(event.target.closest('[data-retry]')){refresh();return;}
  const button=event.target.closest('[data-page]');if(!button)return;
  page=button.dataset.page==='current'?Math.floor(group.items.findIndex(r=>r.paywizardId===options.id)/size):page+(button.dataset.page==='next'?1:-1);render();
  container.querySelector(`[data-page="${button.dataset.page}"]`)?.focus({preventScroll:true});
 };
 refresh();return {refresh};
}
function open(options){
 const dialog=document.createElement('dialog');dialog.className='pw-related-dialog';dialog.setAttribute('aria-labelledby','pw-related-title');
 dialog.innerHTML='<div class="pw-related-heading"><h2 id="pw-related-title">Related Transactions</h2><button type="button" class="pw-related-close" aria-label="Close related transactions" autofocus><img src="assets/icons/close.svg" alt=""></button></div><div class="pw-related-content"></div>';
 document.body.append(dialog);
 const close=()=>dialog.close();dialog.querySelector('button').onclick=close;
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 let backdrop=false;dialog.addEventListener('pointerdown',e=>{backdrop=e.target===dialog;});dialog.addEventListener('click',e=>{if(backdrop&&e.target===dialog)close();});
 dialog.addEventListener('close',()=>{dialog.remove();options.anchor?.focus({preventScroll:true});},{once:true});
 dialog.showModal();mount(dialog.querySelector('.pw-related-content'),options);
}
window.PaywizardRelated={mount,open};
})();
