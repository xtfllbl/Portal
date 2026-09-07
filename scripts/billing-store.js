(function () {
  'use strict';
  const key = 'paywizard-billing-setup-v1';
  const contextKey = 'paywizard-billing-merchant-v1';
  let cached = null;
  function isMerchantRecord(record) { return (record.assignment ?? 'merchant') === 'merchant' && !!record.merchantId; }
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
  function pending(r) { return ['Active', 'Pending', 'Overdue'].includes(r.status) && !r.currentInstallmentPaid && count(r) < (r.recurring ? Number(r.cycle) : 1); }
  function expired(r) { const now = new Date(); const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0'); return !!r.expiry && r.expiry < today; }

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
  function writeLocal(records) { localStorage.setItem(localKey, JSON.stringify(records)); }
  function localView(record) { return {...domain.publicView(record), linkToken:record.linkToken, deliveries:record.deliveries, localDemo:true}; }
  function localRead() {
    const records = fullLocal() || [];
    let changed = false;
    records.forEach(r => {
      if (r.authorization && r.status !== 'Paid' && !r.installments.some(i => i.status === 'Failed') && r.installments.some(i => i.status !== 'Paid' && i.due <= domain.day())) { domain.collect(r); changed = true; }
    });
    if (changed) writeLocal(records);
    return records.map(localView).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  function read() { return mode === 'local' ? localRead() : readSharedCache(); }
  async function localChange(fn) {
    const change = () => { const records = fullLocal() || []; const result = fn(records); writeLocal(records); return result; };
    return navigator.locks ? navigator.locks.request(localKey, change) : change();
  }
  async function sync() {
    if (mode === 'local') return localRead();
    const data = await api('records'); publicOrigin = data.publicOrigin || endpoint || location.origin; write(data.records); return data.records;
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
  async function send(id, email) {
    if (mode !== 'local') { const result = await api('records/' + encodeURIComponent(id) + '/send', {email}); await sync(); return result; }
    return localChange(records => {
      const bill = records.find(r => r.id === id);
      if (!bill || !bill.linkToken || expired(bill) || bill.status === 'Paid' || bill.authorization) throw new Error('This bill no longer needs a payment link.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid recipient email.');
      bill.deliveries.push({email, at:new Date().toISOString(), status:'Simulated'}); return localView(bill);
    });
  }
  function localSnapshot(record) {
    const fields = ['id','assignment','merchantId','merchantName','invoice','billType','currency','amount','recurring','cycle','start','expiry','includedData','notes','createdAt','status','paidInstallments'];
    return Object.fromEntries(fields.filter(k => record[k] !== undefined).map(k => [k,record[k]]));
  }
  function link(record) {
    if (!record.linkToken) throw new Error('This bill has no payment link.');
    if (mode === 'local') {
      const bytes = new TextEncoder().encode(JSON.stringify(localSnapshot(record)));
      const encoded = btoa(Array.from(bytes,b => String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
      return new URL('43.billing_payment_link.html#local.' + encoded, location.href).href;
    }
    return publicOrigin + '/43.billing_payment_link.html#' + record.linkToken;
  }
  async function publicBill(token, details) {
    if (!token.startsWith('local.')) {
      if (!/^[a-f0-9]{48}$/.test(token)) throw new Error('This payment link is invalid. Please contact the sender.');
      // Shared links always use their own host, never fall back to local data.
      const previous = endpoint; endpoint = '';
      try { return await api('public/' + token + (details ? '/pay' : ''), details); } finally { endpoint = previous; }
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
      if (details) domain.checkout(bill, details);
      else if (bill.authorization && bill.status !== 'Paid') domain.collect(bill);
      return localView(bill);
    });
  }
  function selectMerchant(id) { try { localStorage.setItem(contextKey, id); } catch (_) {} }
  function selectedMerchant() { try { return localStorage.getItem(contextKey) || ''; } catch (_) { return ''; } }
  window.addEventListener?.('storage', event => { if (event.key === localKey) window.dispatchEvent(new CustomEvent('billing-local-change')); });
  window.PaywizardBillingStore = {key, read, write, isMerchantRecord, total, endDate, count, pending, expired, pay, selectMerchant, selectedMerchant, initialize, sync, save, send, link, publicBill, configure, settings, get mode(){return mode;}};
})();
