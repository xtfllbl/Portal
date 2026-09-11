(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaywizardAdvertisingDomain = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const modeLabel = campaign => campaign.mode === 'embedded' ? 'Idle screen' : campaign.mediaType === 'video' ? 'Full-screen video' : 'Full-screen images';
  const mediaType = (campaign, assets) => campaign.items.map(item => assets.find(asset => asset.id === item.assetId) || item.asset).find(Boolean)?.type || null;
  function normalize(campaign, assets) {
    return { ...copy(campaign), targets: [...new Set(campaign.targets || [])], targetStores: [...new Set(campaign.targetStores || [])], mediaType: mediaType(campaign, assets) || 'image', order: 'sequential', alwaysOn: true, start: '', end: '' };
  }
  const inScope = (entity, accountKey) => !accountKey || entity.accountKeys?.includes(accountKey);
  function resolveTargets(campaign, terminals) {
    const stores = new Set(campaign.targetStores || []);
    return [...new Set([...(campaign.targets || []), ...terminals.filter(t => stores.has(t.storeId) && inScope(t, campaign.accountKey)).map(t => t.sn)])];
  }
  function validate(campaign, assets, terminals, stores = []) {
    if (!campaign.name.trim()) return 'Enter a campaign name.';
    if (!['embedded', 'fullscreen'].includes(campaign.mode)) return 'Select a display mode.';
    const type = mediaType(campaign, assets);
    if (campaign.mode === 'embedded' && type === 'video') return 'Idle-screen campaigns support images only.';
    if (campaign.mode === 'fullscreen' && (!Number.isInteger(campaign.idleSeconds) || campaign.idleSeconds < 5 || campaign.idleSeconds > 600)) return 'Idle time must be a whole number from 5 to 600 seconds.';
    if (!campaign.items.length) return 'Add at least one compatible media item to the playlist.';
    for (const item of campaign.items) {
      const asset = assets.find(a => a.id === item.assetId);
      if (!asset) return 'A playlist item is missing. Remove it or upload the media again.';
      if (!['image', 'video'].includes(asset.type) || asset.type !== type) return 'Use only images or only videos in one playlist.';
      if (asset.type === 'image' && (!Number.isInteger(item.seconds) || item.seconds < 3 || item.seconds > 120)) return 'Each image duration must be a whole number from 3 to 120 seconds.';
    }
    if (!campaign.targets.length && !campaign.targetStores?.length) return 'Select at least one store or terminal.';
    if (campaign.targets.some(sn => !terminals.some(t => t.sn === sn && inScope(t, campaign.accountKey)))) return 'One of the selected terminals is no longer available.';
    if ((campaign.targetStores || []).some(id => !stores.some(s => s.id === id && inScope(s, campaign.accountKey)))) return 'One of the selected stores is no longer available.';
    return '';
  }
  function conflicts(state, campaign) {
    const targets = resolveTargets(campaign, state.terminals);
    return Object.values(state.assignments || {}).filter(a => targets.includes(a.sn) && a.campaignId !== campaign.id);
  }
  function storeConflicts(state, campaign) {
    return state.campaigns.filter(c => c.id !== campaign.id && c.published && !c.publicationStopped && (c.published.targetStores || []).some(id => campaign.targetStores?.includes(id)));
  }
  function targetAvailability(state, campaign) {
    const active = state.campaigns.filter(c => c.published && !c.publicationStopped);
    const activeIds = new Set(active.map(c => c.id));
    const terminals = new Map(state.terminals.map(t => {
      const assigned = state.assignments?.[t.sn]?.campaignId;
      const owner = activeIds.has(assigned) ? assigned : null;
      return [t.sn, { owner, blocked: !!owner && owner !== campaign.id }];
    }));
    const stores = new Map((state.stores || []).map(store => {
      const members = state.terminals.filter(t => t.storeId === store.id).map(t => terminals.get(t.sn));
      const storeOwners = active.filter(c => c.published.targetStores?.includes(store.id)).map(c => c.id);
      const owners = [...new Set([...storeOwners, ...members.map(t => t.owner).filter(Boolean)])];
      const otherOwners = owners.filter(id => id !== campaign.id);
      return [store.id, { total: members.length, assigned: members.filter(t => t.owner).length, conflicting: members.filter(t => t.blocked).length, storeOwners, owners, otherOwners, blocked: otherOwners.length > 0 }];
    }));
    return { stores, terminals };
  }
  function saveDraft(state, campaign, now = new Date().toISOString()) {
    if (campaign.published || state.campaigns.some(c => c.id === campaign.id && c.published)) throw new Error('Published campaigns must be updated through Review & Publish.');
    if (!campaign.name.trim()) throw new Error('Enter a campaign name.');
    const saved = { ...normalize(campaign, state.assets), updatedAt: now };
    state.campaigns = state.campaigns.filter(c => c.id !== saved.id).concat(saved);
    return saved;
  }
  // Keep existing owners when a new store member overlaps another campaign.
  // Only published scopes enroll terminals; editable drafts never change assignments.
  function reconcile(state) {
    state.assignments ||= {};
    const campaigns = state.campaigns.filter(c => c.published && !c.publicationStopped);
    const wanted = new Map(campaigns.map(c => [c.id, resolveTargets(c.published, state.terminals).filter(sn => state.terminals.some(t => t.sn === sn && inScope(t, c.published.accountKey)))]));
    for (const [sn, assignment] of Object.entries(state.assignments)) {
      if (!wanted.get(assignment.campaignId)?.includes(sn)) delete state.assignments[sn];
    }
    state.targetConflicts = [];
    for (const c of campaigns) for (const sn of wanted.get(c.id)) {
      const owner = state.assignments[sn];
      if (owner && owner.campaignId !== c.id) {
        state.targetConflicts.push({ campaignId: c.id, sn, otherCampaignId: owner.campaignId });
      } else state.assignments[sn] = { sn, campaignId: c.id };
    }
  }
  // One-time upgrade: retain saved media, drafts, publications, scopes and owners.
  // Device acknowledgements and their simulated download states are retired.
  function upgrade(value) {
    const state = copy(value);
    if (state.schema === 1) {
      state.assignments = {};
      for (const c of state.campaigns) {
        const previous = Object.values(state.deployments || {}).filter(d => d.campaignId === c.id);
        if (c.publicationStopped === undefined && previous.length && previous.every(d => d.stopped)) c.publicationStopped = true;
      }
      for (const d of Object.values(state.deployments || {})) {
        if (!d.stopped && state.campaigns.some(c => c.id === d.campaignId && c.published && !c.publicationStopped)) state.assignments[d.sn] = { sn: d.sn, campaignId: d.campaignId };
      }
      delete state.deployments;
      state.schema = 2;
    }
    return state;
  }
  function publish(state, campaign, now = new Date().toISOString()) {
    campaign = normalize(campaign, state.assets);
    const error = validate(campaign, state.assets, state.terminals, state.stores);
    if (error) throw new Error(error);
    if (conflicts(state, campaign).length) throw new Error('A target terminal already has another campaign. Stop that campaign before assigning this campaign.');
    if (storeConflicts(state, campaign).length) throw new Error('A selected store already has another campaign. Stop that campaign before assigning this store.');
    const previous = state.campaigns.find(c => c.id === campaign.id);
    const version = (previous?.published?.version || 0) + 1;
    const snapshot = { ...copy(campaign), version, publishedAt: now };
    delete snapshot.published;
    delete snapshot.publicationStopped;
    snapshot.items = snapshot.items.map(i => ({ ...i, asset: copy(state.assets.find(a => a.id === i.assetId)) }));
    const saved = { ...copy(campaign), published: snapshot, publicationStopped: false, updatedAt: now };
    state.campaigns = state.campaigns.filter(c => c.id !== saved.id).concat(saved);
    reconcile(state);
    return saved;
  }
  function stop(state, campaignId) {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (campaign) campaign.publicationStopped = true;
    reconcile(state);
  }
  function inUse(state, assetId) {
    return state.campaigns.some(c => c.items.some(i => i.assetId === assetId) || c.published?.items.some(i => i.assetId === assetId));
  }
  return { copy, modeLabel, mediaType, normalize, inScope, resolveTargets, validate, conflicts, storeConflicts, targetAvailability, saveDraft, reconcile, upgrade, publish, stop, inUse };
});
