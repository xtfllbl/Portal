(function () {
  "use strict";

  var STORAGE_KEY = "paywizard-platform-merchants-v1";

  function readAll() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function writeAll(merchants) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(merchants) ? merchants : []));
    return merchants;
  }

  function find(merchantId) {
    return readAll().find(function (merchant) {
      return String(merchant.merchantId || "") === String(merchantId || "");
    }) || null;
  }

  function normalize(merchant) {
    if (!merchant) return null;
    var stores = Array.isArray(merchant.storeRecords) ? merchant.storeRecords : [];
    merchant.storeRecords = stores;
    merchant.stores = stores.length || Number(merchant.stores || 0);
    return merchant;
  }

  function upsert(merchant) {
    if (!merchant || !merchant.merchantId) return null;
    var merchants = readAll();
    var index = merchants.findIndex(function (item) {
      return String(item.merchantId || "") === String(merchant.merchantId);
    });
    var normalized = normalize(merchant);
    if (index >= 0) merchants[index] = normalized;
    else merchants.unshift(normalized);
    writeAll(merchants);
    return normalized;
  }

  function timestamp() {
    var date = new Date();
    function pad(value) { return String(value).padStart(2, "0"); }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " +
      pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function stableStoreId(merchant) {
    var existing = Array.isArray(merchant && merchant.storeRecords) ? merchant.storeRecords.length : 0;
    return "STORE-" + String(merchant && merchant.merchantId || "MERCHANT") + "-" + String(existing + 1).padStart(2, "0");
  }

  function saveStore(merchantId, store) {
    var merchant = normalize(find(merchantId));
    if (!merchant) return null;
    var stores = merchant.storeRecords.slice();
    var now = timestamp();
    var record = Object.assign({
      storeId: stableStoreId(merchant),
      merchantId: merchant.merchantId,
      createdAt: now,
      updatedAt: now,
      devices: 0,
      status: "Pending Setup",
      paymentChannels: []
    }, store || {});
    record.updatedAt = now;
    record.paymentChannels = Array.isArray(record.paymentChannels) ? record.paymentChannels : [];
    record.status = record.paymentChannels.some(function (channel) { return String(channel.mid || "").trim(); })
      ? "Active"
      : "Pending Setup";
    var index = stores.findIndex(function (item) { return item.storeId === record.storeId; });
    if (index >= 0) {
      record.createdAt = stores[index].createdAt || record.createdAt;
      stores[index] = Object.assign({}, stores[index], record);
    } else {
      stores.push(record);
    }
    merchant.storeRecords = stores;
    merchant.stores = stores.length;
    merchant.lastUpdate = now;
    upsert(merchant);
    return record;
  }

  function setupState(merchant) {
    var normalized = normalize(merchant);
    if (!normalized || !normalized.storeRecords.length) return "none";
    var missingMid = normalized.storeRecords.some(function (store) {
      var terminal = (store.paymentChannels || []).find(function (channel) { return channel.type === "Terminal"; });
      return !terminal || !String(terminal.mid || "").trim();
    });
    return missingMid ? "pending" : "complete";
  }

  function setupLabel(merchant) {
    return setupState(merchant) === "none" ? "Create Store" : "Complete Store Setup";
  }

  function setupUrl(merchantId, shouldOpen) {
    var url = new URL("5.merchant_detail_no_store_iso.html", window.location.href);
    url.searchParams.set("merchantId", merchantId);
    if (shouldOpen !== false) {
      var merchant = normalize(find(merchantId));
      var pendingStore = merchant && merchant.storeRecords.find(function (store) {
        var terminal = (store.paymentChannels || []).find(function (channel) { return channel.type === "Terminal"; });
        return !terminal || !String(terminal.mid || "").trim();
      });
      if (pendingStore) url.searchParams.set("editStoreId", pendingStore.storeId);
      else url.searchParams.set("openAddStore", "1");
    }
    return url.href;
  }

  window.PaywizardPlatformMerchantStore = {
    key: STORAGE_KEY,
    readAll: readAll,
    writeAll: writeAll,
    find: find,
    upsert: upsert,
    saveStore: saveStore,
    setupState: setupState,
    setupLabel: setupLabel,
    setupUrl: setupUrl,
    timestamp: timestamp
  };
})();
