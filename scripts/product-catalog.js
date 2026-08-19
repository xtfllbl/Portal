(function (window) {
  "use strict";

  var VERSION = 2;
  var STORAGE_KEY = "paywizard.productCatalog.v2";
  var LEGACY_STORAGE_KEY = "paywizard.productCatalog.v1";
  var EVENT_NAME = "paywizard:product-catalog-change";
  var TERMINAL_SN = "WP6267UQ36002376";
  var OPERATOR = { id: "operator-wizarpos", name: "wizarpos" };
  var subscribers = [];
  var storage = getCatalogStorage();

  if (window.PaywizardProductCatalog && window.PaywizardProductCatalog.VERSION === VERSION) {
    return;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(value) {
    if (value === undefined) return undefined;
    if (typeof window.structuredClone === "function") {
      try {
        return window.structuredClone(value);
      } catch (error) {
        // The catalog is JSON-only; fall through for older browsers and exotic values.
      }
    }
    return JSON.parse(JSON.stringify(value));
  }

  function availableStorage(name) {
    try {
      var candidate = window[name];
      var testKey = STORAGE_KEY + ".test";
      candidate.setItem(testKey, "1");
      candidate.removeItem(testKey);
      return candidate;
    } catch (error) {
      return null;
    }
  }

  function getCatalogStorage() {
    var persistent = availableStorage("localStorage");
    var session = availableStorage("sessionStorage");
    if (!persistent) return session;

    // Promote data written by the earlier session-only implementation so a
    // saved catalog remains available after navigating to another page/tab.
    if (session && !persistent.getItem(STORAGE_KEY)) {
      var sessionState = session.getItem(STORAGE_KEY);
      var legacyState = session.getItem(LEGACY_STORAGE_KEY);
      if (sessionState) persistent.setItem(STORAGE_KEY, sessionState);
      else if (legacyState && !persistent.getItem(LEGACY_STORAGE_KEY)) persistent.setItem(LEGACY_STORAGE_KEY, legacyState);
    }
    return persistent;
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function cleanText(value) {
    return value == null ? "" : String(value).trim();
  }

  function canonical(value) {
    return cleanText(value).toLocaleLowerCase("en-US");
  }

  function cleanStatus(value) {
    if (value === false || canonical(value) === "inactive") return "inactive";
    return "active";
  }

  function toBoolean(value) {
    if (typeof value === "string") {
      return ["true", "1", "yes", "on", "included", "active"].indexOf(canonical(value)) !== -1;
    }
    return Boolean(value);
  }

  function catalogError(message, code, fields) {
    var error = new Error(message);
    error.name = "PaywizardCatalogError";
    error.code = code || "CATALOG_ERROR";
    error.fields = fields || {};
    return error;
  }

  function addFieldError(fields, field, message) {
    if (!fields[field]) fields[field] = message;
  }

  function optionalNonNegativeNumber(value, field, fields) {
    if (value === undefined || value === null || cleanText(value) === "") return null;
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      addFieldError(fields, field, "Enter a non-negative number.");
      return null;
    }
    return number;
  }

  function optionalNonNegativeInteger(value, field, fields) {
    var number = optionalNonNegativeNumber(value, field, fields);
    if (number === null) return null;
    if (!Number.isSafeInteger(number)) {
      addFieldError(fields, field, "Enter a non-negative whole number.");
      return null;
    }
    return number;
  }

  function cents(value, field, fields, required) {
    if (value === undefined || value === null || cleanText(value) === "") {
      if (required) addFieldError(fields, field, "Default Retail Price is required.");
      return null;
    }
    var number = Number(value);
    if (!Number.isSafeInteger(number) || number < 0) {
      addFieldError(fields, field, "Enter a non-negative price in cents.");
      return null;
    }
    return number;
  }

  function seedCategory(id, name, code) {
    var stamp = "2026-06-01T12:00:00.000Z";
    return {
      id: id,
      operatorId: OPERATOR.id,
      name: name,
      code: code,
      description: "",
      status: "active",
      image: "",
      vatEntries: [],
      createdAt: stamp,
      updatedAt: stamp
    };
  }

  function seedProduct(id, categoryId, name, dexName, productId, priceCents) {
    var stamp = "2026-06-01T12:00:00.000Z";
    return {
      id: id,
      operatorId: OPERATOR.id,
      categoryId: categoryId,
      name: name,
      status: "active",
      dexName: dexName,
      description: "",
      provider: "",
      volumeType: "",
      productId: productId,
      barcode: "",
      ean: "",
      image: "",
      prices: {
        costCents: null,
        cashDisplayCents: priceCents,
        creditCardCents: priceCents,
        prepaidCardCents: priceCents,
        externalPrepaidCents: priceCents,
        defaultRetailPriceCents: priceCents
      },
      nutrition: {
        caloriesPerServing: null,
        caloriesPer100g: null
      },
      misc: {
        ageVerification: false,
        taxVat: "",
        amountInTray: null,
        minimumFillPickAmount: null
      },
      createdAt: stamp,
      updatedAt: stamp
    };
  }

  function seedMapRow(id, slot, paCode, mdbCode, product, category, par, onHand) {
    var stamp = "2026-06-01T12:00:00.000Z";
    return {
      id: id,
      terminalSn: TERMINAL_SN,
      slot: slot,
      categoryId: category.id,
      productId: product.id,
      productName: product.name,
      productCategory: category.name,
      productGroup: category.name,
      dexName: product.dexName,
      productNameSnapshot: product.name,
      categoryNameSnapshot: category.name,
      dexNameSnapshot: product.dexName,
      paCode: paCode,
      mdbCode: mdbCode,
      priceCents: product.prices.defaultRetailPriceCents,
      par: par,
      onHand: onHand,
      createdAt: stamp,
      updatedAt: stamp
    };
  }

  function createSeedState(recovery) {
    var categories = [
      seedCategory("category-snacks", "Snacks", "10"),
      seedCategory("category-candy", "Candy", "20")
    ];
    var products = [
      seedProduct("product-trail-mix", "category-snacks", "Trail Mix", "Trail Mix", "P1001", 225),
      seedProduct("product-goldfish", "category-snacks", "Goldfish", "Goldfish", "P1002", 175),
      seedProduct("product-mms-plain", "category-candy", "M&M's Plain", "M&M's Plain", "P1003", 150),
      seedProduct("product-skittles", "category-candy", "Skittles Original", "Skittles Orig.", "P1004", 150),
      seedProduct("product-mini-cookies", "category-snacks", "Mini Cookies", "Mini Cookies", "P1005", 125),
      seedProduct("product-starburst", "category-candy", "Starburst", "Starburst", "P1006", 150),
      seedProduct("product-oreo", "category-snacks", "Oreo", "Oreo", "P1007", 125),
      seedProduct("product-nestle-crunch", "category-candy", "Nestle Crunch", "Nestle Crunch", "P1008", 175)
    ];
    var byId = {};
    var categoriesById = {};
    products.forEach(function (product) { byId[product.id] = product; });
    categories.forEach(function (category) { categoriesById[category.id] = category; });
    var stamp = nowIso();
    var productMaps = {};
    productMaps[TERMINAL_SN] = [
      seedMapRow("pm-001", "A1", "10", "16", byId["product-trail-mix"], categoriesById["category-snacks"], 12, 12),
      seedMapRow("pm-002", "A2", "11", "18", byId["product-goldfish"], categoriesById["category-snacks"], 12, 3),
      seedMapRow("pm-003", "A3", "12", "20", byId["product-mms-plain"], categoriesById["category-candy"], 12, 0),
      seedMapRow("pm-004", "A4", "13", "22", byId["product-skittles"], categoriesById["category-candy"], 12, 9),
      seedMapRow("pm-005", "A5", "14", "24", byId["product-mini-cookies"], categoriesById["category-snacks"], 12, 2),
      seedMapRow("pm-006", "B1", "A1", "26", byId["product-starburst"], categoriesById["category-candy"], 12, 12),
      seedMapRow("pm-007", "B2", "A2", "28", byId["product-oreo"], categoriesById["category-snacks"], 12, 7),
      seedMapRow("pm-008", "B3", "A3", "30", byId["product-nestle-crunch"], categoriesById["category-candy"], 12, 0)
    ];
    return {
      version: VERSION,
      operator: clone(OPERATOR),
      categories: categories,
      products: products,
      productMaps: productMaps,
      productMapTemplates: [],
      meta: {
        createdAt: stamp,
        updatedAt: stamp,
        storageMode: storage ? "session" : "memory",
        recovery: recovery || null
      }
    };
  }

  function stateIsValid(candidate) {
    if (!candidate || typeof candidate !== "object" || candidate.version !== VERSION) return false;
    if (!candidate.operator || candidate.operator.id !== OPERATOR.id) return false;
    if (!Array.isArray(candidate.categories) || !Array.isArray(candidate.products)) return false;
    if (!candidate.productMaps || typeof candidate.productMaps !== "object" || Array.isArray(candidate.productMaps)) return false;
    if (!Array.isArray(candidate.productMapTemplates)) return false;
    var categoryIds = {};
    var productIds = {};
    if (candidate.categories.some(function (category) {
      if (!category || !cleanText(category.id) || categoryIds[category.id] || !cleanText(category.name) ||
        ["active", "inactive"].indexOf(category.status) === -1 || !Array.isArray(category.vatEntries)) return true;
      categoryIds[category.id] = true;
      return false;
    })) return false;
    if (candidate.products.some(function (product) {
      if (!product || !cleanText(product.id) || productIds[product.id] || !categoryIds[product.categoryId] || !cleanText(product.name) ||
        ["active", "inactive"].indexOf(product.status) === -1 || !product.prices ||
        !Number.isSafeInteger(product.prices.defaultRetailPriceCents) || product.prices.defaultRetailPriceCents < 0) return true;
      productIds[product.id] = true;
      return false;
    })) return false;
    var terminalSns = Object.keys(candidate.productMaps);
    if (terminalSns.some(function (terminalSn) { return !Array.isArray(candidate.productMaps[terminalSn]); })) return false;
    if (terminalSns.some(function (terminalSn) {
      var rowIds = {};
      return candidate.productMaps[terminalSn].some(function (row) {
        if (!row || !cleanText(row.id) || rowIds[row.id] || !categoryIds[row.categoryId] || (cleanText(row.productId) && !productIds[row.productId])) return true;
        rowIds[row.id] = true;
        return false;
      });
    })) return false;
    var templateIds = {};
    if (candidate.productMapTemplates.some(function (template) {
      if (!template || !cleanText(template.id) || templateIds[template.id] || !cleanText(template.name) ||
        !cleanText(template.machineModel) || !Array.isArray(template.rows)) return true;
      templateIds[template.id] = true;
      return template.rows.some(function (row) {
        if (template.includeProductInfo === false) return !row;
        return !row || !categoryIds[row.categoryId] || (cleanText(row.productId) && !productIds[row.productId]);
      });
    })) return false;
    return true;
  }

  function migrateState(candidate) {
    if (!candidate || typeof candidate !== "object" || candidate.version !== 1) return null;
    var migrated = clone(candidate);
    migrated.version = VERSION;
    migrated.productMapTemplates = [];
    migrated.meta = migrated.meta && typeof migrated.meta === "object" ? migrated.meta : {};
    migrated.meta.migratedAt = nowIso();
    migrated.meta.migratedFrom = 1;
    return stateIsValid(migrated) ? migrated : null;
  }

  function writeInitialState(candidate) {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(candidate));
    } catch (error) {
      try {
        storage.removeItem(STORAGE_KEY);
        storage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      } catch (retryError) {
        candidate.meta.storageMode = "memory";
        storage = null;
      }
    }
  }

  function loadState() {
    if (!storage) return createSeedState(null);
    var raw;
    try {
      raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        var legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          var migrated = migrateState(JSON.parse(legacyRaw));
          if (migrated) {
            writeInitialState(migrated);
            return migrated;
          }
        }
      }
      if (!raw) {
        var initial = createSeedState(null);
        writeInitialState(initial);
        return initial;
      }
      var parsed = JSON.parse(raw);
      if (!stateIsValid(parsed)) throw new Error("Unsupported or invalid catalog data.");
      parsed.meta = parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {};
      parsed.meta.storageMode = "session";
      parsed.meta.recovery = parsed.meta.recovery || null;
      return parsed;
    } catch (error) {
      var recovered = createSeedState({
        at: nowIso(),
        reason: error && error.message ? String(error.message).slice(0, 160) : "Invalid catalog data."
      });
      writeInitialState(recovered);
      return recovered;
    }
  }

  var state = loadState();

  function emit(change) {
    var payload = Object.assign({
      type: "catalog:changed",
      entity: null,
      id: null,
      terminalSn: null,
      value: null,
      state: clone(state)
    }, clone(change || {}));
    subscribers.slice().forEach(function (listener) {
      try {
        listener(clone(payload));
      } catch (error) {
        window.setTimeout(function () { throw error; }, 0);
      }
    });
    if (typeof window.CustomEvent === "function" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new window.CustomEvent(EVENT_NAME, { detail: clone(payload) }));
    }
  }

  function commit(nextState, change) {
    nextState.version = VERSION;
    nextState.operator = clone(OPERATOR);
    nextState.meta = nextState.meta && typeof nextState.meta === "object" ? nextState.meta : {};
    nextState.meta.updatedAt = nowIso();
    nextState.meta.storageMode = storage ? "session" : "memory";
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch (error) {
        throw catalogError("The catalog could not be saved in this browser session.", "STORAGE_WRITE_FAILED", {
          storage: "Remove large images or free browser storage, then try again."
        });
      }
    }
    state = nextState;
    emit(change);
  }

  function getState() {
    return clone(state);
  }

  function getCategories(options) {
    options = options || {};
    return state.categories
      .filter(function (category) { return !options.activeOnly || category.status === "active"; })
      .slice()
      .sort(function (a, b) { return a.name.localeCompare(b.name, "en", { sensitivity: "base" }); })
      .map(clone);
  }

  function getProducts(options) {
    options = options || {};
    return state.products
      .filter(function (product) {
        if (options.activeOnly && product.status !== "active") return false;
        if (options.activeOnly) {
          var category = state.categories.find(function (item) { return item.id === product.categoryId; });
          if (!category || category.status !== "active") return false;
        }
        if (options.categoryId && product.categoryId !== options.categoryId) return false;
        return true;
      })
      .slice()
      .sort(function (a, b) { return a.name.localeCompare(b.name, "en", { sensitivity: "base" }); })
      .map(clone);
  }

  function getCategory(id) {
    var category = state.categories.find(function (item) { return item.id === id; });
    return category ? clone(category) : null;
  }

  function getProduct(id) {
    var product = state.products.find(function (item) { return item.id === id; });
    return product ? clone(product) : null;
  }

  function normalizedImage(value) {
    if (value && typeof value === "object" && typeof value.dataUrl === "string") return value.dataUrl;
    return typeof value === "string" ? value : "";
  }

  function normalizeVatEntries(entries, fields) {
    if (!Array.isArray(entries)) return [];
    return entries.map(function (entry, index) {
      entry = entry || {};
      var taxValue = optionalNonNegativeNumber(entry.taxValue, "vatEntries." + index + ".taxValue", fields);
      return {
        id: cleanText(entry.id) || makeId("vat"),
        country: cleanText(entry.country),
        taxValue: taxValue,
        taxCode: cleanText(entry.taxCode),
        vatName: cleanText(entry.vatName),
        taxId: cleanText(entry.taxId),
        taxIncluded: toBoolean(entry.taxIncluded)
      };
    });
  }

  function saveCategory(input) {
    input = input || {};
    var current = input.id ? state.categories.find(function (item) { return item.id === input.id; }) : null;
    if (input.id && !current) throw catalogError("Product Group was not found.", "NOT_FOUND", { id: "Unknown product group." });
    var merged = Object.assign({}, current || {}, input);
    var fields = {};
    var name = cleanText(merged.name || merged.categoryName);
    var code = cleanText(merged.code);
    if (!name) addFieldError(fields, "name", "Product Group Name is required.");
    if (name.length > 100) addFieldError(fields, "name", "Product Group Name must be 100 characters or fewer.");
    if (code && !/^\d+$/.test(code)) addFieldError(fields, "code", "Product Group Code must contain digits only.");
    if (cleanText(merged.description).length > 1000) addFieldError(fields, "description", "Description must be 1,000 characters or fewer.");
    if (state.categories.some(function (item) {
      return item.id !== (current && current.id) && canonical(item.name) === canonical(name);
    })) addFieldError(fields, "name", "A product group with this name already exists.");
    if (code && state.categories.some(function (item) {
      return item.id !== (current && current.id) && cleanText(item.code) === code;
    })) addFieldError(fields, "code", "A product group with this code already exists.");
    var vatEntries = normalizeVatEntries(merged.vatEntries, fields);
    if (Object.keys(fields).length) {
      throw catalogError("Fix the highlighted product group fields.", "VALIDATION_FAILED", fields);
    }
    var stamp = nowIso();
    var saved = {
      id: current ? current.id : makeId("category"),
      operatorId: OPERATOR.id,
      name: name,
      code: code,
      description: cleanText(merged.description),
      status: cleanStatus(merged.status),
      image: normalizedImage(merged.image),
      vatEntries: vatEntries,
      createdAt: current ? current.createdAt : stamp,
      updatedAt: stamp
    };
    var next = clone(state);
    if (current) {
      next.categories = next.categories.map(function (item) { return item.id === saved.id ? saved : item; });
    } else {
      next.categories.unshift(saved);
    }
    commit(next, { type: current ? "category:updated" : "category:created", entity: "category", id: saved.id, value: saved });
    return clone(saved);
  }

  function valueFrom(source, nested, flatName) {
    if (source[nested] && source[nested][flatName] !== undefined) return source[nested][flatName];
    return source[flatName];
  }

  function saveProduct(input) {
    input = input || {};
    var current = input.id ? state.products.find(function (item) { return item.id === input.id; }) : null;
    if (input.id && !current) throw catalogError("Product was not found.", "NOT_FOUND", { id: "Unknown product." });
    var merged = Object.assign({}, current || {}, input);
    merged.prices = Object.assign({}, current ? current.prices : {}, input.prices || {});
    merged.nutrition = Object.assign({}, current ? current.nutrition : {}, input.nutrition || {});
    merged.misc = Object.assign({}, current ? current.misc : {}, input.misc || {});
    var fields = {};
    var name = cleanText(merged.name || merged.productName);
    var categoryId = cleanText(merged.categoryId);
    var category = state.categories.find(function (item) { return item.id === categoryId; });
    var status = cleanStatus(merged.status);
    var dexName = cleanText(merged.dexName);
    var productId = cleanText(merged.productId);
    var barcode = cleanText(merged.barcode);
    var ean = cleanText(merged.ean);
    if (!name) addFieldError(fields, "name", "Product Name is required.");
    if (name.length > 100) addFieldError(fields, "name", "Product Name must be 100 characters or fewer.");
    if (!category) addFieldError(fields, "categoryId", "Select a valid Product Group.");
    if (category && category.status !== "active" && status === "active") {
      addFieldError(fields, "categoryId", "An active product must belong to an active Product Group.");
    }
    if (dexName.length > 16) addFieldError(fields, "dexName", "DEX Name must be 16 characters or fewer.");
    if (cleanText(merged.description).length > 2000) addFieldError(fields, "description", "Description must be 2,000 characters or fewer.");
    if (ean && !/^\d{13}$/.test(ean)) addFieldError(fields, "ean", "EAN must contain exactly 13 digits.");
    [
      ["productId", productId],
      ["barcode", barcode],
      ["ean", ean]
    ].forEach(function (entry) {
      var field = entry[0];
      var value = entry[1];
      if (!value) return;
      if (state.products.some(function (item) {
        return item.id !== (current && current.id) && canonical(item[field]) === canonical(value);
      })) addFieldError(fields, field, "This value is already used by another product.");
    });
    var normalizedPrices = {
      costCents: cents(valueFrom(merged, "prices", "costCents"), "prices.costCents", fields, false),
      cashDisplayCents: cents(valueFrom(merged, "prices", "cashDisplayCents"), "prices.cashDisplayCents", fields, false),
      creditCardCents: cents(valueFrom(merged, "prices", "creditCardCents"), "prices.creditCardCents", fields, false),
      prepaidCardCents: cents(valueFrom(merged, "prices", "prepaidCardCents"), "prices.prepaidCardCents", fields, false),
      externalPrepaidCents: cents(valueFrom(merged, "prices", "externalPrepaidCents"), "prices.externalPrepaidCents", fields, false),
      defaultRetailPriceCents: cents(valueFrom(merged, "prices", "defaultRetailPriceCents"), "prices.defaultRetailPriceCents", fields, true)
    };
    var nutrition = {
      caloriesPerServing: optionalNonNegativeNumber(valueFrom(merged, "nutrition", "caloriesPerServing"), "nutrition.caloriesPerServing", fields),
      caloriesPer100g: optionalNonNegativeNumber(valueFrom(merged, "nutrition", "caloriesPer100g"), "nutrition.caloriesPer100g", fields)
    };
    var misc = {
      ageVerification: toBoolean(valueFrom(merged, "misc", "ageVerification")),
      taxVat: cleanText(valueFrom(merged, "misc", "taxVat")),
      amountInTray: optionalNonNegativeInteger(valueFrom(merged, "misc", "amountInTray"), "misc.amountInTray", fields),
      minimumFillPickAmount: optionalNonNegativeInteger(valueFrom(merged, "misc", "minimumFillPickAmount"), "misc.minimumFillPickAmount", fields)
    };
    if (Object.keys(fields).length) {
      throw catalogError("Fix the highlighted product fields.", "VALIDATION_FAILED", fields);
    }
    var stamp = nowIso();
    var saved = {
      id: current ? current.id : makeId("product"),
      operatorId: OPERATOR.id,
      categoryId: categoryId,
      name: name,
      status: status,
      dexName: dexName,
      description: cleanText(merged.description),
      provider: cleanText(merged.provider),
      volumeType: cleanText(merged.volumeType),
      productId: productId,
      barcode: barcode,
      ean: ean,
      image: normalizedImage(merged.image),
      prices: normalizedPrices,
      nutrition: nutrition,
      misc: misc,
      createdAt: current ? current.createdAt : stamp,
      updatedAt: stamp
    };
    var next = clone(state);
    if (current) {
      next.products = next.products.map(function (item) { return item.id === saved.id ? saved : item; });
    } else {
      next.products.unshift(saved);
    }
    commit(next, { type: current ? "product:updated" : "product:created", entity: "product", id: saved.id, value: saved });
    return clone(saved);
  }

  function getReferenceCounts(target) {
    var categoryCounts = {};
    var productCounts = {};
    var totalMappings = 0;
    var totalTemplateReferences = 0;
    Object.keys(state.productMaps).forEach(function (terminalSn) {
      state.productMaps[terminalSn].forEach(function (row) {
        totalMappings += 1;
        if (row.categoryId) categoryCounts[row.categoryId] = (categoryCounts[row.categoryId] || 0) + 1;
        if (row.productId) productCounts[row.productId] = (productCounts[row.productId] || 0) + 1;
      });
    });
    state.productMapTemplates.forEach(function (template) {
      template.rows.forEach(function (row) {
        totalTemplateReferences += 1;
        if (row.categoryId) categoryCounts[row.categoryId] = (categoryCounts[row.categoryId] || 0) + 1;
        if (row.productId) productCounts[row.productId] = (productCounts[row.productId] || 0) + 1;
      });
    });
    var categoryId = null;
    var productId = null;
    if (typeof target === "string") {
      if (state.categories.some(function (item) { return item.id === target; })) categoryId = target;
      if (state.products.some(function (item) { return item.id === target; })) productId = target;
    } else if (target && typeof target === "object") {
      categoryId = target.categoryId || null;
      productId = target.productId || null;
    }
    return {
      totalMappings: totalMappings,
      totalTemplateReferences: totalTemplateReferences,
      categories: clone(categoryCounts),
      products: clone(productCounts),
      categoryId: categoryId,
      categoryReferences: categoryId ? (categoryCounts[categoryId] || 0) : null,
      categoryProductCount: categoryId ? state.products.filter(function (item) { return item.categoryId === categoryId; }).length : null,
      productId: productId,
      productReferences: productId ? (productCounts[productId] || 0) : null
    };
  }

  function deleteCategory(id) {
    var category = state.categories.find(function (item) { return item.id === id; });
    if (!category) throw catalogError("Product Group was not found.", "NOT_FOUND", { id: "Unknown product group." });
    var references = getReferenceCounts({ categoryId: id });
    if (references.categoryProductCount || references.categoryReferences) {
      throw catalogError("This product group cannot be deleted while it contains products or Product Map references.", "CATEGORY_IN_USE", {
        category: references.categoryProductCount + " product(s), " + references.categoryReferences + " Product Map reference(s)."
      });
    }
    var next = clone(state);
    next.categories = next.categories.filter(function (item) { return item.id !== id; });
    commit(next, { type: "category:deleted", entity: "category", id: id, value: null });
    return { deleted: true, id: id };
  }

  function deleteProduct(id) {
    var product = state.products.find(function (item) { return item.id === id; });
    if (!product) throw catalogError("Product was not found.", "NOT_FOUND", { id: "Unknown product." });
    var references = getReferenceCounts({ productId: id });
    if (references.productReferences) {
      var archived = saveProduct(Object.assign({}, product, { status: "inactive" }));
      return { deleted: false, archived: true, product: archived };
    }
    var next = clone(state);
    next.products = next.products.filter(function (item) { return item.id !== id; });
    commit(next, { type: "product:deleted", entity: "product", id: id, value: null });
    return { deleted: true, archived: false, id: id };
  }

  function normalizeTerminalSn(terminalSn) {
    var normalized = cleanText(terminalSn).toUpperCase();
    if (!normalized) throw catalogError("Terminal SN is required.", "VALIDATION_FAILED", { terminalSn: "Terminal SN is required." });
    return normalized;
  }

  function getProductMap(terminalSn) {
    var normalized = normalizeTerminalSn(terminalSn);
    return clone(state.productMaps[normalized] || []);
  }

  function saveProductMap(terminalSn, rows) {
    var normalizedSn = normalizeTerminalSn(terminalSn);
    if (!Array.isArray(rows)) throw catalogError("Product Map rows must be an array.", "VALIDATION_FAILED", { rows: "Invalid Product Map data." });
    var fields = {};
    var seenIds = {};
    var seenPaCodes = {};
    var seenMdbCodes = {};
    var stamp = nowIso();
    var currentRows = state.productMaps[normalizedSn] || [];
    var currentById = {};
    currentRows.forEach(function (row) { currentById[row.id] = row; });
    var normalizedRows = rows.map(function (input, index) {
      input = input || {};
      var prefix = "rows." + index + ".";
      var product = state.products.find(function (item) { return item.id === input.productId; });
      var categoryId = cleanText(input.categoryId || (product && product.categoryId));
      var category = state.categories.find(function (item) { return item.id === categoryId; });
      var id = cleanText(input.id) || makeId("map");
      var paCode = cleanText(input.paCode).toUpperCase();
      var mdbCode = cleanText(input.mdbCode);
      var par = optionalNonNegativeInteger(input.par, prefix + "par", fields);
      var onHand = optionalNonNegativeInteger(input.onHand, prefix + "onHand", fields);
      var priceCents = cents(input.priceCents, prefix + "priceCents", fields, false);
      if (onHand === null && !fields[prefix + "onHand"]) addFieldError(fields, prefix + "onHand", "On Hand is required.");
      if (cleanText(input.productId) && !product) addFieldError(fields, prefix + "productId", "Select a valid product.");
      if (categoryId && !category) addFieldError(fields, prefix + "categoryId", "Select a valid Product Group.");
      if (product && category && product.categoryId !== category.id) {
        addFieldError(fields, prefix + "productId", "The product does not belong to this Product Group.");
      }
      if (paCode && !/^[A-Z0-9]{2}$/.test(paCode)) addFieldError(fields, prefix + "paCode", "PA Code must be exactly 2 letters or numbers.");
      if (!/^\d{2}$/.test(mdbCode)) addFieldError(fields, prefix + "mdbCode", "MDB Code must be exactly 2 digits.");
      if (par !== null && onHand !== null && onHand > par) addFieldError(fields, prefix + "onHand", "On Hand cannot exceed PAR.");
      if (seenIds[id]) addFieldError(fields, prefix + "id", "Product Map row IDs must be unique.");
      if (paCode && seenPaCodes[paCode]) addFieldError(fields, prefix + "paCode", "This PA Code is already mapped.");
      if (mdbCode && seenMdbCodes[mdbCode]) addFieldError(fields, prefix + "mdbCode", "This MDB Code is already mapped.");
      seenIds[id] = true;
      if (paCode) seenPaCodes[paCode] = true;
      seenMdbCodes[mdbCode] = true;
      var existing = currentById[id];
      var sameProduct = Boolean(existing && product && existing.productId === product.id);
      var sameCategory = Boolean(existing && category && existing.categoryId === category.id);
      var productName = sameProduct ? cleanText(input.productNameSnapshot || input.productName || existing.productNameSnapshot || existing.productName) : "";
      var categoryName = sameCategory ? cleanText(input.categoryNameSnapshot || input.productCategory || input.productGroup || existing.categoryNameSnapshot || existing.productCategory) : "";
      var dexName = sameProduct ? cleanText(input.dexNameSnapshot || input.dexName || existing.dexNameSnapshot || existing.dexName) : "";
      productName = productName || (product ? product.name : "");
      categoryName = categoryName || (category ? category.name : "");
      dexName = dexName || (product ? (product.dexName || product.name) : productName);
      return {
        id: id,
        terminalSn: normalizedSn,
        slot: cleanText(input.slot).toUpperCase(),
        categoryId: categoryId,
        productId: product ? product.id : "",
        productName: productName,
        productCategory: categoryName,
        productGroup: categoryName,
        dexName: dexName,
        productNameSnapshot: productName,
        categoryNameSnapshot: categoryName,
        dexNameSnapshot: dexName,
        paCode: paCode,
        mdbCode: mdbCode,
        priceCents: priceCents,
        par: par,
        onHand: onHand,
        createdAt: existing && existing.createdAt ? existing.createdAt : stamp,
        updatedAt: stamp
      };
    });
    if (Object.keys(fields).length) {
      throw catalogError("Fix the highlighted Product Map fields.", "VALIDATION_FAILED", fields);
    }
    var next = clone(state);
    next.productMaps[normalizedSn] = normalizedRows;
    commit(next, { type: "product-map:saved", entity: "productMap", terminalSn: normalizedSn, value: normalizedRows });
    return clone(normalizedRows);
  }

  function fillProductMapToPar(terminalSn) {
    var normalizedSn = normalizeTerminalSn(terminalSn);
    var currentRows = state.productMaps[normalizedSn] || [];
    if (!currentRows.length) {
      throw catalogError("No saved BINS are available to fill.", "NO_BINS", { rows: "Add and save at least one BIN first." });
    }
    var stamp = nowIso();
    var binsUpdated = 0;
    var unitsAdded = 0;
    var filledRows = currentRows.map(function (row) {
      var par = Number(row.par);
      var onHand = Number(row.onHand);
      if (onHand !== par) {
        binsUpdated += 1;
        unitsAdded += Math.max(par - onHand, 0);
      }
      return Object.assign({}, row, { onHand: par, updatedAt: stamp });
    });
    var next = clone(state);
    next.productMaps[normalizedSn] = filledRows;
    commit(next, {
      type: "product-map:filled-to-par",
      entity: "productMap",
      terminalSn: normalizedSn,
      value: filledRows
    });
    return {
      terminalSn: normalizedSn,
      binsUpdated: binsUpdated,
      unitsAdded: unitsAdded,
      rows: clone(filledRows)
    };
  }

  function getProductMapTemplates() {
    return state.productMapTemplates
      .slice()
      .sort(function (a, b) { return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); })
      .map(clone);
  }

  function getProductMapTemplate(id) {
    var template = state.productMapTemplates.find(function (item) { return item.id === id; });
    return template ? clone(template) : null;
  }

  function normalizeTemplateRow(input, index, fields, includeProductInfo) {
    input = input || {};
    var prefix = "rows." + index + ".";
    var paCode = cleanText(input.paCode).toUpperCase();
    var mdbCode = cleanText(input.mdbCode);
    var par = optionalNonNegativeInteger(input.par, prefix + "par", fields);
    if (paCode && !/^[A-Z0-9]{2}$/.test(paCode)) addFieldError(fields, prefix + "paCode", "PA Code must be exactly 2 letters or numbers.");
    if (!/^\d{2}$/.test(mdbCode)) addFieldError(fields, prefix + "mdbCode", "MDB Code must be exactly 2 digits.");

    var normalized = {
      slot: cleanText(input.slot).toUpperCase(),
      paCode: paCode,
      mdbCode: mdbCode,
      par: par
    };
    if (!includeProductInfo) return normalized;

    var product = state.products.find(function (item) { return item.id === input.productId; });
    var categoryId = cleanText(input.categoryId || (product && product.categoryId));
    var category = state.categories.find(function (item) { return item.id === categoryId; });
    var priceCents = cents(input.priceCents, prefix + "priceCents", fields, false);
    if (cleanText(input.productId) && !product) addFieldError(fields, prefix + "productId", "Select a valid product.");
    if (categoryId && !category) addFieldError(fields, prefix + "categoryId", "Select a valid Product Group.");
    if (product && category && product.categoryId !== category.id) addFieldError(fields, prefix + "productId", "The product does not belong to this Product Group.");
    return Object.assign(normalized, {
      categoryId: categoryId,
      productId: product ? product.id : "",
      productNameSnapshot: cleanText(input.productNameSnapshot || input.productName) || (product ? product.name : ""),
      categoryNameSnapshot: cleanText(input.categoryNameSnapshot || input.productCategory || input.productGroup) || (category ? category.name : ""),
      dexNameSnapshot: cleanText(input.dexNameSnapshot || input.dexName) || (product ? (product.dexName || product.name) : ""),
      priceCents: priceCents
    });
  }

  function saveProductMapTemplate(input) {
    input = input || {};
    var current = input.id ? state.productMapTemplates.find(function (item) { return item.id === input.id; }) : null;
    if (input.id && !current) throw catalogError("Product Map Template was not found.", "NOT_FOUND", { id: "Unknown template." });
    var merged = Object.assign({}, current || {}, input);
    var fields = {};
    var name = cleanText(merged.name);
    var machineModel = cleanText(merged.machineModel).toUpperCase();
    var includeProductInfo = merged.includeProductInfo !== false;
    var rows = Array.isArray(merged.rows) ? merged.rows : [];
    if (!name) addFieldError(fields, "name", "Template Name is required.");
    if (name.length > 100) addFieldError(fields, "name", "Template Name must be 100 characters or fewer.");
    if (!machineModel) addFieldError(fields, "machineModel", "Machine Model is required.");
    if (cleanText(merged.description).length > 1000) addFieldError(fields, "description", "Description must be 1,000 characters or fewer.");
    if (!rows.length) addFieldError(fields, "rows", "The Product Map must contain at least one BIN.");
    if (state.productMapTemplates.some(function (item) {
      return item.id !== (current && current.id) && canonical(item.name) === canonical(name);
    })) addFieldError(fields, "name", "A Product Map Template with this name already exists.");
    var normalizedRows = rows.map(function (row, index) { return normalizeTemplateRow(row, index, fields, includeProductInfo); });
    var seenPa = {};
    var seenMdb = {};
    normalizedRows.forEach(function (row, index) {
      if (row.paCode && seenPa[row.paCode]) addFieldError(fields, "rows." + index + ".paCode", "This PA Code is already mapped in the template.");
      if (seenMdb[row.mdbCode]) addFieldError(fields, "rows." + index + ".mdbCode", "This MDB Code is already mapped in the template.");
      if (row.paCode) seenPa[row.paCode] = true;
      seenMdb[row.mdbCode] = true;
    });
    if (Object.keys(fields).length) throw catalogError("Fix the highlighted Product Map Template fields.", "VALIDATION_FAILED", fields);
    var stamp = nowIso();
    var saved = {
      id: current ? current.id : makeId("map-template"),
      name: name,
      description: cleanText(merged.description),
      machineModel: machineModel,
      includeProductInfo: includeProductInfo,
      sourceTerminalName: cleanText(merged.sourceTerminalName),
      sourceTerminalSn: cleanText(merged.sourceTerminalSn).toUpperCase(),
      rows: normalizedRows,
      createdAt: current ? current.createdAt : stamp,
      updatedAt: stamp
    };
    var next = clone(state);
    if (current) next.productMapTemplates = next.productMapTemplates.map(function (item) { return item.id === saved.id ? saved : item; });
    else next.productMapTemplates.unshift(saved);
    commit(next, { type: current ? "product-map-template:updated" : "product-map-template:created", entity: "productMapTemplate", id: saved.id, value: saved });
    return clone(saved);
  }

  function deleteProductMapTemplate(id) {
    var template = state.productMapTemplates.find(function (item) { return item.id === id; });
    if (!template) throw catalogError("Product Map Template was not found.", "NOT_FOUND", { id: "Unknown template." });
    var next = clone(state);
    next.productMapTemplates = next.productMapTemplates.filter(function (item) { return item.id !== id; });
    commit(next, { type: "product-map-template:deleted", entity: "productMapTemplate", id: id, value: null });
    return { deleted: true, id: id };
  }

  function instantiateProductMapTemplate(id, targetTerminalSn, machineModel, options) {
    options = options || {};
    var template = state.productMapTemplates.find(function (item) { return item.id === id; });
    if (!template) throw catalogError("Product Map Template was not found.", "NOT_FOUND", { id: "Unknown template." });
    var targetSn = normalizeTerminalSn(targetTerminalSn);
    var normalizedModel = cleanText(machineModel).toUpperCase();
    if (normalizedModel && template.machineModel !== normalizedModel && options.allowModelMismatch !== true) {
      throw catalogError("This template is for a different Machine Model.", "MODEL_MISMATCH", { machineModel: "Select a " + normalizedModel + " template." });
    }
    var issues = [];
    var stamp = nowIso();
    var rows = template.rows.map(function (row, index) {
      var product = state.products.find(function (item) { return item.id === row.productId; });
      var category = state.categories.find(function (item) { return item.id === row.categoryId; });
      if (template.includeProductInfo === false) {
        issues.push({ index: index, field: "productInfo", message: "Product information was not saved. Select a Product Group, Product, and Price." });
      } else {
        if (!category || category.status !== "active") issues.push({ index: index, field: "categoryId", message: "Product Group is missing or inactive." });
        if (row.productId && (!product || product.status !== "active")) issues.push({ index: index, field: "productId", message: "Product is missing or inactive." });
      }
      return Object.assign({}, row, {
        id: makeId("map"),
        terminalSn: targetSn,
        productName: row.productNameSnapshot,
        productCategory: row.categoryNameSnapshot,
        productGroup: row.categoryNameSnapshot,
        dexName: row.dexNameSnapshot,
        onHand: 0,
        createdAt: stamp,
        updatedAt: stamp
      });
    });
    return { template: clone(template), rows: clone(rows), issues: clone(issues) };
  }

  function subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("subscribe requires a function.");
    subscribers.push(listener);
    var active = true;
    return function unsubscribe() {
      if (!active) return;
      active = false;
      subscribers = subscribers.filter(function (item) { return item !== listener; });
    };
  }

  if (storage && typeof window.addEventListener === "function") {
    window.addEventListener("storage", function (event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        var incoming = JSON.parse(event.newValue);
        if (!stateIsValid(incoming)) return;
        state = incoming;
        emit({ type: "storage:synced", entity: "catalog", value: null });
      } catch (error) {
        // Ignore storage events from incompatible or incomplete writes.
      }
    });
  }

  window.PaywizardProductCatalog = Object.freeze({
    VERSION: VERSION,
    STORAGE_KEY: STORAGE_KEY,
    EVENT_NAME: EVENT_NAME,
    getState: getState,
    getCategories: getCategories,
    getProducts: getProducts,
    getCategory: getCategory,
    getProduct: getProduct,
    saveCategory: saveCategory,
    saveProduct: saveProduct,
    deleteCategory: deleteCategory,
    deleteProduct: deleteProduct,
    getProductMap: getProductMap,
    saveProductMap: saveProductMap,
    fillProductMapToPar: fillProductMapToPar,
    getProductMapTemplates: getProductMapTemplates,
    getProductMapTemplate: getProductMapTemplate,
    saveProductMapTemplate: saveProductMapTemplate,
    deleteProductMapTemplate: deleteProductMapTemplate,
    instantiateProductMapTemplate: instantiateProductMapTemplate,
    getReferenceCounts: getReferenceCounts,
    subscribe: subscribe
  });
})(window);
