(function () {
  'use strict';
  const $ = id => document.getElementById(id), form = $('cardForm');
  if (!form) return;
  let bill = null, busy = false;
  const money = (value, currency) => new Intl.NumberFormat('en-US', {style:'currency',currency}).format(value);
  function ready() { $('submitCard').disabled = busy || !form.checkValidity(); }
  function prepare(record) {
    bill = record; form.reset();
    form.querySelectorAll('input,select').forEach(el => el.setCustomValidity(''));
    $('recurringAuthorization').hidden = !bill.recurring;
    $('recurringConsent').required = bill.recurring;
    $('recurringConsent').disabled = !bill.recurring;
    const due = bill.dueInstallments?.length ? bill.dueInstallments : [1];
    const summary = $('chargeSummary'); summary.replaceChildren();
    const line = (text, tag = 'div') => { const el = document.createElement(tag); el.textContent = text; summary.append(el); };
    const amount = money(bill.amount, bill.currency);
    const catchUp = bill.recurring && due.length > 1;
    summary.hidden = !catchUp;
    if (catchUp) {
      line('Payments today', 'strong');
      due.forEach(number => line('Installment ' + number + ' · ' + amount));
      line('Charged separately, oldest first. Payments stop if a charge fails.');
    }
    const remaining = Math.max(0, Number(bill.cycle) - Number(bill.paidInstallments || 0) - due.length);
    const start = bill.nextScheduledPaymentDate ? new Date(bill.nextScheduledPaymentDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const future = remaining && start ? remaining + ' remaining monthly payment' + (remaining === 1 ? '' : 's') + ' of ' + amount + ', starting ' + start : '';
    $('recurringConsentText').textContent = future
      ? 'I authorize my card to be saved for ' + (catchUp ? 'the separate payments listed above and ' : '') + future + '.'
      : 'I authorize my card to be saved for ' + (catchUp ? 'the separate installment payments listed above.' : 'this final payment.');
    $('submitCard').textContent = catchUp ? 'Pay ' + due.length + ' installments' : 'Pay ' + amount + (bill.recurring ? ' now' : '');
    $('cardError').hidden = true; ready();
  }
  function validate() {
    const number = $('cardNumber').value.replace(/\s/g,''); let sum=0;
    [...number].reverse().forEach((digit,i)=>{let n=Number(digit);if(i%2){n*=2;if(n>9)n-=9;}sum+=n;});
    $('cardNumber').setCustomValidity(/^\d{13,19}$/.test(number) && !/^0+$/.test(number) && sum%10===0 ? '' : 'Enter a valid card number.');
    const digits=$('cardExpiry').value.replace(/\D/g,''), month=Number(digits.slice(0,2)), year=2000+Number(digits.slice(2)), now=new Date();
    $('cardExpiry').setCustomValidity(digits.length===4 && month>=1 && month<=12 && (year>now.getFullYear() || year===now.getFullYear() && month>=now.getMonth()+1) ? '' : 'Enter a valid, unexpired date (MM / YY).');
    form.querySelectorAll('input[required]:not([type=checkbox])').forEach(el=>{if(!el.value.trim())el.setCustomValidity('Please fill out this field.');});
    const valid = form.reportValidity(); ready(); return valid;
  }
  function details(requestId) {
    const number=$('cardNumber').value.replace(/\D/g,'');
    return {requestId,email:$('cardEmail').value.trim(),last4:number.slice(-4),brand:number.startsWith('4')?'Visa':number.startsWith('5')?'Mastercard':'Card',recurringConsent:$('recurringConsent').checked,acceptedTerms:[...form.querySelectorAll('.card-agreements input')].every(el=>el.checked)};
  }
  form.addEventListener('input',event=>{if(event.target.setCustomValidity)event.target.setCustomValidity('');ready();});
  form.addEventListener('change',ready);
  $('cardNumber').addEventListener('input',()=>{$('cardNumber').value=$('cardNumber').value.replace(/\D/g,'').slice(0,19).replace(/(.{4})/g,'$1 ').trim();});
  $('cardExpiry').addEventListener('input',()=>{const digits=$('cardExpiry').value.replace(/\D/g,'').slice(0,4);$('cardExpiry').value=digits.length>2?digits.slice(0,2)+' / '+digits.slice(2):digits;});
  window.PaywizardBillingCardForm={prepare,validate,details,setBusy(value){busy=value;form.setAttribute('aria-busy',String(value));ready();},clear(){form.reset();}};
})();
