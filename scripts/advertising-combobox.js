(function () {
  'use strict';
  // Search changes the option list; only choosing an option commits a filter.
  window.PaywizardAdvertisingCombobox = { mount };
  function mount(root, { options, value, onChange }) {
    const input = root.querySelector('input');
    const toggle = root.querySelector('button');
    const list = root.querySelector('[role="listbox"]');
    let matches = options, active = -1;
    const selectedLabel = () => options.find(option => option.key === value)?.name || '';
    function paint() {
      list.replaceChildren();
      matches.forEach((option, index) => {
        const row = document.createElement('div');
        row.id = `${input.id}-option-${index}`;
        row.role = 'option';
        row.dataset.option = index;
        row.setAttribute('aria-selected', String(option.key === value));
        row.className = index === active ? 'is-active' : '';
        row.textContent = option.name;
        list.append(row);
      });
      if (!matches.length) { const empty = document.createElement('div'); empty.className = 'ads-combobox-empty'; empty.textContent = 'No matches'; list.append(empty); }
      if (active >= 0) {
        input.setAttribute('aria-activedescendant', `${input.id}-option-${active}`);
        list.children[active]?.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }
    function open() {
      matches = options; active = options.findIndex(option => option.key === value);
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); paint();
    }
    function close() {
      list.hidden = true; input.value = selectedLabel();
      input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
    }
    function choose(index) {
      if (!matches[index]) return;
      value = matches[index].key; close(); onChange(value);
    }
    input.value = selectedLabel();
    input.addEventListener('focus', () => { open(); input.select(); });
    input.addEventListener('click', () => { if (list.hidden) open(); });
    input.addEventListener('input', event => {
      event.stopPropagation();
      const term = input.value.trim().toLowerCase();
      matches = options.filter(option => option.name.toLowerCase().includes(term));
      active = matches.length ? 0 : -1;
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); paint();
    });
    toggle.addEventListener('mousedown', event => event.preventDefault());
    toggle.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      if (list.hidden) { input.focus(); open(); input.select(); } else close();
    });
    list.addEventListener('mousedown', event => event.preventDefault());
    list.addEventListener('click', event => {
      event.stopPropagation();
      const option = event.target.closest('[data-option]');
      if (option) choose(Number(option.dataset.option));
    });
    root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Tab') { close(); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Escape'].includes(event.key)) return;
      if (list.hidden && ['Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'Enter') { if (!list.hidden) choose(active); return; }
      if (list.hidden) { open(); return; }
      if (!matches.length) return;
      active = event.key === 'Home' ? 0 : event.key === 'End' ? matches.length - 1 : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      paint();
    });
    return { close };
  }
})();
