const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../../scripts/terminal-uptime-domain.js');
const S = require('../../scripts/terminal-uptime-store.js');
const H = 3600000, at = value => Date.parse(value + 'Z');
const day = '2026-09-10', now = at('2026-09-11T18:00:00');
function fixture(schedule = D.allDay('UTC')) {
  const from = at('2026-05-01T00:00:00');
  return { schema: 1, revision: 0, observedAt: now, audit: [], stores: [
    { id: 'a', name: 'Store A', lineageKeys: ['provider:p', 'merchant:ma', 'store:a'], timeZone: 'UTC', versions: [{ from, sequence: 0, mode: 'custom', schedule }] },
    { id: 'b', name: 'Store B', lineageKeys: ['provider:p', 'merchant:mb', 'store:b'], timeZone: 'UTC', versions: [{ from, sequence: 0, mode: 'custom', schedule: D.allDay('UTC') }] }
  ], terminals: [{ sn: 'SN-1', name: 'Terminal 1', enrolledAt: from, memberships: [{ storeId: 'a', from, to: null }], versions: [], observations: [{ from, to: now, state: 'online' }] }] };
}
function custom(start = 480, end = 1200, zone = 'UTC') { const s = D.allDay(zone); s.week = Array.from({ length: 7 }, () => ({ mode: 'custom', intervals: [{ start, end }] })); return s; }
function report(data, date = day, allowed = ['a', 'b'], asOf = now) { return D.reportDay(data, data.terminals[0], date, allowed, asOf); }
function closed(zone = 'UTC') { const s = D.allDay(zone); s.week.forEach(p => { p.mode = 'closed'; }); return s; }

