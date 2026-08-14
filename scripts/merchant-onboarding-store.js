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

  var STATUS_SEQUENCE = ["Draft", "Awaiting Merchant", "Merchant Draft", "Merchant Submit", "Under Review"];

  function statusEvent(status, occurredAt, actor, submissionVersion, suffix, inferred) {
    var event = {
      eventId: "EVT-" + String(occurredAt || timestamp()).replace(/\D/g, "") + "-" + (suffix || Math.random().toString(36).slice(2, 8)),
      status: status,
      occurredAt: occurredAt || timestamp(),
      actor: actor || "Platform",
      submissionVersion: Number(submissionVersion || 0)
    };
    if (inferred) event.inferred = true;
    return event;
  }

  function parseTimestamp(value) {
    var parsed = new Date(String(value || "").replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatTimestamp(date) {
    function pad(value) { return String(value).padStart(2, "0"); }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function requiredStatuses(status) {
    if (status === "Merchant Created") return STATUS_SEQUENCE.concat(["Approved", "Merchant Created"]);
    var decision = status === "Approved" || status === "Returned" ? status : "";
    var rank = decision ? STATUS_SEQUENCE.length - 1 : STATUS_SEQUENCE.indexOf(status);
    if (rank < 0) return [];
    var statuses = STATUS_SEQUENCE.slice(0, rank + 1);
    if (decision) statuses.push(decision);
    return statuses;
  }

  function actorForStatus(status) {
    if (status === "Draft" || status === "Awaiting Merchant" || status === "Merchant Created") return "Platform";
    if (status === "Merchant Draft" || status === "Merchant Submit") return "Merchant";
    return "Operations";
  }

  function versionForStatus(application, status) {
    return status === "Merchant Submit" || status === "Under Review" || status === "Approved" || status === "Returned" || status === "Merchant Created"
      ? Number(application.submissionVersion || 1) : 0;
  }

  function inferredTime(events, statuses, missingIndex, fallback) {
    var previous;
    var next;
    events.forEach(function (event) {
      var eventIndex = statuses.indexOf(event.status);
      if (eventIndex < 0) return;
      if (eventIndex < missingIndex && (!previous || eventIndex > previous.index)) previous = { index: eventIndex, event: event };
      if (eventIndex > missingIndex && (!next || eventIndex < next.index)) next = { index: eventIndex, event: event };
    });
    var previousDate = previous && parseTimestamp(previous.event.occurredAt);
    var nextDate = next && parseTimestamp(next.event.occurredAt);
    if (previousDate && nextDate && nextDate.getTime() > previousDate.getTime()) {
      var fraction = (missingIndex - previous.index) / (next.index - previous.index);
      return formatTimestamp(new Date(previousDate.getTime() + Math.floor((nextDate.getTime() - previousDate.getTime()) * fraction)));
    }
    if (nextDate) return formatTimestamp(new Date(nextDate.getTime() - ((next.index - missingIndex) * 60000)));
    if (previousDate) return formatTimestamp(new Date(previousDate.getTime() + ((missingIndex - previous.index) * 60000)));
    var fallbackDate = parseTimestamp(fallback) || new Date();
    return formatTimestamp(new Date(fallbackDate.getTime() - ((statuses.length - 1 - missingIndex) * 60000)));
  }

  function completeHistory(application) {
    var statuses = requiredStatuses(application.status);
    var events = Array.isArray(application.statusHistory) ? application.statusHistory : [];
    statuses.forEach(function (status, index) {
      if (events.some(function (event) { return event.status === status; })) return;
      events.push(statusEvent(
        status,
        inferredTime(events, statuses, index, application.lastUpdate),
        actorForStatus(status),
        versionForStatus(application, status),
        "inferred-" + index,
        true
      ));
    });
    application.statusHistory = events.sort(function (left, right) {
      return String(left.occurredAt).localeCompare(String(right.occurredAt));
    });
    return application;
  }

  function inferHistory(application) {
    var item = application || {};
    var events = [];
    function add(status, occurredAt, actor, version) {
      if (!occurredAt) return;
      events.push(statusEvent(status, occurredAt, actor, version, "migrated-" + events.length));
    }
    if (item.status === "Draft") add("Draft", item.lastUpdate, "Platform", 0);
    if (item.status === "Awaiting Merchant") add("Awaiting Merchant", item.lastUpdate, "Platform", 0);
    if (item.status === "Merchant Draft") add("Merchant Draft", item.lastUpdate, "Merchant", 0);
    if (item.submittedAt) add("Merchant Submit", item.submittedAt, "Merchant", item.submissionVersion || 1);
    var sectionTimes = Object.keys((item.review && item.review.sections) || {}).map(function (id) {
      return item.review.sections[id].reviewedAt || "";
    }).filter(Boolean).sort();
    if (item.status === "Under Review") add("Under Review", sectionTimes[0] || item.lastUpdate, "Operations", item.submissionVersion || 1);
    if (item.status === "Approved" || item.status === "Returned" || item.status === "Merchant Created") {
      if (sectionTimes.length) add("Under Review", sectionTimes[0], "Operations", item.submissionVersion || 1);
      if (item.status === "Merchant Created") {
        add("Approved", item.reviewedAt || (item.review && item.review.reviewedAt), "Operations", item.submissionVersion || 1);
        add("Merchant Created", item.merchantCreatedAt || item.lastUpdate, "Platform", item.submissionVersion || 1);
      } else {
        add(item.status, item.reviewedAt || (item.review && item.review.reviewedAt) || item.lastUpdate, "Operations", item.submissionVersion || 1);
      }
    }
    if (!events.length && item.status && item.lastUpdate) add(item.status, item.lastUpdate, item.status.indexOf("Merchant") === 0 ? "Merchant" : "Platform", item.submissionVersion || 0);
    return events.sort(function (left, right) { return left.occurredAt.localeCompare(right.occurredAt); });
  }

  function recordStatus(application, nextStatus, actor, occurredAt) {
    var item = application;
    item.statusHistory = Array.isArray(item.statusHistory) ? item.statusHistory : [];
    var currentStatus = item.status;
    var shouldRecord = currentStatus !== nextStatus || !item.statusHistory.length;
    item.status = nextStatus;
    item.lastUpdate = occurredAt || timestamp();
    if (shouldRecord) item.statusHistory.push(statusEvent(nextStatus, item.lastUpdate, actor, item.submissionVersion));
    return completeHistory(item);
  }

  function publicProgress(application) {
    if (!application) return null;
    return {
      applicationId: application.applicationId,
      processId: application.processId,
      merchantName: application.merchantName,
      channel: application.channel,
      status: application.status,
      submissionVersion: Number(application.submissionVersion || 0),
      statusHistory: clone(application.statusHistory || [])
    };
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

  DEMO_APPLICATIONS[0].statusHistory = [
    statusEvent("Draft", "2026-08-08 09:18:12", "Platform", 0, "nuvei-1"),
    statusEvent("Awaiting Merchant", "2026-08-08 10:02:44", "Platform", 0, "nuvei-2"),
    statusEvent("Merchant Draft", "2026-08-10 14:27:19", "Merchant", 0, "nuvei-3"),
    statusEvent("Merchant Submit", "2026-08-12 16:42:08", "Merchant", 1, "nuvei-4")
  ];
  DEMO_APPLICATIONS[1].statusHistory = [
    statusEvent("Draft", "2026-08-07 11:06:30", "Platform", 0, "elavon-1"),
    statusEvent("Awaiting Merchant", "2026-08-07 11:32:05", "Platform", 0, "elavon-2"),
    statusEvent("Merchant Draft", "2026-08-09 15:48:51", "Merchant", 0, "elavon-3"),
    statusEvent("Merchant Submit", "2026-08-12 16:36:24", "Merchant", 1, "elavon-4")
  ];

  var LEGACY_APPLICATIONS = [
    { processId: "00000336", merchantName: "techsupport", email: "maggie-support1@wizarpos.com", status: "Draft", channel: "Nuvei", country: "Canada", currency: "CAD", lastUpdate: "2026-05-14 14:22:27" },
    { processId: "00000328", merchantName: "ceshi123213243234", email: "uat2512003@nooboy.com", mid: "mid12320251229", status: "Approved", channel: "Elavon EU", country: "Ireland", currency: "EUR", lastUpdate: "2025-12-29 15:29:41" },
    { processId: "00000205", merchantName: "Merchant name1", email: "uat2512002@nooboy.com", status: "Under Review", channel: "Nuvei", country: "Canada", currency: "CAD", lastUpdate: "2025-12-29 14:40:21" },
    { processId: "00000318", merchantName: "ceshi251030", email: "ceshi251030@gmail.com", status: "Merchant Submit", channel: "Elavon EU", country: "Ireland", currency: "EUR", lastUpdate: "2026-01-23 17:36:35" },
    { processId: "00000277", merchantName: "ceshi001", email: "1212123@163.com", status: "Draft", channel: "Nuvei", country: "Canada", currency: "CAD", lastUpdate: "2025-09-05 13:17:30" },
    { processId: "00000274", merchantName: "FISERV PROD TEST", email: "2987116030@qq.com", mid: "266482540884", status: "Approved", channel: "Elavon EU", country: "France", currency: "EUR", lastUpdate: "2025-07-22 13:13:33" },
    { processId: "00000201", merchantName: "天猫小店", email: "wang@hotmail.com", status: "Draft", channel: "Nuvei", country: "Canada", currency: "CAD", lastUpdate: "2025-03-19 19:26:53" },
    { processId: "00000199", merchantName: "IFS Shop Mall", email: "Zhang.Mingle@gmail.com", mid: "Test20250211", status: "Approved", channel: "Elavon EU", country: "Ireland", currency: "EUR", lastUpdate: "2025-02-11 09:42:34" },
    { processId: "00000098", merchantName: "MRCHTApply", email: "18892828893@qq.cn", status: "Merchant Submit", channel: "Nuvei", country: "Canada", currency: "CAD", lastUpdate: "2025-01-15 14:06:29" },
    { processId: "-", merchantName: "CESHI", email: "1778883@qq.com", status: "Under Review", channel: "Elavon EU", country: "Ireland", currency: "EUR", lastUpdate: "2025-01-15 13:57:22" }
  ];

  LEGACY_APPLICATIONS.forEach(function (seed, index) {
    var template = DEMO_APPLICATIONS[seed.channel === "Nuvei" ? 0 : 1];
    var application = clone(template);
    application.applicationId = "APP-LEGACY-" + String(index + 1).padStart(2, "0");
    application.processId = seed.processId;
    application.merchantName = seed.merchantName;
    application.email = seed.email;
    application.mid = seed.mid || "-";
    application.status = seed.status;
    application.channel = seed.channel;
    application.country = seed.country;
    application.currency = seed.currency;
    application.lastUpdate = seed.lastUpdate;
    application.contactName = seed.merchantName + " Contact";
    application.formData = Object.assign({}, application.formData, seed.channel === "Nuvei" ? {
      legalName: seed.merchantName,
      dbaName: seed.merchantName,
      statementEmail: seed.email
    } : {
      registeredBusinessName: seed.merchantName,
      dbaName: seed.merchantName,
      companyEmail: seed.email,
      statementEmail: seed.email
    });
    application.review = createReview(seed.channel);
    application.statusHistory = [];
    application.reusableDemoCreate = seed.processId === "00000328";
    application.submittedAt = seed.status === "Merchant Submit" ? seed.lastUpdate : "";
    application.submissionVersion = seed.status === "Draft" || seed.status === "Awaiting Merchant" || seed.status === "Merchant Draft" ? 0 : 1;
    if (seed.status === "Approved") {
      Object.keys(application.review.sections).forEach(function (id) {
        application.review.sections[id].status = "approved";
        application.review.sections[id].reviewedAt = seed.lastUpdate;
      });
      application.review.reviewedAt = seed.lastUpdate;
      application.reviewedAt = seed.lastUpdate;
    } else if (seed.status === "Under Review") {
      var firstSection = Object.keys(application.review.sections)[0];
      application.review.sections[firstSection].status = "approved";
      application.review.sections[firstSection].reviewedAt = seed.lastUpdate;
    }
    application.shareUrl = (seed.channel === "Nuvei" ? "38.Merchant_onboard_nuvei_public.html" : "38.Merchant_onboard_elavon_public.html") + "?applicationId=" + encodeURIComponent(application.applicationId);
    if (seed.status === "Draft") {
      application.formData = {};
      application.documents = {};
    }
    DEMO_APPLICATIONS.push(application);
  });

  DEMO_APPLICATIONS.forEach(function (application) {
    if (!application.review) application.review = createReview(application.channel);
  });

  function normalize(application) {
    var item = Object.assign({
      formData: {}, documents: {}, submissionVersion: 0, submittedAt: "", reviewedAt: "", merchantCreatedAt: "", statusHistory: []
    }, clone(application || {}));
    var defaultReview = createReview(item.channel);
    item.review = Object.assign(defaultReview, item.review || {});
    item.review.sections = Object.assign(defaultReview.sections, (item.review && item.review.sections) || {});
    item.statusHistory = Array.isArray(item.statusHistory) && item.statusHistory.length ? item.statusHistory : inferHistory(item);
    completeHistory(item);
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
    return Object.keys(merged).map(function (id) { return merged[id]; }).sort(function (left, right) {
      return String(right.lastUpdate || "").localeCompare(String(left.lastUpdate || ""));
    });
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
    recordStatus: recordStatus,
    getPublicProgress: function (applicationId) { return publicProgress(findApplication(applicationId)); },
    publicProgress: publicProgress,
    timestamp: timestamp
  };
})(window);
