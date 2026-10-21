(function () {
  'use strict';
  const app = document.querySelector('[data-pool-page]');
  if (!app || window.PaywizardPortalAccess?.profile !== 'maintain') return;
  const pool = window.PaywizardParameterPool;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const tag = status => `<span class="pp-tag ${esc(status)}">${esc(pool.labels[status])}</span>`;
  const date = value => value ? new Date(value).toISOString().replace('T', ' ').slice(0, 19) : '—';
  const money = value => (value / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const params = new URLSearchParams(location.search);
  function error(message, id = 'poolError') { const target = $(id); target.textContent = message; target.hidden = false; target.scrollIntoView({ block: 'center' }); target.focus({ preventScroll: true }); }
  function feedback(message) { const target = $('poolFeedback'); target.textContent = message; target.hidden = false; }
  function mount(id, label, options, value, onChange, inputId) { return window.PaywizardPaymentChannelPicker.mount($(id), { label, options, value, onChange, id: inputId }); }
  function meta(items) { return items.map(([label, value, html]) => `<div><dt>${esc(label)}</dt><dd>${html ? value : esc(value || '—')}</dd></div>`).join(''); }
  try {
    if (app.dataset.poolPage === 'list') list();
    if (app.dataset.poolPage === 'form') form();
    if (app.dataset.poolPage === 'usage') usagePage();
  } catch (cause) { error(cause.message); }
  function list() {
    let status = '', appliedStatus = '', appliedTerm = '';
    mount('poolStatus', 'Parameter set status', [{ value: '', label: 'All Statuses' }, ...['available', 'in_use', 'awaiting_settlement'].map(value => ({ value, label: pool.labels[value] }))], '', value => { status = value; });
    const channelNames = () => Object.fromEntries(pool.channels().map(channel => [channel.id, channel.name]));
    function paint() {
      const state = pool.read(), term = appliedTerm, names = channelNames();
      const rows = state.resources.map(resource => ({ resource, owner: state.usages.find(row => row.id === resource.currentUsageId) })).filter(({ resource: r, owner: u }) => (!appliedStatus || r.status === appliedStatus) && [r.name, names[r.channelId] || r.channelName, r.parameters.mid, r.parameters.tid, u?.merchantName, u?.storeName, u?.tci].join(' ').toLowerCase().includes(term));
      $('poolRows').innerHTML = rows.length ? rows.map(({ resource: r, owner: u }) => `<tr><td>${esc(r.name)}</td><td>${esc(names[r.channelId] || r.channelName)}</td><td>${esc(r.parameters.mid)}</td><td>${esc(r.parameters.tid)}</td><td>${tag(r.status)}</td><td>${esc(u?.merchantName || '—')}</td><td>${esc(u?.storeName || '—')}</td><td>${esc(u?.tci || '—')}</td><td><div class="pp-actions">${r.status === 'available' ? `<a href="49.parameter_pool_form.html?id=${encodeURIComponent(r.id)}" title="Edit ${esc(r.name)}" aria-label="Edit ${esc(r.name)}"><span class="material-symbols-rounded" aria-hidden="true">edit</span></a>` : ''}<a href="49.parameter_pool_usage.html?resource=${encodeURIComponent(r.id)}" title="Usage Records" aria-label="Usage records for ${esc(r.name)}"><span class="material-symbols-rounded" aria-hidden="true">history</span></a></div></td></tr>`).join('') : '<tr><td colspan="9" class="pp-empty">No parameter sets match your search.</td></tr>';
      $('poolCount').textContent = `${rows.length} of ${state.resources.length} parameter sets`;
    }
    $('poolFilters').addEventListener('submit', event => { event.preventDefault(); appliedTerm = $('poolSearch').value.trim().toLowerCase(); appliedStatus = status; try { paint(); } catch (cause) { error(cause.message); } });
    window.addEventListener('storage', event => { if ([pool.KEY, 'paywizard.maintain.payment-channels.v1'].includes(event.key)) { try { paint(); } catch (cause) { error(cause.message); } } });
    if (params.get('saved') === '1') { feedback('Parameter set saved.'); history.replaceState(null, '', location.pathname); }
    paint();
  }
  function form() {
    const schema = PROCESSOR_PARAMETER_SCHEMA['NUVEI UPT'];
    const id = params.get('id'), state = pool.read();
    const resource = id ? state.resources.find(row => row.id === id) : null;
    if (id && !resource) { $('poolForm').hidden = true; throw new Error('This parameter set no longer exists. Return to Parameter Pool.'); }
    if (resource && resource.status !== 'available') { $('poolForm').hidden = true; throw new Error('Only available parameter sets can be edited. Return to Parameter Pool to view its usage records.'); }
    if (id) { $('poolTitle').textContent = 'Edit Parameter Set'; document.title = 'Edit Parameter Set | PAYwizard Maintain'; }
    const availableChannels = pool.channels();
    let channelId = resource?.channelId || '';
    $('resourceName').value = resource?.name || '';
    const values = resource?.parameters || pool.defaults(schema);
    mount('poolChannel', 'Payment Channel', availableChannels.map(row => ({ value: row.id, label: row.name })), channelId, value => { channelId = value; }, 'poolChannelInput');
    function activate(index, focus = false) {
      document.querySelectorAll('[data-parameter-tab]').forEach(tab => { const active = Number(tab.dataset.parameterTab) === index; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; if (active && focus) tab.focus(); });
      document.querySelectorAll('[data-parameter-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.parameterPanel) !== index; });
    }
    schema.forEach(([group, fields], index) => {
      const tab = document.createElement('button'); tab.type = 'button'; tab.id = `pool-tab-${index}`; tab.textContent = group; tab.dataset.parameterTab = index; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', `pool-panel-${index}`);
      tab.addEventListener('click', () => activate(index));
      tab.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); activate(event.key === 'Home' ? 0 : event.key === 'End' ? schema.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + schema.length) % schema.length, true); } });
      $('parameterTabs').append(tab);
      const panel = document.createElement('div'); panel.id = `pool-panel-${index}`; panel.dataset.parameterPanel = index; panel.className = 'pp-parameter-grid'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id);
      fields.forEach(([key, label, , , required, min, max, rule, spec]) => {
        const field = document.createElement('div'); field.className = 'pc-field'; field.dataset.group = index;
        field.innerHTML = `<label for="pool-param-${esc(key)}">${esc(label)}${required ? '<span class="pp-required">*</span>' : ''}</label>`;
        let input;
        if (spec === 'binary') {
          input = document.createElement('input'); input.type = 'hidden'; input.value = values[key]; field.append(input);
          const group = document.createElement('div'); group.className = 'pp-segments'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
          [['1', 'Enable'], ['0', 'Disable']].forEach(([value, name]) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = name; button.setAttribute('aria-pressed', String(value === input.value)); button.addEventListener('click', () => { input.value = value; [...group.children].forEach(item => item.setAttribute('aria-pressed', String(item === button))); }); group.append(button); }); field.append(group);
        } else if (spec) {
          input = document.createElement('input'); input.type = 'hidden'; input.value = values[key]; field.append(input);
          const root = document.createElement('div'); field.append(root);
          const options = Array.isArray(spec) ? spec : PROCESSOR_PARAMETER_OPTIONS[spec] || [];
          window.PaywizardPaymentChannelPicker.mount(root, { id: `pool-param-${key}`, label, value: input.value, options: [{ value: '', label: `Select ${label}` }, ...options.map(([value, name]) => ({ value: String(value), label: name }))], onChange(value) { input.value = value; } });
        } else {
          input = document.createElement('input'); input.type = 'text'; input.value = values[key] || ''; input.autocomplete = 'off'; input.required = !!required;
          if (min) input.minLength = Number(min); if (max) input.maxLength = Number(max); if (rule === 'N') { input.pattern = '[0-9]*'; input.inputMode = 'numeric'; } field.append(input);
        }
        input.dataset.parameterKey = key; if (!spec || spec === 'binary') input.id = `pool-param-${key}`; panel.append(field);
      });
      $('parameterFields').append(panel);
    });
    activate(0);
    if (!availableChannels.length) error('No NUVEI UPT payment channel is available. Add the existing Nuvei channel in Payment Channel first.');
    $('poolForm').addEventListener('submit', async event => {
      event.preventDefault(); $('poolError').hidden = true;
      const invalid = [...$('poolForm').querySelectorAll('input')].find(input => !input.checkValidity());
      if (invalid) { const group = invalid.closest('[data-group]'); if (group) activate(Number(group.dataset.group)); error(`${invalid.labels?.[0]?.textContent.replace('*', '').trim() || 'Field'}: ${invalid.validity.valueMissing ? 'This field is required.' : 'Check the field format and length.'}`); invalid.setAttribute('aria-invalid', 'true'); invalid.addEventListener('input', () => invalid.removeAttribute('aria-invalid'), { once: true }); return; }
      if (!channelId) { error('Select a payment channel.'); return; }
      const draft = { id: `pool-${crypto.randomUUID()}`, name: $('resourceName').value, channelId, parameters: Object.fromEntries([...$('parameterFields').querySelectorAll('[data-parameter-key]')].map(input => [input.dataset.parameterKey, input.value])) };
      $('saveParameter').disabled = true;
      try {
        await pool.mutate(latest => {
          const channel = pool.channels().find(row => row.id === channelId);
          if (!channel) throw new Error('The selected channel is no longer available. Select an existing Nuvei channel.');
          pool.saveResource(latest, { ...draft, channelName: channel.name }, id, schema);
        });
        location.href = '49.parameter_pool.html?saved=1';
      } catch (cause) { error(cause.message); } finally { $('saveParameter').disabled = false; }
    });
  }
  function usagePage() {
    let selectedId = params.get('usage') || '', page = 0, pendingUsageId = '', displayedRevision = '', pendingRevision = '';
    let visibleColumns = ['id', 'time', 'type', 'status', 'currency', 'amountMinor', 'paymentMethod', 'maskedCard', 'authCode', 'mid', 'tid', 'tci', 'sn', 'originalTransactionId'];
    const revision = (state, usageId) => JSON.stringify({ usage: state.usages.find(row => row.id === usageId), rows: pool.transactionsFor(state, usageId) });
    const resourceId = params.get('resource'), state = pool.read();
    const resource = state.resources.find(row => row.id === resourceId);
    if (!resource) throw new Error('This parameter set no longer exists. Return to Parameter Pool.');
    $('poolTitle').textContent = `Usage Records · ${resource.name}`;
    const records = latest => latest.usages.filter(row => row.resourceId === resourceId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const options = latest => records(latest).map(row => ({ value: row.id, label: `${row.merchantName} · ${date(row.startedAt).slice(0, 10)} · ${pool.labels[row.status]}`, description: `${row.storeName} · ${row.tci}`, searchText: `${row.id} ${row.merchantId} ${row.storeId}` }));
    if (selectedId && !records(state).some(row => row.id === selectedId)) throw new Error('This usage does not belong to the selected resource. Return to Parameter Pool.');
    if (!selectedId) selectedId = records(state)[0]?.id || '';
    const picker = mount('usageRecordPicker', 'Usage Record', options(state), selectedId, value => { selectedId = value; page = 0; $('poolFeedback').hidden = true; paint(); }, 'usageRecordInput');
    const dialog = $('settlementDialog');
    window.PaywizardPaymentChannelPicker.mount($('usageColumns'), { label: 'Transaction columns', caption: 'Columns', multiple: true, options: pool.transactionColumns.map(([value, label]) => ({ value, label })), value: visibleColumns, onChange(value) { visibleColumns = value; paint(); } });
    function paint() {
      const latest = pool.read();
      const usage = records(latest).find(row => row.id === selectedId);
      picker.setOptions(options(latest)); picker.setValue(selectedId);
      $('usageContent').hidden = !usage; $('noUsages').hidden = !!usage;
      $('confirmSettlement').hidden = !usage || usage.status !== 'awaiting_settlement';
      if (!usage) return;
      history.replaceState(null, '', `?resource=${encodeURIComponent(resourceId)}&usage=${encodeURIComponent(usage.id)}`);
      const rows = pool.transactionsFor(latest, selectedId), summary = pool.statistics(rows); displayedRevision = revision(latest, selectedId);
      $('usageMeta').innerHTML = meta([['Merchant', usage.merchantName], ['Store', usage.storeName], ['TCI', usage.tci], ['Record Status', tag(usage.status), true], ['Started At (UTC)', date(usage.startedAt)], ['Ended At (UTC)', date(usage.endedAt)], ['MID', usage.parameters.mid], ['TID', usage.parameters.tid], ['Channel', usage.channelName], ...(usage.status === 'settled' ? [['Confirmed At (UTC)', date(usage.settledAt)], ['Confirmed By', usage.settledBy]] : [])]);
      let frozenNotice = $('usageFrozenNotice');
      if (!frozenNotice) { frozenNotice = document.createElement('p'); frozenNotice.id = 'usageFrozenNotice'; frozenNotice.className = 'pp-note'; $('usageMeta').after(frozenNotice); }
      frozenNotice.hidden = usage.status === 'in_use';
      frozenNotice.textContent = 'This usage has ended. Its transactions are read-only; merchant follow-up operations are unavailable.';

      $('usageSummary').innerHTML = summary.length ? summary.map(row => `<tr><td>${esc(row.currency)}</td><td>${esc(row.type)}</td><td>${esc(row.status)}</td><td>${row.count}</td><td>${money(row.amountMinor)}</td></tr>`).join('') : '<tr><td colspan="5" class="pp-empty">No transactions in this usage record.</td></tr>';
      const pages = Math.max(1, Math.ceil(rows.length / 10)); page = Math.min(page, pages - 1);
      const columns = pool.transactionColumns.filter(([key]) => visibleColumns.includes(key));
      $('usageTransactionHead').innerHTML = `<tr>${columns.map(([, title]) => `<th>${esc(title.toUpperCase())}</th>`).join('')}</tr>`;
      $('usageTransactions').closest('table').style.minWidth = `${Math.max(600, columns.length * 140)}px`;
      $('usageTransactions').innerHTML = !columns.length ? '<tr><td class="pp-empty">Select columns to view transaction details.</td></tr>' : rows.length ? rows.slice(page * 10, page * 10 + 10).map(row => `<tr>${columns.map(([key]) => `<td>${esc(key === 'amountMinor' ? money(row[key]) : ['time', 'terminalTime'].includes(key) ? date(row[key]) : row[key] || '—')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}" class="pp-empty">No transactions in this usage record.</td></tr>`;
      $('transactionCount').textContent = rows.length ? `${page * 10 + 1}–${Math.min(page * 10 + 10, rows.length)} of ${rows.length} transactions` : '0 transactions';
      $('transactionPage').textContent = `${page + 1} / ${pages}`;
      $('previousTransactions').disabled = page === 0; $('nextTransactions').disabled = page === pages - 1;
    }
    function guardedPaint() { try { paint(); } catch (cause) { error(cause.message); } }
    $('previousTransactions').onclick = () => { page--; guardedPaint(); };
    $('nextTransactions').onclick = () => { page++; guardedPaint(); };
    $('exportUsage').onclick = () => { try { const csv = pool.exportCSV(pool.read(), selectedId); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `Parameter-Usage-${selectedId}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (cause) { error(cause.message); } };
    $('confirmSettlement').onclick = () => {
      try {
        const latest = pool.read(); const usage = latest.usages.find(row => row.id === selectedId);
        if (revision(latest, selectedId) !== displayedRevision) { paint(); throw new Error('This record has changed. Review and export the latest transactions before confirming.'); }
        if (!usage || usage.status !== 'awaiting_settlement') { guardedPaint(); throw new Error('This usage is no longer awaiting settlement.'); }
        pendingUsageId = usage.id; pendingRevision = displayedRevision; $('settlementError').hidden = true;
        $('settlementMeta').innerHTML = meta([['Parameter Set', usage.resourceName], ['Merchant', usage.merchantName], ['Store', usage.storeName], ['TCI', usage.tci]]); dialog.showModal();
      } catch (cause) { error(cause.message); }
    };
    $('closeSettlement').onclick = $('cancelSettlement').onclick = () => dialog.close();
    $('submitSettlement').onclick = async () => {
      $('submitSettlement').disabled = true;
      try {
        await pool.mutate(latest => { if (revision(latest, pendingUsageId) !== pendingRevision) throw new Error('This record has changed. Close this dialog, refresh and review the latest transactions before confirming.'); return pool.settle(latest, pendingUsageId, window.PaywizardPortalAccess.label, new Date().toISOString()); });
        dialog.close(); paint(); feedback('Settlement confirmed. This parameter set is available for the next merchant.');
      } catch (cause) { error(cause.message, 'settlementError'); } finally { $('submitSettlement').disabled = false; }
    };
    window.addEventListener('storage', event => { if (event.key === pool.KEY) guardedPaint(); });
    paint();
  }
})();
