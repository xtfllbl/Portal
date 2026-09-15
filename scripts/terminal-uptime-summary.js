(function () {
  'use strict';
  const host = document.getElementById('terminalUptimeSummary');
  if (!host) return;
  const D = window.PaywizardUptimeDomain, S = window.PaywizardUptimeStore, V = window.PaywizardUptimeView;
  const directory = window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
  const params = new URLSearchParams(location.search), sn = S.resolveSn(params.get('sn') || document.getElementById('bannerSn')?.textContent.trim());
  let data, terminal, allowed, auth, asOf, selectedDate;
  const dialog = document.createElement('dialog');
  dialog.className = 'up-dialog up-drawer'; dialog.id = 'terminalSummaryDayDialog'; dialog.setAttribute('aria-labelledby', 'terminalSummaryDayTitle');
  dialog.innerHTML = `<header class="up-dialog-heading"><h2 id="terminalSummaryDayTitle">Payment Service</h2><button class="up-icon" type="button" data-summary-close aria-label="Close daily details">${V.icon('close')}</button></header><div class="up-dialog-body" id="terminalSummaryDayContent"></div><footer class="up-dialog-footer"><button type="button" data-summary-previous aria-label="Previous available day">${V.icon('chevron_left')}Previous day</button><button type="button" data-summary-next aria-label="Next available day">Next day${V.icon('chevron_right')}</button><a class="up-link-button up-primary" data-summary-history>View history${V.icon('arrow_outward')}</a></footer>`;
  document.body.append(dialog);
  function historyUrl(date) {
    const query = new URLSearchParams({ sn });
    if (auth.scope !== 'all') query.set('scope', auth.scope);
    if (!auth.manage) query.set('access', 'view');
    if (date) query.set('date', date);
    return '46.terminal_uptime.html?' + query;
  }
  function report(date) { return terminal ? D.reportDay(data, terminal, date, allowed, asOf) : null; }
  function openDay(date) {
    const result = report(date); if (!result) return;
    selectedDate = date;
    dialog.querySelector('h2').textContent = `${V.dateLabel(date)} · Payment Service`;
    const content = dialog.querySelector('.up-dialog-body');
    content.innerHTML = V.dayContent(data, terminal, result); content.scrollTop = 0;
    dialog.querySelector('[data-summary-previous]').disabled = !report(D.addDays(date, -1));
    dialog.querySelector('[data-summary-next]').disabled = !report(D.addDays(date, 1));
    dialog.querySelector('[data-summary-history]').href = historyUrl(date);
    V.openDrawer(dialog);
  }
  function render() {
    const membership = terminal?.memberships.filter(m => allowed.includes(m.storeId)).sort((a, b) => b.from - a.from)[0];
    const effective = membership && D.effective(data, terminal, Math.min(asOf, (membership.to ?? asOf + 1) - 1));
    const zone = effective?.schedule.timeZone || 'UTC', today = D.parts(asOf, zone).date;
    const days = Array.from({ length: 7 }, (_, i) => report(D.addDays(today, i - 6))).filter(Boolean);
    host.innerHTML = `<header class="up-summary-heading"><div class="up-summary-title"><h2>Service Uptime</h2></div><div class="up-actions"><button type="button" class="oh-summary-hours" data-summary-hours ${!terminal || !D.canManageTerminal(data, auth, terminal, asOf) ? 'disabled' : ''}>${V.icon('schedule')}Operating Hours</button><a class="up-link-button btn-secondary" href="${V.esc(historyUrl())}">View history${V.icon('arrow_outward')}</a></div></header><div class="up-summary-grid">${days.length ? days.map(r => V.cell(r, sn, true)).join('') : '<p class="up-summary-empty">No terminal history in the last 7 days.</p>'}</div><footer class="up-summary-footer"><div class="up-legend" aria-label="Uptime legend">${V.legend()}</div><span class="up-meta" title="${new Date(data.observedAt).toISOString()}">${V.esc(zone.replace(/_/g, ' '))} · Updated ${new Date(data.observedAt).toLocaleString('en-GB', { timeZone: zone, month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></footer><p class="up-error" role="alert" tabindex="-1" hidden></p>`;
  }
  function load() {
    try {
      const now = Date.now(), next = S.load(localStorage, directory, now);
      data = next; asOf = now; auth = S.viewerAuth(data, localStorage.getItem('paywizard.portalAccessProfile.v1') || 'wizarpos', params);
      allowed = D.scopeStores(data, auth.scope); terminal = data.terminals.find(t => t.sn === sn); render();
    } catch (e) {
      if (!host.querySelector('.up-error')) host.innerHTML = '<h2>Service Uptime</h2><p class="up-error" role="alert" tabindex="-1"></p>';
      const error = host.querySelector('.up-error'); error.hidden = false; error.textContent = 'Service Uptime could not be loaded. ' + e.message;
      error.scrollIntoView({ block: 'center' }); error.focus({ preventScroll: true });
    }
  }
  host.addEventListener('click', event => {
    if (event.target.closest('[data-summary-hours]')) {
      try { window.PaywizardOperatingHours.open({ target: { type: 'terminal', id: sn }, locked: true }); }
      catch (e) { const error = host.querySelector('.up-error'); error.textContent = e.message; error.hidden = false; error.scrollIntoView({ block: 'center' }); error.focus(); }
      return;
    }
    const cell = event.target.closest('[data-day]'); if (cell) openDay(cell.dataset.day);
  });
  dialog.querySelector('[data-summary-close]').addEventListener('click', () => V.closeDrawer(dialog));
  dialog.querySelector('[data-summary-previous]').addEventListener('click', () => openDay(D.addDays(selectedDate, -1)));
  dialog.querySelector('[data-summary-next]').addEventListener('click', () => openDay(D.addDays(selectedDate, 1)));
  window.addEventListener('paywizard:operating-hours-saved', load);
  load();
})();
