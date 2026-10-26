(function (global) {
  "use strict";

  var leadStatus = global.PaywizardLeadStatus;
  var STORAGE_KEY = "paywizard-upt-lead-overrides-v1";

  var records = [
    {
      processId: "00000440", spName: "wizarpos", partnerName: "广州新勇隆智能设备有限公司",
      createTime: "2026-05-27T06:25:04Z",
      country: "United States of America", region: "California", merchantName: "Brittney Rodriguez",
      terminalNumber: 0, contactName: "Brittney Rodriguez", email: "therosebar@outlook.com",
      phone: "+1 415 555 0148", lastUpdate: "2026-05-29 14:25:04", pastDays: 1, status: "Awaiting Customer Response",
      leadOwner: "Olivia Chen", leadResource: "Referral Partners", merchantVertical: "Specialty Retail",
      attendant: "Unattended", dispatchTime: "2026-06-03", arrivalTime: "Pending",
      vendingMachineType: "Compact retail vending kiosk", outreachContact: "Email preferred",
      decisionMaker: { name: "Brittney Rodriguez", email: "therosebar@outlook.com", phone: "+1 415 555 0148" },
      secondDecisionMaker: { name: "Marcus Lee", email: "marcus.lee@therosebar.com", phone: "+1 415 555 0172" },
      notes: "Merchant is confirming the first deployment location before requesting terminal serial numbers.",
      attachments: [{ name: "storefront_layout.pdf", type: "PDF", size: "184 KB" }],
      processing: { averagePrice: "$18.00", minimumPrice: "$6.00", maximumPrice: "$48.00", monthlyVolume: "$12,500", additionalInformation: "Initial location is expected to operate seven days per week." },
      serialNumbers: []
    },
    {
      processId: "00000439", spName: "wizarpos", partnerName: "上海比至",
      createTime: "2026-05-26T10:04:26Z",
      country: "United States of America", region: "Nevada", merchantName: "Jeeves Vending",
      terminalNumber: 12, contactName: "Gary Stryder", email: "Gary@jeevesvending.com",
      phone: "+1 702 555 0184", lastUpdate: "2026-05-28 18:04:26", pastDays: 1, status: "Awaiting Customer Response",
      leadOwner: "Oliver Smith", leadResource: "Referral Partners", merchantVertical: "Vending",
      attendant: "Unattended", dispatchTime: "2026-05-30", arrivalTime: "2026-06-04",
      vendingMachineType: "Snack and beverage vending machine", outreachContact: "Gary Stryder",
      decisionMaker: { name: "Gary Stryder", email: "Gary@jeevesvending.com", phone: "+1 702 555 0184" },
      secondDecisionMaker: { name: "Lena Brooks", email: "lena@jeevesvending.com", phone: "+1 702 555 0129" },
      notes: "Twelve terminals are planned across the Las Vegas office campus rollout.",
      attachments: [{ name: "jeeves_machine_photo.jpg", type: "JPG", size: "612 KB" }],
      processing: { averagePrice: "$4.50", minimumPrice: "$1.50", maximumPrice: "$12.00", monthlyVolume: "$8,700", additionalInformation: "Card-present unattended retail profile requested." },
      serialNumbers: ["WP5305UQ33200439"]
    },
    {
      processId: "00000438", spName: "wizarpos", partnerName: "IMT",
      createTime: "2026-05-25T07:34:29Z",
      country: "Mongolia", region: "Ulaanbaatar", merchantName: "Steppe Arena LLC",
      terminalNumber: 14, contactName: "Khaliun Maitsetseg", email: "khaliun.m@steppeholding.mn",
      phone: "+976 7011 4388", lastUpdate: "2026-05-28 15:34:29", pastDays: 2, status: "Awaiting Customer Response",
      leadOwner: "Olivia Chen", leadResource: "Referral Partners", merchantVertical: "Entertainment Venue",
      attendant: "Mixed", dispatchTime: "2026-06-01", arrivalTime: "2026-06-08",
      vendingMachineType: "Arena food and merchandise kiosks", outreachContact: "Khaliun Maitsetseg",
      decisionMaker: { name: "Khaliun Maitsetseg", email: "khaliun.m@steppeholding.mn", phone: "+976 7011 4388" },
      secondDecisionMaker: { name: "Temuulen Bat", email: "temuulen.b@steppeholding.mn", phone: "+976 7011 4312" },
      notes: "Fourteen terminals are allocated across the arena concourse and premium areas.",
      attachments: [{ name: "arena_kiosk_plan.pdf", type: "PDF", size: "428 KB" }],
      processing: { averagePrice: "$11.00", minimumPrice: "$3.00", maximumPrice: "$65.00", monthlyVolume: "$31,000", additionalInformation: "Seasonal event peaks expected during weekends." },
      serialNumbers: ["WP5305UQ33200438", "WP5305UQ33210438"]
    },
    {
      processId: "00000437", spName: "wizarpos", partnerName: "苏州咔咔电子有限公司",
      createTime: "2026-05-24T08:40:12Z",
      country: "Mexico", region: "Jalisco", merchantName: "Pasiflor",
      terminalNumber: 1, contactName: "Angela Alanis", email: "alanis.komi@gmail.com",
      phone: "+52 33 5550 0437", lastUpdate: "2026-05-27 16:40:12", pastDays: 2, status: "Onboarding in Progress",
      leadOwner: "Oliver Smith", leadResource: "Referral Partners", merchantVertical: "Food Service",
      attendant: "Unattended", dispatchTime: "2026-06-02", arrivalTime: "2026-06-09",
      vendingMachineType: "Fresh flower and gift vending machine", outreachContact: "Angela Alanis",
      decisionMaker: { name: "Angela Alanis", email: "alanis.komi@gmail.com", phone: "+52 33 5550 0437" },
      secondDecisionMaker: { name: "Diego Flores", email: "diego@pasiflor.mx", phone: "+52 33 5550 0471" },
      notes: "Negotiating the initial transaction rate for a single pilot terminal.",
      attachments: [{ name: "pasiflor_catalog.pdf", type: "PDF", size: "294 KB" }],
      processing: { averagePrice: "$22.00", minimumPrice: "$8.00", maximumPrice: "$85.00", monthlyVolume: "$16,800", additionalInformation: "Transactions will be denominated in MXN." },
      serialNumbers: ["WP5305UQ33200437"]
    },
    {
      processId: "00000436", spName: "wizarpos", partnerName: "星云开物",
      createTime: "2026-05-23T11:10:01Z",
      country: "Russian Federation", region: "Moscow", merchantName: "OOO ДУН ТУ",
      terminalNumber: 16, contactName: "Анна", email: "sales1@ogawa-market.ru",
      phone: "+7 495 555 0436", lastUpdate: "2026-05-26 19:10:01", pastDays: 3, status: "Awaiting Customer Response",
      leadOwner: "Olivia Chen", leadResource: "Referral Partners", merchantVertical: "Wellness Retail",
      attendant: "Unattended", dispatchTime: "2026-05-31", arrivalTime: "2026-06-07",
      vendingMachineType: "Massage product retail kiosk", outreachContact: "Анна",
      decisionMaker: { name: "Анна Петрова", email: "sales1@ogawa-market.ru", phone: "+7 495 555 0436" },
      secondDecisionMaker: { name: "Иван Соколов", email: "ivan@ogawa-market.ru", phone: "+7 495 555 0476" },
      notes: "Sixteen kiosks will be installed across multiple shopping centers.",
      attachments: [{ name: "machine_specification.pdf", type: "PDF", size: "356 KB" }],
      processing: { averagePrice: "$35.00", minimumPrice: "$12.00", maximumPrice: "$120.00", monthlyVolume: "$24,500", additionalInformation: "Merchant requests receipt delivery by email." },
      serialNumbers: ["WP5305UQ33200436", "WP5305UQ33210436"]
    },
    {
      processId: "00000434", spName: "wizarpos", partnerName: "爆米发",
      createTime: "2026-05-21T13:34:43Z",
      country: "Indonesia", region: "East Java", merchantName: "PNDW Station",
      terminalNumber: 18, contactName: "Wahyu Yudhistira Tafrikun", email: "cvlabmanusiawangi@gmail.com",
      phone: "+62 31 555 0434", lastUpdate: "2026-05-23 21:34:43", pastDays: 6, status: "Awaiting Customer Response",
      leadOwner: "Oliver Smith", leadResource: "Referral Partners", merchantVertical: "Food and Beverage",
      attendant: "Unattended", dispatchTime: "2026-05-29", arrivalTime: "2026-06-05",
      vendingMachineType: "Popcorn vending machine", outreachContact: "Wahyu Yudhistira Tafrikun",
      decisionMaker: { name: "Wahyu Yudhistira Tafrikun", email: "cvlabmanusiawangi@gmail.com", phone: "+62 31 555 0434" },
      secondDecisionMaker: { name: "Putri Lestari", email: "putri@pndwstation.id", phone: "+62 31 555 0484" },
      notes: "Eighteen terminals are planned for the Surabaya station network rollout.",
      attachments: [{ name: "pndw_station_site.jpg", type: "JPG", size: "731 KB" }],
      processing: { averagePrice: "$3.25", minimumPrice: "$2.00", maximumPrice: "$7.00", monthlyVolume: "$6,200", additionalInformation: "High evening and weekend transaction concentration." },
      serialNumbers: ["WP5305UQ33200434"]
    },
    {
      processId: "00000433", spName: "wizarpos", partnerName: "IMT",
      createTime: "2026-05-20T01:21:24Z",
      country: "Russian Federation", region: "Saint Petersburg", merchantName: "Mamian Diana",
      terminalNumber: 2, contactName: "Mamian Diana", email: "MD-1212@yandex.ru",
      phone: "+7 812 555 0433", lastUpdate: "2026-05-23 09:21:24", pastDays: 7, status: "Awaiting Customer Response",
      leadOwner: "Olivia Chen", leadResource: "Referral Partners", merchantVertical: "Beauty Services",
      attendant: "Attended", dispatchTime: "2026-05-28", arrivalTime: "2026-06-03",
      vendingMachineType: "Beauty product dispensing kiosk", outreachContact: "Mamian Diana",
      decisionMaker: { name: "Mamian Diana", email: "MD-1212@yandex.ru", phone: "+7 812 555 0433" },
      secondDecisionMaker: { name: "Elena Morozova", email: "elena@mamian.ru", phone: "+7 812 555 0473" },
      notes: "Two counters will share one merchant profile.",
      attachments: [{ name: "store_locations.xlsx", type: "XLSX", size: "96 KB" }],
      processing: { averagePrice: "$28.00", minimumPrice: "$9.00", maximumPrice: "$95.00", monthlyVolume: "$19,400", additionalInformation: "Attended retail configuration with tipping disabled." },
      serialNumbers: ["WP5305UQ33200433", "WP5305UQ33210433"]
    },
    {
      processId: "00000432", spName: "wizarpos", partnerName: "广州鼎乐",
      createTime: "2026-05-19T11:44:05Z",
      country: "Russian Federation", region: "Krasnodar Krai", merchantName: "Cotton candy",
      terminalNumber: 1, contactName: "Aleksandr Durmanenko", email: "Rufu012@Gmail.com",
      phone: "+7 861 555 0432", lastUpdate: "2026-05-21 19:44:05", pastDays: 8, status: "Onboarding in Progress",
      leadOwner: "Oliver Smith", leadResource: "Referral Partners", merchantVertical: "Amusement",
      attendant: "Unattended", dispatchTime: "2026-05-27", arrivalTime: "2026-06-02",
      vendingMachineType: "Cotton candy vending machine", outreachContact: "Aleksandr Durmanenko",
      decisionMaker: { name: "Aleksandr Durmanenko", email: "Rufu012@Gmail.com", phone: "+7 861 555 0432" },
      secondDecisionMaker: { name: "Irina Volkova", email: "irina@cottoncandy.ru", phone: "+7 861 555 0472" },
      notes: "Commercial terms remain under negotiation.",
      attachments: [{ name: "cotton_candy_machine.png", type: "PNG", size: "484 KB" }],
      processing: { averagePrice: "$5.00", minimumPrice: "$3.00", maximumPrice: "$8.00", monthlyVolume: "$7,900", additionalInformation: "Machine is deployed in a family entertainment center." },
      serialNumbers: ["WP5305UQ33200432"]
    },
    {
      processId: "00000431", spName: "wizarpos", partnerName: "上海比至",
      createTime: "2026-05-18T03:52:47Z",
      country: "United States of America", region: "Texas", merchantName: "Jeeves Vending",
      terminalNumber: 20, contactName: "Gary Stryder", email: "Gary@jeevesvending.com",
      phone: "+1 214 555 0431", lastUpdate: "2026-05-21 11:52:47", pastDays: 9, status: "Awaiting Customer Response",
      leadOwner: "Olivia Chen", leadResource: "Referral Partners", merchantVertical: "Vending",
      attendant: "Unattended", dispatchTime: "2026-05-26", arrivalTime: "2026-06-01",
      vendingMachineType: "Snack, beverage and coffee vending machines", outreachContact: "Gary Stryder",
      decisionMaker: { name: "Gary Stryder", email: "Gary@jeevesvending.com", phone: "+1 214 555 0431" },
      secondDecisionMaker: { name: "Lena Brooks", email: "lena@jeevesvending.com", phone: "+1 214 555 0471" },
      notes: "Twenty terminals are planned across three office campuses.",
      attachments: [{ name: "jeeves_texas_rollout.pdf", type: "PDF", size: "522 KB" }, { name: "terminal_locations.xlsx", type: "XLSX", size: "108 KB" }],
      processing: { averagePrice: "$4.75", minimumPrice: "$1.25", maximumPrice: "$14.00", monthlyVolume: "$41,300", additionalInformation: "Consolidated reporting requested for all five terminals." },
      serialNumbers: ["WP5305UQ33200431", "WP5305UQ33210431", "WP5305UQ33220431", "WP5305UQ33230431", "WP5305UQ33240431"]
    },
    {
      processId: "00000430", spName: "wizarpos", partnerName: "河北盛马",
      createTime: "2026-05-17T08:54:08Z",
      country: "Singapore", region: "Central Region", merchantName: "LUMINA VOYAGE TECH PTE. LTD",
      terminalNumber: 24, contactName: "Guoqi Yu", email: "yugq2022@gmail.com",
      phone: "+65 6555 0430", lastUpdate: "2026-05-20 16:54:08", pastDays: 9, status: "Onboarding in Progress",
      leadOwner: "Oliver Smith", leadResource: "Referral Partners", merchantVertical: "Travel Retail",
      attendant: "Attended", dispatchTime: "2026-05-25", arrivalTime: "2026-05-31",
      vendingMachineType: "Travel accessory retail kiosk", outreachContact: "Guoqi Yu",
      decisionMaker: { name: "Guoqi Yu", email: "yugq2022@gmail.com", phone: "+65 6555 0430" },
      secondDecisionMaker: { name: "Alicia Tan", email: "alicia@luminavoyage.sg", phone: "+65 6555 0470" },
      notes: "Commercial review is in progress for a twenty-four-terminal airport rollout.",
      attachments: [{ name: "airport_kiosk_proposal.pdf", type: "PDF", size: "638 KB" }],
      processing: { averagePrice: "$32.00", minimumPrice: "$10.00", maximumPrice: "$140.00", monthlyVolume: "$27,600", additionalInformation: "Attended travel retail setup with SGD settlement." },
      serialNumbers: ["WP5305UQ33200430"]
    }
  ];

  var sampleTerminalTargets = {
    "00000439": 12,
    "00000438": 14,
    "00000436": 16,
    "00000434": 18,
    "00000431": 20,
    "00000430": 24
  };

  function generatedSerialNumber(processId, ordinal) {
    return "PW" + String(processId).slice(-6) + String(ordinal).padStart(8, "0");
  }

  records.forEach(function (record) {
    var target = sampleTerminalTargets[record.processId];
    if (!target) return;
    while (record.serialNumbers.length < target) {
      record.serialNumbers.push(generatedSerialNumber(record.processId, record.serialNumbers.length + 1));
    }
    record.terminalNumber = record.serialNumbers.length;
  });

  var byProcessId = records.reduce(function (result, record) {
    result[record.processId] = record;
    return result;
  }, {});

  var currencyByCountry = {
    "United States of America": "USD",
    "Mexico": "MXN",
    "Mongolia": "MNT",
    "Russian Federation": "RUB",
    "Indonesia": "IDR",
    "Singapore": "SGD"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeSerialNumbers(seedValues, overrideValues) {
    var seen = {};
    return (seedValues || []).concat(overrideValues || []).reduce(function (result, value) {
      var serialNumber = String(value || "").trim().toUpperCase();
      if (!serialNumber || seen[serialNumber]) return result;
      seen[serialNumber] = true;
      result.push(serialNumber);
      return result;
    }, []);
  }

  function readOverrides() {
    try {
      var value = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
      return {};
    }
  }

  function getByProcessId(processId) {
    var id = String(processId || "");
    if (!/^\d{8}$/.test(id)) return null;
    var override = readOverrides()[id] || {};
    var seed = byProcessId[id] || (override.createdLead === true ? override : null);
    if (!seed) return null;
    var merged = Object.assign({}, clone(seed), clone(override));
    merged.legacyEditingBlocked = Boolean(merged.legacyEditingBlocked || String(merged.status) === "6");
    merged.status = leadStatus.normalize(merged.status);
    merged.serialNumbers = mergeSerialNumbers(
      seed.serialNumbers,
      Array.isArray(override.serialNumbers) ? override.serialNumbers : []
    );
    var savedAssignments = override.snAssignments && typeof override.snAssignments === "object" && !Array.isArray(override.snAssignments)
      ? override.snAssignments
      : {};
    merged.snAssignments = {};
    merged.serialNumbers.forEach(function (serialNumber) {
      var assignment = savedAssignments[serialNumber];
      if (!assignment || typeof assignment !== "object") return;
      merged.snAssignments[serialNumber] = {
        sn: serialNumber,
        merchantName: String(assignment.merchantName || ""),
        storeName: String(assignment.storeName || ""),
        assignedAt: String(assignment.assignedAt || ""),
        scenario: assignment.scenario,
        cardless: assignment.cardless,
        routing: assignment.routing
      };
    });
    merged.terminalNumber = merged.serialNumbers.length;
    merged.assignedSnCount = Object.keys(merged.snAssignments).length;
    merged.currency = merged.currency || currencyByCountry[merged.country] || "";
    return merged;
  }

  function getRecords() {
    var overrides = readOverrides();
    var added = Object.keys(overrides).filter(function (id) { return !byProcessId[id] && overrides[id] && overrides[id].createdLead === true; }).sort().reverse();
    return added.concat(records.map(function (record) { return record.processId; })).map(getByProcessId).filter(Boolean);
  }

  function parseSerialNumbers(rawValue) {
    return String(rawValue || "")
      .split(/[\n,]+/)
      .map(function (value) { return value.trim().toUpperCase(); })
      .filter(Boolean);
  }

  function validateSerialNumbers(processId, rawValue) {
    var values = Array.isArray(rawValue)
      ? rawValue.map(function (value) { return String(value || "").trim().toUpperCase(); }).filter(Boolean)
      : parseSerialNumbers(rawValue);
    if (!values.length) return { valid: false, values: [], error: "Enter at least one SN." };
    var invalid = values.find(function (value) { return !/^[A-Z0-9]{16}$/.test(value); });
    if (invalid) return { valid: false, values: values, error: invalid + " must be exactly 16 letters or numbers." };
    var batchSeen = {};
    var duplicateInBatch = values.find(function (value) {
      if (batchSeen[value]) return true;
      batchSeen[value] = true;
      return false;
    });
    if (duplicateInBatch) return { valid: false, values: values, error: duplicateInBatch + " is repeated in this batch." };
    var used = {};
    getRecords().forEach(function (record) {
      record.serialNumbers.forEach(function (value) { used[String(value).toUpperCase()] = record.processId; });
    });
    var duplicate = values.find(function (value) { return used[value]; });
    if (duplicate) return { valid: false, values: values, error: duplicate + " is already assigned to Lead " + used[duplicate] + "." };
    if (!getByProcessId(processId)) return { valid: false, values: values, error: "Lead not found." };
    return { valid: true, values: values, error: "" };
  }

  function addSerialNumbers(processId, rawValue) {
    var validation = validateSerialNumbers(processId, rawValue);
    if (!validation.valid) return validation;
    var id = String(processId || "");
    var current = getByProcessId(id);
    var overrides = readOverrides();
    var serialNumbers = current.serialNumbers.concat(validation.values);
    overrides[id] = Object.assign({}, overrides[id] || {}, {
      serialNumbers: serialNumbers,
      terminalNumber: serialNumbers.length,
      updatedAt: new Date().toISOString()
    });
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch (error) {
      return { valid: false, values: validation.values, error: "Unable to save SNs in this browser." };
    }
    return { valid: true, values: validation.values, record: getByProcessId(id), error: "" };
  }

  function assignSerialNumbers(processId, merchantName, storeName, serialNumbers, capabilities) {
    var id = String(processId || "");
    var current = getByProcessId(id);
    var merchant = String(merchantName || "").trim();
    var store = String(storeName || "").trim();
    var selected = Array.isArray(serialNumbers)
      ? serialNumbers.map(function (value) { return String(value || "").trim().toUpperCase(); }).filter(Boolean)
      : [];
    if (!current) return { valid: false, error: "Lead not found." };
    if (!merchant) return { valid: false, error: "Select or enter a merchant name." };
    if (!store) return { valid: false, error: "Select or enter a store name." };
    if (!selected.length) return { valid: false, error: "Select at least one unassigned SN." };
    var available = {};
    current.serialNumbers.forEach(function (value) { available[value] = true; });
    var invalid = selected.find(function (value) { return !available[value]; });
    if (invalid) return { valid: false, error: invalid + " does not belong to this Lead." };
    var duplicate = selected.find(function (value) { return current.snAssignments[value]; });
    if (duplicate) return { valid: false, error: duplicate + " is already assigned." };
    var unique = {};
    var repeated = selected.find(function (value) {
      if (unique[value]) return true;
      unique[value] = true;
      return false;
    });
    if (repeated) return { valid: false, error: repeated + " was selected more than once." };
    var scenarios = ["Vending Machine", "EV Charging", "Arcade Machine", "Coffee Machine", "Standalone Terminal", "Terminal + ECR"];
    if (!capabilities || scenarios.indexOf(capabilities.scenario) === -1) return { valid: false, error: "Select a terminal scenario for the selected SNs." };
    if (typeof capabilities.cardless !== "boolean" || typeof capabilities.routing !== "boolean" || (capabilities.routing && !capabilities.cardless)) {
      return { valid: false, error: "Transaction routing requires cardless transactions. Review the selected capabilities." };
    }

    var overrides = readOverrides();
    var assignments = Object.assign({}, current.snAssignments);
    var assignedAt = new Date().toISOString();
    selected.forEach(function (serialNumber) {
      assignments[serialNumber] = {
        sn: serialNumber,
        merchantName: merchant,
        storeName: store,
        assignedAt: assignedAt,
        scenario: capabilities.scenario,
        cardless: capabilities.cardless,
        routing: capabilities.routing
      };
    });
    overrides[id] = Object.assign({}, overrides[id] || {}, {
      snAssignments: assignments,
      updatedAt: assignedAt
    });
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch (error) {
      return { valid: false, error: "Unable to save SN assignments in this browser." };
    }
    return { valid: true, values: selected, record: getByProcessId(id), error: "" };
  }

  function canEdit(record) {
    if (!record || record.legacyEditingBlocked || record.fastFlag === 1 || String(record.status) === "6" || record.applyStatus != null) return false;
    try {
      var applications = JSON.parse(global.localStorage.getItem("paywizard-onboarding-applications-v2") || "[]");
      return !Array.isArray(applications) || !applications.some(function (item) {
        return String(item.sourceLeadProcessId || item.leadProcessId || "") === record.processId;
      });
    } catch (error) { return false; }
  }

  var partnerNames = Array.from(new Set(records.map(function (record) { return record.partnerName; })));
  function getSnOptions(partnerName) {
    var index = partnerNames.indexOf(partnerName);
    if (index < 0) return [];
    var all = getRecords();
    var values = Array.from({ length: 5 }, function (_, i) { return "WP66" + String(index * 100 + i + 1).padStart(12, "0"); });
    all.filter(function (lead) { return lead.partnerName === partnerName; }).forEach(function (lead) { values = values.concat(lead.serialNumbers); });
    return Array.from(new Set(values)).map(function (sn) {
      var owner = all.find(function (lead) { return lead.serialNumbers.indexOf(sn) >= 0; });
      return { sn: sn, owner: owner ? owner.processId + " · " + owner.merchantName : "", available: !owner };
    });
  }

  // One atomic write keeps form fields, SNs and existing assignments together.
  function saveLead(processId, values) {
    var current = processId ? getByProcessId(processId) : null;
    if (processId && !canEdit(current)) return { valid: false, error: "This Lead is no longer available for editing. Return to Leads to review its status." };
    var fields = ["leadOwner", "status", "leadResource", "country", "region", "merchantName", "contactName", "merchantVertical", "attendant", "email", "phone", "dispatchTime", "arrivalTime", "vendingMachineType", "otherServiceType", "outreachContact", "notes"];
    var patch = {};
    fields.forEach(function (field) { patch[field] = String(values[field] || "").trim(); });
    if (!patch.country || !patch.merchantName || !patch.contactName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
      return { valid: false, error: "Enter a country or region, merchant name, contact name and valid email." };
    }
    if (leadStatus.values.indexOf(patch.status) < 0) {
      return { valid: false, error: "Choose one of the five Lead statuses and try again." };
    }
    patch.decisionMaker = clone(values.decisionMaker || { name: "", email: "", phone: "" });
    patch.secondDecisionMaker = clone(values.secondDecisionMaker || { name: "", email: "", phone: "" });
    patch.sameAsMerchant = Boolean(values.sameAsMerchant);
    patch.sameAsFirst = Boolean(values.sameAsFirst);
    patch.processing = clone(values.processing || {});
    patch.attachments = clone(values.attachments || []);
    if (patch.attachments.length > 5) return { valid: false, error: "Keep no more than 5 attachments." };
    patch.partnerName = current ? current.partnerName : String(values.partnerName || "");
    patch.serialNumbers = current ? current.serialNumbers : Array.from(new Set(values.serialNumbers || []));
    if (!current && patch.serialNumbers.length) {
      var available = getSnOptions(patch.partnerName).filter(function (option) { return option.available; }).map(function (option) { return option.sn; });
      if (patch.serialNumbers.some(function (sn) { return available.indexOf(sn) < 0; })) return { valid: false, error: "One or more SNs are no longer available for this Partner. Review your selected SNs." };
    }
    patch.currency = currencyByCountry[patch.country] || "";
    var now = new Date();
    patch.lastUpdate = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0") + " " + now.toTimeString().slice(0,8);
    patch.pastDays = 0;
    patch.updatedAt = now.toISOString();
    try {
      var overrides = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}");
      if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) throw new Error("Invalid stored data");
      var id = processId || String(Math.max.apply(null, getRecords().map(function (lead) { return Number(lead.processId) || 0; }).concat([440])) + 1).padStart(8, "0");
      if (!current) Object.assign(patch, { processId: id, spName: "wizarpos", pageStyle: "UPT", createdLead: true, createTime: now.toISOString(), snAssignments: {} });
      overrides[id] = Object.assign({}, overrides[id] || {}, patch);
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
      return { valid: true, record: getByProcessId(id) };
    } catch (error) {
      return { valid: false, error: "Unable to save this Lead in your browser. Check available browser storage and try again. Your entries have been kept." };
    }
  }

  // Migrate only status fields; preserve all merchant, SN and assignment data.
  (function migrateStoredStatuses() {
    var overrides = readOverrides();
    var changed = false;
    Object.keys(overrides).forEach(function (id) {
      var record = overrides[id];
      if (!record || typeof record !== "object" || Array.isArray(record)) return;
      if (!Object.prototype.hasOwnProperty.call(record, "status")) return;
      var next = leadStatus.normalize(record.status);
      if (next === record.status) return;
      if (String(record.status) === "6") record.legacyEditingBlocked = true;
      record.status = next;
      changed = true;
    });
    if (changed) {
      // Reads still normalize values if browser storage is unavailable.
      try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch (_) {}
    }
  })();

  global.PaywizardUptLeadData = {
    STORAGE_KEY: STORAGE_KEY,
    saveLead: saveLead,
    canEdit: canEdit,
    partnerNames: partnerNames,
    getSnOptions: getSnOptions,
    records: records,
    getRecords: getRecords,
    getByProcessId: getByProcessId,
    parseSerialNumbers: parseSerialNumbers,
    validateSerialNumbers: validateSerialNumbers,
    addSerialNumbers: addSerialNumbers,
    assignSerialNumbers: assignSerialNumbers
  };
})(window);
