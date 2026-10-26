(function () {
  'use strict';
  window.PaywizardLeadListControls = { mount };

  function mount({ table, onApply, onReset, closeStatus }) {
    const byId = id => document.getElementById(id);
    const filterButton = byId('filterButton'), columnButton = byId('leadColumnsButton');
    const filterPanel = byId('leadFilterPanel'), columnPanel = byId('leadColumnsPanel');
    const list = byId('leadColumnsList'), error = byId('leadColumnsError');
    const statusSlot = byId('leadStatusSlot'), statusHome = statusSlot.parentElement;
    const secondary = byId('secondaryFilter');
    const countryHost = document.createElement('div');
    countryHost.id = 'leadCountryPicker';
    secondary.after(countryHost);
    const fields = { merchant: byId('leadMerchantFilter'), contact: byId('leadContactFilter'), email: byId('leadEmailFilter'), process: byId('leadProcessFilter') };
    const storageKey = 'paywizard-upt-lead-columns-v1';
    const keys = ['processId', 'spName', 'partnerName', 'country', 'merchantName', 'terminalNumber', 'assignedSn', 'contactName', 'email', 'createTime', 'lastUpdate', 'pastDays', 'pageStyle', 'status'];
    const widths = [90, 85, 135, 135, 145, 125, 105, 150, 190, 115, 115, 75, 80, 230, 132];
    const actionsWidth = widths[widths.length - 1];
    const headers = Array.from(table.tHead.rows[0].cells);
    const definitions = headers.slice(0, -1).map((cell, i) => ({ key: keys[i], label: cell.textContent.trim(), width: widths[i] }));
    const defaultColumns = () => definitions.map(def => ({ key: def.key, visible: true }));
    let columns = loadColumns(), countryPicker, active = false, opened = null, dragKey = null;
    // Stable field identities survive reordering and subsequent SN/assignment updates.
    Array.from(table.rows).forEach(row => Array.from(row.cells).forEach((cell, i) => {
      cell.dataset.leadColumnIndex = i;
      cell.dataset.leadColumn = keys[i] || 'actions';
      if (cell.tagName === 'TH') cell.style.width = widths[i] + 'px';
    }));

    function loadColumns() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (!Array.isArray(saved)) return defaultColumns();
        const result = [], seen = new Set();
        saved.forEach(item => {
          if (!item || !keys.includes(item.key) || seen.has(item.key)) return;
          seen.add(item.key);
          result.push({ key: item.key, visible: item.visible !== false });
        });
        definitions.forEach(def => {
          if (seen.has(def.key)) return;
          const column = { key: def.key, visible: true };
          const lastUpdateIndex = result.findIndex(item => item.key === 'lastUpdate');
          if (def.key === 'createTime' && lastUpdateIndex >= 0) result.splice(lastUpdateIndex, 0, column);
          else result.push(column);
        });
        if (!result.some(item => item.visible)) result[0].visible = true;
        return result;
      } catch (_) { return defaultColumns(); }
    }

    function applyColumns() {
      const order = columns.concat({ key: 'actions', visible: true });
      Array.from(table.rows).forEach(row => {
        const cells = new Map(Array.from(row.cells).map(cell => [cell.dataset.leadColumn, cell]));
        order.forEach(item => {
          const cell = cells.get(item.key);
          cell.hidden = !item.visible;
          row.append(cell);
        });
      });
      const width = columns.reduce((sum, item) => sum + (item.visible ? definitions.find(def => def.key === item.key).width : 0), actionsWidth);
      table.style.minWidth = width + 'px';
      // Match the rounded left edge to the first visible header after hiding columns.
      headers.forEach(header => { header.style.borderTopLeftRadius = '0'; });
      table.tHead.querySelector('th:not([hidden])').style.borderTopLeftRadius = '6px';
    }

    function saveColumns() {
      applyColumns();
      try {
        localStorage.setItem(storageKey, JSON.stringify(columns));
        error.hidden = true;
      } catch (_) {
        error.textContent = 'Unable to remember column settings in this browser. Your changes apply now; allow browser storage and try again.';
        error.hidden = false;
        error.scrollIntoView({ block: 'nearest' });
        error.focus({ preventScroll: true });
      }
    }

    function renderColumns(focusKey) {
      const visibleCount = columns.filter(item => item.visible).length;
      byId('leadColumnsHint').hidden = visibleCount !== 1;
      list.replaceChildren();
      columns.forEach((item, i) => {
        const def = definitions.find(def => def.key === item.key);
        const row = document.createElement('div');
        row.className = 'lead-column-item'; row.dataset.columnKey = item.key;
        const handle = document.createElement('button');
        handle.type = 'button'; handle.draggable = true; handle.className = 'lead-column-handle';
        handle.setAttribute('aria-label', 'Move ' + def.label);
        handle.setAttribute('aria-describedby', 'leadColumnInstructions');
        handle.title = 'Drag to reorder, or press Alt + Arrow Up / Arrow Down';
        handle.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">drag_handle</span>';
        const number = document.createElement('span'); number.className = 'lead-column-number'; number.textContent = i + 1; number.setAttribute('aria-hidden', 'true');
        const label = document.createElement('label'), input = document.createElement('input');
        input.type = 'checkbox'; input.checked = item.visible;
        input.disabled = item.visible && visibleCount === 1;
        if (input.disabled) { input.setAttribute('aria-describedby', 'leadColumnsHint'); label.title = 'Keep at least one column visible'; }
        label.append(input, document.createTextNode(def.label));
        row.append(handle, number, label); list.append(row);
      });
      if (focusKey) list.querySelector('[data-column-key="' + focusKey + '"] .lead-column-handle').focus();
    }

    function moveColumn(key, targetIndex) {
      const index = columns.findIndex(item => item.key === key);
      if (index < 0 || targetIndex < 0 || targetIndex >= columns.length || targetIndex === index) return;
      const [item] = columns.splice(index, 1); columns.splice(targetIndex, 0, item);
      renderColumns(key); saveColumns();
      byId('leadColumnAnnouncement').textContent = definitions.find(def => def.key === key).label + ', position ' + (targetIndex + 1) + ' of ' + columns.length;
    }

    function position() {
      if (!opened) return;
      const trigger = opened === filterPanel ? filterButton : columnButton, rect = trigger.getBoundingClientRect();
      opened.style.maxWidth = Math.max(0, innerWidth - 24) + 'px';
      opened.style.maxHeight = Math.max(0, innerHeight - 24) + 'px';
      const box = opened.getBoundingClientRect();
      const below = innerHeight - rect.bottom - 8;
      const top = below >= box.height ? rect.bottom + 6 : rect.top >= box.height + 8 ? rect.top - box.height - 6 : Math.max(12, innerHeight - box.height - 12);
      opened.style.left = Math.max(12, Math.min(rect.right - box.width, innerWidth - box.width - 12)) + 'px';
      opened.style.top = top + 'px';
    }

    function close(restoreFocus = false) {
      if (!opened) return;
      const trigger = opened === filterPanel ? filterButton : columnButton;
      closeStatus();
      opened.hidePopover(); opened = null;
      trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus();
    }

    function toggle(panel) {
      if (!active) return;
      if (opened === panel) { close(true); return; }
      close(); opened = panel;
      const trigger = panel === filterPanel ? filterButton : columnButton;
      panel.showPopover(); trigger.setAttribute('aria-expanded', 'true'); position();
      panel.querySelector('input,button:not(:disabled)').focus({ preventScroll: true });
    }

    function refreshCountry() {
      if (countryPicker) countryPicker.destroy();
      countryPicker = window.PaywizardUptimeCombobox.mount(countryHost, {
        label: 'Country Name',
        options: Array.from(secondary.options).map(option => ({ key: option.value, name: option.value || 'All Countries' })),
        value: secondary.value,
        onChange(value) { secondary.value = value; }
      });
      const input = countryHost.querySelector('input');
      input.classList.add('filter-field'); input.placeholder = 'Country Name';
      if (!secondary.value) input.value = '';
      countryHost.querySelector('[role="listbox"]').classList.add('lead-status-options');
    }

    function setActive(value) {
      close(); active = value; columnButton.hidden = !value; countryHost.hidden = !value; secondary.hidden = value;
      document.body.classList.toggle('lead-upt-active', value);
      if (countryPicker) countryPicker.close();
      if (value) {
        byId('leadAdvancedStatus').append(statusSlot);
        filterButton.setAttribute('aria-controls', filterPanel.id); filterButton.setAttribute('aria-expanded', 'false'); filterButton.setAttribute('aria-haspopup', 'dialog');
        refreshCountry();
      } else {
        statusHome.insertBefore(statusSlot, filterButton);
        ['aria-controls', 'aria-expanded', 'aria-haspopup'].forEach(attribute => filterButton.removeAttribute(attribute));
        filterButton.classList.remove('has-filters');
      }
    }

    filterPanel.addEventListener('submit', event => { event.preventDefault(); onApply(); close(true); });
    byId('leadResetFilters').addEventListener('click', () => { onReset(); fields.merchant.focus(); position(); });
    columnButton.addEventListener('click', () => toggle(columnPanel));
    byId('leadSelectAllColumns').addEventListener('click', () => { columns.forEach(item => { item.visible = true; }); renderColumns(); saveColumns(); });
    byId('leadResetColumns').addEventListener('click', () => { columns = defaultColumns(); renderColumns(); saveColumns(); position(); });
    list.addEventListener('change', event => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      const key = event.target.closest('[data-column-key]').dataset.columnKey;
      const item = columns.find(item => item.key === key);
      item.visible = event.target.checked;
      if (!columns.some(item => item.visible)) item.visible = true;
      // Keep the toggled checkbox focused while updating the last-column protection.
      const visibleCount = columns.filter(item => item.visible).length;
      list.querySelectorAll('input').forEach(input => {
        const column = columns.find(item => item.key === input.closest('[data-column-key]').dataset.columnKey);
        input.checked = column.visible; input.disabled = column.visible && visibleCount === 1;
        input.parentElement.title = input.disabled ? 'Keep at least one column visible' : '';
        if (input.disabled) input.setAttribute('aria-describedby', 'leadColumnsHint');
        else input.removeAttribute('aria-describedby');
      });
      if (event.target.disabled) event.target.closest('[data-column-key]').querySelector('.lead-column-handle').focus();
      byId('leadColumnsHint').hidden = visibleCount !== 1; saveColumns();
    });
    list.addEventListener('keydown', event => {
      if (!event.target.closest('.lead-column-handle') || !event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const key = event.target.closest('[data-column-key]').dataset.columnKey;
      moveColumn(key, columns.findIndex(item => item.key === key) + (event.key === 'ArrowUp' ? -1 : 1));
    });
    list.addEventListener('dragstart', event => {
      const handle = event.target.closest('.lead-column-handle'); if (!handle) return;
      const row = handle.closest('[data-column-key]'); dragKey = row.dataset.columnKey;
      event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', dragKey); row.classList.add('is-dragging');
    });
    list.addEventListener('dragover', event => {
      const row = event.target.closest('[data-column-key]'); if (!row || !dragKey) return;
      event.preventDefault(); event.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.is-drop-target').forEach(item => item.classList.remove('is-drop-target')); row.classList.add('is-drop-target');
    });
    list.addEventListener('drop', event => {
      event.preventDefault(); const row = event.target.closest('[data-column-key]');
      if (row && dragKey) moveColumn(dragKey, columns.findIndex(item => item.key === row.dataset.columnKey));
      dragKey = null; list.querySelectorAll('.is-dragging,.is-drop-target').forEach(item => item.classList.remove('is-dragging', 'is-drop-target'));
    });
    list.addEventListener('dragend', () => { dragKey = null; list.querySelectorAll('.is-dragging,.is-drop-target').forEach(item => item.classList.remove('is-dragging', 'is-drop-target')); });
    document.addEventListener('pointerdown', event => {
      if (!opened || opened.contains(event.target) || filterButton.contains(event.target) || columnButton.contains(event.target)) return;
      close();
    });
    document.addEventListener('keydown', event => {
      if (!opened) return;
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
    });
    document.addEventListener('focusin', event => { if (opened && !opened.contains(event.target) && event.target !== filterButton && event.target !== columnButton) close(); });
    window.addEventListener('resize', position);
    document.addEventListener('scroll', event => { if (opened && !opened.contains(event.target)) position(); }, { capture: true, passive: true });
    secondary.addEventListener('change', () => { if (active) refreshCountry(); });
    countryHost.addEventListener('keydown', event => {
      // Run after the combobox commits its selection in the target key handler.
      if (event.key === 'Enter') setTimeout(onApply, 0);
    }, true);
    statusSlot.addEventListener('keydown', event => {
      if (!active) return;
      if (event.key === 'Enter') setTimeout(onApply, 0);
      if (event.key === 'Escape' && event.target.getAttribute('aria-expanded') === 'false') {
        event.preventDefault(); event.stopPropagation(); close(true);
      }
    }, true);
    renderColumns(); applyColumns();
    return {
      setActive,
      toggleFilters: () => toggle(filterPanel),
      filters: () => Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])),
      hasFilters: () => Object.values(fields).some(input => input.value.trim()),
      clearFilters() { Object.values(fields).forEach(input => { input.value = ''; }); if (active) refreshCountry(); },
      restoreFilters(values) { Object.entries(fields).forEach(([key, input]) => { input.value = values && typeof values[key] === 'string' ? values[key] : ''; }); refreshCountry(); }
    };
  }
})();