test('only elapsed operating hours determine uptime; planned nightly shutdown does not reduce it', () => {
  const d = fixture(custom()), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [{ from: begin, to: begin + 8 * H, state: 'offline' }, { from: begin + 8 * H, to: begin + 20 * H, state: 'online' }, { from: begin + 20 * H, to: begin + 24 * H, state: 'offline' }];
  const r = report(d); assert.equal(r.operating, 12 * H); assert.equal(r.rate, 100); assert.equal(r.offline, 0); assert.equal(r.segments.filter(s => !s.operating && s.state === 'offline').length, 2);
});
test('unreported time counts as offline once while preserving a 30-second confirmed outage', () => {
  const d = fixture(), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [{ from: begin, to: begin + H, state: 'online' }, { from: begin + H, to: begin + H + 30000, state: 'offline' }, { from: begin + H + 30000, to: begin + 23 * H, state: 'online' }];
  const r = report(d); assert.equal(r.offline, H + 30000); assert.equal(r.confirmedOffline, 30000); assert.equal(r.unreported, H); assert.equal(r.unknown, H);
  assert.equal(r.online + r.offline, r.operating); assert.equal(r.hasOffline, true); assert.equal(r.hasGap, true); assert.equal(r.state, 'online');
  assert.equal(r.rate, (23 * H - 30000) / (24 * H) * 100); assert.equal(r.inProgress, false); assert.doesNotMatch(D.rateText(r), /Incomplete/);
});
test('a short outage never rounds into a healthy 100% label', () => {
  const d = fixture(), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [{ from: begin, to: begin + 24 * H - 1000, state: 'online' }, { from: begin + 24 * H - 1000, to: begin + 24 * H, state: 'offline' }];
  assert.equal(D.rateText(report(d)), '<100%'); assert.equal(report(d).offline, 1000);
});
test('future operating hours do not lower today\'s uptime or become Unknown', () => {
  const d = fixture(custom()), asOf = at(day + 'T10:00:00');
  d.terminals[0].observations[0].to = asOf;
  const r = report(d, day, ['a'], asOf); assert.equal(r.operating, 2 * H); assert.equal(r.futureOperating, 10 * H); assert.equal(r.rate, 100); assert.equal(r.unknown, 0);
  assert.equal(report(d, day, ['a'], at(day + 'T07:00:00')).state, 'pending');
});
test('no day exists before enrollment; enrollment day starts at the actual join instant', () => {
  const d = fixture(); d.terminals[0].enrolledAt = at('2026-09-10T12:00:00'); d.terminals[0].memberships[0].from = d.terminals[0].enrolledAt;
  assert.equal(report(d, '2026-09-09'), null); assert.equal(report(d).operating, 12 * H); assert.equal(report(d).segments[0].from, d.terminals[0].enrolledAt);
});
test('closed days have neither an uptime rate nor a missing-data alarm', () => {
  const d = fixture(closed()); d.terminals[0].observations = [];
  const r = report(d); assert.equal(r.state, 'closed'); assert.equal(r.rate, null); assert.equal(r.hasGap, false); assert.equal(r.segments[0].state, 'unknown');
});
test('overnight opening splits at midnight and a date closure overrides carry-over', () => {
  const s = closed(); s.week[4] = { mode: 'custom', intervals: [{ start: 1320, end: 120 }] };
  const d = fixture(s), asOf = at('2026-09-14T12:00:00'); d.terminals[0].observations[0].to = asOf;
  assert.equal(report(d, '2026-09-11', ['a'], asOf).operating, 2 * H);
  assert.equal(report(d, '2026-09-12', ['a'], asOf).operating, 2 * H);
  s.exceptions.push({ date: '2026-09-12', plan: { mode: 'closed', intervals: [] } });
  assert.equal(report(d, '2026-09-12', ['a'], asOf).operating, 0);
});
test('multiple operating periods exclude a midday outage', () => {
  const s = custom(); s.week.forEach(p => { p.intervals = [{ start: 480, end: 720 }, { start: 840, end: 1080 }]; });
  const d = fixture(s), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [{ from: begin, to: begin + 12 * H, state: 'online' }, { from: begin + 12 * H, to: begin + 14 * H, state: 'offline' }, { from: begin + 14 * H, to: begin + 24 * H, state: 'online' }];
  assert.equal(report(d).operating, 8 * H); assert.equal(report(d).rate, 100);
});
test('schedule edits preserve prior days and split the effective day at the save instant', () => {
  const d = fixture(), before = report(d), saved = D.saveSchedule(d, { scope: 'store:a', manage: true }, { type: 'store', id: 'a' }, closed(), 'custom', at('2026-09-11T12:00:00'));
  assert.deepEqual(report(saved), before); assert.equal(report(saved, '2026-09-11').operating, 12 * H); assert.equal(d.stores[0].versions.length, 1); assert.equal(saved.audit.length, 1);
});
test('terminal override is complete and unaffected by Store changes; follow creates a new version', () => {
  let d = fixture();
  d = D.saveSchedule(d, { scope: 'store:a' }, { type: 'terminal', id: 'SN-1' }, custom(), 'custom', at('2026-09-09T00:00:00'));
  d = D.saveSchedule(d, { scope: 'store:a' }, { type: 'store', id: 'a' }, closed(), 'custom', at('2026-09-10T00:00:00'));
  assert.equal(report(d).operating, 12 * H);
  d = D.saveSchedule(d, { scope: 'store:a' }, { type: 'terminal', id: 'SN-1' }, null, 'follow', at('2026-09-11T00:00:00'));
  assert.equal(report(d, '2026-09-11').state, 'closed'); assert.equal(report(d).operating, 12 * H);
});
test('Store transfer separates historic access and drops the previous Store\'s override', () => {
  let d = fixture(); d = D.saveSchedule(d, { scope: 'store:a' }, { type: 'terminal', id: 'SN-1' }, closed(), 'custom', at('2026-09-08T00:00:00'));
  const split = at('2026-09-10T12:00:00'); d.terminals[0].memberships[0].to = split; d.terminals[0].memberships.push({ storeId: 'b', from: split, to: null });
  assert.equal(report(d, '2026-09-09', ['b']), null); assert.equal(report(d, day, ['a']).operating, 0); assert.equal(report(d, day, ['b']).operating, 12 * H);
  assert.equal(D.effective(d, d.terminals[0], split).source, 'Store schedule'); assert.equal(D.canManageTerminal(d, { scope: 'store:a' }, d.terminals[0], now), false);
});
test('unassigned terminals retain permitted earlier history without granting current management', () => {
  const d = fixture(); d.terminals[0].memberships[0].to = at('2026-09-10T00:00:00');
  assert.equal(report(d), null); assert.equal(report(d, '2026-09-09', ['a']).rate, 100); assert.equal(D.canManageTerminal(d, { scope: 'store:a' }, d.terminals[0], now), false);
});
test('read-only and out-of-scope users cannot save schedules', () => {
  const d = fixture();
  assert.throws(() => D.saveSchedule(d, { scope: 'store:a', manage: false }, { type: 'store', id: 'a' }, custom(), 'custom', now), /permission/);
  assert.throws(() => D.saveSchedule(d, { scope: 'store:b', manage: true }, { type: 'terminal', id: 'SN-1' }, custom(), 'custom', now), /permission/);
  assert.equal(d.revision, 0); assert.equal(d.audit.length, 0);
});
test('source observation correction can fill a gap without applying a new schedule retroactively', () => {
  const d = fixture(); d.terminals[0].observations = []; assert.equal(report(d).rate, 0);
  const updated = D.saveSchedule(d, { scope: 'store:a' }, { type: 'store', id: 'a' }, closed(), 'custom', now);
  updated.terminals[0].observations = [{ from: at('2026-09-10T00:00:00'), to: at('2026-09-11T00:00:00'), state: 'online' }];
  assert.equal(report(updated).rate, 100); assert.equal(report(updated).operating, 24 * H);
});
test('conflicting source observations become Unknown instead of silently choosing Online', () => {
  const d = fixture(); d.terminals[0].observations.push({ from: at(day + 'T10:00:00'), to: at(day + 'T11:00:00'), state: 'offline' });
  assert.equal(report(d).unknown, H); assert.equal(report(d).rate, null);
});
test('three-calendar-month retention clamps month ends and hides expired dates', () => {
  assert.equal(D.monthsAgo('2026-05-31'), '2026-02-28'); assert.equal(D.monthsAgo('2024-05-31'), '2024-02-29');
  const d = fixture(); assert.equal(report(d, '2026-06-10'), null); assert.equal(report(d, '2026-06-11').rate, 100);
});
test('invalid calendar dates return a validation error instead of throwing', () => {
  for (const date of ['', '2026-13-01', '2026-02-31', 'not a date']) assert.equal(D.validDate(date), false);
  const s = D.allDay(); s.exceptions = [{ date: '2026-13-01', plan: { mode: 'closed', intervals: [] } }]; assert.match(D.validateSchedule(s)[0], /valid exception date/);
});
test('overlaps, equal endpoints and duplicate exception dates block saving', () => {
  const s = custom(); s.week[0].intervals.push({ start: 1000, end: 1250 }); assert.match(D.validateSchedule(s).join(' '), /overlap/);
  s.week[0].intervals = [{ start: 480, end: 480 }]; assert.match(D.validateSchedule(s).join(' '), /different/);
  s.week[0].intervals = [{ start: 480, end: 1200 }]; s.exceptions = Array.from({ length: 2 }, () => ({ date: day, plan: { mode: 'closed', intervals: [] } })); assert.match(D.validateSchedule(s).join(' '), /only one exception/);
});
test('overnight overlap is detected across the weekly Sunday/Monday boundary', () => {
  const s = closed(); s.week[6] = { mode: 'custom', intervals: [{ start: 1320, end: 120 }] }; s.week[0] = { mode: 'custom', intervals: [{ start: 60, end: 180 }] };
  assert.match(D.validateSchedule(s).join(' '), /overlap/);
});
test('spring-forward and fall-back days use actual elapsed time, not a fixed 24-hour denominator', () => {
  for (const [date, hours, later] of [['2026-03-08', 23, '2026-03-09T12:00:00'], ['2026-11-01', 25, '2026-11-02T12:00:00']]) {
    const d = fixture(D.allDay('America/New_York')), until = at(later), began = at('2026-01-01T00:00:00');
    d.terminals[0].enrolledAt = began; d.terminals[0].memberships[0].from = began; d.stores[0].versions[0].from = began; d.terminals[0].observations = [{ from: began, to: until, state: 'online' }];
    assert.equal(report(d, date, ['a'], until).operating, hours * H);
  }
});
test('saving a new time zone does not regroup completed historic dates', () => {
  const d = fixture(), before = report(d);
  const changed = D.saveSchedule(d, { scope: 'store:a' }, { type: 'store', id: 'a' }, D.allDay('Asia/Shanghai'), 'custom', now);
  assert.deepEqual(report(changed), before);
});
test('local saves detect cross-tab revisions and preserve the stored value on quota failure', () => {
  const d = fixture(); let raw = JSON.stringify(d); const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const next = D.saveSchedule(d, { scope: 'store:a' }, { type: 'store', id: 'a' }, custom(), 'custom', now);
  S.persist(storage, next, 0); assert.equal(JSON.parse(raw).revision, 1);
  assert.throws(() => S.persist(storage, next, 0), /another tab/);
  storage.setItem = () => { throw new Error('QuotaExceededError'); }; const before = raw;
  assert.throws(() => S.persist(storage, next, 1), /Could not save/); assert.equal(raw, before);
});
test('refresh of simulated observations is deterministic for completed days and preserves saved versions', () => {
  const directory = require('../../scripts/customer-account-directory.js').create(require('../../scripts/customer-account-data.js').createHierarchy());
  const d = S.seed(directory, now), t = d.terminals.find(t => t.sn === 'WP6267UQ36002376'), allowed = d.stores.map(s => s.id);
  const before = D.reportDay(d, t, day, allowed, now), refreshed = S.refresh(d, now + H);
  assert.deepEqual(D.reportDay(refreshed, refreshed.terminals.find(x => x.sn === t.sn), day, allowed, now + H), before);
  assert.deepEqual(refreshed.stores, d.stores);
});

