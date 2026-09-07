(function () {
  'use strict';
  const $=id=>document.getElementById(id), token=location.hash.slice(1), form=window.PaywizardBillingCardForm;
  const newRequestId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  let bill=null, busy=false, requestId=newRequestId();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:bill.currency}).format(v);
  const date=v=>v?new Date(v.slice(0,10)+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
  async function api(value) {
    const response=await fetch('/api/billing/public/'+token+(value?'/pay':''),{method:value?'POST':'GET',headers:value?{'Content-Type':'application/json'}:{},body:value?JSON.stringify(value):undefined});
    let result; try {result=await response.json();} catch(_){throw new Error('The payment service is unavailable. Please try again later.');}
    if(!response.ok)throw new Error(result.error||'Unable to load payment details.'); return result;
  }
  function render() {
    const details=[['Merchant',bill.merchantName],['Invoice No.',bill.invoice],['Billing amount',money(bill.amount)],['Billing cycle',bill.recurring?bill.cycle+' Months':'One-time'],['Contract total',money(bill.totalAmount)],['Service start',date(bill.start)],['Paid installments',bill.paidInstallments+' of '+bill.cycle],['Next payment',date(bill.paidInstallments ? bill.nextPaymentDate : bill.nextScheduledPaymentDate)],['Payment link expires',date(bill.expiry)]];
    $('billInformation').innerHTML='<h1>'+esc(bill.billType)+'</h1><p class="checkout-amount">'+esc(money(bill.amount))+(bill.recurring?'<small>per month</small>':'')+'</p><p class="bill-notes">'+esc(bill.notes)+'</p><dl class="bill-details">'+details.filter(([name])=>bill.recurring||!['Contract total','Service start','Next payment','Paid installments'].includes(name)).map(([name,value])=>'<div><dt>'+esc(name)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';
    const done=bill.paidInstallments>0 || bill.status==='Paid';
    $('pageLoading').hidden=true; $('pageError').hidden=true;
    $('cardForm').hidden=done||bill.linkExpired; $('paymentResult').hidden=!done;
    if(done){
      const headline = '<div class="result-header"><span class="material-symbols-rounded" aria-hidden="true">check_circle</span><h2>' + (bill.status === 'Paid' ? 'Thanks for your payment' : 'Payment received') + '</h2><p>' + (bill.authorization ? 'Your card is saved for the remaining scheduled payments.' : 'Your payment has been recorded.') + '</p></div>';
      const contract = bill.recurring ? '<div class="result-details">' + esc(bill.paidInstallments + ' of ' + bill.cycle + ' installments paid.') + (bill.authorization ? '<br>' + esc(bill.authorization.brand + ' •••• ' + bill.authorization.last4) : '') + (bill.nextPaymentDate ? '<br>Next unpaid installment: ' + esc(date(bill.nextPaymentDate)) : '<br>All installments are paid. No further charges.') + (bill.status === 'Overdue' ? '<br>A charge failed. Collection has stopped; the remaining installments are unpaid.' : '') + '</div>' : '';
      const receipts = bill.payments.map(p => '<div class="payment-receipt"><div><span>' + (bill.recurring ? 'Installment ' + esc(p.installment) : 'Payment amount') + '</span><strong>' + esc(money(p.amount)) + '</strong></div><div><span>' + esc(p.status) + '</span><span>' + esc(date(p.at)) + '</span></div><small>Payment ID ' + esc(p.id) + '</small></div>').join('');
      $('paymentResult').innerHTML = headline + contract + receipts;

    } else if(bill.linkExpired){$('pageError').textContent='This payment link has expired. Please contact the sender for assistance.';$('pageError').hidden=false;}
    else form.prepare(bill);
  }
  async function load(){try{bill=await api();render();}catch(error){$('pageLoading').hidden=true;$('cardForm').hidden=true;$('pageError').textContent=error.message;$('pageError').hidden=false;$('billInformation').innerHTML='<h1>Payment link unavailable</h1>';}}
  $('cardForm').onsubmit=async event=>{
    event.preventDefault(); if(busy||!form.validate())return; busy=true;form.setBusy(true);
    try{bill=await api(form.details(requestId));form.clear();render();if(!bill.paidInstallments){requestId=newRequestId();$('cardError').textContent='The charge failed. No installment was paid. Please try again.';$('cardError').hidden=false;}}
    catch(error){$('cardError').textContent=error.message;$('cardError').hidden=false;}
    finally{busy=false;form.setBusy(false);}
  };
  if(!/^[a-f0-9]{48}$/.test(token)){$('pageLoading').hidden=true;$('billInformation').innerHTML='<h1>Payment link unavailable</h1>';$('pageError').textContent='This payment link is invalid. Please contact the sender.';$('pageError').hidden=false;}
  else load();
  // Poll only completed pages: never erase an in-progress card form.
  setInterval(()=>{if(bill?.paidInstallments>0&&!busy)load();},15000);
})();
