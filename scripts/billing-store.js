(function () {
  'use strict';
  const key = 'paywizard-billing-setup-v1';
  const contextKey = 'paywizard-billing-merchant-v1';
  let cached = null;
  function read() {
    if (cached) return cached;
    let saved;
    try { saved = localStorage.getItem(key); } catch (_) { return []; }
    if (saved !== null) {
      const records = JSON.parse(saved);
      if (!Array.isArray(records) || records.some(r => !r || typeof r !== 'object' || !r.id || !r.merchantId)) throw new Error('Invalid billing data');
      cached = records; return records;
    }
    const existing = window.PaywizardPlatformMerchantStore.readAll();
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
  let publicOrigin = location.origin;
  async function api(path, value) {
    const response = await fetch('/api/billing/' + path, { method: value === undefined ? 'GET' : 'POST', headers: value === undefined ? {} : { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value), signal: AbortSignal.timeout(10000) });
    const text = await response.text(); let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error('Shared billing service unavailable. Start the billing-enabled development server.'); }
    if (!response.ok) throw new Error(data.error || 'Billing request failed.');
    return data;
  }
  async function sync() { const data = await api('records'); publicOrigin = data.publicOrigin; write(data.records); return data.records; }
  async function initialize() {
    const legacy = read();
    await api('session', {});
    const data = await api('import', { records: legacy }); publicOrigin = data.publicOrigin; write(data.records); return data.records;
  }
  async function save(record) { const result = await api('records', record); await sync(); return result; }
  async function pay(id, merchantId, details) { const result = await api('records/' + encodeURIComponent(id) + '/pay', { ...details, merchantId }); await sync(); return result; }
  async function send(id, email) { const result = await api('records/' + encodeURIComponent(id) + '/send', { email }); await sync(); return result; }
  function link(record) { if (!record.linkToken) throw new Error('This bill has no payment link.'); return publicOrigin + '/43.billing_payment_link.html#' + record.linkToken; }
  function selectMerchant(id) { try { localStorage.setItem(contextKey, id); } catch (_) {} }
  function selectedMerchant() { try { return localStorage.getItem(contextKey) || ''; } catch (_) { return ''; } }
  window.PaywizardBillingStore = { key, read, write, total, endDate, count, pending, expired, pay, selectMerchant, selectedMerchant, initialize, sync, save, send, link };
})();
