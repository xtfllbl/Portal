(function (window) {
  "use strict";

  var VERSION = 1;
  var STORAGE_PREFIX = "paywizard.pickList.v1:";
  var EVENT_NAME = "paywizard:pick-list-change";
  var subscribers = [];
  var catalog = window.PaywizardProductCatalog;
  var storage = availableStorage("localStorage") || availableStorage("sessionStorage");

  if (!catalog) throw new Error("PaywizardProductCatalog must be loaded before PaywizardPickList.");
  if (window.PaywizardPickList && window.PaywizardPickList.VERSION === VERSION) return;

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function availableStorage(name) {
    try {
      var candidate = window[name];
      var key = STORAGE_PREFIX + "test";
      candidate.setItem(key, "1");
      candidate.removeItem(key);
      return candidate;
    } catch (error) {
      return null;
    }
  }

  function normalizedSn(terminalSn) {
    var value = terminalSn == null ? "" : String(terminalSn).trim().toUpperCase();
    if (!value) throw new Error("Terminal SN is required.");
    return value;
  }

  function storageKey(terminalSn) {
    return STORAGE_PREFIX + normalizedSn(terminalSn);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function emptyState(terminalSn) {
    return { version: VERSION, terminalSn: normalizedSn(terminalSn), schedule: null, lastExecution: null };
  }

  function validSchedule(schedule) {
    return Boolean(schedule && typeof schedule === "object" && schedule.scheduleId && schedule.scheduledFor && ["scheduled", "running", "failed"].indexOf(schedule.status) !== -1);
  }

  function loadState(terminalSn) {
    var fallback = emptyState(terminalSn);
    if (!storage) return fallback;
    try {
      var raw = storage.getItem(storageKey(terminalSn));
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION || normalizedSn(parsed.terminalSn) !== fallback.terminalSn) return fallback;
      return {
        version: VERSION,
        terminalSn: fallback.terminalSn,
        schedule: validSchedule(parsed.schedule) ? parsed.schedule : null,
        lastExecution: parsed.lastExecution && typeof parsed.lastExecution === "object" ? parsed.lastExecution : null
      };
    } catch (error) {
      return fallback;
    }
  }

  function emit(change) {
    var payload = clone(change || {});
    subscribers.slice().forEach(function (listener) {
      try { listener(clone(payload)); }
      catch (error) { window.setTimeout(function () { throw error; }, 0); }
    });
    if (typeof window.CustomEvent === "function") window.dispatchEvent(new window.CustomEvent(EVENT_NAME, { detail: clone(payload) }));
  }

  function persistState(state, type) {
    if (!storage) throw new Error("Pick List scheduling is not available in this browser session.");
    try {
      storage.setItem(storageKey(state.terminalSn), JSON.stringify(state));
    } catch (error) {
      throw new Error("The Pick List schedule could not be saved. Free browser storage and try again.");
    }
    emit({ type: type, terminalSn: state.terminalSn, state: clone(state) });
    return clone(state);
  }

  function getTimeZoneInfo(dateValue) {
    var date = dateValue == null ? new Date() : new Date(dateValue);
    var name = "Local time";
    try { name = Intl.DateTimeFormat().resolvedOptions().timeZone || name; }
    catch (error) { /* Keep the local fallback. */ }
    var minutes = -date.getTimezoneOffset();
    var sign = minutes >= 0 ? "+" : "-";
    var absolute = Math.abs(minutes);
    var hours = String(Math.floor(absolute / 60)).padStart(2, "0");
    var mins = String(absolute % 60).padStart(2, "0");
    var offset = "UTC" + sign + hours + ":" + mins;
    return { name: name, offset: offset, label: name + " (" + offset + ")" };
  }

  function createSnapshot(terminalSn) {
    var sn = normalizedSn(terminalSn);
    var allRows = catalog.getProductMap(sn);
    var rows = allRows.map(function (row, index) {
      var par = Number(row.par) || 0;
      var onHand = Number(row.onHand) || 0;
      return {
        index: index,
        id: row.id,
        slot: row.slot || "",
        paCode: row.paCode || "",
        mdbCode: row.mdbCode || "",
        productId: row.productId || "",
        productName: row.productNameSnapshot || row.productName || "",
        productGroup: row.categoryNameSnapshot || row.productGroup || row.productCategory || "",
        onHand: onHand,
        par: par,
        pickQty: Math.max(par - onHand, 0)
      };
    }).filter(function (row) { return row.pickQty > 0; });
    var uniqueProducts = {};
    rows.forEach(function (row) { uniqueProducts[row.productId || row.productName] = true; });
    return {
      terminalSn: sn,
      generatedAt: nowIso(),
      timeZone: getTimeZoneInfo(),
      allBinCount: allRows.length,
      binsToFill: rows.length,
      productCount: Object.keys(uniqueProducts).length,
      totalUnits: rows.reduce(function (sum, row) { return sum + row.pickQty; }, 0),
      rows: rows
    };
  }

  function getSchedule(terminalSn) {
    return clone(loadState(terminalSn).schedule);
  }

  function getLastExecution(terminalSn) {
    return clone(loadState(terminalSn).lastExecution);
  }

  function saveSchedule(terminalSn, scheduledFor) {
    var sn = normalizedSn(terminalSn);
    var date = scheduledFor instanceof Date ? scheduledFor : new Date(scheduledFor);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Choose a future completion time.");
    var state = loadState(sn);
    var stamp = nowIso();
    var existing = state.schedule;
    state.schedule = {
      scheduleId: existing && existing.scheduleId ? existing.scheduleId : makeId("pick"),
      scheduledFor: date.toISOString(),
      status: "scheduled",
      createdAt: existing && existing.createdAt ? existing.createdAt : stamp,
      updatedAt: stamp,
      error: ""
    };
    return persistState(state, existing ? "schedule:updated" : "schedule:created").schedule;
  }

  function cancelSchedule(terminalSn) {
    var state = loadState(terminalSn);
    if (!state.schedule) return clone(state);
    var cancelled = clone(state.schedule);
    state.schedule = null;
    persistState(state, "schedule:cancelled");
    return cancelled;
  }

  function recordManualFill(terminalSn, result) {
    var state = loadState(terminalSn);
    var previousSchedule = state.schedule;
    state.schedule = null;
    state.lastExecution = {
      executionId: makeId("fill"),
      scheduleId: previousSchedule ? previousSchedule.scheduleId : null,
      source: "manual",
      status: "completed",
      scheduledFor: previousSchedule ? previousSchedule.scheduledFor : null,
      executedAt: nowIso(),
      binsUpdated: Number(result && result.binsUpdated) || 0,
      unitsAdded: Number(result && result.unitsAdded) || 0,
      error: ""
    };
    return persistState(state, "fill:manual-completed").lastExecution;
  }

  function executeDueSchedule(terminalSn, nowValue) {
    var sn = normalizedSn(terminalSn);
    var state = loadState(sn);
    var schedule = state.schedule;
    var now = nowValue == null ? Date.now() : new Date(nowValue).getTime();
    if (!schedule || ["scheduled", "running"].indexOf(schedule.status) === -1 || new Date(schedule.scheduledFor).getTime() > now) {
      return { executed: false, state: clone(state) };
    }

    schedule.status = "running";
    schedule.updatedAt = nowIso();
    state.schedule = schedule;
    persistState(state, "schedule:running");

    try {
      var result = catalog.fillProductMapToPar(sn);
      state = loadState(sn);
      state.schedule = null;
      state.lastExecution = {
        executionId: makeId("fill"),
        scheduleId: schedule.scheduleId,
        source: "scheduled",
        status: "completed",
        scheduledFor: schedule.scheduledFor,
        executedAt: nowIso(),
        binsUpdated: result.binsUpdated,
        unitsAdded: result.unitsAdded,
        error: ""
      };
      persistState(state, "schedule:completed");
      return { executed: true, success: true, result: clone(result), state: clone(state) };
    } catch (error) {
      state = loadState(sn);
      state.schedule = Object.assign({}, schedule, {
        status: "failed",
        updatedAt: nowIso(),
        error: error && error.message ? error.message : "Automatic fill failed."
      });
      state.lastExecution = {
        executionId: makeId("fill"),
        scheduleId: schedule.scheduleId,
        source: "scheduled",
        status: "failed",
        scheduledFor: schedule.scheduledFor,
        executedAt: nowIso(),
        binsUpdated: 0,
        unitsAdded: 0,
        error: state.schedule.error
      };
      persistState(state, "schedule:failed");
      return { executed: true, success: false, error: state.schedule.error, state: clone(state) };
    }
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
      if (!event.key || event.key.indexOf(STORAGE_PREFIX) !== 0) return;
      emit({ type: "storage:synced", terminalSn: event.key.slice(STORAGE_PREFIX.length), state: null });
    });
  }

  window.PaywizardPickList = Object.freeze({
    VERSION: VERSION,
    STORAGE_PREFIX: STORAGE_PREFIX,
    EVENT_NAME: EVENT_NAME,
    createSnapshot: createSnapshot,
    getSchedule: getSchedule,
    getLastExecution: getLastExecution,
    getTimeZoneInfo: getTimeZoneInfo,
    saveSchedule: saveSchedule,
    cancelSchedule: cancelSchedule,
    recordManualFill: recordManualFill,
    executeDueSchedule: executeDueSchedule,
    subscribe: subscribe
  });
})(window);
