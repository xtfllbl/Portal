(function () {
  'use strict';
  const $ = id => document.getElementById(id), store = window.PaywizardBillingStore;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n, currency) => new Intl.NumberFormat('en-US', {style:'currency',currency}).format(n);
  const date = value => value ? new Date(value.slice(0,10) + 'T12:00:00Z').toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}) : '—';
  const badge = value => '<span class="billing-status ' + esc(value.toLowerCase()) + '">' + esc(value) + '</span>';
  let records = [], filters = {}, page = 1, ready = false, busy = false, selected = null, opener = null;
  const menu = document.createElement('div'); menu.className = 'overview-menu'; menu.id = 'overviewMenu'; menu.hidden = true; menu.setAttribute('role','menu'); document.body.append(menu);
  function message(text) { $('billingMessage').textContent = text; clearTimeout(message.timer); message.timer = setTimeout(() => $('billingMessage').textContent = '', 6000); }
  function closeMenu(focus = false) { menu.hidden = true; opener?.setAttribute('aria-expanded','false'); if (focus && opener?.isConnected) opener.focus(); }
  function filtered() {
    return records.filter(r => r.status !== 'Draft' && (!filters.assignment || r.assignment === filters.assignment) && (!filters.merchant || r.merchantName.toLowerCase().includes(filters.merchant)) && (!filters.status || r.status === filters.status) && (!filters.cycle || (filters.cycle === 'one-time' ? !r.recurring : filters.cycle === 'monthly' ? r.recurring : r.recurring && String(r.cycle) === filters.cycle)) && (!filters.from || r.createdAt.slice(0,10) >= filters.from) && (!filters.to || r.createdAt.slice(0,10) <= filters.to));
  }
  function values(r) {
    return [r.invoice, r.createdAt?.replace('T',' ').slice(0,19), store.isMerchantRecord(r) ? r.merchantName : 'Standalone Billing', r.recurring ? date(r.start) + ' – ' + date(store.endDate(r)) : '—', r.recurring ? r.cycle + ' Months' : 'One-time', money(store.total(r),r.currency), r.status, r.recurring ? store.count(r) + ' of ' + r.cycle : '—', date(store.endDate(r)), date(r.expiry), r.linkStatus, r.notes || '—'];
  }
  function render() {
    closeMenu(); const list = filtered(), size = Number($('pageSize').value), pages = Math.max(1,Math.ceil(list.length / size)); page = Math.min(Math.max(page,1),pages);
    $('overviewRows').innerHTML = list.slice((page-1)*size,page*size).map(r => '<tr data-id="' + esc(r.id) + '">' + values(r).map((v,i) => '<td' + (i === 11 ? ' class="overview-notes" title="' + esc(v) + '"' : '') + '>' + ([6,10].includes(i) ? badge(v) : esc(v)) + '</td>').join('') + '<td class="overview-actions-cell"><div class="billing-link-actions"><button type="button" data-copy="' + esc(r.id) + '" ' + (!ready ? 'disabled' : '') + '>Copy URL</button><button type="button" class="billing-more" data-more="' + esc(r.id) + '" aria-label="Actions for invoice ' + esc(r.invoice) + '" aria-haspopup="menu" aria-controls="overviewMenu" aria-expanded="false" ' + (!ready ? 'disabled' : '') + '><span class="material-symbols-rounded" aria-hidden="true">more_horiz</span></button></div></td></tr>').join('') || '<tr><td colspan="13" class="empty">' + (ready ? 'No billing records found.' : 'Loading billing records…') + '</td></tr>';
    $('pageButtons').replaceChildren();
    function button(label,target,disabled,current) { const b = document.createElement('button'); b.type='button'; b.textContent=label; b.disabled=disabled; b.setAttribute('aria-label', /^\d+$/.test(label) ? 'Page ' + label : label); if(current)b.setAttribute('aria-current','page'); b.onclick=()=>{page=target;render();}; $('pageButtons').append(b); }
    button('First',1,page===1);button('Prev',page-1,page===1);
    for(let n=Math.max(1,Math.min(page-1,pages-2));n<=Math.min(pages,Math.max(3,page+1));n++)button(String(n),n,false,n===page);
    button('Next',page+1,page===pages);button('Last',pages,page===pages);
    $('pageSummary').textContent=page+' / '+pages+' ('+list.length+')'; $('exportOverview').disabled=!ready||!list.length;
  }
  function detailsList(target, rows) { target.innerHTML=rows.map(([label,value])=>'<dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd>').join(''); }
  function openDialog(id) { closeMenu(); $(id).showModal(); }
  function recipient(r) { const m=window.PaywizardPlatformMerchantStore?.readAll().find(m=>String(m.merchantId)===r.merchantId); return r.deliveries?.at(-1)?.email || m?.email || m?.contactEmail || ''; }
  function details(r) {
    const rows=[['Invoice No.',r.invoice],['Billing assignment',store.isMerchantRecord(r)?'Merchant Billing':'Standalone Billing']];
    if(store.isMerchantRecord(r))rows.push(['Merchant',r.merchantName]);
    rows.push(['Bill type',r.billType],['Payment status',r.status],['Payment',r.recurring?'Fixed-term monthly':'One-time'],[r.recurring?'Monthly amount':'Amount',money(r.amount,r.currency)],['Total amount',money(store.total(r),r.currency)]);
    if(r.recurring)rows.push(['Billing period',date(r.start)+' – '+date(store.endDate(r))],['Paid installments',store.count(r)+' of '+r.cycle],['Next payment',date(r.nextPaymentDate)]);
    rows.push(['Link status',r.linkStatus],['Link expires (UTC)',date(r.expiry)],['Billing notes',r.notes||'—']);
    if(r.includedData!=null)rows.push(['Included data',r.includedData+' MB']);
    if(r.collectionStop)rows.push(['Stopped at',r.collectionStop.at],['Stop reason',r.collectionStop.reason]);
    detailsList($('savedBillingDetails'),rows);
    $('billingAudit').innerHTML = (r.audit?.length || r.deliveries?.length) ? '<h3>Activity</h3>' + [...(r.audit||[]).map(a=>({at:a.at, label:a.action, text:[a.actor,a.previousExpiry?'Expiry: '+a.previousExpiry+' → '+a.expiry:'',a.reason].filter(Boolean).join(' · ')})),...(r.deliveries||[]).map(d=>({at:d.at,label:'Send Link · '+d.status,text:d.email}))].sort((a,b)=>b.at.localeCompare(a.at)).map(a=>'<div class="audit-event"><strong>'+esc(a.label)+'</strong>'+esc(a.at.replace('T',' ').slice(0,19)+' UTC')+'<br>'+esc(a.text)+'</div>').join('') : '';
    openDialog('billingDetailsDialog');
  }
  function payments(r) {
    $('paymentRecordInvoice').textContent=r.invoice;
    $('installmentRows').innerHTML=(r.installments||[]).map(i=>'<tr>'+[i.number,date(i.due),money(i.amount,r.currency),r.status==='Stopped'&&i.status!=='Paid'?'Stopped · Unpaid':i.status].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('');
    $('attemptRows').innerHTML=(r.payments||[]).map(p=>'<tr>'+[p.id,p.installment,money(p.amount,p.currency),p.status,p.at.replace('T',' ').slice(0,19)+' UTC'].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')||'<tr><td colspan="5" class="empty">No payment attempts.</td></tr>';
    openDialog('paymentRecordsDialog');
  }
  function openMenu(r,button) {
    closeMenu();selected=r;opener=button;menu.replaceChildren();
    function item(text,fn,disabled=false,danger=false) { const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=disabled;b.setAttribute('role','menuitem');if(danger)b.className='danger-text';b.onclick=()=>{closeMenu();fn();};menu.append(b); }
    const preview=document.createElement('a');preview.textContent='Preview payment link';preview.href=store.link(r);preview.target='_blank';preview.rel='noopener';preview.setAttribute('role','menuitem');preview.onclick=()=>closeMenu();menu.append(preview);
    item('Send Link',()=>{$('sendLinkInvoice').textContent=r.invoice;$('sendLinkUrl').value=store.link(r);$('linkRecipient').value=recipient(r);$('sendLinkError').textContent='';openDialog('sendLinkDialog');},r.linkStatus!=='Valid');
    item('View billing details',()=>details(r)); item('View payment records',()=>payments(r));
    if(r.canRenew)item('Renew Link',()=>{$('renewInvoice').textContent=r.invoice;$('renewExpiry').value=new Date(Date.now()+30*86400000).toISOString().slice(0,10);$('renewExpiry').min=new Date(Date.now()+86400000).toISOString().slice(0,10);$('renewRecipient').value=recipient(r);$('renewError').textContent='';openDialog('renewDialog');});
    if(r.canStop)item('Stop Collection',()=>{$('stopInvoice').textContent=r.invoice;const paid=r.installments.filter(i=>i.status==='Paid').reduce((sum,i)=>sum+Math.round(i.amount*100),0)/100;detailsList($('stopAmounts'),[['Paid amount',money(paid,r.currency)],['Unpaid amount',money(store.total(r)-paid,r.currency)]]);$('stopReason').value='';$('stopError').textContent='';openDialog('stopDialog');},false,true);
    menu.hidden=false;button.setAttribute('aria-expanded','true');const box=button.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(innerWidth-248,box.right-240))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-menu.offsetHeight-8,box.bottom+6))+'px';menu.querySelector('a,button:not(:disabled)').focus();
  }
  $('overviewRows').onclick=async event=>{
    const b=event.target.closest('button');if(!b||!ready)return;
    const r=records.find(r=>r.id===(b.dataset.copy||b.dataset.more));if(!r)return;
    if(b.dataset.more){if(!menu.hidden&&selected?.id===r.id)return closeMenu(true);return openMenu(r,b);}
    opener=b;try{await navigator.clipboard.writeText(store.link(r));message('Payment link copied.');}catch(_){$('copyUrlValue').value=store.link(r);openDialog('copyUrlDialog');$('copyUrlValue').select();}
  };
  document.addEventListener('click',e=>{if(!e.target.closest('.overview-menu,[data-more]'))closeMenu();});
  document.addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape'){e.preventDefault();closeMenu(true);}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...menu.querySelectorAll('a,button:not(:disabled)')],i=items.indexOf(document.activeElement);items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();}});
  window.addEventListener('resize',()=>closeMenu());document.addEventListener('scroll',e=>{if(e.target!==menu)closeMenu();},true);
  const closeIds={closeBillingDetails:'billingDetailsDialog',closeSendLink:'sendLinkDialog',closeCopyUrl:'copyUrlDialog',closePaymentRecords:'paymentRecordsDialog'};
  Object.entries(closeIds).forEach(([button,dialog])=>$(button).onclick=()=>{if(!busy)$(dialog).close();});
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(!busy)$(b.dataset.close).close();});
  document.querySelectorAll('.billing-modal').forEach(d=>{d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});d.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();else $('overviewStatus').focus();});});
  async function mutate(dialog,error,fn,success) {
    if(busy)return;busy=true;const controls=[...$(dialog).querySelectorAll('button,input,textarea')];controls.forEach(b=>b.disabled=true);$(error).textContent='';
    try{await fn();records=store.read();$(dialog).close();render();message(success);}catch(e){$(error).textContent=e.message;}finally{busy=false;controls.forEach(b=>b.disabled=false);}
  }
  $('sendLinkForm').onsubmit=e=>{e.preventDefault();const email=$('linkRecipient').value.trim();mutate('sendLinkDialog','sendLinkError',()=>store.send(selected.id,email),'Email delivery simulated. No email was sent.');};
  $('stopForm').onsubmit=e=>{e.preventDefault();const reason=$('stopReason').value.trim();if(!reason){$('stopError').textContent='Enter a stop reason.';return;}mutate('stopDialog','stopError',()=>store.stop(selected.id,reason),'Collection stopped. No new payments will be collected.');};
  $('renewForm').onsubmit=e=>{e.preventDefault();const input={expiry:$('renewExpiry').value,email:$('renewRecipient').value.trim(),send:e.submitter?.value==='send'};if(input.send&&!input.email){$('renewError').textContent='Enter a recipient email to send the link.';return;}mutate('renewDialog','renewError',()=>store.renew(selected.id,input),input.send?'Link renewed. Email delivery simulated; no email was sent.':'Link renewed. The original URL is available again.');};
  $('overviewFilters').onsubmit=e=>{e.preventDefault();const from=$('overviewFrom').value,to=$('overviewTo').value;if(from&&to&&from>to){$('overviewTo').setCustomValidity('End date must be on or after start date.');$('overviewTo').reportValidity();return;}filters={assignment:$('overviewAssignment').value,merchant:$('overviewMerchant').value.trim().toLowerCase(),status:$('overviewStatus').value,cycle:$('overviewCycle').value,from,to};page=1;render();};
  $('overviewFrom').oninput=$('overviewTo').oninput=()=>$('overviewTo').setCustomValidity('');
  $('resetOverview').onclick=()=>{$('overviewFilters').reset();$('overviewTo').setCustomValidity('');filters={};page=1;render();};$('pageSize').onchange=()=>{page=1;render();};
  $('exportOverview').onclick=()=>{const rows=[['Invoice No.','Date & Time (UTC)','Merchant Name','Billing Period','Cycle','Amount','Payment Status','Paid Installments','Due Date','Link Expires (UTC)','Link Status','Billing Notes'],...filtered().map(values)];const csv='\uFEFF'+rows.map(row=>row.map(v=>{let text=String(v??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='billing-overview.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Billing overview exported.');};
  async function connect(){ready=false;render();try{records=await store.initialize();ready=true;$('overviewError').hidden=true;render();}catch(e){$('overviewError').textContent=e.message;$('overviewError').hidden=false;}}
  function refresh(){if(!ready||busy||document.querySelector('dialog[open]')||!menu.hidden)return;store.sync().then(data=>{records=data;render();}).catch(e=>message(e.message));}
  window.addEventListener('billing-reconnect',connect);window.addEventListener('billing-local-change',refresh);window.addEventListener('focus',refresh);setInterval(refresh,60000);connect();
})();
