const { test, expect } = require("@playwright/test");

const ALERT_STATE_KEY = "paywizard.customerAlerts.v1";

async function resetAlertState(page) {
  await page.goto("/1.terminalmanage_nayax.html?tab=alerts");
  await page.evaluate((key) => localStorage.removeItem(key), ALERT_STATE_KEY);
  await page.reload();
}

async function selectAlertRange(dialog, { provider = "sp-universal", agent = "", merchant = "merchant-kind-world", scope = "Terminal", store = "s-midtown", terminal = "WP6267UQ36002376" } = {}) {
  await dialog.getByLabel("Service Provider").selectOption(provider);
  if (agent) await dialog.getByLabel("Agent").selectOption(agent);
  await dialog.getByLabel("Merchant").selectOption(merchant);
  await dialog.getByLabel("Monitor Scope").selectOption(scope);
  if (scope !== "Merchant") await dialog.getByLabel("Store").selectOption(store);
  if (scope === "Terminal") await dialog.getByLabel("Terminal").selectOption(terminal);
}

test("manages rules and incidents in one Terminal Alerts context", async ({ page }) => {
  await resetAlertState(page);

  await expect(page.getByRole("tab", { name: "Alerts" })).toHaveAttribute("aria-selected", "true");
  const alertPanel = page.getByRole("tabpanel", { name: "Alerts" });
  await expect(alertPanel.getByText("Terminal Context", { exact: true })).toHaveCount(0);
  await expect(alertPanel.locator(".alert-signal-card")).toHaveCount(0);
  await expect(alertPanel.locator(".alerts-command-bar")).toBeVisible();
  const commandBar = alertPanel.locator(".alerts-command-bar");
  const alertCenterLink = commandBar.getByRole("link", { name: "Open Alert Center" });
  await expect(alertCenterLink).toHaveAttribute("href", "39.customer_alerts.html?view=incidents");
  expect(await alertCenterLink.evaluate((link) => getComputedStyle(link).textDecorationLine)).toBe("none");
  await expect(commandBar.locator(".pm-map-menu-button")).toHaveCount(2);
  await expect(alertPanel.getByRole("tab", { name: "Visible Incidents" })).toHaveAttribute("aria-selected", "true");
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
  await dialog.getByLabel("Condition").selectOption("opc_offline");
  await dialog.getByLabel("Unavailable for").fill("20");
  await dialog.getByLabel("External email recipient").fill("store@example.com");
  await dialog.getByRole("button", { name: "Add recipient" }).click();
  await dialog.getByRole("button", { name: "Save Rule" }).click();

  await alertPanel.getByRole("tab", { name: "Alert Rules" }).click();
  await expect(alertPanel.locator('[data-alert-view-panel="incidents"]')).toBeHidden();
  await expect(alertPanel.locator('[data-alert-view-panel="rules"]')).toBeVisible();
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("20 minutes");
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("Active");
  await page.reload();
  await alertPanel.getByRole("tab", { name: "Alert Rules" }).click();
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("store@example.com");

  await alertPanel.getByRole("tab", { name: "Visible Incidents" }).click();
  const incident = page.getByRole("row", { name: /No Approved Transaction/ });
  await incident.getByRole("button", { name: "Acknowledge" }).click();
  await expect(incident).toContainText("Acknowledged");
  await expect(incident.getByRole("button", { name: "Acknowledge" })).toHaveCount(0);

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
  await expect(page.locator('[data-alert-count="open"]')).toHaveText("1");
  await expect(page.getByRole("columnheader", { name: "Target", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("search", { name: "Alert filters" }).getByLabel("Terminal")).toBeVisible();
  await expect(page.getByLabel("Condition").first()).toBeVisible();
  await expect(page.getByLabel("Source")).toBeVisible();

  await page.getByRole("tab", { name: "Alert Rules" }).click();
  const soldOutRule = page.getByRole("row", { name: /Sold Out/ });
  await expect(soldOutRule).toContainText("Terminal - WP6267UQ36002376");
  await expect(soldOutRule).toContainText("Active");
  await soldOutRule.getByRole("button", { name: "Pause" }).click();
  await expect(soldOutRule).toContainText("Paused");
  await expect(page.getByRole("row", { name: /Machine Stock Below/ })).toContainText("Portal Alerts");
  await expect(page.getByText("Portal Inbox", { exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: "Visible Incidents" }).click();
  await page.getByLabel("Incident state").selectOption("Resolved");
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("Platform rule");
  await expect(page.getByRole("row", { name: /No Approved Transaction/ })).toHaveCount(0);
  await page.getByRole("row", { name: /OPC Offline/ }).getByRole("button", { name: "View timeline" }).click();
  await expect(page.getByRole("dialog", { name: "OPC Offline" })).toContainText("Recovery observed");
  await page.getByRole("button", { name: "Close incident details" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
});

test("honors Manage Alerts permission and supports Merchant, Store or Terminal targets", async ({ page }) => {
  await page.goto("/39.customer_alerts.html?manageAlerts=false");
  await page.evaluate((key) => localStorage.removeItem(key), ALERT_STATE_KEY);
  await page.reload();
  await expect(page.getByRole("button", { name: "Create Alert Rule" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Alert Rules" }).click();
  await expect(page.getByText("View only").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause" })).toHaveCount(0);

  await page.goto("/39.customer_alerts.html");
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await expect(dialog.getByLabel("Verified portal user")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Add portal user" })).toHaveCount(0);
  await expect(dialog.getByLabel("Condition")).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Save Rule" })).toBeDisabled();
  await dialog.getByLabel("Service Provider").selectOption("sp-north-america");
  await expect(dialog.getByLabel("Agent")).toBeEnabled();
  await dialog.getByLabel("Agent").selectOption("agent-seattle");
  await dialog.getByLabel("Merchant").selectOption("seattle-central");
  await dialog.getByLabel("Service Provider").selectOption("sp-universal");
  await expect(dialog.getByLabel("Agent")).toBeDisabled();
  await expect(dialog.getByLabel("Agent")).toHaveValue("");
  await expect(dialog.getByLabel("Merchant")).toHaveValue("");
  await dialog.getByLabel("Merchant").selectOption("merchant-kind-world");
  await dialog.getByLabel("Monitor Scope").selectOption("Merchant");
  await expect(dialog.getByLabel("Store")).toBeDisabled();
  await expect(dialog.getByLabel("Terminal")).toBeDisabled();
  await expect(dialog.getByLabel("Condition")).toBeEnabled();
  await dialog.getByLabel("Condition").selectOption("temperature_range");
  await expect(dialog.getByLabel("Recovery lower bound")).toBeVisible();
  await expect(dialog.getByLabel("Recovery upper bound")).toBeVisible();
  await expect(dialog.locator("[data-alert-coverage]")).toContainText("3 eligible Terminals · 1 unsupported");
  await expect(dialog.locator("[data-alert-coverage-card]")).toContainText("Eligible: Terminal - WP6267UQ36002376, Breakroom Cooler Q3, Cafeteria Q3");
  await expect(dialog.locator("[data-alert-coverage-card]")).toContainText("Excluded: Lobby Vending Q3");
  await expect(dialog.locator("[data-alert-coverage]")).toHaveClass(/sr-only/);
  await expect(dialog.locator("[data-alert-coverage-card]")).toHaveClass(/sr-only/);
  await dialog.getByRole("button", { name: "Save Rule" }).click();
  await page.getByRole("tab", { name: "Alert Rules" }).click();
  const merchantRule = page.getByRole("row", { name: /Temperature Out of Range.*Merchant/ });
  await expect(merchantRule).toContainText("1 of a Kind World Travel LLC");
  await merchantRule.getByRole("button", { name: "Edit" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Alert Rule" });
  await expect(editDialog.getByLabel("Service Provider")).toHaveValue("sp-universal");
  await expect(editDialog.getByLabel("Merchant")).toHaveValue("merchant-kind-world");
  await expect(editDialog.getByLabel("Monitor Scope")).toHaveValue("Merchant");
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
  await page.getByRole("tab", { name: "Alert Rules" }).click();
  await expect(page.getByRole("row", { name: /Temperature Out of Range.*Terminal/ })).toContainText("Terminal - WP6267UQ36002376");
});

test("blocks edits for a historical target until a valid monitoring range is selected", async ({ page }) => {
  await page.goto("/39.customer_alerts.html");
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.rules.unshift({
      id: "r-historical-target",
      condition: "opc_offline",
      targetType: "Terminal",
      targetId: "RETIRED-SN",
      targetName: "Retired Terminal",
      criteria: "Unavailable for 15 minutes",
      recipients: ["Portal Inbox"],
      channels: ["Portal Inbox"],
      status: "Active",
      modified: "2026-08-30 09:00",
      owner: "1 of a Kind World Travel LLC",
      parameters: { minutes: 15 }
    });
    localStorage.setItem(key, JSON.stringify(state));
  }, ALERT_STATE_KEY);
  await page.reload();
  await page.getByRole("tab", { name: "Alert Rules" }).click();
  await page.getByRole("row", { name: /OPC Offline.*Retired Terminal/ }).getByRole("button", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit Alert Rule" });
  await expect(dialog.locator("[data-alert-target-error]")).toContainText("Saved target Retired Terminal is no longer available");
  await expect(dialog.getByLabel("Condition")).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Save Rule" })).toBeDisabled();

  await selectAlertRange(dialog);
  await expect(dialog.locator("[data-alert-target-error]")).toBeEmpty();
  await expect(dialog.getByRole("button", { name: "Save Rule" })).toBeEnabled();
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
  await expect(terminalDialog.locator(".alerts-eyebrow, .alert-step small, .alert-field > small")).toHaveCount(0);
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
