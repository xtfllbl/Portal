(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PaywizardUptimeDomain = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const MINUTE = 60000, DAY = 86400000;
  const formatters = new Map(), partsCache = new Map();
  const clone = value => JSON.parse(JSON.stringify(value));
  function validDate(date) { const at = Date.parse(date + 'T00:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === date; }
  function addDays(date, days) { return new Date(Date.parse(date + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10); }
  function monthsAgo(date, months = 3) {
    const d = new Date(date + 'T12:00:00Z'), day = d.getUTCDate();
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - months);
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, end)); return d.toISOString().slice(0, 10);
  }
  function validZone(zone) { try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(0); return !!zone; } catch (_) { return false; } }
  function parts(at, zone) {
    const minute = Math.floor(at / MINUTE), key = zone + ':' + minute;
    if (partsCache.has(key)) return partsCache.get(key);
    if (!formatters.has(zone)) formatters.set(zone, new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }));
    const p = Object.fromEntries(formatters.get(zone).formatToParts(minute * MINUTE).map(item => [item.type, item.value]));
    const value = { date: `${p.year}-${p.month}-${p.day}`, minute: Number(p.hour) * 60 + Number(p.minute) };
    if (partsCache.size > 550000) partsCache.clear();
    partsCache.set(key, value); return value;
  }
  // For fixtures and date controls. Report calculations below use real instants,
  // including both occurrences of repeated local minutes during DST transitions.
  function localEpoch(date, minute, zone) {
    const target = Date.parse(date + 'T00:00:00Z') + minute * MINUTE;
    let at = target;
    for (let i = 0; i < 5; i++) {
      const p = parts(at, zone), actual = Date.parse(p.date + 'T00:00:00Z') + p.minute * MINUTE;
      if (actual === target) return at;
      at += target - actual;
    }
    return at;
  }
  const weekDay = date => (new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7;
  function allDay(zone = 'UTC') { return { timeZone: zone, week: Array.from({ length: 7 }, () => ({ mode: 'all', intervals: [] })), exceptions: [] }; }
  function dayPlan(schedule, date) { return schedule.exceptions.find(x => x.date === date)?.plan || schedule.week[weekDay(date)]; }
  function spans(plan) {
    if (plan.mode === 'all') return [[0, 1440]];
    if (plan.mode === 'closed') return [];
    return plan.intervals.map(x => [x.start, x.end > x.start ? x.end : x.end + 1440]);
  }
  function operating(schedule, date, minute) {
    const today = spans(dayPlan(schedule, date));
    if (today.some(([a, b]) => minute >= a && minute < b)) return true;
    // A date exception replaces every ordinary segment on that civil date,
    // including carry-over from the preceding day's overnight opening.
    if (schedule.exceptions.some(x => x.date === date)) return false;
    return spans(dayPlan(schedule, addDays(date, -1))).some(([a, b]) => b > 1440 && minute + 1440 >= a && minute + 1440 < b);
  }
  function validateSchedule(schedule) {
    const errors = [];
    if (!schedule || !validZone(schedule.timeZone)) return ['Select a valid regional time zone.'];
    if (!Array.isArray(schedule.week) || schedule.week.length !== 7) return ['Set an operating plan for all seven weekdays.'];
    function check(plan, label) {
      if (!plan || !['all', 'closed', 'custom'].includes(plan.mode)) { errors.push(`${label}: select 24 hours, Closed or Custom.`); return; }
      if (plan.mode !== 'custom') return;
      if (!Array.isArray(plan.intervals) || !plan.intervals.length) { errors.push(`${label}: add at least one time period.`); return; }
      for (const { start, end } of plan.intervals) if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > 1439 || end < 0 || end > 1439 || start === end) errors.push(`${label}: enter different start and end times; use 24 hours for a full day.`);
    }
    schedule.week.forEach((p, i) => check(p, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]));
    if (!Array.isArray(schedule.exceptions)) return [...errors, 'Invalid date exceptions.'];
    const dates = new Set();
    for (const x of schedule.exceptions) {
      if (!validDate(x.date)) errors.push('Choose a valid exception date.');
      else if (dates.has(x.date)) errors.push(`${x.date}: only one exception is allowed per date.`);
      dates.add(x.date); check(x.plan, x.date || 'Date exception');
    }
    if (errors.length) return errors;
    const overlap = intervals => intervals.sort((a, b) => a[0] - b[0]).some((x, i, sorted) => i > 0 && x[0] < sorted[i - 1][1]);
    // Check the entire weekly ring, including Sunday -> Monday.
    const weekly = schedule.week.flatMap((plan, i) => spans(plan).map(([a, b]) => [i * 1440 + a, i * 1440 + b, i]));
    const ring = weekly.concat(weekly.map(([a, b, i]) => [a + 10080, b + 10080, i])).sort((a, b) => a[0] - b[0]);
    const collision = ring.findIndex((x, i) => i > 0 && x[0] < ring[i - 1][1]);
    if (collision >= 0) {
      const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const current = ring[collision][2], previous = ring[collision - 1][2];
      errors.push(`${labels[previous]}${current === previous ? '' : ' / ' + labels[current]}: operating periods overlap${current === previous ? '.' : ' across midnight.'}`);
    }
    for (const x of schedule.exceptions) {
      if (overlap(spans(x.plan))) errors.push(`${x.date}: exception periods overlap.`);
      const next = addDays(x.date, 1);
      if (!dates.has(next)) {
        const carry = spans(x.plan).filter(([, b]) => b > 1440).map(([a, b]) => [Math.max(0, a - 1440), b - 1440]);
        if (overlap(carry.concat(spans(dayPlan(schedule, next))))) errors.push(`${x.date}: overnight exception overlaps the next day's opening.`);
      }
    }
    return [...new Set(errors)];
  }
  const active = (versions, at) => (versions || []).filter(x => x.from <= at).sort((a, b) => b.from - a.from || (b.sequence || 0) - (a.sequence || 0))[0];
  const membershipAt = (terminal, at) => terminal.memberships.find(x => at >= x.from && at < (x.to ?? Infinity));
  function effective(data, terminal, at) {
    const membership = membershipAt(terminal, at);
    if (!membership) return null;
    const store = data.stores.find(x => x.id === membership.storeId);
    if (!store) return null;
    const override = active(terminal.versions, at);
    if (override?.mode === 'custom' && override.storeId === membership.storeId && override.from >= membership.from) return { schedule: override.schedule, version: override, membership, store, source: 'Terminal override' };
    const version = active(store.versions, at);
    return { schedule: version?.schedule || allDay(store.timeZone), version, membership, store, source: version ? 'Store schedule' : 'Default · 24 hours' };
  }
  function scopeStores(data, scope) {
    return data.stores.filter(s => !scope || scope === 'all' || s.lineageKeys.includes(scope)).map(s => s.id);
  }
  function canManageStore(data, auth, storeId) { return auth.manage !== false && scopeStores(data, auth.scope).includes(storeId); }
  function canManageTerminal(data, auth, terminal, at) {
    const m = membershipAt(terminal, at); return !!m && canManageStore(data, auth, m.storeId);
  }
  function rawObservation(terminal, at) {
    // Observations are bounded authoritative intervals. No carrying the last
    // known Online state indefinitely; overlapping/conflicting data is unknown.
    const matches = terminal.observations.filter(x => at >= x.from && at < x.to);
    if (matches.length > 1) return { state: 'unknown', cause: 'conflicting_observations' };
    if (matches.length !== 1 || !['online', 'offline', 'unknown'].includes(matches[0].state)) return { state: 'unknown', cause: 'unreported' };
    return { state: matches[0].state, cause: matches[0].state === 'unknown' ? matches[0].cause || 'unreported' : null };
  }
  const rawState = (terminal, at) => rawObservation(terminal, at).state;
  const health = rate => rate >= 95 ? 'online' : rate >= 90 ? 'warning' : 'offline';
  function reportDay(data, terminal, date, allowedStores, asOf) {
    if (!validDate(date)) return null;
    const utc = Date.parse(date + 'T00:00:00Z'), start = utc - 15 * 3600000, end = utc + 39 * 3600000;
    if (terminal.enrolledAt >= end || !terminal.memberships.some(m => allowedStores.includes(m.storeId) && m.from < end && (m.to ?? Infinity) > start)) return null;
    const boundaries = new Set([start, end, asOf, terminal.enrolledAt]);
    for (let at = start; at <= end; at += MINUTE) boundaries.add(at);
    const observations = terminal.observations.filter(x => x.from < end && x.to > start);
    observations.forEach(x => { boundaries.add(x.from); boundaries.add(x.to); });
    terminal.memberships.forEach(x => { boundaries.add(x.from); if (x.to) boundaries.add(x.to); });
    terminal.versions.forEach(x => boundaries.add(x.from));
    data.stores.forEach(s => s.versions.forEach(x => boundaries.add(x.from)));
    const times = [...boundaries].filter(x => Number.isFinite(x) && x >= start && x <= end).sort((a, b) => a - b);
    const segments = [], totals = { online: 0, offline: 0, unknown: 0, unreported: 0, collectionUnavailable: 0, operating: 0, futureOperating: 0 };
    let isToday = false;
    for (let i = 0; i < times.length - 1; i++) {
      const from = times[i], to = times[i + 1], at = (from + to) / 2;
      if (from < terminal.enrolledAt) continue;
      const e = effective(data, terminal, at);
      if (!e || !allowedStores.includes(e.store.id)) continue;
      const p = parts(at, e.schedule.timeZone), today = parts(asOf, e.schedule.timeZone).date;
      if (p.date !== date || date < monthsAgo(today) || date > today) continue;
      if (date === today) isToday = true;
      const isOperating = operating(e.schedule, p.date, p.minute);
      const observation = from >= asOf ? { state: 'future', cause: null } : rawObservation({ observations }, at);
      const { state, cause } = observation;
      if (isOperating && state === 'future') totals.futureOperating += to - from;
      else if (isOperating) {
        totals[state] += to - from; totals.operating += to - from;
        if (state === 'unknown') totals[['collection_failure', 'conflicting_observations'].includes(cause) ? 'collectionUnavailable' : 'unreported'] += to - from;
      }
      const segment = { from, to, state, cause, operating: isOperating, timeZone: e.schedule.timeZone, storeId: e.store.id, source: e.source, versionFrom: e.version?.from || e.membership.from };
      const prev = segments[segments.length - 1];
      if (prev && prev.to === from && ['state', 'cause', 'operating', 'timeZone', 'storeId', 'source', 'versionFrom'].every(k => prev[k] === segment[k])) prev.to = to;
      else segments.push(segment);
    }
    if (!segments.length) return null;
    const confirmedOffline = totals.offline;
    totals.offline += totals.unreported;
    const hasGap = totals.unknown > 0, hasOffline = totals.offline > 0;
    const rate = totals.operating && !totals.collectionUnavailable ? totals.online / totals.operating * 100 : null;
    const state = totals.collectionUnavailable ? 'unavailable' : rate !== null ? health(rate) : totals.futureOperating ? 'pending' : 'closed';
    const inProgress = isToday && totals.operating > 0;
    return { date, segments, ...totals, confirmedOffline, hasGap, hasOffline, state, rate, isToday, inProgress, timeZones: [...new Set(segments.map(x => x.timeZone))], storeIds: [...new Set(segments.map(x => x.storeId))] };
  }
  function rateText(value) {
    if (value.rate === null) return value.state === 'unavailable' ? 'Data unavailable' : value.state === 'pending' ? 'Not open yet' : 'Closed';
    if (value.rate === 100) return '100%';
    if (value.rate > 99.95) return '<100%';
    // Round down to the displayed precision so 94.999% cannot appear as 95%.
    return `${Number((Math.floor(value.rate * 10 + 1e-9) / 10).toFixed(1))}%`;
  }
  function duration(ms) {
    const seconds = Math.round(ms / 1000), h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    return [h ? `${h}h` : '', m ? `${m}m` : '', s ? `${s}s` : ''].filter(Boolean).join(' ') || '0m';
  }
  function saveSchedule(data, auth, target, schedule, mode, at, actor = 'Portal manager') {
    if (!['custom', 'follow'].includes(mode) || !Number.isFinite(at)) throw new Error('Invalid operating schedule update.');
    const next = clone(data), terminal = target.type === 'terminal' ? next.terminals.find(x => x.sn === target.id) : null;
    const store = target.type === 'store' ? next.stores.find(x => x.id === target.id) : null;
    if ((!terminal && !store) || (terminal ? !canManageTerminal(next, auth, terminal, at) : !canManageStore(next, auth, store.id))) throw new Error('You do not have permission to manage this operating schedule.');
    if (mode !== 'follow') { const errors = validateSchedule(schedule); if (errors.length) throw new Error(errors[0]); }
    if (store && mode === 'follow') throw new Error('A Store must have its own operating schedule.');
    const versions = (terminal || store).versions;
    if (versions.some(x => x.from > at)) throw new Error('This schedule has a newer version. Refresh and try again.');
    const version = { from: at, sequence: versions.length, mode: terminal ? mode : 'custom', schedule: mode === 'follow' ? null : clone(schedule), actor, storeId: terminal ? membershipAt(terminal, at).storeId : store.id };
    versions.push(version);
    next.audit.push({ at, actor, target: clone(target), action: mode === 'follow' ? 'Resume Store schedule' : 'Save Operating Hours', version: clone(version) });
    next.revision = (next.revision || 0) + 1;
    return next;
  }
  return { MINUTE, DAY, clone, validDate, addDays, monthsAgo, validZone, parts, localEpoch, weekDay, allDay, dayPlan, spans, operating, validateSchedule, membershipAt, effective, scopeStores, canManageStore, canManageTerminal, rawState, reportDay, rateText, duration, saveSchedule };
});
