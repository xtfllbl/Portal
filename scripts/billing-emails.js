(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n,currency) => new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n);
  function safeUrl(value, preview, image = false) {
    if (image && /^cid:[^\s<>]+$/.test(value || '')) return value;
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(preview && url.protocol === 'http:')) throw new Error('Use an HTTPS URL.');
    return url.href;
  }
  function render(notification, options = {}) {
    const s = notification.snapshot, type = notification.type, preview = options.preview === true;
    if (!['receipt','failure','invitation'].includes(type)) throw new Error('Unknown billing email.');
    if (type === 'receipt' && s.payment?.status !== 'Succeeded') throw new Error('Receipts require a successful payment.');
    if (type === 'failure' && s.failedPayment?.status !== 'Failed') throw new Error('Failure notices require a failed payment.');
    const format = n => money(n,s.currency), text = [], sections = [];
    const subject = type === 'receipt' ? 'Payment receipt — ' + s.invoiceNumber : type === 'failure' ? 'Payment failed — ' + s.invoiceNumber : 'Your Bill Is Ready';
    const stopped = options.collectionStopped || s.collectionStopped;
    const title = type === 'receipt' ? 'RECEIPT' : type === 'failure' ? 'Payment Failed' : 'Your Bill Is Ready';
    const logo = safeUrl(options.logoUrl,preview,true), paywizardLogo = safeUrl(options.paywizardLogoUrl || 'https://objectstorage.us-phoenix-1.oraclecloud.com/n/cnzeb08gfxuj/b/paywizard_js/o/paywizard-logo.png',preview,true);
    const paragraph = value => {text.push(value);sections.push('<p style="margin:0 0 18px;line-height:1.65;overflow-wrap:anywhere">'+esc(value)+'</p>');};
    const row = (label,value) => {text.push(label+': '+value);return '<tr><td style="padding:10px 12px 10px 0;color:#6b7280;vertical-align:top">'+esc(label)+'</td><td style="padding:10px 0;text-align:right;overflow-wrap:anywhere">'+esc(value)+'</td></tr>';};
    const table = rows => sections.push('<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #e5e7eb;margin-bottom:20px">'+rows.join('')+'</table>');
    function installments(label,items) {
      if (!items.length) return;
      paragraph(label);
      table(items.map(i=>row('Installment '+i.number+' · '+i.due,format(i.amount))));
    }
    function action(label,value) {
      const url = safeUrl(value,preview);text.push(label+': '+url);
      sections.push('<p style="margin:16px 0"><a class="billing-email-action" href="'+esc(url)+'" target="_blank" rel="noopener" style="display:block;box-sizing:border-box;min-height:54px;line-height:22px;padding:16px 12px;text-align:center;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">'+esc(label)+'</a></p><p style="font-size:12px;overflow-wrap:anywhere;word-break:break-all;margin:0 0 20px">'+esc(url)+'</p>');
    }
    const common = [row('Invoice',s.invoiceNumber),row('Description',s.description)];
    if(s.assignment==='merchant')common.push(row('Merchant',s.merchantName));
    if(s.billType==='eSIM Billing' && s.includedData != null)common.push(row('Included Data',s.includedData+' MB'));
    const due = s.unpaidInstallments || [];
    if(type==='receipt') {
      text.unshift(title,format(s.payment.amount));
      sections.push('<p style="font-size:36px;text-align:center;font-weight:700;margin:0 0 8px">'+esc(format(s.payment.amount))+'</p>');
      paragraph('Paid on '+s.payment.at.replace('T',' ').replace(/\.\d{3}Z$/,' UTC'));
      table(common.concat(row('Amount Paid',format(s.payment.amount)),row('Payment ID',s.payment.id),row('Payment Method',s.paymentMethod ? s.paymentMethod.brand+' •••• '+s.paymentMethod.last4 : 'Card')));
      if(s.recurring)paragraph('Billing Cycle: Month '+s.payment.installment+' of '+s.installmentCount+'. '+s.paidInstallmentCount+' installments paid.');
      if(stopped)paragraph('Collection has stopped. This payment was already processing and has now completed. No new payments will be collected.');
      else if(s.recurring && s.paidInstallmentCount===s.installmentCount)paragraph('All '+s.installmentCount+' installments have been paid. No further payments will be collected for this bill.');
      else if(s.recurring && due.length)paragraph('There are remaining due installments. Each will be collected separately, starting with the oldest unpaid installment.');
      else if(s.recurring && s.nextAutomaticAttemptAt)paragraph('Next payment: '+format(s.nextAmount)+' on '+s.nextAutomaticAttemptAt.replace('T',' ').replace(/\.\d{3}Z$/,' UTC')+'.');
      else if(s.recurring)paragraph('No further automatic attempts are scheduled. Review any remaining unpaid installments.');
    } else if(type==='failure') {
      text.unshift(title);
      paragraph('Payment for '+(s.recurring?'installment '+s.failedPayment.installment:'this bill')+' was unsuccessful. This collection round has stopped.');
      table(common.concat(row('Failed Amount',format(s.failedPayment.amount)),row('Attempted At',s.failedPayment.at.replace('T',' ').replace(/\.\d{3}Z$/,' UTC')),row('Payment ID',s.failedPayment.id)));
      if(s.successfulPayments?.length)paragraph('Paid successfully in this round: '+s.successfulPayments.map(p=>'installment '+p.installment+' ('+format(p.amount)+')').join(', ')+'. These payments will not be charged again.');
      if(s.recurring)installments('Unpaid installments',due);
      paragraph('Total due: '+format(due.reduce((sum,i)=>sum+Math.round(i.amount*100),0)/100));
      if(stopped || notification.status==='Suppressed')paragraph('Collection has stopped. No new payment or retry is available for this bill.');
      else if(s.hasAuthorization) {
        paragraph('Each installment is charged separately, starting with the oldest unpaid installment. Payments stop if a charge fails.');
        if(s.nextAutomaticAttemptAt)paragraph('Next automatic attempt: '+s.nextAutomaticAttemptAt.replace('T',' ').replace(/\.\d{3}Z$/,' UTC')+'.');
        else paragraph('No further automatic attempts are scheduled. Contact the platform for assistance with unpaid installments.');
        action('View Payment Status',options.paymentUrl);
      } else if(s.linkExpiryDate < notification.at.slice(0,10))paragraph('The payment link has expired. Contact the sender to renew it before paying.');
      else action('View Bill & Pay',options.paymentUrl);
    } else {
      text.unshift(title);paragraph('Hello,');paragraph('Your bill is ready. Review the details and complete your payment.');
      table(common.concat(row('Amount Due',format(due.reduce((sum,i)=>sum+Math.round(i.amount*100),0)/100))));
      if(s.recurring) {
        table([row('Monthly Amount',format(s.amount)),row('Installments',s.installmentCount),row('Contract Total',format(s.contractTotal))]);
        if(due.length>1)installments('Payments due as of '+notification.at.slice(0,10)+' (UTC). Each installment is charged separately, oldest first.',due);
        if(s.installmentCount>1)paragraph('After authorization, remaining monthly installments are collected automatically on the agreed schedule. Failed installments are retried at the next normal collection date, oldest first through the current installment. Collection ends when all agreed installments are paid.');
      }
      if(s.linkExpiryDate)paragraph('Payment link expires: '+s.linkExpiryDate+' (UTC). This does not end an existing installment authorization.');
      if(stopped)paragraph('Collection has stopped. This invitation is retained as history.');
      else {
        action('View Bill & Pay',options.paymentUrl);
        if(s.assignment==='merchant') {paragraph('Use either entry to review and pay the same bill. The direct payment link does not require portal sign-in.');action('Access Merchant Portal',options.portalUrl);}
      }
    }
    if(s.notes)paragraph('Billing note: '+s.notes);
    text.push(s.issuerName,'Sent via Paywizard Billing System');
    const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(subject)+'</title><style>@media(max-width:600px){.outer{padding:12px!important}.pad{padding:20px!important}}</style></head><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937"><table role="presentation" width="100%"><tr><td class="outer" style="padding:20px" align="center"><table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border-collapse:collapse"><tr><td class="pad" style="padding:24px 32px;border-bottom:1px solid #e5e7eb"><table role="presentation"><tr><td><img src="'+esc(paywizardLogo)+'" alt="Paywizard" width="125" style="display:block"></td><td style="padding:0 12px;color:#9ca3af;font-size:23px">|</td><td><img src="'+esc(logo)+'" alt="wizarPOS" width="92" style="display:block"></td></tr></table></td></tr><tr><td class="pad" style="padding:32px;overflow-wrap:anywhere"><h1 style="font-size:24px;margin:0 0 24px">'+esc(title)+'</h1>'+sections.join('')+'</td></tr><tr><td align="center" style="padding:24px;background:#f9fafb;font-size:12px;color:#6b7280">'+esc(s.issuerName)+'<br>Sent via Paywizard Billing System</td></tr></table></td></tr></table></body></html>';
    return {subject,html,text:text.join('\n\n')};
  }
  const api={render};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PaywizardBillingEmails=api;
})(globalThis);
