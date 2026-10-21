(function () {
  'use strict';
  const key = 'paywizard.maintain.developers.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const uuid = () => crypto.randomUUID().replaceAll('-', '');
  const now = () => new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
  const entities = (window.PaywizardEntityHierarchy || []).filter(e => ['super_iso', 'agent', 'merchant'].includes(e.kind)).map(e => ({
    id: e.id, parentId: e.parentId, name: e.name, type: e.kind === 'super_iso' ? 'provider' : e.kind, enabled: true,
    mid: e.kind === 'merchant' ? 'DEMO-' + e.id.replace(/^m-/, '').toUpperCase() : ''
  })).concat([
    { id: 'provider-northstar', parentId: '', name: 'Northstar Payments', type: 'provider', enabled: true },
    { id: 'agent-maple', parentId: 'provider-northstar', name: 'Maple Payments', type: 'agent', enabled: true },
    { id: 'agent-maple-east', parentId: 'agent-maple', name: 'Maple East', type: 'agent', enabled: true },
    { id: 'merchant-maple', parentId: 'agent-maple-east', name: 'Maple Market', type: 'merchant', enabled: true, mid: 'DEMO-MAPLE-01' },
    { id: 'merchant-northstar', parentId: 'provider-northstar', name: 'Northstar Coffee', type: 'merchant', enabled: true, mid: 'DEMO-NORTHSTAR-02' },
    { id: 'merchant-northstar-inactive', parentId: 'provider-northstar', name: 'Northstar Outlet', type: 'merchant', enabled: false, mid: 'DEMO-NORTHSTAR-03' }
  ]);
  const entity = id => entities.find(e => e.id === id);
  function providerId(e) {
    const seen = new Set();
    while (e && e.type !== 'provider' && !seen.has(e.id)) { seen.add(e.id); e = entity(e.parentId); }
    return e?.type === 'provider' ? e.id : '';
  }
  const providers = entities.filter(e => e.type === 'provider');
  const scope = id => entities.filter(e => providerId(e) === id && e.enabled);
  function seed() {
    const names = ['Atlas Integration', 'Maple Connect', 'Harbor Systems', 'Retail Bridge', 'Lumen Commerce', 'Cedar Payments', 'Metro Connect', 'Summit Software', 'Orchard POS', 'Beacon Systems', 'Silverline ISV', 'Riverstone Labs', 'Aster Commerce', 'Oakline Digital', 'Pacific Integration', 'Brightway POS', 'Northgate Systems', 'Urban Checkout', 'Cloudlane Retail', 'Evergreen Labs', 'Coastal Software', 'Bluebird Connect', 'Meridian ISV', 'Willow Systems', 'Pinecrest POS', 'Fieldstone Labs'];
    const state = { version: 1, accounts: [], bindings: [], tokens: {}, deliveries: [] };
    names.forEach((name, index) => {
      const id = String(109325696455057696n - BigInt(index) * 1837140800011n);
      const sp = providers[index % providers.length];
      state.accounts.push({ id, name, email: name.toLowerCase().replaceAll(' ', '.') + '@example.com', providerId: sp.id,
        company: name, phone: '', address: '', notifyUrl: '', settleUrl: '', verify: true, ips: ['192.0.2.' + (10 + index)], terminalAuto: false, ecommAuto: false,
        secret: uuid(), createdAt: `2026-${index < 9 ? '10' : '09'}-${String(20 - index % 19).padStart(2, '0')} 14:30:00`, createdBy: index % 3 ? 'Haven' : 'Operations' });
      // Existing accounts have a mix of retained and removed relationships, so both binding flows can be demonstrated.
      scope(sp.id).filter((e, i) => i < 3 || (i + index) % 3 === 0).forEach(e => state.bindings.push({ clientId: id, entityId: e.id, createdAt: '2026-09-01 09:00:00' }));
    });
    entities.forEach(e => { if (e.type === 'merchant') { state.tokens[e.id + ':ecomm'] = uuid(); state.tokens[e.id + ':terminal'] = uuid(); } else state.tokens[e.id + ':platform'] = uuid(); });
    state.accounts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return state;
  }
  function read() {
    let state;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) { state = seed(); localStorage.setItem(key, JSON.stringify(state)); }
      else state = JSON.parse(raw);
      if (state.version !== 1 || !Array.isArray(state.accounts) || !Array.isArray(state.bindings) || !state.tokens || !Array.isArray(state.deliveries)
        || state.accounts.some(a => !a.id || typeof a.name !== 'string' || typeof a.email !== 'string' || typeof a.secret !== 'string' || !Array.isArray(a.ips))
        || Object.values(state.tokens).some(token => typeof token !== 'string')) throw new Error();
      return state;
    } catch (_) { throw new Error('Developer accounts could not be loaded. Allow browser storage and reload this page.'); }
  }
  function account(state, id) {
    const found = state.accounts.find(a => a.id === id);
    if (!found) throw new Error('This developer account is unavailable. Return to Developer Manage and select an existing account.');
    return found;
  }
  function validIps(values) {
    const ips = values.map(v => v.trim());
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    if (ips.some(ip => !ipv4.test(ip))) throw new Error('Enter valid IPv4 addresses, for example 192.0.2.10.');
    if (new Set(ips).size !== ips.length) throw new Error('Remove duplicate IP addresses.');
    return ips;
  }
  function validate(input, state, existing) {
    const errors = {};
    if (!input.name?.trim()) errors.name = 'Enter a developer name.';
    if (!input.email?.trim() || input.email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = 'Enter a valid email address (up to 180 characters).';
    if (!providers.some(p => p.id === input.providerId)) errors.providerId = 'Select a service provider.';
    if (!existing) {
      if (state.accounts.some(a => a.name.toLowerCase() === input.name?.trim().toLowerCase())) errors.name = 'This developer name already exists. Enter a different name.';
      if (state.accounts.some(a => a.email.toLowerCase() === input.email?.trim().toLowerCase())) errors.email = 'This email already exists. Enter a different email.';
    }
    try { validIps(input.ips || []); } catch (error) { errors.ips = error.message; }
    if (input.verify && !input.ips?.length) errors.ips = 'Add at least one IPv4 address while allowlist verification is enabled.';
    return errors;
  }
  function mail(state, a, kind, entityId = '', tokenType = '') {
    state.deliveries.push({ id: crypto.randomUUID(), clientId: a.id, email: a.email, kind, entityId, tokenType, at: now(), simulated: true });
  }
  function mutate(action, payload) {
    const state = clone(read());
    const a = action === 'create' ? null : account(state, payload.clientId);
    if (action === 'create' || action === 'update') {
      const fields = ['name', 'email', 'providerId', 'company', 'phone', 'address', 'notifyUrl', 'settleUrl', 'verify', 'ips', 'terminalAuto', 'ecommAuto'];
      const input = Object.fromEntries(fields.filter(field => Object.hasOwn(payload.input, field)).map(field => [field, clone(payload.input[field])]));
      if (a) Object.assign(input, { name: a.name, email: a.email, providerId: a.providerId });
      const errors = validate(input, state, a);
      if (Object.keys(errors).length) { const error = new Error('Check the highlighted fields and try again.'); error.fields = errors; throw error; }
      input.name = input.name.trim(); input.email = input.email.trim(); input.ips = validIps(input.ips);
      if (a) Object.assign(a, input);
      else {
        const id = (BigInt(Date.now()) * 100000n + BigInt(crypto.getRandomValues(new Uint32Array(1))[0] % 100000)).toString();
        const created = { ...input, id, secret: uuid(), createdAt: now(), createdBy: 'Operations' };
        state.accounts.unshift(created);
        scope(created.providerId).forEach(e => state.bindings.push({ clientId: id, entityId: e.id, createdAt: now() }));
        mail(state, created, 'client-credentials');
      }
    } else if (action === 'bind') {
      if (!payload.ids?.length) throw new Error('Select at least one account to bind.');
      const allowed = new Set(scope(a.providerId).map(e => e.id));
      for (const id of payload.ids) {
        if (!allowed.has(id)) throw new Error('Only enabled accounts in this developer’s service provider can be bound. Refresh the selection.');
        if (state.bindings.some(b => b.clientId === a.id && b.entityId === id)) throw new Error('An account is already bound to this developer. Refresh the selection.');
        state.bindings.push({ clientId: a.id, entityId: id, createdAt: now() });
      }
    } else if (action === 'unbind') {
      requireBinding(state, a.id, payload.entityId);
      state.bindings = state.bindings.filter(b => !(b.clientId === a.id && b.entityId === payload.entityId));
    } else if (action === 'add-ip') {
      a.ips = validIps([...a.ips, payload.ip]);
    } else if (action === 'remove-ip') {
      if (a.verify && a.ips.length <= 1) throw new Error('Keep at least one IP address. First turn off Verify Allowlist in Edit Developer to remove the last address.');
      a.ips = a.ips.filter(ip => ip !== payload.ip);
    } else if (action === 'reset-secret') {
      a.secret = uuid(); mail(state, a, 'client-credentials');
    } else if (action === 'resend') {
      mail(state, a, 'client-credentials');
    } else if (action === 'reset-token' || action === 'send-token') {
      requireBinding(state, a.id, payload.entityId);
      const tokenKey = payload.entityId + ':' + payload.tokenType;
      if (!state.tokens[tokenKey]) throw new Error('This token is unavailable. Return to the binding list and select an available token.');
      if (action === 'reset-token') state.tokens[tokenKey] = uuid();
      else mail(state, a, 'token', payload.entityId, payload.tokenType);
    } else throw new Error('This action is unavailable. Reload and try again.');
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch (_) { throw new Error('Changes could not be saved. Free browser storage and try again. Your input has been kept.'); }
    window.dispatchEvent(new Event('developer-accounts-changed'));
    return state;
  }
  function requireBinding(state, clientId, entityId) {
    if (!state.bindings.some(b => b.clientId === clientId && b.entityId === entityId)) throw new Error('This account is no longer bound to the developer. Return to the binding list.');
  }
  window.PaywizardDeveloperStore = { key, read, mutate, validate, validIps, entity, entities, providers, providerId, scope };
})();
