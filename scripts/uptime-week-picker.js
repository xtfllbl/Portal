(function () {
  'use strict';
  const D = window.PaywizardUptimeDomain;
  window.PaywizardUptimeWeekPicker = { mount };
  function mount({ value, limits, onChange }) {
    const $ = id => document.getElementById(id);
    const trigger = $('uptimeRange'), popup = $('uptimeCalendar'), grid = $('uptimeCalendarDays');
    let selected = value, month = value.slice(0, 7) + '-01', focused = value;
    const label = date => new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
    const rangeLabel = date => `${label(D.addDays(date, -6))} – ${label(date)}`;
    const permitted = date => D.validDate(date) && date >= limits().earliest && date <= limits().latest;
    function updateTrigger() {
      $('uptimeRangeLabel').textContent = rangeLabel(selected);
      trigger.setAttribute('aria-label', 'Date range: ' + rangeLabel(selected));
    }
    function preview(date) {
      const first = D.addDays(date, -6);
      grid.querySelectorAll('[data-end-date]').forEach(button => {
        const day = button.dataset.endDate;
        button.classList.toggle('in-range', day >= first && day <= date);
        button.classList.toggle('range-edge', day === first || day === date);
      });
      $('uptimeCalendarRange').textContent = rangeLabel(date);
    }
    function position() {
      const r = trigger.getBoundingClientRect(), height = popup.offsetHeight;
      popup.style.left = Math.max(12, Math.min(r.right - popup.offsetWidth, innerWidth - popup.offsetWidth - 12)) + 'px';
      popup.style.top = (innerHeight - r.bottom >= height + 12 ? r.bottom + 6 : Math.max(12, r.top - height - 6)) + 'px';
    }
    function paint(focusDate = false) {
      const bounds = limits(), first = D.addDays(month, -((new Date(month + 'T12:00:00Z').getUTCDay() + 6) % 7));
      $('uptimeMonth').textContent = new Date(month + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });
      $('uptimeMonthPrevious').disabled = month.slice(0, 7) <= bounds.earliest.slice(0, 7);
      $('uptimeMonthNext').disabled = month.slice(0, 7) >= bounds.latest.slice(0, 7);
      grid.replaceChildren();
      for (let i = 0; i < 42; i++) {
        const date = D.addDays(first, i), button = document.createElement('button');
        button.type = 'button'; button.dataset.endDate = date; button.textContent = Number(date.slice(-2));
        button.setAttribute('aria-label', 'End date ' + date); button.setAttribute('aria-pressed', String(date === selected));
        if (date === bounds.latest) button.setAttribute('aria-current', 'date');
        button.disabled = !permitted(date); button.tabIndex = date === focused ? 0 : -1;
        button.classList.toggle('other-month', date.slice(0, 7) !== month.slice(0, 7)); grid.append(button);
      }
      preview(selected); position();
      if (focusDate) grid.querySelector(`[data-end-date="${focused}"]`)?.focus();
    }
    function moveMonth(direction) {
      const date = new Date(month + 'T12:00:00Z'); date.setUTCMonth(date.getUTCMonth() + direction);
      month = date.toISOString().slice(0, 10);
      focused = [limits().earliest, month].sort().pop();
      if (focused > limits().latest) focused = limits().latest;
      paint();
    }
    $('uptimeMonthPrevious').addEventListener('click', () => moveMonth(-1));
    $('uptimeMonthNext').addEventListener('click', () => moveMonth(1));
    popup.addEventListener('toggle', event => {
      const open = event.newState === 'open'; trigger.setAttribute('aria-expanded', String(open));
      if (open) { month = selected.slice(0, 7) + '-01'; focused = selected; paint(true); }
    });
    grid.addEventListener('click', event => {
      const date = event.target.closest('[data-end-date]')?.dataset.endDate;
      if (!permitted(date)) return;
      selected = date; updateTrigger(); onChange(date); popup.hidePopover(); trigger.focus();
    });
    grid.addEventListener('mouseover', event => {
      const date = event.target.closest('[data-end-date]')?.dataset.endDate;
      if (permitted(date)) preview(date);
    });
    grid.addEventListener('mouseleave', () => preview(selected));
    grid.addEventListener('focusin', event => {
      const date = event.target.dataset.endDate;
      if (permitted(date)) { focused = date; preview(date); }
    });
    grid.addEventListener('keydown', event => {
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (!(event.key in steps)) return;
      event.preventDefault();
      const date = D.addDays(focused, steps[event.key]); if (!permitted(date)) return;
      focused = date; month = date.slice(0, 7) + '-01'; paint(true);
    });
    document.addEventListener('scroll', () => { if (popup.matches(':popover-open')) position(); }, true);
    window.addEventListener('resize', () => { if (popup.matches(':popover-open')) position(); });
    updateTrigger();
    return { close() { if (popup.matches(':popover-open')) popup.hidePopover(); } };
  }
})();
