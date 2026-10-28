(function (root) {
  'use strict';
  const KEY = 'paywizard.provider-billing.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const cents = value => Math.round(Number(value) * 100);
  const today = () => new Date().toISOString().slice(0, 10);
  const stamp = () => new Date().toISOString();
  const nextMonth = month => { const [y, m] = month.slice(0, 7).split('-').map(Number); return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7); };
  const monthName = month => new Date(month + '-01T00:00:00Z').toLocaleDateString('en-US', {month:'long',year:'numeric',timeZone:'UTC'});
  const quarterMonths = quarter => { const [y, q] = quarter.split('-Q').map(Number); return [0,1,2].map(i => `${y}-${String((q-1)*3+i+1).padStart(2,'0')}`); };
  const quarterOf = month => `${month.slice(0,4)}-Q${Math.ceil(Number(month.slice(5,7))/3)}`;
  const total = bill => bill.lines.reduce((sum, line) => sum + line.amount, 0);
  const rateAt = (provider, month) => [...provider.rates].filter(rate => rate.effective <= month).sort((a,b) => b.effective.localeCompare(a.effective))[0];
  function ensure(condition, message) { if (!condition) throw new Error(message); }
  function validateLines(lines) {
    ensure(lines.length > 0, 'Keep at least one billing item.');
    for (const line of lines) {
      ensure(String(line.label || '').trim(), 'Enter a name for every billing item.');
      ensure(Number.isInteger(line.quantity) && line.quantity >= 0, 'Enter a whole, non-negative quantity for every item.');
      ensure(Number.isSafeInteger(line.unit) && line.unit >= 0, 'Enter a valid unit fee with up to two decimal places.');
      ensure(Number.isSafeInteger(line.amount) && line.amount >= 0 && line.amount <= 99999999900, 'Enter a valid, non-negative amount for every item.');
    }
  }
  function feeEvents(periods, provider, endMonth) {
    const events = [];
    const add = (period, type, at, quantity, amount, reason) => events.push({id:`${period.id}-${type}-${at.slice(0,7)}`, periodId:period.id, providerId:provider.id, sn:period.sn, terminal:period.terminal, agent:period.agent, merchant:period.merchant, store:period.store, type, at, quantity, amount, currency:provider.currency, reason});
    for (const period of periods.filter(item => item.providerId === provider.id)) {
      const activationMonth = period.start.slice(0,7), historic = activationMonth < provider.commencement;
      const activationRate = rateAt(provider, historic ? provider.commencement : activationMonth);
      if (!activationRate) continue;
      add(period, period.activation ? (historic ? 'Historical activation' : 'Activation') : 'Re-enabled', period.start, period.activation ? 1 : 0, period.activation ? activationRate.activation : 0, period.reason);
      for (let month = nextMonth(activationMonth); month <= endMonth; month = nextMonth(month)) {
        if (month < provider.commencement || (period.end && month > period.end.slice(0,7))) continue;
        const rate = rateAt(provider, month);
        if (rate) add(period, 'Monthly service', month+'-01T00:00:00Z', 1, rate.monthly, monthName(month));
      }
      if (period.end) add(period, 'Unbound', period.end, 0, 0, 'Future monthly service charges stopped. Existing charges retained.');
    }
    return events.sort((a,b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  }
  function calculate(provider, events, quarter) {
    const months = quarterMonths(quarter), selected = events.filter(event => event.providerId === provider.id && (event.type === 'Historical activation' ? quarterOf(provider.commencement) === quarter : quarterOf(event.at) === quarter));
    const lines = [];
    for (const group of ['Historical activation', 'Activation', ...months]) {
      const matches = selected.filter(event => group.length === 7 ? event.type === 'Monthly service' && event.at.startsWith(group) : event.type === group);
      if (!matches.length && group.length !== 7) continue;
      const rates = [...new Set(matches.map(event => event.amount))];
      if (!rates.length) rates.push(rateAt(provider, group.length===7?group:months[0])?.monthly || 0);
      for (const unit of rates) {
        const items = matches.filter(event => event.amount === unit);
        lines.push({id:`${group}-${unit}`, label:group.length===7 ? 'Monthly service · '+monthName(group) : group === 'Activation' ? 'Activation fee' : 'Historical activation fee', kind:group.length===7?'monthly':'activation', month:group.length===7?group:'', quantity:items.length, unit, amount:items.reduce((sum,event)=>sum+event.amount,0), eventIds:items.map(event=>event.id)});
      }
    }
    return lines;
  }
  function createBill(provider, events, quarter) {
    const lines = calculate(provider, events, quarter);
    return {id:`PB-${quarter.replace('-','')}-${provider.id}`, providerId:provider.id, providerName:provider.name, quarter, currency:provider.currency, lines, original:clone(lines), status:'Draft', revision:1, publishedAt:null, expiry:null, note:'', audit:[], payments:[], lock:null, token:`provider.${quarter}.${provider.id}.review`, createdAt:'2026-10-01T00:00:00Z'};
  }
  function seed() {
    const catalogue = root.PaywizardServiceProviderCatalog?.records || [
      {id:'1050',name:'Civitronic'},{id:'1047',name:'Cantaloupe Inc'},{id:'1053',name:'Techsupport'},{id:'1049',name:'Systema Procesa Pago Corp'},{id:'1048',name:'chongqing'}
    ];
    const ids = ['1050','1047','1053','1049','1048'];
    const providers = ids.map((id,index) => ({id,name:catalogue.find(item=>item.id===id)?.name || id,currency:index===1?'CAD':index===2?'EUR':'USD',commencement:'2026-04',rates:[{effective:'2026-04',activation:(50-index*5)*100,monthly:(10+index*2)*100}],revision:1}));
    // The hierarchy-backed provider identities are also supported for impersonated sessions.
    providers.push({id:'sp-wizardpos',name:'wizarpos',currency:'USD',commencement:'2026-07',rates:[{effective:'2026-07',activation:5000,monthly:1000}],revision:1});
    providers.push({id:'provider-northstar',name:'Northstar Payments',currency:'USD',commencement:'2026-07',rates:[{effective:'2026-07',activation:4500,monthly:1200}],revision:1});
    const periods = [];
    const names = ['Lobby Coffee','East Entrance','Office Pantry','Reception Counter','Garden Kiosk','Station Snacks','Cafeteria Drinks','Airport Lounge'];
    const locations = [['Harbor Retail','Harbor Point','Apex Resellers'],['Maple Markets','Central Station','Maple East'],['Northside Foods','Office Park','Direct']];
    providers.forEach((provider,pIndex)=> {
      const count = provider.id==='1049'?0:pIndex===0?18:12;
      for(let i=0;i<count;i++) {
        const location=locations[i%3], start=['2026-03-12','2026-06-18','2026-07-02','2026-07-31','2026-08-16','2026-09-04'][i%6];
        periods.push({id:`svc-${provider.id}-${i}`,providerId:provider.id,sn:`WP${String(2600000000+pIndex*100+i)}`,terminal:names[i%names.length],merchant:location[0],store:location[1],agent:location[2],start:start+'T09:20:00Z',end:i===7?'2026-08-20T14:15:00Z':null,activation:true,reason:i===8?'Merchant transfer · new service activation':'First parameter push accepted'});
      }
      if(count) {
        const prior=periods.find(p=>p.id===`svc-${provider.id}-7`);
        periods.push({...prior,id:`svc-${provider.id}-rebind`,start:'2026-09-09T10:30:00Z',end:null,activation:false,reason:'Same merchant re-enabled · activation fee not charged'});
      }
    });
    const events = providers.flatMap(provider=>feeEvents(periods,provider,'2026-10'));
    const bills = providers.map(provider=>createBill(provider,events,'2026-Q3'));
    for(const bill of bills) {
      if(['1047','1053','1049','sp-wizardpos','provider-northstar'].includes(bill.providerId)) {
        bill.status=total(bill)?'Unpaid':'No payment required'; bill.publishedAt='2026-10-02T09:00:00Z';bill.expiry=bill.providerId==='1053'?'2026-10-15':'2026-11-15';
        bill.audit.push({at:bill.publishedAt,actor:'Operations',action:'Published',reason:'Quarterly review completed',before:total(bill),after:total(bill)});
      }
    }
    // A published invoice and a paid prior quarter keep both Portal states discoverable.
    const civ=providers[0], prior=createBill(civ,events,'2026-Q2');
    prior.status='Paid';prior.publishedAt='2026-07-02T09:00:00Z';prior.expiry='2026-08-01';prior.payments=[{id:'PAY-PB-2026Q2-1050',at:'2026-07-09T11:42:00Z',amount:total(prior),currency:prior.currency,status:'Succeeded',last4:'4242',brand:'Visa',revision:1}];bills.push(prior);
    const own=createBill(civ,events,'2026-Q1');own.status='No payment required';own.publishedAt='2026-04-03T09:00:00Z';own.lines=own.original=[];bills.push(own);
    return {schema:1,providers,periods,events,bills};
  }
  function load() { const value=root.localStorage?.getItem(KEY); if(value){const state=JSON.parse(value);ensure(state.schema===1,'Billing data could not be read. Contact operations before retrying.');return state;} const state=seed();root.localStorage?.setItem(KEY,JSON.stringify(state));return state; }
  function persist(state) { root.localStorage.setItem(KEY,JSON.stringify(state));root.dispatchEvent(new Event('provider-billing-change')); }
  function requireOperations() {ensure(root.PaywizardAccessContext?.profile()==='maintain','Only operations can change this bill.');}
  function find(state,id) { const bill=state.bills.find(item=>item.id===id);ensure(bill,'This bill is not available. Return to Billing and refresh.');return bill; }
  function editable(bill,revision) { ensure(bill.status!=='Paid','This bill has been paid and can no longer be changed.');ensure(!bill.lock,'A payment is processing. Wait for the result before making changes.');ensure(bill.revision===revision,'This bill has changed. Reload it before saving your changes.'); }
  function amend(id,revision,lines,note,reason,publish,expiry) {
    requireOperations();const state=load(),bill=find(state,id);editable(bill,revision);validateLines(lines);
    const changed=JSON.stringify(lines)!==JSON.stringify(bill.lines)||note!==bill.note;
    ensure(!changed || String(reason).trim(),'Enter an internal reason for these changes.');
    if(publish)ensure(/^\d{4}-\d{2}-\d{2}$/.test(expiry) && expiry>=today(),'Choose a payment link expiry date today or later.');
    const before=total(bill);bill.lines=clone(lines);bill.note=note.trim();bill.revision++;
    if(publish || bill.publishedAt){bill.status=total(bill)?'Unpaid':'No payment required'; if(!bill.publishedAt)bill.publishedAt=stamp(); if(publish)bill.expiry=expiry;else if(total(bill)&&!bill.expiry)bill.expiry=new Date(Date.now()+30*864e5).toISOString().slice(0,10);}
    bill.audit.unshift({at:stamp(),actor:'Operations',action:publish?'Published':bill.publishedAt?'Bill updated':'Draft saved',reason:reason.trim()||'Quarterly review completed',before,after:total(bill),lines:clone(lines)});persist(state);return clone(bill);
  }
  function renew(id,revision,expiry) {requireOperations();const state=load(),bill=find(state,id);editable(bill,revision);ensure(bill.publishedAt&&total(bill)>0,'Publish a payable bill before setting its payment link.');ensure(expiry>=today(),'Choose a date today or later.');bill.audit.unshift({at:stamp(),actor:'Operations',action:'Link expiry updated',reason:`${bill.expiry} → ${expiry}`,before:total(bill),after:total(bill)});bill.expiry=expiry;bill.revision++;persist(state);return clone(bill);}
  function saveRate(id,revision,changes) {
    requireOperations();const state=load(),provider=state.providers.find(item=>item.id===id);ensure(provider&&provider.revision===revision,'Fee settings have changed. Reload before saving.');
    ensure(/^\d{4}-(0[1-9]|1[0-2])$/.test(changes.effective)&&changes.effective>=nextMonth(today())&&changes.effective>=provider.commencement,'New fees must start in a future month, on or after billing starts.');
    ensure(Number.isSafeInteger(changes.activation)&&changes.activation>=0&&Number.isSafeInteger(changes.monthly)&&changes.monthly>=0,'Enter valid non-negative fees.');
    provider.rates=provider.rates.filter(rate=>rate.effective!==changes.effective).concat({effective:changes.effective,activation:changes.activation,monthly:changes.monthly});provider.revision++;persist(state);
  }
  function setup(input) {
    requireOperations();const state=load(),record=root.PaywizardServiceProviderCatalog?.records.find(p=>p.id===input.id);
    ensure(record&&!state.providers.some(p=>p.id===input.id),'Select a service provider without an existing fee schedule.');
    ensure(['USD','CAD','EUR'].includes(input.currency),'Select a billing currency.');
    ensure(/^\d{4}-(0[1-9]|1[0-2])$/.test(input.commencement),'Choose a valid billing commencement month.');
    ensure(Number.isSafeInteger(input.activation)&&input.activation>=0&&Number.isSafeInteger(input.monthly)&&input.monthly>=0,'Enter valid non-negative fees.');
    state.providers.push({id:input.id,name:record.name,currency:input.currency,commencement:input.commencement,rates:[{effective:input.commencement,activation:input.activation,monthly:input.monthly}],revision:1});persist(state);
  }
  function generate(providerId,quarter) {requireOperations();const state=load();const provider=state.providers.find(item=>item.id===providerId);ensure(provider,'Select a service provider.');ensure(/^\d{4}-Q[1-4]$/.test(quarter)&&quarter<quarterOf(today()),'Select a completed quarter.');ensure(!state.bills.some(b=>b.providerId===providerId&&b.quarter===quarter),'A bill already exists for this provider and quarter. Open that bill to review it.');ensure(quarter>=quarterOf(provider.commencement),'This quarter is before the billing commencement month.');const bill=createBill(provider,state.events,quarter);state.bills.unshift(bill);persist(state);return bill;}
  function portalProvider() {const session=root.PaywizardAccessContext?.session();if(session)return session.entity.type==='provider'||session.entity.kind==='super_iso'?session.entity.id:null;return ({wizarpos:'1050','full-service':'1047',attended:'1053',unattended:'1049'})[root.PaywizardAccessContext?.profile()]||null;}
  function publicView(bill) { return clone({id:bill.id,providerId:bill.providerId,providerName:bill.providerName,quarter:bill.quarter,currency:bill.currency,lines:bill.lines.map(({eventIds,...line})=>line),status:bill.status,revision:bill.revision,expiry:bill.expiry,note:bill.note,token:bill.token,publishedAt:bill.publishedAt,amount:total(bill)/100,recurring:false,cycle:1,paidInstallments:bill.status==='Paid'?1:0,payments:bill.payments,processing:!!bill.lock}); }
  function publicBill(token) { const state=load(),bill=state.bills.find(item=>item.token===token&&item.publishedAt);ensure(bill,'This payment link is not available. Contact the sender.');return publicView(bill); }
  function beginPayment(token,revision,requestId) {const state=load(),bill=state.bills.find(item=>item.token===token&&item.publishedAt);ensure(bill,'This bill is not available.');editable(bill,revision);ensure(bill.status==='Unpaid'&&total(bill)>0,'This bill does not require payment.');ensure(bill.expiry>=today(),'This payment link has expired. Ask operations to extend it.');bill.lock={requestId,revision,at:stamp(),amount:total(bill)};persist(state);return clone(bill.lock);}
  function finishPayment(token,requestId,details) {const state=load(),bill=state.bills.find(item=>item.token===token);ensure(bill?.lock?.requestId===requestId,'Payment status is being confirmed. Refresh before trying again.');ensure(bill.revision===bill.lock.revision,'Payment status could not be confirmed. Contact operations.');bill.payments.push({id:'PAY-'+requestId,amount:bill.lock.amount,currency:bill.currency,at:stamp(),status:'Succeeded',brand:details.brand,last4:details.last4,revision:bill.revision});bill.status='Paid';bill.lock=null;bill.revision++;persist(state);return publicView(bill);}
  const api={KEY,load,total,cents,today,nextMonth,monthName,quarterMonths,quarterOf,rateAt,feeEvents,calculate,seed,createBill,validateLines,amend,renew,saveRate,setup,generate,portalProvider,publicView,publicBill,beginPayment,finishPayment};
  root.PaywizardProviderBilling=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
