(function () {
  'use strict';
  window.PaywizardProviderCheckout = {start};
  function start() {
    const api=window.PaywizardProviderBilling,form=window.PaywizardBillingCardForm,$=id=>document.getElementById(id);
    const token=location.hash.slice(1),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const money=(amount,currency)=>new Intl.NumberFormat('en-US',{style:'currency',currency,currencyDisplay:'code'}).format(amount/100);
    let bill,busy=false;
    function fail(message){$('pageLoading').hidden=true;$('cardForm').hidden=true;$('pageError').textContent=message;$('pageError').hidden=false;}
    function render(preserve=false){
      const values=preserve?[...$('cardForm').querySelectorAll('input,select')].map(input=>({id:input.id,value:input.value,checked:input.checked,input})):[];
      $('billInformation').innerHTML=`<h1>${esc(bill.providerName)}</h1><p class="checkout-amount">${money(Math.round(bill.amount*100),bill.currency)}</p><dl class="bill-details"><div><dt>Invoice no.</dt><dd>${esc(bill.id)}</dd></div><div><dt>Billing period</dt><dd>${bill.quarter.replace('-',' ')}</dd></div><div><dt>Payment link expires · UTC</dt><dd>${bill.expiry||'—'}</dd></div></dl><div class="provider-checkout-items"><h2>Charges</h2>${bill.lines.map(line=>`<div><span>${esc(line.label)} <small>× ${line.quantity}</small></span><strong>${money(line.amount,bill.currency)}</strong></div>`).join('')}</div>${bill.note?`<p class="bill-notes">${esc(bill.note)}</p>`:''}`;
      $('pageLoading').hidden=true;$('pageError').hidden=true;$('cardForm').hidden=true;$('paymentResult').hidden=true;
      if(bill.status==='Paid'){
        $('paymentResult').hidden=false;$('paymentResult').innerHTML=`<div class="result-header"><span class="material-symbols-rounded" aria-hidden="true">check_circle</span><h2>Payment received</h2><p>Your quarterly bill has been paid.</p></div>${bill.payments.map(payment=>`<div class="payment-receipt"><div><span>Amount paid</span><strong>${money(payment.amount,bill.currency)}</strong></div><div><span>${esc(payment.brand)} · ${esc(payment.last4)}</span><span>${payment.at.slice(0,10)}</span></div><small>${esc(payment.id)}</small></div>`).join('')}<a class="provider-checkout-return" href="52.provider_bill.html?id=${encodeURIComponent(bill.id)}">Return to Billing</a>`;
      }else if(bill.status==='No payment required'){$('paymentResult').hidden=false;$('paymentResult').innerHTML='<div class="result-header"><h2>No payment required</h2><p>There is no amount due for this quarter.</p></div>';}
      else if(bill.processing){fail('Your payment is being confirmed. Do not submit another payment. Refresh to check the result.');}
      else if(bill.expiry<api.today()){fail('This payment link has expired. Contact operations to extend the link, then refresh this page.');}
      else{$('cardForm').hidden=false;form.prepare(bill);values.forEach(({input,value,checked})=>{input.value=value;input.checked=checked;});form.setBusy(false);}
    }
    function load(preserve=false){try{bill=api.publicBill(token);render(preserve);}catch(problem){fail(problem.message);$('billInformation').innerHTML='<h1>Payment link unavailable</h1>';}}
    $('cardForm').onsubmit=async event=>{
      event.preventDefault();if(busy||!form.validate())return;
      const requestId=crypto.randomUUID(),details=form.details(requestId);
      try{api.beginPayment(token,bill.revision,requestId);}catch(problem){load(true);$('cardError').textContent=problem.message+' Review the bill before confirming payment again.';$('cardError').hidden=false;$('cardError').setAttribute('tabindex','-1');$('cardError').scrollIntoView({block:'center'});$('cardError').focus();return;}
      busy=true;form.setBusy(true);
      try{await new Promise(resolve=>setTimeout(resolve,650));bill=api.finishPayment(token,requestId,details);form.clear();render();}
      catch(problem){fail('Payment status is being confirmed. Refresh this page before attempting another payment.');}
      finally{busy=false;form.setBusy(false);}
    };
    window.addEventListener('storage',event=>{if(event.key!==api.KEY||busy)return;try{const current=api.publicBill(token);if(current.revision!==bill?.revision){if(current.status==='Paid'||current.processing){load();return;}$('pageError').textContent='This bill has been updated. Review the latest charges before paying.';$('pageError').hidden=false;load(true);$('pageError').textContent='This bill has been updated. Review the latest charges before paying.';$('pageError').hidden=false;}}catch(problem){fail(problem.message);}});
    load();
  }
})();
