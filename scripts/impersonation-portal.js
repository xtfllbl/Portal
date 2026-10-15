(function () {
  'use strict';
  // Consume the one-time handoff before loading existing role-aware pages.
  // This transport document renders no intermediate dashboard.
  const session=window.PaywizardAccessContext.session();
  location.replace(!session?'48.impersonate.html':session.profile==='billing-merchant'?'42.billing_payments.html':'12.transaction_list.html');
})();
