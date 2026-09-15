(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./terminal-uptime-domain.js'));
  else root.PaywizardUptimeStore = factory(root.PaywizardUptimeDomain);
})(typeof window !== 'undefined' ? window : this, function (D) {
  'use strict';
  const KEY = 'paywizard.terminal-uptime.demo.v1';
  // Stable demo hardware serials; legacy identifiers remain aliases for links
  // and other prototype modules whose persisted records use those identifiers.
  const SERIALS = Object.freeze({
    'NYC-Q3-0042': 'WP2013Q326000042',
    'NYC-Q3-0043': 'WP2013Q326000043',
    'BOS-Q3-0018': 'WP2013Q326000018',
    'DEMO-AGT1-001': 'WP2013Q326001001',
    'DEMO-AGT2-001': 'WP2013Q326002001',
    'DEMO-AGT3-001': 'WP2013Q326003001'
  });
  const resolveSn = sn => SERIALS[sn] || sn;
  function migrateSerials(data, now) {
    for (const terminal of data.terminals) {
      const serial = resolveSn(terminal.sn);
      if (serial !== terminal.sn) { terminal.legacySn = terminal.sn; terminal.sn = serial; }
      // Keep a persistent zero-heartbeat scenario, so reopening tomorrow never
      // rewrites today's missing-heartbeat history into an Online day.
      if (terminal.pattern === 8 && terminal.noHeartbeatSince == null) terminal.noHeartbeatSince = D.localEpoch(D.parts(now, terminal.telemetryZone).date, 0, terminal.telemetryZone);
    }
    for (const entry of data.audit) {
      if (entry.target?.type === 'terminal') entry.target.id = resolveSn(entry.target.id);
    }
    return data;
  }
  function retireSpecialDates(input, now) {
    if (input.weeklyOnlySince != null) return input;
    const data = D.clone(input), actor = 'Weekly schedule migration';
    const latest = versions => [...versions].filter(v => v.from <= now).sort((a, b) => b.from - a.from || (b.sequence || 0) - (a.sequence || 0))[0];
    function retire(entity, type, currentVersion) {
      if (!currentVersion?.schedule?.exceptions?.length) return;
      const version = { ...D.clone(currentVersion), from: now, sequence: Math.max(0, ...entity.versions.map(v => v.sequence || 0)) + 1, actor,
        schedule: { ...D.clone(currentVersion.schedule), exceptions: [] } };
      entity.versions.push(version);
      data.audit.push({ at: now, actor, target: { type, id: type === 'store' ? entity.id : entity.sn }, action: 'Retire special dates', version: D.clone(version) });
    }
    for (const store of data.stores) retire(store, 'store', latest(store.versions));
    for (const terminal of data.terminals) {
      const effective = D.effective(data, terminal, now);
      // Do not revive an override invalidated by a Store transfer or a Follow Store version.
      if (effective?.source === 'Terminal override') retire(terminal, 'terminal', effective.version);
    }
    data.weeklyOnlySince = now;
    data.revision = (input.revision || 0) + 1;
    return data;
  }
  const custom = (start, end) => ({ mode: 'custom', intervals: [{ start, end }] });
  function zoneFor(store) {
    if (/berlin|warsaw/i.test(store.name)) return /warsaw/i.test(store.name) ? 'Europe/Warsaw' : 'Europe/Berlin';
    if (/waou|charger/i.test(store.name)) return 'America/Los_Angeles';
    return 'America/New_York';
  }
  function seed(directory, now = Date.now()) {
    const old = now - 110 * D.DAY;
    const stores = directory.accounts.filter(x => x.type === 'store' && directory.terminals.some(t => t.storeId === x.id)).map((s, i) => {
      const schedule = D.allDay(zoneFor(s));
      if (i % 3 !== 0) schedule.week = Array.from({ length: 7 }, (_, n) => n === 6 ? { mode: 'closed', intervals: [] } : custom(480, n === 5 ? 1020 : 1200));
      return { id: s.id, name: s.name, lineageKeys: s.lineageKeys, timeZone: schedule.timeZone, versions: [{ from: old, sequence: 0, schedule, mode: 'custom', actor: 'Demo setup' }] };
    });
    const ordered = [...directory.terminals].sort((a, b) => (a.sn === 'WP6267UQ36002376' ? -1 : b.sn === 'WP6267UQ36002376' ? 1 : a.sn.localeCompare(b.sn)));
    const terminals = ordered.map((t, i) => ({ sn: t.sn, name: t.name, enrolledAt: old, pattern: i % 10, telemetryZone: stores.find(s => s.id === t.storeId).timeZone, memberships: [{ storeId: t.storeId, from: old, to: null }], versions: [], observations: [] }));
    const data = { schema: 1, revision: 0, seededAt: now, observedAt: now, stores, terminals, audit: [] };
    const primary = terminals.find(t => t.sn === 'WP6267UQ36002376');
    if (primary) primary.pattern = 0;
    const recent = terminals.find(t => t.sn === 'NYC-Q3-0043');
    if (recent) {
      recent.enrolledAt = D.localEpoch(D.addDays(D.parts(now, recent.telemetryZone).date, -1), 600, recent.telemetryZone);
      recent.memberships[0].from = recent.enrolledAt; recent.pattern = 1;
    }
    const moved = terminals.find(t => t.sn === 'NYC-Q3-0042');
    if (moved && stores.some(s => s.id === 's-boston')) {
      const movedAt = D.localEpoch(D.addDays(D.parts(now, moved.telemetryZone).date, -3), 720, moved.telemetryZone);
      moved.memberships = [{ storeId: 's-boston', from: old, to: movedAt }, { storeId: 's-midtown', from: movedAt, to: null }];
      moved.pattern = 2;
    }
    const overnight = terminals.find(t => t.sn === 'BOS-Q3-0018');
    if (overnight) {
      const schedule = D.allDay(overnight.telemetryZone);
      schedule.week = Array.from({ length: 7 }, () => custom(1320, 120));
      schedule.exceptions = [{ date: D.addDays(D.parts(now, schedule.timeZone).date, -2), plan: { mode: 'closed', intervals: [] } }];
      overnight.versions.push({ from: old, sequence: 0, storeId: overnight.memberships[0].storeId, mode: 'custom', schedule, actor: 'Demo setup' });
      overnight.pattern = 4;
    }
    const split = terminals.find(t => t.sn === 'WP2013Q321000014');
    if (split) {
      const schedule = D.allDay(split.telemetryZone);
      schedule.week = Array.from({ length: 7 }, () => ({ mode: 'custom', intervals: [{ start: 480, end: 720 }, { start: 840, end: 1080 }] }));
      split.versions.push({ from: old, sequence: 0, storeId: split.memberships[0].storeId, mode: 'custom', schedule, actor: 'Demo setup' }); split.pattern = 6;
    }
    const retired = terminals.find(t => t.sn === 'WP52205Q33000981');
    if (retired) retired.memberships[0].to = now - 2 * D.DAY;
    return refresh(retireSpecialDates(migrateSerials(data, now), now), now);
  }
  function refresh(input, until = Date.now()) {
    const data = D.clone(input);
    for (const t of data.terminals) {
      if (t.configurationOnly) continue;
      const zone = t.telemetryZone, today = D.parts(until, zone).date;
      const earliest = D.addDays(D.monthsAgo(today), -1), observations = [];
      for (let date = earliest; date <= today; date = D.addDays(date, 1)) {
        const from = Math.max(t.enrolledAt, D.localEpoch(date, 0, zone)), to = Math.min(until, D.localEpoch(D.addDays(date, 1), 0, zone));
        if (to <= from) continue;
        const n = Math.floor(Date.parse(date + 'T00:00:00Z') / D.DAY);
        let patches = [];
        if (t.pattern === 0) patches = [[9 * 60 + 20, 9 * 60 + 48, 'offline'], ...(n % 3 === 0 ? [[15 * 60, 16 * 60 + 12, 'offline']] : [])];
        if (t.pattern === 2) patches = [[11 * 60, 11 * 60 + 15, 'offline'], [14 * 60, 14 * 60 + 45, 'unknown']];
        if (t.pattern === 3) patches = [[12 * 60, 15 * 60, 'unknown']];
        if (t.pattern === 4 && n % 2 === 0) patches = [[23 * 60 + 10, 23 * 60 + 25, 'offline']];
        if (t.pattern === 5 && n % 5 === 0) patches = [[10 * 60, 12 * 60, 'offline']];
        if (t.pattern === 6) patches = [[12 * 60 + 10, 13 * 60 + 50, 'offline']];
        if (t.pattern === 7 && n % 3 === 0) patches = [[8 * 60 + 30, 8 * 60 + 30.5, 'offline']];
        if (t.pattern === 8 && (n % 4 === 0 || from >= t.noHeartbeatSince)) patches = [[0, 1440, 'unknown', 'unreported']];
        let cursor = from;
        for (const [a, b, state, cause] of patches) {
          const begin = Math.max(from, D.localEpoch(date, Math.floor(a), zone) + (a % 1) * D.MINUTE);
          const finish = Math.min(to, D.localEpoch(date, Math.floor(b), zone) + (b % 1) * D.MINUTE);
          if (finish <= begin) continue;
          if (begin > cursor) observations.push({ from: cursor, to: begin, state: 'online' });
          observations.push({ from: begin, to: finish, state, ...(cause ? { cause } : {}) }); cursor = finish;
        }
        if (cursor < to) observations.push({ from: cursor, to, state: 'online' });
      }
      t.observations = observations;
    }
    data.observedAt = until; return data;
  }
  function load(storage, directory, now = Date.now()) {
    const raw = storage.getItem(KEY);
    if (!raw) { const data = seed(directory, now); storage.setItem(KEY, JSON.stringify(data)); return data; }
    let data;
    try { data = JSON.parse(raw); } catch (_) { throw new Error('Saved Uptime data cannot be read. Your saved data has been preserved.'); }
    if (data.schema !== 1 || !Array.isArray(data.stores) || !Array.isArray(data.terminals) || !Array.isArray(data.audit)) throw new Error('Saved Uptime data is not supported. Your saved data has been preserved.');
    // Opening a page fetches a fresh demo snapshot once. No polling is involved.
    // Regenerate observations without replacing schedules, membership or audit.
    return persist(storage, refresh(retireSpecialDates(migrateSerials(data, now), now), now), data.revision);
  }
  function persist(storage, data, expectedRevision) {
    const raw = storage.getItem(KEY);
    if (raw && JSON.parse(raw).revision !== expectedRevision) throw new Error('Operating Hours changed in another tab. Refresh before saving; your changes are still in this form.');
    try { storage.setItem(KEY, JSON.stringify(data)); } catch (_) { throw new Error('Could not save Operating Hours in this browser. Free some storage and try again; your changes are still in this form.'); }
    return data;
  }
  function viewerAuth(data, profile, params) {
    const scope = profile.includes('store') ? 'store:s-midtown' : profile.includes('merchant') ? 'merchant:merchant-kind-world' : profile === 'wizarpos' ? 'all' : 'provider:sp-universal';
    const base = D.scopeStores(data, scope), requested = params.get('scope'), subset = requested && D.scopeStores(data, requested);
    return { scope: subset?.length && subset.every(id => base.includes(id)) ? requested : scope, manage: params.get('access') !== 'view' };
  }
  // Register explicit merchant-page identities, without fabricating telemetry or
  // mapping similarly named stores onto the separate account-directory fixtures.
  function registerContext(input, context, now = Date.now()) {
    if (!context.merchantId || !context.storeId) throw new Error('The merchant and store identity are required to edit operating hours.');
    const next = D.clone(input), id = 'portal:' + context.merchantId + ':' + context.storeId;
    let store = next.stores.find(s => s.id === id);
    if (!store) {
      if (!D.validZone(context.timeZone)) throw new Error('Set a valid store time zone before editing operating hours.');
      store = { id, name: context.storeName, merchantName: context.merchantName, sourceMerchantId: context.merchantId, sourceStoreId: context.storeId, lineageKeys: ['merchant:portal:' + context.merchantId, 'store:' + id], timeZone: context.timeZone, versions: [] };
      next.stores.push(store);
    } else { store.name = context.storeName || store.name; store.merchantName = context.merchantName || store.merchantName; }
    for (const item of context.terminals || []) {
      const sn = resolveSn(item.sn?.trim()); if (!sn || sn === '-') continue;
      const existing = next.terminals.find(t => t.sn === sn);
      if (existing) {
        if (D.membershipAt(existing, now)?.storeId !== id) throw new Error('Terminal ' + sn + ' belongs to a different store. Correct its store assignment before editing these hours.');
        existing.name = item.name || existing.name; continue;
      }
      next.terminals.push({ sn, name: item.name || sn, configurationOnly: true, enrolledAt: now, telemetryZone: store.timeZone, memberships: [{ storeId: id, from: now, to: null }], versions: [], observations: [] });
    }
    const changed = JSON.stringify(next) !== JSON.stringify(input);
    if (changed) next.revision = input.revision + 1;
    return { data: next, storeId: id, changed };
  }
  return { KEY, seed, refresh, load, persist, viewerAuth, resolveSn, registerContext, retireSpecialDates };
});
