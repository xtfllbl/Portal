const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../../scripts/advertising-domain.js');

function fixture() {
  const state = { assets: [{ id: 'image', type: 'image', name: 'Coffee', url: '/coffee.png' }, { id: 'video', type: 'video', name: 'Coffee video' }], terminals: [{ sn: 'online', online: true }, { sn: 'offline', online: false }], campaigns: [], deployments: {} };
  const campaign = { id: 'c1', name: 'Coffee break', mode: 'embedded', mediaType: 'image', items: [{ assetId: 'image', seconds: 8 }], targets: ['online', 'offline'], idleSeconds: 30, alwaysOn: true };
  return { state, campaign };
}

test('publishing and editing drafts never overwrite the active terminal snapshot', () => {
  const { state, campaign } = fixture();
  const saved = D.publish(state, campaign);
  assert.equal(state.deployments.offline.status, 'Waiting for connection');
  assert.equal(state.deployments.online.active, null);
  D.sync(state, 'online', 'success');
  saved.items[0].seconds = 15;
  state.assets[0].name = 'Edited asset';
  assert.equal(state.deployments.online.active.items[0].seconds, 8);
  assert.equal(state.deployments.online.active.items[0].asset.name, 'Coffee');
  D.publish(state, saved);
  assert.equal(state.deployments.online.requested.version, 2);
  assert.equal(state.deployments.online.active.version, 1);
  for (const outcome of ['offline', 'failed', 'busy']) {
    D.sync(state, 'online', outcome);
    assert.equal(state.deployments.online.active.version, 1);
  }
  D.sync(state, 'online', 'success');
  assert.equal(state.deployments.online.active.version, 2);
  assert.equal(state.deployments.online.active.items[0].seconds, 15);
});

test('each terminal has one campaign and switching requires stopping the previous deployment', () => {
  const { state, campaign } = fixture();
  D.publish(state, campaign); D.sync(state, 'online', 'success');
  assert.throws(() => D.publish(state, { ...campaign, id: 'c2' }), /already has another campaign/);
  D.stop(state, campaign.id);
  assert.equal(state.deployments.online.status, 'Stop pending');
  assert.ok(state.deployments.online.active);
  D.sync(state, 'online', 'offline');
  assert.ok(state.deployments.online.active);
  D.sync(state, 'online', 'success');
  assert.equal(state.deployments.online.active, null);
  assert.equal(state.deployments.online.status, 'Stopped');
  D.publish(state, { ...campaign, id: 'c2' });
  assert.equal(state.deployments.online.campaignId, 'c2');
});

test('removing a target queues a stop while keeping the active version until acknowledgement', () => {
  const { state, campaign } = fixture();
  D.publish(state, campaign); D.sync(state, 'online', 'success');
  D.publish(state, { ...campaign, targets: ['offline'] });
  assert.equal(state.deployments.online.stopped, true);
  assert.ok(state.deployments.online.active);
  D.sync(state, 'online', 'success');
  assert.equal(state.deployments.online.active, null);
});

test('publishing rejects wrong media, empty targets, bad durations and reversed schedules', () => {
  const { state, campaign } = fixture();
  for (const changed of [
    { mode: 'embedded', mediaType: 'video' },
    { items: [{ assetId: 'missing', seconds: 8 }] },
    { items: [{ assetId: 'video', seconds: 8 }] },
    { items: [{ assetId: 'image', seconds: 2 }] },
    { items: [{ assetId: 'image', seconds: 8.5 }] },
    { targets: [] }, { targets: ['unknown'] },
    { mode: 'fullscreen', idleSeconds: 0 },
    { alwaysOn: false, start: '2026-09-10T10:00:00Z', end: '2026-09-10T09:00:00Z' }
  ]) assert.throws(() => D.publish(state, { ...campaign, ...changed }));
  assert.equal(state.campaigns.length, 0);
  assert.equal(D.validate({ ...campaign, mode: 'fullscreen', mediaType: 'video', items: [{ assetId: 'video', seconds: 6 }] }, state.assets, state.terminals), '');
});

test('schedule is inclusive at the start and exclusive at the end', () => {
  const c = { alwaysOn: false, start: '2026-09-10T10:00:00Z', end: '2026-09-10T11:00:00Z' };
  assert.equal(D.scheduled(c, Date.parse(c.start) - 1), false);
  assert.equal(D.scheduled(c, Date.parse(c.start)), true);
  assert.equal(D.scheduled(c, Date.parse(c.end) - 1), true);
  assert.equal(D.scheduled(c, Date.parse(c.end)), false);
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
