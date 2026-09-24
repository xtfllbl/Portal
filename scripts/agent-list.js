(function () {
  'use strict';
  // Names, IDs and business models are transcribed from the supplied provider screenshot.
  const providers = [
    { id: '1002', name: 'wizarpos', model: 'Full-Service' },
    { id: '1001', name: 'NA Service Providers', model: 'Full-Service', branches: ['North America Partners', 'Pacific Payments', 'Bay Area Services', 'Atlantic Payments', 'Central Partner Network', 'Great Lakes Services'] },
    { id: '1045', name: 'Noctoptics', model: 'Full-Service', branches: ['Noctoptics Distribution', 'Northern Partners', 'Metro Payments', 'Coastal Partners', 'Noctoptics Business Services', 'Regional Solutions'] },
    { id: '1043', name: 'Paynt ISV', model: 'Full-Service', branches: ['Paynt Partner Network', 'Retail Solutions', 'City Commerce', 'Hospitality Solutions', 'Paynt Regional Partners', 'Independent Retail Services'] },
    { id: '1040', name: 'Dippindots', model: 'Unattended-Service', branches: ['Dippindots Distribution', 'East Coast Vending', 'Metro Vending Services', 'West Coast Vending', 'Dippindots Regional Partners', 'Leisure Venue Services'] },
    { id: '1039', name: 'YoloPago', model: 'Full-Service', branches: ['YoloPago Partners', 'Capital Payments', 'Urban Commerce', 'Coastal Payments', 'YoloPago Business Network', 'Regional Retail Services'] },
    { id: '1037', name: 'ManagePay', model: 'Full-Service', branches: ['ManagePay Distribution', 'Northern Payments', 'City Retail Solutions', 'Southern Payments', 'ManagePay Partner Services', 'Hospitality Partners'] },
    { id: '1036', name: 'JMSCPOS', model: 'Attended-Service', branches: ['JMSC Partner Network', 'Restaurant Solutions', 'Downtown POS Services', 'Retail POS Partners', 'JMSC Regional Services', 'Independent POS Solutions'] },
    { id: '1029', name: 'MonclusVending', model: 'Unattended-Service', branches: ['Monclus Partner Network', 'Urban Vending Services', 'Central Route Partners', 'Regional Vending Services', 'Monclus Distribution', 'Workplace Vending Partners'] },
    { id: '1019', name: 'Retech Payment Systems', model: 'Full-Service', branches: ['Retech Partner Network', 'Northern Business Services', 'Metro Payment Solutions', 'Coastal Business Services', 'Retech Distribution', 'Regional Commerce Partners'] }
  ];
  // Page-local prototype contexts, independent of the shared profile simulator. Not authentication.
  const params = new URLSearchParams(location.search);
  const mode = params.get('scope') === 'provider' ? 'provider' : 'operations';
  const initialProvider = providers.find(provider => provider.id === params.get('provider')) || providers[0];
  let providerId = initialProvider.id, providerPicker = null, switchingProvider = false;
  window.PaywizardAgentContext = Object.freeze({ mode, providerId, label: mode === 'operations' ? 'Platform Operations' : initialProvider.name + ' Provider', shellProfile: mode === 'operations' || providerId === '1002' ? 'wizarpos' : ({ 'Full-Service': 'full-service', 'Attended-Service': 'attended', 'Unattended-Service': 'unattended' })[initialProvider.model] });
  const agents = [
        { id: "r-agenttest", name: "agenttest", level: 1, contact: "Beaver", email: "xtfllb@gmail2.com", status: "Enable", createdAt: "2026-03-04 23:13:26", parentId: "" },
        { id: "r-zhongdazn", name: "zhongdazn", level: 1, contact: "zhongdazn", email: "admin@zhongdazn.com", status: "Enable", createdAt: "2025-06-23 15:41:32", parentId: "" },
        { id: "sr-twoagent", name: "twoAgent", level: 2, contact: "twoAgent", email: "twoAgent@qq.com", status: "Enable", createdAt: "2025-01-14 17:10:46", parentId: "r-agenttest" },
        { id: "sr-agdd", name: "agdd", level: 2, contact: "agdd", email: "agdd@qq.com", status: "Enable", createdAt: "2025-01-14 17:05:25", parentId: "r-agenttest" },
        { id: "sr-angwinmg", name: "123456789012345678901234567890", level: 2, contact: "angwinmg", email: "188282@qq.com", status: "Enable", createdAt: "2025-01-14 15:36:11", parentId: "r-zhongdazn" },
        { id: "sr-ageindgmin11", name: "ageindgmin11", level: 2, contact: "wangming", email: "zetrev@bqail.com", status: "Enable", createdAt: "2025-01-09 18:47:04", parentId: "r-zhongdazn" },
        { id: "s3-oneleaveagent", name: "OneLeaveAgent", level: 3, contact: "YIDLS", email: "ziccaj@bqail.com", status: "Enable", createdAt: "2025-01-09 10:04:57", parentId: "sr-agdd" },
        { id: "s3-agent", name: "Agent", level: 3, contact: "test", email: "dzw@test.com", status: "Enable", createdAt: "2024-10-22 10:39:55", parentId: "sr-twoagent" }
      ];
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const icon = name => '<span class="material-symbols-rounded" aria-hidden="true">' + name + '</span>';
  const models = ['Full-Service', 'Attended-Service', 'Unattended-Service'];
  const authorizations = [{ key: 'AGT-ADMIN', name: 'AGENT-ADMIN' }, { key: 'AGT-MANAGER', name: 'AGENT-MANAGER' }, { key: 'AGT-OPS', name: 'AGENT-OPS' }];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia'];
  const mccOptions = [ ['5411', 'Grocery Stores'], ['5812', 'Eating Places'], ['5814', 'Fast Food Restaurants'], ['5499', 'Misc Food Stores'], ['5999', 'Misc Retail'] ];
  // Supplement the existing eight demo agents; these are illustrative details, not production records.
  agents.forEach((agent, i) => Object.assign(agent, {
    providerId: '1002', contactInfo: '+1 415 555 ' + String(1000 + i), businessModel: 'Full-Service', authorization: 'AGT-ADMIN',
    cooperationStart: agent.createdAt.slice(0, 16).replace(' ', 'T'), termYears: '10',
    country: 'United States', state: '', city: '', mcc: ['5999']
  }));
  // Only the original wizarpos records predate this task. All new agents are fictional examples.
  providers.slice(1).forEach((provider, providerIndex) => {
    const shape = [{ level: 1, parent: null }, { level: 2, parent: 0 }, { level: 3, parent: 1 }, { level: 2, parent: 0 }, { level: 1, parent: null }, { level: 2, parent: 4 }];
    provider.branches.forEach((name, index) => agents.push({
      id: 'sp-' + provider.id + '-agent-' + index, providerId: provider.id, name, level: shape[index].level,
      parentId: shape[index].parent === null ? '' : 'sp-' + provider.id + '-agent-' + shape[index].parent,
      contact: ['Alex Morgan', 'Jordan Lee', 'Casey Taylor', 'Sam Parker', 'Jamie Chen', 'Robin Ellis'][index],
      email: 'agent.' + provider.id + '.' + (index + 1) + '@example.com', contactInfo: '+1 415 555 ' + String(1100 + providerIndex * 10 + index),
      businessModel: provider.model, authorization: 'AGT-ADMIN', status: index === 5 && providerIndex % 2 === 0 ? 'Disable' : 'Enable',
      createdAt: '2026-08-' + String(10 + index).padStart(2, '0') + ' 09:30:00', cooperationStart: '2026-08-10T09:30',
      termYears: String(2 + providerIndex % 4), country: 'United States', state: '', city: '', mcc: [provider.model === 'Attended-Service' ? '5812' : '5999']
    }));
  });
  const fieldGroups = [
    { title: 'Basic Information', fields: [
      ['name', 'Agent Name', 'text', true], ['contact', 'Contact Person', 'text', true],
      ['contactInfo', 'Contact Information', 'text', true], ['email', 'Agent Email', 'email', true],
      ['businessModel', 'Business Model', 'select', true], ['authorization', 'Agent Authorization', 'select', true]
    ] },
    { title: 'Cooperation & Region', fields: [
      ['cooperationStart', 'Cooperation Start Time', 'datetime-local', true], ['termYears', 'Agent Term (Years)', 'number', true],
      ['country', 'Country or Region', 'select', true], ['state', 'State/Province/Region', 'text', false],
      ['city', 'City/Town', 'text', false], ['mcc', 'MCC', 'mcc', true]
    ] }
  ];
  let selectedId = agents.find(agent => agent.providerId === providerId)?.id, editing = false, createParentId = '', editBaseline = '', createBaseline = '';
  let detailPickers = [], createPickers = [], rootExpanded = true;
  const collapsed = new Set(), notices = new Map(), sending = new Set();
  const currentProvider = () => providers.find(provider => provider.id === providerId);
  const scopedAgents = () => agents.filter(agent => agent.providerId === providerId);
  const find = id => scopedAgents().find(agent => agent.id === id);
  const children = id => scopedAgents().filter(agent => agent.parentId === id);
  const selected = () => find(selectedId);
  const btn = (action, text, symbol, kind = '') => '<button type="button" class="al-btn al-action-btn ' + kind + '" data-action="' + action + '" aria-label="' + text + '" data-tooltip="' + text + '">' + icon(symbol) + '</button>';
  const dispose = pickers => { pickers.forEach(picker => picker.destroy()); return []; };

  function mountProviderPicker(focus = false) {
    providerPicker?.destroy();
    const host = $('providerPicker');
    if (mode === 'provider') { host.className = 'al-provider-fixed'; host.textContent = currentProvider().name; return; }
    providerPicker = window.PaywizardUptimeCombobox.mount(host, {
      label: 'Service Provider', options: providers.map(provider => ({ key: provider.id, name: provider.name + ' · ' + provider.id })), value: providerId,
      onChange: next => { changeProvider(next); }
    });
    host.classList.add('al-select-host');
    host.querySelector('[role="listbox"]').classList.add('al-select-options');
    $('providerLabel').htmlFor = host.querySelector('input').id;
    if (focus) { host.querySelector('input').focus({ preventScroll: true }); providerPicker.close(); }
  }
  async function changeProvider(next) {
    if (mode !== 'operations' || switchingProvider || !providers.some(provider => provider.id === next)) return;
    if (next === providerId) return;
    switchingProvider = true;
    // Keep the current context visible until a possible discard confirmation is resolved.
    mountProviderPicker();
    const canLeave = await leaveEdit();
    if (canLeave) {
      providerId = next; selectedId = scopedAgents()[0]?.id; rootExpanded = true; collapsed.clear();
      $('searchName').value = ''; renderTree(); renderDetail();
      document.querySelector('.al-page-heading').scrollIntoView({ block: 'nearest' });
    }
    switchingProvider = false; mountProviderPicker(true);
  }

  function renderTree(focusId) {
    const query = $('searchName').value.trim().toLowerCase();
    const visible = new Set();
    scopedAgents().filter(agent => !query || agent.name.toLowerCase().includes(query)).forEach(agent => {
      let current = agent;
      while (current) { visible.add(current.id); current = find(current.parentId); }
    });
    let rows = '';
    const displayed = [];
    function visit(parentId) {
      const siblings = children(parentId).filter(agent => visible.has(agent.id));
      siblings.forEach((agent, index) => {
        const hasChildren = children(agent.id).some(child => visible.has(child.id));
        const expanded = !!query || !collapsed.has(agent.id);
        displayed.push(agent.id);
        rows += '<div class="al-tree-row al-agent-level-' + agent.level + '" role="treeitem" data-id="' + agent.id + '" aria-level="' + agent.level + '" aria-posinset="' + (index + 1) + '" aria-setsize="' + siblings.length + '" aria-label="' + escape(agent.name + ', L' + agent.level + (agent.status === 'Disable' ? ', Disabled' : '')) + '" aria-selected="' + (selectedId === agent.id) + '"' + (hasChildren ? ' aria-expanded="' + expanded + '"' : '') + ' tabindex="-1" style="--depth:' + agent.level + '">';
        rows += hasChildren ? '<button type="button" tabindex="-1" class="al-expander" data-expand="' + agent.id + '" aria-label="' + (expanded ? 'Collapse ' : 'Expand ') + escape(agent.name) + '">' + icon(expanded ? 'expand_more' : 'chevron_right') + '</button>' : '<span class="al-leaf-space"></span>';
        rows += '<span class="al-agent-icon" aria-hidden="true"></span><span class="al-node-name' + (agent.status === 'Disable' ? ' al-agent-disabled' : '') + '" title="' + escape(agent.name) + '">' + escape(agent.name) + '</span><span class="al-level">L' + agent.level + '</span></div>';
        if (hasChildren && expanded) visit(agent.id);
      });
    }
    visit('');
    $('agentTree').innerHTML = rows;
    $('providerRootName').textContent = currentProvider().name;
    $('providerRootName').title = currentProvider().name;
    $('agentTree').hidden = !rootExpanded && !query;
    $('providerToggle').setAttribute('aria-expanded', String(rootExpanded || !!query));
    $('providerToggle').querySelector('.material-symbols-rounded').textContent = rootExpanded || query ? 'expand_more' : 'chevron_right';
    $('treeEmpty').hidden = displayed.length > 0;
    const tabId = displayed.includes(focusId) ? focusId : displayed.includes(selectedId) ? selectedId : displayed[0];
    const focusRow = Array.from($('agentTree').children).find(row => row.dataset.id === tabId);
    if (focusRow) { focusRow.tabIndex = 0; if (focusId) focusRow.focus(); }
  }

  function valueLabel(agent, key) {
    if (key === 'authorization') return authorizations.find(option => option.key === agent[key])?.name || agent[key];
    if (key === 'mcc') return agent.mcc.map(code => code + ' — ' + mccOptions.find(option => option[0] === code)?.[1]).join(', ');
    if (key === 'cooperationStart') return agent[key]?.replace('T', ' ');
    return agent[key];
  }
  function readonlyField(label, value) { return '<div class="al-field"><dt>' + label + '</dt><dd>' + escape(value || '—') + '</dd></div>'; }
  function scopeMarkup(agent) {
    const parent = find(agent.parentId);
    const fields = [['Service Provider', currentProvider().name], ['Agent Level', 'L' + agent.level]];
    if (parent) fields.push(['Parent Agent', parent.name]);
    if (agent.createdAt) fields.push(['Created At', agent.createdAt]);
    return '<section class="al-section"><h3>Creation Scope</h3><dl class="al-fields">' + fields.map(([label, value]) => readonlyField(label, value)).join('') + '</dl></section>';
  }
  function fieldMarkup(prefix, field, values) {
    const [key, label, type, required] = field, id = prefix + '-' + key;
    let control;
    if (type === 'select') control = '<input type="hidden" name="' + key + '" value="' + escape(values[key]) + '"><div data-picker="' + key + '"></div>';
    else if (type === 'mcc') {
      control = '<div class="al-mcc"><input class="al-input" type="search" aria-label="Search MCC" placeholder="Search MCC" data-mcc-search><div class="al-mcc-selected" aria-label="Selected MCCs"></div><div class="al-mcc-options">' + mccOptions.map(([code, text]) => '<label><input type="checkbox" name="mcc" value="' + code + '"' + (values.mcc.includes(code) ? ' checked' : '') + '>' + code + ' — ' + text + '</label>').join('') + '</div><p class="al-empty" data-mcc-empty hidden>No matching MCCs.</p></div>';
    } else control = '<input class="al-input" id="' + id + '" name="' + key + '" type="' + type + '" value="' + escape(values[key]) + '"' + (required ? ' required' : '') + (type === 'number' ? ' min="1" step="1"' : '') + '>';
    return '<div class="al-field' + (type === 'mcc' ? ' al-full' : '') + '"><label' + (type !== 'mcc' ? ' for="' + id + '"' : ' id="' + id + '-label"') + '>' + label + (required ? ' <span class="al-required">*</span>' : '') + '</label>' + control + '</div>';
  }
  function formMarkup(prefix, values) {
    return '<div class="al-message error" data-form-error role="alert" tabindex="-1" hidden></div>' + scopeMarkup(values) + fieldGroups.map(group => '<fieldset class="al-section"><legend>' + group.title + '</legend><div class="al-fields">' + group.fields.map(field => fieldMarkup(prefix, field, values)).join('') + '</div></fieldset>').join('');
  }
  function mountForm(form) {
    const pickers = [];
    form.querySelectorAll('[data-picker]').forEach(host => {
      const key = host.dataset.picker, hidden = form.elements[key], label = host.parentElement.querySelector('label');
      const options = key === 'authorization' ? authorizations : (key === 'businessModel' ? models : countries).map(name => ({ key: name, name }));
      const picker = window.PaywizardUptimeCombobox.mount(host, { label: label.textContent.replace('*', '').trim(), options, value: hidden.value, onChange: value => { hidden.value = value; } });
      host.classList.add('al-select-host');
      host.querySelector('[role="listbox"]').classList.add('al-select-options');
      const input = host.querySelector('input');
      label.htmlFor = input.id;
      input.setAttribute('aria-required', 'true');
      input.dataset.field = key;
      pickers.push(picker);
    });
    const mcc = form.querySelector('.al-mcc');
    mcc.setAttribute('role', 'group');
    mcc.setAttribute('aria-labelledby', form.id === 'editForm' ? 'edit-mcc-label' : 'create-mcc-label');
    function paintMcc() {
      mcc.querySelector('.al-mcc-selected').innerHTML = Array.from(form.querySelectorAll('[name="mcc"]:checked')).map(input => '<button type="button" class="al-chip" data-remove-mcc="' + input.value + '" aria-label="Remove MCC ' + input.value + '">' + input.value + icon('close') + '</button>').join('');
    }
    mcc.addEventListener('change', paintMcc);
    mcc.addEventListener('click', event => {
      const remove = event.target.closest('[data-remove-mcc]');
      if (!remove) return;
      form.querySelector('[name="mcc"][value="' + remove.dataset.removeMcc + '"]').checked = false;
      paintMcc(); mcc.querySelector('[data-mcc-search]').focus();
    });
    mcc.querySelector('[data-mcc-search]').addEventListener('input', event => {
      const query = event.target.value.toLowerCase();
      const labels = Array.from(mcc.querySelectorAll('.al-mcc-options label'));
      labels.forEach(label => { label.hidden = !label.textContent.toLowerCase().includes(query); });
      mcc.querySelector('[data-mcc-empty]').hidden = labels.some(label => !label.hidden);
    });
    paintMcc();
    return pickers;
  }
  function formValues(form) {
    const data = new FormData(form), result = {};
    fieldGroups.flatMap(group => group.fields).forEach(([key]) => { result[key] = key === 'mcc' ? data.getAll(key).sort() : String(data.get(key) || '').trim(); });
    return result;
  }
  const dirty = form => !!form && JSON.stringify(formValues(form)) !== (form.id === 'editForm' ? editBaseline : createBaseline);
  function focusMessage(node) { node.scrollIntoView({ block: 'nearest' }); node.focus({ preventScroll: true }); }
  function validate(form) {
    const values = formValues(form), errors = [];
    form.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
    fieldGroups.flatMap(group => group.fields).forEach(([key, label, type, required]) => {
      let error = '';
      if (required && (type === 'mcc' ? !values[key].length : !values[key])) error = 'Enter ' + label + '.';
      if (type === 'email' && values[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[key])) error = 'Enter a valid Agent Email.';
      if (type === 'number' && (!Number.isInteger(Number(values[key])) || Number(values[key]) < 1)) error = 'Agent Term must be a whole number of at least 1 year.';
      if (error) { errors.push(error); (form.querySelector('[data-field="' + key + '"]') || form.querySelector('[name="' + key + '"]'))?.setAttribute('aria-invalid', 'true'); }
    });
    const summary = form.querySelector('[data-form-error]');
    summary.hidden = !errors.length;
    if (errors.length) { summary.textContent = errors.join(' '); focusMessage(summary); return null; }
    return values;
  }
  function showNotice(agentId, message, error = false) {
    notices.set(agentId, { message, error });
    if (selectedId !== agentId || editing) return;
    const node = $('detailNotice');
    node.textContent = message; node.hidden = false; node.classList.toggle('error', error);
    if (error) { node.setAttribute('role', 'alert'); focusMessage(node); }
  }
  function renderDetail(focusTarget) {
    hideActionTooltip();
    detailPickers = dispose(detailPickers);
    const agent = selected();
    if (!agent) { $('agentDetail').innerHTML = '<p class="al-empty">No agents yet. Add a Level 1 agent to get started.</p>'; return; }
    const notice = notices.get(agent.id);
    let html = '<header class="al-detail-head"><div class="al-detail-identity"><h2 id="agentDetailTitle">' + escape(agent.name) + '</h2><span class="al-status' + (agent.status === 'Disable' ? ' disabled' : '') + '">' + (agent.status === 'Enable' ? 'Enabled' : 'Disabled') + '</span></div>';
    if (!editing) html += '<div class="al-actions" role="group" aria-label="Agent actions">' + (agent.level < 3 ? btn('add-child', 'Add Sub-agent', 'add') : '') + btn('edit', 'Edit', 'edit_square', 'al-action-info') + btn('toggle', agent.status === 'Enable' ? 'Disable' : 'Enable', agent.status === 'Enable' ? 'block' : 'check_circle', agent.status === 'Enable' ? 'al-danger' : 'al-action-info') + btn('reset', 'Send Password Reset Email', 'forward_to_inbox', 'al-action-info') + '</div>';
    html += '</header>';
    if (editing) {
      html += '<form id="editForm" novalidate>' + formMarkup('edit', agent) + '<footer class="al-footer al-edit-footer"><button class="al-btn" type="button" data-action="cancel-edit">Cancel</button><button class="al-btn al-primary" type="submit">Save</button></footer></form>';
    } else {
      html += '<div id="detailNotice" class="al-message' + (notice?.error ? ' error' : '') + '" role="' + (notice?.error ? 'alert' : 'status') + '" tabindex="-1"' + (!notice ? ' hidden' : '') + '>' + escape(notice?.message || '') + '</div>' + scopeMarkup(agent);
      html += fieldGroups.map(group => '<section class="al-section"><h3>' + group.title + '</h3><dl class="al-fields">' + group.fields.map(([key, label]) => readonlyField(label, valueLabel(agent, key))).join('') + '</dl></section>').join('');
    }
    $('agentDetail').innerHTML = html;
    if (editing) {
      detailPickers = mountForm($('editForm'));
      editBaseline = JSON.stringify(formValues($('editForm')));
      $('editForm').addEventListener('submit', saveEdit);
    } else if (sending.has(agent.id)) {
      const button = $('agentDetail').querySelector('[data-action="reset"]'); button.disabled = true; button.setAttribute('aria-label', 'Sending…'); button.dataset.tooltip = 'Sending…'; button.setAttribute('aria-busy', 'true'); button.querySelector('span').textContent = 'progress_activity';
    }
    if (focusTarget) $('agentDetail').querySelector(focusTarget)?.focus();
  }
  async function confirmAction(title, message, acceptText, cancelText = 'Cancel') {
    const dialog = $('confirmDialog');
    if (dialog.open) return false;
    $('confirmTitle').textContent = title; $('confirmMessage').textContent = message;
    $('confirmAccept').textContent = acceptText; $('confirmCancel').textContent = cancelText;
    dialog.showModal(); $('confirmCancel').focus();
    return new Promise(resolve => {
      function finish(result) { dialog.close(); dialog.oncancel = null; resolve(result); }
      $('confirmCancel').onclick = () => finish(false);
      $('confirmAccept').onclick = () => finish(true);
      dialog.oncancel = event => { event.preventDefault(); finish(false); };
    });
  }
  async function leaveEdit() {
    if (!editing) return true;
    if (dirty($('editForm')) && !await confirmAction('Discard unsaved changes?', 'Your changes to ' + selected().name + ' have not been saved.', 'Discard Changes', 'Continue Editing')) return false;
    editing = false;
    return true;
  }
  async function selectAgent(id) {
    if (id === selectedId || !find(id)) return;
    if (!await leaveEdit()) return;
    selectedId = id; renderTree(id); renderDetail();
    $('agentDetail').scrollIntoView({ block: 'start' });
  }
  function revealAgent(id) {
    rootExpanded = true; $('searchName').value = '';
    let agent = find(id);
    while (agent) { collapsed.delete(agent.id); agent = find(agent.parentId); }
    renderTree(id);
    $('agentTree').querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function saveEdit(event) {
    event.preventDefault();
    const values = validate(event.currentTarget);
    if (!values) return;
    Object.assign(selected(), values); editing = false;
    notices.delete(selectedId); renderTree(); renderDetail('[data-action="edit"]');
    showNotice(selectedId, 'Agent information saved.');
  }
  async function openCreate(parentId) {
    const parent = find(parentId);
    if (parentId && (!parent || parent.level >= 3)) return;
    if (!await leaveEdit()) return;
    renderDetail(); createParentId = parentId;
    const now = new Date(), local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const values = { providerId, parentId, level: parent ? parent.level + 1 : 1, name: '', contact: '', contactInfo: '', email: '', businessModel: parent?.businessModel || currentProvider().model, authorization: 'AGT-ADMIN', cooperationStart: local, termYears: '1', country: '', state: '', city: '', mcc: [] };
    $('createTitle').textContent = parent ? 'Add Sub-agent' : 'Add Level 1 Agent';
    $('createBody').innerHTML = formMarkup('create', values);
    $('createDialog').showModal();
    createPickers = mountForm($('createForm'));
    createBaseline = JSON.stringify(formValues($('createForm')));
    $('create-name').focus();
  }
  function closeCreate() { createPickers = dispose(createPickers); $('createDialog').close(); $('createBody').replaceChildren(); }
  async function requestCloseCreate() {
    createPickers.forEach(picker => picker.close());
    if (dirty($('createForm')) && !await confirmAction('Discard new agent?', 'The new agent has not been created.', 'Discard Changes', 'Continue Editing')) return;
    closeCreate();
  }
  $('createForm').addEventListener('submit', event => {
    event.preventDefault();
    const values = validate(event.currentTarget);
    if (!values) return;
    const parent = find(createParentId);
    if (createParentId && (!parent || parent.level >= 3)) return;
    const createdAt = new Date().toLocaleString('sv-SE');
    const agent = { ...values, providerId, id: 'agent-' + crypto.randomUUID(), parentId: createParentId, level: parent ? parent.level + 1 : 1, status: 'Enable', createdAt };
    agents.push(agent); closeCreate(); selectedId = agent.id; notices.delete(agent.id);
    revealAgent(agent.id); renderDetail(); $('agentDetail').scrollIntoView({ block: 'start' }); showNotice(agent.id, 'Agent created.');
  });
  $('closeCreate').addEventListener('click', requestCloseCreate);
  $('cancelCreate').addEventListener('click', requestCloseCreate);
  $('createDialog').addEventListener('cancel', event => { event.preventDefault(); requestCloseCreate(); });
  let backdropStart = false;
  $('createDialog').addEventListener('pointerdown', event => { backdropStart = event.target === $('createDialog'); });
  $('createDialog').addEventListener('click', event => { if (backdropStart && event.target === $('createDialog')) { const r = $('createDialog').getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) requestCloseCreate(); } });
  $('addAgent').addEventListener('click', () => openCreate(''));
  $('providerToggle').addEventListener('click', () => { rootExpanded = !rootExpanded; renderTree(); });
  $('searchName').addEventListener('input', () => renderTree());
  $('agentTree').addEventListener('click', event => {
    const expander = event.target.closest('[data-expand]');
    if (expander) { const id = expander.dataset.expand; collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id); renderTree(id); return; }
    const row = event.target.closest('[data-id]');
    if (row) selectAgent(row.dataset.id);
  });
  $('agentTree').addEventListener('keydown', event => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    const rows = Array.from($('agentTree').children), index = rows.indexOf(row), id = row.dataset.id;
    let target;
    if (event.key === 'ArrowDown') target = rows[Math.min(index + 1, rows.length - 1)];
    else if (event.key === 'ArrowUp') target = rows[Math.max(index - 1, 0)];
    else if (event.key === 'Home') target = rows[0];
    else if (event.key === 'End') target = rows[rows.length - 1];
    else if (event.key === 'ArrowRight') {
      if (row.getAttribute('aria-expanded') === 'false') { collapsed.delete(id); renderTree(id); }
      else if (row.hasAttribute('aria-expanded')) target = rows[index + 1];
    } else if (event.key === 'ArrowLeft') {
      if (row.getAttribute('aria-expanded') === 'true' && !$('searchName').value.trim()) { collapsed.add(id); renderTree(id); }
      else target = rows.find(item => item.dataset.id === find(id).parentId);
    } else if (event.key === 'Enter' || event.key === ' ') selectAgent(id);
    else return;
    event.preventDefault();
    if (target) { rows.forEach(item => { item.tabIndex = -1; }); target.tabIndex = 0; target.focus(); }
  });
  $('agentDetail').addEventListener('click', async event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const agent = selected();
    if (action === 'edit') { editing = true; renderDetail('#edit-name'); }
    if (action === 'cancel-edit' && await leaveEdit()) renderDetail('[data-action="edit"]');
    if (action === 'add-child') openCreate(agent.id);
    if (action === 'toggle') {
      agent.status = agent.status === 'Enable' ? 'Disable' : 'Enable';
      renderTree(); renderDetail('[data-action="toggle"]');
      showNotice(agent.id, agent.name + (agent.status === 'Enable' ? ' enabled.' : ' disabled.'));
    }
    if (action === 'reset') {
      if (sending.has(agent.id)) return;
      const email = agent.email;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotice(agent.id, 'This agent has no valid email address. Edit and save Agent Email before sending.', true); return; }
      if (!await confirmAction('Send Password Reset Email', 'Send a password reset email for ' + agent.name + ' to:\n' + email, 'Send Email')) return;
      sending.add(agent.id); renderDetail();
      try {
        // Optional integration seam. The static default simulates delivery and makes no network request.
        const send = window.PaywizardAgentServices?.sendPasswordResetEmail || (() => Promise.resolve());
        await send({ providerId: agent.providerId, agentId: agent.id, email });
        showNotice(agent.id, 'Password reset email sent to ' + email + '.');
      } catch (error) {
        showNotice(agent.id, 'The password reset email could not be sent to ' + email + '. Please try again.', true);
      } finally {
        sending.delete(agent.id);
        if (selectedId === agent.id && !editing) { renderDetail(); const node = $('detailNotice'); if (notices.get(agent.id)?.error) focusMessage(node); else $('agentDetail').querySelector('[data-action="reset"]')?.focus(); }
      }
    }
  });
  window.addEventListener('beforeunload', event => { if ((editing && dirty($('editForm'))) || ($('createDialog').open && dirty($('createForm')))) { event.preventDefault(); event.returnValue = ''; } });
  let tooltipTarget = null;
  function hideActionTooltip() {
    const tooltip = $('agentActionTooltip');
    if (tooltip.matches(':popover-open')) tooltip.hidePopover();
    tooltipTarget?.removeAttribute('aria-describedby'); tooltipTarget = null;
  }
  function showActionTooltip(button) {
    if (!button || button.disabled) return;
    hideActionTooltip(); tooltipTarget = button;
    const tooltip = $('agentActionTooltip');
    tooltip.textContent = button.dataset.tooltip; button.setAttribute('aria-describedby', tooltip.id);
    tooltip.showPopover();
    const rect = button.getBoundingClientRect(), bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.max(8, Math.min(rect.right - bounds.width, innerWidth - bounds.width - 8)) + 'px';
    tooltip.style.top = (rect.bottom + bounds.height + 14 < innerHeight ? rect.bottom + 7 : rect.top - bounds.height - 7) + 'px';
  }
  $('agentDetail').addEventListener('mouseover', event => { const button = event.target.closest('[data-tooltip]'); if (button && button !== tooltipTarget) showActionTooltip(button); });
  $('agentDetail').addEventListener('mouseout', event => { if (tooltipTarget && !tooltipTarget.contains(event.relatedTarget)) hideActionTooltip(); });
  $('agentDetail').addEventListener('focusin', event => showActionTooltip(event.target.closest('[data-tooltip]')));
  $('agentDetail').addEventListener('focusout', hideActionTooltip);
  $('agentDetail').addEventListener('click', hideActionTooltip);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideActionTooltip(); });
  document.addEventListener('scroll', hideActionTooltip, true);
  window.addEventListener('resize', hideActionTooltip);
  mountProviderPicker(); renderTree(); renderDetail();
})();
