(function(){
'use strict';
const data=window.PaywizardTransactions,query=new URLSearchParams(location.search);
const esc=value=>String(value===undefined||value===null||value===''?'—':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const records=data.getRecords();
const id=query.has('transactionId')?query.get('transactionId'):'1022553788583641089';
const row=records.find(r=>r.paywizardId===id);
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
if(!query.has('transactionId'))history.replaceState(null,'',data.detailHref(id).replace('#relatedTransactions',''));
const terminalQuery=new URLSearchParams();
for(const key of ['terminalName','sn','tid','merchantName','storeName','storeId'])if(row[key])terminalQuery.set(key,row[key]);
let profile='wizarpos';try{profile=localStorage.getItem('paywizard.portalAccessProfile.v1')||profile;}catch(_){}
const unattended=profile.startsWith('unattended')||(['wizarpos','full-service','full-service-merchant'].includes(profile)&&row.terminalUsage==='self_service');
const terminalHref=(unattended?'1.terminalmanage_nayax.html':'1.terminalmanage.html')+'?'+terminalQuery;
const terminalLink=row.terminalControl==='lost'?esc(row.terminalName||'—'):`<a class="terminal-link" href="${esc(terminalHref)}">${esc(row.terminalName||'—')}</a>`;
const {summary,groups}=PaywizardTransactionDetail.describe(row);
document.querySelector('.sum').innerHTML=`<div class="amt"><div><div class="kk">Amount</div><strong>${esc(row.currency)} ${esc(row.amount)}</strong></div><div class="meta"><div class="chips"><span class="chip result ${esc(row.status)}">${esc(data.resultLabel(row))}</span><span class="chip neu">${esc(row.type==='Failed'?'Unknown':row.type)}</span><span class="chip info">Terminal</span></div></div></div><div class="key-grid">${summary.filter(([label])=>label!=='Terminal Name'||row.terminalName).map(([label,value])=>`<div class="summary-card"><span>${esc(label)}</span><strong>${label==='Terminal Name'?terminalLink:esc(value)}</strong></div>`).join('')}</div>`;
const fieldsHtml=fields=>fields.filter(([label])=>label!=='Terminal Name'||row.terminalName).map(([label,value])=>`<div class="kvrow"><span>${esc(label)}</span><strong>${label==='Terminal Name'?terminalLink:label==='Terminal SN'&&row.terminalControl!=='lost'&&value?`<a class="terminal-link" href="${esc(terminalHref)}">${esc(value)}</a>`:esc(value)}</strong></div>`).join('');
const columnSize=Math.ceil(groups[0].fields.length/3);
document.getElementById('sections').innerHTML=`<section class="card more"><div class="more-grid"><section class="mini top-transaction"><h4>Transaction</h4><div class="tx-grid">${[0,1,2].map(i=>`<div class="tx-col"><div class="kv">${fieldsHtml(groups[0].fields.slice(i*columnSize,(i+1)*columnSize))}</div></div>`).join('')}</div></section><div class="more-bottom">${groups.slice(1).map(({title,fields})=>`<section class="mini"><h4>${esc(title)}</h4><div class="kv">${fieldsHtml(fields)}</div></section>`).join('')}</div></div></section>`;
PaywizardRelated.mount(document.querySelector('#relatedTransactions .pw-related-content'),{id,load:()=>data.getRecords(),fromList:query.get('from')==='list',onVisibility:visible=>{document.getElementById('relatedTransactions').hidden=!visible;}});
if(location.hash==='#relatedTransactions')window.addEventListener('load',()=>requestAnimationFrame(()=>{const related=document.getElementById('relatedTransactions');if(!related.hidden)related.scrollIntoView({block:'start',behavior:'instant'});}),{once:true});
const receiptModal=document.getElementById('receiptModal'),sendModal=document.getElementById('sendReceiptModal');
const receiptFields=[['Transaction ID',id],['Trans ID',row.transId],['Merchant',row.merchantName],['Terminal',row.terminalName],['Time (UTC)',row.processorTime],['Type',row.type],['Result',data.resultLabel(row)],['Card',row.cardPanMasked],['APPR Code',row.approvalCode],['Amount',row.currency+' '+row.amount]];
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
 close();const toast=document.getElementById('toast');toast.textContent=`Receipt ${id} has been queued to ${input.value.trim()}.`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);
};
const download=receiptModal.querySelector('[data-toast]');download.removeAttribute('data-toast');download.onclick=()=>{
 const blob=new Blob([receiptFields.map(([key,value])=>key+': '+(value??'—')).join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='receipt-'+id.replace(/[^a-z0-9_-]/gi,'_')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
})();
