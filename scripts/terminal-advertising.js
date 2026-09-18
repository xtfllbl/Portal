(function () {
  'use strict';
  const host = document.getElementById('terminalAdvertising');
  if (!host) return;
  const tab = document.getElementById('primaryTabAdvertising');
  const panel = document.getElementById('tab-advertising');
  const D = window.PaywizardAdvertisingDomain, S = window.PaywizardAdvertisingStore;
  const context = window.terminalContext;
  const directory = window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state, assignment, disposePreview;
  const dialog = document.createElement('dialog');
  dialog.className = 'terminal-campaign-dialog';
  dialog.setAttribute('aria-labelledby', 'terminalCampaignPreviewTitle');
  dialog.innerHTML = '<header><h2 id="terminalCampaignPreviewTitle">Media Preview</h2><button type="button" aria-label="Close media preview"><img src="assets/icons/close.svg" alt=""></button></header><div class="terminal-campaign-preview"></div><p class="terminal-campaign-error" role="alert" tabindex="-1" hidden></p>';
  document.body.append(dialog);
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => disposePreview?.());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });

  function advertisingUrl() {
    const back = new URL(location.href);
    for (const [key, value] of Object.entries(context)) back.searchParams.set(key, value);
    back.searchParams.set('tab', 'advertising');
    const params = new URLSearchParams({ sn: context.sn, terminalName: context.terminalName, returnTo: back.pathname + back.search });
    if (back.searchParams.has('hardwareSn')) params.set('hardwareSn', back.searchParams.get('hardwareSn'));
    params.set('view', 'campaigns');
    return `45.advertising.html?${params}`;
  }
  function updateEligibility() {
    let profile = 'wizarpos';
    try { profile = localStorage.getItem('paywizard.portalAccessProfile.v1') || profile; } catch (_) { /* The shell also falls back to its default profile. */ }
    tab.hidden = document.getElementById('terminalTypeAttendance')?.textContent.trim() !== 'Unattended' || !['wizarpos', 'full-service', 'full-service-merchant', 'unattended', 'unattended-merchant', 'unattended-store'].includes(profile);
    if (tab.hidden && tab.getAttribute('aria-selected') === 'true') document.getElementById('primaryTabBasic').click();
    if (tab.hidden && dialog.open) dialog.close();
  }
  function assetFor(item) { return item.asset || state.assets.find(asset => asset.id === item.assetId); }
  function load() {
    if (tab.hidden || panel.classList.contains('hidden') || dialog.open) return;
    try {
      state = S.read();
      D.syncDirectory(state, directory);
      assignment = D.terminalAssignment(state, context.sn);
      if (!assignment) {
        host.innerHTML = `<div class="terminal-campaign-empty"><h2>No advertising configured</h2><a class="terminal-campaign-action" href="${esc(advertisingUrl())}">Manage Advertising</a></div>`;
        return;
      }
      const published = assignment.published;
      host.innerHTML = `<header class="terminal-campaign-heading"><h2>${esc(published.name)}</h2><a class="terminal-campaign-action" href="${esc(advertisingUrl())}"><span class="material-symbols-rounded" aria-hidden="true">visibility</span>View Campaign</a></header><dl class="terminal-campaign-facts"><div><dt>Display Mode</dt><dd>${esc(D.modeLabel(published))}</dd></div><div><dt>Assignment Source</dt><dd>${assignment.storeId ? `Store · ${esc(assignment.storeName)}` : 'Direct terminal assignment'}</dd></div></dl><div class="terminal-campaign-playlist-heading"><h3>Playlist</h3><span>${published.items.length} ${published.mediaType === 'video' ? 'videos' : 'images'}</span></div><div class="terminal-campaign-media">${published.items.map((item, index) => {
        const asset = assetFor(item);
        return `<button type="button" class="terminal-campaign-media-item" data-campaign-media="${index}" aria-label="Preview ${esc(asset?.name || 'unavailable media')}"><span class="terminal-campaign-cover">${asset ? asset.type === 'video' && !asset.poster ? '<video muted playsinline preload="metadata"></video>' : '<img alt="">' : ''}<span class="terminal-campaign-unavailable" ${asset ? 'hidden' : ''}>Media unavailable</span>${asset?.type === 'video' ? '<span class="terminal-campaign-video-label">Video</span>' : ''}</span><span class="terminal-campaign-media-name">${esc(asset?.name || 'Unavailable media')}</span></button>`;
      }).join('')}</div>`;
      host.querySelectorAll('[data-campaign-media]').forEach(async button => {
        const asset = assetFor(published.items[Number(button.dataset.campaignMedia)]);
        if (!asset) return;
        const node = button.querySelector('img, video');
        const unavailable = () => { node.hidden = true; button.querySelector('.terminal-campaign-unavailable').hidden = false; };
        node.onerror = unavailable;
        try { const src = asset.poster || await S.url(asset); if (node.isConnected) node.src = src; } catch (_) { unavailable(); }
      });
    } catch (_) {
      host.innerHTML = '<div class="terminal-campaign-empty"><p class="terminal-campaign-error" role="alert">Advertising could not be loaded. Reload this view to try again. Saved advertising data has been preserved.</p><button type="button" class="terminal-campaign-action" data-campaign-retry>Reload</button></div>';
    }
  }
  async function preview(asset) {
    disposePreview?.();
    const content = dialog.querySelector('.terminal-campaign-preview');
    const error = dialog.querySelector('[role="alert"]');
    dialog.querySelector('h2').textContent = asset?.name || 'Media Preview';
    error.hidden = true;
    let disposed = false;
    const node = document.createElement(asset?.type === 'video' ? 'video' : 'img');
    content.replaceChildren(node);
    disposePreview = () => { disposed = true; node.onerror = null; if (node.tagName === 'VIDEO') { node.pause(); node.removeAttribute('src'); node.load(); } content.replaceChildren(); disposePreview = null; };
    const fail = message => { if (disposed) return; node.hidden = true; error.textContent = message; error.hidden = false; error.scrollIntoView({ block: 'nearest' }); error.focus(); };
    node.onerror = () => fail('Media could not be loaded. Open View Campaign, then select Edit to check or replace this media.');
    if (asset?.type === 'video') { node.controls = true; node.muted = true; node.playsInline = true; node.setAttribute('aria-label', asset.name); }
    else node.alt = asset?.name || '';
    dialog.showModal();
    if (!asset) { fail('Media is unavailable. Open View Campaign, then select Edit to check or replace this media.'); return; }
    try { const src = await S.url(asset); if (!disposed) { node.src = src; if (asset.type === 'video') node.play().catch(() => {}); } }
    catch (_) { fail('Media is unavailable in this browser. Open View Campaign, then select Edit to check or replace this media.'); }
  }
  host.addEventListener('click', event => {
    if (event.target.closest('[data-campaign-retry]')) load();
    const button = event.target.closest('[data-campaign-media]');
    if (button && assignment) preview(assetFor(assignment.published.items[Number(button.dataset.campaignMedia)]));
  });
  document.addEventListener('terminal:tabchange', event => { if (event.detail.key === 'advertising') load(); else if (dialog.open) dialog.close(); });
  document.addEventListener('terminaltype:changed', () => { updateEligibility(); load(); });
  window.addEventListener('storage', event => { if (!event.key || event.key === 'paywizard.advertising.v1') load(); });
  window.addEventListener('pageshow', load);
  window.addEventListener('focus', load);
  window.addEventListener('pagehide', () => { if (dialog.open) dialog.close(); disposePreview?.(); });
  updateEligibility();
  load();
})();
