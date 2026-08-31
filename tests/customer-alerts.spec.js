const { test, expect } = require("@playwright/test");

const ALERT_STATE_KEY = "paywizard.customerAlerts.v1";

async function resetAlertState(page) {
  await page.goto("/1.terminalmanage_nayax.html?tab=alerts");
  await page.evaluate((key) => localStorage.removeItem(key), ALERT_STATE_KEY);
  await page.reload();
}

async function selectAlertRange(dialog, { provider = "sp-universal", agent = "", merchant = "merchant-kind-world", scope = "Terminal", store = "s-midtown", terminal = "WP6267UQ36002376" } = {}) {
  if (await dialog.getByLabel("Service Provider").isVisible()) await dialog.getByLabel("Service Provider").selectOption(provider);
  if (agent && await dialog.getByLabel("Agent").isVisible()) await dialog.getByLabel("Agent").selectOption(agent);
  if (await dialog.getByLabel("Merchant").isVisible()) await dialog.getByLabel("Merchant").selectOption(merchant);
  await dialog.getByLabel("Monitor Scope").selectOption(scope);
  if (await dialog.getByLabel("Store").isVisible()) await dialog.getByLabel("Store").selectOption(store);
  if (scope === "Terminal") await dialog.getByLabel("Terminal").selectOption(terminal);
}

