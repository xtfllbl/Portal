(function () {
  'use strict';
  const key = 'paywizard-billing-setup-v1';
  const contextKey = 'paywizard-billing-merchant-v1';
  function read() {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const records = JSON.parse(saved);
      if (!Array.isArray(records) || records.some(r => !r || typeof r !== 'object' || !r.id || !r.merchantId)) throw new Error('Invalid billing data');
      return records;
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
  function write(records) { localStorage.setItem(key, JSON.stringify(records)); }
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
  // Always read the latest shared record. Store payment metadata only, never form/card data.
  function pay(id, merchantId) {
    const records = read(), record = records.find(r => r.id === id && String(r.merchantId) === String(merchantId));
    if (!record || !pending(record)) throw new Error('This installment is no longer awaiting payment. Refresh to view the latest bill.');
    if (expired(record)) throw new Error('This payment link has expired.');
    const paidInstallments = count(record) + 1;
    const next = { ...record, paidInstallments, currentInstallmentPaid: true, paidAt: new Date().toISOString(), status: paidInstallments >= (record.recurring ? Number(record.cycle) : 1) ? 'Paid' : 'Active' };
    write(records.map(r => r.id === id ? next : r));
    return next;
  }
  function selectMerchant(id) { try { localStorage.setItem(contextKey, id); } catch (_) {} }
  function selectedMerchant() { try { return localStorage.getItem(contextKey) || ''; } catch (_) { return ''; } }
  window.PaywizardBillingStore = { key, read, write, total, endDate, count, pending, expired, pay, selectMerchant, selectedMerchant };
})();
