(function () {
  'use strict';
  // Shared with Service Provider management; existing developer binding IDs remain independent.
  const records = [
  {
    "id": "1053",
    "name": "Techsupport",
    "merchantCount": 5,
    "phone": "11111111111111",
    "application": "OPS-ADMIN",
    "creator": "Maggie-support",
    "createdAt": "2026-05-14 13:55:46",
    "maximumMerchants": "10",
    "expiresAt": "2030-08-31",
    "status": "Active"
  },
  {
    "id": "1052",
    "name": "test1.2.0-test005",
    "merchantCount": 12,
    "phone": "123",
    "application": "OPS-ADMIN",
    "creator": "huchan",
    "createdAt": "2026-05-07 13:18:27",
    "maximumMerchants": "123",
    "expiresAt": "2026-05-07",
    "status": "Active"
  },
  {
    "id": "1051",
    "name": "test1.2.0-test004",
    "merchantCount": 3,
    "phone": "123",
    "application": "OPS-ADMIN",
    "creator": "huchan",
    "createdAt": "2026-05-07 10:20:50",
    "maximumMerchants": "123",
    "expiresAt": "2026-05-07",
    "status": "Active"
  },
  {
    "id": "1050",
    "name": "Civitronic",
    "merchantCount": 28,
    "phone": "888-999",
    "application": "OPS-ADMIN",
    "creator": "huchan",
    "createdAt": "2026-04-10 11:20:29",
    "maximumMerchants": "111",
    "expiresAt": "2029-11-08",
    "status": "Active"
  },
  {
    "id": "1049",
    "name": "Systema Procesa Pago Corp",
    "merchantCount": 1,
    "phone": "111-222",
    "application": "OPS-ADMIN",
    "creator": "Admin",
    "createdAt": "2026-03-28 13:38:26",
    "maximumMerchants": "100000",
    "expiresAt": "2100-12-31",
    "status": "Active"
  },
  {
    "id": "1048",
    "name": "chongqing",
    "merchantCount": 7,
    "phone": "19921581225",
    "application": "OPS-ADMIN",
    "creator": "Vivian",
    "createdAt": "2026-03-25 17:39:19",
    "maximumMerchants": "10",
    "expiresAt": "2099-02-04",
    "status": "Active"
  },
  {
    "id": "1047",
    "name": "Cantaloupe Inc",
    "merchantCount": 45,
    "phone": "888-999",
    "application": "OPS-ADMIN",
    "creator": "Admin",
    "createdAt": "2026-03-17 17:59:04",
    "maximumMerchants": "100000",
    "expiresAt": "2100-12-31",
    "status": "Active"
  },
  {
    "id": "1046",
    "name": "Paywizard WC5124",
    "merchantCount": 9,
    "phone": "4321432",
    "application": "OPS-ADMIN",
    "creator": "huchan",
    "createdAt": "2026-03-05 16:52:58",
    "maximumMerchants": "9999",
    "expiresAt": "2029-03-03",
    "status": "Active"
  }
];
  function render(table) {
    const body = table?.querySelector('tbody'), template = body?.querySelector('tr');
    if (!template) return;
    const rows = records.map(record => {
      const row = template.cloneNode(true), cells = row.querySelectorAll('td'); row.dataset.providerId = record.id;
      ['id', 'name', 'merchantCount', 'phone', 'application', 'creator', 'createdAt', 'maximumMerchants', 'expiresAt', 'status'].forEach((key, index) => {
        const target = index === 2 ? cells[index].querySelector('a') : index === 9 ? cells[index].querySelector('span') : cells[index];
        target.textContent = String(record[key]);
      });
      return row;
    });
    body.replaceChildren(...rows);
  }
  window.PaywizardServiceProviderCatalog = { records, render };
})();
