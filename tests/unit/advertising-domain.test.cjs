const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../../scripts/advertising-domain.js');

function fixture() {
  const state = { assets: [{ id: 'image', type: 'image', name: 'Coffee', url: '/coffee.png' }, { id: 'video', type: 'video', name: 'Coffee video' }], terminals: [{ sn: 'online', online: true }, { sn: 'offline', online: false }], campaigns: [], assignments: {} };
  const campaign = { id: 'c1', name: 'Coffee break', mode: 'embedded', mediaType: 'image', items: [{ assetId: 'image', seconds: 8 }], targets: ['online', 'offline'], idleSeconds: 30, alwaysOn: true };
  return { state, campaign };
}

test('in-memory edits preserve the published snapshot until the next publication', () => {
  const { state, campaign } = fixture();
  const saved = D.publish(state, campaign);
  saved.items[0].seconds = 15;
  state.assets[0].name = 'Edited asset';
  D.reconcile(state);
  assert.equal(saved.published.items[0].seconds, 8);
  assert.equal(saved.published.items[0].asset.name, 'Coffee');
  assert.equal(state.assignments.online.campaignId, campaign.id);
  assert.equal(state.assignments.offline.campaignId, campaign.id);
  const next = D.publish(state, saved);
  assert.equal(next.published.version, 2);
  assert.equal(next.published.items[0].seconds, 15);
  assert.equal(next.published.items[0].asset.name, 'Edited asset');
});

test('only unpublished campaigns can save drafts, including incomplete playlists and targets', () => {
  const { state, campaign } = fixture();
  const draft = D.saveDraft(state, { ...campaign, items: [], targets: [] });
  assert.equal(draft.published, undefined);
  assert.equal(state.campaigns[0].id, campaign.id);
  const published = D.publish(state, campaign);
  const before = D.copy(state);
  assert.throws(() => D.saveDraft(state, { ...campaign, name: 'Stale draft' }), /Published campaigns/);
  assert.throws(() => D.saveDraft(state, published), /Published campaigns/);
  assert.deepEqual(state, before);
  D.stop(state, campaign.id);
  assert.throws(() => D.saveDraft(state, campaign), /Published campaigns/);
  const updated = D.publish(state, { ...campaign, name: 'Updated campaign' });
  assert.equal(updated.published.version, 2);
  assert.equal(updated.name, 'Updated campaign');
});

test('each terminal has one campaign and stopping releases its assignment', () => {
  const { state, campaign } = fixture();
  D.publish(state, campaign);
  assert.throws(() => D.publish(state, { ...campaign, id: 'c2' }), /already has another campaign/);
  D.stop(state, campaign.id);
  assert.equal(state.assignments.online, undefined);
  assert.equal(state.campaigns[0].publicationStopped, true);
  D.publish(state, { ...campaign, id: 'c2' });
  assert.equal(state.assignments.online.campaignId, 'c2');
});

test('republishing with fewer targets releases removed terminals', () => {
  const { state, campaign } = fixture();
  D.publish(state, campaign);
  D.publish(state, { ...campaign, targets: ['offline'] });
  assert.equal(state.assignments.online, undefined);
  assert.equal(state.assignments.offline.campaignId, campaign.id);
});

test('publishing rejects mixed media, video on idle screens, empty targets and bad durations', () => {
  const { state, campaign } = fixture();
  for (const changed of [
    { mode: 'embedded', mediaType: 'video', items: [{ assetId: 'video', seconds: 6 }] },
    { mode: 'fullscreen', items: [{ assetId: 'image', seconds: 8 }, { assetId: 'video', seconds: 6 }] },
    { items: [{ assetId: 'missing', seconds: 8 }] },
    { items: [{ assetId: 'video', seconds: 8 }] },
    { items: [{ assetId: 'image', seconds: 2 }] },
    { items: [{ assetId: 'image', seconds: 8.5 }] },
    { targets: [] }, { targets: ['unknown'] },
    { mode: 'fullscreen', idleSeconds: 0 }
  ]) assert.throws(() => D.publish(state, { ...campaign, ...changed }));
  assert.equal(state.campaigns.length, 0);
  assert.equal(D.validate({ ...campaign, mode: 'fullscreen', mediaType: 'video', items: [{ assetId: 'video', seconds: 6 }] }, state.assets, state.terminals), '');
});

test('media type follows the actual playlist and obsolete playback controls cannot affect a new version', () => {
  const { state, campaign } = fixture();
  const legacy = { ...campaign, mode: 'fullscreen', mediaType: 'image', order: 'shuffle', alwaysOn: false, start: '2000-01-01', end: '2000-01-02', items: [{ assetId: 'video', seconds: 6 }] };
  assert.equal(D.mediaType({ ...campaign, items: [] }, state.assets), null);
  const saved = D.publish(state, legacy);
  assert.equal(saved.mediaType, 'video');
  assert.equal(saved.order, 'sequential');
  assert.equal(saved.alwaysOn, true);
  assert.equal(saved.start, '');
  assert.equal(saved.end, '');
  assert.equal(legacy.order, 'shuffle');
  assert.equal(legacy.alwaysOn, false);
});

