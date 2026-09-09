(function () {
  'use strict';
  const $=id=>document.getElementById(id), form=window.PaywizardBillingCardForm;
  let token=location.hash.slice(1);
  const newRequestId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  let bill=null, busy=false, requestId=newRequestId();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:bill.currency}).format(v);
  const date=v=>v?new Date(v.slice(0,10)+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
  async function api(value, action) { return window.PaywizardBillingStore.publicBill(token, value, action); }
  function render() {
    const stopped=bill.status==='Stopped', done=stopped || !!bill.authorization || bill.paidInstallments>0 || bill.status==='Paid';
    const details=[['Merchant',bill.merchantName],['Invoice No.',bill.invoice],['Billing amount',money(bill.amount)],['Billing cycle',bill.recurring?bill.cycle+' Months':'One-time'],['Contract total',money(bill.totalAmount)],['Renewal','No automatic renewal'],['Service start',date(bill.start)],['Paid installments',bill.paidInstallments+' of '+bill.cycle],['Next payment',date(bill.paidInstallments ? bill.nextPaymentDate : bill.nextScheduledPaymentDate)],['Payment link expires',date(bill.expiry)]];
    $('billInformation').innerHTML='<h1>'+esc(bill.billType)+'</h1><p class="checkout-amount">'+esc(money(bill.amount))+(bill.recurring?'<small>per month</small>':'')+'</p><p class="bill-notes">'+esc(bill.notes)+'</p><dl class="bill-details">'+details.filter(([name])=>(name !== 'Merchant' || bill.assignment !== 'standalone') && (!done || name !== 'Renewal') && (bill.recurring||!['Contract total','Renewal','Service start','Next payment','Paid installments'].includes(name))).map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
    $('pageLoading').hidden=true; $('pageError').hidden=true;
    $('cardForm').hidden=done||bill.linkExpired; $('paymentResult').hidden=!done;
    if(done){
      const title = stopped ? 'Collection stopped' : bill.canRetry ? 'Payment needs attention' : bill.status === 'Paid' ? 'Thanks for your payment' : 'Payment received';
      const info = stopped ? 'No new payments can be made for this bill. A payment already processing may still complete.' : bill.canRetry ? 'A payment is overdue or failed. Review the unpaid installments before retrying.' : bill.authorization ? 'Your card is saved for the remaining scheduled payments.' : 'Your payment has been recorded.';
      const headline = '<div class="result-header"><span class="material-symbols-rounded" aria-hidden="true">' + (stopped ? 'stop_circle' : bill.canRetry ? 'error' : 'check_circle') + '</span><h2>' + title + '</h2><p>' + info + '</p></div>';
      const contract = bill.recurring ? '<div class="result-details">' + esc(bill.paidInstallments + ' of ' + bill.cycle + ' installments paid.') + (bill.authorization ? '<br>' + esc(bill.authorization.brand + ' •••• ' + bill.authorization.last4) : '') + (stopped ? '<br>Collection has stopped. Previous payments are retained.' : bill.nextPaymentDate ? '<br>Next unpaid installment: ' + esc(date(bill.nextPaymentDate)) : '<br>All installments are paid. No further charges.') + '</div>' : '';
      const receipts = bill.payments.map(p => '<div class="payment-receipt"><div><span>' + (bill.recurring ? 'Installment ' + esc(p.installment) : 'Payment amount') + '</span><strong>' + esc(money(p.amount)) + '</strong></div><div><span>' + esc(p.status) + '</span><span>' + esc(date(p.at)) + '</span></div><small>Payment ID ' + esc(p.id) + '</small></div>').join('');
      $('paymentResult').innerHTML = headline + contract + (bill.canRetry ? '<button id="retryPayment" type="button">Retry Payment</button>' : '') + receipts;
      if (bill.canRetry) $('retryPayment').onclick = () => window.PaywizardBillingRetry.open(bill, input => api(input, 'retry'), result => {bill=result;render();});

    } else if(bill.linkExpired){$('pageError').innerHTML='This payment link has expired. Ask the sender to renew it, then refresh this page.<br><button id="refreshExpiredLink" type="button">Refresh payment link</button>'; $('refreshExpiredLink').onclick=load;$('pageError').hidden=false;}
    else form.prepare(bill);
  }
  async function load(){try{bill=await api();render();}catch(error){$('pageLoading').hidden=true;$('cardForm').hidden=true;$('pageError').textContent=error.message;$('pageError').hidden=false;$('billInformation').innerHTML='<h1>Payment link unavailable</h1>';}}
  $('cardForm').onsubmit=async event=>{
    event.preventDefault(); if(busy||!form.validate())return; busy=true;form.setBusy(true);
    try{bill=await api(form.details(requestId));form.clear();render();if(!bill.paidInstallments&&!bill.authorization){requestId=newRequestId();$('cardError').textContent='The charge failed. No installment was paid. Please try again.';$('cardError').hidden=false;}}
    catch(error){$('cardError').textContent=error.message;$('cardError').hidden=false;}
    finally{busy=false;form.setBusy(false);}
  };
  if(!/^[a-f0-9]{48}$/.test(token) && !token.startsWith('local.')){$('pageLoading').hidden=true;$('billInformation').innerHTML='<h1>Payment link unavailable</h1>';$('pageError').textContent='This payment link is invalid. Please contact the sender.';$('pageError').hidden=false;}
  else load();
  window.addEventListener('hashchange', () => {token=location.hash.slice(1);bill=null;requestId=newRequestId();form.clear();$('cardForm').hidden=true;$('paymentResult').hidden=true;$('pageLoading').hidden=false;load();});
  // Poll only completed pages: never erase an in-progress card form.
  setInterval(()=>{if(bill&&(bill.authorization||bill.paidInstallments>0||bill.status==='Stopped')&&!busy&&!document.querySelector('dialog[open]'))load();},60000);
})();
