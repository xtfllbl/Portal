// Transaction Details page interactivity

// Column definitions (key order drives table order)
const COLUMNS = [
  { key: 'datetime', label: 'Date & Time (Processor)' },
  { key: 'invoice', label: 'Invoice Number' },
  { key: 'pan', label: 'Card PAN' },
  { key: 'approval', label: 'Approval Code' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'currency', label: 'Currency' },
  { key: 'mid', label: 'MID' },
  { key: 'tid', label: 'TID' },
  { key: 'actions', label: 'Actions' },
];

// Demo data
const COMPLETED = [
  { datetime: '2025-10-10 09:19:53', invoice: '-', pan: '-', approval: '-', type: 'Purchase', amount: 3.60, currency: 'BRL', mid: '-', tid: '-', actions: '' },
  { datetime: '2025-10-10 09:13:02', invoice: '-', pan: '-', approval: '-', type: 'Purchase', amount: 0.13, currency: 'BRL', mid: '-', tid: '-', actions: '' },
  { datetime: '2025-10-10 10:18:33', invoice: '-', pan: '-', approval: '-', type: 'Purchase', amount: 28.05, currency: 'BRL', mid: '-', tid: '-', actions: '' },
  { datetime: '2025-10-10 10:09:10', invoice: '-', pan: '-', approval: '-', type: 'Purchase', amount: 1.02, currency: 'BRL', mid: '-', tid: '-', actions: '' },
  { datetime: '2025-10-11 01:47:31', invoice: '-', pan: '451461****8925', approval: '-', type: 'Purchase', amount: 11.00, currency: 'USD', mid: '266482540884', tid: 'UZN10E08', actions: '' },
  { datetime: '2025-10-11 01:02:04', invoice: '-', pan: '451461****8925', approval: '-', type: 'Purchase', amount: 0.01, currency: 'USD', mid: '266482540884', tid: 'UZN10E08', actions: '' },
  { datetime: '2025-10-11 02:21:17', invoice: '-', pan: '-', approval: '-', type: 'Purchase', amount: 17.00, currency: 'BRL', mid: '-', tid: '-', actions: '' },
];
const FAILED = [
  { datetime: '2025-10-10 09:20:11', invoice: '-', pan: '-', approval: '-', type: 'Purchase', amount: 12.30, currency: 'BRL', mid: '-', tid: '-', actions: '' },
  { datetime: '2025-10-10 10:00:01', invoice: '-', pan: '-', approval: '-', type: 'Reversal', amount: -0.01, currency: 'USD', mid: '266482540884', tid: 'UZN10E08', actions: '' },
  { datetime: '2025-10-12 08:15:22', invoice: '-', pan: '451461****8925', approval: '-', type: 'Purchase', amount: 5.00, currency: 'USD', mid: '266482540884', tid: 'UZN10E08', actions: '' },
];

// State elements
let currentTab = 'completed';
const els = {
  tabs: document.querySelectorAll('.seg-btn'),
  start: document.querySelector('#startDate'),
  end: document.querySelector('#endDate'),
  btnFilter: document.querySelector('#btnFilter'),
  btnResetRange: document.querySelector('#btnResetRange'),
  tableContainer: document.querySelector('#tableContainer'),
  resultsMeta: document.querySelector('#resultsMeta'),
  btnColumns: document.querySelector('#btnColumns'),
  btnColumnsCancel: document.querySelector('#btnColumnsCancel'),
  btnColumnsReset: document.querySelector('#btnColumnsReset'),
  columnsPop: document.querySelector('#columnsPop'),
  columnsGrid: document.querySelector('#columnsGrid'),
};

// Helpers
const LS_KEY = (tab) => `transdetails.visibleCols.${tab}`;
function defaultVisible() { const m = {}; COLUMNS.forEach(c => m[c.key] = true); return m; }
function loadVisible(tab) { try { const raw = localStorage.getItem(LS_KEY(tab)); return raw ? JSON.parse(raw) : defaultVisible(); } catch { return defaultVisible(); } }
function saveVisible(tab, map) { localStorage.setItem(LS_KEY(tab), JSON.stringify(map)); }
function getData() { return currentTab === 'completed' ? COMPLETED : FAILED; }