test('95% is green, 90% is yellow, and values below each boundary do not round up across it', () => {
  for (const [minutes, seconds, state, label] of [[24, 0, 'online', '95%'], [24, 1, 'warning', '94.9%'], [48, 0, 'warning', '90%'], [48, 1, 'offline', '89.9%']]) {
    const d = fixture(custom(480, 960)), begin = at(day + 'T08:00:00'), split = begin + minutes * D.MINUTE + seconds * 1000;
    d.terminals[0].observations = [{ from: begin, to: split, state: 'offline' }, { from: split, to: begin + 8 * H, state: 'online' }];
    const r = report(d); assert.equal(r.state, state); assert.equal(D.rateText(r), label); assert.equal(r.confirmedOffline, minutes * D.MINUTE + seconds * 1000);
  }
});
test('today keeps a provisional percentage and progress is removed at terminal local midnight', () => {
  const d = fixture(D.allDay('America/New_York')), before = at('2026-09-11T03:59:00'), midnight = at('2026-09-11T04:00:00');
  d.terminals[0].observations[0].to = midnight;
  const today = report(d, day, ['a'], before); assert.equal(today.inProgress, true); assert.equal(today.isToday, true); assert.equal(today.rate, 100);
  const ended = report(d, day, ['a'], midnight); assert.equal(ended.inProgress, false); assert.equal(ended.rate, 100);
});
test('today no-report gaps count only elapsed operating time, never future time', () => {
  const d = fixture(custom()), begin = at(day + 'T08:00:00'), cutoff = begin + 2 * H;
  d.terminals[0].observations = [{ from: begin, to: begin + H, state: 'online' }];
  const r = report(d, day, ['a'], cutoff); assert.equal(r.rate, 50); assert.equal(r.offline, H); assert.equal(r.unreported, H); assert.equal(r.futureOperating, 10 * H); assert.equal(r.inProgress, true);
});
test('known collection failures prevent a daily score without blaming the terminal for the gap', () => {
  const d = fixture(), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [{ from: begin, to: begin + H, state: 'unknown', cause: 'collection_failure' }, { from: begin + H, to: begin + 24 * H, state: 'online' }];
  const r = report(d); assert.equal(r.collectionUnavailable, H); assert.equal(r.unreported, 0); assert.equal(r.offline, 0); assert.equal(r.rate, null); assert.equal(r.state, 'unavailable'); assert.equal(D.rateText(r), '—');
  d.stores[0].versions[0].schedule = custom(); assert.equal(report(d).rate, 100);
});
test('ordinary fully unreported historical days are 0% while closed days remain Closed', () => {
  const d = fixture(); d.terminals[0].observations = [];
  const r = report(d); assert.equal(r.rate, 0); assert.equal(r.offline, 24 * H); assert.equal(r.unreported, 24 * H); assert.equal(r.confirmedOffline, 0); assert.equal(r.inProgress, false);
  d.stores[0].versions[0].schedule = closed(); assert.equal(D.rateText(report(d)), 'Closed');
});
test('opening a saved demo on another day advances observations once and preserves edited schedules', () => {
  const directory = require('../../scripts/customer-account-directory.js').create(require('../../scripts/customer-account-data.js').createHierarchy());
  let value; const storage = { getItem: () => value || null, setItem: (_, next) => { value = next; } };
  const original = S.load(storage, directory, now);
  const edited = D.saveSchedule(original, { scope: 'all' }, { type: 'store', id: 's-midtown' }, custom(480, 1200, 'America/New_York'), 'custom', now);
  S.persist(storage, edited, original.revision);
  const loaded = S.load(storage, directory, now + 3 * D.DAY), t = loaded.terminals.find(t => t.sn === 'WP6267UQ36002376');
  assert.equal(loaded.observedAt, now + 3 * D.DAY); assert.deepEqual(loaded.stores, edited.stores); assert.deepEqual(loaded.audit, edited.audit);
  const r = D.reportDay(loaded, t, '2026-09-12', loaded.stores.map(s => s.id), now + 3 * D.DAY);
  assert.equal(r.unreported, 0); assert.notEqual(r.rate, null); assert.equal(r.inProgress, false);
});
test('summary and matrix demo authorization cannot expand the profile scope', () => {
  const d = fixture();
  assert.deepEqual(S.viewerAuth(d, 'wizarpos', new URLSearchParams('scope=store:a&access=view')), { scope: 'store:a', manage: false });
  const foreign = S.viewerAuth(d, 'unattended-store', new URLSearchParams('scope=all'));
  assert.equal(foreign.scope, 'store:s-midtown'); assert.deepEqual(D.scopeStores(d, foreign.scope), []);
});

