const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const pool = require('../../scripts/parameter-pool-store.js');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../processor-parameter-data.js'), 'utf8'), context);
const schema = JSON.parse(vm.runInContext('JSON.stringify(PROCESSOR_PARAMETER_SCHEMA["NUVEI UPT"])', context));
const owner = { merchantId: 'new-merchant', merchantName: 'New Merchant', storeId: 'new-store', storeName: 'New Store', tci: 'TCI-NEW' };
const now = '2026-10-16T09:00:00Z';
test('reuses all 57 NUVEI UPT fields and saves without a channel verification step', () => {
  const state = pool.seed(schema);
  assert.equal(Object.keys(state.resources[0].parameters).length, 57);
  const draft = { ...state.resources[0], id: 'pool-new', name: 'New Resource', parameters: { ...state.resources[0].parameters, mid: 'NEWMID', tid: 'NEWTID' } };
  pool.saveResource(state, draft, null, schema);
  assert.equal(state.resources.length, 11);
  assert.equal(state.resources.at(-1).status, 'available');
  assert.ok(!Object.hasOwn(state.resources.at(-1), 'version'));
  assert.throws(() => pool.saveResource(state, { ...draft, id: 'duplicate' }, null, schema), /already exist/);
  assert.throws(() => pool.saveResource(state, draft, 'pool-2', schema), /Only available/);
});
test('legacy parameter versions are discarded without losing parameters, usage history or storage format', async () => {
  const legacy = pool.seed(schema);
  for (const row of [...legacy.resources, ...legacy.usages]) row.version = '1.0.41_20260622';
  let stored = JSON.stringify(legacy);
  const sandbox = vm.createContext({
    PROCESSOR_PARAMETER_SCHEMA: { 'NUVEI UPT': schema },
    navigator: { locks: { request: async (key, action) => action() } },
    window: { PaywizardPortalAccess: { profile: 'maintain' } },
    localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; } }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../scripts/parameter-pool-store.js'), 'utf8'), sandbox);
  const api = sandbox.window.PaywizardParameterPool;
  const current = JSON.parse(JSON.stringify(api.read()));
  assert.equal(current.version, 1);
  assert.ok([...current.resources, ...current.usages].every(row => !Object.hasOwn(row, 'version')));
  assert.deepEqual(current.transactions, legacy.transactions);
  assert.deepEqual(current.usages.map(row => row.parameters), legacy.usages.map(row => row.parameters));
  assert.equal(current.resources[1].currentUsageId, legacy.resources[1].currentUsageId);
  await api.mutate(state => api.saveResource(state, { ...state.resources[3], name: 'Renamed Set' }, 'pool-4', schema));
  const persisted = JSON.parse(stored);
  assert.equal(persisted.resources[3].name, 'Renamed Set');
  assert.ok([...persisted.resources, ...persisted.usages].every(row => !Object.hasOwn(row, 'version')));
  assert.deepEqual(persisted.transactions, legacy.transactions);
});
test('exclusive allocation creates an immutable usage parameter snapshot and is idempotent', () => {
  const state = pool.seed(schema);
  const usage = pool.allocate(state, 'pool-1', owner, 'new-usage', now);
  assert.equal(state.resources[0].status, 'in_use');
  assert.equal(usage.merchantId, owner.merchantId);
  assert.equal(pool.allocate(state, 'pool-1', owner, 'repeat', now).id, usage.id);
  assert.equal(state.usages.filter(row => row.tci === owner.tci).length, 1);
  assert.throws(() => pool.allocate(state, 'pool-1', { ...owner, tci: 'OTHER', merchantId: 'other' }, 'collision', now), /no longer available/);
  assert.throws(() => pool.allocate(state, 'pool-4', owner, 'second', now), /already has/);
  state.resources[0].parameters.mid = 'CHANGED';
  assert.notEqual(usage.parameters.mid, 'CHANGED');
  assert.throws(() => pool.allocate(state, 'pool-4', {}, 'missing-owner', now), /merchant store/);
});
test('settlement releases only the current ended usage and keeps historical transactions', () => {
  const state = pool.seed(schema), oldRows = pool.transactionsFor(state, 'usage-current-03');
  assert.throws(() => pool.settle(state, 'usage-current-02', 'Finance', now), /awaiting settlement/);
  pool.settle(state, 'usage-current-03', 'Finance', now);
  assert.equal(state.resources[2].status, 'available');
  assert.equal(state.resources[2].currentUsageId, null);
  assert.equal(state.usages.find(row => row.id === 'usage-current-03').settledBy, 'Finance');
  pool.allocate(state, 'pool-3', owner, 'next-cycle', now);
  pool.settle(state, 'usage-current-03', 'Finance', now);
  assert.equal(state.resources[2].currentUsageId, 'next-cycle');
  assert.equal(state.resources[2].status, 'in_use');
  assert.deepEqual(pool.transactionsFor(state, 'usage-current-03'), oldRows);
  assert.equal(pool.transactionsFor(state, 'next-cycle').length, 0);
});
test('usage-scoped reports cannot include another merchant using the same MID/TID', () => {
  const state = pool.seed(schema);
  const prior = pool.transactionsFor(state, 'usage-prior-03');
  const current = pool.transactionsFor(state, 'usage-current-03');
  assert.equal(prior[0].mid, current[0].mid);
  assert.equal(current.length, 26);
  state.transactions.push({ ...prior[0], usageId: 'usage-current-03', id: 'wrong-owner' });
  assert.equal(pool.transactionsFor(state, 'usage-current-03').length, 26);
  const csv = pool.exportCSV(state, 'usage-current-03');
  assert.ok(csv.includes('TX-2-00026') && csv.includes('TX-2-00001'));
  assert.ok(!csv.includes('TX-3-') && !csv.includes('Oak Bakery') && !csv.includes('wrong-owner'));
  assert.ok(csv.includes('Failed') && csv.includes('Refund') && csv.includes('Void'));
  assert.equal(pool.statistics(current).reduce((sum, row) => sum + row.count, 0), current.length);
});
test('statistics separate currencies/types/final states; CSV escapes spreadsheet formula content', () => {
  const rows = [{ currency: 'CAD', type: 'Sale', status: 'Completed', amountMinor: 101 }, { currency: 'USD', type: 'Sale', status: 'Completed', amountMinor: 202 }, { currency: 'CAD', type: 'Sale', status: 'Failed', amountMinor: 303 }, { currency: 'CAD', type: 'Refund', status: 'Completed', amountMinor: 101 }];
  assert.equal(pool.statistics(rows).length, 4);
  const state = pool.seed(schema);
  state.usages.find(row => row.id === 'usage-current-03').merchantName = '=HYPERLINK("bad")';
  assert.ok(pool.exportCSV(state, 'usage-current-03').includes('"\'=HYPERLINK(""bad"")"'));
});
test('browser mutation reads latest state under one lock; failed storage never reports success', async () => {
  const sandbox = vm.createContext({ console, PROCESSOR_PARAMETER_SCHEMA: { 'NUVEI UPT': schema }, navigator: { locks: { request: async (key, action) => action() } }, window: { PaywizardPortalAccess: { profile: 'maintain' } }, localStorage: { getItem: () => null, setItem: () => { throw new Error('Quota'); } } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../scripts/parameter-pool-store.js'), 'utf8'), sandbox);
  await assert.rejects(sandbox.window.PaywizardParameterPool.mutate(state => { state.resources[0].name = 'Edited'; }), /could not be saved/);
});
test('concurrent browser saves serialize and only one merchant can acquire the resource', async () => {
  let stored = null, queue = Promise.resolve();
  const sandbox = vm.createContext({ PROCESSOR_PARAMETER_SCHEMA: { 'NUVEI UPT': schema }, navigator: { locks: { request: (key, action) => { const work = queue.then(action); queue = work.catch(() => {}); return work; } } }, window: { PaywizardPortalAccess: { profile: 'maintain' } }, localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; } } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../scripts/parameter-pool-store.js'), 'utf8'), sandbox);
  const api = sandbox.window.PaywizardParameterPool;
  const results = await Promise.allSettled([
    api.mutate(state => api.allocate(state, 'pool-1', owner, 'winner', now)),
    api.mutate(state => api.allocate(state, 'pool-1', { ...owner, merchantId: 'another', tci: 'TCI-OTHER' }, 'loser', now))
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(JSON.parse(stored).resources[0].currentUsageId, 'winner');
  assert.ok(!JSON.parse(stored).usages.some(row => row.id === 'loser'));
});

test('submission preserves active usage; terminal effect freezes the old usage without releasing the resource', () => {
  const state = pool.seed(schema);
  const usage = pool.allocate(state, 'pool-1', owner, 'switch-usage', now);
  const original = structuredClone(usage.parameters);
  const transaction = { id: 'old-sale', usageId: usage.id, merchantId: owner.merchantId, storeId: owner.storeId, tci: owner.tci, mid: original.mid, tid: original.tid };
  state.transactions.push(transaction);
  const values = { ...pool.defaults(schema), mid: 'OWNMID', tid: 'OWNTID' };
  pool.submitSwitch(state, owner, values, schema, 'request-1', now);
  assert.equal(usage.status, 'in_use'); assert.equal(usage.endedAt, null);
  assert.equal(pool.canFollowUp(state, transaction), true);
  assert.equal(pool.terminalFor(state, owner).parameterSource, 'pool');
  assert.throws(() => pool.submitSwitch(state, owner, values, schema, 'duplicate', now), /already awaiting/);
  pool.receiveSwitchResult(state, 'request-1', 'applied', '2026-10-16T10:00:00Z');
  assert.equal(usage.status, 'awaiting_settlement'); assert.equal(usage.frozen, true);
  assert.equal(usage.endedAt, '2026-10-16T10:00:00Z'); assert.deepEqual(usage.parameters, original);
  assert.equal(pool.canFollowUp(state, transaction), false);
  assert.equal(pool.terminalFor(state, owner).parameters.mid, 'OWNMID');
  assert.equal(state.resources[0].status, 'awaiting_settlement');
  assert.throws(() => pool.allocate(state, 'pool-1', { ...owner, tci: 'TCI-SECOND', merchantId: 'second' }, 'next', now), /no longer available/);
  pool.settle(state, usage.id, 'Finance', now);
  const next = { ...owner, tci: 'TCI-SECOND', merchantId: 'second' };
  pool.allocate(state, 'pool-1', next, 'next', now);
  pool.receiveSwitchResult(state, 'request-1', 'applied', now);
  assert.equal(state.resources[0].currentUsageId, 'next');
  assert.equal(pool.transactionsFor(state, 'next').length, 0);
  assert.deepEqual(pool.transactionsFor(state, usage.id), [transaction]);
});
test('failed deployment retains usage and original parameters; another merchant cannot switch this terminal', () => {
  const state = pool.seed(schema);
  pool.allocate(state, 'pool-1', owner, 'switch-usage', now);
  const original = structuredClone(pool.terminalFor(state, owner));
  const values = { ...pool.defaults(schema), mid: 'OWNMID', tid: 'OWNTID' };
  assert.throws(() => pool.submitSwitch(state, { ...owner, merchantId: 'wrong' }, values, schema, 'wrong', now), /no longer using/);
  assert.throws(() => pool.submitSwitch(state, owner, pool.defaults(schema), schema, 'invalid', now), /Merchant ID is required/);
  pool.submitSwitch(state, owner, values, schema, 'failed-request', now);
  pool.receiveSwitchResult(state, 'failed-request', 'failed', now);
  assert.deepEqual(pool.terminalFor(state, owner), original);
  assert.equal(state.usages[0].status, 'in_use'); assert.equal(state.usages[0].endedAt, null);
  pool.submitSwitch(state, owner, values, schema, 'retry', now);
  state.resources[0].currentUsageId = 'another-usage';
  assert.throws(() => pool.receiveSwitchResult(state, 'retry', 'applied', now), /does not match/);
  assert.equal(state.usages[0].status, 'in_use');
});
