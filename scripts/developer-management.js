(function () {
  'use strict';
  if (window.PaywizardPortalAccess?.profile !== 'maintain') return;
  const store = window.PaywizardDeveloperStore;
  const picker = window.PaywizardPaymentChannelPicker;
  const root = document.querySelector('[data-developer-view]');
  const mode = root.dataset.developerView;
  const params = new URLSearchParams(location.search);
  const clientId = params.get('client') || '';
  const kind = params.get('kind') === 'plat' ? 'plat' : 'merchant';
  const entityId = params.get('entity') || '';
  const viewKey = `paywizard.maintain.developers.view.${mode}.${kind}.${clientId}`;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const textCell = value => `<td><span class="pc-cell-text" title="${esc(value)}">${esc(value)}</span></td>`;
  const button = (label, glyph, attrs = '', cls = '') => `<button type="button" class="pc-button ${cls}" ${attrs} aria-label="${esc(label)}" title="${esc(label)}">${icon(glyph)}</button>`;
  const link = (label, glyph, href, cls = '') => `<a class="pc-button ${cls}" href="${esc(href)}" aria-label="${esc(label)}" title="${esc(label)}">${icon(glyph)}</a>`;
  const bindingUrl = () => `50.developer_binding.html?client=${encodeURIComponent(clientId)}&kind=${kind}`;
  const url = (page, id, extra = '') => `50.developer_${page}.html?client=${encodeURIComponent(id)}${extra}`;
  let state, pagePickers = [], dialogPickers = [], busy = false, dirtyCheck = null, modalOpener = null, formDirty = () => false;
  let view = { email: '', id: '', name: '', provider: '', page: 1, size: 20, scroll: 0, horizontal: 0 };
  try { view = { ...view, ...JSON.parse(sessionStorage.getItem(viewKey) || '{}') }; } catch (_) {}
  view.size = [10, 20, 50].includes(Number(view.size)) ? Number(view.size) : 20;
  view.page = Math.max(1, Math.trunc(Number(view.page)) || 1);
  const revealed = new Set();
  const scroller = () => document.querySelector('.pw-platform-content-host');
  const account = () => state.accounts.find(a => a.id === clientId);
  function error(root, message) { root.textContent = message; root.hidden = false; root.scrollIntoView({ block: 'center', behavior: 'instant' }); root.focus({ preventScroll: true }); }
  const feedback = $('dmFeedback');
  feedback.className = 'dm-toast-stack'; feedback.setAttribute('role', 'region'); feedback.setAttribute('aria-label', 'Notifications'); document.body.append(feedback);
  const toastTimers = new Map(); let toastHovered = false, toastResumeTimer;
  function removeToast(node) {
    clearTimeout(toastTimers.get(node)); toastTimers.delete(node); node.remove(); feedback.hidden = !feedback.children.length;
  }
  function pauseToasts() { toastTimers.forEach(timer => clearTimeout(timer)); clearTimeout(toastResumeTimer); }
  function scheduleToasts() {
    if (toastHovered || feedback.contains(document.activeElement)) return;
    toastTimers.forEach((timer, node) => { clearTimeout(timer); toastTimers.set(node, setTimeout(() => removeToast(node), 3000)); });
  }
  function resumeToasts() { clearTimeout(toastResumeTimer); toastResumeTimer = setTimeout(scheduleToasts, 200); }
  feedback.addEventListener('mouseenter', () => { toastHovered = true; pauseToasts(); });
  feedback.addEventListener('mouseleave', () => { toastHovered = false; resumeToasts(); });
  feedback.addEventListener('focusin', pauseToasts); feedback.addEventListener('focusout', resumeToasts);
  function notice(message, severity = 'success') {
    const node = document.createElement('div'); node.className = 'dm-toast dm-toast-' + severity; node.setAttribute('role', 'status'); node.setAttribute('aria-atomic', 'true');
    node.innerHTML = `${icon(severity === 'success' ? 'check_circle' : 'info')}<div class="dm-toast-copy"><strong>${severity === 'success' ? 'Success' : 'Information'}</strong><p>${esc(message)}</p></div><button type="button" class="dm-toast-close" aria-label="Close notification">${icon('close')}</button>`;
    node.querySelector('button').onclick = () => removeToast(node); feedback.append(node); feedback.hidden = false;
    toastTimers.set(node, null); scheduleToasts();
  }
  function remember() {
    view.scroll = scroller()?.scrollTop || 0; view.horizontal = root.querySelector('.pc-table-scroll')?.scrollLeft || 0;
    try { sessionStorage.setItem(viewKey, JSON.stringify(view)); } catch (_) {}
  }
  const dispose = list => { list.forEach(p => p.destroy()); return []; };
  function secret(value, key, label) {
    const show = revealed.has(key);
    return `<div class="dm-secret"><code>${esc(show ? value : value.slice(0, 4) + '*'.repeat(Math.max(4, value.length - 8)) + value.slice(-4))}</code><button class="dm-eye" type="button" data-reveal="${esc(key)}" aria-label="${show ? 'Hide' : 'Show'} ${esc(label)}" aria-pressed="${show}">${icon(show ? 'visibility' : 'visibility_off')}</button></div>`;
  }
  function heading(title, back = '', object = '', add = '') {
    document.title = title + ' | PAYwizard Maintain';
    $('dmHeading').innerHTML = `<div class="dm-title-group">${back ? link('Back to ' + (mode === 'token' ? 'bindings' : 'Developer Manage'), 'arrow_back', back, 'dm-back') : ''}<div class="dm-title-copy"><h1 tabindex="-1">${esc(title)}</h1>${object ? `<span class="dm-object-name">${esc(object)}</span>` : ''}</div></div>${add}`;
  }
  function table(headers, rows, cls, widths = []) {
    return `<div class="pc-table-scroll"><table class="pc-table ${cls}" aria-label="${esc(headers.label)}">${widths.length ? '<colgroup>' + widths.map(w => `<col style="width:${w}">`).join('') + '</colgroup>' : ''}<thead><tr>${headers.map((h, i) => `<th${i === headers.length - 1 ? ' class="pc-actions-col"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="pc-empty">No ${mode === 'list' ? 'developers' : mode === 'allowlist' ? 'IP addresses' : 'bound accounts'} found.</td></tr>`}</tbody></table></div>`;
  }
  function filters(first, second = '') {
    return `<form class="pc-filters" id="dmFilters" role="search"><input id="dmSearch1" type="search" placeholder="${first}" aria-label="${first}" value="${esc(mode === 'list' ? view.email : view.id)}" autocomplete="off">${second ? `<input id="dmSearch2" type="search" placeholder="${second}" aria-label="${second}" value="${esc(view.name)}" autocomplete="off">` : ''}${button('Reset filters', 'restart_alt', 'id="dmReset"', 'pc-icon')}<button type="submit" class="pc-button pc-primary pc-icon" aria-label="Search">${icon('search')}</button></form>`;
  }
  function pagination(count) {
    const total = Math.max(1, Math.ceil(count / view.size)); view.page = Math.min(view.page, total);
    const pageButton = (p, label, glyph, disabled) => button(label, glyph, `data-page="${p}"${disabled ? ' disabled' : ''}`);
    const start = Math.max(1, Math.min(view.page - 2, total - 4));
    return `<footer class="pc-pagination" aria-label="Pagination"><span>${count} ${mode === 'list' ? 'developers' : 'accounts'}</span><nav aria-label="Pages">${pageButton(1, 'First page', 'keyboard_double_arrow_left', view.page === 1)}${pageButton(view.page - 1, 'Previous page', 'chevron_left', view.page === 1)}${Array.from({ length: Math.min(5, total) }, (_, i) => `<button type="button" class="pc-button" data-page="${start + i}" aria-label="Page ${start + i}"${start + i === view.page ? ' aria-current="page"' : ''}>${start + i}</button>`).join('')}${pageButton(view.page + 1, 'Next page', 'chevron_right', view.page === total)}${pageButton(total, 'Last page', 'keyboard_double_arrow_right', view.page === total)}</nav><div class="pc-size-picker" id="dmSize"></div><label class="pc-page-jump"><input type="number" id="dmJump" aria-label="Go to page" min="1" max="${total}" value="${view.page}"><span>/ ${total} (${count})</span></label></footer>`;
  }
  function slice(items) { view.page = Math.min(view.page, Math.max(1, Math.ceil(items.length / view.size))); return items.slice((view.page - 1) * view.size, view.page * view.size); }
  function mountList() {
    heading('Developer Manage', '', '', `<button type="button" class="pc-button pc-add" id="dmAdd">${icon('add')}Add</button>`);
    const items = state.accounts.filter(a => !view.email || a.email.toLowerCase() === view.email.trim().toLowerCase()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const rows = slice(items).map(a => `<tr data-client="${a.id}">${[a.id, a.name, a.email, a.createdAt, a.createdBy].map(textCell).join('')}<td>${secret(a.secret, 'client:' + a.id, 'Client Secret for ' + a.name)}</td><td class="pc-actions-col"><div class="pc-row-actions">${button('Edit ' + a.name, 'edit_square', `data-edit="${a.id}"`, 'pc-edit')}${button('More actions for ' + a.name, 'more_horiz', `data-more="${a.id}" aria-haspopup="menu" aria-expanded="false"`)}</div></td></tr>`).join('');
    const headers = ['CLIENT ID', 'DEVELOPER NAME', 'EMAIL', 'DATE & TIME', 'CREATED BY', 'CLIENT SECRET', 'ACTIONS']; headers.label = 'Developer accounts';
    $('dmContent').innerHTML = filters('Email') + table(headers, rows, 'dm-list-table', ['15%', '15%', '20%', '15%', '10%', '270px', '108px']) + pagination(items.length);
    $('dmAdd').onclick = () => editAccount();
    try { const message = sessionStorage.getItem('paywizard.developer.notice'); if (message) { notice(message); sessionStorage.removeItem('paywizard.developer.notice'); } } catch (_) {}
  }
  function mountBinding() {
    const a = account(), merchant = kind === 'merchant';
    heading(merchant ? 'Bind Merchant' : 'Bind Plat', '50.developer_manage.html', a.name, `<button type="button" class="pc-button pc-add" id="dmBind">${icon('note_add')}${merchant ? 'Bind Merchant' : 'Bind Plat'}</button>`);
    const items = state.bindings.filter(b => b.clientId === clientId).map(b => ({ ...store.entity(b.entityId), createdAt: b.createdAt })).filter(e => e.id && (merchant ? e.type === 'merchant' : e.type !== 'merchant') && (!view.provider || store.providerId(e) === view.provider) && (!view.id || e.id === view.id) && e.name.toLowerCase().includes(view.name.toLowerCase()));
    const allAccess = e => a.providerScopes.some(p => p.providerId === store.providerId(e) && p.allMerchants);
    const rows = slice(items).map(e => `<tr data-entity="${esc(e.id)}">${(merchant ? [e.id, store.entity(store.providerId(e)).name, e.name, allAccess(e) ? 'All merchants' : 'Selected merchants', e.createdAt] : [e.id, store.entity(store.providerId(e)).name, e.name]).map(textCell).join('')}<td class="pc-actions-col"><div class="pc-row-actions">${link('View Token for ' + e.name, 'visibility', url('token', clientId, `&kind=${kind}&entity=${encodeURIComponent(e.id)}`))}${merchant && allAccess(e) ? '' : button('Unbind ' + e.name, 'link_off', `data-unbind="${esc(e.id)}"`, 'pc-danger')}</div></td></tr>`).join('');
    const headers = merchant ? ['PAYWIZARD ID', 'SERVICE PROVIDER', 'MERCHANT NAME', 'ACCESS', 'CREATE TIME', 'ACTIONS'] : ['PLAT ID', 'SERVICE PROVIDER', 'PLAT NAME', 'ACTIONS']; headers.label = merchant ? 'Bound merchants' : 'Bound platforms';
    $('dmContent').innerHTML = filters(merchant ? 'Paywizard ID' : 'Plat ID', merchant ? 'Merchant Name' : 'Plat Name') + table(headers, rows, 'dm-binding-table') + pagination(items.length);
    $('dmBind').onclick = bindDialog;
    const providerRoot = document.createElement('div'); providerRoot.className = 'dm-provider-filter'; $('dmFilters').prepend(providerRoot);
    pagePickers.push(picker.mount(providerRoot, { label: 'Service Provider filter', options: [{ value: '', label: 'All service providers' }, ...a.providerScopes.map(p => ({ value: p.providerId, label: store.entity(p.providerId).name }))], value: view.provider, onChange(value) { view.provider = value; view.page = 1; refresh(); } }));
    if (merchant && !a.providerScopes.some(p => !p.allMerchants)) { $('dmBind').disabled = true; $('dmBind').title = 'All selected service providers already include all merchants.'; }
  }
  function mountAllowlist() {
    const a = account();
    heading('Allowlist', '50.developer_manage.html', a.name, `<button type="button" class="pc-button pc-add" id="dmAddIp">${icon('add')}Add</button>`);
    const headers = ['IP', 'ACTIONS']; headers.label = 'Developer allowlist';
    $('dmContent').innerHTML = table(headers, a.ips.map(ip => `<tr>${textCell(ip)}<td class="pc-actions-col"><div class="pc-row-actions">${button('Delete ' + ip, 'delete', `data-remove-ip="${esc(ip)}"`, 'pc-danger')}</div></td></tr>`).join(''), 'dm-ip-table', ['85%', '15%']);
    $('dmAddIp').onclick = addIpDialog;
  }
  function mountToken() {
    const a = account(), e = store.entity(entityId), merchant = kind === 'merchant';
    heading(merchant ? 'Merchant Token' : 'Platform Token', bindingUrl(), e?.name || '');
    if (!e || (merchant ? e.type !== 'merchant' : e.type === 'merchant') || !state.bindings.some(b => b.clientId === a.id && b.entityId === e.id)) throw new Error('This account is no longer bound to the developer. Return to the binding list.');
    const types = merchant ? [['ecomm', 'E-Commerce'], ['terminal', 'Terminal']] : [['platform', 'Token']];
    $('dmContent').innerHTML = `<dl class="dm-token-meta"><dt>${merchant ? 'Paywizard ID' : 'Plat ID'}</dt><dd>${esc(e.id)}</dd></dl>` + types.map(([type, name]) => `<fieldset class="dm-token-panel"><legend>${name}</legend><div class="dm-token-row"><label>Token</label>${secret(state.tokens[e.id + ':' + type], 'token:' + e.id + ':' + type, name + ' Token')}<div class="dm-token-actions"><button type="button" class="pc-button pc-danger" data-reset-token="${type}">${icon('restart_alt')}Reset</button><button type="button" class="pc-button pc-edit" data-send-token="${type}">${icon('mail')}Send</button></div></div></fieldset>`).join('');
  }
  function render() {
    pagePickers = dispose(pagePickers); closeMenu();
    state = store.read(); $('dmError').hidden = true;
    if (mode !== 'list' && !(mode === 'form' && !clientId) && !account()) { heading('Developer Manage', '50.developer_manage.html'); $('dmContent').replaceChildren(); throw new Error('This developer account is unavailable. Return to Developer Manage and select an existing account.'); }
    if (mode === 'list') mountList(); else if (mode === 'binding') mountBinding(); else if (mode === 'allowlist') mountAllowlist(); else if (mode === 'form') mountForm(); else mountToken();
    if ($('dmSize')) pagePickers.push(picker.mount($('dmSize'), { label: 'Rows per page', options: [10, 20, 50].map(value => ({ value, label: String(value) })), value: view.size, onChange(value) { view.size = Number(value); view.page = 1; refresh(); } }));
    if ($('dmFilters')) $('dmFilters').onsubmit = event => { event.preventDefault(); if (mode === 'list') view.email = $('dmSearch1').value.trim(); else { view.id = $('dmSearch1').value.trim(); view.name = $('dmSearch2').value.trim(); } view.page = 1; refresh(); };
    if ($('dmReset')) $('dmReset').onclick = () => { Object.assign(view, { email: '', id: '', name: '', provider: '', page: 1 }); refresh(); };
    if ($('dmJump')) $('dmJump').onchange = () => { view.page = Math.max(1, Math.min(Number($('dmJump').max), Math.trunc(Number($('dmJump').value)) || 1)); refresh(); };
  }
  function refresh() { try { render(); remember(); } catch (e) { $('dmContent').replaceChildren(); error($('dmError'), e.message); } }

  // Native modal dialogs keep the form, its popover pickers, and focus on the same top layer.
  const modal = document.createElement('dialog'); modal.className = 'pc-dialog dm-dialog'; modal.id = 'dmDialog'; document.body.append(modal);
  const confirm = document.createElement('dialog'); confirm.className = 'pc-dialog dm-dialog dm-confirm'; confirm.id = 'dmConfirm'; confirm.setAttribute('role', 'alertdialog'); document.body.append(confirm);
  function openModal(title, body, onSubmit, wide = false) {
    closeMenu(); dialogPickers = dispose(dialogPickers); dirtyCheck = null; modalOpener = document.activeElement;
    modal.classList.toggle('dm-bind-dialog', wide); modal.setAttribute('aria-labelledby', 'dmDialogTitle');
    modal.innerHTML = `<header><h2 id="dmDialogTitle">${esc(title)}</h2>${button('Close', 'close', 'data-dismiss', 'pc-icon')}</header><form id="dmDialogForm" novalidate><div class="pc-dialog-body"><div class="pc-error-summary" id="dmDialogError" role="alert" tabindex="-1" hidden></div>${body}</div><footer><button type="button" class="pc-button pc-secondary" data-dismiss>Cancel</button><button type="submit" class="pc-button pc-primary" id="dmSave">Confirm</button></footer></form>`;
    modal.querySelectorAll('[data-dismiss]').forEach(b => b.onclick = requestDismiss);
    $('dmDialogForm').onsubmit = event => { event.preventDefault(); if (!busy) onSubmit(); };
    modal.showModal(); modal.querySelector('.pc-dialog-body').scrollTop = 0;
  }
  function closeModal() { dirtyCheck = null; modal.close(); dialogPickers = dispose(dialogPickers); }
  async function requestDismiss() {
    if (busy || confirm.open) return;
    if (dirtyCheck?.() && !await ask('Discard unsaved changes?', 'Your changes have not been saved.', 'Discard Changes', 'Continue Editing')) return;
    closeModal();
  }
  modal.addEventListener('cancel', event => { event.preventDefault(); requestDismiss(); });
  modal.addEventListener('click', event => {
    if (event.target !== modal) return; const r = modal.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) requestDismiss();
  });
  modal.addEventListener('close', () => { if (modalOpener?.isConnected) modalOpener.focus({ preventScroll: true }); else $('dmHeading').querySelector('h1').focus({ preventScroll: true }); });
  function ask(title, message, accept = 'Confirm', cancel = 'Cancel') {
    if (confirm.open) return Promise.resolve(false);
    const opener = document.activeElement;
    confirm.setAttribute('aria-labelledby', 'dmConfirmTitle'); confirm.setAttribute('aria-describedby', 'dmConfirmMessage');
    confirm.innerHTML = `<header><h2 id="dmConfirmTitle">${esc(title)}</h2></header><div class="pc-dialog-body"><p id="dmConfirmMessage">${esc(message)}</p><div class="pc-error-summary" id="dmConfirmError" role="alert" tabindex="-1" hidden></div></div><footer><button type="button" class="pc-button pc-secondary" id="dmConfirmCancel" autofocus>${esc(cancel)}</button><button type="button" class="pc-button pc-primary" id="dmConfirmAccept">${esc(accept)}</button></footer>`;
    confirm.showModal();
    return new Promise(resolve => {
      let result = false;
      confirm.oncancel = event => { if (busy) event.preventDefault(); };
      confirm.onclose = () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); resolve(result); };
      $('dmConfirmCancel').onclick = () => { if (!busy) confirm.close(); };
      $('dmConfirmAccept').onclick = () => { result = true; confirm.close(); };
    });
  }
  async function commit(action, payload, message, dialog = modal) {
    if (busy) return; busy = true;
    const controls = dialog?.open ? [...dialog.querySelectorAll('button,input')] : [];
    const disabled = controls.map(c => c.disabled); controls.forEach(c => c.disabled = true);
    const submit = dialog?.querySelector('[type=submit]'); if (submit) { submit.setAttribute('aria-busy', 'true'); submit.textContent = 'Saving…'; }
    try {
      await new Promise(resolve => setTimeout(resolve, 120));
      state = store.mutate(action, { clientId, ...payload });
      if (action === 'reset-secret') revealed.delete('client:' + payload.clientId);
      if (action === 'reset-token') revealed.delete('token:' + payload.entityId + ':' + payload.tokenType);
      if (dialog === modal && modal.open) closeModal();
      refresh(); notice(message);
    } catch (e) {
      if (e.fields && modal.open) applyErrors(e.fields);
      error(dialog?.open ? $('dmDialogError') : $('dmError'), e.message);
    } finally {
      busy = false; controls.forEach((c, i) => c.disabled = disabled[i]);
      if (submit) { submit.removeAttribute('aria-busy'); submit.textContent = 'Confirm'; }
    }
  }
  function applyErrors(errors) {
    modal.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
    modal.querySelectorAll('.dm-field-error').forEach(e => { e.textContent = ''; e.hidden = true; });
    Object.entries(errors).forEach(([name, message]) => {
      const control = $('dmField-' + name); control?.setAttribute('aria-invalid', 'true');
      const fieldError = $('dmFieldError-' + name); if (fieldError) { fieldError.textContent = message; fieldError.hidden = false; }
    });
  }
  function field(name, label, value, options = {}) {
    return `<div class="dm-field${options.wide ? ' dm-wide' : ''}" id="dmFieldWrap-${name}"><label for="dmField-${name}">${esc(label)}${options.required ? '<span class="pc-required">*</span>' : ''}</label>${options.picker ? `<div id="dmPicker-${name}"></div>` : `<input id="dmField-${name}" name="${name}" value="${esc(value)}"${options.readonly ? ' readonly' : ''}${options.required ? ' aria-required="true"' : ''}${name === 'email' ? ' type="email" maxlength="180"' : ''} aria-describedby="dmFieldError-${name}">`}<p class="dm-field-error" id="dmFieldError-${name}" hidden></p></div>`;
  }
  function editAccount(id) {
    remember(); location.href = id ? url('form', id) : '50.developer_form.html';
  }
  function switchField(name, label, checked) {
    return `<label class="dm-toggle" for="dmField-${name}"><span>${esc(label)}</span><span class="dm-switch"><input type="checkbox" role="switch" id="dmField-${name}"${checked ? ' checked' : ''}><span aria-hidden="true"></span></span></label>`;
  }
  function mountForm() {
    const a = account();
    const draft = a ? structuredClone(a) : { name: '', email: '', company: '', phone: '', address: '', providerScopes: [], notifyUrl: '', settleUrl: '', notifyEnabled: false, settleEnabled: false, verify: true, ips: [], terminalAuto: false, ecommAuto: false };
    const originalScopes = JSON.stringify(a?.providerScopes || []);
    heading(a ? 'Edit Developer' : 'Add Developer', '50.developer_manage.html', a?.name || '');
    $('dmContent').innerHTML = `<div class="pc-form-panel"><form id="dmAccountForm" novalidate>
      <section class="dm-form-section" aria-labelledby="dmBasicTitle"><h2 id="dmBasicTitle">Basic Information</h2><div class="dm-form-grid">${field('name', 'Developer Name', draft.name, { required: true, readonly: !!a })}${field('email', 'Email', draft.email, { required: true, readonly: !!a })}${field('company', 'Company Name', draft.company)}${field('phone', 'Phone Number', draft.phone)}${field('address', 'Address', draft.address, { wide: true })}</div></section>
      <section class="dm-form-section" aria-labelledby="dmWebhookTitle"><h2 id="dmWebhookTitle">Webhooks</h2><div class="dm-settings-rows"><div class="dm-settings-row">${switchField('notifyEnabled', 'Transaction results', draft.notifyEnabled)}${field('notifyUrl', 'Callback URL', draft.notifyUrl, { required: true })}</div><div class="dm-settings-row">${switchField('settleEnabled', 'Automatic settlements', draft.settleEnabled)}${field('settleUrl', 'Callback URL', draft.settleUrl, { required: true })}</div></div></section>
      <section class="dm-form-section" aria-labelledby="dmIpTitle"><h2 id="dmIpTitle">IP Allowlist</h2><div class="dm-settings-row">${switchField('verify', 'Verify request IP', draft.verify)}<div class="dm-field pc-field" id="dmFieldWrap-ips"><label for="dmField-ips">IP Addresses<span class="pc-required">*</span></label><div class="dm-ip-editor" id="dmIpEditor"><div id="dmIpChips" class="dm-ip-chips"></div><input id="dmField-ips" name="ips" aria-label="Add IP address" aria-describedby="dmFieldError-ips" placeholder="Add IP address" autocomplete="off" spellcheck="false"></div><p class="dm-field-error" id="dmFieldError-ips" hidden></p></div></div></section>
      <section class="dm-form-section" aria-labelledby="dmMailTitle"><h2 id="dmMailTitle">New Merchant Token Emails</h2><div class="dm-email-options">${['terminalAuto', 'ecommAuto'].map(name => `<label class="dm-email-choice"><input type="checkbox" id="dmField-${name}"${draft[name] ? ' checked' : ''}><span>${name === 'terminalAuto' ? 'Terminal token' : 'ECOMM token'}</span></label>`).join('')}</div></section>
      <section class="dm-form-section dm-provider-section" aria-labelledby="dmProvidersTitle"><div class="dm-section-heading"><h2 id="dmProvidersTitle">Service Providers<span class="pc-required">*</span></h2><button type="button" class="pc-button pc-add" id="dmAddProviders" aria-label="Add Service Providers">${icon('add')}Add</button></div><div id="dmField-providerScopes" tabindex="-1" aria-describedby="dmFieldError-providerScopes"><div class="pc-table-scroll"><table class="pc-table dm-provider-table" aria-label="Bound service providers"><thead><tr><th>SERVICE PROVIDER</th><th>ALL MERCHANTS (EXISTING &amp; NEW)</th><th>AUTHORIZED MERCHANTS</th><th class="pc-actions-col">ACTIONS</th></tr></thead><tbody id="dmProviderRows"></tbody></table></div></div><p class="dm-field-error" id="dmFieldError-providerScopes" hidden></p></section>
      <footer class="pc-form-actions"><a href="50.developer_manage.html" class="pc-button pc-secondary" id="dmCancelForm">Cancel</a><button class="pc-button pc-primary" type="submit" id="dmSubmitAccount">${a ? 'Save Changes' : 'Create Developer'}</button></footer>
    </form></div>`;
    // Reuse Payment Channel's underlined field styling without changing the IP dialog.
    $('dmAccountForm').querySelectorAll('.dm-field').forEach(e => e.classList.add('pc-field'));
    const errorBox = $('dmError');
    const providerPolicies = new Map(draft.providerScopes.map(p => [p.providerId, p]));
    $('dmAddProviders').onclick = () => providerDialog(draft.providerScopes.map(p => p.providerId), ids => {
      ids.forEach(id => {
        if (!providerPolicies.has(id)) providerPolicies.set(id, { providerId: id, allMerchants: true });
        draft.providerScopes.push(providerPolicies.get(id));
      });
      paintProviders(); clearFormError('providerScopes');
    });
    function merchantCount(p) {
      return p.allMerchants ? store.scope(p.providerId).filter(e => e.type === 'merchant').length : state.bindings.filter(b => b.clientId === clientId && store.entity(b.entityId)?.type === 'merchant' && store.providerId(store.entity(b.entityId)) === p.providerId).length;
    }
    function paintProviders() {
      $('dmProviderRows').innerHTML = draft.providerScopes.map(p => `<tr data-provider="${esc(p.providerId)}">${textCell(store.entity(p.providerId).name)}<td><input type="checkbox" data-all-merchants="${esc(p.providerId)}" aria-label="All merchants for ${esc(store.entity(p.providerId).name)}"${p.allMerchants ? ' checked' : ''}></td><td>${merchantCount(p)}${p.allMerchants ? ' · All merchants' : ' · Selected merchants'}</td><td class="pc-actions-col"><div class="pc-row-actions">${button('Remove ' + store.entity(p.providerId).name, 'delete', `data-remove-provider="${esc(p.providerId)}"`, 'pc-danger')}</div></td></tr>`).join('') || '<tr><td colspan="4" class="pc-empty">No service providers selected.</td></tr>';
    }
    $('dmProviderRows').onchange = event => {
      const control = event.target.closest('[data-all-merchants]'); if (!control) return;
      draft.providerScopes.find(p => p.providerId === control.dataset.allMerchants).allMerchants = control.checked; paintProviders();
      $('dmProviderRows').querySelector(`[data-all-merchants="${CSS.escape(control.dataset.allMerchants)}"]`)?.focus({ preventScroll: true });
    };
    $('dmProviderRows').onclick = event => {
      const remove = event.target.closest('[data-remove-provider]'); if (!remove) return;
      draft.providerScopes = draft.providerScopes.filter(p => p.providerId !== remove.dataset.removeProvider); paintProviders(); clearFormError('providerScopes'); $('dmAddProviders').focus({ preventScroll: true });
    };
    const flags = ['notifyEnabled', 'settleEnabled', 'verify', 'terminalAuto', 'ecommAuto'];
    function visibility() {
      [['notifyEnabled', 'notifyUrl'], ['settleEnabled', 'settleUrl'], ['verify', 'ips']].forEach(([flag, name]) => {
        const enabled = $('dmField-' + flag).checked;
        $('dmField-' + name).disabled = !enabled;
        $('dmField-' + name).setAttribute('aria-required', String(enabled));
        $('dmFieldWrap-' + name).classList.toggle('dm-disabled-field', !enabled);
        $('dmFieldWrap-' + name).querySelector('.pc-required').hidden = !enabled;
      });
      $('dmIpEditor').setAttribute('aria-disabled', String(!$('dmField-verify').checked));
      $('dmIpChips').querySelectorAll('button').forEach(b => b.disabled = !$('dmField-verify').checked);
    }
    function paintIps() {
      $('dmIpChips').innerHTML = draft.ips.map(ip => `<span class="dm-ip-chip">${esc(ip)}<button type="button" data-remove-draft-ip="${esc(ip)}" aria-label="Remove IP ${esc(ip)}">${icon('close')}</button></span>`).join('');
      visibility();
    }
    function acceptIps() {
      const raw = $('dmField-ips').value.trim(); if (!raw) return true;
      try { draft.ips = store.validIps([...draft.ips, ...raw.split(/[\s,;]+/).filter(Boolean)]); }
      catch (e) {
        $('dmField-ips').setAttribute('aria-invalid', 'true'); $('dmFieldError-ips').textContent = e.message; $('dmFieldError-ips').hidden = false; return false;
      }
      $('dmField-ips').value = ''; clearFormError('ips'); paintIps(); return true;
    }
    flags.forEach(name => $('dmField-' + name).onchange = () => { visibility(); if (!$('dmField-notifyEnabled').checked) clearFormError('notifyUrl'); if (!$('dmField-settleEnabled').checked) clearFormError('settleUrl'); if (!$('dmField-verify').checked) clearFormError('ips'); });
    function clearFormError(name) {
      $('dmField-' + name)?.removeAttribute('aria-invalid');
      const message = $('dmFieldError-' + name); if (message) message.hidden = true;
      if (!$('dmAccountForm').querySelector('.dm-field-error:not([hidden])')) errorBox.hidden = true;
    }
    $('dmAccountForm').querySelectorAll('.dm-field input').forEach(control => control.addEventListener('input', () => clearFormError(control.name)));
    $('dmField-ips').addEventListener('input', () => { if (/[\s,;]/.test($('dmField-ips').value)) acceptIps(); });
    $('dmField-ips').addEventListener('blur', acceptIps);
    $('dmField-ips').addEventListener('keydown', event => {
      if (['Enter', ','].includes(event.key)) { event.preventDefault(); acceptIps(); }
      else if (event.key === 'Backspace' && !$('dmField-ips').value && draft.ips.length) { draft.ips.pop(); paintIps(); }
    });
    $('dmIpChips').onclick = event => {
      const remove = event.target.closest('[data-remove-draft-ip]'); if (!remove || remove.disabled) return;
      draft.ips = draft.ips.filter(ip => ip !== remove.dataset.removeDraftIp); paintIps(); clearFormError('ips'); $('dmField-ips').focus({ preventScroll: true });
    };
    function values() {
      const value = { ...draft, providerScopes: structuredClone(draft.providerScopes) };
      ['name', 'email', 'company', 'phone', 'address', 'notifyUrl', 'settleUrl'].forEach(name => value[name] = $('dmField-' + name).value.trim());
      flags.forEach(name => value[name] = $('dmField-' + name).checked);
      value.ips = [...draft.ips, ...$('dmField-ips').value.trim().split(/[\s,;]+/).filter(Boolean)];
      return value;
    }
    const baseline = JSON.stringify(values()); formDirty = () => JSON.stringify(values()) !== baseline;
    function formErrors(errors) {
      $('dmAccountForm').querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
      $('dmAccountForm').querySelectorAll('.dm-field-error').forEach(e => { e.hidden = true; });
      Object.entries(errors).forEach(([name, message]) => { $('dmField-' + name)?.setAttribute('aria-invalid', 'true'); const target = $('dmFieldError-' + name); if (target) { target.textContent = message; target.hidden = false; } });
    }
    $('dmAccountForm').onsubmit = async event => {
      event.preventDefault(); if (busy) return;
      acceptIps(); const input = values(); let latest;
      try { latest = store.read(); } catch (e) { return error(errorBox, e.message); }
      const errors = store.validate(input, latest, a); formErrors(errors);
      if (Object.keys(errors).length) return error(errorBox, Object.values(errors)[0]);
      const current = latest.accounts.find(item => item.id === clientId);
      if (a && (!current || JSON.stringify(current.providerScopes) !== originalScopes)) return error(errorBox, 'Service provider access changed in another window. Copy your entries and reload before saving.');
      const removed = a ? a.providerScopes.filter(p => !input.providerScopes.some(next => next.providerId === p.providerId)) : [];
      if (removed.length) {
        const ids = new Set(removed.map(p => p.providerId));
        const count = latest.bindings.filter(b => b.clientId === clientId && store.entity(b.entityId)?.type === 'merchant' && ids.has(store.providerId(store.entity(b.entityId)))).length;
        if (!await ask('Remove Service Provider Access', `Remove ${removed.map(p => store.entity(p.providerId).name).join(', ')}? This revokes access to ${count} merchants and the related service provider / agent services. Future callbacks and automatic token emails for these merchants will stop. Shared Tokens and other developers are unaffected.`, 'Save Changes')) return;
      }
      busy = true; const submit = $('dmSubmitAccount'); submit.disabled = true; submit.setAttribute('aria-busy', 'true');
      try {
        store.mutate(a ? 'update' : 'create', { clientId, input }); formDirty = () => false;
        const message = `${a ? 'Developer updated.' : 'Developer created. Credential email simulated; no email was sent.'}${input.providerScopes.some(p => !p.allMerchants) ? ' Manage selected merchants in Bind Merchant.' : ''}`;
        try { sessionStorage.setItem('paywizard.developer.notice', message); } catch (_) {}
        location.href = '50.developer_manage.html';
      } catch (e) { if (e.fields) formErrors(e.fields); error(errorBox, e.message); }
      finally { busy = false; submit.disabled = false; submit.removeAttribute('aria-busy'); }
    };
    paintProviders(); paintIps();
  }
  function providerDialog(existingIds, onAdd) {
    const added = new Set(existingIds), selected = new Set();
    let filterId = '', filterName = '', page = 1, size = 20;
    const eligible = p => p.enabled && !added.has(p.id);
    const matches = () => store.providers.filter(p => (!filterId || p.id.toLowerCase().includes(filterId)) && p.name.toLowerCase().includes(filterName));
    const body = `<div class="pc-filters"><input type="search" id="dmProviderSearchId" placeholder="Provider ID" aria-label="Provider ID"><input type="search" id="dmProviderSearchName" placeholder="SP Name" aria-label="SP Name">${button('Reset service provider filters', 'restart_alt', 'id="dmProviderReset"', 'pc-icon')}${button('Search service providers', 'search', 'id="dmProviderSearch"', 'pc-primary pc-icon')}</div><div class="dm-catalog-count" id="dmProviderCount"></div><div class="pc-table-scroll dm-candidate-scroll"><table class="pc-table dm-candidate-table" aria-label="Available service providers"><colgroup><col style="width:40px"><col style="width:28%"><col><col style="width:110px"></colgroup><thead><tr><th><input type="checkbox" id="dmProviderSelectAll" aria-label="Select all available service providers"></th><th>PROVIDER ID</th><th>SP NAME</th><th>MERCHANTS</th></tr></thead><tbody id="dmProviderCandidates"></tbody></table></div><div class="pc-pagination"><span id="dmProviderPageCount"></span><nav id="dmProviderPages" aria-label="Service provider pages"></nav><div id="dmProviderSize" class="pc-size-picker"></div></div>`;
    openModal('Add Service Providers', body, () => {
      if (!selected.size) return error($('dmDialogError'), 'Select at least one service provider to add.');
      const ids = [...selected];
      if (ids.some(id => !store.providers.some(p => p.id === id && eligible(p)))) return error($('dmDialogError'), 'Some service providers are no longer available. Update your selection.');
      onAdd(ids); closeModal();
    }, true);
    $('dmSave').textContent = 'Add Selected';
    function paint() {
      const items = matches(), pages = Math.max(1, Math.ceil(items.length / size)); page = Math.min(page, pages);
      $('dmProviderCandidates').innerHTML = items.slice((page - 1) * size, page * size).map(p => {
        const status = added.has(p.id) ? 'Added' : !p.enabled ? 'Inactive' : '';
        return `<tr${!eligible(p) ? ' class="dm-bound"' : ''}><td><input type="checkbox" data-provider-candidate="${esc(p.id)}" aria-label="Select service provider ${esc(p.name)}"${!eligible(p) ? ' disabled' : ''}${selected.has(p.id) || added.has(p.id) ? ' checked' : ''}></td>${textCell(p.id)}<td><div class="dm-provider-name"><span class="pc-cell-text" title="${esc(p.name)}">${esc(p.name)}</span>${status ? `<span class="dm-added-tag">${status}</span>` : ''}</div></td>${textCell(p.merchantCount ?? store.scope(p.id).filter(e => e.type === 'merchant').length)}</tr>`;
      }).join('') || '<tr><td colspan="4" class="pc-empty">No service providers found.</td></tr>';
      const available = items.filter(eligible), count = available.filter(p => selected.has(p.id)).length;
      $('dmProviderSelectAll').disabled = !available.length; $('dmProviderSelectAll').checked = available.length > 0 && count === available.length; $('dmProviderSelectAll').indeterminate = count > 0 && count < available.length;
      $('dmProviderCount').textContent = `${items.length} service providers · ${available.length} available`;
      $('dmProviderPageCount').textContent = `Page ${page} of ${pages}`;
      $('dmProviderPages').innerHTML = button('First service provider page', 'keyboard_double_arrow_left', `data-provider-page="1"${page === 1 ? ' disabled' : ''}`) + button('Previous service provider page', 'chevron_left', `data-provider-page="${page - 1}"${page === 1 ? ' disabled' : ''}`) + button('Next service provider page', 'chevron_right', `data-provider-page="${page + 1}"${page === pages ? ' disabled' : ''}`) + button('Last service provider page', 'keyboard_double_arrow_right', `data-provider-page="${pages}"${page === pages ? ' disabled' : ''}`);
    }
    dialogPickers.push(picker.mount($('dmProviderSize'), { label: 'Service providers per page', options: [10, 20, 50].map(value => ({ value, label: String(value) })), value: size, appendTo: modal, onChange(value) { size = Number(value); page = 1; paint(); } }));
    $('dmProviderPages').onclick = event => { const b = event.target.closest('[data-provider-page]'); if (b) { page = Number(b.dataset.providerPage); paint(); } };
    const search = () => { filterId = $('dmProviderSearchId').value.trim().toLowerCase(); filterName = $('dmProviderSearchName').value.trim().toLowerCase(); page = 1; paint(); };
    $('dmProviderSearch').onclick = search;
    ['dmProviderSearchId', 'dmProviderSearchName'].forEach(id => $(id).onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); search(); } });
    $('dmProviderReset').onclick = () => { $('dmProviderSearchId').value = ''; $('dmProviderSearchName').value = ''; search(); };
    $('dmProviderCandidates').onchange = event => {
      const control = event.target.closest('[data-provider-candidate]'); if (!control || control.disabled) return;
      control.checked ? selected.add(control.dataset.providerCandidate) : selected.delete(control.dataset.providerCandidate); paint();
      $('dmProviderCandidates').querySelector(`[data-provider-candidate="${CSS.escape(control.dataset.providerCandidate)}"]`)?.focus({ preventScroll: true });
    };
    $('dmProviderSelectAll').onchange = () => { const checked = $('dmProviderSelectAll').checked; matches().filter(eligible).forEach(p => checked ? selected.add(p.id) : selected.delete(p.id)); paint(); $('dmProviderSelectAll').focus(); };
    dirtyCheck = () => selected.size > 0; paint();
  }
  function addIpDialog() {
    openModal('Add IP', field('ip', 'IP', '', { required: true, wide: true }), () => {
      const ip = $('dmField-ip').value.trim();
      try { store.validIps([...store.read().accounts.find(a => a.id === clientId).ips, ip]); }
      catch (e) { applyErrors({ ip: e.message }); return error($('dmDialogError'), e.message); }
      commit('add-ip', { ip }, 'IP address added.');
    });
    dirtyCheck = () => !!$('dmField-ip').value; $('dmField-ip').focus();
  }
  function bindDialog() {
    const a = account(), merchant = kind === 'merchant';
    const selected = new Set(); let onlySelected = false, filterProvider = '', filterId = '', filterName = '', candidatePage = 1, candidateSize = 20;
    const allowed = () => a.providerScopes.flatMap(p => store.scope(p.providerId)).filter(e => merchant ? e.type === 'merchant' : e.type !== 'merchant');
    const automatic = id => merchant && a.providerScopes.some(p => p.providerId === store.providerId(store.entity(id)) && p.allMerchants);
    const bound = id => state.bindings.some(b => b.clientId === clientId && b.entityId === id);
    const matches = () => allowed().filter(e => (merchant || !onlySelected || selected.has(e.id)) && (!filterProvider || store.providerId(e) === filterProvider) && (!filterId || e.id === filterId) && e.name.toLowerCase().includes(filterName.toLowerCase()));
    const body = `<div class="pc-filters"><div class="dm-provider-filter" id="dmCandidateProvider"></div><input id="dmCandidateId" type="search" aria-label="${merchant ? 'Candidate Paywizard ID' : 'Candidate Plat ID'}" placeholder="${merchant ? 'Paywizard ID' : 'Plat ID'}"><input id="dmCandidateName" type="search" aria-label="Candidate Name" placeholder="${merchant ? 'Merchant Name' : 'Plat Name'}">${button('Reset candidate filters', 'restart_alt', 'id="dmCandidateReset"', 'pc-icon')}${button('Search candidates', 'search', 'id="dmCandidateSearch"', 'pc-primary pc-icon')}</div>${merchant ? '<div class="dm-catalog-count" id="dmCandidateCount"></div>' : '<div class="dm-selection-tools"><button type="button" class="pc-button" id="dmSelectedOnly" aria-pressed="false">Selected (0)</button><button type="button" class="pc-button" id="dmClearSelected">Clear selection</button><span class="dm-binding-summary" id="dmCandidateCount"></span></div><div class="dm-selected-chips" id="dmSelectedChips"></div>'}<div class="pc-table-scroll dm-candidate-scroll"><table class="pc-table dm-candidate-table" aria-label="${merchant ? 'Available merchants' : 'Available platforms'}"><colgroup><col style="width:38px"><col style="width:18%"><col style="width:20%"><col${merchant ? '' : ' style="width:20%"'}>${merchant ? '' : '<col>'}</colgroup><thead><tr><th>${merchant ? '<input type="checkbox" id="dmSelectAll" aria-label="Select all available results">' : ''}</th><th>${merchant ? 'PAYWIZARD ID' : 'PLAT ID'}</th><th>SERVICE PROVIDER</th><th>${merchant ? 'MERCHANT NAME' : 'PLAT NAME'}</th>${merchant ? '' : '<th>BINDING</th>'}</tr></thead><tbody id="dmCandidates"></tbody></table></div><div class="pc-pagination" aria-label="Candidate pagination"><span id="dmCandidatePageCount"></span><nav id="dmCandidatePages" aria-label="Candidate pages"></nav><div id="dmCandidateSize" class="pc-size-picker"></div></div>`;
    openModal(merchant ? 'Bind Merchant' : 'Bind Plat', body, () => {
      if (!selected.size) return error($('dmDialogError'), merchant ? 'Select at least one merchant to bind.' : 'Select a platform to bind.');
      commit('bind', { ids: [...selected] }, `${selected.size} ${merchant ? 'merchant' : 'platform'} account${selected.size > 1 ? 's' : ''} bound.`);
    }, true);
    function paint() {
      const items = matches();
      const pages = Math.max(1, Math.ceil(items.length / candidateSize)); candidatePage = Math.min(candidatePage, pages);
      $('dmCandidates').innerHTML = items.slice((candidatePage - 1) * candidateSize, candidatePage * candidateSize).map(e => {
        const here = bound(e.id), locked = here || automatic(e.id), other = state.bindings.filter(b => b.entityId === e.id && b.clientId !== clientId).map(b => state.accounts.find(a => a.id === b.clientId)?.name).filter(Boolean);
        const binding = automatic(e.id) ? 'All merchants · ' + a.name : here ? 'Already bound to ' + a.name : other.length ? `Available · ${other.length} developers: ${other.join(', ')}` : 'Available · No developers bound';
        return `<tr${locked ? ' class="dm-bound"' : ''}${merchant && locked ? ` title="${esc(binding)}"` : ''}><td><input type="${merchant ? 'checkbox' : 'radio'}" name="candidate" data-candidate="${esc(e.id)}" aria-label="Select ${esc(e.name)}"${locked ? ' disabled' : ''}${selected.has(e.id) || (merchant && locked) ? ' checked' : ''}></td>${textCell(e.id)}${textCell(store.entity(store.providerId(e)).name)}${textCell(e.name)}${merchant ? '' : `<td class="dm-binding-info" title="${esc(binding)}"><span class="dm-binding-copy">${esc(binding)}</span></td>`}</tr>`;
      }).join('') || `<tr><td colspan="${merchant ? 4 : 5}" class="pc-empty">${onlySelected ? 'No selected accounts match.' : 'No accounts found.'}</td></tr>`;
      if (!merchant) {
        $('dmSelectedOnly').textContent = `Selected (${selected.size})`; $('dmSelectedOnly').setAttribute('aria-pressed', String(onlySelected));
        $('dmSelectedChips').innerHTML = [...selected].map(id => `<span class="dm-chip">${esc(store.entity(id).name)}<button type="button" data-remove-selected="${esc(id)}" aria-label="Remove ${esc(store.entity(id).name)}">${icon('close')}</button></span>`).join('');
      }
      $('dmCandidateCount').textContent = `${items.length} accounts · ${items.filter(e => !bound(e.id) && !automatic(e.id)).length} available`;
      $('dmCandidatePageCount').textContent = `Page ${candidatePage} of ${pages}`;
      $('dmCandidatePages').innerHTML = button('First candidate page', 'keyboard_double_arrow_left', `data-candidate-page="1"${candidatePage === 1 ? ' disabled' : ''}`) + button('Previous candidate page', 'chevron_left', `data-candidate-page="${candidatePage - 1}"${candidatePage === 1 ? ' disabled' : ''}`) + button('Next candidate page', 'chevron_right', `data-candidate-page="${candidatePage + 1}"${candidatePage === pages ? ' disabled' : ''}`) + button('Last candidate page', 'keyboard_double_arrow_right', `data-candidate-page="${pages}"${candidatePage === pages ? ' disabled' : ''}`);
      if (merchant) {
        const available = items.filter(e => !bound(e.id) && !automatic(e.id)); const count = available.filter(e => selected.has(e.id)).length;
        $('dmSelectAll').disabled = !available.length; $('dmSelectAll').checked = available.length > 0 && count === available.length; $('dmSelectAll').indeterminate = count > 0 && count < available.length;
      }
    }
    const candidateProvider = picker.mount($('dmCandidateProvider'), { label: 'Candidate Service Provider', options: [{ value: '', label: 'All service providers' }, ...a.providerScopes.map(p => ({ value: p.providerId, label: store.entity(p.providerId).name, description: merchant ? p.allMerchants ? 'All merchants · managed automatically' : 'Selected merchants' : '' }))], value: '', appendTo: modal, onChange(value) { filterProvider = value; candidatePage = 1; paint(); } }); dialogPickers.push(candidateProvider);
    dialogPickers.push(picker.mount($('dmCandidateSize'), { label: 'Candidate rows per page', options: [10, 20, 50].map(value => ({ value, label: String(value) })), value: candidateSize, appendTo: modal, onChange(value) { candidateSize = Number(value); candidatePage = 1; paint(); } }));
    $('dmCandidatePages').onclick = event => { const b = event.target.closest('[data-candidate-page]'); if (b) { candidatePage = Number(b.dataset.candidatePage); paint(); } };
    const search = () => { filterId = $('dmCandidateId').value.trim(); filterName = $('dmCandidateName').value.trim(); candidatePage = 1; paint(); };
    $('dmCandidateSearch').onclick = search;
    ['dmCandidateId', 'dmCandidateName'].forEach(id => $(id).onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); search(); } });
    $('dmCandidateReset').onclick = () => { filterProvider = ''; candidateProvider.setValue(''); $('dmCandidateId').value = ''; $('dmCandidateName').value = ''; search(); };
    if (!merchant) {
      $('dmSelectedOnly').onclick = () => { onlySelected = !onlySelected; candidatePage = 1; paint(); };
      $('dmClearSelected').onclick = () => { selected.clear(); paint(); };
    }
    $('dmCandidates').onchange = event => {
      const control = event.target.closest('[data-candidate]'); if (!control || control.disabled) return;
      const id = control.dataset.candidate;
      if (!merchant) selected.clear(); if (control.checked) selected.add(id); else selected.delete(id); paint();
      $('dmCandidates').querySelector(`[data-candidate="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    };
    if (!merchant) $('dmSelectedChips').onclick = event => { const remove = event.target.closest('[data-remove-selected]'); if (remove) { selected.delete(remove.dataset.removeSelected); paint(); $('dmSelectedOnly').focus(); } };
    if (merchant) $('dmSelectAll').onchange = () => { const checked = $('dmSelectAll').checked; matches().filter(e => !bound(e.id) && !automatic(e.id)).forEach(e => checked ? selected.add(e.id) : selected.delete(e.id)); paint(); $('dmSelectAll').focus(); };
    dirtyCheck = () => selected.size > 0; paint();
  }

  const menu = document.createElement('div'); menu.className = 'dm-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('popover', 'auto'); menu.setAttribute('aria-label', 'Developer actions'); document.body.append(menu);
  let menuTrigger = null;
  function closeMenu(focus = false) { if (!menu) return; if (menu.matches(':popover-open')) menu.hidePopover(); menuTrigger?.setAttribute('aria-expanded', 'false'); if (focus && menuTrigger?.isConnected) menuTrigger.focus(); }
  function openMenu(id, trigger) {
    if (menu.matches(':popover-open') && menuTrigger === trigger) return closeMenu(true);
    closeMenu(); menuTrigger = trigger;
    const a = state.accounts.find(a => a.id === id);
    menu.innerHTML = `<button type="button" role="menuitem" data-resend="${id}">${icon('forward_to_inbox')}Resend Email</button><button type="button" role="menuitem" data-reset-secret="${id}">${icon('key')}Reset Secret</button><a role="menuitem" href="${url('binding', id, '&kind=merchant')}">${icon('storefront')}Bind Merchant</a><a role="menuitem" href="${url('binding', id, '&kind=plat')}">${icon('account_tree')}Bind Plat</a><a role="menuitem" href="${url('allowlist', id)}">${icon('verified_user')}Allowlist</a>`;
    menu.setAttribute('aria-label', 'Actions for ' + a.name); menu.showPopover(); trigger.setAttribute('aria-expanded', 'true');
    const r = trigger.getBoundingClientRect(); menu.style.left = Math.max(10, Math.min(innerWidth - menu.offsetWidth - 10, r.right - menu.offsetWidth)) + 'px';
    menu.style.top = Math.max(10, Math.min(innerHeight - menu.offsetHeight - 10, r.bottom + 6)) + 'px'; menu.querySelector('[role=menuitem]').focus();
  }
  menu.addEventListener('toggle', () => { if (!menu.matches(':popover-open')) menuTrigger?.setAttribute('aria-expanded', 'false'); });
  menu.addEventListener('keydown', event => {
    const items = [...menu.querySelectorAll('[role=menuitem]')];
    if (event.key === 'Escape' || event.key === 'Tab') { if (event.key === 'Escape') event.preventDefault(); closeMenu(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const i = items.indexOf(document.activeElement); items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  });
  document.addEventListener('click', async event => {
    const navigation = event.target.closest('a[href]');
    if (mode === 'form' && navigation && !navigation.hash && formDirty()) {
      event.preventDefault(); if (busy || !await ask('Discard unsaved changes?', 'Your changes have not been saved.', 'Discard Changes', 'Continue Editing')) return;
      formDirty = () => false; location.href = navigation.href; return;
    }
    const b = event.target.closest('button');
    if (event.target.closest('a[href]') && root.contains(event.target.closest('a'))) remember();
    if (event.target.closest('.dm-menu a')) { remember(); closeMenu(); }
    if (!b || busy) return;
    if (b.dataset.page) { view.page = Number(b.dataset.page); refresh(); }
    if (b.dataset.edit) editAccount(b.dataset.edit);
    if (b.dataset.more) openMenu(b.dataset.more, b);
    if (b.dataset.reveal) {
      const key = b.dataset.reveal; revealed.has(key) ? revealed.delete(key) : revealed.add(key);
      const value = key.startsWith('client:') ? state.accounts.find(a => a.id === key.slice(7)).secret : state.tokens[key.slice(6)];
      const label = b.getAttribute('aria-label').replace(/^(Show|Hide) /, ''); b.parentElement.outerHTML = secret(value, key, label);
      root.querySelector(`[data-reveal="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
    }
    if (b.dataset.resend || b.dataset.resetSecret) {
      const id = b.dataset.resend || b.dataset.resetSecret, a = state.accounts.find(a => a.id === id), reset = !!b.dataset.resetSecret;
      closeMenu(true);
      if (await ask(reset ? 'Reset Client Secret' : 'Resend Email', reset ? `Replace the Client Secret for ${a.name}? The previous secret will stop working. A new credential email to ${a.email} will be simulated.` : `Resend the current Client ID and Client Secret to ${a.email}? Email delivery will be simulated.`)) {
        await commit(reset ? 'reset-secret' : 'resend', { clientId: id }, reset ? `Client Secret reset. Credential email to ${a.email} simulated; no email was sent.` : `Credential email to ${a.email} simulated; no email was sent.`, null);
      }
    }
    if (b.dataset.unbind) {
      const id = b.dataset.unbind;
      if (await ask('Unbind Account', `Unbind ${store.entity(id).name} from ${account().name}? Other developer bindings and the shared Token will be kept.`, 'Unbind')) await commit('unbind', { entityId: id }, 'Account unbound.', null);
    }
    if (b.dataset.removeIp) {
      if (account().verify && account().ips.length <= 1) return error($('dmError'), 'Keep at least one IP address. First turn off Verify Allowlist in Edit Developer to remove the last address.');
      if (await ask('Delete IP', `Delete ${b.dataset.removeIp} from this developer’s allowlist?`, 'Delete')) await commit('remove-ip', { ip: b.dataset.removeIp }, 'IP address deleted.', null);
    }
    if (b.dataset.resetToken || b.dataset.sendToken) {
      const tokenType = b.dataset.resetToken || b.dataset.sendToken, reset = !!b.dataset.resetToken;
      const names = [...new Set(state.bindings.filter(binding => binding.entityId === entityId).map(binding => state.accounts.find(a => a.id === binding.clientId)?.name).filter(Boolean))];
      const msg = reset ? `Reset the ${tokenType === 'ecomm' ? 'E-Commerce' : tokenType === 'terminal' ? 'Terminal' : 'platform'} Token for ${store.entity(entityId).name}? This Token is shared by ${names.length} developer${names.length === 1 ? '' : 's'} (${names.join(', ')}). The previous Token will stop working for all users. Emails are not sent automatically.` : `Send this Token to ${account().email}? Email delivery will be simulated.`;
      if (await ask(reset ? 'Reset Shared Token' : 'Send Token', msg, reset ? 'Reset' : 'Send')) await commit(reset ? 'reset-token' : 'send-token', { entityId, tokenType }, reset ? 'Shared Token reset for all associated developers.' : `Token email to ${account().email} simulated; no email was sent.`, null);
    }
  });
  window.addEventListener('beforeunload', event => { if (formDirty() || (modal.open && dirtyCheck?.())) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('resize', () => closeMenu());
  document.addEventListener('scroll', event => { if (menu.matches(':popover-open') && !menu.contains(event.target)) closeMenu(); }, true);
  window.addEventListener('storage', event => { if (event.key === store.key) { if (mode === 'form') notice('Developer data changed in another window. Your entries have been kept.', 'info'); else refresh(); } });
  try {
    render();
    requestAnimationFrame(() => { if (scroller()) scroller().scrollTop = view.scroll; const tableScroll = root.querySelector('.pc-table-scroll'); if (tableScroll) tableScroll.scrollLeft = view.horizontal; });
  } catch (e) { $('dmContent').replaceChildren(); error($('dmError'), e.message); }
})();
