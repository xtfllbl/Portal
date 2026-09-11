(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PaywizardCustomerAccountDirectory = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function create(hierarchy) {
    const accounts = [], terminals = [], nodes = new Map(), roots = [];
    function node(type, entity, parent) {
      const key = `${type}:${entity.id}`;
      const value = { key, type, id: entity.id, name: entity.name, children: [], parentKey: parent?.key || '' };
      if (nodes.has(key)) throw new Error(`Duplicate account directory key: ${key}`);
      nodes.set(key, value);
      if (type !== 'terminal') accounts.push(value);
      if (parent) parent.children.push(value);
      return value;
    }
    function merchants(items, parent, providerId, agentId = '') {
      for (const merchant of items || []) {
        const m = node('merchant', merchant, parent);
        for (const store of merchant.stores || []) {
          const s = node('store', store, m);
          for (const terminal of store.terminals || []) {
            const t = node('terminal', terminal, s);
            Object.assign(t, { sn: terminal.id, providerId, agentId, merchantId: merchant.id, storeId: store.id, merchant: merchant.name, store: store.name });
            terminals.push(t);
          }
        }
      }
    }
    for (const provider of hierarchy) {
      const p = node('provider', provider);
      roots.push(p);
      const agents = new Map((provider.agents || []).map(agent => [agent.id, node('agent', agent)]));
      for (const agent of provider.agents || []) {
        const a = agents.get(agent.id), parent = agents.get(agent.parentId) || p;
        a.parentKey = parent.key; parent.children.push(a);
        merchants(agent.merchants, a, provider.id, agent.id);
      }
      merchants(provider.merchants, p, provider.id);
    }
    for (const value of nodes.values()) {
      const lineage = [], seen = new Set();
      let current = value;
      while (current && !seen.has(current.key)) { seen.add(current.key); lineage.unshift(current); current = nodes.get(current.parentKey); }
      value.lineageKeys = lineage.map(item => item.key);
      value.path = lineage.map(item => item.name).join(' / ');
    }
    const account = key => { const result = nodes.get(key); return result?.type !== 'terminal' ? result || null : null; };
    const terminalsFor = key => account(key) ? terminals.filter(terminal => terminal.lineageKeys.includes(key)) : [];
    function tree(key, query = '') {
      const root = account(key);
      if (!root) return null;
      const term = query.trim().toLowerCase();
      function visit(value, parentMatches = false, seen = new Set()) {
        if (seen.has(value.key)) return null;
        const nextSeen = new Set(seen).add(value.key);
        const matches = parentMatches || !term || `${value.name} ${value.id}`.toLowerCase().includes(term);
        if (value.type === 'terminal') return matches ? { ...value, terminalIds: [value.sn] } : null;
        const children = value.children.map(child => visit(child, matches, nextSeen)).filter(Boolean);
        const terminalIds = children.flatMap(child => child.terminalIds);
        return terminalIds.length ? { ...value, children, terminalIds } : null;
      }
      return visit(root);
    }
    return { roots, accounts, terminals, account, terminalsFor, tree };
  }
  return { create };
});
