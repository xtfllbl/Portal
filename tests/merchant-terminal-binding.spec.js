const { test, expect } = require("@playwright/test");

const PAGE_URL = "/5.merchant_detail_iso.html";

async function openCleanPage(page, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  await page.goto(PAGE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
}

function deviceRow(page, tci) {
  return page.locator(`.device-grid-row[data-tci="${tci}"]`);
}

async function showAllDevices(page) {
  await page.locator("#device-page-size").selectOption("20");
}

async function openDeviceAction(page, tci, actionName) {
  const row = deviceRow(page, tci);
  await row.getByRole("button", { name: "Settings", exact: true }).click();
  await row.getByRole("button", { name: actionName, exact: true }).click();
  return row;
}

test("shows binding actions only for terminals with an active S/N", async ({ page }) => {
  await openCleanPage(page);
  await showAllDevices(page);

  const boundRow = deviceRow(page, "TC36000934");
  await boundRow.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(boundRow.getByRole("button", { name: "Assign Terminal", exact: true })).toBeHidden();
  await expect(boundRow.getByRole("button", { name: "Replace Terminal", exact: true })).toBeVisible();
  await expect(boundRow.getByRole("button", { name: "Unassign Terminal", exact: true })).toBeVisible();
  await expect(boundRow.getByRole("button", { name: "Binding History", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  const unboundRow = deviceRow(page, "TC48273915");
  await unboundRow.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(unboundRow.getByRole("button", { name: "Assign Terminal", exact: true })).toBeVisible();
  await expect(unboundRow.getByRole("button", { name: "Replace Terminal", exact: true })).toBeHidden();
  await expect(unboundRow.getByRole("button", { name: "Unassign Terminal", exact: true })).toBeHidden();
  await expect(unboundRow.getByRole("button", { name: "Binding History", exact: true })).toBeVisible();
});

test("pre-binds an unassigned TCI from Merchant Detail and starts deployment", async ({ page }) => {
  await openCleanPage(page);
  await showAllDevices(page);
  const row = deviceRow(page, "TC48273915");
  const original = await row.evaluate((element) => ({
    tci: element.dataset.tci,
    model: element.dataset.model,
    label: element.dataset.label,
    processor: element.dataset.processor,
    version: element.dataset.version,
    paywizard: element.dataset.paywizard
  }));

  await openDeviceAction(page, "TC48273915", "Assign Terminal");
  await expect(page.getByRole("heading", { name: "Assign Terminal", exact: true })).toBeVisible();
  await expect(page.locator("#assign-terminal-tci")).toHaveText("TC48273915");
  await expect(page.locator("#assign-terminal-payment-service")).toHaveText("TSYS");
  await page.getByRole("button", { name: "Assign & Deploy", exact: true }).click();
  await expect(page.locator("#assign-terminal-error")).toHaveText("Enter the terminal S/N.");

  await page.locator("#assign-terminal-sn").fill("  wp6267uq36000934  ");
  await page.getByRole("button", { name: "Assign & Deploy", exact: true }).click();
  await expect(page.locator("#assign-terminal-error")).toHaveText("This terminal S/N is already bound to another TCI.");

  await page.locator("#assign-terminal-sn").fill("ADMIN-PREBIND-001");
  await page.getByRole("button", { name: "Assign & Deploy", exact: true }).click();

  await expect(page.locator("#binding-toast")).toContainText("Deployment has started");
  await expect(row.locator('[data-role="device-sn"]')).toHaveText("ADMIN-PREBIND-001");
  await expect(row).toHaveAttribute("data-device-status", "Pending");
  await expect(row.locator('[data-role="device-online-status"]')).toHaveAttribute("data-service-status", "Offline");
  await expect(row).toHaveAttribute("data-tci", original.tci);
  await expect(row).toHaveAttribute("data-model", original.model);
  await expect(row).toHaveAttribute("data-label", original.label);
  await expect(row).toHaveAttribute("data-processor", original.processor);
  await expect(row).toHaveAttribute("data-version", original.version);
  await expect(row).toHaveAttribute("data-paywizard", original.paywizard);

  const stored = await page.evaluate(() => ({
    assignments: JSON.parse(localStorage.getItem("pw_device_sn_assignments")),
    names: JSON.parse(localStorage.getItem("pw_device_terminal_names")),
    history: JSON.parse(localStorage.getItem("pw_device_binding_history"))
  }));
  expect(stored.assignments.TC48273915).toBe("ADMIN-PREBIND-001");
  expect(stored.names["ADMIN-PREBIND-001"]).toBe("Lobby Terminal Configuration");
  expect(stored.history.TC48273915[0]).toMatchObject({
    action: "Assigned",
    previousSn: "-",
    newSn: "ADMIN-PREBIND-001",
    reason: "Admin Portal Assignment",
    disposition: "-",
    operator: "Current User",
    result: "Deployment Started"
  });

  await row.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(row.getByRole("button", { name: "Assign Terminal", exact: true })).toBeHidden();
  await expect(row.getByRole("button", { name: "Replace Terminal", exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "Unassign Terminal", exact: true })).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await showAllDevices(page);
  const persistedRow = deviceRow(page, "TC48273915");
  await expect(persistedRow.locator('[data-role="device-sn"]')).toHaveText("ADMIN-PREBIND-001");
  await expect(persistedRow).toHaveAttribute("data-device-status", "Pending");
  await expect(persistedRow.locator('[data-role="device-online-status"]')).toHaveAttribute("data-service-status", "Offline");
  await openDeviceAction(page, "TC48273915", "Binding History");
  await expect(page.locator("#binding-history-body tr").first()).toContainText("Admin Portal Assignment");
  await expect(page.locator("#binding-history-body tr").first()).toContainText("Deployment Started");
});

test("uses the same assignment validation and history from Device Settings", async ({ page }) => {
  await openCleanPage(page);
  await showAllDevices(page);
  const row = deviceRow(page, "TC93865899");
  await row.getByRole("button", { name: "Settings", exact: true }).click();
  await Promise.all([
    page.waitForURL(/5\.merchant_device_settings_iso\.html/),
    row.getByRole("button", { name: "Edit Params", exact: true }).click()
  ]);

  await page.locator("#device-tpn").fill("  wp6267uq36000934  ");
  await page.locator("#redeployBtn").click();
  await expect(page.locator("#device-tpn-error")).toHaveText("This terminal S/N is already bound to another TCI.");
  await expect(page.locator("#saveDeviceConfirmModal")).toHaveClass(/is-hidden/);

  await page.locator("#device-tpn").fill("SETTINGS-PREBIND-002");
  await page.locator("#redeployBtn").click();
  await expect(page.locator("#saveDeviceConfirmModal")).not.toHaveClass(/is-hidden/);
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#confirmSaveDeviceBtn").click();

  const stored = await page.evaluate(() => ({
    assignments: JSON.parse(localStorage.getItem("pw_device_sn_assignments")),
    history: JSON.parse(localStorage.getItem("pw_device_binding_history"))
  }));
  expect(stored.assignments.TC93865899).toBe("SETTINGS-PREBIND-002");
  expect(stored.history.TC93865899[0]).toMatchObject({
    action: "Assigned",
    previousSn: "-",
    newSn: "SETTINGS-PREBIND-002",
    reason: "Admin Portal Assignment",
    disposition: "-",
    operator: "Current User",
    result: "Deployment Started"
  });

  await page.goto(PAGE_URL, { waitUntil: "networkidle" });
  await showAllDevices(page);
  const persistedRow = deviceRow(page, "TC93865899");
  await expect(persistedRow.locator('[data-role="device-sn"]')).toHaveText("SETTINGS-PREBIND-002");
  await expect(persistedRow).toHaveAttribute("data-device-status", "Pending");
  await expect(persistedRow.locator('[data-role="device-online-status"]')).toHaveAttribute("data-service-status", "Offline");
});

test("validates and persists a terminal replacement with history", async ({ page }) => {
  await openCleanPage(page);
  const row = await openDeviceAction(page, "TC36000932", "Replace Terminal");

  await expect(page.getByRole("heading", { name: "Replace Terminal", exact: true })).toBeVisible();
  await expect(page.locator("#replace-terminal-offline-warning")).toBeVisible();
  await page.getByRole("button", { name: "Replace & Deploy", exact: true }).click();
  await expect(page.locator("#replace-terminal-error")).toHaveText("Enter the replacement terminal S/N.");

  const newSn = page.locator("#replace-terminal-new-sn");
  await newSn.fill("WP6267UQ36000932");
  await page.getByRole("button", { name: "Replace & Deploy", exact: true }).click();
  await expect(page.locator("#replace-terminal-error")).toContainText("must be different");

  await newSn.fill("WP6267UQ36000934");
  await page.getByRole("button", { name: "Replace & Deploy", exact: true }).click();
  await expect(page.locator("#replace-terminal-error")).toHaveText("This terminal S/N is already bound to another TCI.");

  await newSn.fill("replacement-sn-001");
  await page.locator("#replace-terminal-reason").selectOption("Upgrade");
  await page.locator("#replace-terminal-disposition").selectOption("Return to Inventory");
  await page.getByRole("button", { name: "Replace & Deploy", exact: true }).click();

  await expect(page.locator("#binding-toast")).toContainText("REPLACEMENT-SN-001", { ignoreCase: true });
  await expect(row.locator('[data-role="device-sn"]')).toHaveText("replacement-sn-001");
  await expect(row).toHaveAttribute("data-device-status", "Pending");
  await expect(row.locator('[data-role="device-online-status"]')).toHaveAttribute("data-service-status", "Offline");

  const stored = await page.evaluate(() => ({
    assignments: JSON.parse(localStorage.getItem("pw_device_sn_assignments")),
    history: JSON.parse(localStorage.getItem("pw_device_binding_history"))
  }));
  expect(stored.assignments.TC36000932).toBe("replacement-sn-001");
  expect(stored.history.TC36000932[0]).toMatchObject({
    action: "Replaced",
    previousSn: "WP6267UQ36000932",
    newSn: "replacement-sn-001",
    reason: "Upgrade",
    disposition: "Return to Inventory",
    operator: "Current User",
    result: "Deployment Started"
  });

  await page.reload({ waitUntil: "networkidle" });
  await expect(deviceRow(page, "TC36000932").locator('[data-role="device-sn"]')).toHaveText("replacement-sn-001");
  await openDeviceAction(page, "TC36000932", "Binding History");
  const firstHistoryRow = page.locator("#binding-history-body tr").first();
  await expect(firstHistoryRow).toContainText("Replaced");
  await expect(firstHistoryRow).toContainText("WP6267UQ36000932");
  await expect(firstHistoryRow).toContainText("replacement-sn-001");
  await expect(firstHistoryRow).toContainText("Deployment Started");
});

test("unassigns a terminal while retaining its configuration and persists the empty binding", async ({ page }) => {
  await openCleanPage(page);
  const row = deviceRow(page, "TC36000934");
  const originalModel = await row.locator('[data-role="device-model"]').innerText();
  const originalName = await row.locator('[data-role="terminal-text"]').innerText();

  await openDeviceAction(page, "TC36000934", "Unassign Terminal");
  await expect(page.getByRole("heading", { name: "Unassign Terminal", exact: true })).toBeVisible();
  await page.locator("#unassign-terminal-reason").selectOption("Repair");
  await page.locator("#unassign-terminal-disposition").selectOption("Repair");
  await page.getByRole("button", { name: "Unassign Terminal", exact: true }).click();

  await expect(row.locator('[data-role="device-sn"]')).toHaveText("-");
  await expect(row.locator('[data-role="device-tci"]')).toHaveText("TC36000934");
  await expect(row.locator('[data-role="device-model"]')).toHaveText(originalModel);
  await expect(row.locator('[data-role="terminal-text"]')).toHaveText(originalName);
  await expect(row).toHaveAttribute("data-device-status", "Pending");
  await expect(row.locator('[data-role="device-online-status"]')).toHaveAttribute("data-service-status", "Offline");

  const stored = await page.evaluate(() => ({
    assignments: JSON.parse(localStorage.getItem("pw_device_sn_assignments")),
    history: JSON.parse(localStorage.getItem("pw_device_binding_history"))
  }));
  expect(Object.prototype.hasOwnProperty.call(stored.assignments, "TC36000934")).toBe(true);
  expect(stored.assignments.TC36000934).toBe("");
  expect(stored.history.TC36000934[0]).toMatchObject({
    action: "Unassigned",
    previousSn: "WP6267UQ36000934",
    newSn: "-",
    reason: "Repair",
    disposition: "Repair",
    result: "Configuration Retained"
  });

  await page.reload({ waitUntil: "networkidle" });
  const persistedRow = deviceRow(page, "TC36000934");
  await expect(persistedRow.locator('[data-role="device-sn"]')).toHaveText("-");
  await expect(persistedRow.locator('[data-role="device-model"]')).toHaveText(originalModel);
  await persistedRow.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(persistedRow.getByRole("button", { name: "Replace Terminal", exact: true })).toBeHidden();
  await expect(persistedRow.getByRole("button", { name: "Unassign Terminal", exact: true })).toBeHidden();
});

test("creates an initial history record for an unbound saved configuration", async ({ page }) => {
  await openCleanPage(page);
  await showAllDevices(page);
  await openDeviceAction(page, "TC48273915", "Binding History");
  const historyRow = page.locator("#binding-history-body tr").first();
  await expect(historyRow).toContainText("Configuration Created");
  await expect(historyRow).toContainText("Saved without terminal");
  await expect(historyRow).toContainText("Configuration Saved");
});

test("keeps all four binding dialogs usable at 390px", async ({ page }) => {
  await openCleanPage(page, { width: 390, height: 844 });
  await showAllDevices(page);

  for (const [action, modalId] of [
    ["Assign Terminal", "#assign-terminal-modal"],
    ["Replace Terminal", "#replace-terminal-modal"],
    ["Unassign Terminal", "#unassign-terminal-modal"],
    ["Binding History", "#binding-history-modal"]
  ]) {
    await openDeviceAction(page, action === "Assign Terminal" ? "TC48273915" : "TC36000934", action);
    const modal = page.locator(`${modalId} .modal`);
    await expect(modal).toBeVisible();
    const geometry = await modal.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        insideViewport: bounds.left >= 0 && bounds.right <= window.innerWidth,
        horizontalOverflow: element.scrollWidth - element.clientWidth
      };
    });
    expect(geometry.insideViewport).toBe(true);
    expect(geometry.horizontalOverflow).toBe(0);
    const primaryAction = page.locator(`${modalId} .modal-actions .btn`).last();
    await expect(primaryAction).toBeVisible();
    await expect(primaryAction).toBeEnabled();
    await primaryAction.focus();
    await expect(primaryAction).toBeFocused();
    await page.locator(`${modalId} [data-close]`).first().click();
  }
});
