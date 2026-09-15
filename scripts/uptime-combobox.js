(function () {
  'use strict';
  let sequence = 0;
  window.PaywizardUptimeCombobox = { mount };
  function mount(host, { label, options, value, onChange, disabled = false }) {
    host.replaceChildren(); host.className = 'up-combobox';
    const id = 'up-combo-' + (++sequence), input = document.createElement('input'), toggle = document.createElement('button'), list = document.createElement('div');
    input.id = id; input.setAttribute('aria-label', label); input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', id + '-list'); input.autocomplete = 'off'; input.disabled = disabled;
    toggle.type = 'button'; toggle.className = 'up-combo-toggle'; toggle.setAttribute('aria-label', 'Choose ' + label); toggle.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">expand_more</span>'; toggle.disabled = disabled; toggle.tabIndex = -1;
    list.id = id + '-list'; list.className = 'up-options'; list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', label + ' options'); list.setAttribute('popover', 'manual');
    host.append(input, toggle, list);
    let opened = false, matches = options, active = -1;
    const selectedLabel = () => options.find(o => o.key === value)?.name || '';
    function close() { if (opened) list.hidePopover(); opened = false; input.value = selectedLabel(); input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    function position() {
      const rect = input.getBoundingClientRect(), room = innerHeight - rect.bottom - 12, height = Math.min(240, Math.max(room, rect.top - 12));
      Object.assign(list.style, { width: rect.width + 'px', left: Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8)) + 'px', maxHeight: height + 'px', top: room < 160 && rect.top > room ? 'auto' : rect.bottom + 4 + 'px', bottom: room < 160 && rect.top > room ? innerHeight - rect.top + 4 + 'px' : 'auto' });
    }
    function paint() {
      list.replaceChildren();
      matches.forEach((o, i) => {
        const row = document.createElement('div'); row.id = id + '-' + i; row.role = 'option'; row.dataset.index = i; row.textContent = o.name; row.setAttribute('aria-selected', String(o.key === value)); if (i === active) row.className = 'active'; list.append(row);
      });
      if (!matches.length) { const empty = document.createElement('div'); empty.className = 'up-option-empty'; empty.textContent = 'No matches'; list.append(empty); }
      if (active >= 0) { input.setAttribute('aria-activedescendant', id + '-' + active); list.children[active]?.scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
      position();
    }
    function open() { if (disabled) return; matches = options; active = options.findIndex(o => o.key === value); list.showPopover(); opened = true; input.setAttribute('aria-expanded', 'true'); paint(); }
    function choose(i) { if (!matches[i]) return; value = matches[i].key; close(); onChange(value); }
    input.value = selectedLabel();
    input.addEventListener('focus', () => { open(); input.select(); });
    input.addEventListener('click', () => { if (!opened) open(); });
    input.addEventListener('input', event => { event.stopPropagation(); const q = input.value.toLowerCase(); matches = options.filter(o => o.name.toLowerCase().includes(q)); active = matches.length ? 0 : -1; if (!opened) { list.showPopover(); opened = true; } input.setAttribute('aria-expanded', 'true'); paint(); });
    toggle.addEventListener('mousedown', e => e.preventDefault());
    toggle.addEventListener('click', () => { if (opened) close(); else { input.focus(); if (!opened) open(); } });
    list.addEventListener('mousedown', e => e.preventDefault());
    list.addEventListener('click', e => { const row = e.target.closest('[data-index]'); if (row) choose(Number(row.dataset.index)); });
    host.addEventListener('focusout', e => { if (!host.contains(e.relatedTarget)) close(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Tab') { close(); return; }
      if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Home', 'End'].includes(e.key)) return;
      if (['Home', 'End'].includes(e.key) && !opened) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Enter') { if (opened) choose(active); return; }
      if (!opened) { open(); return; }
      active = e.key === 'Home' ? 0 : e.key === 'End' ? matches.length - 1 : (active + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % (matches.length || 1); paint();
    });
    // The popover is in the top layer and cannot be clipped by dialog footers.
    const reposition = () => { if (opened) position(); };
    const observer = new ResizeObserver(reposition); observer.observe(host);
    host.closest('.up-dialog-body')?.addEventListener('scroll', reposition, { passive: true });
    return { close, reposition, destroy() { close(); observer.disconnect(); host.closest('.up-dialog-body')?.removeEventListener('scroll', reposition); } };
  }
})();