test('one Offline duration and timeline combine adjacent legacy offline and missing reports without changing uptime', () => {
  const d = fixture(), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [
    { from: begin, to: begin + H, state: 'online' },
    { from: begin + H, to: begin + 1.25 * H, state: 'offline' },
    { from: begin + 1.25 * H, to: begin + 2 * H, state: 'unknown' },
    { from: begin + 2 * H, to: begin + 24 * H, state: 'online' }
  ];
  const r = report(d), before = JSON.stringify(r);
  const context = { window: { PaywizardUptimeDomain: D } };
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../../scripts/terminal-uptime-view.js'), 'utf8'), context);
  const V = context.window.PaywizardUptimeView, details = V.dayContent(d, d.terminals[0], r), cell = V.cell(r, 'SN-1');
  assert.equal(r.rate, 23 / 24 * 100);
  assert.match(details, /Offline<\/span><strong class="red">1h<\/strong>/);
  assert.match(details, /01:00:00–02:00:00<\/td><td><i class="up-dot unreachable"><\/i>Offline/);
  assert.equal((details.match(/<article>/g) || []).length, 2);
  assert.doesNotMatch(details + cell, /Confirmed offline|No report|no report|Unreachable/);
  assert.match(cell, /Offline 1h/);
  assert.equal(JSON.stringify(r), before, 'rendering must preserve original observation evidence');
});

