/* Preserve the original detail schema. Missing data never borrows another record's payload. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PaywizardTransactionDetail=api;})(typeof window==='undefined'?this:window,function(){
'use strict';
const resultLabel=row=>({completed:'Completed',failed:'Failed'})[row.status]||'Unknown';
function describe(row){
 const payload={...(row.detail||{})};
 const fields={transactionId:'transactionId',mid:'mid',transType:'type',amount:'amount',currencyCode:'currencyCode',tranTime:'processorTime',terminalDateTime:'terminalTime',terminalTimezone:'timezone',cardNo:'cardPanMasked',sn:'sn',invoiceNum:'invoiceNumber',traceNum:'trace',approvalCode:'approvalCode',tId:'tid',tci:'tci',merchantName:'merchantName',merchantAddress:'terminalName',batchNum:'batch',receiptEmail:'email',oriTransId:'originalTransactionId',externalOrderNo:'externalOrderNo',rrn:'rrn',entryMode:'entryMode'};
 for(const [key,source] of Object.entries(fields))if(row[source]!==undefined&&row[source]!=='')payload[key]=row[source];
 if(!payload.cardBrand)payload.cardBrand=row.cardBrand;
 if(payload.transType==='Failed')payload.transType='Unknown';
    const groups=[
      {title:"Transaction",fields:[["Transaction Type",payload.transType],["Transaction Status",resultLabel(row)],["Transaction Amount",`${row.currency} ${row.amount}`],["Currency Code",payload.currencyCode],["Transaction Time",payload.tranTime],["Terminal Time",payload.terminalDateTime],["Terminal Timezone",payload.terminalTimezone],["Receipt Email",payload.receiptEmail],["Approval Code",payload.approvalCode,"mono"],["Reference Number (RRN)",payload.rrn,"mono"],["Transaction ID",payload.transactionId,"mono"],["Invoice No.",payload.invoiceNum,"mono"],["Trace No. (STAN)",payload.traceNum,"mono"],["Batch No.",payload.batchNum,"mono"],["Checkout ID",payload.checkoutId,"mono"]]},
      {title:"Merchant",fields:[["Merchant Name",payload.merchantName],["Merchant ID",payload.mid,"mono"],["Terminal ID",payload.tId,"mono"],["TCI",payload.tci,"mono"],["Terminal SN",payload.sn,"mono"],["Country Code",payload.countryCode],["Terminal Name",payload.merchantAddress]]},
      {title:"Card",fields:[["Card Number",payload.cardNo,"mono"],["Card Brand",payload.cardBrand],["Entry Mode",payload.entryMode],["Expiry Date",payload.expiryDate,"mono"],["Card Unique ID",payload.cardUniqueId,"mono"],["Card Token",payload.cardToken,"mono"]]},
      {title:"Amounts",fields:[["Transaction Amount",payload.transAmount],["Cash Back Amount",payload.otherAmount],["Tip Amount",payload.tipAmount],["Tax Amount",payload.taxAmount],["Balance",payload.balance],["Duty-Free Amount",payload.dutyFreeAmount]]},
      {title:"DCC",fields:[["Original Currency",payload.dccOriCurrencyCode],["Original Amount",payload.dccOriAmount],["DCC Fee",payload.dccFee],["Exchange Rate",payload.dccExchangeRate],["Markup Rate",payload.dccMarkUp],["Receipt Footer",payload.dccFooterText]]},
      {title:"EMV",fields:[["EMV AID",payload.emvAid,"mono"],["EMV App Name",payload.emvAppName],["EMV TC / ARQC",payload.emvCryptogram,"mono"],["EMV TVR",payload.emvTvr,"mono"]]},
      {title:"Original",fields:[["Original Transaction ID",payload.oriTransId,"mono"],["Original Reference Number (RRN)",payload.oriRrn,"mono"],["Original Invoice No.",payload.oriInvoiceNum,"mono"]]},
      {title:"Point Of Sale",fields:[["Caller Information",payload.callerName],["External Order No.",payload.externalOrderNo,"mono"],["OPC Action",payload.opcAction],["OPC Version Name",payload.opcVersionName],["OPC Version Code",payload.opcVersionCode,"mono"]]},
      {title:"Extra",fields:[["Additional Info",payload.additionalInfo],["Has MSR",payload.hasMSR],["Batch Detail Info",payload.batchDetailInfo],["Unified Category",payload.unifiedCategory],["Unified Code",payload.unifiedCode]]}
    ];

 groups[1].fields.push(['Store Name',row.storeName],['Store ID',row.storeId],['Transaction Channel',row.transactionChannel]);
 groups[2].fields.push(['Payment Method',row.paymentMethod||'Card']);
 const hasValue=value=>value!==undefined&&value!==null&&value!=='';
 const visibleGroups=groups.map(group=>({...group,fields:group.fields.filter(([,value])=>hasValue(value))})).filter(group=>group.fields.length);
 const summary=[['Transaction Time',payload.tranTime],['External Order No.',payload.externalOrderNo],['Merchant ID',payload.merchantId??row.mid],['Terminal ID',payload.tId],['Approval Code',payload.approvalCode],['Reference Number',payload.rrn],['Transaction ID',row.transactionId],['Terminal Name',row.terminalName]];
 return {groups:visibleGroups,summary};
}
return {describe};
});
