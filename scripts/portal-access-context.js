(function (root) {
  'use strict';
  const profiles = ['maintain','wizarpos','full-service','attended','unattended','full-service-merchant','attended-merchant','unattended-merchant','attended-store','unattended-store','billing-merchant'];
  function session() {
    if (location.pathname.endsWith('/48.impersonate.html')) return null;
    try {
      const value = JSON.parse(sessionStorage.getItem('paywizard.impersonation.session.v1') || 'null');
      return value && value.id && value.user && value.user.name && value.user.role && value.entity && value.profile !== 'maintain' && profiles.includes(value.profile) ? value : null;
    } catch (_) { return null; }
  }
  function profile() {
    const target = session();
    if (target) return target.profile;
    try {
      const value = localStorage.getItem('paywizard.portalAccessProfile.v1');
      return profiles.includes(value) ? value : 'wizarpos';
    } catch (_) { return 'wizarpos'; }
  }
  root.PaywizardAccessContext = Object.freeze({session, profile});
})(window);
