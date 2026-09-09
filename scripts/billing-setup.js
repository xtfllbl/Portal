(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'paywizard-billing-setup-v1', store = window.PaywizardBillingStore;
  let ready = false, saving = false, connecting = false;
  function updateActions() {
    $('resetForm').disabled = saving;
    $('saveDraft').disabled = !ready || saving;
    document.querySelector('#billingForm button[type=submit]').disabled = !ready || saving;
  }
  const existing = window.PaywizardPlatformMerchantStore.readAll();
  const merchants = store.merchantList();
  let records = [], editing = null, highlighted = null, page = 1, filters = { assignment: '', merchant: '', status: '' }, storageError = false;
  function message(text) { $('billingMessage').textContent = text; clearTimeout(message.timer); message.timer = setTimeout(() => { $('billingMessage').textContent = ''; }, 5000); }
  function options(el, all) {
    if (all) el.add(new Option('All Merchants', ''));
    merchants.forEach(m => el.add(new Option(m.name, m.id)));
  }
  options($('merchant'));
  try { records = window.PaywizardBillingStore.read(); } catch (_) { storageError = true; message('Billing data could not be loaded. Please check browser storage and reload.'); }
  // Preserve existing bills even if their merchant is no longer in the current merchant list.
  records.filter(store.isMerchantRecord).forEach(r => {
    if (!merchants.some(m => m.id === r.merchantId)) { merchants.push({ id: r.merchantId, name: r.merchantName }); $('merchant').add(new Option(r.merchantName, r.merchantId)); }
  });
  function money(value, currency) { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value); }
  function total(r) { return Math.round(Number(r.amount || 0) * 100) * (r.recurring ? Number(r.cycle) : 1) / 100; }
  function formValue() {
    return { assignment: $('billingAssignment').value, merchantId: $('billingAssignment').value === 'merchant' ? $('merchant').value : null, merchantName: $('billingAssignment').value === 'merchant' ? merchants.find(m => m.id === $('merchant').value)?.name || '' : '', billType: $('billType').value, currency: $('currency').value, recurring: $('recurring').checked, cycle: Number($('cycle').value), amount: $('amount').value === '' ? '' : Number($('amount').value), start: $('startDate').value, expiry: $('expiry').value, notes: $('notes').value, includedData: $('billType').value === 'eSIM Billing' && $('includedData').value !== '' ? Number($('includedData').value) : null };
  }
  function selectTab(name, focus = false) {
    document.querySelectorAll('.billing-link-menu').forEach(menu => { menu.hidden = true; });
    document.querySelectorAll('.billing-more').forEach(button => button.setAttribute('aria-expanded', 'false'));
    for (const tab of ['create', 'records']) {
      $(tab + 'Tab').setAttribute('aria-selected', String(tab === name));
      $(tab + 'Tab').tabIndex = tab === name ? 0 : -1;
      $(tab + 'Panel').hidden = tab !== name;
    }
    if (focus) $(name + 'Tab').focus();
  }
  ['create', 'records'].forEach(name => {
    $(name + 'Tab').onclick = () => selectTab(name);
    $(name + 'Tab').onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      selectTab(event.key === 'Home' ? 'create' : event.key === 'End' ? 'records' : name === 'create' ? 'records' : 'create', true);
    };
  });
  function summaryItem(list, label, value) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; list.append(dt, dd);
  }
  function billingSummary(list, r) {
    list.replaceChildren();
    const add = (label, value) => summaryItem(list, label, value);
    if (store.isMerchantRecord(r)) add('Merchant', r.merchantName);
    add('Bill type', r.billType);
    add('Payment', r.recurring ? 'Fixed-term monthly' : 'One-time');
    if (r.recurring) {
      add('Monthly amount', r.amount !== '' && Number(r.amount) > 0 ? money(r.amount, r.currency) : 'Enter amount');
      add('Term', r.cycle + ' monthly installments');
      add('Billing start date', r.start || 'Select date');
    }
    if (r.billType === 'eSIM Billing') add('Included data', r.includedData == null ? 'Not specified' : r.includedData.toLocaleString('en-US') + ' MB');
    add('Payment link expires', r.expiry || 'Select date');
  }
  document.querySelectorAll('[data-assignment]').forEach(button => {
    button.onclick = () => { $('billingAssignment').value = button.dataset.assignment; update(); };
  });
  function update() {
    document.querySelectorAll('[data-assignment]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.assignment === $('billingAssignment').value)));
    const standalone = $('billingAssignment').value === 'standalone';
    $('merchantField').hidden = standalone;
    $('merchant').disabled = standalone;
    $('merchant').required = !standalone;
    $('applyBilling').textContent = standalone ? 'Create Payment Link' : 'Apply to Merchant Account';
    const recurring = $('recurring').checked, esim = $('billType').value === 'eSIM Billing';
    document.querySelectorAll('[data-recurring]').forEach(el => { el.hidden = !recurring; });
    document.querySelectorAll('[data-esim]').forEach(el => { el.hidden = !esim; });
    $('includedData').disabled = !esim;
    $('startDate').required = recurring;
    $('startDate').disabled = !recurring;
    $('cycle').disabled = !recurring;
    $('amountLabel').textContent = recurring ? 'Base Monthly Fee' : 'Amount';
    const r = formValue(), validAmount = $('amount').validity.valid && r.amount !== '';
    billingSummary($('previewDetails'), r);
    $('totalLabel').textContent = recurring ? 'Contract total' : 'Total amount';
    $('total').textContent = validAmount ? money(total(r), r.currency) : 'Enter amount';
  }
  function reset() { $('billingForm').reset(); editing = null; update(); }
  function nextDate(r) {
    if (!r.recurring) return '—';
    if (r.installments) return r.nextPaymentDate || '-';
    if (!r.recurring || !r.start) return '-';
    const [year, month, day] = r.start.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + Number(r.cycle), 1));
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
    return date.toISOString().slice(0, 10);
  }
  function cell(row, text) { const td = document.createElement('td'); td.textContent = text; row.append(td); return td; }
  function render() {
    const filtered = records.filter(r => r.status === 'Draft' && (!filters.assignment || (r.assignment ?? 'merchant') === filters.assignment) && (!filters.merchant || store.isMerchantRecord(r) && String(r.merchantName || '').toLocaleLowerCase().includes(filters.merchant.toLocaleLowerCase())) && (!filters.status || r.status === filters.status));
    const size = Number($('pageSize').value), pages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(Math.max(1, page), pages);
    $('billingRows').replaceChildren();
    filtered.slice((page - 1) * size, page * size).forEach(r => {
      const row = document.createElement('tr');
      row.classList.toggle('billing-new-record', r.id === highlighted);
      [store.isMerchantRecord(r) ? r.merchantId : '—', store.isMerchantRecord(r) ? r.merchantName : '—', r.invoice || '-', r.recurring ? 'Fixed-term monthly' : 'One-time', r.recurring ? r.cycle + ' Months' : '-', money(Number(r.amount || 0), r.currency), money(total(r), r.currency), r.recurring ? r.start || '-' : '-', nextDate(r)].forEach(v => cell(row, v));
      const badge = document.createElement('span'); badge.className = 'billing-status ' + r.status.toLowerCase(); badge.textContent = r.status; cell(row, '').append(badge);
      const actions = cell(row, '');
      if (r.status === 'Draft') {
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', store.isMerchantRecord(r) ? 'Edit draft for ' + r.merchantName : 'Edit standalone draft');
        edit.onclick = () => {
          editing = r.id;
          [['billingAssignment', r.assignment ?? 'merchant'], ['merchant', r.merchantId ?? $('merchant').value], ['billType', r.billType], ['currency', r.currency], ['amount', r.amount], ['cycle', [3, 6, 12, 24, 36].includes(Number(r.cycle)) ? r.cycle : 24], ['startDate', r.start], ['notes', r.notes], ['expiry', r.expiry], ['includedData', r.includedData ?? '']].forEach(([id, value]) => { $(id).value = value; });
          $('recurring').checked = r.recurring; update(); selectTab('create'); $('billingForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); if (store.isMerchantRecord(r)) $('merchant').focus(); else document.querySelector('[data-assignment=standalone]').focus(); message('Draft loaded for editing.');
        };
        actions.append(edit);
      }
      if (r.status !== 'Draft') addLinkActions(actions, r);
      $('billingRows').append(row);
    });
    if (!filtered.length) { const row = document.createElement('tr'); const td = cell(row, 'No billing records found.'); td.colSpan = 11; td.className = 'empty'; $('billingRows').append(row); }
    $('pageButtons').replaceChildren();
    function pageButton(label, target, disabled, current) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.disabled = disabled; b.setAttribute('aria-label', /^\d+$/.test(label) ? 'Page ' + label : label); if (current) b.setAttribute('aria-current', 'page'); b.onclick = () => { page = target; render(); }; $('pageButtons').append(b); }
    pageButton('First', 1, page === 1); pageButton('Prev', page - 1, page === 1);
    for (let n = Math.max(1, Math.min(page - 1, pages - 2)); n <= Math.min(pages, Math.max(3, page + 1)); n++) pageButton(String(n), n, false, n === page);
    pageButton('Next', page + 1, page === pages); pageButton('Last', pages, page === pages);
    $('pageSummary').textContent = page + ' / ' + pages + ' (' + filtered.length + ')';
  }
  async function save(draft) {
    if (!ready || saving) return message('Wait for the shared billing service to connect.');
    if (storageError) return message('Browser storage is unavailable. Billing changes cannot be saved.');
    if (!draft && !$('billingForm').reportValidity()) return;
    if (draft && (!$('merchant').reportValidity() || !$('amount').validity.valid && $('amount').value !== '')) { $('amount').reportValidity(); return; }
    try { records = window.PaywizardBillingStore.read(); } catch (_) { return message('Could not load current billing records.'); }
    if (!$('includedData').disabled && !$('includedData').reportValidity()) return;
    const value = formValue();
    const old = records.find(r => r.id === editing);
    if (editing && (!old || old.status !== 'Draft')) return message('This draft has changed. Reload before editing.');
    const record = { ...value, createdAt: old?.createdAt || new Date().toISOString(), id: old?.id || crypto.randomUUID(), invoice: draft ? '' : (BigInt(Date.now()) * 1000n + BigInt(records.length)).toString(), status: draft ? 'Draft' : value.recurring ? 'Active' : 'Pending' };
    saving = true; updateActions();
    try { await store.save(record); records = store.read(); }
    catch (error) { message(error.message); return; }
    finally { saving = false; updateActions(); }
    if (store.isMerchantRecord(record)) store.selectMerchant(record.merchantId);
    editing = draft ? record.id : null;
    filters = { assignment: record.assignment, merchant: record.merchantName || '', status: '' };
    $('filterAssignment').value = filters.assignment; $('filterMerchant').value = filters.merchant; $('filterStatus').value = ''; updateFilterAssignment(); page = 1;
    if (!draft) { location.href = '44.billing_overview.html'; return; }
    selectTab('records', true);
    render(); message(draft ? 'Draft saved.' : record.assignment === 'standalone' ? 'Payment link created.' : 'Billing applied to merchant account.');
  }
  $('billingForm').addEventListener('input', update);
  $('billingForm').addEventListener('change', update);
  $('billingForm').onsubmit = event => { event.preventDefault(); save(false); };
  $('saveDraft').onclick = () => save(true);
  $('resetForm').onclick = () => { reset(); message('Form reset. Saved billing records are unchanged.'); };
  $('filterMerchant').value = filters.merchant;
  $('filterForm').onsubmit = event => { event.preventDefault(); filters = { assignment: $('filterAssignment').value, merchant: $('filterMerchant').disabled ? '' : $('filterMerchant').value.trim(), status: $('filterStatus').value }; page = 1; render(); };
  function updateFilterAssignment() {
    const standalone = $('filterAssignment').value === 'standalone';
    $('filterMerchant').disabled = standalone;
    $('filterMerchant').closest('label').hidden = standalone;
    if (standalone) $('filterMerchant').value = '';
  }
  $('filterAssignment').onchange = updateFilterAssignment;
  $('pageSize').onchange = () => { page = 1; render(); };
  $('merchant').addEventListener('change', () => window.PaywizardBillingStore.selectMerchant($('merchant').value));
  window.addEventListener('storage', event => { if (event.key === key) { try { records = window.PaywizardBillingStore.read(); render(); } catch (_) { message('Could not reload billing records.'); } } });
  function recipient(record) {
    if (!store.isMerchantRecord(record)) return '';
    const merchant = existing.find(m => String(m.merchantId) === record.merchantId);
    return merchant?.email || merchant?.contactEmail || merchant?.contact?.email || '';
  }
  let sending = null, actionOpener = null;
  function addLinkActions(cell, record) {
    const wrap = document.createElement('div'); wrap.className = 'billing-link-actions';
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy URL'; copy.disabled = !ready || !record.linkToken;
    copy.onclick = async () => { try { await navigator.clipboard.writeText(store.link(record)); message('Payment link copied.'); } catch (_) { $('copyUrlValue').value = store.link(record); $('copyUrlDialog').showModal(); $('copyUrlValue').select(); } };
    const more = document.createElement('button'); more.type = 'button'; more.className = 'billing-more'; more.setAttribute('aria-label', 'Actions for invoice ' + record.invoice); more.setAttribute('aria-expanded', 'false'); more.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">more_horiz</span>';
    const menu = document.createElement('div'); menu.className = 'billing-link-menu'; menu.hidden = true;
    function item(text, fn, disabled) { const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.disabled = !!disabled; button.onclick = () => { menu.hidden = true; more.setAttribute('aria-expanded', 'false'); fn(); }; menu.append(button); }
    // Native navigation preserves the user's link activation in popup-restricted browsers.
    if (record.linkToken) {
      const preview = document.createElement('a'); preview.textContent = 'Preview payment link';
      preview.href = store.link(record); preview.target = '_blank'; preview.rel = 'noopener';
      preview.onclick = () => { menu.hidden = true; more.setAttribute('aria-expanded', 'false'); };
      menu.append(preview);
    } else item('Preview payment link', () => {}, true);
    item('Send Link', () => { sending = record; actionOpener = more; $('linkRecipient').value = recipient(record); $('sendLinkInvoice').textContent = record.invoice; $('sendLinkUrl').value = store.link(record); $('sendLinkError').textContent = ''; $('sendLinkDialog').showModal(); }, !record.linkToken || store.expired(record) || !!record.authorization || record.status === 'Paid');
    item('View billing details', () => {
      actionOpener = more;
      billingSummary($('savedBillingDetails'), record);
      summaryItem($('savedBillingDetails'), record.recurring ? 'Contract total' : 'Total amount', money(total(record), record.currency));
      if (record.notes) summaryItem($('savedBillingDetails'), 'Billing notes', record.notes);
      $('billingDetailsDialog').showModal();
    });
    item('View payment records', () => showPayments(record));
    more.onclick = () => { const open = menu.hidden; document.querySelectorAll('.billing-link-menu').forEach(m => m.hidden = true); document.querySelectorAll('.billing-more').forEach(b => b.setAttribute('aria-expanded', 'false')); menu.hidden = !open; more.setAttribute('aria-expanded', String(open)); if (open) { const box = more.getBoundingClientRect(); menu.style.left = Math.max(8, Math.min(innerWidth - 223, box.right - 215)) + 'px'; menu.style.top = Math.max(8, Math.min(innerHeight - 190, box.bottom + 6)) + 'px'; menu.querySelector('a[href], button:not(:disabled)')?.focus(); } };
    wrap.append(copy, more, menu); cell.append(wrap);
  }
  function showPayments(record) {
    $('installmentRows').replaceChildren();
    (record.installments || []).forEach(i => { const row = document.createElement('tr'); [i.number, i.due, money(i.amount, record.currency), i.status].forEach(v => cell(row, v)); $('installmentRows').append(row); });
    $('attemptRows').replaceChildren();
    (record.payments || []).forEach(payment => { const row = document.createElement('tr'); [payment.id, payment.installment, money(payment.amount, payment.currency), payment.status, payment.at.replace('T', ' ').slice(0,19)].forEach(v => cell(row, v)); $('attemptRows').append(row); });
    $('paymentRecordInvoice').textContent = record.invoice;
    $('paymentRecordsDialog').showModal();
  }
  document.addEventListener('click', event => { if (!event.target.closest('.billing-link-actions')) document.querySelectorAll('.billing-link-menu').forEach(m => { m.hidden = true; m.parentNode.querySelector('.billing-more').setAttribute('aria-expanded', 'false'); }); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelectorAll('.billing-link-menu:not([hidden])').forEach(m => { m.hidden = true; const b = m.parentNode.querySelector('.billing-more'); b.setAttribute('aria-expanded', 'false'); b.focus(); }); });
  $('sendLinkDialog').addEventListener('cancel', event => { if ($('confirmSendLink').disabled) event.preventDefault(); });
  $('billingDetailsDialog').addEventListener('close', () => actionOpener?.isConnected && actionOpener.focus());
  $('closeBillingDetails').onclick = () => $('billingDetailsDialog').close();
  $('closeSendLink').onclick = () => $('sendLinkDialog').close();
  $('closeCopyUrl').onclick = () => $('copyUrlDialog').close();
  $('closePaymentRecords').onclick = () => $('paymentRecordsDialog').close();
  $('sendLinkDialog').addEventListener('close', () => actionOpener?.isConnected && actionOpener.focus());
  $('sendLinkForm').onsubmit = async event => {
    event.preventDefault(); const button = $('confirmSendLink'); button.disabled = true; $('closeSendLink').disabled = true;
    try { await store.send(sending.id, $('linkRecipient').value.trim()); records = store.read(); $('sendLinkDialog').close(); render(); message('Email delivery simulated. No email was sent.'); }
    catch (error) { $('sendLinkError').textContent = error.message; }
    finally { button.disabled = false; $('closeSendLink').disabled = false; }
  };
  const today = new Date(); today.setDate(today.getDate() + 30); $('expiry').defaultValue = today.toISOString().slice(0,10);
  async function connect() {
    if (connecting) return;
    connecting = true; ready = false; updateActions();
    $('billingConnection').hidden = false;
    $('billingConnectionText').textContent = 'Connecting to billing service…';
    $('retryBilling').disabled = true;
    try {
      const data = await store.initialize();
      records = data; ready = true; storageError = false;
      records.filter(store.isMerchantRecord).forEach(r => { if (!merchants.some(m => m.id === r.merchantId)) { merchants.push({ id: r.merchantId, name: r.merchantName }); $('merchant').add(new Option(r.merchantName, r.merchantId)); } });
      $('billingConnection').hidden = true; window.dispatchEvent(new Event('billing-mode')); render();
    } catch (error) {
      $('billingConnectionText').textContent = error.message + ' Your form has been kept.';
    } finally {
      connecting = false; $('retryBilling').disabled = false; updateActions();
    }
  }
  $('retryBilling').onclick = connect;
  window.addEventListener('billing-reconnect', connect);
  connect();
  window.addEventListener('focus', () => { if (ready && !saving) store.sync().then(data => { records = data; render(); }).catch(error => message(error.message)); });
  setInterval(() => { if (ready && !saving && !document.querySelector('dialog[open]') && !document.querySelector('.billing-link-menu:not([hidden])')) store.sync().then(data => { records = data; render(); }).catch(() => {}); }, 60000);
  if (new URLSearchParams(location.search).get('tab') === 'records' || location.hash === '#records') location.replace('44.billing_overview.html');
  update(); render();
})();
