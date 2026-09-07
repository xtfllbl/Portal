(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'paywizard-billing-setup-v1';
  const existing = window.PaywizardPlatformMerchantStore.readAll();
  const merchants = existing.length ? existing.map(m => ({ id: String(m.merchantId), name: m.merchantName || m.name || String(m.merchantId) })) : [{ id: '1000000006', name: 'Tom shop' }];
  let records = [], editing = null, page = 1, filters = { merchant: merchants[0].id, status: '' }, storageError = false;
  function message(text) { $('billingMessage').textContent = text; clearTimeout(message.timer); message.timer = setTimeout(() => { $('billingMessage').textContent = ''; }, 5000); }
  function options(el, all) {
    if (all) el.add(new Option('All Merchants', ''));
    merchants.forEach(m => el.add(new Option(m.name, m.id)));
  }
  options($('merchant')); options($('filterMerchant'), true);
  function seeds() {
    if (existing.length) return [];
    return Array.from({ length: 23 }, (_, i) => ({ id: 'demo-' + i, merchantId: merchants[0].id, merchantName: merchants[0].name, billType: 'General Billing', currency: 'USD', recurring: i !== 4, cycle: i === 0 ? 24 : i < 4 ? 36 : 3, amount: i === 0 ? 12 : 0.01, start: i === 0 ? '2026-09-08' : '2025-11-24', expiry: '2026-10-10', notes: '', invoice: String(1081914682857619456n - BigInt(i)), status: i === 0 ? 'Active' : i % 4 === 0 ? 'Paid' : 'Overdue' }));
  }
  try {
    const saved = localStorage.getItem(key);
    records = saved === null ? seeds() : JSON.parse(saved);
    if (!Array.isArray(records)) throw new Error('Invalid billing data');
    if (saved === null) localStorage.setItem(key, JSON.stringify(records));
  } catch (_) { storageError = true; message('Billing data could not be loaded. Please check browser storage and reload.'); }
  // Preserve existing bills even if their merchant is no longer in the current merchant list.
  records.forEach(r => {
    if (!merchants.some(m => m.id === r.merchantId)) { merchants.push({ id: r.merchantId, name: r.merchantName }); $('merchant').add(new Option(r.merchantName, r.merchantId)); $('filterMerchant').add(new Option(r.merchantName, r.merchantId)); }
  });
  function money(value, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value); }
  function total(r) { return Math.round(Number(r.amount || 0) * 100) * (r.recurring ? Number(r.cycle) : 1) / 100; }
  function formValue() {
    return { merchantId: $('merchant').value, merchantName: merchants.find(m => m.id === $('merchant').value)?.name || '', billType: $('billType').value, currency: $('currency').value, recurring: $('recurring').checked, cycle: Number($('cycle').value), amount: $('amount').value === '' ? '' : Number($('amount').value), start: $('startDate').value, expiry: $('expiry').value, notes: $('notes').value };
  }
  function update() {
    const recurring = $('recurring').checked;
    document.querySelectorAll('[data-recurring]').forEach(el => { el.hidden = !recurring; });
    $('startDate').required = recurring;
    $('startDate').disabled = !recurring;
    $('cycle').disabled = !recurring;
    const value = total(formValue());
    $('total').textContent = money(Number.isFinite(value) ? value : 0, $('currency').value);
  }
  function reset() { $('billingForm').reset(); editing = null; update(); }
  function nextDate(r) {
    if (!r.recurring || !r.start) return '-';
    const [year, month, day] = r.start.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + Number(r.cycle), 1));
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
    return date.toISOString().slice(0, 10);
  }
  function cell(row, text) { const td = document.createElement('td'); td.textContent = text; row.append(td); return td; }
  function render() {
    const filtered = records.filter(r => (!filters.merchant || r.merchantId === filters.merchant) && (!filters.status || r.status === filters.status));
    const size = Number($('pageSize').value), pages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(Math.max(1, page), pages);
    $('billingRows').replaceChildren();
    filtered.slice((page - 1) * size, page * size).forEach(r => {
      const row = document.createElement('tr');
      [r.merchantId, r.merchantName, r.invoice || '-', r.recurring ? r.cycle + ' Months' : '-', money(Number(r.amount || 0), r.currency), money(total(r), r.currency), r.recurring ? r.start || '-' : '-', nextDate(r)].forEach(v => cell(row, v));
      const badge = document.createElement('span'); badge.className = 'billing-status ' + r.status.toLowerCase(); badge.textContent = r.status; cell(row, '').append(badge);
      const actions = cell(row, '');
      if (r.status === 'Draft') {
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', 'Edit draft for ' + r.merchantName);
        edit.onclick = () => {
          editing = r.id;
          [['merchant', r.merchantId], ['billType', r.billType], ['currency', r.currency], ['amount', r.amount], ['cycle', r.cycle], ['startDate', r.start], ['notes', r.notes], ['expiry', r.expiry]].forEach(([id, value]) => { $(id).value = value; });
          $('recurring').checked = r.recurring; update(); $('billingForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('merchant').focus(); message('Draft loaded for editing.');
        };
        actions.append(edit);
      }
      $('billingRows').append(row);
    });
    if (!filtered.length) { const row = document.createElement('tr'); const td = cell(row, 'No billing records found.'); td.colSpan = 10; td.className = 'empty'; $('billingRows').append(row); }
    $('pageButtons').replaceChildren();
    function pageButton(label, target, disabled, current) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.disabled = disabled; b.setAttribute('aria-label', /^\d+$/.test(label) ? 'Page ' + label : label); if (current) b.setAttribute('aria-current', 'page'); b.onclick = () => { page = target; render(); }; $('pageButtons').append(b); }
    pageButton('First', 1, page === 1); pageButton('Prev', page - 1, page === 1);
    for (let n = Math.max(1, Math.min(page - 1, pages - 2)); n <= Math.min(pages, Math.max(3, page + 1)); n++) pageButton(String(n), n, false, n === page);
    pageButton('Next', page + 1, page === pages); pageButton('Last', pages, page === pages);
    $('pageSummary').textContent = page + ' / ' + pages + ' (' + filtered.length + ')';
  }
  function save(draft) {
    if (storageError) return message('Browser storage is unavailable. Billing changes cannot be saved.');
    if (!draft && !$('billingForm').reportValidity()) return;
    if (draft && (!$('merchant').reportValidity() || !$('amount').validity.valid && $('amount').value !== '')) { $('amount').reportValidity(); return; }
    const value = formValue();
    const old = records.find(r => r.id === editing);
    const record = { ...value, id: old?.id || crypto.randomUUID(), invoice: draft ? '' : (BigInt(Date.now()) * 1000n + BigInt(records.length)).toString(), status: draft ? 'Draft' : value.recurring ? 'Active' : 'Pending' };
    const next = old ? records.map(r => r.id === old.id ? record : r) : [record, ...records];
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) { message('Could not save billing changes. Please check browser storage.'); return; }
    records = next;
    editing = draft ? record.id : null;
    filters = { merchant: record.merchantId, status: '' }; $('filterMerchant').value = record.merchantId; $('filterStatus').value = ''; page = 1;
    if (!draft) reset();
    render(); message(draft ? 'Draft saved.' : 'Billing applied to merchant account.');
  }
  $('billingForm').addEventListener('input', update);
  $('billingForm').addEventListener('change', update);
  $('billingForm').onsubmit = event => { event.preventDefault(); save(false); };
  $('saveDraft').onclick = () => save(true);
  $('resetForm').onclick = () => { reset(); message('Form reset. Saved billing records are unchanged.'); };
  $('filterMerchant').value = filters.merchant;
  $('filterForm').onsubmit = event => { event.preventDefault(); filters = { merchant: $('filterMerchant').value, status: $('filterStatus').value }; page = 1; render(); };
  $('resetFilters').onclick = () => { $('filterMerchant').value = ''; $('filterStatus').value = ''; filters = { merchant: '', status: '' }; page = 1; render(); };
  $('pageSize').onchange = () => { page = 1; render(); };
  update(); render();
})();