async function expectAlertTooltip(page, target, label, interaction = "hover") {
  if (interaction === "focus") await target.focus();
  else await target.hover();
  const tooltip = page.locator("#action-function-tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(label);
  await expect(target).toHaveAttribute("aria-describedby", "action-function-tooltip");
  const box = await tooltip.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

test("manages rules and incidents in one Terminal Alerts context", async ({ page }) => {
  await resetAlertState(page);

  await expect(page.getByLabel("Terminal sections").getByRole("tab", { name: "Alerts" })).toHaveAttribute("aria-selected", "true");
  const alertPanel = page.getByRole("tabpanel", { name: "Alerts" });
  await expect(alertPanel.getByText("Terminal Context", { exact: true })).toHaveCount(0);
  await expect(alertPanel.locator(".alert-signal-card")).toHaveCount(0);
  await expect(alertPanel.locator(".alerts-command-bar")).toBeVisible();
  const commandBar = alertPanel.locator(".alerts-command-bar");
  const alertCenterLink = commandBar.getByRole("link", { name: "Open Alert Center" });
  await expect(alertCenterLink).toHaveAttribute("href", "39.customer_alerts.html?view=incidents");
  expect(await alertCenterLink.evaluate((link) => getComputedStyle(link).textDecorationLine)).toBe("none");
  await expect(commandBar.locator(".pm-map-menu-button")).toHaveCount(2);
  await expect(alertPanel.getByRole("tab", { name: "Alerts", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(alertPanel.getByRole("tab", { name: "Visible Incidents" })).toHaveCount(0);
  await expect(alertPanel.getByRole("tab", { name: "Alert Rules" })).toHaveCount(0);
  await expect(alertPanel.locator('[data-alert-view-panel="incidents"]')).toBeVisible();
  await expect(alertPanel.locator('[data-alert-view-panel="rules"]')).toBeHidden();
  await expect(alertPanel.getByRole("columnheader", { name: "Source" })).toHaveCount(0);

  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Monitoring Target")).toHaveCount(0);
  await expect(dialog.getByText("SN:")).toContainText("WP6267UQ36002376");
  await expect(dialog.getByText("Portal Alerts", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Portal Inbox", { exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel("Verified portal user")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Add portal user" })).toHaveCount(0);
  await expect(dialog.locator(".alert-step")).toHaveCount(0);
  await expect(dialog.getByRole("heading", { name: "Condition", exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
  await expect(dialog.locator(".alert-channel-group")).toHaveCSS("border-top-width", "0px");
  await dialog.getByLabel("Condition").selectOption("opc_offline");
  await dialog.getByLabel("Unavailable for").fill("20");
  await expect(dialog.getByLabel("External email recipient")).toBeHidden();
  await expect(dialog.getByLabel("Repeat interval")).toBeHidden();
  await dialog.getByLabel("Email", { exact: true }).check();
  await expect(dialog.getByLabel("External email recipient")).toBeVisible();
  await dialog.getByLabel("External email recipient").fill("store@example.com");
  await dialog.getByRole("button", { name: "Add recipient" }).click();
  await dialog.getByLabel("Email", { exact: true }).uncheck();
  await expect(dialog.getByLabel("External email recipient")).toBeHidden();
  await dialog.getByLabel("Email", { exact: true }).check();
  await expect(dialog.locator(".alert-recipient-tag")).toContainText("store@example.com");
  await dialog.getByLabel("Repeat while Open").check();
  await expect(dialog.getByLabel("Repeat interval")).toBeVisible();
  await dialog.getByLabel("Repeat while Open").uncheck();
  await expect(dialog.getByLabel("Repeat interval")).toBeHidden();
  await dialog.getByRole("button", { name: "Save Rule" }).click();

  await alertPanel.getByRole("tab", { name: "Rules", exact: true }).click();
  await expect(alertPanel.locator('[data-alert-view-panel="incidents"]')).toBeHidden();
  await expect(alertPanel.locator('[data-alert-view-panel="rules"]')).toBeVisible();
  await expect(alertPanel.locator("[data-alert-rules] tr")).toHaveCount(6);
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("20 minutes");
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("Active");
  const createdRule = alertPanel.locator("[data-alert-rules] tr").filter({ hasText: "20 minutes" });
  await expect(createdRule).toContainText("store@example.com");
  await createdRule.getByRole("button", { name: "Edit" }).click();
  const editCreatedRule = page.getByRole("dialog", { name: "Edit Alert Rule" });
  await expect(editCreatedRule.getByLabel("External email recipient")).toBeVisible();
  await editCreatedRule.getByLabel("Email", { exact: true }).uncheck();
  await expect(editCreatedRule.getByLabel("External email recipient")).toBeHidden();
  await editCreatedRule.getByRole("button", { name: "Save Rule" }).click();
  await expect(createdRule).not.toContainText("store@example.com");
  const stockRule = alertPanel.locator('[data-rule-id="r-stock"]');
  const terminalPause = stockRule.getByRole("button", { name: "Pause" });
  await expect(terminalPause.locator(".material-symbols-rounded")).toHaveText("pause");
  await expect(terminalPause.locator(".material-symbols-rounded")).toHaveCSS("font-family", /Material Symbols Rounded/);
  expect(await terminalPause.evaluate((button) => ({ width: button.offsetWidth, height: button.offsetHeight }))).toEqual({ width: 30, height: 30 });
  const terminalEdit = stockRule.getByRole("button", { name: "Edit" });
  await expect(terminalEdit.locator(".material-symbols-rounded")).toHaveText("edit");
  await expectAlertTooltip(page, terminalPause, "Pause");
  await page.mouse.move(0, 0);
  await expectAlertTooltip(page, terminalEdit, "Edit", "focus");
  await page.reload();
  await alertPanel.getByRole("tab", { name: "Rules", exact: true }).click();
  await expect(alertPanel.locator("[data-alert-rules] tr").filter({ hasText: "20 minutes" })).not.toContainText("store@example.com");

  await alertPanel.getByRole("tab", { name: "Alerts", exact: true }).click();
  const incident = alertPanel.locator('[data-incident-id="i-mid-01"]');
  await expect(incident).toContainText("Active");
  await expect(alertPanel.getByRole("columnheader", { name: "Acknowledgement" })).toHaveCount(0);
  const acknowledgeAction = incident.getByRole("button", { name: "Acknowledge" });
  const closeAction = incident.getByRole("button", { name: "Close incident" });
  const timelineAction = incident.getByRole("button", { name: "View timeline" });
  await expect(acknowledgeAction.locator(".material-symbols-rounded")).toHaveText("done");
  await expect(closeAction.locator(".material-symbols-rounded")).toHaveText("stop_circle");
  await expect(closeAction.locator(".material-symbols-rounded")).not.toHaveText("cancel");
  await expect(timelineAction.locator(".material-symbols-rounded")).toHaveText("timeline");
  await expectAlertTooltip(page, acknowledgeAction, "Acknowledge");
  await page.mouse.move(0, 0);
  await expectAlertTooltip(page, closeAction, "Close incident");
  await page.mouse.move(0, 0);
  await expectAlertTooltip(page, timelineAction, "View timeline", "focus");
  const incidentActionSizes = await incident.locator(".alert-actions-cell .alert-icon-button").evaluateAll((buttons) => buttons.map((button) => ({ width: button.offsetWidth, height: button.offsetHeight })));
  expect(incidentActionSizes).toEqual([{ width: 30, height: 30 }, { width: 30, height: 30 }, { width: 30, height: 30 }]);
  await incident.getByRole("button", { name: "Acknowledge" }).click();
  await expect(incident.locator(".alert-ack-icon")).toBeVisible();
  await expect(incident.locator(".alert-ack-icon")).toHaveAttribute("aria-label", /Acknowledged by robasz at/);
  await incident.locator(".alert-ack-icon").hover();
  await expect(page.locator("#action-function-tooltip")).toHaveText(/Acknowledged by robasz at/);
  await expect(incident).toContainText("Active");
  await expect(incident.getByRole("button", { name: "Acknowledge" })).toHaveCount(0);
  await incident.getByRole("button", { name: "View timeline" }).click();
  const incidentDialog = page.getByRole("dialog", { name: "No Approved Transaction" });
  await expect(incidentDialog.locator(".alert-incident-summary")).toHaveCount(0);
  await expect(incidentDialog.locator(".alert-incident-meta")).toContainText("Active · Terminal - WP6267UQ36002376 · Midtown Store · Opened 2026-08-28 07:24 · 3h 18m");
  await expect(incidentDialog.locator(".alert-incident-meta")).not.toContainText("Acknowledged by");
  await expect(incidentDialog.locator(".alert-incident-meta .alert-status")).toHaveCount(0);
  await expect(incidentDialog.locator(".alert-incident-meta .material-symbols-rounded")).toHaveCount(0);
  await expect(incidentDialog.locator(".alert-timeline .material-symbols-rounded")).toHaveCount(0);
  await expect(incidentDialog.locator(".alert-timeline-event").first()).toHaveAttribute("data-alert-event-type", "opened");
  await expect(incidentDialog.locator("[data-alert-latest-event]")).toHaveAttribute("data-alert-event-type", "acknowledged");
  await expect(incidentDialog.locator(".alert-modal-actions button")).toHaveCount(1);
  await expect(incidentDialog.locator(".alert-modal-actions").getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await expect(incidentDialog.locator(".alert-timeline-actions").getByRole("button", { name: "Run next monitoring check" })).toBeVisible();
  await expect(incidentDialog.locator(".alert-timeline-actions").getByRole("button", { name: "Close incident", exact: true })).toBeVisible();
  const runCheck = incidentDialog.getByRole("button", { name: "Run next monitoring check" });
  await runCheck.click();
  await expect(runCheck).toBeFocused();
  await expect(incidentDialog.locator("[data-alert-timeline-status]")).toHaveText("Monitoring check recorded: recovery check 1 of 2.");
  await expect(incidentDialog.locator(".alert-incident-meta")).toContainText("Active");
  await expect(incidentDialog).toContainText("Recovery check 1/2");
  await expect(incidentDialog.locator("[data-alert-latest-event] time")).toHaveText("2026-08-28 10:43");
  await runCheck.click();
  await expect(incidentDialog.locator(".alert-incident-meta")).toContainText("Resolved");
  await expect(incidentDialog.locator("[data-alert-latest-event]")).toBeFocused();
  await expect(incidentDialog.locator("[data-alert-latest-event]")).toHaveAttribute("data-alert-event-type", "resolved");
  await expect(incidentDialog.locator("[data-alert-latest-event] time")).toHaveText("2026-08-28 10:44");
  await expect(incidentDialog.getByRole("button", { name: "Run next monitoring check" })).toHaveCount(0);
  await incidentDialog.getByRole("button", { name: "Close", exact: true }).click();

  const closeCandidate = alertPanel.locator('[data-incident-id="i-mid-02"]');
  await closeCandidate.getByRole("button", { name: "Close incident", exact: true }).click();
  const closeDialog = page.getByRole("dialog", { name: "Close Incident" });
  await closeDialog.getByRole("button", { name: "Close Incident" }).click();
  await expect(closeDialog.getByRole("alert")).toHaveText("Choose a reason.");
  await closeDialog.getByLabel("Reason").selectOption("Other");
  await closeDialog.getByRole("button", { name: "Close Incident" }).click();
  await expect(closeDialog.getByRole("alert")).toHaveText("Enter a note for Other.");
  await closeDialog.getByLabel("Note").fill("Checked with the store team.");
  await closeDialog.getByRole("button", { name: "Close Incident" }).click();
  await expect(closeCandidate).toContainText("Closed");
  await closeCandidate.getByRole("button", { name: "View timeline" }).click();
  const closedTimeline = page.getByRole("dialog", { name: "Machine Stock Below % PAR" });
  await expect(closedTimeline.locator('[data-alert-event-type="manual_closure"]')).toContainText("Closed manually");
  await expect(closedTimeline.locator(".alert-timeline .material-symbols-rounded")).toHaveCount(0);
  await closedTimeline.getByRole("button", { name: "Run next monitoring check" }).click();
  await expect(closedTimeline.locator(".alert-incident-meta")).toContainText("Closed");
  await closedTimeline.getByRole("button", { name: "Run next monitoring check" }).click();
  await expect(closedTimeline).toContainText("Recovery reset");
  await closedTimeline.getByRole("button", { name: "Run next monitoring check" }).click();
  await closedTimeline.getByRole("button", { name: "Run next monitoring check" }).click();
  await expect(closedTimeline).toContainText("Recovery observed after closure");
  await expect(closedTimeline.getByRole("button", { name: "Run next monitoring check" })).toHaveCount(0);
  await closedTimeline.getByRole("button", { name: "Close", exact: true }).click();
  const savedLifecycle = await page.evaluate((key) => {
    const incidents = JSON.parse(localStorage.getItem(key)).incidents;
    return incidents.filter((item) => ["i-mid-01", "i-mid-02"].includes(item.id));
  }, ALERT_STATE_KEY);
  expect(savedLifecycle.find((item) => item.id === "i-mid-01")).toMatchObject({ monitoringState: "Resolved", acknowledgedBy: "robasz", recoveryHitCount: 2 });
  expect(savedLifecycle.find((item) => item.id === "i-mid-02")).toMatchObject({ monitoringState: "Closed", closeReason: "Other", closeNote: "Checked with the store team." });

  await page.goto("/1.terminalmanage_nayax.html?tab=alerts&sn=SECOND-SN&terminalName=Second%20Terminal");
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const secondDialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await expect(secondDialog.getByLabel("Monitoring Target")).toHaveCount(0);
  await expect(secondDialog.getByText("SN:")).toContainText("SECOND-SN");
});

test("summarizes role-visible alerts under Settings and keeps shared state", async ({ page }) => {
  await resetAlertState(page);
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const terminalDialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await terminalDialog.getByLabel("Condition").selectOption("sold_out");
  await terminalDialog.getByRole("button", { name: "Save Rule" }).click();

  const settings = page.locator('[data-target="settings"]');
  await settings.click();
  const alertsLink = page.locator('[data-key="settings-alerts"]');
  await expect(alertsLink).toHaveText("Alerts");
  await expect(alertsLink).toHaveAttribute("data-link", "39.customer_alerts.html");
  await alertsLink.click();

  await expect(page).toHaveURL(/39\.customer_alerts\.html/);
  await expect(page.getByRole("heading", { name: "Alerts", exact: true })).toBeVisible();
  await page.goto("/39.customer_alerts.html?role=merchant");
  await expect(page.getByLabel("Alerts role").locator("option")).toHaveText([
    "Service Provider · Universal Processing",
    "Agent · Seattle Field Agent",
    "Merchant · 1 of a Kind World Travel LLC",
    "Store · Midtown Store"
  ]);
  await expect(page.locator('[data-alert-count="active"]')).toHaveText("9");
  await expect(page.locator(".alert-kpi-card")).toHaveCount(2);
  await expect(page.locator(".alert-kpi-card").first()).toContainText("Active Alerts");
  await expect(page.getByRole("columnheader", { name: "Target", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("search", { name: "Alert filters" }).getByLabel("Terminal")).toBeVisible();
  await expect(page.getByLabel("Condition").first()).toBeVisible();
  await expect(page.getByLabel("Incident state").locator("option")).toHaveText(["All states", "Active", "Resolved", "Closed"]);
  await expect(page.getByRole("columnheader", { name: "Acknowledgement" })).toHaveCount(0);
  await expect(page.getByLabel("Source")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Source" })).toHaveCount(0);
  const centerIncident = page.locator('[data-incident-id="i-mid-01"]');
  await expect(centerIncident.getByRole("button", { name: "Acknowledge" }).locator(".material-symbols-rounded")).toHaveText("done");
  await expect(centerIncident.getByRole("button", { name: "Close incident" }).locator(".material-symbols-rounded")).toHaveText("stop_circle");
  await expect(centerIncident.getByRole("button", { name: "View timeline" }).locator(".material-symbols-rounded")).toHaveText("timeline");

  await page.getByRole("tab", { name: "Rules", exact: true }).click();
  const soldOutRule = page.getByRole("row", { name: /Sold Out/ });
  await expect(soldOutRule).toContainText("Terminal - WP6267UQ36002376");
  await expect(soldOutRule).toContainText("Active");
  expect(await soldOutRule.locator(".alert-status").evaluate((status) => getComputedStyle(status, "::before").content)).toBe("none");
  const pauseButton = soldOutRule.getByRole("button", { name: "Pause" });
  await expect(pauseButton.locator(".material-symbols-rounded")).toHaveText("pause");
  await expect(pauseButton).toHaveAttribute("title", "Pause");
  expect(await pauseButton.evaluate((button) => ({ width: button.offsetWidth, height: button.offsetHeight }))).toEqual({ width: 30, height: 30 });
  await pauseButton.click();
  await expect(soldOutRule).toContainText("Paused");
  await expect(soldOutRule.getByRole("button", { name: "Resume" }).locator(".material-symbols-rounded")).toHaveText("play_arrow");
  await expect(page.getByRole("row", { name: /Machine Stock Below/ })).toContainText("Portal Alerts");
  await expect(page.getByText("Portal Inbox", { exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: "Alerts", exact: true }).click();
  await page.getByLabel("Incident state").selectOption("Resolved");
  await expect(page.locator('[data-incident-id="i-mid-01"]')).toHaveCount(0);
  await page.locator('[data-incident-id="i-mid-07"]').getByRole("button", { name: "View timeline" }).click();
  await expect(page.getByRole("dialog", { name: "OPC Offline" })).toContainText("Resolved");
  await page.getByRole("button", { name: "Close incident details" }).click();
  await page.getByLabel("Incident state").selectOption("all");
  await page.getByLabel("Acknowledgement", { exact: true }).selectOption("unacknowledged");
  await expect(page.locator('[data-alert-incidents] tr')).not.toHaveCount(0);
  await expect(page.locator('[data-alert-incidents] .alert-ack-icon')).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
});

test("scopes Alerts and monitoring range fields to each role", async ({ page }) => {
  await page.goto("/39.customer_alerts.html?manageAlerts=false");
  await page.evaluate((key) => localStorage.removeItem(key), ALERT_STATE_KEY);
  await page.reload();
  await expect(page.getByRole("button", { name: "Create Alert Rule" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Acknowledge" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Close incident", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Rules", exact: true }).click();
  await expect(page.getByText("View only").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toHaveCount(0);

  const matrices = [
    { role: "service-provider", visible: ["Merchant", "Store", "Terminal"], hidden: ["Service Provider", "Agent"], scopes: ["Store", "Terminal"], row: /Midtown Store/ },
    { role: "agent", visible: ["Merchant", "Store", "Terminal"], hidden: ["Service Provider", "Agent"], scopes: ["Store", "Terminal"], row: /EV Charger Bay 07/ },
    { role: "merchant", visible: ["Store", "Terminal"], hidden: ["Service Provider", "Agent", "Merchant"], scopes: ["Store", "Terminal"], row: /Machine Stock Below/ },
    { role: "store", visible: ["Terminal"], hidden: ["Service Provider", "Agent", "Merchant", "Store"], scopes: ["Store", "Terminal"], row: /Machine Stock Below/ }
  ];
  for (const matrix of matrices) {
    await page.goto(`/39.customer_alerts.html?role=${matrix.role}`);
    await page.getByRole("tab", { name: "Rules", exact: true }).click();
    await expect(page.getByRole("row", { name: matrix.row })).toBeVisible();
    await page.getByRole("button", { name: "Create Alert Rule" }).click();
    const roleDialog = page.getByRole("dialog", { name: "Create Alert Rule" });
    await expect(roleDialog.getByRole("heading", { name: "Monitoring Range" })).toBeVisible();
    await expect(roleDialog.getByRole("heading", { name: "Condition", exact: true })).toBeVisible();
    await expect(roleDialog.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(roleDialog.locator(".alert-step")).toHaveCount(0);
    for (const label of matrix.visible) await expect(roleDialog.getByLabel(label, { exact: true })).toBeVisible();
    for (const label of matrix.hidden) await expect(roleDialog.getByLabel(label, { exact: true })).toBeHidden();
    await expect(roleDialog.getByLabel("Monitor Scope").locator("option")).toHaveText(matrix.scopes);
    await roleDialog.getByRole("button", { name: "Cancel" }).click();
  }

  await page.goto("/39.customer_alerts.html?role=merchant");
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await expect(dialog.getByLabel("Monitor Scope")).toHaveValue("Terminal");
  await expect(dialog.getByLabel("Terminal")).toBeVisible();
  await dialog.getByLabel("Monitor Scope").selectOption("Store");
  await expect(dialog.getByLabel("Terminal")).toBeHidden();
  await dialog.getByLabel("Store").selectOption("s-boston");
  await dialog.getByLabel("Condition").selectOption("temperature_range");
  await expect(dialog.locator("[data-alert-coverage]")).toContainText("1 eligible Terminal · 0 unsupported");
  await expect(dialog.getByRole("button", { name: "Save Rule" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Save Rule" }).click();
  await page.getByRole("tab", { name: "Rules", exact: true }).click();
  const storeRule = page.getByRole("row", { name: /Temperature Out of Range.*Store/ });
  await expect(storeRule).toContainText("Boston Office");
  await storeRule.getByRole("button", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Alert Rule" });
  await expect(editDialog.getByLabel("Service Provider")).toBeHidden();
  await expect(editDialog.getByLabel("Merchant")).toBeHidden();
  await expect(editDialog.getByLabel("Monitor Scope")).toHaveValue("Store");
  await expect(editDialog.getByLabel("Terminal")).toBeHidden();
  await editDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const storeDialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await selectAlertRange(storeDialog, { scope: "Store", store: "s-boston" });
  await storeDialog.getByLabel("Condition").selectOption("sold_out");
  await storeDialog.getByRole("button", { name: "Save Rule" }).click();
  await expect(page.getByRole("row", { name: /Sold Out.*Store/ })).toContainText("Boston Office");

  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const terminalDialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await selectAlertRange(terminalDialog, { terminal: "NYC-Q3-0042" });
  await terminalDialog.getByLabel("Condition").selectOption("temperature_range");
  await expect(terminalDialog.locator("[data-alert-coverage]")).toContainText("0 eligible Terminals · 1 unsupported");
  await expect(terminalDialog.getByRole("button", { name: "Save Rule" })).toBeDisabled();
  await terminalDialog.getByLabel("Terminal").selectOption("WP6267UQ36002376");
  await expect(terminalDialog.locator("[data-alert-coverage]")).toContainText("1 eligible Terminal · 0 unsupported");
  await expect(terminalDialog.getByRole("button", { name: "Save Rule" })).toBeEnabled();
  await terminalDialog.getByRole("button", { name: "Save Rule" }).click();
  await page.getByRole("tab", { name: "Rules", exact: true }).click();
  const createdTemperatureRule = page.locator('[data-alert-rules] tr').filter({ hasText: "Temperature Out of Range" }).filter({ hasText: "Terminal · Terminal - WP6267UQ36002376" }).filter({ hasText: "2026-08-28 10:42" });
  await expect(createdTemperatureRule).toContainText("Terminal - WP6267UQ36002376");
});

test("keeps the selected tab while switching roles, resets filters, and removes stored Source data", async ({ page }) => {
  await page.goto("/39.customer_alerts.html?role=merchant");
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.rules.push({ id: "r-legacy-merchant", condition: "opc_offline", targetType: "Merchant", targetId: "merchant-kind-world", targetName: "1 of a Kind World Travel LLC", criteria: "Unavailable for 15 minutes", recipients: ["Portal Inbox"], channels: ["Portal Inbox"], status: "Active", modified: "2026-08-25 11:15", owner: "Universal Processing", parameters: { duration: 15 }, recoveryChecksRequired: 2 });
    state.incidents.find((incident) => incident.id === "i-boston-03").ruleId = "r-legacy-merchant";
    state.incidents[0].source = "Legacy source";
    state.incidents[0].state = "Acknowledged";
    state.incidents[0].acknowledged = "2026-08-28 08:02";
    delete state.incidents[0].monitoringState;
    delete state.incidents[0].acknowledgedAt;
    delete state.incidents[0].acknowledgedBy;
    delete state.incidents[0].events;
    state.incidents[1].monitoringState = "Recovering";
    state.incidents[1].recoveryHitCount = 1;
    state.incidents[1].nextChecks = ["normal"];
    localStorage.setItem(key, JSON.stringify(state));
  }, ALERT_STATE_KEY);
  await page.reload();
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).incidents.every((incident) => !("source" in incident)), ALERT_STATE_KEY)).toBe(true);
  const migratedIncident = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).incidents[0], ALERT_STATE_KEY);
  expect(migratedIncident).not.toHaveProperty("state");
  expect(migratedIncident).not.toHaveProperty("acknowledged");
  expect(migratedIncident).toMatchObject({ monitoringState: "Active", acknowledgedAt: "2026-08-28 08:02", recoveryChecksRequired: 2 });
  const migratedRecoveringIncident = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).incidents[1], ALERT_STATE_KEY);
  expect(migratedRecoveringIncident).toMatchObject({ monitoringState: "Active", recoveryHitCount: 1, nextChecks: ["normal"] });
  const migratedTargets = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    return {
      rules: state.rules.filter((rule) => rule.id.startsWith("r-legacy-merchant")),
      incident: state.incidents.find((item) => item.id === "i-boston-03")
    };
  }, ALERT_STATE_KEY);
  expect(migratedTargets.rules).toMatchObject([
    { id: "r-legacy-merchant", targetType: "Store", targetId: "s-midtown", targetName: "Midtown Store" },
    { id: "r-legacy-merchant--s-boston", targetType: "Store", targetId: "s-boston", targetName: "Boston Office" }
  ]);
  expect(migratedTargets.incident.ruleId).toBe("r-legacy-merchant--s-boston");
  await page.getByRole("tab", { name: "Rules", exact: true }).click();
  await page.getByLabel("Search alerts").fill("Machine");
  await page.getByRole("search", { name: "Alert filters" }).getByLabel("Store").selectOption("Midtown Store");
  await page.getByLabel("Alerts role").selectOption("agent");
  await expect(page).toHaveURL(/role=agent/);
  await expect(page.getByRole("tab", { name: "Rules", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Search alerts")).toHaveValue("");
  await expect(page.getByRole("search", { name: "Alert filters" }).getByLabel("Store")).toHaveValue("all");
  await expect(page.getByRole("row", { name: /EV Charger Bay 07/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Alerts role")).toHaveValue("agent");
});

test("seeds Store and Terminal rules with twenty-four lifecycle incidents", async ({ page }) => {
  await resetAlertState(page);
  const seeded = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), ALERT_STATE_KEY);
  expect(seeded.rules).toHaveLength(13);
  expect(seeded.incidents).toHaveLength(24);
  expect(new Set(seeded.rules.map((rule) => rule.condition)).size).toBe(9);
  expect(seeded.rules.filter((rule) => rule.targetType === "Terminal" && rule.targetId === "WP6267UQ36002376")).toHaveLength(5);
  expect(seeded.rules.every((rule) => ["Store", "Terminal"].includes(rule.targetType))).toBe(true);
  expect(seeded.incidents.filter((incident) => incident.terminalId === "WP6267UQ36002376")).toHaveLength(8);
  expect(seeded.incidents.filter((incident) => incident.terminalId === "NYC-Q3-0042")).toHaveLength(4);
  expect(seeded.incidents.filter((incident) => incident.terminalId === "NYC-Q3-0043")).toHaveLength(3);
  expect(seeded.incidents.filter((incident) => incident.terminalId === "BOS-Q3-0018")).toHaveLength(3);
  expect(seeded.incidents.filter((incident) => incident.terminalId === "WP7300EV33001088")).toHaveLength(6);
  expect(new Set(seeded.incidents.map((incident) => incident.monitoringState))).toEqual(new Set(["Active", "Resolved", "Closed"]));
  expect(JSON.stringify(seeded)).not.toContain("Recovering");
  expect(seeded.incidents.every((incident) => !("state" in incident) && Array.isArray(incident.events))).toBe(true);
});

test("matches the portal and DEX layout geometry on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/39.customer_alerts.html");
  await page.evaluate((key) => localStorage.removeItem(key), ALERT_STATE_KEY);
  await page.reload();

  await expect(page.locator(".alerts-app-frame")).toBeVisible();
  await expect(page.locator(".alerts-sidebar .brand-mark img")).toHaveAttribute("src", "assets/paywizard-logo.png");
  const centerGeometry = await page.evaluate(() => {
    const create = document.querySelector("[data-alert-create]").getBoundingClientRect();
    const filters = [...document.querySelectorAll(".alert-filter-control")].map((node) => node.getBoundingClientRect());
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      createWidth: create.width,
      filterRows: new Set(filters.map((box) => Math.round(box.top))).size
    };
  });
  expect(centerGeometry.documentWidth).toBeLessThanOrEqual(centerGeometry.viewportWidth + 1);
  expect(centerGeometry.createWidth).toBeLessThan(220);
  expect(centerGeometry.filterRows).toBeLessThanOrEqual(2);

  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const centerDialogGeometry = await page.getByRole("dialog", { name: "Create Alert Rule" }).evaluate((dialog) => {
    const rect = dialog.getBoundingClientRect();
    const footerButtons = [...dialog.querySelectorAll(".alert-modal-actions button")].map((button) => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    const inlineRows = [...dialog.querySelectorAll(".alert-inline-field")].map((row) => {
      const control = row.querySelector("input, select").getBoundingClientRect();
      const button = row.querySelector("button").getBoundingClientRect();
      return { controlHeight: control.height, buttonHeight: button.height };
    });
    return { left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, footerButtons, inlineRows };
  });
  expect(centerDialogGeometry.left).toBeGreaterThanOrEqual(0);
  expect(centerDialogGeometry.right).toBeLessThanOrEqual(1440);
  expect(centerDialogGeometry.bottom).toBeLessThanOrEqual(900);
  expect(centerDialogGeometry.width).toBeLessThanOrEqual(880);
  expect(centerDialogGeometry.footerButtons).toEqual([{ width: 112, height: 36 }, { width: 112, height: 36 }]);
  for (const row of centerDialogGeometry.inlineRows) expect(row.buttonHeight).toBe(row.controlHeight);
  await page.keyboard.press("Escape");

  await page.goto("/1.terminalmanage_nayax.html?tab=alerts");
  const terminalCreateWidth = await page.getByRole("button", { name: "Create Alert Rule" }).evaluate((button) => button.getBoundingClientRect().width);
  expect(terminalCreateWidth).toBeLessThan(220);
  await expect(page.locator(".alerts-terminal-panel")).toHaveCount(2);
  await expect(page.locator('[data-alert-view-panel="incidents"]')).toBeVisible();
  await expect(page.locator('[data-alert-view-panel="rules"]')).toBeHidden();
  const terminalSurfaceGeometry = await page.locator("[data-alert-page=terminal]").evaluate((surface) => {
    const commandBar = surface.querySelector(".alerts-command-bar");
    const panels = [...surface.querySelectorAll(".alerts-terminal-panel")];
    return {
      commandBorder: getComputedStyle(commandBar).borderBottomWidth,
      panels: panels.map((panel) => {
        const style = getComputedStyle(panel);
        return { border: style.borderTopWidth, padding: style.paddingTop, radius: style.borderRadius };
      })
    };
  });
  expect(terminalSurfaceGeometry.commandBorder).toBe("0px");
  expect(terminalSurfaceGeometry.panels).toEqual([
    { border: "0px", padding: "0px", radius: "0px" },
    { border: "0px", padding: "0px", radius: "0px" }
  ]);
  await expect(page.locator(".customer-alerts-surface .alerts-section-head p, .customer-alerts-surface .alert-condition-cell small")).toHaveCount(0);
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const terminalDialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await expect(terminalDialog.getByLabel("Verified portal user")).toHaveCount(0);
  await expect(terminalDialog.getByRole("button", { name: "Add portal user" })).toHaveCount(0);
  await expect(terminalDialog.locator(".alerts-eyebrow, .alert-step, .alert-field > small")).toHaveCount(0);
  await expect(terminalDialog.locator("[data-alert-coverage]")).toHaveClass(/sr-only/);
  await expect(terminalDialog.locator("[data-alert-coverage-card]")).toHaveClass(/sr-only/);
  const terminalButtons = await terminalDialog.locator(".alert-modal-actions button").evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(terminalButtons).toEqual([{ width: 112, height: 36 }, { width: 112, height: 36 }]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/39.customer_alerts.html");
  await expect(page.locator(".alerts-page-note, .alert-kpi-card small, .alerts-section-head p, .alert-condition-cell small")).toHaveCount(0);
  const mobileGeometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(mobileGeometry.document).toBeLessThanOrEqual(mobileGeometry.viewport + 1);
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const mobileDialog = await page.getByRole("dialog", { name: "Create Alert Rule" }).evaluate((dialog) => {
    const rect = dialog.getBoundingClientRect();
    const widths = [...dialog.querySelectorAll(".alert-modal-actions button")].map((button) => button.getBoundingClientRect().width);
    return { left: rect.left, right: rect.right, bottom: rect.bottom, widths };
  });
  expect(mobileDialog.left).toBeGreaterThanOrEqual(0);
  expect(mobileDialog.right).toBeLessThanOrEqual(390);
  expect(mobileDialog.bottom).toBeLessThanOrEqual(844);
  expect(Math.abs(mobileDialog.widths[0] - mobileDialog.widths[1])).toBeLessThanOrEqual(1);
});
