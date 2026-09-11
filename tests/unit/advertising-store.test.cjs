const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, statSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const D = require('../../scripts/advertising-domain.js');
const source = readFileSync(resolve(__dirname, '../../scripts/advertising-store.js'), 'utf8');

function store(initial) {
  let raw = initial ? JSON.stringify(initial) : null;
  const context = {
    window: { PaywizardAdvertisingDomain: D },
    localStorage: { getItem: () => raw, setItem: (_, value) => { raw = value; } }
  };
  vm.runInNewContext(source, context);
  return context.window.PaywizardAdvertisingStore;
}

function legacy() {
  const state = D.copy(store().read());
  delete state.sampleCatalogVersion;
  delete state.sampleVideoCatalogVersion;
  state.assets = state.assets.filter(asset => !asset.id.startsWith('sample-'));
  state.campaigns = state.campaigns.filter(campaign => !campaign.id.startsWith('sample-'));
  return state;
}

test('fresh browsers get 20 different image sizes and eight linked, unassigned draft campaigns', () => {
  const state = store().read();
  assert.equal(state.assets.length, 32);
  assert.equal(state.campaigns.length, 17);
  const assets = state.assets.filter(asset => asset.id.startsWith('sample-') && asset.type === 'image');
  const campaigns = state.campaigns.filter(campaign => campaign.id.startsWith('sample-') && campaign.mediaType === 'image');
  assert.equal(new Set(assets.map(asset => `${asset.width}x${asset.height}`)).size, 20);
  assert.equal(assets.filter(asset => asset.width === asset.height).length, 5);
  for (const asset of assets) {
    assert.equal(statSync(resolve(__dirname, '../..', asset.url)).size, asset.bytes);
    assert.ok(campaigns.some(campaign => campaign.items.some(item => item.assetId === asset.id)));
  }
  for (const campaign of campaigns) {
    assert.equal(campaign.published, undefined);
    assert.equal(campaign.targets.length, 0);
    assert.equal(campaign.targetStores.length, 0);
    for (const item of campaign.items) assert.ok(assets.some(asset => asset.id === item.assetId));
    assert.equal(D.validate({ ...campaign, targets: [state.terminals[0].sn] }, state.assets, state.terminals), '');
  }
  assert.deepEqual(D.copy(state.assignments), legacy().assignments);
});

test('existing browsers retain uploads, edits, deletions, published snapshots and terminal assignments', () => {
  const before = legacy();
  before.assets[0].name = 'My renamed coffee';
  before.assets.push({ id: 'uploaded-image', name: 'Customer upload', type: 'image', mime: 'image/png', width: 321, height: 456, bytes: 1234 });
  before.campaigns[0].items[0].seconds = 19;
  before.campaigns[1].name = 'My lunch draft';
  before.campaigns[1].items = [{ assetId: 'fresh', seconds: 9 }];
  before.assets = before.assets.filter(asset => asset.id !== 'bun');
  const saved = D.copy(store(before).read());
  assert.deepEqual(saved.assets.filter(asset => !asset.id.startsWith('sample-')), before.assets);
  assert.deepEqual(saved.campaigns.filter(campaign => !campaign.id.startsWith('sample-')), before.campaigns);
  assert.deepEqual(saved.terminals, before.terminals);
  assert.deepEqual(saved.assignments, before.assignments);
  D.reconcile(saved);
  assert.deepEqual(saved.assignments, before.assignments);
  assert.equal(saved.assets.length, before.assets.length + 28);
  assert.equal(saved.campaigns.length, before.campaigns.length + 14);
});

test('repeated reads do not duplicate samples or restore samples removed after migration', () => {
  const S = store(legacy());
  const state = D.copy(S.read());
  state.assets.find(asset => asset.id === 'sample-square-native').name = 'Edited square';
  state.campaigns = state.campaigns.filter(campaign => campaign.id !== 'sample-mixed-uploads');
  state.assets = state.assets.filter(asset => asset.id !== 'sample-tiny-portrait');
  state.assets.find(asset => asset.id === 'sample-video-coffee-pour').name = 'My coffee clip';
  state.campaigns = state.campaigns.filter(campaign => campaign.id !== 'sample-video-mixed');
  state.campaigns.forEach(campaign => { campaign.items = campaign.items.filter(item => item.assetId !== 'sample-video-corgi-lowres'); });
  state.assets = state.assets.filter(asset => asset.id !== 'sample-video-corgi-lowres');
  S.save(state);
  for (let i = 0; i < 3; i++) {
    const reread = D.copy(S.read());
    assert.deepEqual(reread, state);
    S.save(reread);
  }
});

