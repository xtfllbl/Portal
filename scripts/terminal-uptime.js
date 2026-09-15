(function () {
  'use strict';
  const D = window.PaywizardUptimeDomain, S = window.PaywizardUptimeStore, Combo = window.PaywizardUptimeCombobox, V = window.PaywizardUptimeView;
  const directory = window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
  const $ = id => document.getElementById(id), esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const params = new URLSearchParams(location.search), fixedTerminal = S.resolveSn(params.get('sn') || '');
  let data, auth, allowed, asOf = Date.now(), start, end, organization = '', storeFilter = '', statusFilter = 'all', search = fixedTerminal, page = 0;
  let summaryCache = new Map(), rows = [], dates = [], selectedDay = null;
  let draft = { organization: '', store: '', status: 'all', end: '' }, weekPicker;
  const combos = new Map();
  function combo(id, options, value, onChange, label, disabled = false) {
    combos.get(id)?.destroy();
    combos.set(id, Combo.mount($(id), { options, value, onChange, label, disabled }));
  }
  function error(id, message, focus = false) {
    const node = $(id); node.textContent = message || ''; node.hidden = !message;
    if (message && focus) { node.scrollIntoView({ block: 'center', behavior: 'instant' }); node.focus({ preventScroll: true }); }
  }
  function dateLabel(date) { return new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }); }
  function profileAuth() {
    return S.viewerAuth(data, localStorage.getItem('paywizard.portalAccessProfile.v1') || 'wizarpos', params);
  }
  function terminalUrl(sn) {
    const terminal = data.terminals.find(t => t.sn === sn);
    const query = new URLSearchParams({ sn: terminal?.legacySn || sn, terminalName: terminal?.name || sn });
    if (terminal?.legacySn) query.set('hardwareSn', sn);
    if (auth.scope !== 'all') query.set('scope', auth.scope);
    if (!auth.manage) query.set('access', 'view');
    return '1.terminalmanage_nayax.html?' + query;
  }
  function dateLimits() {
    const terminal = fixedTerminal ? data.terminals.find(t => t.sn === fixedTerminal) : null;
    const membership = terminal?.memberships.filter(m => allowed.includes(m.storeId)).sort((a, b) => b.from - a.from)[0];
    const plan = membership && D.effective(data, terminal, Math.min(asOf, (membership.to ?? asOf + 1) - 1));
    const zones = plan ? [plan.schedule.timeZone] : data.stores.filter(s => allowed.includes(s.id)).flatMap(s => s.versions.filter(v => v.from <= asOf && v.schedule).map(v => v.schedule.timeZone));
    if (!terminal) data.terminals.forEach(t => { const e = D.effective(data, t, asOf); if (e && allowed.includes(e.store.id)) zones.push(e.schedule.timeZone); });
    const localDates = (zones.length ? zones : ['UTC']).map(z => D.parts(asOf, z).date).sort();
    const latest = localDates[localDates.length - 1];
    let earliest = D.monthsAgo(localDates[0]);
    if (terminal) {
      const starts = terminal.memberships.filter(m => allowed.includes(m.storeId)).map(m => {
        const joined = Math.max(terminal.enrolledAt, m.from), e = D.effective(data, terminal, joined);
        return D.parts(joined, e?.schedule.timeZone || 'UTC').date;
      }).sort();
      if (starts.length && starts[0] > earliest) earliest = starts[0];
    }
    return { latest, earliest };
  }
  function selectedStores() {
    const byOrg = organization ? D.scopeStores(data, organization) : allowed;
    return allowed.filter(id => byOrg.includes(id) && (!storeFilter || id === storeFilter));
  }
  function filters() {
    const accounts = directory.accounts.filter(a => a.type !== 'store' && data.stores.some(s => allowed.includes(s.id) && s.lineageKeys.includes(a.key)));
    $('organizationField').hidden = auth.scope.startsWith('store:');
    combo('organizationPicker', [{ key: '', name: 'All organizations' }, ...accounts.map(a => ({ key: a.key, name: `${a.name} · ${a.type === 'provider' ? 'SP' : a.type === 'agent' ? 'Agent' : 'Merchant'}` }))], draft.organization, value => {
      draft.organization = value;
      if (draft.store && !D.scopeStores(data, value || auth.scope).includes(draft.store)) draft.store = '';
      filters();
    }, 'Organization');
    const scopedStores = data.stores.filter(s => allowed.includes(s.id) && (!draft.organization || s.lineageKeys.includes(draft.organization)));
    combo('storePicker', [{ key: '', name: 'All stores' }, ...scopedStores.map(s => ({ key: s.id, name: s.name }))], draft.store, value => { draft.store = value; }, 'Store');
    combo('statusPicker', [{ key: 'all', name: 'All terminals' }, { key: 'unreachable', name: 'With offline time' }, { key: 'unavailable', name: 'With no data' }], draft.status, value => { draft.status = value; }, 'Show');
  }
  function summary(t, date, storeIds = selectedStores()) {
    const key = [data.revision, data.observedAt, asOf, t.sn, date, storeIds.join(',')].join('|');
    if (!summaryCache.has(key)) summaryCache.set(key, D.reportDay(data, t, date, storeIds, asOf));
    return summaryCache.get(key);
  }
  function render() {
    const limits = dateLimits();
    if (!D.validDate(end) || start !== D.addDays(end, -6) || end < limits.earliest || end > limits.latest) {
      error('uptimeError', `Choose an end date from ${limits.earliest} to ${limits.latest}. Each range contains 7 days.`, true); return;
    }
    error('uptimeError', '');
    dates = []; for (let d = start; d <= end; d = D.addDays(d, 1)) dates.push(d);
    const storeIds = selectedStores(), term = search.trim().toLowerCase();
    const candidates = data.terminals.filter(t => (!fixedTerminal || t.sn === fixedTerminal) && (!term || `${t.sn} ${t.legacySn || ''} ${t.name}`.toLowerCase().includes(term)) && t.memberships.some(m => storeIds.includes(m.storeId)));
    rows = candidates.map(t => {
      const cells = dates.map(d => summary(t, d, storeIds)), shown = cells.filter(Boolean);
      return { terminal: t, cells, unreachable: shown.reduce((n, x) => n + x.offline, 0), unavailable: shown.some(x => x.state === 'unavailable'), shown };
    }).filter(r => r.shown.length && (statusFilter === 'all' || (statusFilter === 'unreachable' ? r.unreachable > 0 : r.unavailable)));
    const rank = r => r.unreachable ? 0 : r.unavailable ? 1 : 2;
    rows.sort((a, b) => rank(a) - rank(b) || b.unreachable - a.unreachable || a.terminal.sn.localeCompare(b.terminal.sn));
    page = Math.max(0, Math.min(page, Math.ceil(rows.length / 10) - 1));
    $('uptimeHead').innerHTML = '<tr><th class="up-terminal-col">Terminal S/N</th><th class="up-store-col">Store</th>' + dates.map(d => `<th class="up-date-col" scope="col" title="${d} · terminal local date">${dateLabel(d)}${d === limits.latest ? ' •' : ''}</th>`).join('') + '</tr>';
    $('uptimeRows').innerHTML = rows.slice(page * 10, page * 10 + 10).map(row => {
      const t = row.terminal, storeNames = [...new Set(row.shown.flatMap(r => r.storeIds))].map(id => data.stores.find(s => s.id === id)?.name).filter(Boolean);
      return `<tr data-sn="${esc(t.sn)}"><td class="up-terminal-col"><a class="up-terminal-label" href="${esc(terminalUrl(t.sn))}" title="${esc(t.name)}">${esc(t.sn)}</a><span class="up-mobile-store" title="${esc(storeNames.join(' / '))}">${esc(storeNames.join(' / '))}</span></td><td class="up-store-col"><span class="up-store-label" title="${esc(storeNames.join(' / '))}">${esc(storeNames.join(' / '))}</span></td>` + row.cells.map((r, index) => {
        if (!r) {
          const membership = t.memberships.filter(m => storeIds.includes(m.storeId)).sort((a, b) => b.from - a.from)[0];
          const plan = membership && D.effective(data, t, Math.min(asOf, (membership.to ?? asOf + 1) - 1));
          const zone = plan?.schedule.timeZone || 'UTC', localDate = D.parts(asOf, zone).date;
          const dayStart = D.localEpoch(dates[index], 0, zone), dayEnd = D.localEpoch(D.addDays(dates[index], 1), 0, zone);
          const inMembership = t.memberships.some(m => storeIds.includes(m.storeId) && m.from < dayEnd && (m.to ?? Infinity) > dayStart);
          const label = dates[index] < D.parts(t.enrolledAt, zone).date ? 'Not enrolled' : !inMembership ? '—' : dates[index] > localDate ? 'Upcoming' : '—';
          const hint = label === 'Upcoming' ? `Local date: ${localDate} · ${zone}` : label === 'Not enrolled' ? 'Monitoring had not started for this terminal on this date.' : 'No visible history for this date.';
          return `<td><span class="up-empty-day" title="${esc(hint)}" aria-label="${esc(hint)}">${label}</span></td>`;
        }
        return `<td>${V.cell(r, t.sn)}</td>`;
      }).join('') + '</tr>';
    }).join('');
    $('uptimeEmpty').hidden = rows.length > 0;
    $('uptimeCount').textContent = `${rows.length} terminal${rows.length === 1 ? '' : 's'} · Payment Service`;
    $('uptimeUpdated').textContent = 'Data updated: ' + new Date(data.observedAt).toLocaleString('en-GB', { timeZone: 'UTC', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' UTC';
    $('uptimeUpdated').title = new Date(data.observedAt).toISOString();
    $('uptimePageInfo').textContent = rows.length ? `${page * 10 + 1}–${Math.min(page * 10 + 10, rows.length)} of ${rows.length}` : '0 terminals';
    $('previousPage').disabled = page === 0; $('nextPage').disabled = (page + 1) * 10 >= rows.length;
    const storeWidth = innerWidth <= 1150 ? 150 : 200;
    const terminalWidth = innerWidth <= 1150 ? 180 : 200;
    const matrix = $('uptimeHead').closest('table');
    matrix.classList.toggle('up-week-view', dates.length <= 7);
    matrix.style.minWidth = dates.length <= 7 ? '100%' : `${terminalWidth + storeWidth + dates.length * (innerWidth <= 700 ? 76 : 82)}px`;
    matrix.style.setProperty('--up-days', dates.length);
    const fixed = fixedTerminal && data.terminals.find(t => t.sn === fixedTerminal);
    $('manageHours').disabled = !allowed.length || !!fixedTerminal && (!fixed || !D.membershipAt(fixed, asOf) || !allowed.includes(D.membershipAt(fixed, asOf).storeId));
  }
  function openDay(sn, date) {
    const t = data.terminals.find(x => x.sn === sn), r = t && summary(t, date);
    if (!r) return;
    selectedDay = { sn, date };
    $('uptimeDayTitle').textContent = `${dateLabel(date)} · Payment Service`;
    $('uptimeDayContent').innerHTML = V.dayContent(data, t, r);
    $('dayPrevious').disabled = !summary(t, D.addDays(date, -1)); $('dayNext').disabled = !summary(t, D.addDays(date, 1));
    $('dayHours').disabled = !D.canManageTerminal(data, auth, t, asOf);
    $('uptimeDayContent').scrollTop = 0;
    V.openDrawer($('uptimeDayDialog'));
  }
  function openHours(key) {
    const split = key?.indexOf(':');
    try {
      window.PaywizardOperatingHours.open({
        target: key ? { type: key.slice(0, split), id: key.slice(split + 1) } : undefined,
        locked: !!fixedTerminal,
        onSave(next) { data = next; asOf = Date.now(); auth = profileAuth(); allowed = D.scopeStores(data, auth.scope); summaryCache.clear(); render(); }
      });
    } catch (e) { error('uptimeError', e.message, true); }
  }
  function closeDialog(id) {
    combos.forEach(c => c.close());
    if (id === 'uptimeDayDialog') return V.closeDrawer($(id));
    $(id)?.close();
  }
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]'); if (close) closeDialog(close.dataset.close);
    const day = event.target.closest('[data-day][data-terminal]'); if (day) openDay(day.dataset.terminal, day.dataset.day);
  });
  $('uptimeDayDialog').addEventListener('cancel', () => { selectedDay = null; });
  $('dayPrevious').addEventListener('click', () => openDay(selectedDay.sn, D.addDays(selectedDay.date, -1)));
  $('dayNext').addEventListener('click', () => openDay(selectedDay.sn, D.addDays(selectedDay.date, 1)));
  $('dayHours').addEventListener('click', async () => { const sn = selectedDay.sn; await closeDialog('uptimeDayDialog'); openHours('terminal:' + sn); });
  $('manageHours').addEventListener('click', () => openHours(fixedTerminal ? 'terminal:' + fixedTerminal : storeFilter ? 'store:' + storeFilter : null));
  $('uptimeFilters').addEventListener('submit', event => {
    event.preventDefault();
    const limits = dateLimits();
    if (!D.validDate(draft.end) || draft.end < limits.earliest || draft.end > limits.latest) {
      error('uptimeError', `Choose an end date from ${limits.earliest} to ${limits.latest}. Each range contains 7 days.`, true); return;
    }
    combos.forEach(c => c.close()); weekPicker.close();
    organization = draft.organization; storeFilter = draft.store; statusFilter = draft.status;
    search = fixedTerminal || $('terminalSearch').value; end = draft.end; start = D.addDays(end, -6);
    page = 0; render();
  });
  $('previousPage').addEventListener('click', () => { page--; render(); }); $('nextPage').addEventListener('click', () => { page++; render(); });
  window.addEventListener('resize', () => { if (data) render(); });
  try {
    data = S.load(localStorage, directory, asOf); auth = profileAuth(); allowed = D.scopeStores(data, auth.scope);
    const limits = dateLimits(), requestedDate = params.get('date');
    end = D.validDate(requestedDate) && requestedDate >= limits.earliest && requestedDate <= limits.latest ? requestedDate : limits.latest;
    start = D.addDays(end, -6); draft.end = end;
    weekPicker = window.PaywizardUptimeWeekPicker.mount({ value: end, limits: dateLimits, onChange: value => { draft.end = value; } });
    if (fixedTerminal) {
      $('terminalSearch').value = fixedTerminal; $('terminalSearch').readOnly = true;
    }
    filters(); render();
    if (params.get('hours') === '1' && fixedTerminal && !$('manageHours').disabled) openHours('terminal:' + fixedTerminal);
    const requestedDay = params.get('date');
    if (fixedTerminal && D.validDate(requestedDay)) openDay(fixedTerminal, requestedDay);
  } catch (e) { error('uptimeError', e.message, true); $('manageHours').disabled = true; }
})();