test('published media remains protected after the editable playlist changes', () => {
  const { state, campaign } = fixture();
  const saved = D.publish(state, campaign);
  saved.items = [];
  assert.equal(D.inUse(state, 'image'), true);
  assert.equal(D.inUse(state, 'video'), false);
});


test('campaigns publish with a name and preserve optional legacy advertiser data', () => {
  const { state, campaign } = fixture();
  assert.throws(() => D.publish(state, { ...campaign, name: '   ' }), /campaign name/);
  assert.equal(D.publish(state, campaign).name, 'Coffee break');
  assert.equal(D.publish(state, { ...campaign, advertiser: 'Legacy brand' }).advertiser, 'Legacy brand');
});

function storeFixture() {
  const { state, campaign } = fixture();
  state.stores = [{ id: 'midtown', accountKeys: ['provider:p', 'merchant:m', 'store:midtown'] }, { id: 'empty', accountKeys: ['provider:p', 'merchant:m', 'store:empty'] }];
  state.terminals.forEach(t => Object.assign(t, { storeId: 'midtown', accountKeys: state.stores[0].accountKeys }));
  Object.assign(campaign, { targets: [], targetStores: ['midtown'], accountKey: 'provider:p' });
  return { state, campaign };
}

test('store availability reports occupied member counts and distinguishes the current campaign', () => {
  const { state, campaign } = storeFixture();
  D.publish(state, { ...campaign, targetStores: [], targets: ['online'] });
  const other = { ...campaign, id: 'other' };
  const available = D.targetAvailability(state, other);
  const store = available.stores.get('midtown');
  assert.equal(store.total, 2);
  assert.equal(store.assigned, 1);
  assert.equal(store.conflicting, 1);
  assert.equal(store.blocked, true);
  assert.deepEqual(store.otherOwners, [campaign.id]);
  assert.deepEqual(store.storeOwners, []);
  assert.equal(available.terminals.get('online').blocked, true);
  assert.equal(available.terminals.get('offline').blocked, false);
  const own = D.targetAvailability(state, campaign);
  assert.equal(own.stores.get('midtown').blocked, false);
  assert.equal(own.stores.get('midtown').conflicting, 0);
  assert.equal(own.terminals.get('online').blocked, false);
});

test('whole-store claims are visible even with no terminals and are released on stop', () => {
  const { state, campaign } = storeFixture();
  D.publish(state, { ...campaign, targetStores: ['empty'] });
  D.saveDraft(state, { ...campaign, id: 'draft-only' });
  const other = { ...campaign, id: 'other' };
  const available = D.targetAvailability(state, other);
  assert.equal(available.stores.get('empty').blocked, true);
  assert.equal(available.stores.get('empty').total, 0);
  assert.deepEqual(available.stores.get('empty').storeOwners, [campaign.id]);
  assert.equal(available.stores.get('midtown').blocked, false);
  assert.equal(D.targetAvailability(state, campaign).stores.get('empty').blocked, false);
  D.stop(state, campaign.id);
  assert.equal(D.targetAvailability(state, other).stores.get('empty').blocked, false);
});

test('store targeting persists the store, deduplicates mixed targets, and enrolls future terminals', () => {
  const { state, campaign } = storeFixture();
  campaign.targets = ['online'];
  const saved = D.publish(state, campaign);
  assert.deepEqual(saved.targetStores, ['midtown']);
  assert.equal(D.resolveTargets(saved, state.terminals).length, 2);
  assert.equal(Object.keys(state.assignments).length, 2);
  saved.targetStores = []; // An unpublished edit must not change published targeting.
  state.terminals.push({ sn: 'new', storeId: 'midtown', accountKeys: ['provider:p', 'merchant:m', 'store:midtown'], online: true });
  D.reconcile(state);
  assert.equal(state.assignments.new.campaignId, campaign.id);
  state.terminals.find(t => t.sn === 'new').storeId = 'empty';
  D.reconcile(state);
  assert.equal(state.assignments.new, undefined);
});

