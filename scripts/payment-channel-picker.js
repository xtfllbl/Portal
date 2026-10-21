(function () {
  'use strict';
  let sequence = 0;
  const mounted = new Set();
  window.PaywizardPaymentChannelPicker = { mount };

  // Select / MultiSelect patterns, with a native top-layer popover so the
  // Portal scrolling container and sticky form footer cannot clip the options.
  function mount(root, config) {
    const id = `pc-picker-${++sequence}`;
    const multiple = !!config.multiple;
    let options = config.options;
    let value = multiple ? [...(config.value || [])] : String(config.value ?? '');
    let matches = [], active = -1, selectedOnly = false;
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'pc-picker-trigger'; trigger.id = config.id || id;
    trigger.setAttribute('role', 'combobox'); trigger.setAttribute('aria-label', config.label);
    trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false');
    const caption = document.createElement('span');
    const chevron = document.createElement('span');
    chevron.className = 'material-symbols-rounded'; chevron.textContent = 'expand_more'; chevron.setAttribute('aria-hidden', 'true');
    trigger.append(caption, chevron); root.classList.add('pc-picker'); root.append(trigger);
    const panel = document.createElement('div');
    panel.className = 'pc-picker-panel'; panel.id = `${id}-panel`; panel.setAttribute('popover', 'auto');
    const search = document.createElement('input');
    search.type = 'search'; search.className = 'pc-picker-search'; search.placeholder = 'Search';
    search.setAttribute('aria-label', `Search ${config.label}`); search.setAttribute('role', 'combobox');
    search.setAttribute('aria-autocomplete', 'list'); search.setAttribute('aria-expanded', 'false');
    const tools = document.createElement('div'); tools.className = 'pc-picker-tools';
    const all = button('Select all'); const selected = button('Selected (0)'); const clear = button('Clear');
    clear.className = 'pc-picker-clear';
    const list = document.createElement('div');
    list.id = `${id}-list`; list.className = 'pc-picker-list'; list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', `${config.label} options`);
    if (multiple) list.setAttribute('aria-multiselectable', 'true');
    trigger.setAttribute('aria-controls', list.id); search.setAttribute('aria-controls', list.id);
    if (multiple) tools.append(all, selected, clear);
    panel.append(search); if (multiple) panel.append(tools); panel.append(list); (config.appendTo || document.body).append(panel);

    function button(label) { const el = document.createElement('button'); el.type = 'button'; el.textContent = label; return el; }
    const isSelected = option => multiple ? value.includes(String(option.value)) : value === String(option.value);
    function captionText() {
      const chosen = options.filter(isSelected);
      caption.textContent = config.caption || (chosen.length ? (chosen.length <= 2 ? chosen.map(option => option.label).join(', ') : `${chosen.length} items selected`) : config.placeholder || 'Select');
      caption.classList.toggle('pc-placeholder', !chosen.length);
      trigger.title = chosen.map(option => option.label).join(', ');
      selected.textContent = `Selected (${chosen.length})`;
    }
    function paint() {
      const term = search.value.trim().toLocaleLowerCase();
      matches = options.filter(option => (!selectedOnly || isSelected(option)) && [option.label, option.description || '', option.searchText || ''].join(' ').toLocaleLowerCase().includes(term));
      if (active >= matches.length) active = matches.length - 1;
      list.replaceChildren();
      matches.forEach((option, index) => {
        const row = document.createElement('div'); row.className = 'pc-picker-option'; row.id = `${id}-option-${index}`;
        row.dataset.index = index; row.setAttribute('role', 'option'); row.setAttribute('aria-selected', String(isSelected(option)));
        row.classList.toggle('pc-active', index === active);
        if (option.disabled) row.setAttribute('aria-disabled', 'true');
        if (multiple) { const check = document.createElement('span'); check.className = 'pc-check'; check.setAttribute('aria-hidden', 'true'); const icon = document.createElement('span'); icon.className = 'material-symbols-rounded'; icon.textContent = isSelected(option) ? 'check' : ''; check.append(icon); row.append(check); }
        const name = document.createElement('span'); name.textContent = option.label;
        if (option.description) { const copy = document.createElement('span'); copy.className = 'pp-option-copy'; const detail = document.createElement('span'); detail.className = 'pp-option-detail'; detail.textContent = option.description; copy.append(name, detail); row.append(copy); } else row.append(name);
        if (selectedOnly) { const remove = document.createElement('span'); remove.className = 'pc-remove-selected material-symbols-rounded'; remove.textContent = 'close'; remove.setAttribute('aria-hidden', 'true'); row.append(remove); }
        list.append(row);
      });
      if (!matches.length) { const empty = document.createElement('div'); empty.className = 'pc-picker-empty'; empty.textContent = selectedOnly ? 'No selected items match.' : 'No results found.'; list.append(empty); }
      selected.setAttribute('aria-pressed', String(selectedOnly));
      if (active >= 0) { search.setAttribute('aria-activedescendant', `${id}-option-${active}`); list.children[active]?.scrollIntoView({ block: 'nearest' }); }
      else search.removeAttribute('aria-activedescendant');
      captionText();
    }
    function place() {
      if (!panel.matches(':popover-open')) return;
      const rect = trigger.getBoundingClientRect();
      const roomBelow = window.innerHeight - rect.bottom - 16, roomAbove = rect.top - 16;
      const upward = roomBelow < 290 && roomAbove > roomBelow;
      const room = Math.max(100, upward ? roomAbove : roomBelow);
      const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 24);
      panel.style.width = `${width}px`; panel.style.maxHeight = `${room}px`;
      list.style.maxHeight = `${Math.min(220, Math.max(50, room - (multiple ? 100 : 58)))}px`;
      panel.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
      panel.style.top = `${upward ? Math.max(12, rect.top - panel.offsetHeight - 6) : rect.bottom + 6}px`;
    }
    function close(focus = false) { if (panel.matches(':popover-open')) panel.hidePopover(); if (focus) trigger.focus(); }
    function open() {
      mounted.forEach(api => { if (api !== handle) api.close(); });
      search.value = ''; selectedOnly = false; active = -1; paint();
      panel.showPopover(); place(); search.focus();
    }
    function commit() { captionText(); config.onChange(multiple ? [...value] : value); }
    function choose(index) {
      const option = matches[index]; if (!option || option.disabled) return;
      const key = String(option.value);
      if (multiple) { value = value.includes(key) ? value.filter(item => item !== key) : [...value, key]; commit(); paint(); search.focus(); }
      else { value = key; commit(); close(true); }
    }
    trigger.addEventListener('click', () => panel.matches(':popover-open') ? close() : open());
    trigger.addEventListener('keydown', event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(); active = event.key === 'ArrowDown' ? 0 : matches.length - 1; paint(); } });
    search.addEventListener('input', () => { active = 0; paint(); });
    search.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
      if (event.key === 'Tab') return;
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Enter') { choose(active >= 0 ? active : 0); return; }
      active = event.key === 'Home' ? 0 : event.key === 'End' ? matches.length - 1 : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      paint();
    });
    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
      if (event.key === 'Tab') {
        const stops = multiple ? [search, all, selected, clear] : [search];
        const next = stops.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1);
        if (next >= 0 && next < stops.length) { event.preventDefault(); stops[next].focus(); }
        else { close(true); if (event.shiftKey) event.preventDefault(); }
      }
    });
    list.addEventListener('mousedown', event => event.preventDefault());
    list.addEventListener('click', event => { const row = event.target.closest('[data-index]'); if (row) choose(Number(row.dataset.index)); });
    all.addEventListener('click', () => { value = [...new Set([...value, ...matches.filter(option => !option.disabled).map(option => String(option.value))])]; commit(); paint(); });
    selected.addEventListener('click', () => { selectedOnly = !selectedOnly; active = -1; paint(); place(); });
    clear.addEventListener('click', () => { value = []; commit(); paint(); });
    panel.addEventListener('toggle', () => { const expanded = panel.matches(':popover-open'); trigger.setAttribute('aria-expanded', String(expanded)); search.setAttribute('aria-expanded', String(expanded)); if (!expanded) search.removeAttribute('aria-activedescendant'); });
    window.addEventListener('resize', place); document.addEventListener('scroll', place, true);
    const handle = { close, trigger, setValue(next) { value = multiple ? [...next].map(String) : String(next ?? ''); captionText(); }, setOptions(next) { options = next; if (panel.matches(':popover-open')) paint(); captionText(); }, destroy() { close(); panel.remove(); root.replaceChildren(); mounted.delete(handle); window.removeEventListener('resize', place); document.removeEventListener('scroll', place, true); } };
    mounted.add(handle); captionText(); return handle;
  }
})();
