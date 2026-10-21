(function () {
  'use strict';
  const view = window.PaywizardMerchantDevices, pool = window.PaywizardParameterPool;
  if (!view || !pool || window.PaywizardPortalAccess?.profile !== 'maintain') return;
  try {
    const stores = new Set(view.storeIds());
    for (const device of pool.read().terminalConfigurations) {
      if (device.merchantId !== view.merchantId || !stores.has(device.storeId)) continue;
      view.append({ ...device, sn: device.sn || '', label: device.terminalName || '', version: device.appVersion || '', onlineStatus: 'Unknown', addedAt: device.addedAt?.replace('T', ' ').slice(0, 16) || '' });
    }
    view.refresh();
  } catch (cause) {
    const notice = document.createElement('p'); notice.setAttribute('role', 'alert'); notice.textContent = cause.message;
    document.querySelector('.device-grid-head')?.before(notice);
  }
})();
