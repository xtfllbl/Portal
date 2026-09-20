(function(){
 const d=window.PaywizardBillingDomain,now=new Date();
 const make=(id,extra={})=>d.makeBill({id:'figma-'+id,assignment:'merchant',merchantId:'billing-merchant-1',merchantName:'Maple Street Coffee',invoice:'BILL-'+id.toUpperCase(),billType:'General Billing',currency:'USD',amount:149.95,recurring:false,cycle:1,start:'',expiry:'2026-11-20',notes:'Terminal service and support',status:'Pending',createdAt:'2026-09-20T08:30:00.000Z',...extra},now);
 const charge=b=>d.checkout(b,{requestId:'figma-export-request-'+b.id,email:'payer@example.com',acceptedTerms:true,recurringConsent:true,brand:'Visa',last4:'4242'},now);
 const rec={recurring:true,cycle:6,start:'2026-09-20',amount:39.9,notes:'Monthly terminal service · fixed-term contract'};
 const one=make('one'),monthly=make('monthly',window.exportState==='42-04'?{...rec,start:'2026-08-20',invoice:'BILL-CATCHUP'}:rec),expired=make('expired',{expiry:'2026-09-10'}),active=make('active',rec);charge(active);
 const overdue=make('overdue',{...rec,start:'2026-08-20'});d.checkout(overdue,{requestId:'figma-export-request-overdue',email:'payer@example.com',acceptedTerms:true,recurringConsent:true,brand:'Visa',last4:'4242'},now,{failAt:2});
 const paid=make('paid',{...rec,start:'2026-06-20',cycle:3});charge(paid);
 const stopped=make('stopped',rec);charge(stopped);d.stopCollection(stopped,{reason:''},now);
 const stand=make('standalone',{assignment:'standalone',merchantId:null,merchantName:'',amount:225,notes:'Equipment setup service'});
 const draft=make('draft',{status:'Draft',invoice:'',amount:89});
 const esim=make('esim',{...rec,billType:'eSIM Billing',includedData:2048,notes:'Monthly connectivity plan'});
 const fixtures=[one,monthly,expired,active,overdue,paid,stopped,stand,draft,esim];
 if(window.exportState==='42-05') fixtures.forEach(b=>{b.merchantId='billing-merchant-2';b.merchantName='Harbour Market';});
 let fixtureJson=JSON.stringify(fixtures); for(const b of fixtures) for(const [i,p] of b.payments.entries()) fixtureJson=fixtureJson.replaceAll(p.id,'PAY-'+b.id.toUpperCase()+'-'+String(i+1).padStart(2,'0'));
 localStorage.setItem('paywizard-billing-local-v1',fixtureJson);
 if(location.pathname.includes('43.')){
  const ids={'43-01':'one','43-02':'monthly','43-04':'expired','43-05':'active','43-06':'overdue','43-07':'paid','43-08':'stopped'};
  const b=fixtures.find(b=>b.id==='figma-'+ids[window.exportState]);
  const token=b?'local.'+btoa(JSON.stringify(d.publicView(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''):'invalid';
  history.replaceState(null,'',location.pathname+location.search+'#'+token);
 }
})();
