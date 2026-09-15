(function () {
  'use strict';
  const S = window.PaywizardUptimeStore;
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
  window.PaywizardMerchantHours = { openStore };
})();