test('pre-existing sample IDs are preserved when an unmarked catalog is merged', () => {
  const state = legacy();
  const asset = { id: 'sample-square-native', name: 'Custom square', type: 'image', width: 77, height: 77 };
  const campaign = { id: 'sample-square-fit', name: 'Custom campaign', items: [], targets: [] };
  state.assets.push(asset);
  state.campaigns.push(campaign);
  const merged = D.copy(store(state).read());
  assert.equal(merged.assets.length, 32);
  assert.equal(merged.campaigns.length, 17);
  assert.deepEqual(merged.assets.find(item => item.id === asset.id), asset);
  assert.deepEqual(merged.campaigns.find(item => item.id === campaign.id), campaign);
});

test('schema 1 data still upgrades its existing assignment before adding samples', () => {
  const state = legacy();
  state.schema = 1;
  state.deployments = Object.fromEntries(Object.entries(state.assignments).map(([sn, assignment]) => [sn, { ...assignment, stopped: false }]));
  const assignments = D.copy(state.assignments);
  delete state.assignments;
  const upgraded = D.copy(store(state).read());
  assert.equal(upgraded.schema, 2);
  assert.deepEqual(upgraded.assignments, assignments);
  assert.equal(upgraded.assets.length, 32);
  assert.equal(upgraded.campaigns.length, 17);
});

test('video samples have playable file metadata, covers and video-only full-screen drafts', () => {
  const state = store().read();
  const videos = state.assets.filter(asset => asset.id.startsWith('sample-video-'));
  const campaigns = state.campaigns.filter(campaign => campaign.id.startsWith('sample-video-'));
  assert.equal(videos.length, 8);
  assert.equal(campaigns.length, 6);
  assert.equal(videos.filter(asset => asset.width === asset.height).length, 2);
  assert.deepEqual([...new Set(videos.map(asset => asset.mime))].sort(), ['video/mp4', 'video/webm']);
  for (const asset of videos) {
    assert.equal(asset.type, 'video');
    assert.equal(statSync(resolve(__dirname, '../..', asset.url)).size, asset.bytes);
    assert.ok(statSync(resolve(__dirname, '../..', asset.poster)).size > 0);
    assert.ok(asset.bytes < 50 * 1024 * 1024);
    assert.ok(asset.seconds >= 5 && asset.seconds <= 13);
    assert.ok(campaigns.some(campaign => campaign.items.some(item => item.assetId === asset.id)));
  }
  for (const campaign of campaigns) {
    assert.equal(campaign.mode, 'fullscreen');
    assert.equal(campaign.mediaType, 'video');
    assert.equal(campaign.published, undefined);
    assert.equal(campaign.targets.length, 0);
    assert.equal(campaign.targetStores.length, 0);
    for (const item of campaign.items) {
      const asset = videos.find(video => video.id === item.assetId);
      assert.ok(asset);
      assert.equal(item.seconds, asset.seconds);
    }
    assert.equal(D.validate({ ...campaign, targets: [state.terminals[0].sn] }, state.assets, state.terminals), '');
  }
});

test('adding videos to the image catalog preserves image edits and deletions without replaying its batch', () => {
  const before = D.copy(store().read());
  delete before.sampleVideoCatalogVersion;
  before.assets = before.assets.filter(asset => !asset.id.startsWith('sample-video-') && asset.id !== 'sample-tiny-portrait');
  before.campaigns = before.campaigns.filter(campaign => !campaign.id.startsWith('sample-video-'));
  before.campaigns.forEach(campaign => { campaign.items = campaign.items.filter(item => item.assetId !== 'sample-tiny-portrait'); });
  before.assets.find(asset => asset.id === 'sample-square-native').name = 'My square image';
  before.campaigns.find(campaign => campaign.id === 'sample-square-fit').name = 'My square campaign';
  const saved = D.copy(store(before).read());
  assert.deepEqual(saved.assets.filter(asset => !asset.id.startsWith('sample-video-')), before.assets);
  assert.deepEqual(saved.campaigns.filter(campaign => !campaign.id.startsWith('sample-video-')), before.campaigns);
  assert.deepEqual(saved.assignments, before.assignments);
  assert.equal(saved.assets.length, before.assets.length + 8);
  assert.equal(saved.campaigns.length, before.campaigns.length + 6);
  assert.equal(saved.sampleCatalogVersion, 1);
  assert.equal(saved.sampleVideoCatalogVersion, 1);
});
