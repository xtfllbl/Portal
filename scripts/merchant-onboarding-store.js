(function (global) {
  "use strict";

  var STORAGE_KEY = "paywizard-onboarding-applications-v2";
  var SECTION_IDS = {
    Nuvei: ["legal", "dba", "owners", "banking", "terminal", "documents"],
    "Elavon EU": ["business", "beneficial-owners", "signatory", "banking", "operation", "contact"]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function timestamp() {
    var now = new Date();
    function pad(value) { return String(value).padStart(2, "0"); }
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  }

  function createReview(channel) {
    var sections = {};
    (SECTION_IDS[channel] || []).forEach(function (id) {
      sections[id] = { status: "pending", reason: "", previousReason: "", reviewedAt: "" };
    });
    return { sections: sections, reviewedAt: "" };
  }

  var DEMO_APPLICATIONS = [
    {
      applicationId: "APP-DEMO-NUVEI-01",
      processId: "00000339",
      spName: "Paywizard UAT",
      agentName: "Olivia Chen",
      merchantName: "Maple Street Coffee Inc.",
      mid: "-",
      email: "finance@maplestreetcoffee.ca",
      phone: "+1 416 555 0188",
      contactName: "Sophie Martin",
      channel: "Nuvei",
      country: "Canada",
      currency: "CAD",
      lastUpdate: "2026-08-12 16:42:08",
      status: "Merchant Submit",
      shareUrl: "38.Merchant_onboard_nuvei_public.html?applicationId=APP-DEMO-NUVEI-01&merchantName=Maple+Street+Coffee+Inc.&contactName=Sophie+Martin&email=finance%40maplestreetcoffee.ca&phone=%2B1+416+555+0188&country=Canada&currency=CAD",
      submissionVersion: 1,
      submittedAt: "2026-08-12 16:42:08",
      formData: {
        ownershipType: "Limited Liability",
        legalName: "Maple Street Coffee Inc.", legalCivic: "128", legalStreet: "King Street West", legalCity: "Toronto", legalPostal: "M5H 1J9", legalPhone: "+1 416 555 0188", legalMobile: "+1 416 555 0177",
        dbaName: "Maple Street Coffee", dbaCivic: "128", dbaStreet: "King Street West", dbaCity: "Toronto", dbaPostal: "M5H 1J9", dbaPhone: "+1 416 555 0188", timeZone: "Eastern Time Zone", businessDuration: "4 Years, 8 months", authorizedContact: "Sophie Martin", statementEmail: "finance@maplestreetcoffee.ca", merchantCustomerServicePhone: "+1 416 555 0188", riskProgram: "no", federalRegistryNumber: "CA-BC-784210", mailingAddress: "Corporate Address",
        "owners[0][title]": "Owner", "owners[0][guaranty]": "yes", "owners[0][firstName]": "Sophie", "owners[0][lastName]": "Martin", "owners[0][email]": "sophie@maplestreetcoffee.ca", "owners[0][percentOwnership]": "100", "owners[0][dob]": "1987-04-18", "owners[0][civic]": "36", "owners[0][street]": "Harbour Square", "owners[0][city]": "Toronto", "owners[0][province]": "Ontario", "owners[0][postal]": "M5J 2G4", "owners[0][residenceCountryCode]": "+1", "owners[0][residencePhone]": "4165550133", "owners[0][cellCountryCode]": "+1", "owners[0][cellPhone]": "4165550177", additionalOwnerCount: "0",
        bankHolder: "Maple Street Coffee Inc.", bankName: "Royal Bank of Canada", bankTransit: "00412", bankAccount: "1092845", bankCity: "Toronto", bankProvince: "Ontario", bankPostal: "M5H 2N2",
        terminalsToOnboard: "12", snNumber: "WP20260812001337", dispatchDate: "2026-08-03", arrivalDate: "2026-08-07", "connectivity[]": ["WiFi", "Cellular"], averageTransactionAmount: "CAD $8-$24", vendingProducts: "Coffee, tea, pastries and packaged snacks", previousProcessor: "no", businessStructure: "Corporation / Limited Company / Partnership", onlineBusinessValidation: "https://maplestreetcoffee.example"
      },
      documents: {
        vendingMachinePhoto: [{ name: "maple-street-kiosk.jpg", type: "image/jpeg", size: 1842200 }],
        voidCheck: [{ name: "rbc-void-cheque.pdf", type: "application/pdf", size: 284100 }],
        driversLicense: [{ name: "sophie-martin-drivers-license.pdf", type: "application/pdf", size: 516800 }]
      }
    },
    {
      applicationId: "APP-DEMO-ELAVON-01",
      processId: "00000338",
      spName: "Paywizard UAT",
      agentName: "Oliver Smith",
      merchantName: "Northstar Vending Europe Ltd.",
      mid: "-",
      email: "onboarding@northstarvending.eu",
      phone: "+353 1 555 0142",
      contactName: "Emma Collins",
      channel: "Elavon EU",
      country: "Ireland",
      currency: "EUR",
      lastUpdate: "2026-08-12 16:36:24",
      status: "Merchant Submit",
      shareUrl: "38.Merchant_onboard_elavon_public.html?applicationId=APP-DEMO-ELAVON-01&merchantName=Northstar+Vending+Europe+Ltd.&contactName=Emma+Collins&email=onboarding%40northstarvending.eu&phone=%2B353+1+555+0142&country=Ireland&currency=EUR",
      submissionVersion: 1,
      submittedAt: "2026-08-12 16:36:24",
      formData: {
        ownershipType: "Limited Liability", registeredBusinessName: "Northstar Vending Europe Ltd.", dbaName: "Northstar Smart Markets", vatTaxId: "IE6388047V", companyEmail: "onboarding@northstarvending.eu", companyPhone: "+353 1 555 0142", siretCode: "N/A", businessStructure: "Corporation / Limited Company / Partnership",
        totalBeneficialOwners: "1", additionalOwnerCount: "0", "owners[0][title]": "Owner", "owners[0][firstName]": "Emma", "owners[0][lastName]": "Collins", "owners[0][email]": "emma@northstarvending.eu", "owners[0][phoneCountryCode]": "+353", "owners[0][phone]": "85550142", "owners[0][percentOwnership]": "100",
        signatoryFirstName: "Emma", signatoryLastName: "Collins", signatoryEmail: "emma@northstarvending.eu", signatoryCellCountryCode: "+353", signatoryCellPhone: "85550142",
        beneficiaryName: "Northstar Vending Europe Ltd.", accountNumber: "IE29AIBK93115212345678",
        terminalsToOnboard: "24", snNumber: "WP20260812002841", dispatchDate: "2026-08-02", arrivalDate: "2026-08-06", "connectivity[]": ["Cellular", "Ethernet"], averageTransactionAmount: "EUR €6-€18", vendingProducts: "Fresh meals, beverages and convenience products", previousProcessor: "yes", annualTransactionCards: "420000", annualTransactionCashCards: "65000",
        authorizedContact: "Emma Collins", statementEmail: "finance@northstarvending.eu", merchantCustomerServicePhone: "+353 1 555 0142"
      },
      documents: {
        ownerSignatoryPassports: [{ name: "emma-collins-passport.pdf", type: "application/pdf", size: 634500 }],
        ownerSignatorySecondKyc: [{ name: "emma-collins-address-proof.pdf", type: "application/pdf", size: 422100 }],
        bankTransferReceipt: [{ name: "aib-bank-transfer-receipt.pdf", type: "application/pdf", size: 318900 }]
      }
    }
  ];

  DEMO_APPLICATIONS.forEach(function (application) {
    application.review = createReview(application.channel);
  });

  function normalize(application) {
    var item = Object.assign({
      formData: {}, documents: {}, submissionVersion: 0, submittedAt: "", reviewedAt: ""
    }, clone(application || {}));
    var defaultReview = createReview(item.channel);
    item.review = Object.assign(defaultReview, item.review || {});
    item.review.sections = Object.assign(defaultReview.sections, (item.review && item.review.sections) || {});
    return item;
  }

  function readSaved() {
    try {
      var saved = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved.map(normalize) : [];
    } catch (error) {
      return [];
    }
  }

  function loadApplications() {
    var merged = {};
    DEMO_APPLICATIONS.forEach(function (item) { merged[item.applicationId] = normalize(item); });
    readSaved().forEach(function (item) {
      var base = merged[item.applicationId] || {};
      merged[item.applicationId] = normalize(Object.assign({}, base, item, {
        formData: Object.assign({}, base.formData || {}, item.formData || {}),
        documents: Object.assign({}, base.documents || {}, item.documents || {}),
        review: Object.assign({}, base.review || {}, item.review || {}, {
          sections: Object.assign({}, (base.review && base.review.sections) || {}, (item.review && item.review.sections) || {})
        })
      }));
    });
    return Object.keys(merged).map(function (id) { return merged[id]; });
  }

  function saveApplications(applications) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify((applications || []).map(normalize)));
  }

  function findApplication(applicationId) {
    return loadApplications().find(function (item) { return item.applicationId === applicationId; }) || null;
  }

  function upsertApplication(application) {
    var applications = loadApplications();
    var normalized = normalize(application);
    var index = applications.findIndex(function (item) { return item.applicationId === normalized.applicationId; });
    if (index >= 0) applications[index] = normalized;
    else applications.unshift(normalized);
    saveApplications(applications);
    return normalized;
  }

  function serializeForm(form) {
    var values = {};
    Array.prototype.forEach.call(form.elements, function (control) {
      if (!control.name || control.type === "file" || control.type === "submit" || control.type === "button") return;
      if ((control.type === "checkbox" || control.type === "radio") && !control.checked) return;
      if (Object.prototype.hasOwnProperty.call(values, control.name)) {
        values[control.name] = Array.isArray(values[control.name]) ? values[control.name].concat(control.value) : [values[control.name], control.value];
      } else {
        values[control.name] = control.value;
      }
    });
    return values;
  }

  function restoreForm(form, values) {
    if (!form || !values) return;
    if (Object.prototype.hasOwnProperty.call(values, "additionalOwnerCount")) {
      var count = form.elements.namedItem("additionalOwnerCount");
      if (count) {
        count.value = values.additionalOwnerCount;
        count.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    Object.keys(values).forEach(function (name) {
      var named = form.elements.namedItem(name);
      var controls = named && typeof named.length === "number" && !named.tagName ? Array.prototype.slice.call(named) : (named ? [named] : []);
      var saved = Array.isArray(values[name]) ? values[name].map(String) : [String(values[name])];
      controls.forEach(function (control) {
        if (control.type === "checkbox" || control.type === "radio") control.checked = saved.indexOf(control.value) !== -1;
        else if (control.type !== "file") control.value = saved[0];
      });
    });
  }

  function collectDocuments(form, existing) {
    var documents = clone(existing || {});
    form.querySelectorAll('input[type="file"][name]').forEach(function (input) {
      if (!input.files || !input.files.length) return;
      documents[input.name] = Array.prototype.map.call(input.files, function (file) {
        return { name: file.name, type: file.type || "application/octet-stream", size: file.size || 0 };
      });
    });
    return documents;
  }

  function applyDocuments(form, documents) {
    form.querySelectorAll('input[type="file"][name]').forEach(function (input) {
      var files = (documents && documents[input.name]) || [];
      if (!files.length) return;
      input.required = false;
      input.setAttribute("data-existing-document", "true");
      var card = input.closest(".upload-card");
      if (card) {
        card.classList.add("has-file");
        var fileName = card.querySelector("[data-file-name]");
        if (fileName) fileName.textContent = files.map(function (file) { return file.name; }).join(", ");
      }
    });
  }

  global.PaywizardOnboardingStore = {
    key: STORAGE_KEY,
    sectionsForChannel: function (channel) { return (SECTION_IDS[channel] || []).slice(); },
    createReview: createReview,
    demos: function () { return clone(DEMO_APPLICATIONS); },
    loadApplications: loadApplications,
    saveApplications: saveApplications,
    findApplication: findApplication,
    upsertApplication: upsertApplication,
    serializeForm: serializeForm,
    restoreForm: restoreForm,
    collectDocuments: collectDocuments,
    applyDocuments: applyDocuments,
    timestamp: timestamp
  };
})(window);
