/* Prototype data only. Resource ownership belongs to a usage, never to MID/TID. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaywizardParameterPool = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const KEY = 'paywizard.parameter-pool.v1';
  const VERSION = '1.0.41_20260622';
  const labels = { available: 'Available', in_use: 'In Use', awaiting_settlement: 'Awaiting Settlement', settled: 'Settled' };
  const transactionColumns = [
    ['id', 'Transaction ID'], ['time', 'Date & Time (Processor)'], ['terminalTime', 'Date & Time (Terminal)'], ['timezone', 'Timezone'],
    ['invoiceNumber', 'Invoice Number'], ['type', 'Type'], ['status', 'Status'], ['currency', 'Currency'], ['amountMinor', 'Amount'],
    ['paymentMethod', 'Payment Method'], ['cardBrand', 'Card Scheme'], ['maskedCard', 'Card / Account'], ['rrn', 'Reference Number (RRN)'],
    ['authCode', 'Approval Code'], ['responseCode', 'Response Code'], ['originalTransactionId', 'Original Transaction ID'],
    ['batch', 'Batch'], ['trace', 'Trace'], ['mid', 'MID'], ['tid', 'TID'], ['merchantName', 'Merchant Name'], ['storeName', 'Store Name'],
    ['storeId', 'Store ID'], ['tci', 'TCI'], ['sn', 'SN'], ['terminalName', 'Terminal Name'], ['phoneNumber', 'Phone Number'], ['email', 'Email']
  ];
  const copy = value => JSON.parse(JSON.stringify(value));
  const fail = message => { throw new Error(message); };
  function defaults(schema) { return Object.fromEntries(schema.flatMap(group => group[1]).map(field => [field[0], String(field[3] ?? '')])); }
  function channels() {
    const raw = localStorage.getItem('paywizard.maintain.payment-channels.v1');
    const rows = raw ? JSON.parse(raw) : window.PaywizardPaymentChannelData.records;
    if (!Array.isArray(rows)) fail('Payment channels could not be loaded. Return to Payment Channel and try again.');
    return rows.filter(row => row.channelType === 'Nuvei' && row.packageName === 'com.smartpos.nuvei.smartpay');
  }
  function seed(schema, channelId = 'pc-44') {
    const resources = Array.from({ length: 10 }, (_, index) => ({
      id: `pool-${index + 1}`, name: `Nuvei UPT ${String(index + 1).padStart(2, '0')}`, channelId, channelName: 'Nuvei', processor: 'NUVEI UPT', version: VERSION,
      status: index === 1 ? 'in_use' : index === 2 ? 'awaiting_settlement' : 'available',
      currentUsageId: index === 1 ? 'usage-current-02' : index === 2 ? 'usage-current-03' : null,
      parameters: { ...defaults(schema), mid: `DEMO${String(index + 1).padStart(8, '0')}`, tid: `D${String(index + 1).padStart(7, '0')}`, merchantName: 'WizarPOS' }
    }));
    function usage(id, resource, merchantId, merchantName, storeName, start, end, status) {
      return { id, resourceId: resource.id, resourceName: resource.name, channelId, channelName: 'Nuvei', version: VERSION, parameters: copy(resource.parameters), merchantId, merchantName, storeId: `store-${merchantId}`, storeName, tci: `TCI-${merchantId}`, startedAt: start, endedAt: end, status, settledAt: status === 'settled' ? new Date(Date.parse(end) + 86400000).toISOString() : null, settledBy: status === 'settled' ? 'WizarPOS Provider' : null };
    }
    const usages = [
      usage('usage-current-02', resources[1], 'm-cafe', 'Maple Coffee', 'Union Station', '2026-10-01T08:00:00Z', null, 'in_use'),
      usage('usage-current-03', resources[2], 'm-market', 'Harbour Market', 'Waterfront', '2026-09-22T08:00:00Z', '2026-10-13T08:00:00Z', 'awaiting_settlement'),
      usage('usage-prior-03', resources[2], 'm-bakery', 'Oak Bakery', 'King Street', '2026-09-01T08:00:00Z', '2026-09-18T08:00:00Z', 'settled'),
      usage('usage-prior-01', resources[0], 'm-books', 'Cedar Books', 'Downtown', '2026-09-01T08:00:00Z', '2026-09-21T08:00:00Z', 'settled')
    ];
    const transactions = usages.flatMap((usage, ui) => Array.from({ length: 26 }, (_, index) => ({
      id: `TX-${ui + 1}-${String(index + 1).padStart(5, '0')}`, usageId: usage.id, merchantId: usage.merchantId, storeId: usage.storeId, tci: usage.tci,
      time: new Date(Date.parse(usage.startedAt) + (index + 1) * 3600000).toISOString(),
      type: index === 5 ? 'Refund' : index === 8 ? 'Void' : 'Purchase', status: index === 4 ? 'Failed' : 'Completed',
      terminalTime: new Date(Date.parse(usage.startedAt) + (index + 1) * 3600000).toISOString(), timezone: 'UTC', invoiceNumber: `INV-${ui + 1}-${index + 1}`, batch: '000001', trace: String(index + 1).padStart(6, '0'), merchantName: usage.merchantName, storeName: usage.storeName, sn: `DEMO-SN-${ui + 1}`, terminalName: 'Vending Counter', phoneNumber: '', email: '',
      currency: 'CAD', amountMinor: 1250 + index * 175, paymentMethod: 'Card', cardBrand: index % 2 ? 'Mastercard' : 'Visa', maskedCard: index % 2 ? '•••• 4444' : '•••• 1111',
      rrn: `${ui + 1}${String(index + 1).padStart(11, '0')}`, authCode: index === 4 ? '' : String(810001 + index), responseCode: index === 4 ? '05' : '00',
      originalTransactionId: index === 5 ? `TX-${ui + 1}-00001` : index === 8 ? `TX-${ui + 1}-00002` : '', mid: usage.parameters.mid, tid: usage.parameters.tid
    })));
    return { version: 1, resources, usages, transactions };
  }
  function read() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed(PROCESSOR_PARAMETER_SCHEMA['NUVEI UPT']);
    let state;
    try { state = JSON.parse(raw); } catch (_) { fail('Parameter Pool data could not be read. Your stored data has not been changed.'); }
    if (state.version !== 1 || !['resources', 'usages', 'transactions'].every(key => Array.isArray(state[key]))) fail('Parameter Pool data is not supported. Your stored data has not been changed.');
    return state;
  }
  function requireResource(state, id) { return state.resources.find(row => row.id === id) || fail('This resource no longer exists. Refresh the page.'); }
  function saveResource(state, draft, id, schema) {
    const old = id ? requireResource(state, id) : null;
    if (old && old.status !== 'available') fail('Only available resources can be edited.');
    if (!draft.name.trim()) fail('Enter a resource name.');
    if (!draft.channelId || draft.version !== VERSION) fail('Select an existing Nuvei channel and template version.');
    const parameters = {};
    for (const [key, label, , , required, min, max, rule, options] of schema.flatMap(group => group[1])) {
      const value = String(draft.parameters[key] ?? '').trim();
      if (required && !value) fail(`${label} is required.`);
      if (value && ((max && value.length > Number(max)) || (min && value.length < Number(min)))) fail(`${label} has an invalid length.`);
      if (value && rule === 'N' && !/^\d+$/.test(value)) fail(`${label} must contain digits only.`);
      if (options === 'binary' && !['0', '1'].includes(value)) fail(`Select ${label}.`);
      if (value && Array.isArray(options) && !options.some(option => String(option[0]) === value)) fail(`Select a valid ${label}.`);
      parameters[key] = value;
    }
    if (state.resources.some(row => row.id !== id && row.channelId === draft.channelId && row.parameters.mid === parameters.mid && row.parameters.tid === parameters.tid)) fail('This channel, MID and TID already exist in the pool. Edit the existing resource.');
    const resource = { id: id || draft.id, name: draft.name.trim(), channelId: draft.channelId, channelName: draft.channelName, processor: 'NUVEI UPT', version: VERSION, parameters, status: 'available', currentUsageId: null };
    if (!resource.id) fail('Resource ID is required.');
    if (old) Object.assign(old, resource); else state.resources.push(resource);
    return resource;
  }
  function allocate(state, resourceId, owner, usageId, time) {
    const resource = requireResource(state, resourceId);
    if (!owner.merchantId || !owner.storeId || !owner.tci) fail('Open Add Device from a merchant store before selecting a pool resource.');
    const existing = state.usages.find(row => row.tci === owner.tci && row.status !== 'settled');
    if (existing) {
      if (existing.resourceId === resourceId && existing.merchantId === owner.merchantId && existing.storeId === owner.storeId && existing.status === 'in_use') return existing;
      fail('This TCI already has a resource assigned.');
    }
    if (resource.status !== 'available') fail('This resource is no longer available. Select another resource.');
    if (!usageId || state.usages.some(row => row.id === usageId)) fail('A unique usage ID is required.');
    const usage = { ...copy(owner), id: usageId, resourceId, resourceName: resource.name, channelId: resource.channelId, channelName: resource.channelName, version: resource.version, parameters: copy(resource.parameters), status: 'in_use', startedAt: time, endedAt: null, settledAt: null, settledBy: null };
    state.usages.unshift(usage); resource.status = 'in_use'; resource.currentUsageId = usageId;
    return usage;
  }
  function settle(state, usageId, actor, time) {
    const usage = state.usages.find(row => row.id === usageId) || fail('This usage record no longer exists.');
    if (usage.status === 'settled') return usage;
    const resource = requireResource(state, usage.resourceId);
    if (usage.status !== 'awaiting_settlement' || !usage.endedAt || resource.currentUsageId !== usageId || resource.status !== 'awaiting_settlement') fail('Only the current usage awaiting settlement can be confirmed. Refresh the page.');
    usage.status = 'settled'; usage.settledBy = actor; usage.settledAt = time;
    resource.status = 'available'; resource.currentUsageId = null;
    return usage;
  }
  function transactionsFor(state, usageId) {
    const usage = state.usages.find(row => row.id === usageId);
    if (!usage) return [];
    return state.transactions.filter(row => row.usageId === usage.id && row.merchantId === usage.merchantId && row.storeId === usage.storeId && row.tci === usage.tci).sort((a, b) => b.time.localeCompare(a.time));
  }
  function statistics(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const key = `${row.currency}|${row.type}|${row.status}`;
      if (!groups.has(key)) groups.set(key, { currency: row.currency, type: row.type, status: row.status, count: 0, amountMinor: 0 });
      const group = groups.get(key); group.count++; group.amountMinor += row.amountMinor;
    });
    return [...groups.values()].sort((a, b) => `${a.currency}${a.type}${a.status}`.localeCompare(`${b.currency}${b.type}${b.status}`));
  }
  function csvCell(value) { const raw = String(value ?? ''); return `"${(/^[\s]*[=+@-]/.test(raw) ? "'" : '') + raw.replace(/"/g, '""')}"`; }
  function exportCSV(state, usageId, generatedAt = new Date().toISOString()) {
    const usage = state.usages.find(row => row.id === usageId) || fail('Select a usage record.');
    const rows = transactionsFor(state, usageId);
    const data = [
      ['Exported At (UTC)', generatedAt], ['Usage ID', usage.id], ['Resource', usage.resourceName], ['Merchant ID', usage.merchantId], ['Merchant', usage.merchantName], ['Store ID', usage.storeId], ['Store', usage.storeName], ['TCI', usage.tci], ['Started At (UTC)', usage.startedAt], ['Ended At (UTC)', usage.endedAt], ['Usage Status', labels[usage.status]], ['Confirmed At (UTC)', usage.settledAt], ['Confirmed By', usage.settledBy], [],
      ['Currency', 'Type', 'Status', 'Count', 'Transaction Amount'],
      ...statistics(rows).map(row => [row.currency, row.type, row.status, row.count, (row.amountMinor / 100).toFixed(2)]), [],
      ['Usage ID', 'Merchant ID', ...transactionColumns.map(([, title]) => title)],
      ...rows.map(row => [row.usageId, row.merchantId, ...transactionColumns.map(([key]) => key === 'amountMinor' ? (row.amountMinor / 100).toFixed(2) : row[key])])
    ];
    return '\ufeff' + data.map(row => row.map(csvCell).join(',')).join('\r\n');
  }
  async function mutate(change) {
    if (window.PaywizardPortalAccess?.profile !== 'wizarpos') fail('Parameter Pool is available to WizarPOS Provider only.');
    const run = async () => {
      const state = read();
      const result = await change(state);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { fail('Changes could not be saved in this browser. Free browser storage and try again.'); }
      return result;
    };
    if (navigator.locks) return navigator.locks.request(KEY, run);
    fail('Open this prototype on localhost in a browser that supports Web Locks to save changes.');
  }
  return { KEY, VERSION, labels, transactionColumns, defaults, channels, seed, read, saveResource, allocate, settle, transactionsFor, statistics, exportCSV, mutate };
});
