(function () {
  'use strict';
  if (window.PaywizardPortalAccess?.profile !== 'wizarpos') return;
  const pool = window.PaywizardParameterPool, $ = id => document.getElementById(id);
  const processor = $('device-processor'), provision = $('device-provision-toggle');
  const host = $('processorParams');
  if (!host || !processor) return;
  const context = new URLSearchParams(location.search);
  let source = 'manual', resourceId = '', selectedResource = null, snapshot = null, saved = false;
  const section = document.createElement('div'); section.className = 'pp-device-source'; section.hidden = true;
  section.innerHTML = '<div class="form-grid two pp-source-fields"><div class="field"><label for="parameterSourceInput">Parameter Source</label><div id="parameterSourcePicker"></div></div><div class="field" id="poolResourceField" hidden><label for="poolResourceInput">Parameter Set <span class="required-mark">*</span></label><div id="poolResourcePicker"></div></div></div><p class="pp-note" id="poolResourceNote" hidden></p><div class="pc-error-summary" id="devicePoolError" role="alert" tabindex="-1" hidden></div><div class="pc-feedback" id="devicePoolSaved" role="status" hidden></div>';
  host.querySelector('.processor-params-head').after(section);
  const fields = () => [...document.querySelectorAll('#processorParamSets .param-set[data-processor="NUVEI UPT"] .parameter-value')];
  const set = () => document.querySelector('#processorParamSets .param-set[data-processor="NUVEI UPT"]');
  const active = () => processor.value === 'NUVEI UPT' && source === 'pool' && (!provision || provision.checked);
  function error(message) { $('devicePoolError').textContent = message; $('devicePoolError').hidden = false; section.hidden = false; host.classList.remove('is-hidden'); $('devicePoolError').scrollIntoView({ block: 'center' }); $('devicePoolError').focus({ preventScroll: true }); }
  function controlsLocked(lock) {
    set()?.classList.toggle('pp-pool-readonly', lock);
    fields().forEach(input => { if (input.tagName === 'SELECT') input.disabled = lock; else input.readOnly = lock; input.closest('.field')?.querySelectorAll('.param-segment').forEach(button => { button.disabled = lock; }); });
    host.querySelector('.processor-template-row').hidden = lock;
    for (const id of ['saveTemplateBtn', 'openCloneConfigBtn']) { if ($(id)) { $(id).disabled = lock; } }
  }
  function fill(parameters) {
    fields().forEach(input => {
      input.value = parameters[input.dataset.parameterKey] ?? '';
      input.closest('.field')?.querySelectorAll('.param-segment').forEach(button => { const chosen = button.dataset.value === input.value; button.classList.toggle('is-selected', chosen); button.setAttribute('aria-pressed', String(chosen)); });
    });
  }
  function restore() {
    if (snapshot) fill(snapshot.parameters);
    controlsLocked(false); snapshot = null; selectedResource = null; resourceId = ''; resourcePicker.setValue(''); $('poolResourceNote').hidden = true;
  }
  function options() {
    const state = pool.read(), channelIds = new Set(pool.channels().map(row => row.id));
    return state.resources.filter(row => row.processor === 'NUVEI UPT').sort((a, b) => Number(a.status !== 'available') - Number(b.status !== 'available')).map(row => {
      const usage = state.usages.find(item => item.id === row.currentUsageId);
      return { value: row.id, label: row.name, disabled: row.status !== 'available' || !channelIds.has(row.channelId), description: `${row.parameters.mid} / ${row.parameters.tid} · ${channelIds.has(row.channelId) ? pool.labels[row.status] : 'Channel unavailable'}${usage ? ` · ${usage.merchantName} / ${usage.storeName} / ${usage.tci}` : ''}`, searchText: row.channelName };
    });
  }
  const sourcePicker = window.PaywizardPaymentChannelPicker.mount($('parameterSourcePicker'), { id: 'parameterSourceInput', label: 'Parameter Source', value: source, options: [{ value: 'manual', label: 'Manual Entry' }, { value: 'pool', label: 'Parameter Pool' }], onChange(value) {
    if (value === source) return;
    source = value; $('devicePoolError').hidden = true;
    if (source === 'pool') {
      snapshot = { parameters: Object.fromEntries(fields().map(input => [input.dataset.parameterKey, input.value])) };
      controlsLocked(true); fill({});
      try { resourcePicker.setOptions(options()); } catch (cause) { error(cause.message); }
    } else restore();
    $('poolResourceField').hidden = source !== 'pool';
  } });
  const resourcePicker = window.PaywizardPaymentChannelPicker.mount($('poolResourcePicker'), { id: 'poolResourceInput', label: 'Parameter Set', options: [], value: '', onChange(value) {
    try {
      const resource = pool.read().resources.find(row => row.id === value);
      if (!resource || resource.status !== 'available') throw new Error('This parameter set is no longer available. Select another parameter set.');
      if (!pool.channels().some(row => row.id === resource.channelId)) throw new Error('This parameter set’s payment channel is unavailable. Choose another parameter set.');
      resourceId = value; selectedResource = JSON.parse(JSON.stringify(resource));
      fill(resource.parameters); controlsLocked(true);
      $('poolResourceNote').textContent = `${resource.channelName} · NUVEI UPT · Parameters are read-only.`; $('poolResourceNote').hidden = false; $('devicePoolError').hidden = true;
    } catch (cause) { resourceId = ''; selectedResource = null; resourcePicker.setValue(''); fill({}); error(cause.message); }
  } });
  sourcePicker.trigger.classList.add('input-field');
  resourcePicker.trigger.classList.add('input-field');
  function owner() { return { merchantId: context.get('merchantId') || '', merchantName: context.get('merchantName') || '', storeId: context.get('storeId') || '', storeName: context.get('storeName') || '', tci: $('device-tci').value, sn: $('device-tpn')?.value.trim() || '', terminalName: $('device-label')?.value.trim() || '' }; }
  function check(state) {
    if (!resourceId || !selectedResource) throw new Error('Select one available parameter set from Parameter Pool.');
    const who = owner();
    if (!who.merchantId || !who.storeId) throw new Error('Open Add Device from a merchant store before selecting a pool parameter set.');
    const resource = state.resources.find(row => row.id === resourceId);
    const ownUsage = state.usages.find(row => row.id === resource?.currentUsageId);
    const same = ownUsage?.status === 'in_use' && ownUsage.tci === who.tci && ownUsage.merchantId === who.merchantId && ownUsage.storeId === who.storeId;
    if (!resource || (resource.status !== 'available' && !same)) throw new Error('This parameter set is no longer available. Select another parameter set.');
    if (!pool.channels().some(row => row.id === resource.channelId)) throw new Error('The parameter set’s payment channel is no longer available.');
    if (JSON.stringify(resource.parameters) !== JSON.stringify(selectedResource.parameters) || resource.channelId !== selectedResource.channelId) throw new Error('The selected parameter set was edited. Select it again to load the latest parameters.');
    return who;
  }
  function sync() {
    if (saved) return;
    if (source === 'pool' && (processor.value !== 'NUVEI UPT' || (provision && !provision.checked))) { restore(); source = 'manual'; sourcePicker.setValue(source); $('poolResourceField').hidden = true; }
    if (active()) { if (selectedResource) fill(selectedResource.parameters); controlsLocked(true); }
    section.hidden = processor.value !== 'NUVEI UPT';
  }
  $('device-model')?.addEventListener('change', sync); processor.addEventListener('change', sync); provision?.addEventListener('change', sync);
  window.addEventListener('storage', event => { if (event.key === pool.KEY && !saved) { try { resourcePicker.setOptions(options()); } catch (cause) { error(cause.message); } } });
  window.PaywizardParameterPoolDevice = {
    validate() { if (!active()) return true; try { check(pool.read()); return true; } catch (cause) { error(cause.message); return false; } },
    async save(saveExisting, closeModal) {
      if (!active()) return saveExisting();
      try {
        const usage = await pool.mutate(state => {
          const who = check(state);
          // Check all allocation rules before persisting the existing terminal controls.
          const usage = pool.allocate(state, resourceId, who, `usage-${crypto.randomUUID()}`, new Date().toISOString());
          if (!saveExisting()) throw new Error('Complete the terminal configuration before saving.');
          return usage;
        });
        saved = true; sourcePicker.trigger.disabled = true; resourcePicker.trigger.disabled = true; processor.disabled = true; processor.dataset.parameterPoolLocked = 'true'; if (provision) provision.disabled = true;
        $('devicePoolSaved').replaceChildren(document.createTextNode('Parameter set assigned. ')); const link = document.createElement('a'); link.className = 'pp-link'; link.textContent = 'View usage record'; link.href = `49.parameter_pool_usage.html?resource=${encodeURIComponent(resourceId)}&usage=${encodeURIComponent(usage.id)}`; $('devicePoolSaved').append(link); $('devicePoolSaved').hidden = false;
        return true;
      } catch (cause) { closeModal(); error(cause.message); return false; }
    }
  };
  sync();
})();
