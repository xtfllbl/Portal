(async function () {
  'use strict';
  const app = document.getElementById('advertisingApp');
  if (!app) return;
  const D = window.PaywizardAdvertisingDomain;
  const S = window.PaywizardAdvertisingStore;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => crypto.randomUUID();
  const size = bytes => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  let state;
  try { state = S.read(); S.save(state); } catch (error) { $('advertisingContent').innerHTML = `<p class="ads-error">${esc(error.message)}</p>`; $('createCampaign').disabled = true; return; }
  let currentView = 'campaigns';
  let draft = null;
  let dirty = false;
  let toastTimer;
  let confirmFn;
  let stopAssetPreview = null;
  let editorPreview = null;
  let editorPreviewKey = '';
  const P = window.PaywizardAdvertisingPreview;
  const directory = window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
  // This demo uses the complete directory. Former account-switch preferences
  // do not restrict target selection, saved drafts or new publications.
  commit(next => {
    next.stores = directory.accounts.filter(n => n.type === 'store').map(n => ({ id: n.id, name: n.name, merchant: directory.account(n.parentKey)?.name || '', accountKeys: n.lineageKeys }));
    for (const old of next.terminals) if (old.accountKeys && !directory.terminals.some(t => t.sn === old.sn)) {
      old.accountKeys = []; delete old.storeId;
    }
    for (const terminal of directory.terminals) {
      const identity = { sn: terminal.sn, accountKeys: terminal.lineageKeys, providerId: terminal.providerId, agentId: terminal.agentId, merchantId: terminal.merchantId, storeId: terminal.storeId, merchant: terminal.merchant, store: terminal.store };
      const existing = next.terminals.find(item => item.sn === terminal.sn);
      if (existing) Object.assign(existing, identity);
      else next.terminals.push({ ...identity, name: terminal.name });
    }
  });
  const icon = (name, up = false) => `<img class="ads-icon${up ? ' ads-icon-up' : ''}" src="assets/icons/${name}.svg" alt="">`;
  const rowAction = (action, value, label, name, iconName) => `<button type="button" class="ads-row-action${action === 'edit' ? ' primary' : action === 'stop' ? ' danger' : ''}" data-${action}="${esc(value)}" data-tooltip="${esc(label)}" aria-label="${esc(label)} ${esc(name)}"><span class="material-symbols-rounded" aria-hidden="true">${iconName}</span></button>`;
  const targetPicker = window.PaywizardAdvertisingTargetPicker.mount({ host: $('targetPicker'), directory, state: () => state, draft: () => draft, changed: () => { dirty = true; syncEditor(); } });
  let search = '';
  let filter = '';
  const params = new URLSearchParams(location.search);
  let contextSn = params.get('sn')?.trim() || '';
  const contextTerminal = state.terminals.find(t => t.sn === contextSn);
  const campaign = id => state.campaigns.find(c => c.id === id);
  const media = id => state.assets.find(a => a.id === id);
  const badge = status => `<span class="ads-badge ${/Published/.test(status) ? 'live' : /failed|Missing/.test(status) ? 'failed' : /pending/.test(status) ? 'pending' : ''}">${esc(status)}</span>`;
  function toast(message) { clearTimeout(toastTimer); $('adsToast').textContent = message; $('adsToast').hidden = false; toastTimer = setTimeout(() => $('adsToast').hidden = true, 4500); }
  function errorAt(id, message) {
    const node = $(id);
    node.textContent = message; node.hidden = !message;
    if (message && (id === 'editorError' || id === 'confirmError')) {
      node.scrollIntoView({ block: 'center', behavior: 'instant' });
      node.focus({ preventScroll: true });
    }
  }
  function commit(change) { const next = S.read(); const value = change(next); D.reconcile(next); S.save(next); state = next; return value; }
  function table(headings, rows, empty = 'No matching records.') {
    return `<div class="ads-table-wrap" role="region" aria-label="${esc(currentView)} table" tabindex="0"><table class="ads-table"><thead><tr>${headings.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headings.length}" class="ads-empty">${empty}</td></tr>`}</tbody></table></div>`;
  }
  async function hydrate(root = app) {
    await Promise.all(Array.from(root.querySelectorAll('[data-asset]')).map(async node => {
      const asset = media(node.dataset.asset);
      if (!asset) return;
      try { const src = node.tagName === 'IMG' && asset.poster ? asset.poster : await S.url(asset); if (node.isConnected) node.src = src; }
      catch (_) { node.alt = 'Media unavailable'; }
    }));
  }
  function thumbnail(asset) { return asset ? `<img class="ads-thumb" data-asset="${esc(asset.id)}" alt="" ${asset.type === 'video' && !asset.poster ? 'hidden' : ''}>` : ''; }
  if (contextTerminal) {
    $('adsContext').hidden = false;
    const back = new URLSearchParams({ sn: contextSn, terminalName: contextTerminal.name, merchantName: contextTerminal.merchant, tab: 'basic' });
    $('adsContext').innerHTML = `<div class="ads-context-strip"><strong>${esc(contextTerminal.name)} · ${esc(contextSn)}</strong><div class="ads-actions"><a class="ads-link-button" href="1.terminalmanage_nayax.html?${esc(back)}">Terminal Details</a><a class="ads-link-button" href="45.advertising.html">All Terminals</a></div></div>`;
  }
  function setView(view) {
    editorPreview?.dispose(); editorPreview = null; editorPreviewKey = ''; 
    currentView = ['campaigns', 'media'].includes(view) ? view : 'campaigns';
    search = ''; filter = ''; draft = null; dirty = false;
    $('adsEditor').hidden = true; $('advertisingContent').hidden = false;
    document.querySelector('.ads-tabs').hidden = false;
    $('createCampaign').hidden = currentView !== 'campaigns';
    document.querySelectorAll('[data-view]').forEach(b => { if (b.dataset.view === currentView) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const url = new URL(location.href); url.searchParams.set('view', currentView); url.searchParams.delete('campaign'); history.replaceState({}, '', url);
    renderView();
  }
  function renderView() {
    if (currentView === 'campaigns') renderCampaigns();
    else if (currentView === 'media') renderMedia();
  }
  function renderCampaigns() {
    const items = state.campaigns.filter(c => (!contextSn || D.resolveTargets(c, state.terminals).includes(contextSn)) && c.name.toLowerCase().includes(search.toLowerCase()) && (!filter || (filter === 'stopped' ? c.publicationStopped : filter === 'published' ? c.published && !c.publicationStopped : !c.published)));
    $('advertisingContent').innerHTML = `<div class="ads-toolbar"><input id="campaignSearch" type="search" aria-label="Search campaigns" placeholder="Search campaign" value="${esc(search)}"><select id="campaignFilter" aria-label="Campaign status"><option value="">All statuses</option><option value="published" ${filter === 'published' ? 'selected' : ''}>Published</option><option value="draft" ${filter === 'draft' ? 'selected' : ''}>Draft</option><option value="stopped" ${filter === 'stopped' ? 'selected' : ''}>Stopped</option></select><span class="ads-count">${items.length} campaigns</span></div>` + table(['CAMPAIGN', 'DISPLAY MODE', 'PLAYLIST', 'TARGETS', 'STATUS', 'ACTIONS'], items.map(c => `<tr><td><div class="ads-campaign-name">${thumbnail(media(c.items[0]?.assetId))}<button class="ads-name-button" data-edit="${esc(c.id)}">${esc(c.name)}</button></div></td><td>${esc(D.modeLabel(c))}</td><td>${c.items.length} ${c.mediaType === 'video' ? 'videos' : 'images'}</td><td>${esc(targetSummary(c))}</td><td>${badge(c.publicationStopped ? 'Stopped' : c.published ? `Published · v${c.published.version}` : 'Draft')}${state.targetConflicts?.some(item => item.campaignId === c.id) ? ' <span class="ads-badge pending">Target conflict</span>' : ''}</td><td><div class="ads-table-actions">${rowAction('edit', c.id, 'Edit', c.name, 'edit_square')}${rowAction('copy', c.id, 'Duplicate', c.name, 'content_copy')}${c.published && !c.publicationStopped ? rowAction('stop', c.id, 'Stop Campaign', c.name, 'block') : ''}</div></td></tr>`).join(''), contextSn ? 'No campaigns assigned to this terminal. Create a campaign to get started.' : 'No campaigns found. Create a campaign to get started.');
    hydrate();
    $('campaignSearch').addEventListener('input', event => { search = event.target.value; const cursor = event.target.selectionStart; renderCampaigns(); $('campaignSearch').focus(); $('campaignSearch').setSelectionRange(cursor, cursor); });
    $('campaignFilter').addEventListener('change', event => { filter = event.target.value; renderCampaigns(); });
  }
  function mediaCard(asset, picker = false) {
    const cover = `<span class="ads-media-cover">${asset.type === 'video' && !asset.poster ? `<video data-asset="${esc(asset.id)}" muted playsinline preload="metadata"></video>` : `<img data-asset="${esc(asset.id)}" alt="${esc(asset.name)}">`}${badge(asset.type === 'image' ? 'Image' : `${Math.round(asset.seconds || 0)}s video`)}</span>`;
    const info = `<strong>${esc(asset.name)}</strong><span class="ads-media-facts"><span>${asset.width} × ${asset.height}</span><span>${size(asset.bytes)}</span></span>`;
    if (picker) return `<article class="ads-media-card">${cover}<div class="ads-media-info">${info}<div class="ads-actions"><button data-add-asset="${esc(asset.id)}" class="ads-primary">Add to Playlist</button></div></div></article>`;
    return `<article class="ads-media-card"><button type="button" class="ads-media-open" data-preview-asset="${esc(asset.id)}" aria-label="Preview ${esc(asset.name)}">${cover}<span class="ads-media-info">${info}</span></button><button type="button" class="ads-media-delete" data-delete-asset="${esc(asset.id)}" data-tooltip="Delete" aria-label="Delete ${esc(asset.name)}">${icon('delete')}</button></article>`;
  }
  function renderMedia() {
    const items = state.assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) && (!filter || a.type === filter));
    $('advertisingContent').innerHTML = `<div class="ads-toolbar"><input id="mediaSearch" type="search" aria-label="Search media" placeholder="Search media" value="${esc(search)}"><select id="mediaFilter" aria-label="Media type"><option value="">All media</option><option value="image" ${filter === 'image' ? 'selected' : ''}>Images</option><option value="video" ${filter === 'video' ? 'selected' : ''}>Videos</option></select><span class="ads-count">${items.length} items</span><button id="uploadMedia" class="ads-primary">Upload Media</button></div><div class="ads-media-grid">${items.map(a => mediaCard(a)).join('') || '<div class="ads-empty">No media found.</div>'}</div>`;
    hydrate();
    $('uploadMedia').onclick = () => { $('mediaForm').reset(); errorAt('uploadError', ''); $('mediaDialog').showModal(); };
    $('mediaSearch').oninput = event => { search = event.target.value; const cursor = event.target.selectionStart; renderMedia(); $('mediaSearch').focus(); $('mediaSearch').setSelectionRange(cursor, cursor); };
    $('mediaFilter').onchange = event => { filter = event.target.value; renderMedia(); };
  }
  function openEditor(value) {
    draft = value ? D.normalize(value, state.assets) : { id: uid(), name: '', mode: 'embedded', mediaType: 'image', idleSeconds: 30, order: 'sequential', fit: 'contain', items: [], targets: state.terminals.some(terminal => terminal.sn === contextSn) ? [contextSn] : [], alwaysOn: true, start: '', end: '' };
    delete draft.accountKey; draft.targetStores ||= [];
    dirty = false; $('advertisingContent').hidden = true; $('adsEditor').hidden = false; document.querySelector('.ads-tabs').hidden = true; $('createCampaign').hidden = true;
    $('editorTitle').textContent = value ? draft.name : 'New Campaign'; $('campaignName').value = draft.name;
    document.querySelector(`input[name="mode"][value="${draft.mode}"]`).checked = true;
    $('idleSeconds').value = draft.idleSeconds; $('imageFit').value = draft.fit;
    errorAt('editorError', ''); syncEditor(); renderPlaylist(); targetPicker.reset();
    const url = new URL(location.href); url.searchParams.set('campaign', draft.id); history.replaceState({}, '', url);
    $('campaignName').focus();
  }
  function collect() {
    if (!draft) return;
    Object.assign(draft, { name: $('campaignName').value.trim(), mode: document.querySelector('input[name="mode"]:checked').value, mediaType: D.mediaType(draft, state.assets) || 'image', idleSeconds: Number($('idleSeconds').value), order: 'sequential', fit: $('imageFit').value, alwaysOn: true, start: '', end: '' });
    return draft;
  }
  function syncEditor() {
    collect();
    $('fullScreenOptions').hidden = draft.mode !== 'fullscreen';
    const published = !!draft.published;
    $('saveCampaignDraft').hidden = published;
    $('saveCampaignDraft').disabled = published;
    $('saveCampaignDraft').type = published ? 'button' : 'submit';
    $('draftState').textContent = dirty ? 'Unsaved changes' : published ? `${draft.publicationStopped ? 'Stopped' : 'Published'} · v${draft.published.version}` : 'Draft';
    const key = JSON.stringify([draft.id, draft.mode, draft.mediaType, draft.items, draft.fit, draft.order, draft.idleSeconds, draft.alwaysOn, draft.start, draft.end, $('previewModel').value]);
    if (key !== editorPreviewKey) {
      editorPreview?.dispose();
      editorPreviewKey = key;
      editorPreview = P.mount({ host: $('editorDevice'), status: $('editorPreviewStatus'), campaign: draft, modelId: $('previewModel').value, assetFor: media, urlFor: S.url });
    }
  }
  function renderPlaylist() {
    $('playlistRows').innerHTML = draft.items.length ? draft.items.map((item, index) => { const asset = media(item.assetId); return `<div class="ads-playlist-row"><span>${index + 1}</span>${thumbnail(asset)}<span class="ads-playlist-name">${esc(asset?.name || 'Missing media')}${asset?.type !== draft.mediaType ? ' <span class="ads-badge failed">Incompatible</span>' : ''}</span>${asset?.type === 'video' ? `<span class="ads-badge">${Math.round(asset.seconds)}s · full video</span>` : `<label><input type="number" min="3" max="120" step="1" value="${item.seconds}" data-duration="${index}" aria-label="Duration for ${esc(asset?.name)}"> sec</label>`}<div class="ads-actions"><button type="button" data-move="${index}" data-direction="-1" aria-label="Move ${esc(asset?.name)} up" ${index === 0 ? 'disabled' : ''}>${icon('chevron-down', true)}</button><button type="button" data-move="${index}" data-direction="1" aria-label="Move ${esc(asset?.name)} down" ${index === draft.items.length - 1 ? 'disabled' : ''}>${icon('chevron-down')}</button><button type="button" data-remove="${index}" aria-label="Remove ${esc(asset?.name)}">${icon('close')}</button></div></div>`; }).join('') : '<div class="ads-empty">Add images or videos from the media library.</div>';
    hydrate($('playlistRows'));
  }
  function targetSummary(value) {
    const stores = value.targetStores?.length || 0;
    const terminals = value.targets.filter(sn => !state.terminals.some(t => t.sn === sn && value.targetStores?.includes(t.storeId))).length;
    return [stores ? `${stores} store${stores === 1 ? '' : 's'}` : '', terminals ? `${terminals} terminal${terminals === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ') || '0';
  }
  function confirm(title, body, action, fn) { $('confirmTitle').textContent = title; $('confirmBody').innerHTML = body; $('confirmAction').textContent = action; $('confirmAction').disabled = false; errorAt('confirmError', ''); confirmFn = fn; $('confirmDialog').showModal(); }
  $('confirmAction').onclick = async () => { $('confirmAction').disabled = true; try { await confirmFn(); $('confirmDialog').close(); } catch (error) { errorAt('confirmError', error.message); } finally { $('confirmAction').disabled = false; } };
  function leaveEditor() { if (dirty) confirm('Discard Changes?', '<p>Your unsaved changes will be discarded. The saved campaign will be kept.</p>', 'Discard Changes', () => setView('campaigns')); else setView('campaigns'); }
  $('createCampaign').onclick = () => openEditor(); $('backCampaigns').onclick = leaveEditor; $('cancelCampaign').onclick = leaveEditor;
  $('campaignForm').addEventListener('input', event => {
    if (event.target.id === 'previewModel') return;
    if (event.target.name === 'mode' && event.target.value === 'embedded' && draft.items.some(item => media(item.assetId)?.type === 'video')) {
      document.querySelector('input[name="mode"][value="fullscreen"]').checked = true;
      toast('Remove videos from the playlist before using Idle screen.');
      return;
    }
    if (event.target.matches('[data-duration]')) draft.items[Number(event.target.dataset.duration)].seconds = Number(event.target.value);
    dirty = true; syncEditor();
    if (event.target.name === 'mode') renderPlaylist();
  });
  $('addPlaylistMedia').onclick = () => {
    collect();
    const type = draft.mode === 'embedded' ? 'image' : D.mediaType(draft, state.assets);
    $('pickerItems').innerHTML = state.assets.filter(asset => !type || asset.type === type).map(asset => mediaCard(asset, true)).join('') || '<div class="ads-empty">No compatible media. Save your draft and upload media in the Media Library.</div>';
    $('pickerDialog').showModal(); hydrate($('pickerDialog'));
  };
  $('previewModel').onchange = syncEditor;
  $('replayEditor').onclick = () => editorPreview?.restart();
  $('campaignForm').onsubmit = async event => {
    event.preventDefault(); collect(); errorAt('editorError', '');
    const allowed = state.terminals;
    if (!targetPicker.validateSelection()) return;
    if (draft.published || campaign(draft.id)?.published || event.submitter?.value === 'publish') {
      const error = D.validate(draft, state.assets, allowed, state.stores);
      if (error) { errorAt('editorError', error); return; }
      const storesInUse = D.storeConflicts(state, draft);
      if (storesInUse.length) { errorAt('editorError', `Selected stores are assigned to ${storesInUse.map(c => c.name).join(', ')}. Stop the existing campaign before reassigning.`); return; }
      const overlap = D.conflicts(state, draft);
      if (overlap.length) { errorAt('editorError', `Already assigned: ${overlap.map(d => d.sn).join(', ')}. Stop the existing campaign in Campaigns before reassigning.`); return; }
      const snapshot = D.copy(draft);
      confirm('Publish Campaign', `<dl class="ads-summary"><dt>Campaign</dt><dd>${esc(snapshot.name)}</dd><dt>Display mode</dt><dd>${esc(D.modeLabel(snapshot))}</dd><dt>Version</dt><dd>v${(campaign(snapshot.id)?.published?.version || 0) + 1}</dd><dt>Targets</dt><dd>${esc(targetSummary(snapshot))} (${D.resolveTargets(snapshot, allowed).length} terminals covered)</dd><dt>Playlist</dt><dd>${snapshot.items.length} items</dd></dl>`, 'Publish', async () => {
        for (const item of snapshot.items) await S.url(media(item.assetId));
        commit(next => { const error = D.validate(snapshot, next.assets, next.terminals, next.stores); if (error) throw new Error(error); D.publish(next, snapshot); }); dirty = false; setView('campaigns'); toast('Campaign published.');
      });
    } else {
      try { const saved = commit(next => D.saveDraft(next, draft)); draft = D.copy(saved); dirty = false; syncEditor(); toast('Draft saved in this browser.'); }
      catch (error) { errorAt('editorError', error.message); }
    }
  };
  async function inspectFile(file) {
    const imageType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const videoType = ['video/mp4', 'video/webm'].includes(file.type);
    if (!imageType && !videoType) throw new Error('Choose a JPG, PNG, WebP, MP4 or WebM file.');
    if (file.size > (imageType ? 10 : 50) * 1024 * 1024) throw new Error(`This file exceeds the ${imageType ? 10 : 50} MB limit.`);
    const url = URL.createObjectURL(file);
    try { return await new Promise((resolve, reject) => {
      const node = imageType ? new Image() : document.createElement('video');
      const timeout = setTimeout(() => { node.src = ''; reject(new Error('Media could not be decoded. Try another format or codec.')); }, 15000);
      const fail = () => { clearTimeout(timeout); reject(new Error('This media cannot be played in this browser. Try another format or codec.')); };
      const success = () => { clearTimeout(timeout); const width = imageType ? node.naturalWidth : node.videoWidth; const height = imageType ? node.naturalHeight : node.videoHeight; if (!width || !height || (!imageType && !Number.isFinite(node.duration))) return fail(); resolve({ type: imageType ? 'image' : 'video', width, height, seconds: imageType ? 8 : node.duration }); };
      node.onerror = fail; if (imageType) node.onload = success; else { node.onloadeddata = success; node.muted = true; node.preload = 'auto'; } node.src = url;
    }); } finally { URL.revokeObjectURL(url); }
  }
  $('mediaForm').onsubmit = async event => {
    event.preventDefault(); errorAt('uploadError', ''); $('uploadSubmit').disabled = true; $('uploadSubmit').textContent = 'Uploading…';
    let id;
    try {
      const file = $('mediaFile').files[0];
      if (!file) throw new Error('Choose a file.');
      const name = $('mediaName').value.trim() || file.name;
      const metadata = await inspectFile(file);
      id = uid(); await S.put(id, file);
      commit(next => next.assets.push({ id, name, mime: file.type, bytes: file.size, ...metadata }));
      $('mediaDialog').close(); renderMedia(); toast('Media uploaded.');
    }
    catch (error) { if (id && !media(id)) S.remove(id).catch(() => {}); errorAt('uploadError', error.message); }
    finally { $('uploadSubmit').disabled = false; $('uploadSubmit').textContent = 'Upload'; }
  };
  document.addEventListener('click', async event => {
    const button = event.target.closest('button'); if (!button) return;
    const data = button.dataset;
    try {
      if (data.view) setView(data.view);
      else if (data.close) $(data.close).close();
      else if (data.edit) openEditor(campaign(data.edit));
      else if (data.copy) { const c = D.copy(campaign(data.copy)); delete c.published; delete c.publicationStopped; delete c.accountKey; c.targetStores = []; c.id = uid(); c.name += ' (copy)'; c.targets = state.terminals.some(terminal => terminal.sn === contextSn) ? [contextSn] : []; openEditor(c); dirty = true; syncEditor(); }
      else if (data.previewAsset) await startAssetPreview(media(data.previewAsset));
      else if (data.addAsset) {
        const asset = media(data.addAsset), type = draft.mode === 'embedded' ? 'image' : D.mediaType(draft, state.assets);
        if (!asset || (type && asset.type !== type)) return toast('Use only images or only videos in one playlist.');
        draft.items.push({ assetId: data.addAsset, seconds: asset.type === 'video' ? asset.seconds : 8 });
        dirty = true; syncEditor(); renderPlaylist(); $('pickerDialog').close();
      }
      else if (data.move !== undefined) { const from = Number(data.move); const to = from + Number(data.direction); if (to < 0 || to >= draft.items.length) return; [draft.items[from], draft.items[to]] = [draft.items[to], draft.items[from]]; dirty = true; syncEditor(); renderPlaylist(); }
      else if (data.remove !== undefined) { draft.items.splice(Number(data.remove), 1); dirty = true; syncEditor(); renderPlaylist(); }
      else if (data.deleteAsset) { if (D.inUse(state, data.deleteAsset)) return toast('This media is used by a draft or published version and cannot be deleted.'); confirm('Delete Media?', `<p>Delete “${esc(media(data.deleteAsset).name)}” from this browser?</p>`, 'Delete', async () => { commit(next => { next.assets = next.assets.filter(a => a.id !== data.deleteAsset); }); await S.remove(data.deleteAsset); renderMedia(); toast('Media deleted.'); }); }
      else if (data.stop) confirm('Stop Campaign?', `<p>Stop “${esc(campaign(data.stop)?.name)}” for its selected stores and terminals?</p>`, 'Stop Campaign', () => { commit(next => D.stop(next, data.stop)); renderCampaigns(); toast('Campaign stopped.'); });
    } catch (error) { toast(error.message); }
  });
  async function startAssetPreview(asset) {
    if (!asset) return;
    stopAssetPreview?.();
    const dialog = $('assetPreviewDialog');
    const host = $('assetPreviewContent');
    const node = document.createElement(asset.type === 'video' ? 'video' : 'img');
    let disposed = false;
    $('assetPreviewTitle').textContent = asset.name;
    errorAt('assetPreviewError', '');
    if (asset.type === 'video') {
      node.controls = true; node.muted = true; node.playsInline = true; node.loop = true;
      node.setAttribute('aria-label', asset.name);
    } else node.alt = asset.name;
    host.replaceChildren(node);
    stopAssetPreview = () => {
      disposed = true;
      node.onerror = null;
      if (asset.type === 'video') node.pause();
      node.removeAttribute('src');
      if (asset.type === 'video') node.load();
      host.replaceChildren();
      stopAssetPreview = null;
    };
    node.onerror = () => { if (!disposed) errorAt('assetPreviewError', 'Media could not be loaded.'); };
    if (!dialog.open) dialog.showModal();
    try {
      const src = await S.url(asset);
      if (disposed) return;
      node.src = src;
      if (asset.type === 'video') node.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
    } catch (error) { if (!disposed) errorAt('assetPreviewError', error.message); }
  }
  $('assetPreviewDialog').addEventListener('close', () => stopAssetPreview?.());
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('pagehide', () => { editorPreview?.dispose(); stopAssetPreview?.(); });
  document.addEventListener('pw:before-navigate', event => { if (!dirty) return; event.preventDefault(); confirm('Discard Changes?', '<p>Leave this campaign and discard unsaved changes?</p>', 'Discard Changes', () => { dirty = false; event.detail.proceed(); }); });
  setView(params.get('view') || 'campaigns');
  if (params.get('campaign') && campaign(params.get('campaign'))) openEditor(campaign(params.get('campaign')));
})();
