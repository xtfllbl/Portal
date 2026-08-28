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

  const terminalCapabilities = {
    WP6267UQ36002376: { name: "Terminal - WP6267UQ36002376", storeId: "s-midtown", temperature: ["temperature_range", "refrigeration_fault", "temperature_unavailable"] },
    "NYC-Q3-0042": { name: "Lobby Vending Q3", storeId: "s-midtown", temperature: [] },
    "NYC-Q3-0043": { name: "Breakroom Cooler Q3", storeId: "s-midtown", temperature: ["temperature_range", "temperature_unavailable"] },
    "BOS-Q3-0018": { name: "Cafeteria Q3", storeId: "s-boston", temperature: ["temperature_range", "refrigeration_fault", "temperature_unavailable"] }
  };

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
    body.innerHTML = items.length ? items.map((item) => `
      <tr data-incident-id="${escapeHtml(item.id)}">
        <td><span class="alert-status ${item.state.toLowerCase()}">${escapeHtml(item.state)}</span></td>
        <td><div class="alert-condition-cell"><strong>${escapeHtml(recipeFor(item.condition).label)}</strong><small>${escapeHtml(item.terminalName)} · ${escapeHtml(item.store)}</small></div></td>
        <td>${escapeHtml(item.evidence)}</td><td>${escapeHtml(item.opened)}<br><small>${escapeHtml(item.duration || "--")}</small></td><td><span class="alert-source">${escapeHtml(item.source)}</span></td>
        <td>${item.state === "Open" ? `<button class="alert-table-button" type="button" data-alert-acknowledge="${escapeHtml(item.id)}">Acknowledge</button>` : ""}<button class="alert-table-button" type="button" data-alert-view="${escapeHtml(item.id)}">View timeline</button></td>
      </tr>`).join("") : '<tr><td class="alert-empty" colspan="7">No incidents match the current filters.</td></tr>';
  }

  function renderRules() {
    const body = surface.querySelector("[data-alert-rules]");
    if (!body) return;
    const items = visibleRules();
    body.innerHTML = items.length ? items.map((item) => `
      <tr data-rule-id="${escapeHtml(item.id)}">
        <td><div class="alert-condition-cell"><strong>${escapeHtml(recipeFor(item.condition).label)}</strong>${pageType === "center" ? `<small>${escapeHtml(item.targetType)} · ${escapeHtml(item.targetName)}</small>` : `<small>${escapeHtml(recipeFor(item.condition).hint)}</small>`}</div></td>
        <td>${escapeHtml(item.criteria)}</td><td>${escapeHtml(item.recipients.join(", "))}</td><td><span class="alert-status ${item.status.toLowerCase()}">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.modified)}</td>
        <td>${canManageAlerts ? `<button class="alert-table-button" type="button" data-alert-toggle="${escapeHtml(item.id)}">${item.status === "Active" ? "Pause" : "Resume"}</button><button class="alert-table-button" type="button" data-alert-edit="${escapeHtml(item.id)}">Edit</button>` : '<span class="alerts-page-copy">View only</span>'}</td>
      </tr>`).join("") : '<tr><td class="alert-empty" colspan="6">No organization-owned rules match this context.</td></tr>';
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
  const portalRecipient = modal.querySelector("[data-alert-portal-recipient]");
  const incidentModal = document.querySelector("[data-alert-incident-modal]");

  surface.querySelectorAll("[data-alert-create]").forEach((button) => { if (!canManageAlerts) button.hidden = true; });

  conditionSelect.innerHTML = Object.entries(recipes).map(([key, recipe]) => `<option value="${key}">${escapeHtml(recipe.label)}</option>`).join("");

  function fieldMarkup(field, current = {}) {
    const value = current[field.key] ?? field.value;
    if (field.type === "select") return `<div class="alert-field"><label for="alert-param-${field.key}">${escapeHtml(field.label)}</label><select id="alert-param-${field.key}" data-alert-param="${field.key}">${field.options.map((option) => `<option${option === value ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>`;
    return `<div class="alert-field"><label for="alert-param-${field.key}">${escapeHtml(field.label)}</label><input id="alert-param-${field.key}" type="number" value="${escapeHtml(value)}" ${field.min != null ? `min="${field.min}"` : ""} ${field.max != null ? `max="${field.max}"` : ""} data-alert-param="${field.key}" required><small>${escapeHtml(field.suffix || "")}</small></div>`;
  }

  function renderConditionFields(current = {}) {
    const recipe = recipeFor(conditionSelect.value);
    conditionFields.innerHTML = recipe.fields.length ? recipe.fields.map((field) => fieldMarkup(field, current)).join("") : `<div class="alert-coverage-card">No threshold is required. Paywizard evaluates the normalized ${escapeHtml(recipe.hint.toLowerCase())} signal.</div>`;
    const isTemperature = conditionSelect.value.startsWith("temperature") || conditionSelect.value === "refrigeration_fault";
    const selectedTarget = targetMetadata();
    const inventory = selectedTarget.type === "Store"
      ? Object.entries(terminalCapabilities).filter(([, item]) => item.storeId === selectedTarget.id).map(([id, item]) => ({ id, ...item }))
      : [{ id: selectedTarget.id, ...(terminalCapabilities[selectedTarget.id] || { name: selectedTarget.name, temperature: ["temperature_range", "refrigeration_fault", "temperature_unavailable"] }) }];
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
  function addPortalRecipient() {
    const value = portalRecipient?.value;
    if (value && !recipients.includes(value)) recipients.push(value);
    renderRecipientTags();
  }

  function targetMetadata() {
    if (pageType === "terminal") return { type: "Terminal", id: terminalId, name: terminalName };
    const [type, id, name] = String(target.value).split("|");
    return { type: type || "Store", id: id || "s-midtown", name: name || "Midtown Store" };
  }

  function openModal(ruleId) {
    modalTrigger = document.activeElement;
    editingId = ruleId || null;
    const rule = editingId ? state.rules.find((item) => item.id === editingId) : null;
    modal.querySelector("h2").textContent = rule ? "Edit Alert Rule" : "Create Alert Rule";
    conditionSelect.value = rule?.condition || "opc_offline";
    conditionSelect.disabled = Boolean(rule);
    if (pageType === "terminal") target.value = terminalId;
    else target.value = rule ? `${rule.targetType}|${rule.targetId}|${rule.targetName}` : "Store|s-midtown|Midtown Store";
    recipients = rule ? rule.recipients.filter((item) => item !== "Portal Inbox") : ["Alex Morgan (Store Manager)"];
    renderRecipientTags();
    renderConditionFields(rule?.parameters || {});
    repeat.checked = Boolean(rule?.repeatHours);
    repeatInterval.disabled = !repeat.checked;
    repeatInterval.value = String(rule?.repeatHours || 2);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => conditionSelect.focus(), 0);
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
    if (channels.includes("Portal Inbox") && !recipients.some((item) => !item.includes("@"))) { recipientError.textContent = "Add a verified portal user for Portal Inbox."; portalRecipient?.focus(); return; }
    if (channels.includes("Email") && !recipients.some((item) => item.includes("@"))) { recipientError.textContent = "Add an external email recipient for Email."; recipientInput.focus(); return; }
    const condition = conditionSelect.value;
    const existing = editingId ? state.rules.find((item) => item.id === editingId) : null;
    const monitoringTarget = targetMetadata();
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
        <div><span>Source</span><strong>${escapeHtml(incident.source)}</strong></div>
      </div>
      <div class="alert-timeline">
        <div><span></span><p><strong>${escapeHtml(incident.opened)} · Opened</strong><small>${escapeHtml(incident.evidence)}</small></p></div>
        ${incident.acknowledged || incident.state === "Acknowledged" ? `<div><span></span><p><strong>${escapeHtml(incident.acknowledged || "2026-08-28 08:02 by Alex Morgan")} · Acknowledged</strong><small>The incident was seen; monitoring continued until observed Recovery.</small></p></div>` : ""}
        ${incident.recovered ? `<div><span></span><p><strong>${escapeHtml(incident.recovered)} · Recovery observed</strong><small>${escapeHtml(incident.evidence)}</small></p></div>` : ""}
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
  target.addEventListener("change", () => renderConditionFields());
  modal.querySelector("[data-alert-add-recipient]").addEventListener("click", addRecipient);
  modal.querySelector("[data-alert-add-portal-recipient]")?.addEventListener("click", addPortalRecipient);
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
