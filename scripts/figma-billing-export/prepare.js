(async function(){
 const $=s=>document.querySelector(s),state=window.exportState;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const fill=(id,value)=>{const e=$('#'+id);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
 const click=s=>{const e=$(s);if(!e)throw Error('Missing export control '+s);e.click();};
 try{
  await document.fonts.ready;
  for(let i=0;i<100;i++){if(state.startsWith('43-')?$('#pageLoading').hidden:window.PaywizardBillingStore.mode==='local'&&!($('#applyBilling')?.disabled))break;await wait(50);}
  await wait(300);
  if(state.startsWith('41-')){
   fill('merchant','billing-merchant-1');fill('amount','149.95');fill('expiry','2026-11-20');fill('notes','Terminal service and support');
   if(state==='41-02')click('[data-assignment="standalone"]');
   if(['41-03','41-04'].includes(state)){click('#recurring');fill('amount','39.90');fill('cycle','6');fill('startDate','2026-09-20');}
   if(state==='41-04'){fill('billType','eSIM Billing');fill('includedData','2048');fill('notes','Monthly connectivity plan');}
   if(state==='41-05')click('#recordsTab');
   if(state==='41-06'){fill('notes','Service details '.repeat(145));click('#saveDraft');}
  }else if(state.startsWith('42-')){
   fill('paymentMerchant',state==='42-05'?'billing-merchant-8':'billing-merchant-1');
   if(state==='42-02')click('#historyTab');
   if(['42-03','42-04','42-06'].includes(state)){
    click('[data-pay="figma-'+(state==='42-04'?'monthly':'one')+'"]');
    if(state==='42-06'){
     for(const [id,value] of Object.entries({cardEmail:'payer@example.com',cardNumber:'4242 4242 4242 4242',cardExpiry:'1228',cardCvc:'123',cardholder:'Taylor Morgan',cardCountry:'US',cardAddress:'123 Demo Street',cardPostal:'94105',cardRegion:'California'}))fill(id,value);
     document.querySelectorAll('.card-agreements input').forEach(e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));});
     window.PaywizardBillingStore.pay=async()=>({paidInstallments:0,authorization:null});
     $('#cardForm').requestSubmit();await wait(150);
    }
   }
  }else if(state.startsWith('44-')){
   fill('pageSize','10');
   if(state==='44-02')click('#tabAttention');
   const actions={'44-04':['active','View billing details'],'44-05':['overdue','View payment records'],'44-06':['one','Send Link'],'44-07':['expired','Renew Link'],'44-08':['overdue','Retry Payment'],'44-09':['active','Stop Collection'],'44-10':['active','View emails']};
   const a=actions[state];
   if(state==='44-03'||a){click('[data-more="figma-'+(a?a[0]:'one')+'"]');if(a){const el=[...document.querySelectorAll('#overviewMenu [role="menuitem"]')].find(e=>e.textContent.trim()===a[1]);if(!el)throw Error('Missing action '+a[1]);el.click();}}
   if(state==='44-06')fill('linkRecipient','payer@example.com');
  }
  await wait(100);
  if(state!=='42-06')document.activeElement?.blur();
  document.documentElement.dataset.exportReady=state;
  document.title=state+' · Billing Figma Export';
  if(window.exportCaptureHash.startsWith('#figmacapture=')){
   history.replaceState(null,'',location.pathname+location.search+window.exportCaptureHash);
   const s=document.createElement('script');s.src='https://mcp.figma.com/mcp/html-to-design/capture.js';s.async=true;document.head.appendChild(s);
  }
 }catch(e){document.documentElement.dataset.exportError=e.message;console.error('Export fixture:',e);}
})();
