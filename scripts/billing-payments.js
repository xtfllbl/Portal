(function () {
  'use strict';
  const $ = id => document.getElementById(id), store = window.PaywizardBillingStore;
  let serviceReady = false, requestId = null;
  let records = [], selected = new URLSearchParams(location.search).get('merchantId') || store.selectedMerchant(), paying = null, opener = null, busy = false;
  let filters = { status: '', cycle: '', from: '', to: '' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (amount, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  const date = value => value ? new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  function message(text) { $('paymentMessage').textContent = text; clearTimeout(message.timer); message.timer = setTimeout(() => { $('paymentMessage').textContent = ''; }, 5000); }
  function ownRecords() { return records.filter(r => String(r.merchantId) === selected && r.status !== 'Draft'); }
  function reload() {
    try {
      records = store.read(); $('loadError').hidden = true;
      const merchants = new Map(window.PaywizardPlatformMerchantStore.readAll().map(m => [String(m.merchantId), m.merchantName || m.name || String(m.merchantId)]));
      records.forEach(r => { if (!merchants.has(String(r.merchantId))) merchants.set(String(r.merchantId), r.merchantName || String(r.merchantId)); });
      $('paymentMerchant').replaceChildren(new Option('Select Merchant', ''));
      merchants.forEach((name, id) => $('paymentMerchant').add(new Option(name, id)));
      if (!merchants.has(selected)) selected = '';
      $('paymentMerchant').value = selected;
      render();
      return true;
    } catch (_) {
      $('loadError').textContent = 'Billing data could not be loaded. Check browser storage and refresh.'; $('loadError').hidden = false;
      records = []; render(); return false;
    }
  }
  function badge(status, label = status) { return '<span class="payment-badge ' + esc(status.toLowerCase()) + '">' + esc(label) + '</span>'; }
  function render() {
    const pending = ownRecords().filter(store.pending);
    $('pendingCards').innerHTML = pending.map(r => `<article class="pending-card" aria-label="Invoice ${esc(r.invoice)}">
      <div class="invoice-top"><div><p class="invoice-amount">${esc(money(Number(r.amount), r.currency))}</p>
      <p class="invoice-meta"><span>Invoice No.</span><strong>${esc(r.invoice)}</strong></p><p class="invoice-meta"><span>Payment Link Expire Date</span><strong>${esc(date(r.expiry))}</strong></p></div>
      <div class="invoice-actions">${badge(r.recurring ? 'Recurring' : 'One-time')}${badge(store.expired(r) ? 'Expired' : 'Pending', store.expired(r) ? 'Link Expired' : 'Pending Payment')}
      <button type="button" class="primary" data-pay="${esc(r.id)}" ${store.expired(r) ? 'disabled' : ''}><span class="material-symbols-rounded" aria-hidden="true">credit_card</span>Pay Now</button></div></div>
      <dl class="invoice-details"><div class="notes"><dt>Billing Notes</dt><dd>${esc(r.notes || '—')}</dd></div><div class="billing-amount"><dt>Billing Amount</dt><dd>${esc(money(Number(r.amount), r.currency))}</dd></div><div class="billing-cycle"><dt>Billing Cycle</dt><dd>${r.recurring ? esc(r.cycle) + ' Months' : 'One-time'}</dd></div><div class="renewal"><dt>Recurring</dt><dd>${r.recurring ? 'On (Fixed-term)' : 'Off'}</dd></div></dl></article>`).join('');
    if (!pending.length) $('pendingCards').innerHTML = '<div class="payment-empty">' + (selected ? 'No pending payments.' : 'Select a merchant to view billing and payments.') + '</div>';
    renderHistory();
  }
  function historyRecords() {
    return ownRecords().filter(r => {
      const recordDate = (r.createdAt || r.start || '').slice(0, 10);
      return (!filters.status || r.status === filters.status) && (!filters.cycle || (r.recurring ? String(r.cycle) : '1') === filters.cycle) && (!filters.from || recordDate >= filters.from) && (!filters.to || !!recordDate && recordDate <= filters.to);
    });
  }
  function historyValues(r) {
    return [r.invoice || '—', r.createdAt ? new Date(r.createdAt).toLocaleString('sv-SE') : date(r.start), r.merchantName, r.recurring ? date(r.start) + ' – ' + date(store.endDate(r)) : '—', r.recurring ? r.cycle + ' Months' : 'One-time', money(store.total(r), r.currency), r.status, store.count(r) + ' of ' + (r.recurring ? r.cycle : 1), date(store.endDate(r)), date(r.expiry)];
  }
  function renderHistory() {
    const list = historyRecords();
    $('paymentHistoryRows').innerHTML = list.map(r => '<tr>' + historyValues(r).map((v, index) => '<td>' + (index === 4 ? badge('cycle', v) : index === 6 ? badge(r.status) : esc(v)) + '</td>').join('') + '<td>' + esc(r.authorization?.status || 'Not authorized') + '</td><td>' + esc(date(r.nextPaymentDate)) + '</td></tr>').join('') || '<tr><td colspan="12" class="payment-empty">' + (selected ? 'No billing records found.' : 'Select a merchant to view billing history.') + '</td></tr>';
    $('exportHistory').disabled = !list.length;
  }
  function tab(name) {
    for (const id of ['pending', 'history']) { const active = id === name; $(id + 'Tab').setAttribute('aria-selected', String(active)); $(id + 'Tab').tabIndex = active ? 0 : -1; $(id + 'Panel').hidden = !active; }
  }
  for (const name of ['pending', 'history']) {
    $(name + 'Tab').onclick = () => tab(name);
    $(name + 'Tab').onkeydown = event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'pending' : event.key === 'End' ? 'history' : name === 'pending' ? 'history' : 'pending'; tab(next); $(next + 'Tab').focus(); } };
  }
  $('paymentMerchant').onchange = () => { selected = $('paymentMerchant').value; store.selectMerchant(selected); const url = new URL(location.href); if (selected) url.searchParams.set('merchantId', selected); else url.searchParams.delete('merchantId'); history.replaceState(null, '', url); resetFilters(); render(); };
  $('refreshPayments').onclick = async () => { const button = $('refreshPayments'); button.disabled = true; button.setAttribute('aria-busy', 'true'); await new Promise(resolve => setTimeout(resolve, 250)); try { await store.sync(); if (reload()) message('Payments refreshed.'); } catch(error) { message(error.message); } button.disabled = false; button.removeAttribute('aria-busy'); };
  function resetFilters() { $('historyFilters').reset(); filters = { status: '', cycle: '', from: '', to: '' }; $('dateTo').setCustomValidity(''); renderHistory(); }
  $('resetHistory').onclick = resetFilters;
  $('dateFrom').oninput = $('dateTo').oninput = () => $('dateTo').setCustomValidity('');
  $('historyFilters').onsubmit = event => { event.preventDefault(); const from = $('dateFrom').value, to = $('dateTo').value; if (from && to && from > to) { $('dateTo').setCustomValidity('End date must be on or after start date.'); $('dateTo').reportValidity(); return; } filters = { status: $('paymentStatus').value, cycle: $('paymentCycle').value, from, to }; renderHistory(); };
  $('exportHistory').onclick = () => {
    const rows = [['Invoice No.', 'Date & Time', 'Merchant Name', 'Billing Period', 'Cycle', 'Amount', 'Payment Status', 'Paid Installments', 'Due Date', 'Payment Link Expire Date', 'Card Authorization', 'Next Payment'], ...historyRecords().map(r => [...historyValues(r), r.authorization?.status || 'Not authorized', date(r.nextPaymentDate)])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })), link = document.createElement('a'); link.href = url; link.download = 'billing-history-' + selected + '.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); message('Billing history exported.');
  };
  $('pendingCards').onclick = event => {
    const button = event.target.closest('[data-pay]'); if (!button || !serviceReady) return;
    const id = button.dataset.pay;
    if (!reload()) return;
    const record = ownRecords().find(r => r.id === id);
    if (!record || !store.pending(record) || store.expired(record)) return message('This installment is no longer available.');
    paying = id; opener = $('pendingCards').querySelector('[data-pay="' + CSS.escape(id) + '"]');
    $('cardForm').reset(); updateRegions(); $('submitCard').disabled = true; $('cardError').hidden = true; $('cardForm').querySelectorAll('input').forEach(input => input.setCustomValidity('')); requestId = crypto.randomUUID(); window.PaywizardBillingCardForm.prepare(record); $('cardDialog').showModal(); $('cardEmail').focus();
  };
  function close() { if (!busy) $('cardDialog').close(); }
  $('closeCard').onclick = close;
  $('cardDialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  $('cardDialog').addEventListener('close', () => { $('cardForm').reset(); paying = null; if (opener?.isConnected) opener.focus(); else $('pendingTab').focus(); });
  const regions = {
    CN: ['Beijing', 'Shanghai', 'Tianjin', 'Chongqing', 'Anhui', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou', 'Hainan', 'Hebei', 'Heilongjiang', 'Henan', 'Hubei', 'Hunan', 'Inner Mongolia', 'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning', 'Ningxia', 'Qinghai', 'Shaanxi', 'Shandong', 'Shanxi', 'Sichuan', 'Tibet', 'Xinjiang', 'Yunnan', 'Zhejiang'],
    US: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    CA: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
    GB: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    DE: ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
    FR: ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d’Azur', 'Guadeloupe', 'Martinique', 'French Guiana', 'Réunion', 'Mayotte']
  };
  function updateRegions() { $('cardRegion').replaceChildren(new Option('State / Province / Region', '')); (regions[$('cardCountry').value] || []).forEach(region => $('cardRegion').add(new Option(region, region))); }
  $('cardCountry').addEventListener('change', updateRegions);
  $('cardForm').onsubmit = async event => {
    event.preventDefault(); if (busy || !window.PaywizardBillingCardForm.validate()) return;
    busy = true; window.PaywizardBillingCardForm.setBusy(true); $('closeCard').disabled = true;
    try {
      const result = await store.pay(paying, selected, window.PaywizardBillingCardForm.details(requestId));
      if (!result.paidInstallments) { requestId = crypto.randomUUID(); $('cardError').textContent = 'The charge failed. No installment was paid. Please try again.'; $('cardError').hidden = false; return; }
      $('cardDialog').close(); reload(); message(result.status === 'Overdue' ? 'A charge failed. Collection stopped; remaining installments are unpaid.' : 'Payment recorded. Each installment has its own payment record.');
    } catch (error) { $('cardError').textContent = error.message; $('cardError').hidden = false; }
    finally { busy = false; window.PaywizardBillingCardForm.setBusy(false); $('closeCard').disabled = false; }
  };
  window.addEventListener('storage', event => { if (event.key === store.key) reload(); });
  store.initialize().then(() => { serviceReady = true; reload(); }).catch(error => { $('loadError').textContent = error.message; $('loadError').hidden = false; });
  window.addEventListener('focus', () => { if (serviceReady && !busy && !$('cardDialog').open) store.sync().then(reload).catch(() => {}); });
  setInterval(() => { if (serviceReady && !busy && !$('cardDialog').open) store.sync().then(reload).catch(() => {}); }, 10000);
  reload();
})();
