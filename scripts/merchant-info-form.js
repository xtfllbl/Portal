(function () {
  'use strict';
  window.PaywizardMerchantInfoForm = { mount };

  function mount(root, { ownerModels, showError, clearError = () => {}, isDisabled = () => false }) {
    const rules = window.PaywizardMerchantBusinessModel;
    const owner = root.querySelector('#merchant-owner');
    const model = root.querySelector('#merchant-business-model');
    const permissions = root.querySelector('#merchant-permissions');
    const notice = root.querySelector('#business-model-notice');
    const pickers = {};
    ownerModels ||= rules.ownerModels();
    for (const option of owner.options) {
      const name = option.value;
      if (!name) continue;
      option.value = name;
      if (ownerModels[name]) option.textContent = name + ' · ' + ownerModels[name];
    }
    if (!permissions.value) permissions.value = 'Merchant Admin';

    function syncModel(announce) {
      const ownerModel = ownerModels[owner.value];
      const state = rules.resolve(ownerModel, model.value);
      model.options[0].textContent = !owner.value ? 'Select Owner first'
        : !ownerModel ? 'Business Model unavailable' : 'Select Business Model';
      for (const option of model.options) {
        if (option.value) option.disabled = !state.choices.includes(option.value);
      }
      model.value = state.value;
      model.disabled = state.locked || isDisabled();
      model.removeAttribute('aria-invalid');
      notice.dataset.error = String(Boolean(owner.value && !ownerModel));
      notice.textContent = owner.value && !ownerModel
        ? 'This Owner has no Business Model. Select an Owner with a configured model.'
        : announce && state.changed && state.value ? 'Changed to ' + state.value + ' to match the selected Owner.' : '';
      notice.hidden = !notice.textContent;
      pickers[model.id]?.refresh();
    }
    syncModel(false);
    root.querySelectorAll('select').forEach(select => {
      pickers[select.id] = window.PaywizardMerchantSelects.mount(select);
    });
    owner.addEventListener('change', () => syncModel(true));
    model.addEventListener('change', () => {
      notice.hidden = true;
      notice.textContent = '';
    });
    function edited(event) {
      if (event.target.getAttribute('role') === 'combobox') return;
      event.target.removeAttribute('aria-invalid');
      pickers[event.target.id]?.input().removeAttribute('aria-invalid');
      if (!isDisabled()) clearError();
    }
    root.addEventListener('change', edited);
    root.addEventListener('input', edited);

    function validate() {
      Object.values(pickers).forEach(picker => picker.close());
      if (isDisabled()) return false;
      const invalid = Array.from(root.querySelectorAll('input, select, textarea'))
        .find(field => !field.checkValidity());
      if (invalid) {
        invalid.setAttribute('aria-invalid', 'true');
        pickers[invalid.id]?.input().setAttribute('aria-invalid', 'true');
        const label = invalid.closest('.field').querySelector('label').textContent.replace(/\s*\*$/, '');
        showError(invalid.validity.typeMismatch ? 'Enter a valid ' + label + '.' : 'Complete ' + label + ' before continuing.');
        return false;
      }
      if (!rules.resolve(ownerModels[owner.value]).choices.includes(model.value)) {
        model.setAttribute('aria-invalid', 'true');
        pickers[model.id].input().setAttribute('aria-invalid', 'true');
        showError('Select a Business Model supported by the selected Owner before continuing.');
        return false;
      }
      clearError();
      return true;
    }

    return {
      validate,
      refresh() {
        syncModel(false);
        Object.values(pickers).forEach(picker => picker.refresh());
      },
      selection: () => ({ owner: owner.value, ownerBusinessModel: ownerModels[owner.value], businessModel: model.value, permissions: permissions.value })
    };
  }
})();
