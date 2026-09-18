const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../../scripts/advertising-domain.js');

function fixture() {
  const asset = { id: 'image', name: 'Published image', type: 'image', url: 'published.svg' };
  const state = { assets: [asset], terminals: [{ sn: 'WP001', storeId: 'shop', store: 'Central' }], stores: [{ id: 'shop', name: 'Central' }], campaigns: [], assignments: {} };
  const campaign = { id: 'campaign', name: 'Published campaign', mode: 'embedded', items: [{ assetId: asset.id, seconds: 8 }], targets: ['WP001'] };
  D.publish(state, campaign);
  return { state, campaign };
}

test('terminal summary uses the published name and media snapshot, not editable values', () => {
  const { state } = fixture();
  state.campaigns[0].name = 'Unpublished edit';
  state.campaigns[0].items = [];
  state.assets[0].name = 'Changed library name';
  state.assets[0].url = 'changed.svg';
  const summary = D.terminalAssignment(state, 'WP001');
  assert.equal(summary.published.name, 'Published campaign');
  assert.equal(summary.published.items[0].asset.name, 'Published image');
  assert.equal(summary.published.items[0].asset.url, 'published.svg');
  assert.equal(summary.storeId, null);
});

test('draft-only, stopped, and unknown terminals have no current assignment', () => {
  const { state, campaign } = fixture();
  assert.equal(D.terminalAssignment(state, 'WP999'), null);
  D.stop(state, campaign.id);
  assert.equal(D.terminalAssignment(state, 'WP001'), null);
  state.campaigns = [{ ...campaign, id: 'draft' }];
  state.assignments = { WP001: { campaignId: 'draft' } };
  assert.equal(D.terminalAssignment(state, 'WP001'), null);
});

test('store inheritance updates on directory moves and respects explicit targeting', () => {
  const { state, campaign } = fixture();
  D.publish(state, { ...campaign, targets: [], targetStores: ['shop'] });
  assert.equal(D.terminalAssignment(state, 'WP001').storeName, 'Central');
  const directory = { accounts: [{ type: 'store', id: 'new-shop', name: 'New Store' }], account: () => null, terminals: [{ sn: 'WP001', name: 'Lobby Cooler', storeId: 'new-shop', store: 'New Store', lineageKeys: [] }] };
  D.syncDirectory(state, directory);
  assert.equal(D.terminalAssignment(state, 'WP001'), null);
  D.publish(state, { ...campaign, targets: ['WP001'], targetStores: [] });
  D.syncDirectory(state, directory);
  assert.equal(D.terminalAssignment(state, 'WP001').storeId, null);
  assert.equal(state.terminals[0].name, 'Lobby Cooler');
});

test('a store conflict continues showing the existing owner, not the other intended campaign', () => {
  const { state } = fixture();
  state.terminals.push({ sn: 'WP002', storeId: 'other' });
  state.stores.push({ id: 'other', name: 'Other Store' });
  D.publish(state, { ...state.campaigns[0], id: 'other', name: 'Store campaign', targets: [], targetStores: ['other'], published: undefined });
  state.terminals[0].storeId = 'other';
  D.reconcile(state);
  assert.equal(state.targetConflicts.length, 1);
  assert.equal(D.terminalAssignment(state, 'WP001').campaignId, 'campaign');
  assert.equal(D.terminalAssignment(state, 'WP002').campaignId, 'other');
});

test('republishing updates the terminal snapshot and stopping clears it', () => {
  const { state, campaign } = fixture();
  D.publish(state, { ...campaign, name: 'New publication' });
  assert.equal(D.terminalAssignment(state, 'WP001').published.version, 2);
  assert.equal(D.terminalAssignment(state, 'WP001').published.name, 'New publication');
  D.stop(state, campaign.id);
  assert.equal(D.terminalAssignment(state, 'WP001'), null);
});
