(function () {
  'use strict';
  const D = window.PaywizardUptimeDomain, S = window.PaywizardUptimeStore, Combo = window.PaywizardUptimeCombobox, V = window.PaywizardUptimeView;
  const directory = window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
  const $ = id => document.getElementById(id), esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const params = new URLSearchParams(location.search), fixedTerminal = params.get('sn') || '';
  let data, auth, allowed, asOf = Date.now(), start, end, organization = '', storeFilter = '', statusFilter = 'all', search = fixedTerminal, page = 0;
  let summaryCache = new Map(), rows = [], dates = [], selectedDay = null, editor = null, toastTimer;
  const combos = new Map(), days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function combo(id, options, value, onChange, label, disabled = false) {
    combos.get(id)?.destroy();
    combos.set(id, Combo.mount($(id), { options, value, onChange, label, disabled }));
  }
  function error(id, message, focus = false) {
    const node = $(id); node.textContent = message || ''; node.hidden = !message;
    if (message && focus) { node.scrollIntoView({ block: 'center', behavior: 'instant' }); node.focus({ preventScroll: true }); }
  }
  function toast(message) { clearTimeout(toastTimer); $('uptimeToast').textContent = message; $('uptimeToast').hidden = false; toastTimer = setTimeout(() => { $('uptimeToast').hidden = true; }, 3500); }
  function dateLabel(date) { return new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }); }
  const hhmm = minutes => String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  const parseTime = value => /^\d{2}:\d{2}$/.test(value) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
  function profileAuth() {
    return S.viewerAuth(data, localStorage.getItem('paywizard.portalAccessProfile.v1') || 'wizarpos', params);
  }
  function terminalUrl(sn) {
    const query = new URLSearchParams({ sn });
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
    combo('organizationPicker', [{ key: '', name: 'All organizations' }, ...accounts.map(a => ({ key: a.key, name: `${a.name} · ${a.type === 'provider' ? 'SP' : a.type === 'agent' ? 'Agent' : 'Merchant'}` }))], organization, value => {
      organization = value; if (storeFilter && !D.scopeStores(data, value || auth.scope).includes(storeFilter)) storeFilter = ''; filters(); page = 0; render();
    }, 'Organization');
    const scopedStores = data.stores.filter(s => allowed.includes(s.id) && (!organization || s.lineageKeys.includes(organization)));
    combo('storePicker', [{ key: '', name: 'All stores' }, ...scopedStores.map(s => ({ key: s.id, name: s.name }))], storeFilter, value => { storeFilter = value; page = 0; render(); }, 'Store');
    combo('statusPicker', [{ key: 'all', name: 'All terminals' }, { key: 'unreachable', name: 'With Unreachable time' }, { key: 'unavailable', name: 'With unavailable data' }], statusFilter, value => { statusFilter = value; page = 0; render(); }, 'Show');
  }
  function summary(t, date, storeIds = selectedStores()) {
    const key = [data.revision, data.observedAt, asOf, t.sn, date, storeIds.join(',')].join('|');
    if (!summaryCache.has(key)) summaryCache.set(key, D.reportDay(data, t, date, storeIds, asOf));
    return summaryCache.get(key);
  }
  function render() {
    const limits = dateLimits();
    if (!D.validDate(start) || !D.validDate(end) || start > end || start < limits.earliest || end > limits.latest || (Date.parse(end) - Date.parse(start)) / D.DAY > 89) {
      $('previousWeek').disabled = true; $('nextWeek').disabled = true;
      error('uptimeError', `Choose a date range within ${limits.earliest}–${limits.latest}, with at most 90 days.`, true); return;
    }
    error('uptimeError', '');
    dates = []; for (let d = start; d <= end; d = D.addDays(d, 1)) dates.push(d);
    const storeIds = selectedStores(), term = search.trim().toLowerCase();
    const candidates = data.terminals.filter(t => (!fixedTerminal || t.sn === fixedTerminal) && (!term || `${t.sn} ${t.name}`.toLowerCase().includes(term)) && t.memberships.some(m => storeIds.includes(m.storeId)));
    rows = candidates.map(t => {
      const cells = dates.map(d => summary(t, d, storeIds)), shown = cells.filter(Boolean);
      return { terminal: t, cells, unreachable: shown.reduce((n, x) => n + x.offline, 0), unavailable: shown.some(x => x.collectionUnavailable > 0), shown };
    }).filter(r => r.shown.length && (statusFilter === 'all' || (statusFilter === 'unreachable' ? r.unreachable > 0 : r.unavailable)));
    const rank = r => r.unreachable ? 0 : r.unavailable ? 1 : 2;
    rows.sort((a, b) => rank(a) - rank(b) || b.unreachable - a.unreachable || a.terminal.sn.localeCompare(b.terminal.sn));
    page = Math.max(0, Math.min(page, Math.ceil(rows.length / 10) - 1));
    $('uptimeStart').value = start; $('uptimeEnd').value = end;
    ['uptimeStart', 'uptimeEnd'].forEach(id => { $(id).min = limits.earliest; $(id).max = limits.latest; });
    $('previousWeek').disabled = start <= limits.earliest; $('nextWeek').disabled = end >= limits.latest;
    $('uptimeHead').innerHTML = '<tr><th class="up-terminal-col">Terminal S/N</th><th class="up-store-col">Store</th>' + dates.map(d => `<th class="up-date-col" scope="col" title="${d} · terminal local date">${dateLabel(d)}${d === limits.latest ? ' •' : ''}</th>`).join('') + '</tr>';
    $('uptimeRows').innerHTML = rows.slice(page * 10, page * 10 + 10).map(row => {
      const t = row.terminal, storeNames = [...new Set(row.shown.flatMap(r => r.storeIds))].map(id => data.stores.find(s => s.id === id)?.name).filter(Boolean);
      return `<tr data-sn="${esc(t.sn)}"><td class="up-terminal-col"><a class="up-terminal-label" href="${esc(terminalUrl(t.sn))}" title="${esc(t.name)}">${esc(t.sn)}</a><span class="up-mobile-store" title="${esc(storeNames.join(' / '))}">${esc(storeNames.join(' / '))}</span></td><td class="up-store-col"><span class="up-store-label">${esc(storeNames.join(' / '))}</span></td>` + row.cells.map(r => {
        // No pre-enrollment status, placeholder, button, or tooltip is emitted.
        if (!r) return '<td class="up-before" aria-hidden="true"></td>';
        return `<td>${V.cell(r, t.sn)}</td>`;
      }).join('') + '</tr>';
    }).join('');
    $('uptimeEmpty').hidden = rows.length > 0;
    $('uptimeCount').textContent = `${rows.length} terminal${rows.length === 1 ? '' : 's'} · Payment Service`;
    $('uptimeUpdated').textContent = 'Data updated: ' + new Date(data.observedAt).toLocaleString('en-GB', { timeZone: 'UTC', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' UTC';
    $('uptimeUpdated').title = new Date(data.observedAt).toISOString();
    $('uptimePageInfo').textContent = rows.length ? `${page * 10 + 1}–${Math.min(page * 10 + 10, rows.length)} of ${rows.length}` : '0 terminals';
    $('previousPage').disabled = page === 0; $('nextPage').disabled = (page + 1) * 10 >= rows.length;
    const storeWidth = innerWidth <= 700 ? 110 : innerWidth <= 1150 ? 125 : 155;
    const terminalWidth = innerWidth <= 700 ? 155 : innerWidth <= 1150 ? 195 : 230;
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
    if (!$('uptimeDayDialog').open) $('uptimeDayDialog').showModal();
  }
  function targetOptions() {
    return [
      ...data.stores.filter(s => allowed.includes(s.id)).map(s => ({ key: 'store:' + s.id, name: 'Store · ' + s.name })),
      ...data.terminals.filter(t => t.memberships.some(m => allowed.includes(m.storeId)) && D.membershipAt(t, asOf) && allowed.includes(D.membershipAt(t, asOf).storeId)).map(t => ({ key: 'terminal:' + t.sn, name: 'Terminal · ' + t.sn + ' · ' + t.name }))
    ];
  }
  function setTarget(key) {
    const split = key.indexOf(':'), target = { type: key.slice(0, split), id: key.slice(split + 1) };
    const terminal = target.type === 'terminal' ? data.terminals.find(t => t.sn === target.id) : null;
    const store = target.type === 'store' ? data.stores.find(s => s.id === target.id) : null;
    const effective = terminal ? D.effective(data, terminal, asOf) : null;
    const schedule = terminal ? effective.schedule : [...store.versions].sort((a, b) => b.from - a.from || b.sequence - a.sequence).find(v => v.from <= asOf)?.schedule || D.allDay(store.timeZone);
    editor = { target, terminal, store, mode: terminal && effective.source !== 'Terminal override' ? 'follow' : 'custom', draft: D.clone(schedule), canEdit: terminal ? D.canManageTerminal(data, auth, terminal, asOf) : D.canManageStore(data, auth, store.id) };
    error('hoursError', ''); renderEditor();
  }
  function openHours(key) {
    const options = targetOptions(); if (!options.length) return;
    const chosen = options.some(o => o.key === key) ? key : options.some(o => o.key === 'store:s-midtown') ? 'store:s-midtown' : options[0].key;
    combo('hoursTargetPicker', options, chosen, setTarget, 'Store or terminal');
    setTarget(chosen); $('operatingHoursDialog').showModal();
  }
  function displayedSchedule() {
    if (editor.mode !== 'follow') return editor.draft;
    const t = { ...editor.terminal, versions: [] };
    return D.effective(data, t, asOf).schedule;
  }
  function modeButtons(plan, key, disabled) {
    return `<div class="up-day-mode" role="group" aria-label="${esc(key.startsWith('w:') ? days[Number(key.slice(2))] : 'Exception')} operating mode">${[['all', '24 hours'], ['closed', 'Closed'], ['custom', 'Custom']].map(([mode, label]) => `<button type="button" data-plan="${key}" data-mode="${mode}" aria-pressed="${plan.mode === mode}" ${disabled ? 'disabled' : ''}>${label}</button>`).join('')}</div>`;
  }
  function periodFields(plan, key, disabled) {
    if (plan.mode !== 'custom') return '';
    const label = key.startsWith('w:') ? days[Number(key.slice(2))] : 'Exception ' + (Number(key.slice(2)) + 1);
    return `<div class="up-periods">${plan.intervals.map((p, i) => `<div class="up-period"><input type="time" aria-label="${esc(label)} period ${i + 1} start" value="${p.start === null ? '' : hhmm(p.start)}" data-plan="${key}" data-period="${i}" data-time="start" ${disabled ? 'disabled' : ''}><span>–</span><input type="time" aria-label="${esc(label)} period ${i + 1} end" value="${p.end === null ? '' : hhmm(p.end)}" data-plan="${key}" data-period="${i}" data-time="end" ${disabled ? 'disabled' : ''}><span class="up-next-day">${p.start !== null && p.end !== null && p.end < p.start ? 'next day' : ''}</span><button type="button" class="up-icon" data-remove-period="${i}" data-plan="${key}" aria-label="Remove ${esc(label)} period ${i + 1}" ${disabled ? 'disabled' : ''}>${icon('close')}</button></div>`).join('')}<button type="button" class="up-add-period" data-add-period="${key}" ${disabled ? 'disabled' : ''}>${icon('add')}Add period</button></div>`;
  }
  function renderEditor() {
    const schedule = displayedSchedule(), disabled = !editor.canEdit || editor.mode === 'follow';
    $('hoursMode').innerHTML = editor.terminal ? `<button type="button" data-hours-mode="follow" aria-pressed="${editor.mode === 'follow'}" ${!editor.canEdit ? 'disabled' : ''}>Follow Store</button><button type="button" data-hours-mode="custom" aria-pressed="${editor.mode === 'custom'}" ${!editor.canEdit ? 'disabled' : ''}>Custom hours</button>` : '';
    $('hoursFields').innerHTML = `${!editor.canEdit ? '<p class="up-readonly">View only</p>' : ''}<label class="up-field">Time zone<div id="hoursZonePicker"></div></label><div class="up-week">${schedule.week.map((plan, i) => `<div class="up-week-row"><div class="up-weekday">${days[i]}</div>${modeButtons(plan, 'w:' + i, disabled)}${periodFields(plan, 'w:' + i, disabled)}</div>`).join('')}</div><section class="up-exceptions"><div class="up-section-heading"><h3>Date exceptions</h3><button type="button" id="addException" ${disabled ? 'disabled' : ''}>${icon('add')}Add date</button></div>${schedule.exceptions.map((x, i) => `<div class="up-exception-row"><div class="up-exception-header"><input type="date" value="${esc(x.date)}" data-exception-date="${i}" aria-label="Exception ${i + 1} date" ${disabled ? 'disabled' : ''}>${modeButtons(x.plan, 'e:' + i, disabled)}<button type="button" class="up-icon" data-remove-exception="${i}" aria-label="Remove exception ${i + 1}" ${disabled ? 'disabled' : ''}>${icon('delete')}</button></div>${periodFields(x.plan, 'e:' + i, disabled)}</div>`).join('')}</section>`;
    const zones = [...new Set([schedule.timeZone, 'UTC', ...(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['America/New_York', 'America/Los_Angeles', 'Europe/Berlin', 'Europe/Warsaw', 'Asia/Shanghai'])])];
    combo('hoursZonePicker', zones.map(z => ({ key: z, name: z.replace(/_/g, ' ') })), schedule.timeZone, z => { editor.draft.timeZone = z; preview(); }, 'Time zone', disabled);
    const versions = (editor.terminal || editor.store).versions.filter(v => !editor.terminal || allowed.includes(v.storeId));
    $('hoursHistoryTitle').textContent = `Change history (${versions.length})`;
    $('hoursHistory').innerHTML = `<table class="up-detail-table"><thead><tr><th>Effective from</th><th>Changed by</th><th>Schedule</th><th>Time zone</th></tr></thead><tbody>${[...versions].reverse().map(v => `<tr><td>${esc(new Date(v.from).toLocaleString('en-GB'))}</td><td>${esc(v.actor)}</td><td>${v.mode === 'follow' ? 'Follow Store' : editor.terminal ? 'Terminal override' : 'Store schedule'}</td><td>${esc(v.schedule?.timeZone || 'Store time zone')}</td></tr>`).join('')}</tbody></table>`;
    $('saveOperatingHours').hidden = !editor.canEdit;
    let impact = 'Applies from Save. Previous operating hours remain in history.';
    if (editor.store) {
      const count = data.terminals.filter(t => { const e = D.effective(data, t, asOf); return e?.store.id === editor.store.id && e.source !== 'Terminal override'; }).length;
      impact = `${count} following terminal${count === 1 ? '' : 's'} affected. ` + impact;
    }
    $('hoursImpact').textContent = editor.canEdit ? impact : 'You can view this schedule. Editing requires management permission.';
    preview();
  }
  function preview() {
    const schedule = displayedSchedule(), errors = D.validateSchedule(schedule);
    error('hoursError', errors[0] || '');
    $('hoursFields').querySelectorAll('.up-week-row').forEach((row, i) => {
      const invalid = errors.some(message => message.includes(days[i])); row.classList.toggle('up-invalid', invalid);
      row.querySelectorAll('input').forEach(input => input.setAttribute('aria-invalid', String(invalid)));
    });
    if (errors.length) { $('hoursPreview').innerHTML = '<div class="up-readonly">Correct the highlighted schedule before previewing.</div>'; return; }
    const today = D.parts(asOf, schedule.timeZone).date;
    $('hoursPreview').innerHTML = '<div class="up-preview-grid">' + Array.from({ length: 7 }, (_, i) => {
      const date = D.addDays(today, i), periods = []; let opened = null;
      for (let m = 0; m <= 1440; m++) { const on = m < 1440 && D.operating(schedule, date, m); if (on && opened === null) opened = m; if (!on && opened !== null) { periods.push(hhmm(opened) + '–' + hhmm(m)); opened = null; } }
      return `<div class="up-preview-day"><b>${dateLabel(date)}</b>${periods.length ? periods.map(p => `<span>${p}</span>`).join('') : '<span>Closed</span>'}</div>`;
    }).join('') + '</div>';
  }
  function planFor(key) { return key.startsWith('w:') ? editor.draft.week[Number(key.slice(2))] : editor.draft.exceptions[Number(key.slice(2))].plan; }
  function closeDialog(id) { combos.forEach(c => c.close()); $(id).close(); if (id === 'operatingHoursDialog') editor = null; }
  $('operatingHoursForm').addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || !editor || !editor.canEdit || button.disabled) return;
    if (button.hasAttribute('data-hours-mode')) {
      if (button.dataset.hoursMode === 'custom' && editor.mode === 'follow') editor.draft = D.clone(displayedSchedule());
      editor.mode = button.dataset.hoursMode; renderEditor();
    } else if (button.hasAttribute('data-mode')) {
      const plan = planFor(button.dataset.plan); plan.mode = button.dataset.mode;
      if (plan.mode === 'custom' && !plan.intervals.length) plan.intervals = [{ start: 480, end: 1200 }]; renderEditor();
    } else if (button.hasAttribute('data-add-period')) {
      const plan = planFor(button.dataset.addPeriod), last = plan.intervals[plan.intervals.length - 1], next = last?.end && last.end < 1380 ? last.end : 480;
      plan.intervals.push({ start: next, end: next + 60 }); renderEditor();
    } else if (button.hasAttribute('data-remove-period')) {
      planFor(button.dataset.plan).intervals.splice(Number(button.dataset.removePeriod), 1); renderEditor();
    } else if (button.id === 'addException') {
      let date = D.parts(asOf, editor.draft.timeZone).date;
      while (editor.draft.exceptions.some(x => x.date === date)) date = D.addDays(date, 1);
      editor.draft.exceptions.push({ date, plan: { mode: 'closed', intervals: [] } }); renderEditor();
      $('hoursFields').querySelector('.up-exception-row:last-child')?.scrollIntoView({ block: 'center' });
    } else if (button.hasAttribute('data-remove-exception')) { editor.draft.exceptions.splice(Number(button.dataset.removeException), 1); renderEditor(); }
  });
  $('operatingHoursForm').addEventListener('change', event => {
    const input = event.target; if (!editor || !editor.canEdit || editor.mode === 'follow') return;
    if (input.hasAttribute('data-time')) {
      const p = planFor(input.dataset.plan).intervals[Number(input.dataset.period)]; p[input.dataset.time] = parseTime(input.value);
      input.closest('.up-period').querySelector('.up-next-day').textContent = p.start !== null && p.end !== null && p.end < p.start ? 'next day' : ''; preview();
    }
    if (input.hasAttribute('data-exception-date')) { editor.draft.exceptions[Number(input.dataset.exceptionDate)].date = input.value; preview(); }
  });
  $('operatingHoursForm').addEventListener('submit', event => {
    event.preventDefault(); if (!editor?.canEdit) return;
    try {
      const now = Date.now(), next = D.saveSchedule(data, auth, editor.target, editor.draft, editor.mode, now);
      data = S.persist(localStorage, S.refresh(next, now), data.revision); asOf = now; summaryCache.clear(); closeDialog('operatingHoursDialog'); render(); toast('Operating Hours saved');
    } catch (e) { error('hoursError', e.message, true); }
  });
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]'); if (close) closeDialog(close.dataset.close);
    const day = event.target.closest('[data-day][data-terminal]'); if (day) openDay(day.dataset.terminal, day.dataset.day);
  });
  $('operatingHoursDialog').addEventListener('cancel', () => { combos.forEach(c => c.close()); editor = null; });
  $('uptimeDayDialog').addEventListener('cancel', () => { selectedDay = null; });
  $('dayPrevious').addEventListener('click', () => openDay(selectedDay.sn, D.addDays(selectedDay.date, -1)));
  $('dayNext').addEventListener('click', () => openDay(selectedDay.sn, D.addDays(selectedDay.date, 1)));
  $('dayHours').addEventListener('click', () => { const sn = selectedDay.sn; closeDialog('uptimeDayDialog'); openHours('terminal:' + sn); });
  $('manageHours').addEventListener('click', () => openHours(fixedTerminal ? 'terminal:' + fixedTerminal : storeFilter ? 'store:' + storeFilter : null));
  $('refreshUptime').addEventListener('click', () => {
    try {
      const now = Date.now();
      data = S.load(localStorage, directory, now); asOf = now; summaryCache.clear(); auth = profileAuth(); allowed = D.scopeStores(data, auth.scope); filters(); render(); toast('Uptime data refreshed');
    } catch (e) { error('uptimeError', 'Refresh failed. Last successful data is still displayed. ' + e.message, true); }
  });
  $('terminalSearch').addEventListener('input', event => { search = event.target.value; page = 0; render(); });
  $('uptimeStart').addEventListener('change', event => { start = event.target.value; page = 0; render(); });
  $('uptimeEnd').addEventListener('change', event => { end = event.target.value; page = 0; render(); });
  $('recentWeek').addEventListener('click', () => { const limits = dateLimits(); end = limits.latest; start = [D.addDays(end, -6), limits.earliest].sort().pop(); page = 0; render(); });
  function shiftRange(direction) {
    const limits = dateLimits(), span = Math.round((Date.parse(end) - Date.parse(start)) / D.DAY); start = D.addDays(start, direction * 7); end = D.addDays(end, direction * 7);
    if (start < limits.earliest) { start = limits.earliest; end = D.addDays(start, span); }
    if (end > limits.latest) { end = limits.latest; start = D.addDays(end, -span); }
    if (start < limits.earliest) start = limits.earliest;
    page = 0; render();
  }
  $('previousWeek').addEventListener('click', () => shiftRange(-1)); $('nextWeek').addEventListener('click', () => shiftRange(1));
  $('previousPage').addEventListener('click', () => { page--; render(); }); $('nextPage').addEventListener('click', () => { page++; render(); });
  window.addEventListener('resize', () => { if (data) render(); });
  try {
    data = S.load(localStorage, directory, asOf); auth = profileAuth(); allowed = D.scopeStores(data, auth.scope);
    const limits = dateLimits(); end = limits.latest; start = [D.addDays(end, -6), limits.earliest].sort().pop();
    if (fixedTerminal) {
      $('terminalSearch').value = fixedTerminal; $('terminalSearch').readOnly = true;
    }
    filters(); render();
    if (params.get('hours') === '1' && fixedTerminal && !$('manageHours').disabled) openHours('terminal:' + fixedTerminal);
    const requestedDay = params.get('date');
    if (fixedTerminal && D.validDate(requestedDay)) openDay(fixedTerminal, requestedDay);
  } catch (e) { error('uptimeError', e.message, true); $('manageHours').disabled = true; $('refreshUptime').disabled = true; }
})();
