(() => {
  'use strict';
  // Missing schedules on legacy rules represent continuous monitoring.
  function normalize(value) {
    return value?.mode === 'custom'
      ? { mode: 'custom', timeZone: value.timeZone || '', startTime: value.startTime || '', endTime: value.endTime || '' }
      : { mode: 'all_day' };
  }
  function zoneLabel(timeZone) {
    const part = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(new Date()).find(part => part.type === 'timeZoneName').value;
    return `${timeZone} (${part === 'GMT' ? '+00:00' : part.replace('GMT', '')})`;
  }
  function mount(host, prefix) {
    host.classList.add('monitoring-hours');
    host.innerHTML = `
      <div class="field alert-field monitoring-hours-wide"><label for="${prefix}-mode">Monitoring Hours</label><select id="${prefix}-mode"><option value="all_day">24 hours</option><option value="custom">Custom hours · Every day</option></select></div>
      <div class="monitoring-hours-custom" hidden>
        <div class="field alert-field monitoring-hours-wide"><label for="${prefix}-zone">Time Zone</label><input id="${prefix}-zone" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${prefix}-zones" autocomplete="off" placeholder="Search time zone or UTC offset" required><div id="${prefix}-zones" class="monitoring-zone-options" role="listbox" aria-label="Time zones" hidden></div></div>
        <div class="field alert-field"><label for="${prefix}-start">Start Time</label><input id="${prefix}-start" type="time" step="60" required></div>
        <div class="field alert-field"><label for="${prefix}-end">End Time<span data-next-day hidden> (next day)</span></label><input id="${prefix}-end" type="time" step="60" required></div>
        <div class="monitoring-hours-error" role="alert" hidden></div>
      </div>`;
    const mode = host.querySelector('select');
    const [zone, start, end] = host.querySelectorAll('input');
    const list = host.querySelector('[role="listbox"]');
    let selectedZone = '';
    let matches = [];
    let activeIndex = -1;
    const custom = host.querySelector('.monitoring-hours-custom');
    const error = host.querySelector('.monitoring-hours-error');
    const defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const zones = [...new Set(['UTC', defaultZone, ...(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'Africa/Cairo'])])].sort();
    let labels = new Map();
    function refreshLabels() { labels = new Map(zones.map(value => [value, zoneLabel(value)])); }
    function closeOptions() {
      list.hidden = true;
      zone.setAttribute('aria-expanded', 'false');
      zone.removeAttribute('aria-activedescendant');
      zone.value = labels.get(selectedZone) || '';
    }
    function activate(index) {
      activeIndex = index;
      [...list.querySelectorAll('[role="option"]')].forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
      const option = list.querySelectorAll('[role="option"]')[index];
      if (option) { zone.setAttribute('aria-activedescendant', option.id); option.scrollIntoView({ block: 'nearest' }); }
      else zone.removeAttribute('aria-activedescendant');
    }
    function choose(value) {
      selectedZone = value;
      closeOptions();
      zone.setCustomValidity('');
    }
    function search(query = '') {
      const term = query.trim().toLowerCase().replaceAll(' ', '_');
      matches = zones.filter(value => labels.get(value).toLowerCase().replaceAll(' ', '_').includes(term));
      list.replaceChildren();
      matches.forEach((value, index) => {
        const option = document.createElement('div');
        option.id = `${prefix}-zone-option-${index}`;
        option.setAttribute('role', 'option');
        option.textContent = labels.get(value);
        option.addEventListener('pointerdown', event => event.preventDefault());
        option.addEventListener('click', () => choose(value));
        list.append(option);
      });
      if (!matches.length) {
        const empty = document.createElement('div');
        empty.className = 'monitoring-zone-empty';
        empty.setAttribute('role', 'status');
        empty.textContent = 'No time zones found';
        list.append(empty);
      }
      list.hidden = false;
      zone.setAttribute('aria-expanded', 'true');
      activate(query ? -1 : matches.indexOf(selectedZone));
    }
    zone.addEventListener('focus', () => { search(); zone.select(); });
    zone.addEventListener('click', () => { if (list.hidden) { search(); zone.select(); } });
    zone.addEventListener('input', () => search(zone.value));
    zone.addEventListener('blur', closeOptions);
    zone.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); closeOptions(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) search();
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        if (matches.length) activate((activeIndex + delta + matches.length) % matches.length);
      }
      if (event.key === 'Enter' && !list.hidden) {
        event.preventDefault();
        if (matches[activeIndex]) choose(matches[activeIndex]);
        else if (matches.length === 1) choose(matches[0]);
      }
    });
    function sync() {
      const enabled = !host.hidden && mode.value === 'custom';
      custom.hidden = !enabled;
      if (!enabled) closeOptions();
      [zone, start, end].forEach(field => { field.disabled = !enabled; });
      const equal = enabled && start.value && start.value === end.value;
      const message = equal ? 'Choose different start and end times, or select 24 hours.' : '';
      end.setCustomValidity(message);
      error.textContent = message;
      error.hidden = !message;
      host.querySelector('[data-next-day]').hidden = !(enabled && start.value && end.value && end.value < start.value);
    }
    host.addEventListener('change', sync);
    host.addEventListener('input', sync);
    const api = {
      set(value) {
        const schedule = normalize(value);
        mode.value = schedule.mode;
        const timeZone = schedule.timeZone || defaultZone;
        if (!zones.includes(timeZone)) zones.push(timeZone);
        refreshLabels();
        selectedZone = timeZone;
        closeOptions();
        start.value = schedule.startTime || '';
        end.value = schedule.endTime || '';
        sync();
      },
      setVisible(visible) { host.hidden = !visible; mode.disabled = !visible; sync(); },
      get() { return normalize(!host.hidden && mode.value === 'custom' ? { mode: 'custom', timeZone: selectedZone, startTime: start.value, endTime: end.value } : null); },
      reportValidity() { sync(); return [zone, start, end].every(field => field.reportValidity()); }
    };
    api.set();
    return api;
  }
  window.AlertMonitoringHours = { mount, normalize };
})();
