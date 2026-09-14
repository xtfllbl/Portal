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
test('Unknown and a 30-second confirmed outage are both retained; incomplete days have no rate', () => {
  const d = fixture(), begin = at(day + 'T00:00:00');
  d.terminals[0].observations = [{ from: begin, to: begin + H, state: 'online' }, { from: begin + H, to: begin + H + 30000, state: 'offline' }, { from: begin + H + 30000, to: begin + 23 * H, state: 'online' }];
  const r = report(d); assert.equal(r.offline, 30000); assert.equal(r.unknown, H); assert.equal(r.hasOffline, true); assert.equal(r.hasGap, true); assert.equal(r.state, 'offline'); assert.equal(r.rate, null);
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
  const d = fixture(); d.terminals[0].observations = []; assert.equal(report(d).rate, null);
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
