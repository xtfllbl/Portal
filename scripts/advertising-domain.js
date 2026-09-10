(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaywizardAdvertisingDomain = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const modeLabel = campaign => campaign.mode === 'embedded' ? 'Payment screen' : campaign.mediaType === 'video' ? 'Full-screen video' : 'Full-screen images';
  function validate(campaign, assets, terminals) {
    if (!campaign.name.trim()) return 'Enter a campaign name.';
    if (!['embedded', 'fullscreen'].includes(campaign.mode)) return 'Select a display mode.';
    if (!['image', 'video'].includes(campaign.mediaType) || (campaign.mode === 'embedded' && campaign.mediaType !== 'image')) return 'Payment-screen campaigns support images only.';
    if (campaign.mode === 'fullscreen' && (!Number.isInteger(campaign.idleSeconds) || campaign.idleSeconds < 5 || campaign.idleSeconds > 600)) return 'Idle time must be a whole number from 5 to 600 seconds.';
    if (!campaign.items.length) return 'Add at least one compatible media item to the playlist.';
    for (const item of campaign.items) {
      const asset = assets.find(a => a.id === item.assetId);
      if (!asset) return 'A playlist item is missing. Remove it or upload the media again.';
      if (asset.type !== campaign.mediaType) return 'The playlist contains incompatible media. Remove it or restore the previous display mode.';
      if (asset.type === 'image' && (!Number.isInteger(item.seconds) || item.seconds < 3 || item.seconds > 120)) return 'Each image duration must be a whole number from 3 to 120 seconds.';
    }
    if (!campaign.targets.length) return 'Select at least one target terminal.';
    if (campaign.targets.some(sn => !terminals.some(t => t.sn === sn))) return 'One of the selected terminals is no longer available.';
    if (!campaign.alwaysOn && (!Number.isFinite(Date.parse(campaign.start)) || !Number.isFinite(Date.parse(campaign.end)) || Date.parse(campaign.end) <= Date.parse(campaign.start))) return 'Choose a schedule with an end after its start (UTC).';
    return '';
  }
  function conflicts(state, campaign) {
    return Object.values(state.deployments).filter(d => campaign.targets.includes(d.sn) && d.campaignId !== campaign.id && !d.stopped);
  }
  function publish(state, campaign, now = new Date().toISOString()) {
    const error = validate(campaign, state.assets, state.terminals);
    if (error) throw new Error(error);
    if (conflicts(state, campaign).length) throw new Error('A target terminal already has another campaign. Stop that deployment before assigning this campaign.');
    const previous = state.campaigns.find(c => c.id === campaign.id);
    const version = (previous?.published?.version || 0) + 1;
    const snapshot = { ...copy(campaign), version, publishedAt: now };
    delete snapshot.published;
    snapshot.items = snapshot.items.map(i => ({ ...i, asset: copy(state.assets.find(a => a.id === i.assetId)) }));
    const saved = { ...copy(campaign), published: snapshot, updatedAt: now };
    state.campaigns = state.campaigns.filter(c => c.id !== saved.id).concat(saved);
    Object.values(state.deployments).forEach(d => {
      if (d.campaignId === saved.id && !saved.targets.includes(d.sn) && !d.stopped) {
        d.stopped = true;
        d.status = 'Stop pending';
        d.updatedAt = now;
      }
    });
    campaign.targets.forEach(sn => {
      const old = state.deployments[sn];
      const terminal = state.terminals.find(t => t.sn === sn);
      state.deployments[sn] = { sn, campaignId: saved.id, requested: copy(snapshot), active: old?.active || null, stopped: false, status: terminal.online ? 'Queued' : 'Waiting for connection', updatedAt: now };
    });
    return saved;
  }
  function sync(state, sn, outcome, now = new Date().toISOString()) {
    const deployment = state.deployments[sn];
    if (!deployment) return;
    if (outcome === 'offline') deployment.status = 'Waiting for connection';
    else if (outcome === 'failed') deployment.status = 'Download failed';
    else if (deployment.stopped) { deployment.active = null; deployment.status = 'Stopped'; }
    else if (outcome === 'busy') deployment.status = 'Waiting for idle';
    else { deployment.active = copy(deployment.requested); deployment.status = 'Up to date'; }
    deployment.updatedAt = now;
    return deployment;
  }
  function stop(state, campaignId) {
    Object.values(state.deployments).filter(d => d.campaignId === campaignId && !d.stopped).forEach(d => { d.stopped = true; d.status = 'Stop pending'; d.updatedAt = new Date().toISOString(); });
  }
  function scheduled(campaign, time = Date.now()) {
    return campaign.alwaysOn || (time >= Date.parse(campaign.start) && time < Date.parse(campaign.end));
  }
  function inUse(state, assetId) {
    return state.campaigns.some(c => c.items.some(i => i.assetId === assetId) || c.published?.items.some(i => i.assetId === assetId)) || Object.values(state.deployments).some(d => d.active?.items.some(i => i.assetId === assetId));
  }
  return { copy, modeLabel, validate, conflicts, publish, sync, stop, scheduled, inUse };
});