test('a newly joined occupied terminal keeps its original ad and reports a separate conflict', () => {
  const { state, campaign } = storeFixture();
  state.terminals.push({ sn: 'occupied', storeId: 'elsewhere', accountKeys: ['provider:p'], online: true });
  D.publish(state, { ...campaign, id: 'other', targetStores: [], targets: ['occupied'] });
  D.publish(state, campaign);
  state.terminals.find(t => t.sn === 'occupied').storeId = 'midtown';
  D.reconcile(state);
  assert.equal(state.assignments.occupied.campaignId, 'other');
  assert.deepEqual(state.targetConflicts, [{ campaignId: campaign.id, sn: 'occupied', otherCampaignId: 'other' }]);
  assert.equal(state.assignments.online.campaignId, campaign.id);
  D.stop(state, 'other'); D.reconcile(state);
  assert.equal(state.assignments.occupied.campaignId, campaign.id);
  assert.deepEqual(state.targetConflicts, []);
});

test('existing store conflicts block publication without partially assigning free terminals', () => {
  const { state, campaign } = storeFixture();
  D.publish(state, { ...campaign, id: 'other', targetStores: [], targets: ['online'] });
  assert.throws(() => D.publish(state, campaign), /another campaign/);
  assert.equal(state.assignments.offline, undefined);
  assert.equal(state.campaigns.length, 1);
});

test('empty stores can be published, cannot be claimed twice, and stop cancels future enrollment', () => {
  const { state, campaign } = storeFixture();
  campaign.targetStores = ['empty'];
  D.publish(state, campaign);
  assert.equal(Object.keys(state.assignments).length, 0);
  assert.throws(() => D.publish(state, { ...campaign, id: 'other' }), /store already has another campaign/);
  D.stop(state, campaign.id);
  state.terminals.push({ sn: 'future', storeId: 'empty', accountKeys: ['provider:p'], online: true });
  D.reconcile(state);
  assert.equal(state.assignments.future, undefined);
  D.publish(state, campaign);
  assert.equal(state.assignments.future.campaignId, campaign.id);
});

test('store scopes and future membership cannot cross the publishing account boundary', () => {
  const { state, campaign } = storeFixture();
  assert.throws(() => D.publish(state, { ...campaign, targetStores: ['unknown'] }), /store.*available/);
  assert.throws(() => D.publish(state, { ...campaign, accountKey: 'provider:other' }), /store.*available/);
  D.publish(state, campaign);
  state.terminals.find(t => t.sn === 'online').accountKeys = ['provider:other'];
  D.reconcile(state);
  assert.equal(state.assignments.online, undefined);
  state.terminals.push({ sn: 'outsider', storeId: 'midtown', accountKeys: ['provider:other'] });
  D.reconcile(state);
  assert.equal(state.assignments.outsider, undefined);
});

test('upgrading saved data removes sync records while preserving drafts, media, scopes and original owners', () => {
  const { state, campaign } = storeFixture();
  state.terminals.push({ sn: 'occupied', storeId: 'elsewhere', accountKeys: ['provider:p'] });
  D.publish(state, { ...campaign, id: 'other', targets: ['occupied'], targetStores: [] });
  const saved = D.publish(state, campaign);
  state.terminals.find(t => t.sn === 'occupied').storeId = 'midtown';
  saved.name = 'Edited draft'; saved.items[0].seconds = 20;
  state.assets.push({ id: 'upload', name: 'Uploaded file.png', type: 'image' });
  const legacy = D.copy(state); legacy.schema = 1;
  legacy.deployments = Object.fromEntries(Object.values(state.assignments).map(a => [a.sn, { ...a, stopped: false, requested: state.campaigns.find(c => c.id === a.campaignId).published, active: null, status: 'Queued' }]));
  delete legacy.assignments;
  const upgraded = D.upgrade(legacy); D.reconcile(upgraded);
  assert.equal(upgraded.schema, 2);
  assert.equal(upgraded.deployments, undefined);
  assert.equal(upgraded.assets.at(-1).id, 'upload');
  assert.equal(upgraded.campaigns.find(c => c.id === campaign.id).name, 'Edited draft');
  assert.equal(upgraded.campaigns.find(c => c.id === campaign.id).published.items[0].seconds, 8);
  assert.deepEqual(upgraded.campaigns.find(c => c.id === campaign.id).targetStores, ['midtown']);
  assert.equal(upgraded.assignments.occupied.campaignId, 'other');
  assert.equal(upgraded.targetConflicts.length, 1);
  assert.ok(legacy.deployments);
  assert.deepEqual(D.upgrade(upgraded), upgraded);
});

test('stopped legacy campaigns remain stopped after upgrade and reconciliation', () => {
  const { state, campaign } = fixture();
  D.publish(state, campaign);
  const legacy = { ...state, schema: 1, deployments: { online: { sn: 'online', campaignId: campaign.id, stopped: true } } };
  delete legacy.campaigns[0].publicationStopped; delete legacy.assignments;
  const upgraded = D.upgrade(legacy); D.reconcile(upgraded);
  assert.equal(upgraded.campaigns[0].publicationStopped, true);
  assert.deepEqual(upgraded.assignments, {});
});
