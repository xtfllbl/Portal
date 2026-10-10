(function () {
  'use strict';
  // The shared shell may already be redirecting a non-operations profile.
  if (!window.PaywizardPortalAccess || window.PaywizardPortalAccess.profile !== 'wizarpos') return;
  const data = window.PaywizardPaymentChannelData;
  const picker = window.PaywizardPaymentChannelPicker;
  const storeKey = 'paywizard.maintain.payment-channels.v1';
  const viewKey = 'paywizard.maintain.payment-channels.view.v1';
  const noticeKey = 'paywizard.maintain.payment-channels.notice.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const $ = id => document.getElementById(id);
  const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
  const escape = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const label = (items, value) => items.find(option => String(option.value) === String(value))?.label || '';
  const names = (items, selected) => (selected || []).map(value => label(items, value) || value).join(', ');
  let records;
  try {
    const saved = localStorage.getItem(storeKey);
    records = saved ? JSON.parse(saved) : clone(data.records);
    if (!Array.isArray(records) || records.some(record => !record.id || !record.channelCapability || !Array.isArray(record.applicableArea))) throw new Error('Invalid channel data');
  } catch (_) {
    showError($('pageError') || $('formError'), 'Payment channels could not be loaded. Check browser storage and reload this page.');
    const form = $('channelForm'); if (form) form.hidden = true;
    if ($('addChannel')) $('addChannel').hidden = true;
    return;
  }
  function persist(next) { localStorage.setItem(storeKey, JSON.stringify(next)); records = next; }
  function showError(root, message) {
    root.textContent = message; root.hidden = false;
    root.scrollIntoView({ block: 'center', behavior: 'instant' }); root.focus({ preventScroll: true });
  }
  function timeNow() {
    const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
    return parts;
  }
  function setNotice(text) { try { sessionStorage.setItem(noticeKey, text); } catch (_) {} }
  function currentRecord(id) { return records.find(record => record.id === id); }
  if ($('paymentChannelApp')) mountList();
  if ($('paymentChannelFormApp')) mountForm();

  function mountList() {
    let view = { name: '', packageName: '', page: 1, size: 20, scroll: 0, horizontal: 0 };
    try { view = { ...view, ...JSON.parse(sessionStorage.getItem(viewKey) || '{}') }; } catch (_) {}
    view.size = [10, 20, 50].includes(Number(view.size)) ? Number(view.size) : 20;
    view.page = Math.max(1, Number(view.page) || 1);
    $('channelSearch').value = view.name; $('packageSearch').value = view.packageName;
    let filtered = [], totalPages = 1, deleting = null, dialogOpener = null;
    const scroller = document.querySelector('.pw-platform-content-host');
    function remember() {
      view.scroll = scroller.scrollTop; view.horizontal = document.querySelector('.pc-table-scroll').scrollLeft;
      try { sessionStorage.setItem(viewKey, JSON.stringify(view)); } catch (_) {}
    }
    function notify(message) { $('pageFeedback').textContent = message; $('pageFeedback').hidden = false; }
    function paint() {
      filtered = records.filter(record => record.name.toLocaleLowerCase().includes(view.name.toLocaleLowerCase()) && record.packageName.toLocaleLowerCase().includes(view.packageName.toLocaleLowerCase()));
      totalPages = Math.max(1, Math.ceil(filtered.length / view.size)); view.page = Math.min(view.page, totalPages);
      const pageRows = filtered.slice((view.page - 1) * view.size, view.page * view.size);
      const textCell = text => `<td><span class="pc-cell-text" title="${escape(text)}">${escape(text)}</span></td>`;
      $('channelRows').innerHTML = pageRows.length ? pageRows.map(record => `<tr data-channel="${escape(record.id)}">${[record.name, record.corporateName, label(data.options.scenarios, record.sceneType), record.packageName, record.gmtModified, record.applicableArea.join(', '), names(data.options.cards, record.channelCapability.cardTypeList), names(data.options.abilities, record.channelCapability.abilityList)].map(textCell).join('')}<td class="pc-actions-col"><div class="pc-row-actions"><button class="pc-button pc-view" type="button" data-detail="${escape(record.id)}" aria-label="View ${escape(record.name)}" title="Detail">${icon('description')}</button>${record.systemFlag === 0 ? `<a class="pc-button pc-edit" href="47.payment_channel_form.html?id=${encodeURIComponent(record.id)}" data-edit aria-label="Edit ${escape(record.name)}" title="Edit">${icon('edit_square')}</a><button class="pc-button pc-danger" type="button" data-delete="${escape(record.id)}" aria-label="Delete ${escape(record.name)}" title="Delete">${icon('delete')}</button>` : ''}</div></td></tr>`).join('') : '<tr><td colspan="9" class="pc-empty">No payment channels found.</td></tr>';
      $('recordCount').textContent = `${filtered.length} channels`;
      const pageButton = (target, name, glyph, disabled) => `<button class="pc-button" type="button" data-page="${target}" aria-label="${name}"${disabled ? ' disabled' : ''}>${icon(glyph)}</button>`;
      $('pageButtons').innerHTML = pageButton(1, 'First page', 'keyboard_double_arrow_left', view.page === 1) + pageButton(view.page - 1, 'Previous page', 'chevron_left', view.page === 1) + Array.from({ length: totalPages }, (_, index) => `<button class="pc-button" type="button" data-page="${index + 1}" aria-label="Page ${index + 1}"${index + 1 === view.page ? ' aria-current="page"' : ''}>${index + 1}</button>`).join('') + pageButton(view.page + 1, 'Next page', 'chevron_right', view.page === totalPages) + pageButton(totalPages, 'Last page', 'keyboard_double_arrow_right', view.page === totalPages);
      $('pageJump').value = view.page; $('pageJump').max = totalPages; $('pageTotal').textContent = `/ ${totalPages} (${filtered.length})`;
    }
    picker.mount($('pageSizePicker'), { label: 'Rows per page', options: [10, 20, 50].map(value => ({ value, label: String(value) })), value: view.size, onChange(value) { view.size = Number(value); view.page = 1; paint(); remember(); } });
    $('channelFilters').addEventListener('submit', event => { event.preventDefault(); view.name = $('channelSearch').value.trim(); view.packageName = $('packageSearch').value.trim(); view.page = 1; paint(); remember(); });
    $('resetFilters').addEventListener('click', () => { $('channelSearch').value = ''; $('packageSearch').value = ''; view.name = ''; view.packageName = ''; view.page = 1; paint(); remember(); });
    $('pageButtons').addEventListener('click', event => { const button = event.target.closest('[data-page]'); if (!button) return; view.page = Number(button.dataset.page); paint(); remember(); });
    $('pageJump').addEventListener('change', () => { view.page = Math.max(1, Math.min(totalPages, Number($('pageJump').value) || 1)); paint(); remember(); });
    $('addChannel').addEventListener('click', remember);
    $('channelRows').addEventListener('click', event => {
      const edit = event.target.closest('[data-edit]'); if (edit) remember();
      const detail = event.target.closest('[data-detail]');
      const remove = event.target.closest('[data-delete]');
      if (detail) {
        const record = currentRecord(detail.dataset.detail); dialogOpener = detail;
        const details = [
          ['Channel Name', record.name], ['Channel Type Name', record.channelType], ['Scenario Type', label(data.options.scenarios, record.sceneType)], ['Company Information', record.corporateName], ['Channel Properties', record.channelProperties], ['Cost Rate (%)', `${record.serviceFeeRate}%`], ['Fee cap', record.maxHandFee], ['Service Fee Range', record.commissionRange], ['Commission Settlement Period', record.commissionPeriod], ['Payment Package Name', record.packageName], ['Applicable Regions (Select multiple)', record.applicableArea.join(', ')], ['Supported Card Types (Select multiple)', names(data.options.cards, record.channelCapability.cardTypeList)], ['ECOMM Processor capabilities', names(data.options.abilities, record.channelCapability.abilityList)], ['Terminal Processor capabilities', names(data.options.abilities, record.channelCapability.offAbilityList)], ['Cross-Channel Capabilities (Terminal → ECOMM)', names(data.options.abilities, record.channelCapability.postAbilityList)]
        ];
        $('detailFields').innerHTML = details.map(([key, value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('');
        $('detailDialog').showModal(); $('detailDialog').querySelector('.pc-dialog-body').scrollTop = 0;
      }
      if (remove) {
        deleting = currentRecord(remove.dataset.delete); if (!deleting || deleting.systemFlag !== 0) return;
        dialogOpener = remove; $('deleteError').hidden = true;
        $('deleteMessage').textContent = `Delete payment channel “${deleting.name}”? This channel will be removed from the list.`;
        $('deleteDialog').showModal();
      }
    });
    document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
    ['detailDialog', 'deleteDialog'].forEach(id => {
      const dialog = $(id);
      dialog.addEventListener('close', () => { if (dialogOpener?.isConnected) dialogOpener.focus(); });
      dialog.addEventListener('click', event => { if (event.target !== dialog) return; const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); });
    });
    $('confirmDelete').addEventListener('click', () => {
      if (!deleting || deleting.systemFlag !== 0) return;
      try {
        persist(records.filter(record => record.id !== deleting.id));
        const name = deleting.name; $('deleteDialog').close(); paint(); remember(); notify(`Payment channel “${name}” deleted.`);
        $('pageFeedback').focus?.({ preventScroll: true });
      } catch (_) { showError($('deleteError'), 'The channel could not be deleted. Browser storage is unavailable or full. Free space or allow storage, then try again.'); }
    });
    paint();
    requestAnimationFrame(() => { scroller.scrollTop = view.scroll; document.querySelector('.pc-table-scroll').scrollLeft = view.horizontal; });
    window.addEventListener('pagehide', remember);
    try { const notice = sessionStorage.getItem(noticeKey); if (notice) { notify(notice); sessionStorage.removeItem(noticeKey); } } catch (_) {}
  }

  function mountForm() {
    const id = new URLSearchParams(location.search).get('id');
    const existing = id ? currentRecord(id) : null;
    if (id && (!existing || existing.systemFlag !== 0)) {
      showError($('formError'), existing ? 'This system payment channel is read-only. Return to Payment Channel to view its details.' : 'This payment channel no longer exists. Return to Payment Channel and select another record.');
      $('channelForm').hidden = true; return;
    }
    const record = existing ? clone(existing) : { id: '', name: '', corporateName: '', sceneType: 1, channelType: '', channelProperties: '', serviceFeeRate: '', maxHandFee: '', commissionRange: '', commissionPeriod: '', packageName: '', applicableArea: [], channelCapability: { cardTypeList: [], abilityList: [], offAbilityList: [], postAbilityList: [] }, payParams: [], fiserv: { app: '', tppId: '', serviceId: '' }, systemFlag: 0 };
    record.fiserv ||= { app: '', tppId: '', serviceId: '' }; record.payParams ||= [];
    // Existing records have no Payload configuration. Do not infer it from support.
    record.channelCapability.payloadDataList ||= [];
    const heading = existing ? 'Edit Payment Channel' : 'Add Payment Channel';
    $('formTitle').textContent = heading; document.title = `${heading} | PAYwizard Portal`;
    const crumb = document.querySelector('.pw-platform-breadcrumb'); if (crumb?.lastElementChild) crumb.lastElementChild.textContent = heading.toUpperCase();
    const grid = $('channelFields'), controls = {}, picks = {};
    const definitions = [
      { key: 'name', label: 'Channel Name', required: true, max: 20 },
      { key: 'sceneType', label: 'Scenario Type', required: true, options: data.options.scenarios },
      { key: 'channelType', label: 'Channel Type Name', required: true, options: data.options.channelTypes[record.sceneType] },
      { key: 'corporateName', label: 'Company Information', required: true, max: 50 },
      { key: 'channelProperties', label: 'Channel Properties', required: true, max: 20 },
      { key: 'packageName', label: 'Payment Package Name', required: true, max: 150, card: true },
      { key: 'serviceFeeRate', label: 'Cost Rate (%)', required: true, numeric: true, min: 0, maxNumber: 99.99, step: '0.01' },
      { key: 'maxHandFee', label: 'Fee cap', numeric: true, step: 'any' },
      { key: 'commissionRange', label: 'Service Fee Range', required: true, max: 50 },
      { key: 'commissionPeriod', label: 'Commission Settlement Period', required: true, max: 50 },
      { key: 'applicableArea', label: 'Applicable Regions (Select multiple)', required: true, multiple: true, options: data.options.regions },
      { key: 'cardTypeList', label: 'Supported Card Types (Select multiple)', required: true, card: true, multiple: true, options: data.options.cards, capability: true },
      { key: 'payParams', label: 'Required parameters', card: true, multiple: true, options: data.options.parameters },
      { key: 'app', label: 'app', required: true, fiserv: true },
      { key: 'tppId', label: 'tppId', required: true, fiserv: true },
      { key: 'serviceId', label: 'serviceId', required: true, fiserv: true }
    ];
    const groups = {};
    ['basic', 'fees', 'capabilities', 'parameters', 'fiserv', 'processor'].forEach(name => {
      const group = document.createElement('div'); group.className = `pc-field-group pc-${name}-fields`;
      groups[name] = group; grid.append(group);
    });
    const feeKeys = ['serviceFeeRate', 'maxHandFee', 'commissionRange', 'commissionPeriod'];
    const get = definition => definition.capability ? record.channelCapability[definition.key] : definition.fiserv ? record.fiserv[definition.key] : record[definition.key];
    const set = (definition, value) => { if (definition.capability) record.channelCapability[definition.key] = value; else if (definition.fiserv) record.fiserv[definition.key] = value; else record[definition.key] = definition.key === 'sceneType' ? Number(value) : value; };
    definitions.forEach(definition => {
      const field = document.createElement('div'); field.className = 'pc-field'; field.dataset.field = definition.key;
      const fieldId = `channel-${definition.key}`;
      const title = document.createElement('label'); title.htmlFor = fieldId; title.textContent = definition.label;
      if (definition.required) { const star = document.createElement('span'); star.className = 'pc-required'; star.textContent = '*'; title.append(star); }
      field.append(title);
      const error = document.createElement('p'); error.className = 'pc-field-error'; error.id = `${fieldId}-error`; error.hidden = true;
      if (definition.options) {
        const root = document.createElement('div'); field.append(root);
        picks[definition.key] = picker.mount(root, { id: fieldId, label: definition.label, multiple: definition.multiple, options: definition.options, value: get(definition), onChange(value) {
          set(definition, value); clearFieldError(definition.key);
          if (definition.key === 'sceneType') { record.channelType = ''; picks.channelType.setValue(''); picks.channelType.setOptions(data.options.channelTypes[record.sceneType] || []); clearFieldError('channelType'); updateVisibility(); }
          if (definition.key === 'channelType') updateVisibility();
        } });
        controls[definition.key] = picks[definition.key].trigger;
      } else {
        const input = document.createElement('input'); input.id = fieldId; input.name = definition.key; input.type = definition.numeric ? 'number' : 'text'; input.autocomplete = 'off'; input.value = get(definition) ?? '';
        if (definition.max) input.maxLength = definition.max;
        if (definition.step) input.step = definition.step;
        if (definition.min != null) input.min = definition.min;
        if (definition.maxNumber != null) input.max = definition.maxNumber;
        input.addEventListener('input', () => { set(definition, input.value); clearFieldError(definition.key); });
        field.append(input); controls[definition.key] = input;
      }
      controls[definition.key].setAttribute('aria-describedby', error.id);
      if (definition.required) controls[definition.key].setAttribute('aria-required', 'true');
      field.append(error);
      const group = definition.fiserv ? 'fiserv' : definition.key === 'payParams' ? 'parameters' : feeKeys.includes(definition.key) ? 'fees' : definition.multiple ? 'capabilities' : 'basic';
      groups[group].append(field);
    });
    const processor = document.createElement('section');
    processor.className = 'pc-processor-field'; processor.id = 'channel-processorCapabilities'; processor.tabIndex = -1;
    processor.setAttribute('aria-labelledby', 'processorTitle');
    processor.innerHTML = '<h2 id="processorTitle">Processor capabilities</h2><p class="pc-capability-conflicts" role="status" hidden></p><div class="pc-capability-scroll"><table class="pc-capability-table" aria-labelledby="processorTitle"><colgroup><col class="pc-transaction-col"><col><col><col class="pc-cross-col"><col class="pc-payload-col"></colgroup><thead><tr><th scope="col">Transaction Type</th><th scope="col">Terminal Channel</th><th scope="col">ECOMM Channel</th><th scope="col">Cross-Channel<br> (Terminal → ECOMM)</th><th scope="col">Send Payload Data</th></tr></thead><tbody></tbody></table></div><p class="pc-field-error" id="channel-processorCapabilities-error" hidden></p>';
    groups.processor.append(processor); controls.processorCapabilities = processor;
    processor.setAttribute('aria-describedby', 'channel-processorCapabilities-error');
    const capabilityColumns = [
      { key: 'offAbilityList', label: 'Terminal Channel' },
      { key: 'abilityList', label: 'ECOMM Channel' },
      { key: 'postAbilityList', label: 'Cross-Channel (Terminal → ECOMM)' },
      { key: 'payloadDataList', label: 'Send Payload Data', switch: true }
    ];
    const capabilityRows = data.options.abilities.map((option, index) => {
      const row = document.createElement('tr'); row.dataset.transaction = option.value;
      const name = document.createElement('th'); name.scope = 'row';
      const text = document.createElement('span'); text.textContent = option.label; name.append(text);
      const error = document.createElement('p'); error.className = 'pc-capability-error'; error.id = `capability-${index}-error`; error.hidden = true; name.append(error); row.append(name);
      const inputs = {};
      capabilityColumns.forEach(column => {
        const cell = document.createElement('td'), input = document.createElement('input');
        input.type = 'checkbox'; input.id = `capability-${index}-${column.key}`;
        input.className = column.switch ? 'pc-payload-switch' : 'pc-capability-check';
        input.setAttribute('aria-label', `${option.label}: ${column.label}`);
        if (column.switch) input.setAttribute('role', 'switch');
        input.addEventListener('change', () => {
          selectCapability(column.key, option.value, input.checked);
          if (!input.checked && (column.key === 'offAbilityList' || column.key === 'abilityList')) {
            selectCapability('postAbilityList', option.value, false);
            if (column.key === 'offAbilityList') selectCapability('payloadDataList', option.value, false);
          }
          clearFieldError('processorCapabilities'); refreshCapabilities();
        });
        cell.append(input); row.append(cell); inputs[column.key] = input;
      });
      processor.querySelector('tbody').append(row);
      return { value: option.value, row, error, inputs };
    });
    function selectCapability(key, value, selected) {
      const values = record.channelCapability[key];
      if (selected && !values.includes(value)) values.push(value);
      if (!selected) record.channelCapability[key] = values.filter(item => item !== value);
    }
    function refreshCapabilities() {
      let conflicts = 0;
      capabilityRows.forEach(({ value, row, error, inputs }) => {
        const selected = key => record.channelCapability[key].includes(value);
        const terminal = selected('offAbilityList'), ecomm = selected('abilityList');
        const crossConflict = selected('postAbilityList') && !(terminal && ecomm);
        const payloadConflict = selected('payloadDataList') && !terminal;
        capabilityColumns.forEach(({ key }) => {
          const input = inputs[key]; input.checked = selected(key);
          const needs = key === 'postAbilityList' && !(terminal && ecomm) ? 'Enable Terminal and ECOMM support first.' : key === 'payloadDataList' && !terminal ? 'Enable Terminal support first.' : '';
          // Invalid checked legacy values remain removable; only new selection is disabled.
          input.disabled = Boolean(needs) && !input.checked; input.title = needs;
          const invalid = key === 'postAbilityList' && crossConflict || key === 'payloadDataList' && payloadConflict;
          if (invalid) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', error.id); }
          else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
        });
        const messages = [];
        if (crossConflict) messages.push('Cross-Channel requires Terminal and ECOMM support.');
        if (payloadConflict) messages.push('Payload Data requires Terminal support.');
        error.textContent = messages.join(' '); error.hidden = !messages.length;
        row.classList.toggle('pc-capability-conflict', Boolean(messages.length));
        if (messages.length) conflicts++;
      });
      const notice = processor.querySelector('.pc-capability-conflicts');
      notice.hidden = !conflicts;
      notice.textContent = `${conflicts} transaction ${conflicts === 1 ? 'type needs' : 'types need'} attention. Enable the required support or clear the conflicting selections before submitting.`;
      return conflicts;
    }
    refreshCapabilities();
    function updateVisibility() {
      definitions.forEach(definition => {
        const visible = (!definition.card || record.sceneType === 1) && (!definition.fiserv || record.channelType === 'Fiserv');
        controls[definition.key].closest('.pc-field').hidden = !visible;
        if (!visible) { picks[definition.key]?.close(); clearFieldError(definition.key); }
      });
      Object.values(groups).forEach(group => { group.hidden = !Array.from(group.children).some(field => !field.hidden); });
    }
    function clearFieldError(key) {
      controls[key].removeAttribute('aria-invalid'); const error = $(`channel-${key}-error`); error.hidden = true;
    }
    function validation() {
      const errors = [];
      definitions.forEach(definition => {
        if (controls[definition.key].closest('.pc-field').hidden) return;
        const value = get(definition); const empty = Array.isArray(value) ? !value.length : value == null || !String(value).trim();
        let message = '';
        if (definition.required && empty) message = `${definition.multiple ? 'Select at least one item for' : 'Enter or select'} ${definition.label}.`;
        if (definition.key === 'serviceFeeRate' && (empty || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 99.99 || Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) > 0.000001)) message = 'Enter a cost rate from 0 to 99.99 with up to two decimal places.';
        if (definition.key === 'maxHandFee' && (controls.maxHandFee.validity.badInput || (!empty && !Number.isFinite(Number(value))))) message = 'Enter a valid fee cap or leave it blank.';
        if (definition.max && String(value).length > definition.max) message = `Use at most ${definition.max} characters for ${definition.label}.`;
        if (message) errors.push({ key: definition.key, message });
      });
      const conflicts = refreshCapabilities();
      if (conflicts) errors.push({ key: 'processorCapabilities', message: 'Resolve the highlighted Processor capabilities conflicts. Enable the required support or clear the conflicting selections.' });
      return errors;
    }
    $('channelForm').addEventListener('submit', event => {
      event.preventDefault();
      definitions.forEach(definition => clearFieldError(definition.key)); clearFieldError('processorCapabilities'); $('formError').hidden = true;
      const errors = validation();
      if (errors.length) {
        errors.forEach(error => { controls[error.key].setAttribute('aria-invalid', 'true'); const message = $(`channel-${error.key}-error`); message.textContent = error.message; message.hidden = false; });
        $('formError').innerHTML = `Please correct ${errors.length === 1 ? 'the highlighted field' : `${errors.length} highlighted fields`} before submitting. <a href="#channel-${escape(errors[0].key)}">${escape(errors[0].message)}</a>`;
        $('formError').hidden = false; $('formError').scrollIntoView({ block: 'center', behavior: 'instant' }); $('formError').focus({ preventScroll: true }); return;
      }
      const button = $('submitChannel'); button.disabled = true;
      try {
        // Persist before navigating. Failure leaves the complete form intact.
        const saved = clone(record);
        definitions.filter(definition => !definition.numeric && !definition.options).forEach(definition => { const value = String(get(definition) ?? '').trim(); if (definition.fiserv) saved.fiserv[definition.key] = value; else saved[definition.key] = value; });
        saved.serviceFeeRate = Number(record.serviceFeeRate); saved.maxHandFee = Number(record.maxHandFee || 0); saved.gmtModified = timeNow();
        if (!existing) saved.id = `pc-${crypto.randomUUID()}`;
        const next = existing ? records.map(item => item.id === saved.id ? saved : item) : [saved, ...records];
        persist(next); setNotice(`Payment channel “${saved.name}” ${existing ? 'updated' : 'added'}.`);
        location.href = '47.payment_channel.html';
      } catch (_) { showError($('formError'), 'The payment channel could not be saved. Browser storage is unavailable or full. Free space or allow storage, then try again. Your entries have been kept.'); button.disabled = false; }
    });
    $('formError').addEventListener('click', event => { if (event.target.tagName !== 'A') return; event.preventDefault(); const key = event.target.getAttribute('href').replace('#channel-', ''); const target = key === 'processorCapabilities' ? processor.querySelector('input[aria-invalid=true]') || processor : controls[key]; target?.scrollIntoView({ block: 'center' }); target?.focus({ preventScroll: true }); });
    updateVisibility();
  }
})();
