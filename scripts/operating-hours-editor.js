(function () {
  'use strict';
  const D = window.PaywizardUptimeDomain, S = window.PaywizardUptimeStore, Combo = window.PaywizardUptimeCombobox;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const time = m => m == null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const parseTime = value => /^\d{2}:\d{2}$/.test(value) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
  const btn = (label, attrs = '') => `<button type="button" ${attrs}>${label}</button>`;
  let dialog, state, data, auth, directory, options, drag, suppressClick = false;
  const combos = new Map();
  const $ = id => dialog.querySelector('#' + id);
  const current = () => state.mode === 'follow' ? D.effective(data, { ...state.terminal, versions: [] }, state.at).schedule : state.draft;
  const editable = () => state?.canEdit && state.mode !== 'follow';
  function destroyCombos() { combos.forEach(c => c.destroy()); combos.clear(); }
  function combo(id, items, value, onChange, label, disabled = false) {
    combos.get(id)?.destroy(); combos.set(id, Combo.mount($(id), { options: items, value, onChange, label, disabled }));
  }
  function showError(message, focus = false) {
    const el = $('hoursError'); el.textContent = message || ''; el.hidden = !message;
    if (message && focus) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
  }
  function create() {
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.id = 'operatingHoursDialog';
    dialog.className = 'up-dialog oh-dialog'; dialog.setAttribute('aria-labelledby', 'hoursTitle');
    dialog.innerHTML = `<form id="operatingHoursForm" novalidate><header class="up-dialog-heading"><h2 id="hoursTitle">Operating Hours</h2>${btn(icon('close'), 'class="up-icon" data-oh-close aria-label="Close Operating Hours"')}</header><div class="up-dialog-body"><div id="hoursTarget"></div><div id="hoursMode"></div><div class="oh-toolbar"><div class="oh-tabs" role="tablist" aria-label="Schedule views">${btn('Weekly schedule', 'role="tab" id="ohWeeklyTab" data-tab="weekly" aria-controls="hoursWorkspace"')}${btn('Special dates', 'role="tab" id="ohDatesTab" data-tab="dates" aria-controls="hoursWorkspace"')}</div><label class="up-field oh-zone">Time zone<div id="hoursZonePicker"></div></label></div><p class="up-error" id="hoursError" role="alert" tabindex="-1" hidden></p><div id="hoursWorkspace" role="tabpanel"></div><details class="oh-effective"><summary>Effective hours</summary><div id="hoursPreview"></div></details><details class="up-history"><summary id="hoursHistoryTitle">Change history</summary><div id="hoursHistory"></div></details></div><footer class="up-dialog-footer"><span id="hoursImpact" class="up-impact"></span><div class="up-actions">${btn('Cancel', 'data-oh-close')}<button type="submit" class="up-primary" id="saveOperatingHours">Save</button></div></footer></form>`;
    document.body.append(dialog);
    dialog.addEventListener('click', click);
    dialog.addEventListener('change', change);
    dialog.addEventListener('pointerdown', pointerDown);
    dialog.addEventListener('pointermove', pointerMove);
    dialog.addEventListener('pointerup', pointerUp);
    dialog.addEventListener('pointercancel', cancelDrag);
    dialog.addEventListener('keydown', event => {
      const tab = event.target.closest('[role=tab]');
      if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); state.tab = event.key === 'Home' ? 'weekly' : event.key === 'End' ? 'dates' : state.tab === 'weekly' ? 'dates' : 'weekly'; renderWorkspace(); dialog.querySelector(`[data-tab="${state.tab}"]`).focus();
      }
    });
    dialog.addEventListener('cancel', () => { destroyCombos(); state = null; });
    $('operatingHoursForm').addEventListener('submit', save);
  }
  function allowedStores() { return data.stores.filter(s => D.scopeStores(data, auth.scope).includes(s.id)); }
  function terminalsFor(storeId) { return data.terminals.filter(t => D.membershipAt(t, state.at)?.storeId === storeId); }
  function merchantOf(store) { return store.lineageKeys.find(key => key.startsWith('merchant:')) || ''; }
  function merchantLabel(key) { return directory.accounts.find(a => a.key === key)?.name || data.stores.find(s => merchantOf(s) === key)?.merchantName || key.replace(/^merchant:/, ''); }
  function targetFor(type, id) {
    const terminal = type === 'terminal' ? data.terminals.find(t => t.sn === S.resolveSn(id)) : null;
    const store = type === 'store' ? data.stores.find(s => s.id === id) : terminal && data.stores.find(s => s.id === D.membershipAt(terminal, state.at)?.storeId);
    if (!store || !allowedStores().some(s => s.id === store.id) || (type === 'terminal' && !terminal)) throw new Error('This operating schedule is not available in your current access scope.');
    const effective = terminal && D.effective(data, terminal, state.at);
    const version = [...store.versions].filter(v => v.from <= state.at).sort((a, b) => b.from - a.from || b.sequence - a.sequence)[0];
    Object.assign(state, { target: { type, id: terminal ? terminal.sn : store.id }, terminal, store, mode: terminal && effective.source !== 'Terminal override' ? 'follow' : 'custom', draft: D.clone(terminal ? effective.schedule : version?.schedule || D.allDay(store.timeZone)), canEdit: terminal ? D.canManageTerminal(data, auth, terminal, state.at) : D.canManageStore(data, auth, store.id), merchant: merchantOf(store), storeFilter: store.id, day: 0, copy: false });
    state.date = D.parts(state.at, current().timeZone).date; state.month = state.date.slice(0, 7); render();
  }
  function renderTarget() {
    if (state.locked) {
      $('hoursTarget').innerHTML = `<div class="oh-context">${icon(state.terminal ? 'point_of_sale' : 'store')}<div><span>${state.terminal ? 'Terminal' : 'Store'}</span><strong>${esc(state.terminal ? (state.terminal.name.includes(state.terminal.sn) ? state.terminal.name : state.terminal.name + ' · ' + state.terminal.sn) : state.store.name)}</strong></div></div>`; return;
    }
    $('hoursTarget').innerHTML = `<div class="oh-target-row"><div class="up-field">Set hours for<div class="oh-segment">${['store', 'terminal'].map(type => btn(type === 'store' ? 'Store' : 'Terminal', `data-dimension="${type}" aria-pressed="${state.target.type === type}"`)).join('')}</div></div><label class="up-field">Merchant<div id="hoursMerchantPicker"></div></label><label class="up-field">Store<div id="hoursStorePicker"></div></label>${state.target.type === 'terminal' ? '<label class="up-field">Terminal<div id="hoursTerminalPicker"></div></label>' : ''}</div>`;
    const stores = allowedStores(), merchants = [...new Set(stores.map(merchantOf))];
    combo('hoursMerchantPicker', merchants.map(key => ({ key, name: merchantLabel(key) })), state.merchant, key => {
      const list = stores.filter(s => merchantOf(s) === key);
      chooseStore(list[0]?.id, state.target.type);
    }, 'Operating hours merchant', merchants.length < 2);
    combo('hoursStorePicker', stores.filter(s => merchantOf(s) === state.merchant).map(s => ({ key: s.id, name: s.name })), state.storeFilter, id => chooseStore(id, state.target.type), 'Operating hours store');
    if (state.target.type === 'terminal') combo('hoursTerminalPicker', terminalsFor(state.storeFilter).map(t => ({ key: t.sn, name: t.name.includes(t.sn) ? t.name : `${t.name} · ${t.sn}` })), state.terminal?.sn || '', sn => targetFor('terminal', sn), 'Operating hours terminal');
  }
  function chooseStore(id, type) {
    if (type === 'store') { targetFor(type, id); return; }
    const terminal = terminalsFor(id)[0];
    if (terminal) { targetFor(type, terminal.sn); return; }
    // Keep the selection usable even for empty stores; never silently select a different dimension.
    const store = data.stores.find(s => s.id === id);
    Object.assign(state, { target: { type: 'terminal', id: '' }, terminal: null, store, merchant: merchantOf(store), storeFilter: id, canEdit: false, mode: 'custom', draft: D.allDay(store.timeZone) });
    render(); showError('No terminals in this store. Choose another store or select the Store dimension.');
  }
  function render() {
    destroyCombos(); renderTarget();
    const terminal = state.terminal, following = state.mode === 'follow';
    $('hoursMode').innerHTML = terminal ? `<div class="oh-inheritance"><div class="oh-segment">${btn('Follow Store', `data-hours-mode="follow" aria-pressed="${following}" ${!state.canEdit ? 'disabled' : ''}`)}${btn('Custom hours', `data-hours-mode="custom" aria-pressed="${!following}" ${!state.canEdit ? 'disabled' : ''}`)}</div><span>${following ? 'Following ' : 'Independent of '}${esc(state.store.name)}</span>${D.canManageStore(data, auth, state.store.id) ? btn('Edit Store hours', 'data-edit-store class="oh-text-button"') : ''}</div>` : '';
    const schedule = current(), zones = [...new Set([schedule.timeZone, 'UTC', ...(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [])])];
    combo('hoursZonePicker', zones.map(key => ({ key, name: key.replace(/_/g, ' ') })), schedule.timeZone, zone => { state.draft.timeZone = zone; refreshVisuals(); }, 'Operating hours time zone', !editable());
    const versions = (terminal || state.store).versions.filter(v => !terminal || allowedStores().some(s => s.id === v.storeId));
    $('hoursHistoryTitle').textContent = `Change history (${versions.length})`;
    $('hoursHistory').innerHTML = `<table class="up-detail-table"><thead><tr><th>Effective from</th><th>Changed by</th><th>Schedule</th><th>Time zone</th></tr></thead><tbody>${[...versions].reverse().map(v => `<tr><td>${esc(new Date(v.from).toLocaleString('en-GB'))}</td><td>${esc(v.actor)}</td><td>${v.mode === 'follow' ? 'Follow Store' : terminal ? 'Terminal override' : 'Store schedule'}</td><td>${esc(v.schedule?.timeZone || 'Store time zone')}</td></tr>`).join('')}</tbody></table>`;
    $('saveOperatingHours').hidden = !state.canEdit;
    const count = data.terminals.filter(t => { const e = D.effective(data, t, state.at); return e?.store.id === state.store.id && e.source !== 'Terminal override'; }).length;
    $('hoursImpact').textContent = !state.canEdit ? 'View only. Editing requires management permission.' : `${!terminal ? `${count} following terminal${count === 1 ? '' : 's'} affected. ` : ''}Applies from Save. Previous hours remain in history.`;
    renderWorkspace();
  }
  function renderWorkspace() {
    dialog.querySelectorAll('[data-tab]').forEach(el => { el.setAttribute('aria-selected', String(el.dataset.tab === state.tab)); el.tabIndex = el.dataset.tab === state.tab ? 0 : -1; });
    $('hoursWorkspace').setAttribute('aria-labelledby', state.tab === 'weekly' ? 'ohWeeklyTab' : 'ohDatesTab');
    $('hoursWorkspace').innerHTML = `<div class="oh-workspace"><div id="hoursCalendar"></div><aside id="hoursDayEditor" class="oh-day-editor"></aside></div>`;
    refreshVisuals(true);
  }
  function refreshVisuals(withPanel = false) {
    if (state.tab === 'weekly') renderWeek(); else renderMonth();
    if (withPanel) renderDayEditor();
    preview();
  }
  function blocks() {
    return current().week.flatMap((p, day) => D.spans(p).flatMap(([start, end], index) => {
      if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
      const label = p.mode === 'all' ? '24 hours' : `${time(start)}–${time(end % 1440)}${end >= 1440 ? ' · next day' : ''}`;
      const pieces = [{ day, start, end: Math.min(end, 1440), origin: day, index, label, all: p.mode === 'all', startEdge: true, endEdge: end <= 1440 }];
      if (end > 1440) pieces.push({ day: (day + 1) % 7, start: 0, end: end - 1440, origin: day, index, label, all: false, startEdge: false, endEdge: true });
      return pieces;
    }));
  }
  function renderWeek() {
    const pieces = blocks();
    $('hoursCalendar').innerHTML = `<div class="oh-week-heading"><span></span>${days.map((day, i) => btn(day.slice(0, 3), `data-weekday="${i}" aria-label="Edit ${day}" aria-pressed="${state.day === i}"`)).join('')}</div><div class="oh-week-grid"><div class="oh-time-axis">${Array.from({ length: 13 }, (_, i) => `<span style="top:${i / 12 * 100}%">${time(i * 120)}</span>`).join('')}</div>${days.map((day, i) => `<div class="oh-day-column ${state.day === i ? 'is-selected' : ''}" data-column="${i}" aria-label="${day} operating periods">${pieces.filter(p => p.day === i).map(p => `<button type="button" class="oh-time-block ${p.all ? 'is-all-day' : ''}" style="top:${p.start / 14.4}%;height:${Math.max(0.8, (p.end - p.start) / 14.4)}%" data-block-day="${p.origin}" data-block-index="${p.index}" data-piece-day="${p.day}" aria-label="${days[p.origin]} ${esc(p.label)}" title="${days[p.origin]} ${esc(p.label)}">${editable() && !p.all && p.startEdge ? '<span class="oh-resize start" data-edge="start"></span>' : ''}<span class="oh-block-label">${esc(p.label)}</span>${editable() && !p.all && p.endEdge ? '<span class="oh-resize end" data-edge="end"></span>' : ''}</button>`).join('')}${!pieces.some(p => p.day === i) ? '<span class="oh-closed">Closed</span>' : ''}</div>`).join('')}</div>`;
  }
  function renderMonth() {
    const first = state.month + '-01', offset = D.weekDay(first), start = D.addDays(first, -offset), schedule = current();
    const monthName = new Date(first + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
    $('hoursCalendar').innerHTML = `<div class="oh-month-heading">${btn(icon('chevron_left'), 'data-month="-1" class="up-icon" aria-label="Previous month"')}<strong>${monthName}</strong>${btn(icon('chevron_right'), 'data-month="1" class="up-icon" aria-label="Next month"')}</div><div class="oh-month-weekdays">${days.map(d => `<span>${d.slice(0, 3)}</span>`).join('')}</div><div class="oh-month-grid">${Array.from({ length: 42 }, (_, i) => {
      const date = D.addDays(start, i), exception = schedule.exceptions.find(x => x.date === date), outside = !date.startsWith(state.month), plan = exception?.plan;
      return btn(`<span>${Number(date.slice(8))}</span>${exception ? `<small>${plan.mode === 'closed' ? 'Closed' : plan.mode === 'all' ? '24 hours' : 'Custom hours'}</small>` : ''}`, `class="oh-date ${outside ? 'outside-month' : ''} ${exception ? 'has-exception' : ''}" data-date="${date}" aria-label="${date}${exception ? ' · ' + (plan.mode === 'closed' ? 'Closed' : 'Special hours') : ''}" aria-pressed="${date === state.date}"`);
    }).join('')}</div>`;
  }
  function selectedPlan() {
    if (state.tab === 'weekly') return current().week[state.day];
    return current().exceptions.find(x => x.date === state.date)?.plan || null;
  }
  function mutablePlan() {
    if (state.tab === 'weekly') return state.draft.week[state.day];
    let exception = state.draft.exceptions.find(x => x.date === state.date);
    if (!exception) { exception = { date: state.date, plan: { mode: 'closed', intervals: [] } }; state.draft.exceptions.push(exception); }
    return exception.plan;
  }
  function renderDayEditor() {
    const plan = selectedPlan(), disabled = !editable(), title = state.tab === 'weekly' ? days[state.day] : state.date;
    $('hoursDayEditor').innerHTML = `<div class="oh-day-title"><h3>${esc(title)}</h3>${disabled ? '<span class="oh-readonly-badge">View only</span>' : ''}</div>${!plan ? '<p class="oh-note">Following weekly schedule</p>' : ''}<div class="oh-plan-modes">${[['all', '24 hours'], ['closed', 'Closed'], ['custom', 'Custom']].map(([mode, label]) => btn(label, `data-plan-mode="${mode}" aria-pressed="${plan?.mode === mode}" ${disabled ? 'disabled' : ''}`)).join('')}</div>${plan?.mode === 'custom' ? `<div class="oh-period-list">${plan.intervals.map((p, index) => `<div class="oh-period"><div class="oh-period-inputs"><label>Start<input type="time" step="60" value="${time(p.start)}" data-period="${index}" data-time="start" aria-label="${title} period ${index + 1} start" ${disabled ? 'disabled' : ''}></label><label>End<input type="time" step="60" value="${time(p.end)}" data-period="${index}" data-time="end" aria-label="${title} period ${index + 1} end" ${disabled ? 'disabled' : ''}></label>${btn(icon('close'), `data-remove-period="${index}" class="up-icon" aria-label="Remove period ${index + 1}" ${disabled ? 'disabled' : ''}`)}</div><span class="oh-next-day" data-next-day="${index}">${p.end < p.start ? 'Ends next day' : ''}</span></div>`).join('')}</div>${btn(icon('add') + 'Add period', `data-add-period class="oh-add-period" ${disabled ? 'disabled' : ''}`)}` : ''}${state.tab === 'weekly' ? `<details class="oh-copy" ${state.copy ? 'open' : ''}><summary>Copy to other days</summary><div class="oh-copy-days">${days.map((d, i) => i === state.day ? '' : `<label><input type="checkbox" value="${i}" name="copyDay" ${disabled ? 'disabled' : ''}>${d}</label>`).join('')}</div>${btn('Replace selected days', `data-copy-days ${disabled ? 'disabled' : ''}`)}</details>` : plan ? btn(icon('delete') + 'Remove special hours', `data-remove-exception class="oh-remove-exception" ${disabled ? 'disabled' : ''}`) : ''}<div class="oh-day-effective"><span>Effective hours</span><div id="hoursSelectedPreview"></div></div>`;
  }
  function effectivePeriods(date) {
    let start = null; const periods = [];
    for (let m = 0; m <= 1440; m++) { const on = m < 1440 && D.operating(current(), date, m); if (on && start === null) start = m; if (!on && start !== null) { periods.push(`${time(start)}–${time(m)}`); start = null; } }
    return periods.length ? periods : ['Closed'];
  }
  function preview() {
    const errors = D.validateSchedule(current()); showError(errors[0] || '');
    dialog.querySelectorAll('[data-time]').forEach(input => input.setAttribute('aria-invalid', String(!!errors.length)));
    if (errors.length) { $('hoursSelectedPreview').textContent = 'Correct the highlighted schedule.'; $('hoursPreview').textContent = ''; return; }
    const today = D.parts(state.at, current().timeZone).date;
    // The weekly editor previews the repeating week, independently of date exceptions.
    const selected = state.tab === 'dates' ? effectivePeriods(state.date) : (() => {
      const parts = blocks().filter(b => b.day === state.day).sort((a, b) => a.start - b.start);
      return parts.length ? parts.map(p => `${time(p.start)}–${time(p.end)}`) : ['Closed'];
    })();
    $('hoursSelectedPreview').innerHTML = selected.map(p => `<strong>${p}</strong>`).join('');
    $('hoursPreview').innerHTML = `<div class="up-preview-grid">${Array.from({ length: 7 }, (_, i) => { const date = D.addDays(today, i); return `<div class="up-preview-day"><b>${date}</b>${effectivePeriods(date).map(p => `<span>${p}</span>`).join('')}</div>`; }).join('')}</div>`;
  }
  function click(event) {
    const button = event.target.closest('button'); if (!button || button.disabled || !state) return;
    if (suppressClick && button.hasAttribute('data-block-day')) { suppressClick = false; return; }
    if (button.hasAttribute('data-oh-close')) { close(); return; }
    if (button.dataset.tab) { state.tab = button.dataset.tab; renderWorkspace(); return; }
    if (button.dataset.dimension) { chooseStore(state.store.id, button.dataset.dimension); return; }
    if (button.hasAttribute('data-edit-store')) { targetFor('store', state.store.id); return; }
    if (button.hasAttribute('data-weekday') || button.hasAttribute('data-block-day')) { state.day = Number(button.dataset.weekday ?? button.dataset.blockDay); state.copy = false; refreshVisuals(true); return; }
    if (button.dataset.date) { state.date = button.dataset.date; state.month = state.date.slice(0, 7); refreshVisuals(true); return; }
    if (button.dataset.month) { const d = new Date(state.month + '-01T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + Number(button.dataset.month)); state.month = d.toISOString().slice(0, 7); renderMonth(); return; }
    if (!state.canEdit) return;
    if (button.dataset.hoursMode) {
      if (state.mode === 'follow' && button.dataset.hoursMode === 'custom') state.draft = D.clone(current());
      state.mode = button.dataset.hoursMode; render(); return;
    }
    if (!editable()) return;
    if (button.dataset.planMode) {
      const p = mutablePlan(); p.mode = button.dataset.planMode;
      if (p.mode === 'custom' && !p.intervals.length) p.intervals = [{ start: 480, end: 1200 }];
    } else if (button.hasAttribute('data-add-period')) {
      const p = mutablePlan(), last = p.intervals.at(-1), start = last?.end > 0 && last.end < 1380 ? last.end : 480;
      p.intervals.push({ start, end: start + 60 });
    } else if (button.hasAttribute('data-remove-period')) {
      const p = mutablePlan(); p.intervals.splice(Number(button.dataset.removePeriod), 1);
    } else if (button.hasAttribute('data-remove-exception')) {
      state.draft.exceptions = state.draft.exceptions.filter(x => x.date !== state.date);
    } else if (button.hasAttribute('data-copy-days')) {
      const targets = [...dialog.querySelectorAll('[name=copyDay]:checked')].map(el => Number(el.value));
      if (!targets.length) { showError('Select the weekdays to replace.', true); return; }
      targets.forEach(day => { state.draft.week[day] = D.clone(state.draft.week[state.day]); }); state.copy = false;
    } else return;
    refreshVisuals(true);
  }
  function change(event) {
    const input = event.target;
    if (!editable() || !input.dataset.time) return;
    const period = mutablePlan().intervals[Number(input.dataset.period)]; period[input.dataset.time] = parseTime(input.value);
    dialog.querySelector(`[data-next-day="${input.dataset.period}"]`).textContent = period.end < period.start ? 'Ends next day' : '';
    refreshVisuals();
  }
  function pointerDown(event) {
    if (!editable() || state.tab !== 'weekly' || event.button !== 0 || drag) return;
    const column = event.target.closest('[data-column]'); if (!column) return;
    const block = event.target.closest('[data-block-day]'), day = Number(column.dataset.column), rect = column.getBoundingClientRect();
    if (block && current().week[Number(block.dataset.blockDay)].mode === 'all') return;
    const minute = Math.max(0, Math.min(1439, (event.clientY - rect.top) / rect.height * 1440));
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, day, minute, rect, moved: false, original: D.clone(state.draft), block: block ? { day: Number(block.dataset.blockDay), index: Number(block.dataset.blockIndex) } : null, edge: event.target.dataset.edge };
    dialog.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (!drag) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
    drag.moved = true; event.preventDefault();
    const columns = [...dialog.querySelectorAll('[data-column]')], first = columns[0].getBoundingClientRect(), width = first.width;
    const day = Math.max(0, Math.min(6, Math.floor((event.clientX - first.left) / width))), minute = Math.max(0, Math.min(1440, Math.round((event.clientY - first.top) / first.height * 1440 / 15) * 15));
    const next = D.clone(drag.original);
    let destination = drag.day, start, end, fullDay = false;
    if (!drag.block) {
      const anchor = Math.round(drag.minute / 15) * 15, a = drag.day * 1440 + anchor, b = day * 1440 + minute;
      const lower = Math.min(a, b), upper = Math.max(a, b);
      if (upper - lower > 1440 || (upper - lower === 1440 && lower % 1440 !== 0)) {
        drag.error = 'Choose a period shorter than 24 hours, or use 24 hours for a full calendar day.'; return;
      }
      fullDay = upper - lower === 1440;
      destination = Math.floor(lower / 1440); start = lower % 1440; end = upper % 1440;
      if (upper - lower < 15) return;
      if (a === b || destination > 6) return;
    } else {
      const source = next.week[drag.block.day], period = source.intervals[drag.block.index];
      const a = drag.block.day * 1440 + period.start, b = drag.block.day * 1440 + (period.end > period.start ? period.end : period.end + 1440);
      const delta = (day - drag.day) * 1440 + Math.round((minute - drag.minute) / 15) * 15;
      let lower = a, upper = b;
      if (drag.edge === 'start') lower = Math.max(b - 1439, Math.min(b - 15, a + delta));
      else if (drag.edge === 'end') upper = Math.max(a + 15, Math.min(a + 1439, b + delta));
      else { lower += delta; upper += delta; }
      const duration = upper - lower;
      lower = ((lower % 10080) + 10080) % 10080;
      destination = Math.floor(lower / 1440); start = lower % 1440; end = (start + duration) % 1440;
      source.intervals.splice(drag.block.index, 1); if (!source.intervals.length) source.mode = 'closed';
    }
    const plan = next.week[destination];
    if (plan.mode === 'all') { drag.error = `${days[destination]} already operates 24 hours. Change its daily plan before adding a period.`; return; }
    if (plan.mode !== 'custom') plan.intervals = [];
    plan.mode = fullDay ? 'all' : 'custom';
    if (fullDay) plan.intervals = []; else plan.intervals.push({ start, end });
    drag.next = next; drag.destination = destination; drag.error = null;
    state.draft = next; renderWeek();
  }
  function pointerUp(event) {
    if (!drag) return;
    const action = drag; drag = null;
    if (dialog.hasPointerCapture(event.pointerId)) dialog.releasePointerCapture(event.pointerId);
    if (!action.moved) { state.day = action.block?.day ?? action.day; refreshVisuals(true); return; }
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    const error = action.error || (action.next && D.validateSchedule(action.next)[0]);
    if (error || !action.next) state.draft = action.original;
    else { state.draft = action.next; state.day = action.destination; }
    refreshVisuals(true); if (error) showError(error, true);
  }
  function cancelDrag() { if (!drag) return; state.draft = drag.original; drag = null; refreshVisuals(true); }
  function close() { destroyCombos(); dialog.close(); state = null; }
  function save(event) {
    event.preventDefault(); if (!state?.canEdit) return;
    try {
      const at = Date.now(), freshAuth = S.viewerAuth(data, localStorage.getItem('paywizard.portalAccessProfile.v1') || 'wizarpos', new URLSearchParams(location.search));
      const next = D.saveSchedule(data, freshAuth, state.target, state.draft, state.mode, at);
      data = S.persist(localStorage, S.refresh(next, at), data.revision);
      const callback = options.onSave; close();
      window.dispatchEvent(new CustomEvent('paywizard:operating-hours-saved', { detail: { data } }));
      callback?.(data);
      let toast = document.getElementById('operatingHoursToast');
      if (!toast) { toast = document.createElement('div'); toast.id = 'operatingHoursToast'; toast.className = 'up-toast'; toast.role = 'status'; document.body.append(toast); }
      toast.textContent = 'Operating Hours saved'; toast.hidden = false; clearTimeout(toast.hideTimer); toast.hideTimer = setTimeout(() => { toast.hidden = true; }, 3500);
    } catch (error) { showError(error.message, true); }
  }
  function open(config = {}) {
    create(); options = config;
    directory = window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
    const at = Date.now(); data = config.data || S.load(localStorage, directory, at);
    auth = S.viewerAuth(data, localStorage.getItem('paywizard.portalAccessProfile.v1') || 'wizarpos', new URLSearchParams(location.search));
    const store = data.stores.find(s => s.id === 's-midtown' && D.scopeStores(data, auth.scope).includes(s.id)) || data.stores.find(s => D.scopeStores(data, auth.scope).includes(s.id));
    if (!store) throw new Error('No operating schedules are available in your current access scope.');
    state = { at, locked: !!config.locked, tab: 'weekly' };
    targetFor(config.target?.type || 'store', config.target?.id || store.id);
    dialog.showModal(); combos.forEach(c => c.close()); $('hoursTitle').tabIndex = -1; $('hoursTitle').focus();
  }
  window.PaywizardOperatingHours = { open };
})();
