(function () {
  'use strict';
  const S = window.PaywizardUptimeStore, D = window.PaywizardUptimeDomain;
  const directory = () => window.PaywizardCustomerAccountDirectory.create(window.PaywizardCustomerAccountData.createHierarchy());
  const zones = { 'Eastern Standard Time (EST)': 'America/New_York', 'Central Standard Time (CST)': 'America/Chicago', 'Mountain Standard Time (MST)': 'America/Denver', 'Pacific Standard Time (PST)': 'America/Los_Angeles' };
  function errorNear(host, message) {
    let error = document.getElementById('merchantHoursError');
    if (!error) { error = document.createElement('p'); error.id = 'merchantHoursError'; error.className = 'up-error'; error.role = 'alert'; error.tabIndex = -1; }
    host.insertAdjacentElement('afterend', error); error.textContent = message; error.hidden = false;
    error.scrollIntoView({ block: 'center' }); error.focus({ preventScroll: true });
  }
  function contextFor(row, merchant) {
    return { merchantId: String(merchant.id), merchantName: merchant.dba, storeId: row.dataset.storeId, storeName: row.dataset.storeName, timeZone: zones[row.dataset.storeTimezone] || row.dataset.storeTimezone || 'UTC', terminals: [...document.querySelectorAll('.device-grid-row[data-store-id]')].filter(device => device.dataset.storeId === row.dataset.storeId).map(device => ({ sn: device.dataset.sn, name: device.dataset.label })) };
  }
  function register(row, merchant) {
    const before = S.load(localStorage, directory()), result = S.registerContext(before, contextFor(row, merchant));
    // Registration adds configuration identities, never authorization or telemetry.
    if (result.changed) S.persist(localStorage, result.data, before.revision);
    return result;
  }
  function openStore(row, merchant) {
    try {
      document.getElementById('merchantHoursError')?.remove();
      const result = register(row, merchant);
      window.PaywizardOperatingHours.open({ data: result.data, target: { type: 'store', id: result.storeId }, locked: true });
    } catch (error) { errorNear(row.closest('section') || row, error.message); }
  }
  function registerStoreForDevice(device, merchant) {
    const store = [...document.querySelectorAll('.store-grid-row[data-store-id]')].find(row => row.dataset.storeId === device.dataset.storeId);
    if (!store) return;
    // Keep the existing device navigation available if this optional hours entry
    // has a configuration conflict. Opening hours will report that conflict.
    try { register(store, merchant); } catch (error) { console.warn('Operating Hours context: ' + error.message); }
  }
  window.PaywizardMerchantHours = { openStore, registerStoreForDevice };
  if (!location.pathname.endsWith('/5.merchant_device_settings_iso.html')) return;
  const params = new URLSearchParams(location.search), header = document.querySelector('.wizard-header');
  if (!header) return;
  const button = document.createElement('button'); button.type = 'button'; button.className = 'up-link-button'; button.id = 'deviceOperatingHours';
  button.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">schedule</span>Operating Hours';
  button.style.marginLeft = 'auto'; header.append(button);
  button.addEventListener('click', () => {
    try {
      document.getElementById('merchantHoursError')?.remove();
      const data = S.load(localStorage, directory()), sn = S.resolveSn(params.get('sn') || '');
      const terminal = data.terminals.find(t => t.sn === sn), merchantId = params.get('hoursMerchant');
      if (!sn || sn === '-') throw new Error('Assign a terminal S/N before setting terminal operating hours.');
      if (!terminal) throw new Error('Open this terminal from its merchant’s device list to load its store schedule.');
      if (merchantId && D.membershipAt(terminal, Date.now())?.storeId !== 'portal:' + merchantId + ':' + params.get('storeId')) throw new Error('This terminal’s store assignment does not match this page. Open its current store to edit operating hours.');
      window.PaywizardOperatingHours.open({ data, target: { type: 'terminal', id: sn }, locked: true });
    } catch (error) { errorNear(header, error.message); }
  });
})();