function withinRange(dateStr) {
  const v = new Date(dateStr.replace(/-/g,'/'));
  const s = els.start.value ? new Date(els.start.value) : null;
  const e = els.end.value ? new Date(els.end.value) : null;
  if (s && v < new Date(s.getFullYear(), s.getMonth(), s.getDate())) return false;
  if (e) {
    const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23,59,59,999);
    if (v > endDay) return false;
  }
  return true;
}

function groupByDate(rows) {
  const map = new Map();
  rows.forEach(r => {
    const d = r.datetime.slice(0,10);
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(r);
  });
  return map;
}

function renderColumnsChooser() {
  const visible = loadVisible(currentTab);
  els.columnsGrid.innerHTML = '';
  COLUMNS.forEach(col => {
    const id = `colchk-${col.key}`;
    const wrap = document.createElement('label');
    wrap.innerHTML = `<input type="checkbox" id="${id}"> ${col.label}`;
    const input = wrap.querySelector('input');
    input.checked = !!visible[col.key];
    input.addEventListener('change', () => {
      const map = loadVisible(currentTab);
      map[col.key] = input.checked;
      saveVisible(currentTab, map);
      renderTable();
    });
    els.columnsGrid.appendChild(wrap);
  });
}

function renderTable() {
  const visible = loadVisible(currentTab);
  const data = getData().filter(r => withinRange(r.datetime));
  const table = document.createElement('table');
  table.className = 'table';
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  COLUMNS.forEach(c => { if (visible[c.key]) { const th = document.createElement('th'); th.textContent = c.label; htr.appendChild(th); } });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const groups = groupByDate(data);
  groups.forEach((rows, day) => {
    const hdr = document.createElement('tr'); hdr.className = 'section-row';
    const td = document.createElement('td'); td.colSpan = Object.values(visible).filter(Boolean).length || 1; td.textContent = day; hdr.appendChild(td);
    tbody.appendChild(hdr);
    rows.forEach(r => {
      const tr = document.createElement('tr');
      COLUMNS.forEach(c => {
        if (!visible[c.key]) return;
        const td = document.createElement('td');
        let v = r[c.key];
        if (c.key === 'amount') { td.className = 'num mono'; v = r.amount.toFixed(2); }
        if (c.key === 'type') { td.className = 'type'; }
        if (c.key === 'actions') { v = '⋯'; td.style.textAlign = 'center'; }
        td.textContent = v == null ? '' : String(v);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  });
  table.appendChild(tbody);
  els.tableContainer.innerHTML = '';
  els.tableContainer.appendChild(table);
  els.resultsMeta.textContent = `${currentTab === 'completed' ? '已完成' : '失败'} · ${data.length} 条，显示列 ${Object.values(visible).filter(Boolean).length}/${COLUMNS.length}`;
}

// Events: tabs
els.tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === currentTab) return;
    els.tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    renderColumnsChooser();
    renderTable();
  });
});

// Events: filters
els.btnFilter.addEventListener('click', renderTable);
els.btnResetRange.addEventListener('click', () => { els.start.value = ''; els.end.value = ''; renderTable(); });

// Columns popover
const togglePop = (flag) => els.columnsPop.classList.toggle('show', flag);
els.btnColumns.addEventListener('click', (e) => { e.stopPropagation(); togglePop(!els.columnsPop.classList.contains('show')); });
els.btnColumnsCancel.addEventListener('click', () => togglePop(false));
document.addEventListener('click', (e) => { if (!els.columnsPop.contains(e.target) && e.target !== els.btnColumns) togglePop(false); });
els.btnColumnsReset.addEventListener('click', () => { saveVisible(currentTab, defaultVisible()); renderColumnsChooser(); renderTable(); });

// Init default date range (last 30 days)
(function initDates(){
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end); start.setDate(start.getDate() - 30);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  els.start.value = fmt(start); els.end.value = fmt(end);
})();

// Initial render
renderColumnsChooser();
renderTable();

