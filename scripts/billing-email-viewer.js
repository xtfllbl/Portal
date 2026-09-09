(function () {
  'use strict';
  const dialog=document.createElement('dialog');dialog.className='billing-page billing-modal billing-email-dialog';dialog.setAttribute('aria-labelledby','billingEmailsTitle');
  dialog.innerHTML='<h2 id="billingEmailsTitle">Billing Emails</h2><label>Email<select id="billingEmailSelect"></select></label><dl class="billing-summary" id="billingEmailMeta"></dl><p id="billingEmailNotice" role="status"></p><iframe id="billingEmailFrame" title="Billing email preview" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe><pre id="billingEmailText" hidden></pre><div class="billing-actions"><button id="billingEmailHtml" type="button" aria-pressed="true">HTML</button><button id="billingEmailPlain" type="button" aria-pressed="false">Plain Text</button><button id="closeBillingEmails" type="button">Close</button></div>';
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);let record,opener,notification=null;
  const label={receipt:'Payment Receipt',failure:'Payment Failed',invitation:'Your Bill Is Ready'};
  function view(plain) {$('billingEmailText').hidden=!plain;$('billingEmailFrame').hidden=plain;$('billingEmailPlain').setAttribute('aria-pressed',String(plain));$('billingEmailHtml').setAttribute('aria-pressed',String(!plain));}
  function render() {
    notification=(record.notifications||[]).find(n=>n.id===$('billingEmailSelect').value);
    $('billingEmailMeta').replaceChildren();
    if(!notification){$('billingEmailFrame').srcdoc='';$('billingEmailText').textContent='';$('billingEmailNotice').textContent='No email events for this bill.';return;}
    const options={preview:true,paymentUrl:window.PaywizardBillingStore.link(record),portalUrl:new URL('42.billing_payments.html?merchantId='+encodeURIComponent(record.merchantId||''),location.href).href,logoUrl:new URL('邮件模版html/邮件模版html/billingReceiptLogo.png',location.href).href,paywizardLogoUrl:new URL('assets/paywizard-logo-email.png',location.href).href,collectionStopped:record.status==='Stopped'};
    try {
      const output=window.PaywizardBillingEmails.render(notification,options);
      for(const [label,value] of [['To',notification.email],['Subject',output.subject],['Created (UTC)',notification.at.replace('T',' ').replace(/\.\d{3}Z$/,' UTC')]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('billingEmailMeta').append(dt,dd);}
      $('billingEmailNotice').textContent=notification.status==='Suppressed'?'Suppressed: collection has stopped.':'Simulated email. No email was sent.';
      $('billingEmailFrame').srcdoc=output.html;$('billingEmailText').textContent=output.text;
    } catch(error) {$('billingEmailFrame').srcdoc='';$('billingEmailText').textContent='';$('billingEmailNotice').textContent=error.message;}
  }
  $('billingEmailSelect').onchange=render;$('billingEmailHtml').onclick=()=>view(false);$('billingEmailPlain').onclick=()=>view(true);$('closeBillingEmails').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
  window.PaywizardBillingEmailViewer={open(bill){record=bill;opener=document.activeElement;$('billingEmailSelect').replaceChildren();for(const n of [...(bill.notifications||[])].reverse()){$('billingEmailSelect').add(new Option((label[n.type]||n.type)+' · '+n.at.replace('T',' ').slice(0,19)+' UTC',n.id));}view(false);render();dialog.showModal();}};
})();
