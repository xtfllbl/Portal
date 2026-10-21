(function () {
  'use strict';
  const levels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info' };
  const table = document.getElementById('logTable');
  if (table) {
    const snSearch = document.getElementById('snSearch');
    const titleSearch = document.getElementById('titleSearch');
    const rows = Array.from(table.tBodies[0].rows);
    let selectedLevel = '';
    const norm = value => String(value || '').trim().toLowerCase();
    function applyFilter() {
      let visibleCount = 0;
      rows.forEach(row => {
        const show = (!norm(snSearch.value) || norm(row.dataset.sn).includes(norm(snSearch.value))) &&
          (!selectedLevel || row.dataset.severity === selectedLevel) &&
          (!norm(titleSearch.value) || norm(row.dataset.title).includes(norm(titleSearch.value)));
        row.hidden = !show;
        if (show) visibleCount += 1;
      });
      document.getElementById('emptyState').hidden = visibleCount !== 0;
    }
    const picker = window.PaywizardPaymentChannelPicker.mount(document.getElementById('severityPicker'), {
      id: 'severityFilter', label: 'Exception level', value: '',
      options: [{ value: '', label: 'All Levels' }].concat(Object.entries(levels).map(([value, label]) => ({ value, label }))),
      onChange(value) { selectedLevel = value; applyFilter(); }
    });
    [snSearch, titleSearch].forEach(control => control.addEventListener('input', applyFilter));
    document.getElementById('logFilters').addEventListener('submit', event => { event.preventDefault(); applyFilter(); });
    document.getElementById('resetFilters').addEventListener('click', () => {
      snSearch.value = ''; titleSearch.value = ''; selectedLevel = ''; picker.setValue(''); applyFilter();
    });
    rows.forEach(row => {
      const params = new URLSearchParams({ sn: row.dataset.sn, title: row.dataset.title, time: row.cells[0].textContent.trim(), level: row.dataset.severity });
      row.querySelectorAll('a[href="24.terminal_log_detail.html"]').forEach(link => { link.href += '?' + params; });
    });
    applyFilter();
  }

  const content = document.querySelector('.log-content');
  if (content) {
    const query = new URLSearchParams(location.search);
    const record = {
      sn: query.get('sn') || 'WP2013Q321000014',
      timestamp: query.get('time') || '2025-10-17 13:51:02',
      level: query.get('level') || 'critical',
      title: query.get('title') || 'MDB ERROR',
      stage: 'terminal_upload'
    };
    ['sn', 'title'].forEach(key => { document.querySelector('[data-log="' + key + '"]').textContent = record[key]; });
    document.querySelector('[data-log="time"]').textContent = record.timestamp;
    const level = document.querySelector('[data-log="level"]');
    level.textContent = levels[record.level] || record.level;
    if (Object.hasOwn(levels, record.level)) level.classList.add('log-badge', record.level);
    content.textContent = JSON.stringify(record, null, 2);
  }
})();
