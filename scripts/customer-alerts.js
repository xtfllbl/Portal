(function () {
  "use strict";

  const STORAGE_KEY = "paywizard.customerAlerts.v1";
  const surface = document.querySelector("[data-alert-page]");
  const modal = document.querySelector("[data-alert-modal]");
  if (!surface || !modal) return;

  const recipes = {
    opc_offline: { label: "OPC Offline", hint: "Payment Service Unavailable only", criteria: "Unavailable for {duration} minutes", fields: [{ key: "duration", label: "Unavailable for", type: "number", value: 15, suffix: "minutes", min: 1 }] },
    no_approved_transaction: { label: "No Approved Transaction", hint: "Uses the last Approved Transaction", criteria: "No approved transaction for {duration} hours", fields: [{ key: "duration", label: "No transaction for", type: "number", value: 2, suffix: "hours", min: 1 }, { key: "grace", label: "Opening grace", type: "number", value: 30, suffix: "minutes", min: 0 }, { key: "schedule", label: "Evaluation schedule", type: "select", value: "Store business hours", options: ["Store business hours"] }] },
    machine_stock: { label: "Machine Stock Below % PAR", hint: "Total Product Map On Hand / total PAR", criteria: "Machine stock below {threshold}% PAR", fields: [{ key: "threshold", label: "Below", type: "number", value: 25, suffix: "% PAR", min: 1, max: 100 }] },
    any_bin: { label: "Any BIN Below Quantity", hint: "Evaluates each Product Map position", criteria: "Any BIN below {threshold} units", fields: [{ key: "threshold", label: "Below quantity", type: "number", value: 2, suffix: "units", min: 0 }] },
    selected_product: { label: "Selected Product / BIN Below % PAR", hint: "Matches a stable Product Map position", criteria: "{product} below {threshold}% PAR", fields: [{ key: "product", label: "Product / BIN", type: "select", value: "A1 · Sparkling Water", options: ["A1 · Sparkling Water", "A2 · Cola Zero", "B1 · Trail Mix"] }, { key: "threshold", label: "Below", type: "number", value: 30, suffix: "% PAR", min: 1, max: 100 }] },
    sold_out: { label: "Sold Out", hint: "Product Map On Hand = 0", criteria: "Any monitored BIN has On Hand = 0", fields: [] },
    temperature_range: { label: "Temperature Out of Range", hint: "Normalized numeric readings", criteria: "Outside {lower}–{upper} °C for {duration} minutes", fields: [{ key: "lower", label: "Lower bound", type: "number", value: 2, suffix: "°C" }, { key: "upper", label: "Upper bound", type: "number", value: 8, suffix: "°C" }, { key: "duration", label: "Sustained breach", type: "number", value: 30, suffix: "minutes", min: 15 }, { key: "recoveryLower", label: "Recovery lower bound", type: "number", value: 3, suffix: "°C" }, { key: "recoveryUpper", label: "Recovery upper bound", type: "number", value: 7, suffix: "°C" }, { key: "recovery", label: "Sustained recovery", type: "number", value: 30, suffix: "minutes", min: 15 }] },
    refrigeration_fault: { label: "Refrigeration Fault", hint: "Normalized equipment state", criteria: "Normalized refrigeration fault is active", fields: [] },
    temperature_unavailable: { label: "Temperature Data Unavailable", hint: "Expected signal becomes stale or faulty", criteria: "Temperature data exceeds expected freshness", fields: [] }
  };

  const fullTemperatureCapabilities = ["temperature_range", "refrigeration_fault", "temperature_unavailable"];
  const monitoringHierarchy = [
    {
      id: "sp-universal", name: "Universal Processing", agents: [], merchants: [
        { id: "merchant-kind-world", name: "1 of a Kind World Travel LLC", stores: [
          { id: "s-midtown", name: "Midtown Store", terminals: [
            { id: "WP6267UQ36002376", name: "Terminal - WP6267UQ36002376", temperature: fullTemperatureCapabilities },
            { id: "NYC-Q3-0042", name: "Lobby Vending Q3", temperature: [] },
            { id: "NYC-Q3-0043", name: "Breakroom Cooler Q3", temperature: ["temperature_range", "temperature_unavailable"] }
          ] },
          { id: "s-boston", name: "Boston Office", terminals: [
            { id: "BOS-Q3-0018", name: "Cafeteria Q3", temperature: fullTemperatureCapabilities }
          ] }
        ] }
      ]
    },
    {
      id: "sp-eu-direct", name: "Europe Direct", agents: [], merchants: [
        { id: "demo-cafe-berlin", name: "Demo Cafe Berlin", stores: [
          { id: "berlin-mitte", name: "Berlin Mitte", terminals: [
            { id: "WP44907Q33200398", name: "Retail shop T1", temperature: fullTemperatureCapabilities },
            { id: "WP44907Q33200412", name: "Retail shop T2", temperature: ["temperature_range", "temperature_unavailable"] }
          ] }
        ] }
      ]
    },
    {
      id: "sp-north-america", name: "North America Ops", agents: [
        { id: "agent-seattle", name: "Seattle Field Agent", merchants: [
          { id: "seattle-central", name: "Seattle Central", stores: [
            { id: "ev-charger-hub", name: "EV Charger Hub", terminals: [
              { id: "WP7300EV33001088", name: "EV Charger Bay 07", temperature: fullTemperatureCapabilities }
            ] }
          ] }
        ] },
        { id: "agent-waou", name: "Waou Distribution", merchants: [
          { id: "waou-terminal", name: "Waou Terminal", stores: [
            { id: "waou-main", name: "Waou Main Store", terminals: [
              { id: "WP52205Q33000977", name: "Waou Terminal 01", temperature: fullTemperatureCapabilities },
              { id: "WP52205Q33000981", name: "Waou Terminal 05", temperature: [] }
            ] }
          ] }
        ] }
      ], merchants: []
    },
    {
      id: "sp-poland", name: "Poland Service Hub", agents: [], merchants: [
        { id: "cartpoland-01", name: "CARTPOLAND-01", stores: [
          { id: "warsaw-vending", name: "Warsaw Vending Area", terminals: [
            { id: "WP2013Q321000014", name: "Vending Machine 04", temperature: [] },
            { id: "WP2013Q321000018", name: "Vending Machine 08", temperature: ["temperature_range", "temperature_unavailable"] }
          ] }
        ] }
      ]
    }
  ];

  const terminalCapabilities = {};
  monitoringHierarchy.forEach((provider) => {
    const merchantGroups = provider.agents.length ? provider.agents.map((agent) => agent.merchants) : [provider.merchants];
    merchantGroups.flat().forEach((merchant) => merchant.stores.forEach((store) => store.terminals.forEach((terminal) => {
      terminalCapabilities[terminal.id] = { name: terminal.name, storeId: store.id, temperature: terminal.temperature || [] };
    })));
  });

  const nowLabel = "2026-08-28 10:42";
  const defaultState = () => ({
    rules: [
      { id: "r-stock", condition: "machine_stock", targetType: "Terminal", targetId: "WP6267UQ36002376", targetName: "Terminal - WP6267UQ36002376", criteria: "Machine stock below 25% PAR", recipients: ["Portal Inbox", "ops@merchant.example"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-27 16:20", owner: "1 of a Kind World Travel LLC" },
      { id: "r-temp", condition: "temperature_unavailable", targetType: "Store", targetId: "s-midtown", targetName: "Midtown Store", criteria: "Temperature data exceeds expected freshness", recipients: ["Portal Inbox", "facilities@merchant.example"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-26 09:35", owner: "1 of a Kind World Travel LLC" }
    ],
    incidents: [
      { id: "i-1007", state: "Open", condition: "no_approved_transaction", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "Last approved transaction 3h 18m ago", opened: "2026-08-28 07:24", duration: "3h 18m", source: "My organization" },
      { id: "i-1006", state: "Acknowledged", condition: "any_bin", terminalId: "NYC-Q3-0042", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "BIN A4 On Hand 1 · threshold 2", opened: "2026-08-28 06:10", duration: "4h 32m", source: "Customer Alert · Managed by Service Provider" },
      { id: "i-1005", state: "Resolved", condition: "opc_offline", terminalId: "BOS-Q3-0018", terminalName: "Cafeteria Q3", store: "Boston Office", evidence: "Payment Service recovered after 42m", opened: "2026-08-27 21:04", duration: "42m", recovered: "2026-08-27 21:46", source: "Platform-managed Alert" }
    ]
  });

  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const recipeFor = (key) => recipes[key] || recipes.opc_offline;
  const notificationLabel = (value) => value === "Portal Inbox" ? "Portal Alerts" : value;
  const sourceLabel = (source) => ({
    "My organization": "Account rule",
    "Customer Alert · Managed by Service Provider": "Service provider rule",
    "Platform-managed Alert": "Platform rule"
  }[source] || source);

  function providerFor(id) { return monitoringHierarchy.find((provider) => provider.id === id) || null; }
  function agentFor(providerId, agentId) { return providerFor(providerId)?.agents.find((agent) => agent.id === agentId) || null; }
  function merchantsFor(providerId, agentId) {
    const provider = providerFor(providerId);
    if (!provider) return [];
    return provider.agents.length ? (agentFor(providerId, agentId)?.merchants || []) : provider.merchants;
  }
  function merchantFor(providerId, agentId, merchantId) { return merchantsFor(providerId, agentId).find((merchant) => merchant.id === merchantId) || null; }
  function storeFor(providerId, agentId, merchantId, storeId) { return merchantFor(providerId, agentId, merchantId)?.stores.find((store) => store.id === storeId) || null; }
  function terminalFor(providerId, agentId, merchantId, storeId, terminalId) { return storeFor(providerId, agentId, merchantId, storeId)?.terminals.find((terminal) => terminal.id === terminalId) || null; }
  function findTargetPath(targetType, targetId) {
    for (const provider of monitoringHierarchy) {
      const agents = provider.agents.length ? provider.agents : [null];
      for (const agent of agents) {
        const merchants = agent ? agent.merchants : provider.merchants;
        for (const merchant of merchants) {
          if (targetType === "Merchant" && merchant.id === targetId) return { provider, agent, merchant, store: null, terminal: null };
          for (const store of merchant.stores) {
            if (targetType === "Store" && store.id === targetId) return { provider, agent, merchant, store, terminal: null };
            const terminal = store.terminals.find((item) => item.id === targetId);
            if (targetType === "Terminal" && terminal) return { provider, agent, merchant, store, terminal };
          }
        }
      }
    }
    return null;
  }
  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || !Array.isArray(parsed.rules) || !Array.isArray(parsed.incidents)) throw new Error("invalid");
      return parsed;
    } catch (_) {
      const state = defaultState();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
      return state;
    }
  }
  let state = readState();
  const writeState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const pageType = surface.dataset.alertPage;
  const terminalId = window.terminalContext?.sn || "WP6267UQ36002376";
  const terminalName = window.terminalContext?.terminalName || "Terminal - WP6267UQ36002376";
  const ownerName = "1 of a Kind World Travel LLC";
  const canManageAlerts = new URLSearchParams(location.search).get("manageAlerts") !== "false";
  surface.querySelectorAll("[data-alert-terminal-name]").forEach((node) => { node.textContent = terminalName; });

  function visibleIncidents() {
    let items = [...state.incidents];
    if (pageType === "terminal") items = items.filter((item) => item.terminalId === terminalId);
    const search = surface.querySelector("[data-alert-search]")?.value.trim().toLowerCase() || "";
    const stateFilter = surface.querySelector("[data-alert-state-filter]")?.value || "all";
    const storeFilter = surface.querySelector("[data-alert-store-filter]")?.value || "all";
    const terminalFilter = surface.querySelector("[data-alert-terminal-filter]")?.value || "all";
    const conditionFilter = surface.querySelector("[data-alert-condition-filter]")?.value || "all";
    const sourceFilter = surface.querySelector("[data-alert-source-filter]")?.value || "all";
    return items.filter((item) => {
      const recipe = recipeFor(item.condition);
      const haystack = `${recipe.label} ${item.terminalName} ${item.store} ${item.evidence} ${item.source}`.toLowerCase();
      return (!search || haystack.includes(search)) && (stateFilter === "all" || item.state === stateFilter) && (storeFilter === "all" || item.store === storeFilter) && (terminalFilter === "all" || item.terminalId === terminalFilter) && (conditionFilter === "all" || item.condition === conditionFilter) && (sourceFilter === "all" || item.source === sourceFilter);
    });
  }

  function visibleRules() {
    let items = [...state.rules];
    if (pageType === "terminal") items = items.filter((item) => item.targetType === "Terminal" && item.targetId === terminalId);
    const search = surface.querySelector("[data-alert-search]")?.value.trim().toLowerCase() || "";
    return items.filter((item) => !search || `${recipeFor(item.condition).label} ${item.targetName} ${item.criteria}`.toLowerCase().includes(search));
  }

  function renderIncidents() {
    const body = surface.querySelector("[data-alert-incidents]");
    if (!body) return;
    const items = visibleIncidents();
    body.innerHTML = items.length ? items.map((item) => {
      const targetCell = pageType === "center" ? `<td class="alert-target-cell">${escapeHtml(item.terminalName)} · ${escapeHtml(item.store)}</td>` : "";
      const sourceCell = pageType === "center" ? `<td><span class="alert-source">${escapeHtml(sourceLabel(item.source))}</span></td>` : "";
      const opened = `${escapeHtml(item.opened)}${item.duration ? ` · ${escapeHtml(item.duration)}` : ""}`;
      return `
        <tr data-incident-id="${escapeHtml(item.id)}">
          <td><span class="alert-status ${item.state.toLowerCase()}">${escapeHtml(item.state)}</span></td>
          <td><div class="alert-condition-cell"><strong>${escapeHtml(recipeFor(item.condition).label)}</strong></div></td>
          ${targetCell}
          <td>${escapeHtml(item.evidence)}</td><td>${opened}</td>${sourceCell}
          <td>${item.state === "Open" ? `<button class="alert-table-button" type="button" data-alert-acknowledge="${escapeHtml(item.id)}">Acknowledge</button>` : ""}<button class="alert-table-button" type="button" data-alert-view="${escapeHtml(item.id)}">View timeline</button></td>
        </tr>`;
    }).join("") : `<tr><td class="alert-empty" colspan="${pageType === "center" ? 7 : 5}">No incidents match the current filters.</td></tr>`;
  }

  function renderRules() {
    const body = surface.querySelector("[data-alert-rules]");
    if (!body) return;
    const items = visibleRules();
    body.innerHTML = items.length ? items.map((item) => `
      <tr data-rule-id="${escapeHtml(item.id)}">
        <td><div class="alert-condition-cell"><strong>${escapeHtml(recipeFor(item.condition).label)}</strong></div></td>
        ${pageType === "center" ? `<td class="alert-target-cell">${escapeHtml(item.targetType)} · ${escapeHtml(item.targetName)}</td>` : ""}
        <td>${escapeHtml(item.criteria)}</td><td>${escapeHtml(item.recipients.map(notificationLabel).join(", "))}</td><td><span class="alert-status ${item.status.toLowerCase()}">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.modified)}</td>
        <td>${canManageAlerts ? `<button class="alert-table-button" type="button" data-alert-toggle="${escapeHtml(item.id)}">${item.status === "Active" ? "Pause" : "Resume"}</button><button class="alert-table-button" type="button" data-alert-edit="${escapeHtml(item.id)}">Edit</button>` : '<span class="alerts-page-copy">View only</span>'}</td>
      </tr>`).join("") : `<tr><td class="alert-empty" colspan="${pageType === "center" ? 7 : 6}">No organization-owned rules match this context.</td></tr>`;
  }

  function renderCounts() {
    const values = { open: state.incidents.filter((i) => i.state === "Open").length, acknowledged: state.incidents.filter((i) => i.state === "Acknowledged").length, resolved: state.incidents.filter((i) => i.state === "Resolved").length, rules: state.rules.filter((r) => r.status === "Active").length };
    Object.entries(values).forEach(([key, value]) => { surface.querySelectorAll(`[data-alert-count="${key}"]`).forEach((node) => { node.textContent = String(value); }); });
  }
  function renderAll() { renderIncidents(); renderRules(); renderCounts(); }

  let modalTrigger = null;
  let editingId = null;
  let recipients = [];
  const form = modal.querySelector("[data-alert-form]");
  const conditionSelect = modal.querySelector("[data-alert-condition]");
  const target = modal.querySelector("[data-alert-target]");
  const conditionFields = modal.querySelector("[data-alert-condition-fields]");
  const coverage = modal.querySelector("[data-alert-coverage]");
  const coverageCard = modal.querySelector("[data-alert-coverage-card]");
  const recipientInput = modal.querySelector("[data-alert-recipient-input]");
  const recipientTags = modal.querySelector("[data-alert-recipient-tags]");
  const recipientError = modal.querySelector("[data-alert-recipient-error]");
  const saveButton = modal.querySelector('[type="submit"]');
  const repeat = modal.querySelector("[data-alert-repeat]");
  const repeatInterval = modal.querySelector("[data-alert-repeat-interval]");
  const providerSelect = modal.querySelector("[data-alert-provider]");
  const agentSelect = modal.querySelector("[data-alert-agent]");
  const scopeSelect = modal.querySelector("[data-alert-scope]");
  const merchantSelect = modal.querySelector("[data-alert-merchant]");
  const storeSelect = modal.querySelector("[data-alert-store]");
  const terminalSelect = modal.querySelector("[data-alert-terminal]");
  const targetError = modal.querySelector("[data-alert-target-error]");
  const incidentModal = document.querySelector("[data-alert-incident-modal]");

  surface.querySelectorAll("[data-alert-create]").forEach((button) => { if (!canManageAlerts) button.hidden = true; });

  conditionSelect.innerHTML = Object.entries(recipes).map(([key, recipe]) => `<option value="${key}">${escapeHtml(recipe.label)}</option>`).join("");
  modal.querySelectorAll("[data-alert-terminal-sn]").forEach((node) => { node.textContent = terminalId; });

  function setSelectOptions(select, placeholder, items, selectedValue = "") {
    if (!select) return;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + items.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === selectedValue ? " selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
    select.value = selectedValue;
  }

  function populateProviders(selectedValue = "") {
    setSelectOptions(providerSelect, "Select service provider", monitoringHierarchy, selectedValue);
  }

  function populateAgents(selectedValue = "") {
    const provider = providerFor(providerSelect?.value);
    if (!agentSelect) return;
    agentSelect.required = Boolean(provider?.agents.length);
    if (!provider) {
      setSelectOptions(agentSelect, "Select service provider first", []);
      agentSelect.disabled = true;
    } else if (!provider.agents.length) {
      setSelectOptions(agentSelect, "No agent required", []);
      agentSelect.disabled = true;
    } else {
      setSelectOptions(agentSelect, "Select agent", provider.agents, selectedValue);
      agentSelect.disabled = false;
    }
  }

  function populateMerchants(selectedValue = "") {
    if (!merchantSelect) return;
    const provider = providerFor(providerSelect?.value);
    const agentId = agentSelect?.disabled ? "" : agentSelect?.value;
    const items = merchantsFor(provider?.id, agentId);
    const ready = Boolean(provider && (!provider.agents.length || agentId));
    setSelectOptions(merchantSelect, ready ? "Select merchant" : "Select previous level first", ready ? items : [], selectedValue);
    merchantSelect.disabled = !ready;
  }

  function populateStores(selectedValue = "") {
    if (!storeSelect) return;
    const agentId = agentSelect?.disabled ? "" : agentSelect?.value;
    const merchant = merchantFor(providerSelect?.value, agentId, merchantSelect?.value);
    setSelectOptions(storeSelect, merchant ? "Select store" : "Select merchant first", merchant?.stores || [], selectedValue);
    storeSelect.disabled = !merchant;
  }

  function populateTerminals(selectedValue = "") {
    if (!terminalSelect) return;
    const agentId = agentSelect?.disabled ? "" : agentSelect?.value;
    const store = storeFor(providerSelect?.value, agentId, merchantSelect?.value, storeSelect?.value);
    setSelectOptions(terminalSelect, store ? "Select terminal" : "Select store first", store?.terminals || [], selectedValue);
    terminalSelect.disabled = !store;
  }

  function rangeMetadata() {
    if (pageType !== "center") return null;
    const providerId = providerSelect?.value;
    const provider = providerFor(providerId);
    const agentId = agentSelect?.disabled ? "" : agentSelect?.value;
    const merchant = merchantFor(providerId, agentId, merchantSelect?.value);
    const type = scopeSelect?.value || "Terminal";
    if (!provider || (provider.agents.length && !agentId) || !merchant) return null;
    if (type === "Merchant") return { type, id: merchant.id, name: merchant.name };
    const store = storeFor(providerId, agentId, merchant.id, storeSelect?.value);
    if (!store) return null;
    if (type === "Store") return { type, id: store.id, name: store.name };
    const terminal = terminalFor(providerId, agentId, merchant.id, store.id, terminalSelect?.value);
    return terminal ? { type: "Terminal", id: terminal.id, name: terminal.name } : null;
  }

  function syncScopeControls(selectedStoreId = "", selectedTerminalId = "") {
    if (pageType !== "center") return;
    const scope = scopeSelect.value || "Terminal";
    const agentId = agentSelect.disabled ? "" : agentSelect.value;
    const merchant = merchantFor(providerSelect.value, agentId, merchantSelect.value);
    storeSelect.required = scope !== "Merchant";
    terminalSelect.required = scope === "Terminal";
    if (scope === "Merchant") {
      setSelectOptions(storeSelect, "All stores", []);
      setSelectOptions(terminalSelect, "All terminals", []);
      storeSelect.disabled = true;
      terminalSelect.disabled = true;
    } else {
      populateStores(selectedStoreId);
      if (!merchant) {
        setSelectOptions(terminalSelect, "Select store first", []);
        terminalSelect.disabled = true;
      } else if (scope === "Store") {
        setSelectOptions(terminalSelect, "All terminals", []);
        terminalSelect.disabled = true;
      } else {
        populateTerminals(selectedTerminalId);
      }
    }
    updateRangeTarget();
  }

  function initializeRange(rule = null) {
    if (pageType !== "center") return true;
    const path = rule ? findTargetPath(rule.targetType, rule.targetId) : null;
    populateProviders(path?.provider.id || "");
    providerSelect.value = path?.provider.id || "";
    populateAgents(path?.agent?.id || "");
    if (path?.agent) agentSelect.value = path.agent.id;
    populateMerchants(path?.merchant.id || "");
    if (path?.merchant) merchantSelect.value = path.merchant.id;
    scopeSelect.value = rule?.targetType && ["Merchant", "Store", "Terminal"].includes(rule.targetType) ? rule.targetType : "Terminal";
    syncScopeControls(path?.store?.id || "", path?.terminal?.id || "");
    if (rule && !path) {
      targetError.textContent = `Saved target ${rule.targetName} is no longer available. Choose a monitoring range.`;
      target.value = "";
      conditionSelect.disabled = true;
      conditionFields.innerHTML = "";
      saveButton.disabled = true;
      return false;
    }
    return Boolean(rangeMetadata());
  }

  function fieldMarkup(field, current = {}) {
    const value = current[field.key] ?? field.value;
    const label = `${field.label}${field.suffix ? ` (${field.suffix})` : ""}`;
    if (field.type === "select") return `<div class="alert-field"><label for="alert-param-${field.key}">${escapeHtml(label)}</label><select id="alert-param-${field.key}" data-alert-param="${field.key}">${field.options.map((option) => `<option${option === value ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>`;
    return `<div class="alert-field"><label for="alert-param-${field.key}">${escapeHtml(label)}</label><input id="alert-param-${field.key}" type="number" value="${escapeHtml(value)}" ${field.min != null ? `min="${field.min}"` : ""} ${field.max != null ? `max="${field.max}"` : ""} data-alert-param="${field.key}" required></div>`;
  }

  function renderConditionFields(current = {}) {
    const selectedTarget = targetMetadata();
    if (!selectedTarget) {
      conditionFields.innerHTML = "";
      coverage.textContent = "Select a monitoring range.";
      coverageCard.textContent = "";
      saveButton.disabled = true;
      saveButton.title = "Choose a complete monitoring range.";
      return;
    }
    const recipe = recipeFor(conditionSelect.value);
    conditionFields.innerHTML = recipe.fields.length ? recipe.fields.map((field) => fieldMarkup(field, current)).join("") : "";
    const isTemperature = conditionSelect.value.startsWith("temperature") || conditionSelect.value === "refrigeration_fault";
    const path = findTargetPath(selectedTarget.type, selectedTarget.id);
    let inventory = [];
    if (selectedTarget.type === "Merchant" && path) inventory = path.merchant.stores.flatMap((store) => store.terminals);
    else if (selectedTarget.type === "Store" && path) inventory = path.store.terminals;
    else if (selectedTarget.type === "Terminal" && path) inventory = [path.terminal];
    else if (selectedTarget.type === "Store") inventory = Object.entries(terminalCapabilities).filter(([, item]) => item.storeId === selectedTarget.id).map(([id, item]) => ({ id, ...item }));
    else inventory = [{ id: selectedTarget.id, ...(terminalCapabilities[selectedTarget.id] || { name: selectedTarget.name, temperature: fullTemperatureCapabilities }) }];
    const eligible = isTemperature ? inventory.filter((item) => item.temperature.includes(conditionSelect.value)) : inventory;
    const unsupported = inventory.filter((item) => !eligible.includes(item));
    coverage.textContent = `${eligible.length} eligible Terminal${eligible.length === 1 ? "" : "s"} · ${unsupported.length} unsupported`;
    const capabilityCopy = conditionSelect.value === "refrigeration_fault" ? "Normalized refrigeration-fault state available" : conditionSelect.value === "temperature_unavailable" ? "Expected temperature signal and freshness profile available" : "Normalized numeric readings available · expected cadence 15 minutes · last reading 6 minutes ago · maximum expected detection delay 45 minutes";
    const unsupportedReason = conditionSelect.value === "refrigeration_fault" ? "no normalized refrigeration-fault state" : conditionSelect.value === "temperature_unavailable" ? "integration has no expected temperature signal" : "no normalized numeric readings";
    const eligibleCopy = eligible.length ? `<br><span>Eligible: ${eligible.map((item) => escapeHtml(item.name)).join(", ")}.</span>` : '<br><span class="alert-coverage-excluded">No eligible Terminals.</span>';
    const excludedCopy = unsupported.length ? `<br><span class="alert-coverage-excluded">Excluded: ${unsupported.map((item) => `${escapeHtml(item.name)} · Not supported — ${escapeHtml(unsupportedReason)}`).join("; ")}.</span>` : "";
    coverageCard.innerHTML = isTemperature ? `<strong>${escapeHtml(selectedTarget.name)}</strong><br>${escapeHtml(capabilityCopy)}.${eligibleCopy}${excludedCopy}` : `<strong>${escapeHtml(selectedTarget.name)}</strong><br>Payment Service, Approved Transaction and Product Map canonical signals are available. Store timezone: America/New_York.${eligibleCopy}`;
    saveButton.disabled = eligible.length === 0;
    saveButton.title = eligible.length === 0 ? "This target has no Terminal with the required capability." : "";
  }

  function renderRecipientTags() { recipientTags.innerHTML = recipients.map((item, index) => `<span class="alert-recipient-tag">${escapeHtml(item)}<button type="button" data-alert-remove-recipient="${index}" aria-label="Remove recipient ${escapeHtml(item)}">&times;</button></span>`).join(""); }
  function addRecipient() {
    const value = recipientInput.value.trim().toLowerCase();
    recipientError.textContent = "";
    if (!/^\S+@\S+\.\S+$/.test(value)) { recipientError.textContent = "Enter a valid email address."; return; }
    if (!recipients.includes(value)) recipients.push(value);
    const emailChannel = modal.querySelector('[data-alert-channel][value="Email"]');
    if (emailChannel) emailChannel.checked = true;
    recipientInput.value = "";
    renderRecipientTags();
  }
  function targetMetadata() {
    if (pageType === "terminal") return { type: "Terminal", id: terminalId, name: terminalName };
    return rangeMetadata();
  }

  function updateRangeTarget() {
    if (pageType !== "center") return;
    const metadata = rangeMetadata();
    target.value = metadata ? `${metadata.type}|${metadata.id}|${metadata.name}` : "";
    targetError.textContent = "";
    conditionSelect.disabled = Boolean(editingId) || !metadata;
    renderConditionFields();
  }

  function openModal(ruleId) {
    modalTrigger = document.activeElement;
    editingId = ruleId || null;
    const rule = editingId ? state.rules.find((item) => item.id === editingId) : null;
    modal.querySelector("h2").textContent = rule ? "Edit Alert Rule" : "Create Alert Rule";
    conditionSelect.value = rule?.condition || "opc_offline";
    if (pageType === "terminal") {
      target.value = terminalId;
      conditionSelect.disabled = Boolean(rule);
    } else {
      conditionSelect.disabled = true;
      initializeRange(rule);
    }
    modal.querySelectorAll("[data-alert-channel]").forEach((input) => {
      input.checked = rule ? rule.channels.includes(input.value) : input.value === "Portal Inbox";
    });
    recipients = rule ? rule.recipients.filter((item) => item !== "Portal Inbox" && item.includes("@")) : [];
    renderRecipientTags();
    if (pageType === "terminal" || targetMetadata()) renderConditionFields(rule?.parameters || {});
    repeat.checked = Boolean(rule?.repeatHours);
    repeatInterval.disabled = !repeat.checked;
    repeatInterval.value = String(rule?.repeatHours || 2);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => (pageType === "center" ? providerSelect : conditionSelect).focus(), 0);
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    conditionSelect.disabled = false;
    modalTrigger?.focus();
  }

  function criteriaFor(recipe, parameters) { return recipe.criteria.replace(/\{(\w+)\}/g, (_, key) => parameters[key] ?? ""); }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const parameters = {};
    conditionFields.querySelectorAll("[data-alert-param]").forEach((field) => { parameters[field.dataset.alertParam] = field.type === "number" ? Number(field.value) : field.value; });
    const channels = [...modal.querySelectorAll("[data-alert-channel]:checked")].map((input) => input.value);
    if (!channels.length) { modal.querySelector("[data-alert-channel]").focus(); return; }
    if (channels.includes("Email") && !recipients.some((item) => item.includes("@"))) { recipientError.textContent = "Add an external email recipient for Email."; recipientInput.focus(); return; }
    const condition = conditionSelect.value;
    const existing = editingId ? state.rules.find((item) => item.id === editingId) : null;
    const monitoringTarget = targetMetadata();
    if (!monitoringTarget) {
      if (targetError) targetError.textContent = "Choose a complete monitoring range.";
      providerSelect?.focus();
      return;
    }
    const rule = {
      id: existing?.id || `r-${Date.now()}`, condition, parameters,
      targetType: monitoringTarget.type, targetId: monitoringTarget.id,
      targetName: monitoringTarget.name,
      criteria: criteriaFor(recipeFor(condition), parameters), recipients: [...channels.filter((channel) => channel === "Portal Inbox"), ...recipients], channels,
      repeatHours: repeat.checked ? Number(repeatInterval.value) : null, status: existing?.status || "Active", modified: nowLabel, owner: ownerName
    };
    if (existing) state.rules = state.rules.map((item) => item.id === existing.id ? rule : item); else state.rules.unshift(rule);
    writeState(); closeModal(); renderAll();
  });

  function openIncident(incidentId) {
    const incident = state.incidents.find((item) => item.id === incidentId);
    if (!incident || !incidentModal) return;
    modalTrigger = document.activeElement;
    incidentModal.querySelector("[data-alert-incident-title]").textContent = recipeFor(incident.condition).label;
    incidentModal.querySelector("[data-alert-incident-body]").innerHTML = `
      <div class="alert-incident-summary">
        <div><span>State</span><strong>${escapeHtml(incident.state)}</strong></div>
        <div><span>Terminal</span><strong>${escapeHtml(incident.terminalName)}</strong></div>
        <div><span>Duration</span><strong>${escapeHtml(incident.duration || "Ongoing")}</strong></div>
        ${pageType === "center" ? `<div><span>Source</span><strong>${escapeHtml(sourceLabel(incident.source))}</strong></div>` : ""}
      </div>
      <div class="alert-timeline">
        <div><span></span><p><strong>${escapeHtml(incident.opened)} · Opened</strong><span class="alert-timeline-evidence">${escapeHtml(incident.evidence)}</span></p></div>
        ${incident.acknowledged || incident.state === "Acknowledged" ? `<div><span></span><p><strong>${escapeHtml(incident.acknowledged || "2026-08-28 08:02 by Alex Morgan")} · Acknowledged</strong><span class="alert-timeline-evidence">The incident was seen; monitoring continued until observed Recovery.</span></p></div>` : ""}
        ${incident.recovered ? `<div><span></span><p><strong>${escapeHtml(incident.recovered)} · Recovery observed</strong><span class="alert-timeline-evidence">${escapeHtml(incident.evidence)}</span></p></div>` : ""}
      </div>`;
    incidentModal.classList.add("open");
    incidentModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    incidentModal.querySelector("[data-alert-incident-close]").focus();
  }
  function closeIncident() {
    if (!incidentModal) return;
    incidentModal.classList.remove("open");
    incidentModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    modalTrigger?.focus();
  }

  surface.addEventListener("click", (event) => {
    const create = event.target.closest("[data-alert-create]");
    const ack = event.target.closest("[data-alert-acknowledge]");
    const toggle = event.target.closest("[data-alert-toggle]");
    const edit = event.target.closest("[data-alert-edit]");
    const view = event.target.closest("[data-alert-view]");
    const viewTab = event.target.closest("[data-alert-view-tab]");
    if (create) openModal();
    if (ack) { state.incidents = state.incidents.map((item) => item.id === ack.dataset.alertAcknowledge ? { ...item, state: "Acknowledged", acknowledged: `${nowLabel} by robasz` } : item); writeState(); renderAll(); }
    if (toggle) { state.rules = state.rules.map((item) => item.id === toggle.dataset.alertToggle ? { ...item, status: item.status === "Active" ? "Paused" : "Active", modified: nowLabel } : item); writeState(); renderAll(); }
    if (edit) openModal(edit.dataset.alertEdit);
    if (view) openIncident(view.dataset.alertView);
    if (viewTab) {
      surface.querySelectorAll("[data-alert-view-tab]").forEach((tab) => { const active = tab === viewTab; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
      surface.querySelectorAll("[data-alert-view-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.alertViewPanel !== viewTab.dataset.alertViewTab));
    }
  });
  surface.addEventListener("input", (event) => { if (event.target.matches("[data-alert-search], [data-alert-state-filter], [data-alert-store-filter], [data-alert-terminal-filter], [data-alert-condition-filter], [data-alert-source-filter]")) renderAll(); });
  surface.addEventListener("change", (event) => { if (event.target.matches("[data-alert-state-filter], [data-alert-store-filter], [data-alert-terminal-filter], [data-alert-condition-filter], [data-alert-source-filter]")) renderAll(); });
  conditionSelect.addEventListener("change", () => renderConditionFields());
  if (pageType === "center") {
    providerSelect.addEventListener("change", () => {
      populateAgents();
      populateMerchants();
      syncScopeControls();
    });
    agentSelect.addEventListener("change", () => {
      populateMerchants();
      syncScopeControls();
    });
    merchantSelect.addEventListener("change", () => syncScopeControls());
    scopeSelect.addEventListener("change", () => syncScopeControls());
    storeSelect.addEventListener("change", () => {
      if (scopeSelect.value === "Terminal") populateTerminals();
      updateRangeTarget();
    });
    terminalSelect.addEventListener("change", updateRangeTarget);
  }
  modal.querySelector("[data-alert-add-recipient]").addEventListener("click", addRecipient);
  recipientTags.addEventListener("click", (event) => { const remove = event.target.closest("[data-alert-remove-recipient]"); if (!remove) return; recipients.splice(Number(remove.dataset.alertRemoveRecipient), 1); renderRecipientTags(); });
  recipientInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addRecipient(); } });
  repeat.addEventListener("change", () => { repeatInterval.disabled = !repeat.checked; });
  modal.querySelectorAll("[data-alert-close]").forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  incidentModal?.querySelectorAll("[data-alert-incident-close]").forEach((button) => button.addEventListener("click", closeIncident));
  incidentModal?.addEventListener("click", (event) => { if (event.target === incidentModal) closeIncident(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && modal.classList.contains("open")) closeModal(); else if (event.key === "Escape" && incidentModal?.classList.contains("open")) closeIncident(); });

  renderAll();
})();
