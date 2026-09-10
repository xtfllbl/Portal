(async function () {
  'use strict';
  const app = document.getElementById('advertisingApp');
  if (!app) return;
  const D = window.PaywizardAdvertisingDomain;
  const S = window.PaywizardAdvertisingStore;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => crypto.randomUUID();
  const date = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'UTC', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
  const size = bytes => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  let state;
  try { state = S.read(); S.save(state); } catch (error) { $('adsContent').innerHTML = `<p class="ads-error">${esc(error.message)}</p>`; $('createCampaign').disabled = true; return; }
  let currentView = 'campaigns';
  let draft = null;
  let dirty = false;
  let toastTimer;
  let confirmFn;
  let stopPreview = null;
  let editorPreview = null;
  let editorPreviewKey = '';
  const P = window.PaywizardAdvertisingPreview;
  const icon = (name, up = false) => `<img class="ads-icon${up ? ' ads-icon-up' : ''}" src="assets/icons/${name}.svg" alt="">`;
  let search = '';
  let filter = '';
  const params = new URLSearchParams(location.search);
  const contextSn = params.get('sn')?.trim() || '';
  if (contextSn && !state.terminals.some(t => t.sn === contextSn)) {
    state.terminals.push({ sn: contextSn, name: params.get('terminalName') || contextSn, merchant: params.get('merchantName') || 'Selected terminal', store: 'Selected terminal', online: false });
    S.save(state);
  }
  const contextTerminal = state.terminals.find(t => t.sn === contextSn);
  const terminal = sn => state.terminals.find(t => t.sn === sn);
  const campaign = id => state.campaigns.find(c => c.id === id);
  const media = id => state.assets.find(a => a.id === id);
  const badge = status => `<span class="ads-badge ${/Up to date|Published/.test(status) ? 'live' : /failed|Missing/.test(status) ? 'failed' : /Queued|Waiting|pending/.test(status) ? 'pending' : ''}">${esc(status)}</span>`;
  function toast(message) { clearTimeout(toastTimer); $('adsToast').textContent = message; $('adsToast').hidden = false; toastTimer = setTimeout(() => $('adsToast').hidden = true, 4500); }
  function errorAt(id, message) { $(id).textContent = message; $(id).hidden = !message; }
  function commit(change) { const next = S.read(); const value = change(next); S.save(next); state = next; return value; }
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
    currentView = ['campaigns', 'media', 'deployments'].includes(view) ? view : 'campaigns';
    search = ''; filter = ''; draft = null; dirty = false;
    $('adsEditor').hidden = true; $('adsContent').hidden = false;
    document.querySelector('.ads-tabs').hidden = false;
    $('createCampaign').hidden = currentView !== 'campaigns';
    document.querySelectorAll('[data-view]').forEach(b => { if (b.dataset.view === currentView) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const url = new URL(location.href); url.searchParams.set('view', currentView); url.searchParams.delete('campaign'); history.replaceState({}, '', url);
    renderView();
  }
  function renderView() {
    if (currentView === 'campaigns') renderCampaigns();
    else if (currentView === 'media') renderMedia();
    else if (currentView === 'deployments') renderDeployments();
  }
  function renderCampaigns() {
    const items = state.campaigns.filter(c => (!contextSn || c.targets.includes(contextSn)) && c.name.toLowerCase().includes(search.toLowerCase()) && (!filter || (filter === 'published' ? c.published : !c.published)));
    $('adsContent').innerHTML = `<div class="ads-toolbar"><input id="campaignSearch" type="search" aria-label="Search campaigns" placeholder="Search campaign" value="${esc(search)}"><select id="campaignFilter" aria-label="Campaign status"><option value="">All statuses</option><option value="published" ${filter === 'published' ? 'selected' : ''}>Published</option><option value="draft" ${filter === 'draft' ? 'selected' : ''}>Draft</option></select><span class="ads-count">${items.length} campaigns</span></div>` + table(['CAMPAIGN', 'DISPLAY MODE', 'PLAYLIST', 'TERMINALS', 'STATUS', 'ACTIONS'], items.map(c => `<tr><td><div class="ads-campaign-name">${thumbnail(media(c.items[0]?.assetId))}<button class="ads-name-button" data-edit="${esc(c.id)}">${esc(c.name)}</button></div></td><td>${esc(D.modeLabel(c))}</td><td>${c.items.length} ${c.mediaType === 'video' ? 'videos' : 'images'}</td><td>${c.targets.length}</td><td>${badge(c.published ? `Published · v${c.published.version}` : 'Draft')}</td><td><div class="ads-table-actions"><button data-edit="${esc(c.id)}">Edit</button><button data-copy="${esc(c.id)}" aria-label="Duplicate ${esc(c.name)}">Duplicate</button></div></td></tr>`).join(''), contextSn ? 'No campaigns assigned to this terminal. Create a campaign to get started.' : 'No campaigns found. Create a campaign to get started.');
    hydrate();
    $('campaignSearch').addEventListener('input', event => { search = event.target.value; const cursor = event.target.selectionStart; renderCampaigns(); $('campaignSearch').focus(); $('campaignSearch').setSelectionRange(cursor, cursor); });
    $('campaignFilter').addEventListener('change', event => { filter = event.target.value; renderCampaigns(); });
  }
  function mediaCard(asset, picker = false) {
    return `<article class="ads-media-card"><div class="ads-media-cover">${asset.type === 'video' && !asset.poster ? `<video data-asset="${esc(asset.id)}" muted playsinline preload="metadata"></video>` : `<img data-asset="${esc(asset.id)}" alt="${esc(asset.name)}">`}${badge(asset.type === 'image' ? 'Image' : `${Math.round(asset.seconds || 0)}s video`)}</div><div class="ads-media-info"><strong>${esc(asset.name)}</strong><div class="ads-media-facts"><span>${asset.width} × ${asset.height}</span><span>${size(asset.bytes)}</span></div><div class="ads-actions">${picker ? `<button data-add-asset="${esc(asset.id)}" class="ads-primary">Add to Playlist</button>` : `<button data-preview-asset="${esc(asset.id)}">Preview</button><button data-delete-asset="${esc(asset.id)}" aria-label="Delete ${esc(asset.name)}">Delete</button>`}</div></div></article>`;
  }
  function renderMedia() {
    const items = state.assets.filter(a => `${a.name} ${a.advertiser}`.toLowerCase().includes(search.toLowerCase()) && (!filter || a.type === filter));
    $('adsContent').innerHTML = `<div class="ads-toolbar"><input id="mediaSearch" type="search" aria-label="Search media" placeholder="Search media or advertiser" value="${esc(search)}"><select id="mediaFilter" aria-label="Media type"><option value="">All media</option><option value="image" ${filter === 'image' ? 'selected' : ''}>Images</option><option value="video" ${filter === 'video' ? 'selected' : ''}>Videos</option></select><span class="ads-count">${items.length} items</span><button id="uploadMedia" class="ads-primary">↑ Upload Media</button></div><div class="ads-media-grid">${items.map(a => mediaCard(a)).join('') || '<div class="ads-empty">No media found.</div>'}</div>`;
    hydrate();
    $('uploadMedia').onclick = () => { $('mediaForm').reset(); errorAt('uploadError', ''); $('mediaDialog').showModal(); };
    $('mediaSearch').oninput = event => { search = event.target.value; const cursor = event.target.selectionStart; renderMedia(); $('mediaSearch').focus(); $('mediaSearch').setSelectionRange(cursor, cursor); };
    $('mediaFilter').onchange = event => { filter = event.target.value; renderMedia(); };
  }
  function renderDeployments() {
    const items = Object.values(state.deployments).filter(d => (!contextSn || d.sn === contextSn) && `${d.sn} ${terminal(d.sn)?.name} ${d.requested.name}`.toLowerCase().includes(search.toLowerCase()) && (!filter || d.status === filter));
    $('adsContent').innerHTML = `<div class="ads-notice-box">Demo device acknowledgements. Publishing queues a version; a terminal keeps its current version until download succeeds and it is idle. Use Simulate Sync to explore outcomes.</div><div class="ads-toolbar"><input id="deploymentSearch" type="search" aria-label="Search deployments" placeholder="Search SN, terminal or campaign" value="${esc(search)}"><select id="deploymentFilter" aria-label="Deployment status"><option value="">All statuses</option>${['Up to date', 'Queued', 'Waiting for connection', 'Waiting for idle', 'Download failed', 'Stop pending', 'Stopped'].map(s => `<option ${filter === s ? 'selected' : ''}>${s}</option>`).join('')}</select><span class="ads-count">${items.length} terminals</span></div>` + table(['TERMINAL SN', 'STORE', 'CAMPAIGN', 'REQUESTED', 'ACTIVE', 'STATUS', 'LAST UPDATE (UTC)', 'ACTIONS'], items.map(d => `<tr><td><a href="1.terminalmanage_nayax.html?${esc(new URLSearchParams({ sn: d.sn, terminalName: terminal(d.sn)?.name || d.sn, merchantName: terminal(d.sn)?.merchant || '', tab: 'basic' }))}">${esc(d.sn)}</a></td><td>${esc(terminal(d.sn)?.store)}</td><td>${esc(d.requested.name)}</td><td>${d.stopped ? 'Stop' : `v${d.requested.version}`}</td><td>${d.active ? `v${d.active.version} · ${esc(d.active.name)}` : 'Default screen'}</td><td>${badge(d.status)}</td><td>${date(d.updatedAt)}</td><td><div class="ads-table-actions"><button data-sync="${esc(d.sn)}">Simulate Sync</button><button data-preview-deployment="${esc(d.sn)}" ${!d.active ? 'disabled' : ''}>Preview Active</button>${!d.stopped ? `<button data-stop="${esc(d.campaignId)}">Stop Campaign</button>` : ''}</div></td></tr>`).join(''));
    $('deploymentSearch').oninput = event => { search = event.target.value; const cursor = event.target.selectionStart; renderDeployments(); $('deploymentSearch').focus(); $('deploymentSearch').setSelectionRange(cursor, cursor); };
    $('deploymentFilter').onchange = event => { filter = event.target.value; renderDeployments(); };
  }
  function openEditor(value) {
    draft = value ? D.copy(value) : { id: uid(), name: '', mode: 'embedded', mediaType: 'image', idleSeconds: 30, order: 'sequential', fit: 'contain', items: [], targets: contextSn ? [contextSn] : [], alwaysOn: true, start: '', end: '' };
    dirty = false; $('adsContent').hidden = true; $('adsEditor').hidden = false; document.querySelector('.ads-tabs').hidden = true; $('createCampaign').hidden = true;
    $('editorTitle').textContent = value ? draft.name : 'New Campaign'; $('campaignName').value = draft.name;
    document.querySelector(`input[name="mode"][value="${draft.mode}"]`).checked = true;
    $('contentType').value = draft.mediaType; $('idleSeconds').value = draft.idleSeconds; $('playOrder').value = draft.order; $('imageFit').value = draft.fit;
    $('alwaysOn').checked = draft.alwaysOn; $('scheduleStart').value = draft.start?.slice(0, 16) || ''; $('scheduleEnd').value = draft.end?.slice(0, 16) || '';
    $('targetSearch').value = ''; errorAt('editorError', ''); syncEditor(); renderPlaylist(); renderTargets();
    const url = new URL(location.href); url.searchParams.set('campaign', draft.id); history.replaceState({}, '', url);
    $('campaignName').focus();
  }
  function collect() {
    if (!draft) return;
    Object.assign(draft, { name: $('campaignName').value.trim(), mode: document.querySelector('input[name="mode"]:checked').value, mediaType: document.querySelector('input[name="mode"]:checked').value === 'embedded' ? 'image' : $('contentType').value, idleSeconds: Number($('idleSeconds').value), order: $('playOrder').value, fit: $('imageFit').value, alwaysOn: $('alwaysOn').checked, start: $('scheduleStart').value ? $('scheduleStart').value + ':00Z' : '', end: $('scheduleEnd').value ? $('scheduleEnd').value + ':00Z' : '' });
    return draft;
  }
  function syncEditor() {
    collect();
    $('fullScreenOptions').hidden = draft.mode !== 'fullscreen'; $('scheduleFields').hidden = draft.alwaysOn;
    $('draftState').textContent = dirty ? 'Unsaved changes' : draft.published ? `Draft · published v${draft.published.version}` : 'Draft';
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
  function renderTargets() {
    const term = $('targetSearch').value.toLowerCase();
    const items = state.terminals.filter(t => `${t.name} ${t.sn} ${t.store} ${t.merchant}`.toLowerCase().includes(term));
    $('targetRows').innerHTML = items.map(t => { const d = state.deployments[t.sn]; const conflict = d && !d.stopped && d.campaignId !== draft.id; return `<label class="ads-target"><input type="checkbox" value="${esc(t.sn)}" data-target-terminal ${draft.targets.includes(t.sn) ? 'checked' : ''}><span><b>${esc(t.name)}</b><small>${esc(t.sn)} · ${esc(t.store)}</small>${conflict ? `<small>Assigned to ${esc(d.requested.name)}</small>` : ''}</span>${badge(t.online ? 'Online' : 'Offline')}</label>`; }).join('') || '<div class="ads-empty">No matching terminals.</div>';
    $('targetCount').textContent = `${draft.targets.length} selected`;
  }
  function confirm(title, body, action, fn) { $('confirmTitle').textContent = title; $('confirmBody').innerHTML = body; $('confirmAction').textContent = action; $('confirmAction').disabled = false; errorAt('confirmError', ''); confirmFn = fn; $('confirmDialog').showModal(); }
  $('confirmAction').onclick = async () => { $('confirmAction').disabled = true; try { await confirmFn(); $('confirmDialog').close(); } catch (error) { errorAt('confirmError', error.message); } finally { $('confirmAction').disabled = false; } };
  function leaveEditor() { if (dirty) confirm('Discard Changes?', '<p>Your unsaved changes will be discarded. The last saved draft and published version will be kept.</p>', 'Discard Changes', () => setView('campaigns')); else setView('campaigns'); }
  $('createCampaign').onclick = () => openEditor(); $('backCampaigns').onclick = leaveEditor; $('cancelCampaign').onclick = leaveEditor;
  $('targetSearch').oninput = renderTargets;
  $('campaignForm').addEventListener('input', event => {
    if (['targetSearch', 'previewModel'].includes(event.target.id)) return;
    if (event.target.matches('[data-duration]')) draft.items[Number(event.target.dataset.duration)].seconds = Number(event.target.value);
    if (event.target.matches('[data-target-terminal]')) draft.targets = event.target.checked ? [...new Set([...draft.targets, event.target.value])] : draft.targets.filter(sn => sn !== event.target.value);
    dirty = true; syncEditor(); $('targetCount').textContent = `${draft.targets.length} selected`;
    if (event.target.name === 'mode' || event.target.id === 'contentType') renderPlaylist();
  });
  $('addPlaylistMedia').onclick = () => { collect(); $('pickerItems').innerHTML = state.assets.filter(a => a.type === draft.mediaType).map(a => mediaCard(a, true)).join('') || '<div class="ads-empty">No compatible media. Save your draft and upload media in the Media Library.</div>'; $('pickerDialog').showModal(); hydrate($('pickerDialog')); };
  $('previewModel').onchange = syncEditor;
  $('replayEditor').onclick = () => editorPreview?.restart();
  $('campaignForm').onsubmit = async event => {
    event.preventDefault(); collect(); errorAt('editorError', '');
    if (event.submitter?.value === 'publish') {
      const error = D.validate(draft, state.assets, state.terminals);
      if (error) { errorAt('editorError', error); $('editorError').scrollIntoView({ block: 'center' }); return; }
      const overlap = D.conflicts(state, draft);
      if (overlap.length) { errorAt('editorError', `Already assigned: ${overlap.map(d => d.sn).join(', ')}. Stop the existing campaign in Deployments before reassigning.`); return; }
      const snapshot = D.copy(draft);
      confirm('Publish Campaign', `<dl class="ads-summary"><dt>Campaign</dt><dd>${esc(snapshot.name)}</dd><dt>Display mode</dt><dd>${esc(D.modeLabel(snapshot))}</dd><dt>Version</dt><dd>v${(campaign(snapshot.id)?.published?.version || 0) + 1}</dd><dt>Targets</dt><dd>${snapshot.targets.length} terminals</dd><dt>Playlist</dt><dd>${snapshot.items.length} items</dd><dt>Schedule</dt><dd>${snapshot.alwaysOn ? 'Always active' : `${date(snapshot.start)} – ${date(snapshot.end)} UTC`}</dd></dl><p class="ads-notice">This creates a demo deployment. Offline or busy terminals keep their active version until a successful idle sync. Payment requests take priority.</p>`, 'Publish', async () => {
        for (const item of snapshot.items) await S.url(media(item.assetId));
        commit(next => D.publish(next, snapshot)); dirty = false; setView('deployments'); toast('Campaign published. Demo deployments are queued.');
      });
    } else {
      try { const saved = D.copy(draft); saved.updatedAt = new Date().toISOString(); commit(next => { saved.published = next.campaigns.find(c => c.id === saved.id)?.published; next.campaigns = next.campaigns.filter(c => c.id !== saved.id).concat(saved); }); draft = D.copy(saved); dirty = false; syncEditor(); toast('Draft saved in this browser.'); }
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
  $('mediaFile').onchange = () => { if (!$('mediaName').value) $('mediaName').value = $('mediaFile').files[0]?.name.replace(/\.[^.]+$/, '') || ''; };
  $('mediaForm').onsubmit = async event => {
    event.preventDefault(); errorAt('uploadError', ''); $('uploadSubmit').disabled = true; $('uploadSubmit').textContent = 'Uploading…';
    let id;
    try { const file = $('mediaFile').files[0]; if (!file) throw new Error('Choose a file.'); const metadata = await inspectFile(file); id = uid(); await S.put(id, file); commit(next => next.assets.push({ id, name: $('mediaName').value.trim(), advertiser: $('mediaAdvertiser').value.trim(), mime: file.type, bytes: file.size, ...metadata })); $('mediaDialog').close(); renderMedia(); toast('Media saved in this browser.'); }
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
      else if (data.copy) { const c = D.copy(campaign(data.copy)); delete c.published; c.id = uid(); c.name += ' (copy)'; c.targets = contextSn ? [contextSn] : []; openEditor(c); dirty = true; syncEditor(); }
      else if (data.previewDeployment) startPreview(state.deployments[data.previewDeployment].active, data.previewDeployment);
      else if (data.previewAsset) { const a = media(data.previewAsset); startPreview({ id: 'media-preview', name: a.name, advertiser: a.advertiser, mode: 'fullscreen', mediaType: a.type, idleSeconds: 5, alwaysOn: true, fit: 'contain', order: 'sequential', items: [{ assetId: a.id, seconds: 8 }], targets: [] }); }
      else if (data.addAsset) { draft.items.push({ assetId: data.addAsset, seconds: media(data.addAsset).type === 'video' ? media(data.addAsset).seconds : 8 }); dirty = true; syncEditor(); renderPlaylist(); $('pickerDialog').close(); }
      else if (data.move !== undefined) { const from = Number(data.move); const to = from + Number(data.direction); if (to < 0 || to >= draft.items.length) return; [draft.items[from], draft.items[to]] = [draft.items[to], draft.items[from]]; dirty = true; syncEditor(); renderPlaylist(); }
      else if (data.remove !== undefined) { draft.items.splice(Number(data.remove), 1); dirty = true; syncEditor(); renderPlaylist(); }
      else if (data.deleteAsset) { if (D.inUse(state, data.deleteAsset)) return toast('This media is used by a draft or published version and cannot be deleted.'); confirm('Delete Media?', `<p>Delete “${esc(media(data.deleteAsset).name)}” from this browser?</p>`, 'Delete', async () => { commit(next => { next.assets = next.assets.filter(a => a.id !== data.deleteAsset); }); await S.remove(data.deleteAsset); renderMedia(); toast('Media deleted.'); }); }
      else if (data.sync) {
        const d = state.deployments[data.sync];
        confirm('Simulate Terminal Sync', `<dl class="ads-summary"><dt>Terminal</dt><dd>${esc(d.sn)}</dd><dt>Requested</dt><dd>${d.stopped ? 'Stop playback' : `v${d.requested.version}`}</dd><dt>Active</dt><dd>${d.active ? 'v' + d.active.version : 'Default screen'}</dd></dl><label>Device outcome<select id="syncOutcome"><option value="success">Online &amp; idle — apply update</option><option value="offline" ${!terminal(d.sn)?.online ? 'selected' : ''}>Offline — keep current version</option><option value="busy">Payment in progress — wait for idle</option><option value="failed">Download failed — keep current version</option></select></label><p class="ads-notice">Simulated acknowledgement only. No command is sent to a real terminal.</p>`, 'Apply Simulation', async () => { const outcome = $('syncOutcome').value; if (outcome === 'success' && !d.stopped) for (const item of d.requested.items) await S.url(item.asset); commit(next => D.sync(next, d.sn, outcome)); renderDeployments(); toast('Demo sync result saved.'); });
      } else if (data.stop) confirm('Stop Campaign?', `<p>Stop “${esc(campaign(data.stop)?.name)}” on all its assigned terminals?</p><p class="ads-notice">A stop request is queued. Offline terminals can keep playing the cached version until they reconnect. Use Simulate Sync to acknowledge the stop.</p>`, 'Stop Campaign', () => { commit(next => D.stop(next, data.stop)); renderDeployments(); toast('Stop requests queued.'); });
    } catch (error) { toast(error.message); }
  });
  function startPreview(value, selectedSn) {
    if (!value) return;
    if (stopPreview) stopPreview();
    const sn = selectedSn || contextSn || value.targets?.[0] || 'WP53307Q39000001';
    $('previewTitle').textContent = value.name || 'Terminal Preview';
    if (!$('previewDialog').open) $('previewDialog').showModal();
    const player = P.mount({ host: $('liveDevice'), status: $('previewStatus'), campaign: value, sn, merchant: terminal(sn)?.merchant, assetFor: media, urlFor: S.url });
    $('simulatePayment').onclick = () => player.payment();
    $('returnIdle').onclick = () => player.idle();
    $('restartPreview').onclick = () => player.restart();
    stopPreview = () => { player.dispose(); stopPreview = null; };
  }
  $('previewDialog').addEventListener('close', () => { if (stopPreview) stopPreview(); });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('pagehide', () => { editorPreview?.dispose(); if (stopPreview) stopPreview(); });
  document.addEventListener('pw:before-navigate', event => { if (!dirty) return; event.preventDefault(); confirm('Discard Changes?', '<p>Leave this campaign and discard unsaved changes?</p>', 'Discard Changes', () => { dirty = false; event.detail.proceed(); }); });
  setView(params.get('view') || (contextSn ? 'deployments' : 'campaigns'));
  if (params.get('campaign') && campaign(params.get('campaign'))) openEditor(campaign(params.get('campaign')));
})();
