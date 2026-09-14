(function () {
  'use strict';
  const D = window.PaywizardUptimeDomain;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const dateLabel = date => new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  const drawerBindings = new WeakSet(), drawerClosings = new WeakMap();
  function openDrawer(dialog) {
    if (!drawerBindings.has(dialog)) {
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeDrawer(dialog); });
      drawerBindings.add(dialog);
    }
    if (!dialog.open) dialog.showModal();
  }
  function closeDrawer(dialog) {
    if (drawerClosings.has(dialog)) return drawerClosings.get(dialog);
    if (!dialog.open) return Promise.resolve();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { dialog.close(); return Promise.resolve(); }
    const closing = new Promise(resolve => {
      let timer;
      const finish = () => {
        clearTimeout(timer);
        dialog.removeEventListener('animationend', ended);
        dialog.removeEventListener('close', finish);
        if (dialog.open) dialog.close();
        delete dialog.dataset.closing;
        drawerClosings.delete(dialog);
        resolve();
      };
      const ended = event => { if (event.target === dialog && !event.pseudoElement && event.animationName === 'up-drawer-out') finish(); };
      dialog.addEventListener('animationend', ended);
      dialog.addEventListener('close', finish);
      dialog.dataset.closing = '';
      // Complete closing even when animations are interrupted by a stylesheet reload.
      timer = setTimeout(finish, 240);
    });
    drawerClosings.set(dialog, closing);
    return closing;
  }
  const timeLabel = (at, zone, seconds = false) => new Date(at).toLocaleTimeString('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}) });
  const isUnavailable = s => s.state === 'unknown' && ['collection_failure', 'conflicting_observations'].includes(s.cause);
  const observationClass = s => ['online', 'future'].includes(s.state) ? s.state : isUnavailable(s) ? 'unavailable' : 'unreachable';
  function segmentLabel(s) {
    const state = observationClass(s);
    if (state === 'online') return 'Online';
    if (state === 'future') return 'Upcoming';
    if (state === 'unavailable') return s.cause === 'conflicting_observations' ? 'Conflicting reports' : 'Collection unavailable';
    return 'Offline';
  }
  function segmentClass(s) {
    if (s.state === 'future') return 'future';
    return s.operating ? observationClass(s) : 'outside';
  }
  function displaySegments(result) {
    // Keep original observations intact; join adjacent intervals that express
    // the same service state within the same schedule and access boundary.
    return result.segments.reduce((all, segment) => {
      const previous = all[all.length - 1];
      if (previous && previous.to === segment.from && segmentLabel(previous) === segmentLabel(segment) && ['operating', 'timeZone', 'storeId', 'source', 'versionFrom'].every(key => previous[key] === segment[key])) previous.to = segment.to;
      else all.push({ ...segment });
      return all;
    }, []);
  }
  function endLabel(s, date, seconds = false) {
    return D.parts(s.to, s.timeZone).date > date ? seconds ? '24:00:00' : '24:00' : timeLabel(s.to, s.timeZone, seconds);
  }
  function track(result, detail = false) {
    const first = result.segments[0].from, last = result.segments[result.segments.length - 1].to, length = last - first;
    let cursor = first;
    return displaySegments(result).map(s => {
      const gap = s.from > cursor ? `<span class="up-segment outside" style="width:${(s.from - cursor) / length * 100}%" aria-hidden="true"></span>` : '';
      cursor = s.to;
      const label = `${timeLabel(s.from, s.timeZone, detail)}–${endLabel(s, result.date, detail)} · ${segmentLabel(s)} · ${s.operating ? 'Operating hours' : 'Outside operating hours'}`;
      return gap + `<span class="up-segment ${segmentClass(s)}" style="width:${(s.to - s.from) / length * 100}%" title="${esc(label)}"></span>`;
    }).join('');
  }
  function progress(result) {
    return result.inProgress ? `<span class="up-progress" title="Today is still in progress">${icon('schedule')}<span>In progress</span></span>` : '';
  }
  function resultNote(result) {
    if (result.state === 'unavailable') return 'No data';
    if (result.state === 'pending') {
      const opening = result.segments.find(s => s.operating && s.state === 'future');
      return opening ? `Starts at ${timeLabel(opening.from, opening.timeZone)}` : '';
    }
    return '';
  }
  function cell(result, sn, summary = false) {
    const note = resultNote(result);
    const label = `${sn}, ${result.date}, ${note || D.rateText(result)}${result.inProgress ? ', Today in progress' : ''}${result.hasOffline ? ', Offline ' + D.duration(result.offline) : ''}`;
    return `<button type="button" class="up-cell ${result.state}${summary ? ' up-summary-day' : ''}${result.inProgress ? ' is-progress' : ''}" data-day="${result.date}" data-terminal="${esc(sn)}" aria-label="${esc(label)}"${note ? ` title="${esc(note)}"` : ''}>${summary ? `<span class="up-summary-date">${dateLabel(result.date)}</span>` : ''}<span class="up-cell-text">${esc(D.rateText(result))}</span>${note ? '' : `<span class="up-mini-track" aria-hidden="true">${track(result)}</span>`}${progress(result)}</button>`;
  }
  function legend() {
    return `<span><i class="up-key online"></i>≥95%</span><span><i class="up-key warning"></i>90–&lt;95%</span><span><i class="up-key offline"></i>&lt;90%</span><span><i class="up-key closed"></i>Outside hours</span><span class="up-progress-legend">${icon('schedule')}Today in progress</span>`;
  }
  function dayContent(data, terminal, r) {
    const stores = r.storeIds.map(id => data.stores.find(s => s.id === id)?.name).filter(Boolean).join(' / ');
    const opening = r.segments.filter(s => s.operating).reduce((all, s) => {
      const p = all[all.length - 1]; if (p && p.to === s.from && p.timeZone === s.timeZone) p.to = s.to; else all.push({ ...s }); return all;
    }, []);
    const scheduleText = opening.map(s => `${timeLabel(s.from, s.timeZone)}–${endLabel(s, r.date)}`).join(', ') || 'Closed';
    const first = r.segments[0], last = r.segments[r.segments.length - 1];
    const note = resultNote(r), hasCountedData = r.online + r.offline > 0;
    return `<div class="up-day-result ${r.state}"><strong>${esc(D.rateText(r))}</strong>${note ? `<span class="up-result-note"${r.collectionUnavailable ? ` title="${esc(D.duration(r.collectionUnavailable))} of operating hours could not be assessed because collection was unavailable or reports conflicted."` : ''}>${esc(note)}</span>` : ''}${progress(r)}</div>
      <dl class="up-day-facts"><div><dt>Terminal S/N</dt><dd>${esc(terminal.sn)}</dd></div><div><dt>Store</dt><dd>${esc(stores)}</dd></div><div><dt>Operating hours</dt><dd>${esc(scheduleText)}</dd></div><div><dt>Time zone</dt><dd>${esc(r.timeZones.join(' / '))}</dd></div></dl>
      ${hasCountedData ? `<div class="up-day-stats"><article><span>Online</span><strong class="green">${D.duration(r.online)}</strong></article><article><span>Offline</span><strong class="red">${D.duration(r.offline)}</strong></article></div>` : ''}
      ${r.hasOffline ? '<p class="up-data-note">Offline means no service communication was received; the cause is unknown.</p>' : ''}
      ${r.collectionUnavailable && hasCountedData ? `<p class="up-data-note">${D.duration(r.collectionUnavailable)} of operating hours without data.</p>` : ''}
      <section class="up-timeline" aria-label="Daily Payment Service timeline"><div class="up-timeline-track">${track(r, true)}</div><div class="up-axis"><span>${timeLabel(first.from, first.timeZone)}</span><span>${D.duration(last.to - first.from)}</span><span>${endLabel(last, r.date)}</span></div><div class="up-legend"><span><i class="up-key online"></i>Online</span><span><i class="up-key unreachable"></i>Offline</span><span><i class="up-key closed"></i>Outside hours</span>${r.collectionUnavailable ? '<span><i class="up-key unavailable"></i>No data</span>' : ''}</div></section>
      <div class="up-detail-scroll"><table class="up-detail-table"><thead><tr><th>Time</th><th>Payment Service</th><th>Operating hours</th><th>Duration</th></tr></thead><tbody>${displaySegments(r).map(s => `<tr><td>${timeLabel(s.from, s.timeZone, true)}–${endLabel(s, r.date, true)}</td><td><i class="up-dot ${observationClass(s)}"></i>${segmentLabel(s)}</td><td>${s.operating ? 'Within hours' : 'Outside hours'}</td><td>${D.duration(s.to - s.from)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  window.PaywizardUptimeView = { esc, icon, dateLabel, timeLabel, track, cell, legend, dayContent, openDrawer, closeDrawer };
})();