test('no-score days stay distinguishable and never discard partially known durations', () => {
  const context = { window: { PaywizardUptimeDomain: D } };
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../../scripts/terminal-uptime-view.js'), 'utf8'), context);
  const V = context.window.PaywizardUptimeView, d = fixture(custom()), begin = at(day + 'T00:00:00');
  const pending = report(d, day, ['a'], begin + 7 * H);
  assert.equal(D.rateText(pending), '—');
  assert.match(V.cell(pending, 'SN-1'), /Starts at 08:00/);
  assert.doesNotMatch(V.dayContent(d, d.terminals[0], pending), /up-day-stats|Not open yet/);
  d.terminals[0].observations = [{ from: begin, to: begin + 24 * H, state: 'unknown', cause: 'collection_failure' }];
  const unavailable = report(d);
  assert.equal(D.rateText(unavailable), '—');
  assert.match(V.cell(unavailable, 'SN-1'), /No data/);
  assert.doesNotMatch(V.dayContent(d, d.terminals[0], unavailable), /up-day-stats|Data unavailable/);
  d.terminals[0].observations = [
    { from: begin, to: begin + 9 * H, state: 'unknown', cause: 'collection_failure' },
    { from: begin + 9 * H, to: begin + 24 * H, state: 'online' }
  ];
  const partial = report(d), before = JSON.stringify(partial);
  const detail = V.dayContent(d, d.terminals[0], partial);
  assert.equal(D.rateText(partial), '—');
  assert.match(detail, /Online<\/span><strong class="green">11h<\/strong>/);
  assert.match(detail, /1h of operating hours without data/);
  assert.equal(JSON.stringify(partial), before);
});
