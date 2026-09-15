(function () {
  'use strict';
  // Use the existing searchable top-layer picker while keeping form values on selects.
  window.PaywizardMerchantSelects = { mount };
  function mount(select) {
    let host, picker, choosing = false;
    const label = select.closest('.field').querySelector('label');
    const labelText = label.textContent;
    select.hidden = true;
    function refresh() {
      if (picker) picker.destroy();
      if (host) host.remove();
      host = document.createElement('div');
      select.after(host);
      picker = window.PaywizardUptimeCombobox.mount(host, {
        label: labelText,
        options: Array.from(select.options).filter(option => !option.disabled && option.value)
          .map(option => ({ key: option.value, name: option.textContent })),
        value: select.value,
        disabled: select.disabled,
        onChange(value) {
          select.value = value;
          choosing = true;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          choosing = false;
        }
      });
      host.classList.add('merchant-select');
      const input = host.querySelector('input');
      const list = host.querySelector('[role="listbox"]');
      list.classList.add('merchant-select-options');
      label.htmlFor = input.id;
      input.placeholder = select.options[0]?.textContent || '';
      input.setAttribute('aria-required', String(select.required));
      if (select.hasAttribute('aria-describedby')) input.setAttribute('aria-describedby', select.getAttribute('aria-describedby'));
      if (select.getAttribute('aria-invalid') === 'true') input.setAttribute('aria-invalid', 'true');
    }
    refresh();
    // Programmatic fills use native change events; reflect them in the visible picker.
    select.addEventListener('change', () => { if (!choosing) refresh(); });
    const reposition = () => picker.reposition();
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', event => {
      if (!host.contains(event.target)) picker.reposition();
    }, true);
    return { refresh, input: () => host.querySelector('input'), close: () => picker.close() };
  }
})();
