(function(){
'use strict';
const data=window.PaywizardTransactions,query=new URLSearchParams(location.search);
const esc=value=>String(value===undefined||value===null||value===''?'—':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const records=data.getRecords();
const requestedKey=query.get('recordKey'),legacyId=query.get('transactionId'),switched=query.get('switched')==='1';
const row=requestedKey?records.find(r=>r.recordKey===requestedKey):legacyId?records.find(r=>r.transactionId===legacyId):records.find(r=>r.recordKey==='detailed-visa-purchase-001');
const recordKey=row?.recordKey||requestedKey||legacyId||'';
const backHref='12.transaction_list.html'+(query.get('from')==='list'?'?restore=1':'');
document.getElementById('backToTransactionsBtn').href=backHref;
document.addEventListener('click',event=>{const a=event.target.closest('a');if(query.get('from')==='list'&&a?.getAttribute('href')==='12.transaction_list.html')a.href=backHref;},true);
const viewBtn=document.getElementById('viewReceiptBtn'),sendBtn=document.getElementById('sendReceiptBtn');
viewBtn.disabled=sendBtn.disabled=!row?.receiptAvailable;
viewBtn.title=sendBtn.title=row?.receiptAvailable?'':'Receipt unavailable for this transaction';
if(!row){
 document.querySelector('.sum').innerHTML=`<div class="pw-related-error" role="alert">Transaction unavailable. <a href="${backHref}">Return to Transactions</a></div>`;
 document.getElementById('relatedTransactions').hidden=true;document.getElementById('sections').replaceChildren();return;
}
if(!requestedKey&&row)history.replaceState(null,'',data.detailHref(recordKey).replace('#relatedTransactions',''));
if(switched){const clean=new URL(location.href);clean.searchParams.delete('switched');history.replaceState(null,'',clean.pathname+clean.search+clean.hash);}
const terminalQuery=new URLSearchParams();
for(const key of ['terminalName','sn','tid','merchantName','storeName','storeId'])if(row[key])terminalQuery.set(key,row[key]);
let profile='wizarpos';try{profile=localStorage.getItem('paywizard.portalAccessProfile.v1')||profile;}catch(_){}
const unattended=profile.startsWith('unattended')||(['wizarpos','full-service','full-service-merchant'].includes(profile)&&row.terminalUsage==='self_service');
const terminalHref=(unattended?'1.terminalmanage_nayax.html':'1.terminalmanage.html')+'?'+terminalQuery;
const terminalLink=row.terminalControl==='lost'?esc(row.terminalName||'—'):`<a class="terminal-link" href="${esc(terminalHref)}">${esc(row.terminalName||'—')}</a>`;
const {summary,groups}=PaywizardTransactionDetail.describe(row);
const displayAmount=`${row.currency} ${row.amount}`,amountSize=displayAmount.length>14?'amount-xxlong':displayAmount.length>11?'amount-xlong':displayAmount.length>8?'amount-long':'';
document.querySelector('.sum').innerHTML=`<div class="amt"><div><div class="kk">Amount</div><strong class="${amountSize}">${esc(displayAmount)}</strong></div><div class="meta"><div class="chips"><span class="chip result ${esc(row.status)}">${esc(data.resultLabel(row))}</span><span class="chip neu">${esc(row.type==='Failed'?'Unknown':row.type)}</span><span class="chip info">Terminal</span></div></div></div><div class="key-grid">${summary.map(([label,value])=>`<div class="summary-card"><span>${esc(label)}</span><strong>${label==='Terminal Name'?(row.terminalName?terminalLink:''):esc(value)}</strong></div>`).join('')}</div>`;
if(switched){
 const notice=document.getElementById('transactionSwitchNotice');
 notice.innerHTML=`<span>Now viewing transaction</span><strong>${esc(row.transactionId)}</strong>`;notice.hidden=false;document.title=`${row.transactionId} · Transaction Details`;
 const showSwitch=()=>{window.scrollTo(0,0);requestAnimationFrame(()=>requestAnimationFrame(()=>{notice.classList.add('show');setTimeout(()=>{notice.classList.remove('show');setTimeout(()=>{notice.hidden=true;},360);},3200);}));};
 if(document.readyState==='complete')showSwitch();else window.addEventListener('load',showSwitch,{once:true});
}
const fieldsHtml=fields=>fields.filter(([label])=>label!=='Terminal Name'||row.terminalName).map(([label,value])=>`<div class="kvrow"><span>${esc(label)}</span><strong>${label==='Terminal Name'?terminalLink:label==='Terminal SN'&&row.terminalControl!=='lost'&&value?`<a class="terminal-link" href="${esc(terminalHref)}">${esc(value)}</a>`:esc(value)}</strong></div>`).join('');
const columnSize=Math.ceil(groups[0].fields.length/3);
document.getElementById('sections').innerHTML=`<section class="card more"><div class="more-grid"><section class="mini top-transaction"><h4>Transaction</h4><div class="tx-grid">${[0,1,2].map(i=>`<div class="tx-col"><div class="kv">${fieldsHtml(groups[0].fields.slice(i*columnSize,(i+1)*columnSize))}</div></div>`).join('')}</div></section><div class="more-bottom">${groups.slice(1).map(({title,fields})=>`<section class="mini"><h4>${esc(title)}</h4><div class="kv">${fieldsHtml(fields)}</div></section>`).join('')}</div></div></section>`;
PaywizardRelated.mount(document.querySelector('#relatedTransactions .pw-related-content'),{id:recordKey,load:()=>data.getRecords(),fromList:query.get('from')==='list',onVisibility:visible=>{document.getElementById('relatedTransactions').hidden=!visible;}});
if(!switched&&location.hash==='#relatedTransactions')window.addEventListener('load',()=>requestAnimationFrame(()=>{const related=document.getElementById('relatedTransactions');if(!related.hidden)related.scrollIntoView({block:'start',behavior:'instant'});}),{once:true});
const receiptModal=document.getElementById('receiptModal'),sendModal=document.getElementById('sendReceiptModal');
const receiptFields=[['Transaction ID',row.transactionId],['Merchant',row.merchantName],['Terminal',row.terminalName],['Time (UTC)',row.processorTime],['Type',row.type],['Result',data.resultLabel(row)],['Card',row.cardPanMasked],['Approval Code',row.approvalCode],['Reference Number (RRN)',row.rrn],['Trace No. (STAN)',row.trace],['Amount',row.currency+' '+row.amount]].filter(([,value])=>value!==undefined&&value!==null&&value!=='');
document.querySelector('.bill-print').innerHTML=`<div class="print-center print-title">${esc(row.type)}</div>${receiptFields.map(([label,value])=>`<div class="print-row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`).join('')}<div class="print-center print-brand">PAYwizard</div>`;
let activeModal=null,returnFocus=null;
function close(){if(!activeModal)return;activeModal.classList.remove('open');activeModal.setAttribute('aria-hidden','true');activeModal=null;returnFocus?.focus({preventScroll:true});}
function open(modal){if(!row.receiptAvailable)return;returnFocus=document.activeElement;activeModal=modal;modal.classList.add('open');modal.setAttribute('aria-hidden','false');modal.querySelector('button,input:not([readonly])')?.focus();}
[receiptModal,sendModal].forEach(modal=>{
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',modal===receiptModal?'Receipt':'Send Receipt');
 modal.addEventListener('click',e=>{if(e.target===modal)close();});
});
viewBtn.onclick=()=>open(receiptModal);document.getElementById('cancelReceiptBtn').onclick=close;
const input=document.getElementById('sendReceiptEmail'),error=document.getElementById('sendReceiptError');
sendBtn.onclick=()=>{document.getElementById('transactionReceiptEmail').value=row.email||'—';input.value=row.email||'';error.textContent='';document.getElementById('sendReceiptFieldWrap').classList.remove('error');open(sendModal);input.focus();};
for(const key of ['closeSendReceiptBtn','cancelSendReceiptBtn'])document.getElementById(key).onclick=close;
document.addEventListener('keydown',e=>{
 if(!activeModal)return;
 if(e.key==='Escape'){e.preventDefault();close();}
 if(e.key==='Tab'){
  const list=[...activeModal.querySelectorAll('button:not([disabled]),input:not([readonly]),a[href]')];const first=list[0],last=list.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
input.oninput=()=>{error.textContent='';document.getElementById('sendReceiptFieldWrap').classList.remove('error');};
document.getElementById('confirmSendReceiptBtn').onclick=()=>{
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())){error.textContent='Enter a valid email address before sending the receipt.';document.getElementById('sendReceiptFieldWrap').classList.add('error');error.scrollIntoView({block:'nearest'});input.focus();return;}
 close();const toast=document.getElementById('toast');toast.textContent=`Receipt ${row.transactionId} has been queued to ${input.value.trim()}.`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);
};
const download=receiptModal.querySelector('[data-toast]');download.removeAttribute('data-toast');download.onclick=()=>{
 const blob=new Blob([receiptFields.map(([key,value])=>key+': '+(value??'—')).join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='receipt-'+row.transactionId.replace(/[^a-z0-9_-]/gi,'_')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
})();
