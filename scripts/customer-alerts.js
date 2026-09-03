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
  const demoRules = [
    { id: "r-provider-universal", condition: "opc_offline", targetType: "Store", targetId: "s-midtown", targetName: "Midtown Store", criteria: "Unavailable for 15 minutes", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Active", modified: "2026-08-25 11:15", owner: "Universal Processing", parameters: { duration: 15 }, recoveryChecksRequired: 2 },
    { id: "r-provider-universal--s-boston", condition: "opc_offline", targetType: "Store", targetId: "s-boston", targetName: "Boston Office", criteria: "Unavailable for 15 minutes", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Active", modified: "2026-08-25 11:15", owner: "Universal Processing", parameters: { duration: 15 }, recoveryChecksRequired: 2 },
    { id: "r-provider-boston-soldout", condition: "sold_out", targetType: "Store", targetId: "s-boston", targetName: "Boston Office", criteria: "Any monitored BIN has On Hand = 0", recipients: ["Portal Inbox", "upt.ops@example.com"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-24 16:05", owner: "Universal Processing", parameters: {}, recoveryChecksRequired: 2 },
    { id: "r-provider-boston-fault", condition: "refrigeration_fault", targetType: "Terminal", targetId: "BOS-Q3-0018", targetName: "Cafeteria Q3", criteria: "Normalized refrigeration fault is active", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Paused", modified: "2026-08-23 08:30", owner: "Universal Processing", parameters: {}, recoveryChecksRequired: 2 },
    { id: "r-agent-seattle", condition: "opc_offline", targetType: "Terminal", targetId: "WP7300EV33001088", targetName: "EV Charger Bay 07", criteria: "Unavailable for 10 minutes", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Active", modified: "2026-08-25 09:40", owner: "Seattle Field Agent", parameters: { duration: 10 }, recoveryChecksRequired: 2 },
    { id: "r-agent-seattle-transaction", condition: "no_approved_transaction", targetType: "Store", targetId: "ev-charger-hub", targetName: "EV Charger Hub", criteria: "No approved transaction for 4 hours", recipients: ["Portal Inbox", "seattle.ops@example.com"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-24 12:10", owner: "Seattle Field Agent", parameters: { duration: 4, grace: 30, schedule: "Store business hours" }, recoveryChecksRequired: 2 },
    { id: "r-agent-seattle-temperature", condition: "temperature_unavailable", targetType: "Store", targetId: "ev-charger-hub", targetName: "EV Charger Hub", criteria: "Temperature data exceeds expected freshness", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Paused", modified: "2026-08-22 18:25", owner: "Seattle Field Agent", parameters: {}, recoveryChecksRequired: 2 },
    { id: "r-stock", condition: "machine_stock", targetType: "Terminal", targetId: "WP6267UQ36002376", targetName: "Terminal - WP6267UQ36002376", criteria: "Machine stock below 25% PAR", recipients: ["Portal Inbox", "ops@merchant.example"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-27 16:20", owner: "1 of a Kind World Travel LLC", parameters: { threshold: 25 }, recoveryChecksRequired: 2 },
    { id: "r-merchant-no-transaction", condition: "no_approved_transaction", targetType: "Terminal", targetId: "WP6267UQ36002376", targetName: "Terminal - WP6267UQ36002376", criteria: "No approved transaction for 2 hours", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Active", modified: "2026-08-27 14:12", owner: "1 of a Kind World Travel LLC", parameters: { duration: 2, grace: 30, schedule: "Store business hours" }, recoveryChecksRequired: 2 },
    { id: "r-merchant-temp-range", condition: "temperature_range", targetType: "Terminal", targetId: "WP6267UQ36002376", targetName: "Terminal - WP6267UQ36002376", criteria: "Outside 2–8 °C for 30 minutes", recipients: ["Portal Inbox", "facilities@merchant.example"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-27 11:45", owner: "1 of a Kind World Travel LLC", parameters: { lower: 2, upper: 8, duration: 30, recoveryLower: 3, recoveryUpper: 7, recovery: 30 }, recoveryChecksRequired: 2 },
    { id: "r-merchant-any-bin", condition: "any_bin", targetType: "Terminal", targetId: "WP6267UQ36002376", targetName: "Terminal - WP6267UQ36002376", criteria: "Any BIN below 2 units", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Active", modified: "2026-08-26 17:20", owner: "1 of a Kind World Travel LLC", parameters: { threshold: 2 }, recoveryChecksRequired: 2 },
    { id: "r-merchant-selected-product", condition: "selected_product", targetType: "Terminal", targetId: "WP6267UQ36002376", targetName: "Terminal - WP6267UQ36002376", criteria: "A1 · Sparkling Water below 30% PAR", recipients: ["Portal Inbox", "stock@merchant.example"], channels: ["Portal Inbox", "Email"], status: "Paused", modified: "2026-08-26 13:05", owner: "1 of a Kind World Travel LLC", parameters: { product: "A1 · Sparkling Water", threshold: 30 }, recoveryChecksRequired: 2 },
    { id: "r-temp", condition: "temperature_unavailable", targetType: "Store", targetId: "s-midtown", targetName: "Midtown Store", criteria: "Temperature data exceeds expected freshness", recipients: ["Portal Inbox", "facilities@merchant.example"], channels: ["Portal Inbox", "Email"], status: "Active", modified: "2026-08-26 09:35", owner: "1 of a Kind World Travel LLC", parameters: {}, recoveryChecksRequired: 2 }
  ];

  function demoIncident(input) {
    const acknowledgedAt = input.acknowledgedAt || "";
    const events = [{ at: input.opened, type: "opened", label: "Opened", evidence: input.evidence }];
    if (acknowledgedAt) events.push({ at: acknowledgedAt, type: "acknowledged", label: "Acknowledged", evidence: `Acknowledged by ${input.acknowledgedBy || "Alex Morgan"}` });
    if (input.recoveryHitCount) events.push({ at: input.lastCheckedAt || input.recoveredAt || "2026-08-28 10:30", type: "recovery_check", label: `Recovery check ${input.recoveryHitCount || 1}/${input.recoveryChecksRequired || 2}`, evidence: "The monitored signal returned to normal." });
    if (input.monitoringState === "Resolved") events.push({ at: input.recoveredAt, type: "resolved", label: "Resolved", evidence: "Recovery requirements were satisfied by the monitoring system." });
    if (input.monitoringState === "Closed") events.push({ at: input.closedAt, type: "manual_closure", label: "Closed manually", evidence: `${input.closeReason}${input.closeNote ? ` · ${input.closeNote}` : ""} · ${input.closedBy || "robasz"}` });
    return { recoveryChecksRequired: 2, recoveryHitCount: 0, acknowledgedAt, acknowledgedBy: acknowledgedAt ? (input.acknowledgedBy || "Alex Morgan") : "", recoveredAt: "", closedAt: "", closedBy: "", closeReason: "", closeNote: "", nextChecks: ["normal", "normal"], events, ...input };
  }

  const demoIncidents = [
    demoIncident({ id: "i-mid-01", ruleId: "r-merchant-no-transaction", monitoringState: "Active", condition: "no_approved_transaction", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "Last approved transaction 3h 18m ago", opened: "2026-08-28 07:24", duration: "3h 18m", nextChecks: ["normal", "normal"] }),
    demoIncident({ id: "i-mid-02", ruleId: "r-stock", monitoringState: "Active", condition: "machine_stock", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "On Hand 18 / PAR 24 · 75%", opened: "2026-08-28 06:52", duration: "3h 50m", acknowledgedAt: "2026-08-28 07:05", acknowledgedBy: "Alex Morgan", nextChecks: ["normal", "abnormal", "normal", "normal"] }),
    demoIncident({ id: "i-mid-03", ruleId: "r-merchant-temp-range", monitoringState: "Active", condition: "temperature_range", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "Temperature returned to 6.4 °C", opened: "2026-08-28 05:40", duration: "5h 02m", acknowledgedAt: "2026-08-28 05:51", recoveryHitCount: 1, lastCheckedAt: "2026-08-28 10:30", nextChecks: ["normal"] }),
    demoIncident({ id: "i-mid-04", ruleId: "r-merchant-any-bin", monitoringState: "Resolved", condition: "any_bin", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "BIN B1 replenished to 6 units", opened: "2026-08-27 19:10", duration: "1h 06m", acknowledgedAt: "2026-08-27 19:18", recoveryHitCount: 2, recoveredAt: "2026-08-27 20:16", nextChecks: [] }),
    demoIncident({ id: "i-mid-05", ruleId: "r-merchant-selected-product", monitoringState: "Closed", condition: "selected_product", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "A1 · Sparkling Water at 2 / 10 PAR", opened: "2026-08-27 16:35", duration: "18h 07m", acknowledgedAt: "2026-08-27 16:40", closedAt: "2026-08-27 17:02", closedBy: "robasz", closeReason: "Replenishment in progress", closeNote: "Scheduled route arrives this afternoon.", nextChecks: ["normal", "normal"] }),
    demoIncident({ id: "i-mid-06", ruleId: "r-merchant-any-bin", monitoringState: "Active", condition: "any_bin", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "BIN C2 On Hand 1 · threshold 2", opened: "2026-08-28 09:26", duration: "1h 16m", nextChecks: ["abnormal", "normal", "normal"] }),
    demoIncident({ id: "i-mid-07", ruleId: "r-provider-universal", monitoringState: "Resolved", condition: "opc_offline", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "Payment Service available", opened: "2026-08-26 22:10", duration: "38m", recoveryHitCount: 2, recoveredAt: "2026-08-26 22:48", nextChecks: [] }),
    demoIncident({ id: "i-mid-08", ruleId: "r-provider-boston-soldout", monitoringState: "Closed", condition: "sold_out", terminalId: "WP6267UQ36002376", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "BIN D4 On Hand = 0", opened: "2026-08-26 14:20", duration: "20h 22m", closedAt: "2026-08-26 15:00", closedBy: "Alex Morgan", closeReason: "False positive", closeNote: "BIN removed from the active planogram.", recoveredAt: "2026-08-26 15:30", nextChecks: [] }),
    demoIncident({ id: "i-lobby-01", ruleId: "r-merchant-any-bin", monitoringState: "Active", condition: "any_bin", terminalId: "NYC-Q3-0042", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "BIN A4 On Hand 1 · threshold 2", opened: "2026-08-28 06:10", duration: "4h 32m", acknowledgedAt: "2026-08-28 06:22", nextChecks: ["normal", "normal"] }),
    demoIncident({ id: "i-lobby-02", ruleId: "r-provider-universal", monitoringState: "Active", condition: "opc_offline", terminalId: "NYC-Q3-0042", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "Payment Service available on the latest check", opened: "2026-08-28 08:15", duration: "2h 27m", recoveryHitCount: 1, nextChecks: ["normal"] }),
    demoIncident({ id: "i-lobby-03", ruleId: "r-merchant-no-transaction", monitoringState: "Resolved", condition: "no_approved_transaction", terminalId: "NYC-Q3-0042", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "Approved transaction received", opened: "2026-08-27 13:05", duration: "2h 45m", acknowledgedAt: "2026-08-27 13:15", recoveryHitCount: 2, recoveredAt: "2026-08-27 15:50", nextChecks: [] }),
    demoIncident({ id: "i-lobby-04", ruleId: "r-provider-universal", monitoringState: "Closed", condition: "opc_offline", terminalId: "NYC-Q3-0042", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "Payment Service unavailable during planned network work", opened: "2026-08-25 23:10", duration: "1h 20m", acknowledgedAt: "2026-08-25 23:12", closedAt: "2026-08-25 23:15", closedBy: "robasz", closeReason: "Planned maintenance", recoveredAt: "2026-08-26 00:30", nextChecks: [] }),
    demoIncident({ id: "i-break-01", ruleId: "r-temp", monitoringState: "Active", condition: "temperature_unavailable", terminalId: "NYC-Q3-0043", terminalName: "Breakroom Cooler Q3", store: "Midtown Store", evidence: "Last temperature reading 52 minutes ago", opened: "2026-08-28 09:45", duration: "57m", nextChecks: ["normal", "normal"] }),
    demoIncident({ id: "i-break-02", ruleId: "r-merchant-temp-range", monitoringState: "Active", condition: "temperature_range", terminalId: "NYC-Q3-0043", terminalName: "Breakroom Cooler Q3", store: "Midtown Store", evidence: "Temperature 6.8 °C · recovery window 15 / 30 minutes", opened: "2026-08-28 08:10", duration: "2h 32m", acknowledgedAt: "2026-08-28 08:20", recoveryHitCount: 1, nextChecks: ["normal"] }),
    demoIncident({ id: "i-break-03", ruleId: "r-stock", monitoringState: "Resolved", condition: "machine_stock", terminalId: "NYC-Q3-0043", terminalName: "Breakroom Cooler Q3", store: "Midtown Store", evidence: "Stock restored to 81% PAR", opened: "2026-08-27 09:30", duration: "3h 15m", recoveryHitCount: 2, recoveredAt: "2026-08-27 12:45", nextChecks: [] }),
    demoIncident({ id: "i-boston-01", ruleId: "r-provider-boston-fault", monitoringState: "Active", condition: "refrigeration_fault", terminalId: "BOS-Q3-0018", terminalName: "Cafeteria Q3", store: "Boston Office", evidence: "Normalized refrigeration fault is active", opened: "2026-08-28 09:12", duration: "1h 30m", acknowledgedAt: "2026-08-28 09:25", nextChecks: ["abnormal", "normal", "normal"] }),
    demoIncident({ id: "i-boston-02", ruleId: "r-provider-boston-soldout", monitoringState: "Resolved", condition: "sold_out", terminalId: "BOS-Q3-0018", terminalName: "Cafeteria Q3", store: "Boston Office", evidence: "All monitored BINs have stock", opened: "2026-08-27 21:04", duration: "42m", acknowledgedAt: "2026-08-27 21:10", recoveryHitCount: 2, recoveredAt: "2026-08-27 21:46", nextChecks: [] }),
    demoIncident({ id: "i-boston-03", ruleId: "r-provider-universal--s-boston", monitoringState: "Closed", condition: "opc_offline", terminalId: "BOS-Q3-0018", terminalName: "Cafeteria Q3", store: "Boston Office", evidence: "Payment Service unavailable", opened: "2026-08-26 10:05", duration: "24m", closedAt: "2026-08-26 10:12", closedBy: "robasz", closeReason: "Duplicate incident", recoveredAt: "2026-08-26 10:29", nextChecks: [] }),
    demoIncident({ id: "i-seattle-01", ruleId: "r-agent-seattle", monitoringState: "Active", condition: "opc_offline", terminalId: "WP7300EV33001088", terminalName: "EV Charger Bay 07", store: "EV Charger Hub", evidence: "Payment Service unavailable for 18 minutes", opened: "2026-08-28 10:24", duration: "18m", nextChecks: ["normal", "normal"] }),
    demoIncident({ id: "i-seattle-02", ruleId: "r-agent-seattle-transaction", monitoringState: "Active", condition: "no_approved_transaction", terminalId: "WP7300EV33001088", terminalName: "EV Charger Bay 07", store: "EV Charger Hub", evidence: "No approved transaction for 4h 22m", opened: "2026-08-28 06:20", duration: "4h 22m", acknowledgedAt: "2026-08-28 06:35", nextChecks: ["normal", "abnormal", "normal", "normal"] }),
    demoIncident({ id: "i-seattle-03", ruleId: "r-agent-seattle-temperature", monitoringState: "Active", condition: "temperature_unavailable", terminalId: "WP7300EV33001088", terminalName: "EV Charger Bay 07", store: "EV Charger Hub", evidence: "Temperature telemetry resumed", opened: "2026-08-28 05:15", duration: "5h 27m", recoveryHitCount: 1, nextChecks: ["normal"] }),
    demoIncident({ id: "i-seattle-04", ruleId: "r-agent-seattle", monitoringState: "Resolved", condition: "opc_offline", terminalId: "WP7300EV33001088", terminalName: "EV Charger Bay 07", store: "EV Charger Hub", evidence: "Payment Service available", opened: "2026-08-27 18:35", duration: "55m", acknowledgedAt: "2026-08-27 18:40", recoveryHitCount: 2, recoveredAt: "2026-08-27 19:30", nextChecks: [] }),
    demoIncident({ id: "i-seattle-05", ruleId: "r-agent-seattle-transaction", monitoringState: "Resolved", condition: "no_approved_transaction", terminalId: "WP7300EV33001088", terminalName: "EV Charger Bay 07", store: "EV Charger Hub", evidence: "Approved transaction received", opened: "2026-08-26 08:20", duration: "4h 45m", recoveryHitCount: 2, recoveredAt: "2026-08-26 13:05", nextChecks: [] }),
    demoIncident({ id: "i-seattle-06", ruleId: "r-agent-seattle", monitoringState: "Closed", condition: "opc_offline", terminalId: "WP7300EV33001088", terminalName: "EV Charger Bay 07", store: "EV Charger Hub", evidence: "Payment Service unavailable during charger maintenance", opened: "2026-08-25 14:00", duration: "2h 10m", acknowledgedAt: "2026-08-25 14:03", closedAt: "2026-08-25 14:05", closedBy: "Seattle Field Agent", closeReason: "Planned maintenance", recoveredAt: "2026-08-25 16:10", nextChecks: [] })
  ];

  const defaultState = () => ({ rules: demoRules.map((rule) => ({ ...rule })), incidents: demoIncidents.map((incident) => ({ ...incident, events: incident.events.map((event) => ({ ...event })), nextChecks: [...incident.nextChecks] })), deletedRuleIds: [] });

  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const recipeFor = (key) => recipes[key] || recipes.opc_offline;
  const notificationLabel = (value) => value === "Portal Inbox" ? "Portal Alerts" : value;

  const roleContexts = {
    "service-provider": { providerId: "sp-universal", agentId: "", merchantId: "", storeId: "", ownerName: "Universal Processing", scopes: ["Store", "Terminal"], visibleFields: ["scope", "merchant", "store", "terminal"] },
    agent: { providerId: "sp-north-america", agentId: "agent-seattle", merchantId: "", storeId: "", ownerName: "Seattle Field Agent", scopes: ["Store", "Terminal"], visibleFields: ["scope", "merchant", "store", "terminal"] },
    merchant: { providerId: "sp-universal", agentId: "", merchantId: "merchant-kind-world", storeId: "", ownerName: "1 of a Kind World Travel LLC", scopes: ["Store", "Terminal"], visibleFields: ["scope", "store", "terminal"] },
    store: { providerId: "sp-universal", agentId: "", merchantId: "merchant-kind-world", storeId: "s-midtown", ownerName: "1 of a Kind World Travel LLC", scopes: ["Store", "Terminal"], visibleFields: ["scope", "terminal"] }
  };

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

  function migrateRule(rule) {
    return { ...rule, recoveryChecksRequired: Number(rule.recoveryChecksRequired) > 0 ? Number(rule.recoveryChecksRequired) : 2 };
  }

  function migrateMerchantTargets(rules, incidents) {
    const mappings = new Map();
    const migratedRules = [];
    let changed = false;
    rules.forEach((rule) => {
      if (rule.targetType !== "Merchant") {
        migratedRules.push(rule);
        return;
      }
      changed = true;
      const merchantPath = findTargetPath("Merchant", rule.targetId);
      const stores = merchantPath?.merchant?.stores || [];
      if (!stores.length) return;
      const byStoreId = new Map();
      stores.forEach((store, index) => {
        const id = index === 0 ? rule.id : `${rule.id}--${store.id}`;
        byStoreId.set(store.id, id);
        migratedRules.push({ ...rule, id, targetType: "Store", targetId: store.id, targetName: store.name });
      });
      mappings.set(rule.id, { firstId: rule.id, byStoreId });
    });
    const migratedIncidents = incidents.map((incident) => {
      const mapping = mappings.get(incident.ruleId);
      if (!mapping) return incident;
      const terminalPath = findTargetPath("Terminal", incident.terminalId);
      const storeId = terminalPath?.store?.id || [...mapping.byStoreId.keys()].find((id) => findTargetPath("Store", id)?.store?.name === incident.store);
      return { ...incident, ruleId: mapping.byStoreId.get(storeId) || mapping.firstId };
    });
    return { rules: migratedRules, incidents: migratedIncidents, changed };
  }

  function migrateIncident(incident) {
    const legacyState = incident.state;
    const storedMonitoringState = incident.monitoringState || (legacyState === "Resolved" ? "Resolved" : "Active");
    const monitoringState = storedMonitoringState === "Recovering" ? "Active" : storedMonitoringState;
    const acknowledgedAt = incident.acknowledgedAt || incident.acknowledged || (legacyState === "Acknowledged" ? incident.opened : "") || "";
    const acknowledgedBy = acknowledgedAt ? (incident.acknowledgedBy || "Alex Morgan") : "";
    const recoveredAt = incident.recoveredAt || incident.recovered || "";
    const recoveryChecksRequired = Number(incident.recoveryChecksRequired) > 0 ? Number(incident.recoveryChecksRequired) : 2;
    const recoveryHitCount = Number.isFinite(Number(incident.recoveryHitCount)) ? Number(incident.recoveryHitCount) : (storedMonitoringState === "Recovering" ? 1 : monitoringState === "Resolved" ? recoveryChecksRequired : 0);
    let events = Array.isArray(incident.events) ? incident.events.map((event) => ({ ...event })) : [];
    if (!events.length) {
      events = [{ at: incident.opened || nowLabel, type: "opened", label: "Opened", evidence: incident.evidence || "Monitoring threshold reached." }];
      if (acknowledgedAt) events.push({ at: acknowledgedAt, type: "acknowledged", label: "Acknowledged", evidence: `Acknowledged by ${acknowledgedBy}` });
      if (recoveredAt) events.push({ at: recoveredAt, type: "resolved", label: "Resolved", evidence: "Recovery requirements were satisfied by the monitoring system." });
    }
    const nextChecks = Array.isArray(incident.nextChecks) ? [...incident.nextChecks] : (storedMonitoringState === "Recovering" ? ["normal"] : monitoringState === "Active" ? ["normal", "normal"] : []);
    const { state: _state, source: _source, acknowledged: _acknowledged, recovered: _recovered, ...rest } = incident;
    return {
      ...rest,
      ruleId: incident.ruleId || "",
      monitoringState,
      acknowledgedAt,
      acknowledgedBy,
      recoveryChecksRequired,
      recoveryHitCount,
      recoveredAt,
      closedAt: incident.closedAt || "",
      closedBy: incident.closedBy || "",
      closeReason: incident.closeReason || "",
      closeNote: incident.closeNote || "",
      nextChecks,
      events
    };
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || !Array.isArray(parsed.rules) || !Array.isArray(parsed.incidents)) throw new Error("invalid");
      let changed = false;
      if (!Array.isArray(parsed.deletedRuleIds)) { parsed.deletedRuleIds = []; changed = true; }
      parsed.rules = parsed.rules.map((rule) => {
        const migrated = migrateRule(rule);
        if (JSON.stringify(migrated) !== JSON.stringify(rule)) changed = true;
        return migrated;
      });
      parsed.incidents = parsed.incidents.map((incident) => {
        const migrated = migrateIncident(incident);
        if (JSON.stringify(migrated) !== JSON.stringify(incident)) changed = true;
        return migrated;
      });
      const targetMigration = migrateMerchantTargets(parsed.rules, parsed.incidents);
      parsed.rules = targetMigration.rules;
      parsed.incidents = targetMigration.incidents;
      if (targetMigration.changed) changed = true;
      demoRules.forEach((rule) => {
        if (!parsed.deletedRuleIds.includes(rule.id) && !parsed.rules.some((item) => item.id === rule.id)) { parsed.rules.push(migrateRule({ ...rule })); changed = true; }
      });
      demoIncidents.forEach((incident) => {
        if (!parsed.incidents.some((item) => item.id === incident.id)) { parsed.incidents.push(migrateIncident({ ...incident, events: incident.events.map((event) => ({ ...event })), nextChecks: [...incident.nextChecks] })); changed = true; }
      });
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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
  const query = new URLSearchParams(location.search);
  let currentRoleKey = roleContexts[query.get("role")] ? query.get("role") : "service-provider";
  let currentRole = roleContexts[currentRoleKey];
  const canManageAlerts = query.get("manageAlerts") !== "false";
  let appliedCenterFilters = { state: "all", acknowledgement: "all", store: "", terminal: "", condition: "all" };
  surface.querySelectorAll("[data-alert-terminal-name]").forEach((node) => { node.textContent = terminalName; });

  function roleResources() {
    const provider = providerFor(currentRole.providerId);
    const agent = currentRole.agentId ? agentFor(currentRole.providerId, currentRole.agentId) : null;
    let merchants = agent ? agent.merchants : (provider?.merchants || []);
    if (currentRole.merchantId) merchants = merchants.filter((merchant) => merchant.id === currentRole.merchantId);
    let stores = merchants.flatMap((merchant) => merchant.stores);
    if (currentRole.storeId) stores = stores.filter((store) => store.id === currentRole.storeId);
    return { provider, agent, merchants, stores, terminals: stores.flatMap((store) => store.terminals) };
  }

  function targetInRole(item) {
    const path = findTargetPath(item.targetType, item.targetId);
    if (!path) return false;
    const resources = roleResources();
    if (item.targetType === "Store") return resources.stores.some((store) => store.id === item.targetId);
    if (item.targetType === "Terminal") return resources.terminals.some((terminal) => terminal.id === item.targetId);
    return false;
  }

  function roleVisibleIncidents() {
    if (pageType === "terminal") return state.incidents.filter((item) => item.terminalId === terminalId);
    const terminalIds = new Set(roleResources().terminals.map((terminal) => terminal.id));
    return state.incidents.filter((item) => terminalIds.has(item.terminalId));
  }

  function roleVisibleRules() {
    if (pageType === "terminal") return state.rules.filter((item) => item.targetType === "Terminal" && item.targetId === terminalId);
    return state.rules.filter((item) => item.owner === currentRole.ownerName && targetInRole(item));
  }

  function visibleIncidents() {
    const items = roleVisibleIncidents();
    const { state: stateFilter, acknowledgement: ackFilter, store: storeFilter, terminal: terminalFilter, condition: conditionFilter } = appliedCenterFilters;
    return items.filter((item) => {
      const recipe = recipeFor(item.condition);
      const acknowledgementMatches = ackFilter === "all" || (ackFilter === "acknowledged" ? Boolean(item.acknowledgedAt) : !item.acknowledgedAt);
      const storeMatches = !storeFilter || item.store.toLowerCase().includes(storeFilter);
      const terminalMatches = !terminalFilter || `${item.terminalName} ${item.terminalId}`.toLowerCase().includes(terminalFilter);
      const conditionMatches = conditionFilter === "all" || item.condition === conditionFilter;
      return (stateFilter === "all" || item.monitoringState === stateFilter) && acknowledgementMatches && storeMatches && terminalMatches && conditionMatches;
    });
  }

  function visibleRules() {
    const items = roleVisibleRules();
    const { store: storeFilter, terminal: terminalFilter, condition: conditionFilter } = appliedCenterFilters;
    return items.filter((item) => {
      const path = findTargetPath(item.targetType, item.targetId);
      const conditionMatches = conditionFilter === "all" || item.condition === conditionFilter;
      const storeMatches = !storeFilter || path?.store?.name.toLowerCase().includes(storeFilter);
      const terminalMatches = !terminalFilter || `${path?.terminal?.name || ""} ${path?.terminal?.id || ""}`.toLowerCase().includes(terminalFilter);
      return conditionMatches && storeMatches && terminalMatches;
    });
  }

  function renderIncidents() {
    const body = surface.querySelector("[data-alert-incidents]");
    if (!body) return;
    const items = visibleIncidents();
    body.innerHTML = items.length ? items.map((item) => {
      const targetCell = pageType === "center" ? `<td class="alert-target-cell">${escapeHtml(item.terminalName)} · ${escapeHtml(item.store)}</td>` : "";
      const opened = `${escapeHtml(item.opened)}${item.duration ? ` · ${escapeHtml(item.duration)}` : ""}`;
      const actionable = item.monitoringState === "Active";
      const acknowledgementLabel = item.acknowledgedAt ? `Acknowledged by ${item.acknowledgedBy || "Unknown user"} at ${item.acknowledgedAt}` : "Needs acknowledgement";
      return `
        <tr data-incident-id="${escapeHtml(item.id)}">
          <td><span class="alert-state-stack"><span class="alert-status incident-state ${item.monitoringState.toLowerCase()}">${escapeHtml(item.monitoringState)}</span>${item.acknowledgedAt ? `<span class="alert-ack-icon" role="img" aria-label="${escapeHtml(acknowledgementLabel)}" title="${escapeHtml(acknowledgementLabel)}" data-tooltip="${escapeHtml(acknowledgementLabel)}" tabindex="0"><span class="material-symbols-rounded" aria-hidden="true">task_alt</span></span>` : ""}<span class="alert-sr-only">Acknowledgement: ${item.acknowledgedAt ? "Acknowledged" : "Needs acknowledgement"}</span></span></td>
          <td><div class="alert-condition-cell"><strong>${escapeHtml(recipeFor(item.condition).label)}</strong></div></td>
          ${targetCell}
          <td>${escapeHtml(item.evidence)}</td><td>${opened}</td>
          <td class="alert-actions-cell">${actionable && !item.acknowledgedAt ? `<button class="alert-table-button alert-icon-button" type="button" data-alert-acknowledge="${escapeHtml(item.id)}" aria-label="Acknowledge" title="Acknowledge" data-tooltip="Acknowledge"><span class="material-symbols-rounded" aria-hidden="true">done</span></button>` : ""}${actionable && canManageAlerts ? `<button class="alert-table-button alert-icon-button" type="button" data-alert-close-incident="${escapeHtml(item.id)}" aria-label="Close incident" title="Close incident" data-tooltip="Close incident"><span class="material-symbols-rounded" aria-hidden="true">stop_circle</span></button>` : ""}<button class="alert-table-button alert-icon-button" type="button" data-alert-view="${escapeHtml(item.id)}" aria-label="View timeline" title="View timeline" data-tooltip="View timeline"><span class="material-symbols-rounded" aria-hidden="true">timeline</span></button></td>
        </tr>`;
    }).join("") : `<tr><td class="alert-empty" colspan="${pageType === "center" ? 6 : 5}">No incidents match the current filters.</td></tr>`;
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
        <td>${canManageAlerts ? `<button class="alert-table-button alert-icon-button" type="button" data-alert-toggle="${escapeHtml(item.id)}" aria-label="${item.status === "Active" ? "Pause" : "Resume"}" title="${item.status === "Active" ? "Pause" : "Resume"}" data-tooltip="${item.status === "Active" ? "Pause" : "Resume"}"><span class="material-symbols-rounded" aria-hidden="true">${item.status === "Active" ? "pause" : "play_arrow"}</span></button><button class="alert-table-button alert-icon-button" type="button" data-alert-edit="${escapeHtml(item.id)}" aria-label="Edit" title="Edit" data-tooltip="Edit"><span class="material-symbols-rounded" aria-hidden="true">edit</span></button><button class="alert-table-button alert-icon-button alert-delete-button" type="button" data-alert-delete="${escapeHtml(item.id)}" aria-label="Delete rule" title="Delete rule" data-tooltip="Delete rule"><span class="material-symbols-rounded" aria-hidden="true">delete</span></button>` : '<span class="alerts-page-copy">View only</span>'}</td>
      </tr>`).join("") : `<tr><td class="alert-empty" colspan="${pageType === "center" ? 7 : 6}">No organization-owned rules match this context.</td></tr>`;
  }

  function renderCounts() {
    const incidents = roleVisibleIncidents();
    const rules = roleVisibleRules();
    const values = { active: incidents.filter((item) => item.monitoringState === "Active").length, rules: rules.filter((rule) => rule.status === "Active").length };
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
  const emailChannel = modal.querySelector('[data-alert-channel][value="Email"]');
  const emailFields = modal.querySelector("[data-alert-email-fields]");
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
  const closeIncidentModal = document.querySelector("[data-alert-close-modal]");
  const closeIncidentForm = closeIncidentModal?.querySelector("[data-alert-close-form]");
  const closeReason = closeIncidentModal?.querySelector("[data-alert-close-reason]");
  const closeNote = closeIncidentModal?.querySelector("[data-alert-close-note]");
  const closeError = closeIncidentModal?.querySelector("[data-alert-close-error]");
  const roleSwitcher = surface.querySelector("[data-alert-role-switcher]");
  let activeIncidentId = null;
  let closingIncidentId = null;
  let closeDialogTrigger = null;

  surface.querySelectorAll("[data-alert-create]").forEach((button) => { if (!canManageAlerts) button.hidden = true; });
  if (roleSwitcher) roleSwitcher.value = currentRoleKey;

  conditionSelect.innerHTML = Object.entries(recipes).map(([key, recipe]) => `<option value="${key}">${escapeHtml(recipe.label)}</option>`).join("");
  modal.querySelectorAll("[data-alert-terminal-sn]").forEach((node) => { node.textContent = terminalId; });

  function setSelectOptions(select, placeholder, items, selectedValue = "") {
    if (!select) return;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + items.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === selectedValue ? " selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
    select.value = selectedValue;
  }

  function resetCenterFilters() {
    surface.querySelectorAll("[data-alert-store-filter], [data-alert-terminal-filter]").forEach((control) => { control.value = ""; });
    surface.querySelectorAll("[data-alert-state-filter], [data-alert-ack-filter], [data-alert-condition-filter]").forEach((control) => { control.value = "all"; });
    appliedCenterFilters = { state: "all", acknowledgement: "all", store: "", terminal: "", condition: "all" };
  }

  function applyCenterFilters() {
    appliedCenterFilters = {
      state: surface.querySelector("[data-alert-state-filter]")?.value || "all",
      acknowledgement: surface.querySelector("[data-alert-ack-filter]")?.value || "all",
      store: surface.querySelector("[data-alert-store-filter]")?.value.trim().toLowerCase() || "",
      terminal: surface.querySelector("[data-alert-terminal-filter]")?.value.trim().toLowerCase() || "",
      condition: surface.querySelector("[data-alert-condition-filter]")?.value || "all"
    };
    renderAll();
  }

  function applyRoleRangeLayout() {
    if (pageType !== "center") return;
    modal.querySelectorAll("[data-alert-range-field]").forEach((field) => {
      field.hidden = !currentRole.visibleFields.includes(field.dataset.alertRangeField);
    });
    modal.querySelector('[data-alert-range-field="store"]')?.classList.toggle("full", !currentRole.visibleFields.includes("merchant"));
    scopeSelect.innerHTML = currentRole.scopes.map((scope) => `<option value="${scope}">${scope}</option>`).join("");
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
    const items = roleResources().merchants;
    setSelectOptions(merchantSelect, "Select merchant", items, selectedValue);
    merchantSelect.disabled = !items.length;
  }

  function populateStores(selectedValue = "") {
    if (!storeSelect) return;
    const agentId = agentSelect?.disabled ? "" : agentSelect?.value;
    const merchant = merchantFor(providerSelect?.value, agentId, merchantSelect?.value);
    const permittedStoreIds = new Set(roleResources().stores.map((store) => store.id));
    const stores = (merchant?.stores || []).filter((store) => permittedStoreIds.has(store.id));
    setSelectOptions(storeSelect, merchant ? "Select store" : "Select merchant first", stores, selectedValue);
    storeSelect.disabled = !merchant;
  }

  function populateTerminals(selectedValue = "") {
    if (!terminalSelect) return;
    const agentId = agentSelect?.disabled ? "" : agentSelect?.value;
    const store = storeFor(providerSelect?.value, agentId, merchantSelect?.value, storeSelect?.value);
    const permittedTerminalIds = new Set(roleResources().terminals.map((terminal) => terminal.id));
    const terminals = (store?.terminals || []).filter((terminal) => permittedTerminalIds.has(terminal.id));
    setSelectOptions(terminalSelect, store ? "Select terminal" : "Select store first", terminals, selectedValue);
    terminalSelect.disabled = !store;
  }

  function rangeMetadata() {
    if (pageType !== "center") return null;
    const providerId = currentRole.providerId;
    const provider = providerFor(providerId);
    const agentId = currentRole.agentId;
    const merchantId = currentRole.merchantId || merchantSelect?.value;
    const merchant = merchantFor(providerId, agentId, merchantId);
    const type = scopeSelect?.value || "Terminal";
    if (!provider || !merchant || !currentRole.scopes.includes(type)) return null;
    const storeId = currentRole.storeId || storeSelect?.value;
    const store = storeFor(providerId, agentId, merchant.id, storeId);
    if (!store) return null;
    if (type === "Store") return { type, id: store.id, name: store.name };
    const terminal = terminalFor(providerId, agentId, merchant.id, store.id, terminalSelect?.value);
    return terminal ? { type: "Terminal", id: terminal.id, name: terminal.name } : null;
  }

  function syncScopeControls(selectedStoreId = "", selectedTerminalId = "") {
    if (pageType !== "center") return;
    const scope = scopeSelect.value || "Terminal";
    const merchantId = currentRole.merchantId || merchantSelect.value;
    const merchant = merchantFor(currentRole.providerId, currentRole.agentId, merchantId);
    const terminalField = modal.querySelector('[data-alert-range-field="terminal"]');
    storeSelect.required = true;
    terminalSelect.required = scope === "Terminal";
    if (terminalField) terminalField.hidden = scope !== "Terminal" || !currentRole.visibleFields.includes("terminal");
    populateStores(currentRole.storeId || selectedStoreId);
    if (!merchant) {
      setSelectOptions(terminalSelect, "Select store first", []);
      terminalSelect.disabled = true;
    } else if (scope === "Store") {
      setSelectOptions(terminalSelect, "Select Terminal scope to choose a terminal", []);
      terminalSelect.disabled = true;
    } else {
      populateTerminals(selectedTerminalId);
    }
    updateRangeTarget();
  }

  function initializeRange(rule = null) {
    if (pageType !== "center") return true;
    applyRoleRangeLayout();
    const rawPath = rule ? findTargetPath(rule.targetType, rule.targetId) : null;
    const path = rawPath && targetInRole(rule) && rule.owner === currentRole.ownerName ? rawPath : null;
    populateProviders(currentRole.providerId);
    providerSelect.value = currentRole.providerId;
    populateAgents(currentRole.agentId);
    if (currentRole.agentId) agentSelect.value = currentRole.agentId;
    const merchantId = path?.merchant.id || currentRole.merchantId || "";
    populateMerchants(merchantId);
    merchantSelect.value = merchantId;
    const requestedScope = rule?.targetType && currentRole.scopes.includes(rule.targetType) ? rule.targetType : currentRole.scopes.includes("Terminal") ? "Terminal" : currentRole.scopes[0];
    scopeSelect.value = requestedScope;
    syncScopeControls(path?.store?.id || "", path?.terminal?.id || "");
    if (rule && !path) {
      targetError.textContent = `Saved target ${rule.targetName} is outside this role's Alerts scope. Choose a monitoring range.`;
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
    if (selectedTarget.type === "Store" && path) inventory = path.store.terminals;
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
  function syncNotificationFields() {
    const emailEnabled = Boolean(emailChannel?.checked);
    if (emailFields) emailFields.hidden = !emailEnabled;
    if (!emailEnabled) recipientError.textContent = "";
    repeatInterval.hidden = !repeat.checked;
    repeatInterval.disabled = !repeat.checked;
  }
  function addRecipient() {
    const value = recipientInput.value.trim().toLowerCase();
    recipientError.textContent = "";
    if (!/^\S+@\S+\.\S+$/.test(value)) { recipientError.textContent = "Enter a valid email address."; return; }
    if (!recipients.includes(value)) recipients.push(value);
    if (emailChannel) emailChannel.checked = true;
    syncNotificationFields();
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
    repeatInterval.value = String(rule?.repeatHours || 2);
    recipientInput.value = "";
    recipientError.textContent = "";
    syncNotificationFields();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      const firstRangeControl = modal.querySelector("[data-alert-range-field]:not([hidden]) select:not([disabled])");
      (pageType === "center" ? firstRangeControl || conditionSelect : conditionSelect).focus();
    }, 0);
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
      modal.querySelector("[data-alert-range-field]:not([hidden]) select:not([disabled])")?.focus();
      return;
    }
    const rule = {
      id: existing?.id || `r-${Date.now()}`, condition, parameters,
      targetType: monitoringTarget.type, targetId: monitoringTarget.id,
      targetName: monitoringTarget.name,
      criteria: criteriaFor(recipeFor(condition), parameters), recipients: [...channels.filter((channel) => channel === "Portal Inbox"), ...(channels.includes("Email") ? recipients : [])], channels,
      repeatHours: repeat.checked ? Number(repeatInterval.value) : null, recoveryChecksRequired: existing?.recoveryChecksRequired || 2, status: existing?.status || "Active", modified: nowLabel, owner: pageType === "terminal" ? "1 of a Kind World Travel LLC" : currentRole.ownerName
    };
    if (existing) state.rules = state.rules.map((item) => item.id === existing.id ? rule : item); else state.rules.unshift(rule);
    writeState(); closeModal(); renderAll();
  });

  function buttonClass(variant = "secondary") {
    if (pageType === "terminal") return variant === "primary" ? "btn-primary" : "btn-secondary";
    return variant === "primary" ? "alert-btn dark" : "alert-btn subtle";
  }

  document.body.insertAdjacentHTML("beforeend", `
    <div class="alert-modal-overlay" data-alert-delete-modal aria-hidden="true">
      <section class="alert-modal alert-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="alertDeleteRuleTitle">
        <div class="alert-modal-head"><h2 id="alertDeleteRuleTitle">Delete Rule</h2><button class="alert-modal-close" type="button" aria-label="Close delete rule dialog" data-alert-delete-cancel><span class="material-symbols-rounded" aria-hidden="true">close</span></button></div>
        <div class="alert-modal-body alert-delete-body">
          <p>Delete <strong data-alert-delete-name></strong> for <strong data-alert-delete-target></strong>?</p>
          <p>This cannot be undone. Existing alerts and history will remain.</p>
        </div>
        <div class="alert-modal-actions"><button class="${buttonClass()}" type="button" data-alert-delete-cancel>Cancel</button><button class="${buttonClass("primary")} alert-delete-confirm" type="button" data-alert-delete-confirm>Delete Rule</button></div>
      </section>
    </div>
    <div class="alert-toast" role="status" aria-live="polite" data-alert-toast></div>`);
  const deleteModal = document.querySelector("[data-alert-delete-modal]");
  const alertToast = document.querySelector("[data-alert-toast]");
  let deletingRuleId = null;
  let deleteModalTrigger = null;
  let toastTimer = null;

  function showAlertToast(message, variant = "success") {
    window.clearTimeout(toastTimer);
    alertToast.textContent = message;
    alertToast.dataset.variant = variant;
    alertToast.classList.add("show");
    toastTimer = window.setTimeout(() => alertToast.classList.remove("show"), 2600);
  }

  function openDeleteModal(ruleId) {
    const rule = state.rules.find((item) => item.id === ruleId);
    if (!rule || !canManageAlerts) return;
    deletingRuleId = ruleId;
    deleteModalTrigger = document.activeElement;
    deleteModal.querySelector("[data-alert-delete-name]").textContent = recipeFor(rule.condition).label;
    deleteModal.querySelector("[data-alert-delete-target]").textContent = `${rule.targetType} · ${rule.targetName}`;
    deleteModal.classList.add("open");
    deleteModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => deleteModal.querySelector(".alert-modal-actions [data-alert-delete-cancel]").focus(), 0);
  }

  function closeDeleteModal({ restoreFocus = true } = {}) {
    deleteModal.classList.remove("open");
    deleteModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    deletingRuleId = null;
    if (restoreFocus) deleteModalTrigger?.focus();
    deleteModalTrigger = null;
  }

  function deleteRule() {
    const rule = state.rules.find((item) => item.id === deletingRuleId);
    if (!rule) { closeDeleteModal({ restoreFocus: false }); return; }
    const previousRules = state.rules;
    const previousDeletedRuleIds = [...state.deletedRuleIds];
    state.rules = state.rules.filter((item) => item.id !== rule.id);
    if (!state.deletedRuleIds.includes(rule.id)) state.deletedRuleIds.push(rule.id);
    try {
      writeState();
      closeDeleteModal({ restoreFocus: false });
      renderAll();
      showAlertToast("Rule deleted.");
    } catch (_) {
      state.rules = previousRules;
      state.deletedRuleIds = previousDeletedRuleIds;
      showAlertToast("Rule could not be deleted.", "error");
    }
  }

  function incidentRecoveryRequirement(incident) {
    const rule = state.rules.find((item) => item.id === incident.ruleId);
    if (incident.condition === "temperature_range" && Number(rule?.parameters?.recovery) > 0) return Math.max(1, Math.ceil(Number(rule.parameters.recovery) / 15));
    return Number(incident.recoveryChecksRequired) > 0 ? Number(incident.recoveryChecksRequired) : Number(rule?.recoveryChecksRequired) || 2;
  }

  function addMinutesToLabel(label, minutes) {
    const match = String(label || "").match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!match) return nowLabel;
    const value = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]) + minutes));
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")} ${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
  }

  function nextIncidentEventAt(events) {
    const latest = (Array.isArray(events) ? events : []).reduce((value, event) => String(event.at || "") > value ? String(event.at) : value, "");
    if (!latest || latest < nowLabel) return nowLabel;
    return addMinutesToLabel(latest, 1);
  }

  function openIncident(incidentId, preserveTrigger = false, focusTarget = "close", announcement = "") {
    const incident = state.incidents.find((item) => item.id === incidentId);
    if (!incident || !incidentModal) return;
    activeIncidentId = incidentId;
    if (!preserveTrigger) modalTrigger = document.activeElement;
    incidentModal.querySelector("[data-alert-incident-title]").textContent = recipeFor(incident.condition).label;
    const events = (Array.isArray(incident.events) ? incident.events : [])
      .map((item, index) => ({ item, index }))
      .sort((left, right) => String(left.item.at || "").localeCompare(String(right.item.at || "")) || left.index - right.index)
      .map(({ item }) => item);
    const canRunCheck = (incident.monitoringState === "Active" || incident.monitoringState === "Closed") && !incident.recoveredAt;
    const canClose = canManageAlerts && incident.monitoringState === "Active";
    incidentModal.querySelector("[data-alert-incident-body]").innerHTML = `
      <div class="alert-incident-meta" aria-label="Alert details">
        <strong>${escapeHtml(incident.monitoringState)}</strong>
        <span aria-hidden="true">·</span>
        <span>${escapeHtml(incident.terminalName)} · ${escapeHtml(incident.store)}</span>
        <span aria-hidden="true">·</span>
        <span>Opened ${escapeHtml(incident.opened)}${incident.duration ? ` · ${escapeHtml(incident.duration)}` : ""}</span>
      </div>
      <div class="alert-sr-only" role="status" aria-live="polite" data-alert-timeline-status></div>
      <ol class="alert-timeline" aria-label="Alert history">
        ${events.map((item, index) => {
          return `<li class="alert-timeline-event${index === events.length - 1 ? " latest" : ""}" data-alert-event-type="${escapeHtml(item.type || "event")}"${index === events.length - 1 ? ' data-alert-latest-event tabindex="-1"' : ""}><span class="alert-timeline-marker" aria-hidden="true"></span><div class="alert-timeline-content"><div class="alert-timeline-head"><strong>${escapeHtml(item.label)}</strong><time datetime="${escapeHtml(String(item.at || "").replace(" ", "T"))}">${escapeHtml(item.at)}</time></div>${item.evidence ? `<p>${escapeHtml(item.evidence)}</p>` : ""}</div></li>`;
        }).join("")}
      </ol>
      ${canRunCheck || canClose ? `<div class="alert-timeline-actions" aria-label="Alert actions">${canRunCheck ? `<button class="alert-timeline-action" type="button" data-alert-run-check="${escapeHtml(incident.id)}">Run next monitoring check</button>` : ""}${canClose ? `<button class="alert-timeline-action" type="button" data-alert-close-incident="${escapeHtml(incident.id)}">Close incident</button>` : ""}</div>` : ""}`;
    incidentModal.querySelector("[data-alert-incident-actions]").innerHTML = `<button class="${buttonClass()}" type="button" data-alert-incident-close>Close</button>`;
    incidentModal.classList.add("open");
    incidentModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const status = incidentModal.querySelector("[data-alert-timeline-status]");
      if (status && announcement) status.textContent = announcement;
      const target = focusTarget === "run"
        ? incidentModal.querySelector("[data-alert-run-check]")
        : focusTarget === "latest"
          ? incidentModal.querySelector("[data-alert-latest-event]")
          : incidentModal.querySelector("[data-alert-incident-close]");
      target?.focus();
    });
  }

  function closeIncident() {
    if (!incidentModal) return;
    incidentModal.classList.remove("open");
    incidentModal.setAttribute("aria-hidden", "true");
    activeIncidentId = null;
    if (!closeIncidentModal?.classList.contains("open") && !modal.classList.contains("open")) document.body.style.overflow = "";
    modalTrigger?.focus();
  }

  function openManualClose(incidentId) {
    if (!canManageAlerts || !closeIncidentModal) return;
    const incident = state.incidents.find((item) => item.id === incidentId);
    if (!incident || incident.monitoringState !== "Active") return;
    closingIncidentId = incidentId;
    closeDialogTrigger = document.activeElement;
    closeReason.value = "";
    closeNote.value = "";
    closeError.textContent = "";
    closeIncidentModal.classList.add("open");
    closeIncidentModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeReason.focus();
  }

  function closeManualClose({ restoreFocus = true } = {}) {
    if (!closeIncidentModal) return;
    closeIncidentModal.classList.remove("open");
    closeIncidentModal.setAttribute("aria-hidden", "true");
    closingIncidentId = null;
    closeError.textContent = "";
    if (!incidentModal?.classList.contains("open") && !modal.classList.contains("open")) document.body.style.overflow = "";
    if (restoreFocus) closeDialogTrigger?.focus();
  }

  function runMonitoringCheck(incidentId) {
    const incident = state.incidents.find((item) => item.id === incidentId);
    if (!incident || incident.monitoringState === "Resolved" || (incident.monitoringState === "Closed" && incident.recoveredAt)) return;
    const nextChecks = Array.isArray(incident.nextChecks) ? [...incident.nextChecks] : [];
    const result = nextChecks.shift() || "normal";
    const required = incidentRecoveryRequirement(incident);
    const events = [...(incident.events || [])];
    const eventAt = nextIncidentEventAt(events);
    let monitoringState = incident.monitoringState;
    let recoveryHitCount = Number(incident.recoveryHitCount) || 0;
    let recoveredAt = incident.recoveredAt || "";
    if (result === "abnormal") {
      recoveryHitCount = 0;
      if (monitoringState !== "Closed") monitoringState = "Active";
      events.push({ at: eventAt, type: "recovery_reset", label: "Recovery reset", evidence: "The monitored condition was abnormal on this check." });
    } else {
      recoveryHitCount += 1;
      if (recoveryHitCount >= required) {
        recoveredAt = eventAt;
        if (monitoringState !== "Closed") monitoringState = "Resolved";
        events.push({ at: eventAt, type: "resolved", label: monitoringState === "Closed" ? "Recovery observed after closure" : "Resolved", evidence: "Recovery requirements were satisfied by the monitoring system." });
      } else {
        if (monitoringState !== "Closed") monitoringState = "Active";
        events.push({ at: eventAt, type: "recovery_check", label: `Recovery check ${recoveryHitCount}/${required}`, evidence: "The monitored signal returned to normal." });
      }
    }
    state.incidents = state.incidents.map((item) => item.id === incidentId ? { ...item, monitoringState, recoveryHitCount, recoveryChecksRequired: required, recoveredAt, nextChecks, events } : item);
    writeState();
    renderAll();
    const updated = state.incidents.find((item) => item.id === incidentId);
    const canRunAgain = updated && (updated.monitoringState === "Active" || updated.monitoringState === "Closed") && !updated.recoveredAt;
    openIncident(incidentId, true, canRunAgain ? "run" : "latest", result === "abnormal" ? "Monitoring check recorded: condition remains abnormal." : updated?.monitoringState === "Resolved" || updated?.recoveredAt ? "Monitoring check recorded: recovery confirmed." : `Monitoring check recorded: recovery check ${recoveryHitCount} of ${required}.`);
  }

  surface.addEventListener("click", (event) => {
    const create = event.target.closest("[data-alert-create]");
    const ack = event.target.closest("[data-alert-acknowledge]");
    const toggle = event.target.closest("[data-alert-toggle]");
    const edit = event.target.closest("[data-alert-edit]");
    const deleteAction = event.target.closest("[data-alert-delete]");
    const view = event.target.closest("[data-alert-view]");
    const closeAction = event.target.closest("[data-alert-close-incident]");
    const viewTab = event.target.closest("[data-alert-view-tab]");
    const filterSubmit = event.target.closest("[data-alert-filter-submit]");
    if (create) openModal();
    if (filterSubmit) applyCenterFilters();
    if (ack) {
      state.incidents = state.incidents.map((item) => {
        if (item.id !== ack.dataset.alertAcknowledge) return item;
        const eventAt = nextIncidentEventAt(item.events);
        return { ...item, acknowledgedAt: eventAt, acknowledgedBy: "robasz", events: [...(item.events || []), { at: eventAt, type: "acknowledged", label: "Acknowledged", evidence: "Acknowledged by robasz; monitoring and repeat notifications continue." }] };
      });
      writeState(); renderAll();
    }
    if (toggle) { state.rules = state.rules.map((item) => item.id === toggle.dataset.alertToggle ? { ...item, status: item.status === "Active" ? "Paused" : "Active", modified: nowLabel } : item); writeState(); renderAll(); }
    if (edit) openModal(edit.dataset.alertEdit);
    if (deleteAction) openDeleteModal(deleteAction.dataset.alertDelete);
    if (view) openIncident(view.dataset.alertView);
    if (closeAction) openManualClose(closeAction.dataset.alertCloseIncident);
    if (viewTab) {
      surface.querySelectorAll("[data-alert-view-tab]").forEach((tab) => { const active = tab === viewTab; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
      surface.querySelectorAll("[data-alert-view-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.alertViewPanel !== viewTab.dataset.alertViewTab));
    }
  });
  surface.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches("[data-alert-state-filter], [data-alert-ack-filter], [data-alert-store-filter], [data-alert-terminal-filter], [data-alert-condition-filter]")) {
      event.preventDefault();
      applyCenterFilters();
    }
  });
  roleSwitcher?.addEventListener("change", () => {
    currentRoleKey = roleSwitcher.value;
    currentRole = roleContexts[currentRoleKey];
    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set("role", currentRoleKey);
    history.replaceState(null, "", nextUrl.href);
    resetCenterFilters();
    renderAll();
  });
  conditionSelect.addEventListener("change", () => renderConditionFields());
  if (pageType === "center") {
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
  emailChannel?.addEventListener("change", syncNotificationFields);
  repeat.addEventListener("change", syncNotificationFields);
  modal.querySelectorAll("[data-alert-close]").forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  incidentModal?.addEventListener("click", (event) => {
    const runCheck = event.target.closest("[data-alert-run-check]");
    const manualClose = event.target.closest("[data-alert-close-incident]");
    if (runCheck) runMonitoringCheck(runCheck.dataset.alertRunCheck);
    else if (manualClose) openManualClose(manualClose.dataset.alertCloseIncident);
    else if (event.target.closest("[data-alert-incident-close]") || event.target === incidentModal) closeIncident();
  });
  closeIncidentForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = closeReason.value;
    const note = closeNote.value.trim();
    if (!reason) { closeError.textContent = "Choose a reason."; closeReason.focus(); return; }
    if (reason === "Other" && !note) { closeError.textContent = "Enter a note for Other."; closeNote.focus(); return; }
    const incidentId = closingIncidentId;
    state.incidents = state.incidents.map((item) => {
      if (item.id !== incidentId) return item;
      const eventAt = nextIncidentEventAt(item.events);
      return { ...item, monitoringState: "Closed", closedAt: eventAt, closedBy: "robasz", closeReason: reason, closeNote: note, events: [...(item.events || []), { at: eventAt, type: "manual_closure", label: "Closed manually", evidence: `${reason}${note ? ` · ${note}` : ""} · robasz` }] };
    });
    writeState(); renderAll(); closeManualClose({ restoreFocus: false });
    if (incidentModal?.classList.contains("open")) closeIncident();
  });
  closeReason?.addEventListener("change", () => { closeError.textContent = ""; });
  closeNote?.addEventListener("input", () => { closeError.textContent = ""; });
  closeIncidentModal?.addEventListener("click", (event) => { if (event.target.closest("[data-alert-close-cancel]") || event.target === closeIncidentModal) closeManualClose(); });
  deleteModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-alert-delete-confirm]")) deleteRule();
    else if (event.target.closest("[data-alert-delete-cancel]") || event.target === deleteModal) closeDeleteModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (deleteModal.classList.contains("open")) closeDeleteModal();
    else if (closeIncidentModal?.classList.contains("open")) closeManualClose();
    else if (modal.classList.contains("open")) closeModal();
    else if (incidentModal?.classList.contains("open")) closeIncident();
  });

  renderAll();
  const deepLinkedIncidentId = query.get("incident");
  if (pageType === "center" && deepLinkedIncidentId && visibleIncidents().some((item) => item.id === deepLinkedIncidentId)) {
    const incidentsTab = surface.querySelector('[data-alert-view-tab="incidents"]');
    if (incidentsTab) {
      surface.querySelectorAll("[data-alert-view-tab]").forEach((tab) => {
        const active = tab === incidentsTab;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      surface.querySelectorAll("[data-alert-view-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.alertViewPanel !== "incidents"));
    }
    openIncident(deepLinkedIncidentId);
  }
})();
