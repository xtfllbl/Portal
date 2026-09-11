const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../../scripts/customer-account-data.js');
const { create } = require('../../scripts/customer-account-directory.js');
const directory = create(data.createHierarchy());

test('provider and nested agent scopes include only their own descendant terminals', () => {
  const provider = directory.terminalsFor('provider:sp-universal').map(t => t.sn);
  assert.ok(provider.includes('WP6267UQ36002376'));
  assert.ok(provider.includes('DEMO-AGT3-001'));
  const agent = directory.terminalsFor('agent:demo-agent-l2').map(t => t.sn);
  assert.deepEqual(agent, ['DEMO-AGT2-001', 'DEMO-AGT3-001']);
  assert.ok(!agent.includes('DEMO-AGT1-001'));
  assert.ok(directory.terminalsFor('provider:sp-north-america').every(t => !provider.includes(t.sn)));
  assert.deepEqual(directory.terminalsFor('provider:unknown'), []);
});

test('merchant and store scopes resolve stable IDs, independently of display names', () => {
  const merchant = directory.terminalsFor('merchant:merchant-kind-world').map(t => t.sn);
  const store = directory.terminalsFor('store:s-midtown').map(t => t.sn);
  assert.equal(merchant.length, 4);
  assert.equal(store.length, 3);
  assert.ok(merchant.includes('BOS-Q3-0018'));
  assert.ok(!store.includes('BOS-Q3-0018'));
  assert.deepEqual(directory.terminalsFor('merchant:1 of a Kind World Travel LLC'), []);
});

test('tree search retains ancestor paths and limits group selection to matching descendants', () => {
  const tree = directory.tree('provider:sp-universal', 'WP6267UQ36002376');
  assert.deepEqual(tree.terminalIds, ['WP6267UQ36002376']);
  assert.equal(tree.children[0].id, 'merchant-kind-world');
  assert.equal(tree.children[0].children[0].id, 's-midtown');
  assert.equal(directory.tree('store:s-midtown', 'BOS-Q3-0018'), null);
  assert.equal(directory.tree('provider:sp-universal', 'Midtown Store').terminalIds.length, 3);
});
