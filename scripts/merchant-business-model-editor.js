(function () {
  'use strict';
  const overridesKey = 'paywizard-merchant-business-models-v1';
  function overrides() {
    try {
      const saved = JSON.parse(localStorage.getItem(overridesKey) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    }
    catch (_) { return {}; }
  }
  window.PaywizardMerchantBusinessEditor = { mount };
  function mount(form, state) {
    const rules = window.PaywizardMerchantBusinessModel;
    const store = window.PaywizardPlatformMerchantStore;
    const saved = store?.find(state.id) || overrides()[state.id];
    for (const key of ['owner', 'ownerBusinessModel', 'businessModel']) {
      if (saved?.[key]) state[key] = saved[key];
    }
    const owner = form.querySelector('#merchant-edit-owner');
    const model = form.querySelector('#merchant-edit-business-model');
    const notice = form.querySelector('#merchant-edit-model-notice');
    const error = form.querySelector('#merchant-edit-model-error');
    const ownerModels = rules.ownerModels([state.owner]);
    if (state.ownerBusinessModel) ownerModels[state.owner] = state.ownerBusinessModel;
    if (state.owner && !Array.from(owner.options).some(option => option.value === state.owner)) {
      owner.add(new Option(state.owner, state.owner));
    }
    for (const option of owner.options) {
      const name = option.value;
      option.value = name;
      if (name && ownerModels[name]) option.textContent = `${name} · ${ownerModels[name]}`;
    }
    state.ownerBusinessModel ||= ownerModels[state.owner];
    state.businessModel ||= rules.resolve(state.ownerBusinessModel).value;
    let ownerPicker, modelPicker;
    form.noValidate = true;
    function conflict() {
      if (!model.value || model.value === 'Full-Service') return '';
      if (owner.value === state.owner && model.value === state.businessModel) return '';
      const expected = model.value === 'Attended-Service' ? 'attended' : 'unattended';
      const incompatible = Array.from(document.querySelectorAll('.device-grid-row[data-store-id]')).some(row => {
        const app = row.dataset.paywizard || '';
        const kind = /VENDING|UNATTENDED/.test(app) ? 'unattended' : /ATTENDED/.test(app) ? 'attended'
          : /Vending|Kiosk|EV Charger/.test(row.dataset.scenario || '') ? 'unattended'
          : /Standalone Terminal|Terminal \+ ECR/.test(row.dataset.scenario || '') ? 'attended' : '';
        return kind && kind !== expected;
      });
      return incompatible ? 'Existing terminals require a different Business Model. Select Full-Service under a Full-Service Owner, or move the incompatible terminals before changing the model.' : '';
    }
    function sync(announce = false) {
      const next = rules.resolve(ownerModels[owner.value], model.value);
      for (const option of model.options) if (option.value) option.disabled = !next.choices.includes(option.value);
      model.value = next.value;
      model.disabled = next.locked;
      modelPicker?.refresh();
      notice.textContent = conflict() || (announce && next.changed && next.value ? `Changed to ${next.value} to match the selected Owner.` : '');
      notice.hidden = !notice.textContent;
      notice.dataset.error = String(Boolean(conflict()));
    }
    function refresh() {
      owner.value = state.owner;
      model.value = state.businessModel || '';
      error.hidden = true;
      sync();
      ownerPicker?.refresh();
    }
    refresh();
    ownerPicker = window.PaywizardMerchantSelects.mount(owner);
    modelPicker = window.PaywizardMerchantSelects.mount(model);
    owner.addEventListener('change', () => { error.hidden = true; sync(true); });
    model.addEventListener('change', () => {
      error.hidden = true;
      notice.textContent = conflict();
      notice.hidden = !notice.textContent;
      notice.dataset.error = 'true';
    });
    function fail(message) {
      error.textContent = message;
      error.hidden = false;
      error.scrollIntoView({ block: 'center' });
      error.focus({ preventScroll: true });
      return false;
    }
    function save() {
      ownerPicker.close(); modelPicker.close();
      const invalid = Array.from(form.querySelectorAll('input, select, textarea')).find(field => !field.checkValidity());
      if (invalid) return fail(`Complete ${invalid.closest('.field')?.querySelector('label')?.textContent.replace(/\s*\*$/, '') || 'the required fields'} with a valid value before saving.`);
      if (!rules.resolve(ownerModels[owner.value]).choices.includes(model.value)) return fail('Select a Business Model supported by the selected Owner before saving.');
      if (conflict()) return fail(conflict());
      const selection = { owner: owner.value, ownerBusinessModel: ownerModels[owner.value], businessModel: model.value };
      try {
        const existing = store?.find(state.id);
        if (existing) store.upsert({ ...existing, ...selection, lastUpdate: store.timestamp() });
        else localStorage.setItem(overridesKey, JSON.stringify({ ...overrides(), [state.id]: selection }));
      } catch (_) {
        return fail('The merchant changes could not be saved in this browser. Check browser storage and try again.');
      }
      Object.assign(state, selection);
      return true;
    }
    return { refresh, save };
  }
})();
