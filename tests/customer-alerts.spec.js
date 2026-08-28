const { test, expect } = require("@playwright/test");

const ALERT_STATE_KEY = "paywizard.customerAlerts.v1";

async function resetAlertState(page) {
  await page.goto("/1.terminalmanage_nayax.html?tab=alerts");
  await page.evaluate((key) => localStorage.removeItem(key), ALERT_STATE_KEY);
  await page.reload();
}

test("manages rules and incidents in one Terminal Alerts context", async ({ page }) => {
  await resetAlertState(page);

  await expect(page.getByRole("tab", { name: "Alerts" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Terminal Alerts" })).toBeVisible();
  const alertPanel = page.getByRole("tabpanel", { name: "Alerts" });
  await expect(alertPanel.getByText("Payment Service", { exact: true })).toBeVisible();
  await expect(alertPanel.getByText("Available", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Alert Rule" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Monitoring Target")).toHaveValue("WP6267UQ36002376");
  await expect(dialog.getByLabel("Verified portal user")).toBeVisible();
  await dialog.getByLabel("Condition").selectOption("opc_offline");
  await dialog.getByLabel("Unavailable for").fill("20");
  await dialog.getByLabel("External email recipient").fill("store@example.com");
  await dialog.getByRole("button", { name: "Add recipient" }).click();
  await dialog.getByRole("button", { name: "Save Rule" }).click();

  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("20 minutes");
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("Active");
  await page.reload();
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("store@example.com");

  const incident = page.getByRole("row", { name: /No Approved Transaction/ });
  await incident.getByRole("button", { name: "Acknowledge" }).click();
  await expect(incident).toContainText("Acknowledged");
  await expect(incident.getByRole("button", { name: "Acknowledge" })).toHaveCount(0);

  await page.goto("/1.terminalmanage_nayax.html?tab=alerts&sn=SECOND-SN&terminalName=Second%20Terminal");
  await expect(page.getByRole("heading", { name: "Terminal Alerts" }).locator(".." )).toContainText("Second Terminal");
  await page.getByRole("button", { name: "Create Alert Rule" }).click();
  await expect(page.getByRole("dialog", { name: "Create Alert Rule" }).getByLabel("Monitoring Target")).toHaveValue("SECOND-SN");
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
  await expect(page.getByRole("heading", { name: "Alert Center" })).toBeVisible();
  await expect(page.locator('[data-alert-count="open"]')).toHaveText("1");
  await expect(page.getByLabel("Terminal")).toBeVisible();
  await expect(page.getByLabel("Condition").first()).toBeVisible();
  await expect(page.getByLabel("Source")).toBeVisible();

  await page.getByRole("tab", { name: "Alert Rules" }).click();
  const soldOutRule = page.getByRole("row", { name: /Sold Out/ });
  await expect(soldOutRule).toContainText("Terminal - WP6267UQ36002376");
  await expect(soldOutRule).toContainText("Active");
  await soldOutRule.getByRole("button", { name: "Pause" }).click();
  await expect(soldOutRule).toContainText("Paused");

  await page.getByRole("tab", { name: "Visible Incidents" }).click();
  await page.getByLabel("Incident state").selectOption("Resolved");
  await expect(page.getByRole("row", { name: /OPC Offline/ })).toContainText("Platform-managed Alert");
  await expect(page.getByRole("row", { name: /No Approved Transaction/ })).toHaveCount(0);
  await page.getByRole("row", { name: /OPC Offline/ }).getByRole("button", { name: "View timeline" }).click();
  await expect(page.getByRole("dialog", { name: "OPC Offline" })).toContainText("Recovery observed");
  await page.getByRole("button", { name: "Close incident details" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
});

test("honors Manage Alerts permission and supports Store or Terminal targets", async ({ page }) => {
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
  await dialog.getByLabel("Condition").selectOption("temperature_range");
  await expect(dialog.getByLabel("Recovery lower bound")).toBeVisible();
  await expect(dialog.getByLabel("Recovery upper bound")).toBeVisible();
  await expect(dialog).toContainText("2 eligible Terminals · 1 unsupported");
  await expect(dialog).toContainText("Eligible: Terminal - WP6267UQ36002376, Breakroom Cooler Q3");
  await expect(dialog).toContainText("Excluded: Lobby Vending Q3");
  await dialog.getByLabel("Monitoring Target").selectOption("Store|s-boston|Boston Office");
  await expect(dialog).toContainText("1 eligible Terminal · 0 unsupported");
  await expect(dialog).toContainText("Eligible: Cafeteria Q3");
  await dialog.getByLabel("Monitoring Target").selectOption("Terminal|NYC-Q3-0042|Lobby Vending Q3");
  await expect(dialog).toContainText("0 eligible Terminals · 1 unsupported");
  await expect(dialog.getByRole("button", { name: "Save Rule" })).toBeDisabled();
  await dialog.getByLabel("Monitoring Target").selectOption("Terminal|WP6267UQ36002376|Terminal - WP6267UQ36002376");
  await dialog.getByRole("button", { name: "Save Rule" }).click();
  await page.getByRole("tab", { name: "Alert Rules" }).click();
  await expect(page.getByRole("row", { name: /Temperature Out of Range/ })).toContainText("Terminal - WP6267UQ36002376");
});
