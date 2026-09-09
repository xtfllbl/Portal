(function () {
  'use strict';
  const key = 'paywizard-billing-setup-v1';
  const contextKey = 'paywizard-billing-merchant-v1';
  let cached = null;
  function isMerchantRecord(record) { return (record.assignment ?? 'merchant') === 'merchant' && !!record.merchantId; }
  const demoNames = ['Maple Street Coffee', 'Harbour Market', 'Northstar Vending', 'Cedar Grove Bakery', 'Bluebird Books', 'Willow & Oak Bistro', 'Summit Fitness', 'Seaside Pharmacy'];
  function merchantName(m) {
    const candidates = [m.dba, m.merchantName, m.name, m.businessName, m.legalName];
    const name = candidates.find(value => typeof value === 'string' && value.trim() && !/^\d+$/.test(value.trim()));
    if (name) return name.trim();
    const id = String(m.merchantId || m.id || '');
    const index = [...id].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0) % demoNames.length;
    return demoNames[index];
  }
  function merchantList() {
    const saved = window.PaywizardPlatformMerchantStore?.readAll() || [];
    return saved.length ? saved.map(m => ({id:String(m.merchantId), name:merchantName(m)})) : demoNames.map((name, i) => ({id:'billing-merchant-' + (i + 1), name}));
  }
  function readSharedCache() {
    if (cached) return cached;
    let saved;
    try { saved = localStorage.getItem(key); } catch (_) { return []; }
    if (saved !== null) {
      const records = JSON.parse(saved);
      if (!Array.isArray(records) || records.some(r => !r || typeof r !== 'object' || !r.id || (r.assignment === 'standalone' ? r.merchantId != null && r.merchantId !== '' : !isMerchantRecord(r)))) throw new Error('Invalid billing data');
      cached = records; return records;
    }
    const existing = window.PaywizardPlatformMerchantStore?.readAll() || [];
    const merchants = [{ id: '1000000006', name: 'Tom shop' }];
    const records = seeds(existing, merchants);
    write(records);
    return records;
  }
  function seeds(existing, merchants) {
    if (existing.length) return [];
    return Array.from({ length: 23 }, (_, i) => ({ id: 'demo-' + i, merchantId: merchants[0].id, merchantName: merchants[0].name, billType: 'General Billing', currency: 'USD', recurring: i !== 4, cycle: i === 0 ? 24 : i < 4 ? 36 : 3, amount: i === 0 ? 12 : 0.01, start: i === 0 ? '2026-09-08' : '2025-11-24', expiry: '2026-10-10', notes: '', invoice: String(1081914682857619456n - BigInt(i)), status: i === 0 ? 'Active' : i % 4 === 0 ? 'Paid' : 'Overdue' }));
  }
  function write(records) { cached = records; try { localStorage.setItem(key, JSON.stringify(records)); } catch (_) { /* Shared service remains authoritative if the browser cache is unavailable. */ } }
  window.addEventListener?.('storage', event => { if (event.key === key) cached = null; });
  function total(r) { return Math.round(Number(r.amount || 0) * 100) * (r.recurring ? Number(r.cycle) : 1) / 100; }
  function endDate(r) {
    if (!r.recurring || !r.start) return '';
    const [year, month, day] = r.start.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + Number(r.cycle), 1));
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
    return date.toISOString().slice(0, 10);
  }
  function count(r) { return Number(r.paidInstallments ?? (r.status === 'Paid' ? (r.recurring ? r.cycle : 1) : 0)); }
  function pending(r) { return r.canRetry || ['Active', 'Pending', 'Overdue'].includes(r.status) && !r.authorization && !r.currentInstallmentPaid && count(r) < (r.recurring ? Number(r.cycle) : 1); }
  function expired(r) { return !!r.expiry && r.expiry < window.PaywizardBillingDomain.day(); }

  const domain = window.PaywizardBillingDomain;
  const localKey = 'paywizard-billing-local-v1', settingsKey = 'paywizard-billing-runtime-v1';
  let mode = 'detecting', publicOrigin = location.origin, endpoint = '', remoteKnown = false;
  function settings() { try { return JSON.parse(localStorage.getItem(settingsKey) || '{}'); } catch (_) { return {}; } }
  function configure(value) {
    const origin = value.origin ? new URL(value.origin).origin : '';
    if (origin && !origin.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin)) throw new Error('Use an HTTPS shared site URL.');
    localStorage.setItem(settingsKey, JSON.stringify({mode:value.mode, origin}));
    mode = 'detecting'; cached = null; remoteKnown = false;
  }
  function accessToken() { try { return sessionStorage.getItem('pw-billing-access:' + endpoint) || ''; } catch (_) { return ''; } }
  async function api(path, value) {
    const token = accessToken();
    const response = await fetch(endpoint + '/api/billing/' + path, {
      method:value === undefined ? 'GET' : 'POST',
      headers:{...(value === undefined ? {} : {'Content-Type':'application/json'}), ...(token ? {Authorization:'Bearer ' + token} : {})},
      body:value === undefined ? undefined : JSON.stringify(value), signal:AbortSignal.timeout(10000)
    });
    let data;
    try { data = JSON.parse(await response.text()); } catch (_) {
      const error = new Error('Shared demo is unavailable. Please try again.');
      error.missing = response.status === 404; throw error;
    }
    if (!response.ok) { const error = new Error(data.error || 'Shared demo is unavailable. Please try again.'); error.status = response.status; error.missing = response.status === 404; throw error; }
    return data;
  }
  function fullLocal() {
    const raw = localStorage.getItem(localKey);
    if (raw === null) return null;
    const records = JSON.parse(raw);
    if (!Array.isArray(records) || records.some(r => !r?.id || !Array.isArray(r.installments))) throw new Error('Local billing data could not be read. Existing data has been kept.');
    return records;
  }
  function writeLocal(records) { records.forEach(r => { if (r.linkToken && !r.linkSnapshot) r.linkSnapshot = localSnapshot(localView(r)); }); localStorage.setItem(localKey, JSON.stringify(records)); }
  function localView(record) { return {...domain.publicView(record), linkToken:record.linkToken, deliveries:record.deliveries, audit:record.audit || [], collectionStop:record.collectionStop, localDemo:true}; }
  function localRead() {
    const records = fullLocal() || [];
    let changed = false;
    records.forEach(r => {
      if (!domain.stopped(r) && r.authorization && r.status !== 'Paid' && !r.installments.some(i => i.status === 'Failed') && r.installments.some(i => i.status !== 'Paid' && i.due <= domain.day())) { domain.collect(r); changed = true; }
    });
    if (changed) writeLocal(records);
    return records.map(localView).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  function read() { return mode === 'local' ? localRead() : readSharedCache(); }
  async function localChange(fn) {
    const change = () => { const records = fullLocal() || []; records.forEach(r => { if (r.linkToken && !r.linkSnapshot) r.linkSnapshot = localSnapshot(localView(r)); }); const result = fn(records); writeLocal(records); return result; };
    return navigator.locks ? navigator.locks.request(localKey, change) : change();
  }
  async function sync() {
    if (mode === 'local') return localRead();
    const data = await api('records'); publicOrigin = data.publicOrigin || endpoint || location.origin; write(data.records); return data.records;
  }
  async function enrichLocalDemo() {
    await localChange(records => {
      const merchants = merchantList();
      records.forEach(record => {
        if (isMerchantRecord(record) && (!record.merchantName || /^\d+$/.test(record.merchantName))) {
          record.merchantName = merchants.find(m => m.id === record.merchantId)?.name || merchantName(record);
        }
      });
      // Stable IDs make this an additive migration; existing bills and payment outcomes win.
      const now = new Date();
      const date = offset => domain.day(new Date(now.getTime() + offset * 86400000));
      for (let i = 0; i < 32; i++) {
        const id = 'billing-scenarios-v1-' + String(i + 1).padStart(2, '0');
        if (records.some(record => record.id === id)) continue;
        const scenario = i % 8, recurring = scenario >= 3 && scenario <= 6;
        const merchant = merchants[Math.floor(i / 2) % merchants.length];
        const standalone = Math.floor(i / 8) % 2 === 1;
        const label = ['Draft awaiting review', 'One-time awaiting payment', 'One-time paid', 'Monthly awaiting first payment', 'Monthly authorized', 'Monthly collection failed', 'Monthly completed', 'Payment link expired'][scenario];
        const bill = domain.makeBill({id, assignment:standalone ? 'standalone' : 'merchant', merchantId:standalone ? null : merchant.id, merchantName:standalone ? '' : merchant.name,
          invoice:'DEMO-' + String(i + 1).padStart(4,'0'), billType:i < 16 ? 'General Billing' : 'eSIM Billing', currency:['USD','CAD','EUR'][i % 3],
          amount:[89,149.95,320,24,39.9,59,18.5,225][scenario], recurring, cycle:recurring ? [3,6,12,24,36][i % 5] : 1,
          start:recurring ? date(scenario === 5 ? -40 : scenario === 6 ? -1200 : 0) : '', expiry:date(scenario === 7 ? -7 : 60),
          includedData:i >= 16 ? [500,1024,2048,5120][i % 4] : null, notes:'Demo · ' + label,
          status:scenario === 0 ? 'Draft' : 'Pending', createdAt:new Date(now.getTime() - i * 60000).toISOString()}, now);
        if ([2,4,5,6].includes(scenario)) {
          domain.checkout(bill, {requestId:'demo-payment-request-' + id, email:'payer@example.com', acceptedTerms:true, recurringConsent:true, brand:'Visa', last4:'4242'}, now, scenario === 5 ? {failAt:2} : {});
        }
        records.push(bill);
      }
    });
  }
  async function initialize(accessKey) {
    const config = settings(); endpoint = config.origin || '';
    if (mode !== 'shared' && config.mode !== 'local') {
      try {
        const info = await api('config');
        if (info.mode !== 'shared') throw new Error('Invalid shared demo response.');
        if (info.configured === false) {
          if (config.mode === 'shared' || localStorage.getItem('pw-billing-shared:' + endpoint) === '1') throw new Error('Shared demo setup is incomplete. Open Demo settings to connect a configured site.');
          mode = 'local';
        } else {
          remoteKnown = true; mode = 'shared';
          try { localStorage.setItem('pw-billing-shared:' + endpoint, '1'); } catch (_) {}
        }
      } catch (error) {
        const known = remoteKnown || localStorage.getItem('pw-billing-shared:' + endpoint) === '1';
        if (config.mode === 'shared' || known || !error.missing) throw error;
        mode = 'local';
      }
    }
    if (config.mode === 'local') mode = 'local';
    if (mode === 'local') {
      if (fullLocal() === null) writeLocal(readSharedCache().map(r => domain.makeBill(r, new Date(), true)));
      await enrichLocalDemo();
      window.dispatchEvent(new Event('billing-mode')); return localRead();
    }
    mode = 'shared';
    const session = await api('session', accessKey ? {accessKey} : {});
    if (session.token) sessionStorage.setItem('pw-billing-access:' + endpoint, session.token);
    // Import only the legacy shared cache; local demo records stay isolated.
    const data = await api('import', {records:readSharedCache()});
    publicOrigin = data.publicOrigin || endpoint || location.origin; write(data.records);
    window.dispatchEvent(new Event('billing-mode')); return data.records;
  }
  async function save(record) {
    if (mode !== 'local') { const result = await api('records', record); await sync(); return result; }
    return localChange(records => {
      const index = records.findIndex(r => r.id === record.id);
      if (index >= 0 && records[index].status !== 'Draft') throw new Error('Only draft bills can be edited.');
      const bill = domain.makeBill(record);
      if (index >= 0) records[index] = bill; else records.unshift(bill);
      return localView(bill);
    });
  }
  async function pay(id, merchantId, details) {
    if (mode !== 'local') { const result = await api('records/' + encodeURIComponent(id) + '/pay', {...details, merchantId}); await sync(); return result; }
    return localChange(records => {
      const bill = records.find(r => r.id === id);
      if (!bill || !isMerchantRecord(bill) || bill.merchantId !== merchantId) throw new Error('Merchant does not match this bill.');
      domain.checkout(bill, {...details, source:'portal'}); return localView(bill);
    });
  }
  async function changeBill(id, action, input) {
    if (mode !== 'local') { const result = await api('records/' + encodeURIComponent(id) + '/' + action, input); await sync(); return result; }
    return localChange(records => {
      const bill = records.find(r => r.id === id);
      if (!bill) throw new Error('Bill unavailable.');
      if (action === 'retry') {
        if (!isMerchantRecord(bill) || bill.merchantId !== input.merchantId) throw new Error('Merchant does not match this bill.');
        domain.retryPayment(bill, {...input, source:'portal'});
      } else ({send:domain.sendLink, stop:domain.stopCollection, renew:domain.renewLink})[action](bill, input);
      return localView(bill);
    });
  }
  const send = (id, email) => changeBill(id, 'send', {email});
  const stop = (id, reason) => changeBill(id, 'stop', {reason});
  const renew = (id, input) => changeBill(id, 'renew', input);
  const retry = (id, merchantId, input) => changeBill(id, 'retry', {...input, merchantId});
  function localSnapshot(record) {
    const fields = ['id','assignment','merchantId','merchantName','invoice','billType','currency','amount','recurring','cycle','start','expiry','includedData','notes','createdAt','status','paidInstallments'];
    return Object.fromEntries(fields.filter(k => record[k] !== undefined).map(k => [k,record[k]]));
  }
  function link(record) {
    if (!record.linkToken) throw new Error('This bill has no payment link.');
    if (mode === 'local') {
      const records = fullLocal() || [];
      const saved = records.find(r => r.id === record.id);
      if (saved && !saved.linkSnapshot) writeLocal(records);
      const bytes = new TextEncoder().encode(JSON.stringify(saved?.linkSnapshot || localSnapshot(record)));
      const encoded = btoa(Array.from(bytes,b => String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      return new URL('43.billing_payment_link.html#local.' + encoded, location.href).href;
    }
    return publicOrigin + '/43.billing_payment_link.html#' + record.linkToken;
  }
  async function publicBill(token, details, action = 'pay') {
    if (!token.startsWith('local.')) {
      if (!/^[a-f0-9]{48}$/.test(token)) throw new Error('This payment link is invalid. Please contact the sender.');
      // Shared links always use their own host, never fall back to local data.
      const previous = endpoint; endpoint = '';
      try { return await api('public/' + token + (details ? '/' + (action === 'retry' ? 'retry' : 'pay') : ''), details); } finally { endpoint = previous; }
    }
    if (token.length > 16000) throw new Error('This local demo link is too large.');
    mode = 'local';
    const encoded = token.slice(6).replace(/-/g,'+').replace(/_/g,'/');
    let snapshot;
    try { snapshot = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0)))); } catch (_) { throw new Error('This local demo link is invalid.'); }
    const candidate = domain.makeBill(snapshot, new Date(), true);
    if (candidate.status === 'Draft') throw new Error('This bill is not available for payment.');
    return localChange(records => {
      let bill = records.find(r => r.id === candidate.id);
      if (!bill) { bill = candidate; records.push(bill); }
      if (details) (action === 'retry' ? domain.retryPayment : domain.checkout)(bill, details);
      else if (!domain.stopped(bill) && bill.authorization && bill.status !== 'Paid') domain.collect(bill);
      return localView(bill);
    });
  }
  function selectMerchant(id) { try { localStorage.setItem(contextKey, id); } catch (_) {} }
  function selectedMerchant() { try { return localStorage.getItem(contextKey) || ''; } catch (_) { return ''; } }
  window.addEventListener?.('storage', event => { if (event.key === localKey) window.dispatchEvent(new CustomEvent('billing-local-change')); });
  window.PaywizardBillingStore = {key, read, write, merchantName, merchantList, isMerchantRecord, total, endDate, count, pending, expired, pay, selectMerchant, selectedMerchant, initialize, sync, save, send, stop, renew, retry, link, publicBill, configure, settings, get mode(){return mode;}};
})();
