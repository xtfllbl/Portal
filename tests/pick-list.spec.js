const fs = require("fs");
const { test, expect } = require("@playwright/test");

const PRODUCTS_URL = "/35.product_management.html";
const PRODUCT_MAP_URL = "/1.terminalmanage_nayax.html?tab=productmap";
const PICK_LIST_URL = "/37.pick_list.html?sn=WP6267UQ36002376&tid=UZN10E08&merchantName=1%20of%20a%20Kind%20World%20Travel%20LLC%2041381&terminalName=Terminal%20-%20WP6267UQ36002376&machineModel=Q3RU";
const TERMINAL_SN = "WP6267UQ36002376";

async function resetCatalog(page) {
  await page.goto(PRODUCTS_URL);
  await page.evaluate(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();
}

async function futureLocalValue(page, offsetMinutes = 60) {
  return page.evaluate((minutes) => {
    const date = new Date(Date.now() + minutes * 60000);
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }, offsetMinutes);
}

async function openGenerateModal(page) {
  await page.getByRole("button", { name: "Stock", exact: true }).click();
  const item = page.getByRole("menuitem", { name: "Generate Pick List" });
  await page.keyboard.press("ArrowDown");
  await expect(item).toBeFocused();
  await item.click();
  await expect(page.locator("#pmPickListModal")).toHaveClass(/open/);
}

async function makeScheduleDue(page) {
  await page.evaluate((sn) => {
    const key = `paywizard.pickList.v1:${sn}`;
    const state = JSON.parse(localStorage.getItem(key));
    state.schedule.status = "scheduled";
    state.schedule.scheduledFor = new Date(Date.now() - 60000).toISOString();
    state.schedule.updatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(state));
  }, TERMINAL_SN);
}

test("uses the Nayax-aligned Stock menu and generates a Pick List with terminal context", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(`${PRODUCT_MAP_URL}&terminalName=Airport%20Snacks&merchantName=Example%20Merchant&tid=TID900&machineModel=Q3RU`);

  await page.getByRole("button", { name: "Stock", exact: true }).click();
  const menuItems = page.locator("#pmStockMenuPanel [role=menuitem]");
  await expect(menuItems).toHaveCount(4);
  await expect(menuItems.nth(0)).toHaveText("Download Pick List");
  await expect(menuItems.nth(1)).toHaveText("Generate Pick List");
  await expect(menuItems.nth(2)).toHaveText("Fill Machine 100%");
  await expect(menuItems.nth(3)).toHaveText("Empty Machine");
  await menuItems.nth(1).click();

  await expect(page.getByRole("heading", { name: "Generate Pick List" })).toBeVisible();
  await expect(page.locator("#pmPickListScheduleEnabled")).not.toBeChecked();
  await expect(page.locator("#pmPickListScheduleFields")).toBeHidden();
  await expect(page.getByText("Use Minimum picklist logic per machine")).toHaveCount(0);
  await expect(page.getByText("Adjust pick with online transaction gap")).toHaveCount(0);
  await expect(page.getByText("Add products based on statistics for visit")).toHaveCount(0);
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page).toHaveURL(/37\.pick_list\.html/);
  const url = new URL(page.url());
  expect(url.searchParams.get("terminalName")).toBe("Airport Snacks");
  expect(url.searchParams.get("merchantName")).toBe("Example Merchant");
  expect(url.searchParams.get("tid")).toBe("TID900");
  await expect(page.getByRole("heading", { name: "Pick List", exact: true })).toBeVisible();
  await expect(page.locator("#pageNote")).toContainText("Airport Snacks");
});

test("shows only the five-column shortage list in Product Map order", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PICK_LIST_URL);

  await expect(page.getByText("Terminal Inventory", { exact: true })).toHaveCount(0);
  await expect(page.locator("thead th")).toHaveText(["PA Code", "MDB Code", "Product", "Product Group", "Pick Qty"]);
  await expect(page.locator("#pickListBody tr")).toHaveCount(6);
  const first = page.locator("#pickListBody tr").first();
  await expect(first.locator("td")).toHaveText(["11", "18", "Goldfish", "Snacks", "9"]);
  await expect(page.locator(".summary, .schedule-card, .status-banner, .notice")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download Pick List" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fill Pick List" })).toHaveCount(0);
});

test("opens Download Pick List from Stock as a one-time page intent", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(`${PRODUCT_MAP_URL}&terminalName=Airport%20Snacks&merchantName=Example%20Merchant&tid=TID900&machineModel=Q3RU`);

  await page.getByRole("button", { name: "Stock", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Download Pick List" })).toBeFocused();
  await page.getByRole("menuitem", { name: "Download Pick List" }).click();

  await expect(page).toHaveURL(/37\.pick_list\.html/);
  await expect(page.getByRole("heading", { name: "Download Pick List" })).toBeVisible();
  expect(new URL(page.url()).searchParams.has("download")).toBeFalsy();
  await expect(page.locator("#pageNote")).toContainText("Airport Snacks");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  await expect(page.locator("#downloadDialog")).toBeHidden();
});

test("keeps the Generate Pick List dialog controls at the Paywizard standard size", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await openGenerateModal(page);

  await expect(page.locator("#pmPickListScheduleEnabled")).not.toBeChecked();
  await expect(page.locator("#pmPickListScheduleFields")).toBeHidden();
  await page.locator("#pmPickListScheduleEnabled").check();
  await expect(page.locator("#pmPickListScheduleFields")).toBeVisible();
  const sizes = await page.locator("#pmPickListModal").evaluate((modal) => {
    const input = modal.querySelector("#pmPickListTime").getBoundingClientRect();
    const buttons = Array.from(modal.querySelectorAll(".pm-pick-list-footer-actions button")).map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    return { modal: modal.querySelector(".pm-pick-list-modal").getBoundingClientRect().width, inputHeight: input.height, buttons };
  });
  expect(sizes.modal).toBeLessThanOrEqual(500);
  expect(sizes.inputHeight).toBe(40);
  expect(sizes.buttons).toEqual([{ width: 112, height: 36 }, { width: 112, height: 36 }]);

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("creates, restores, updates, and cancels a future fill only in the Generate modal", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  const firstTime = await futureLocalValue(page, 60);
  await openGenerateModal(page);
  await page.locator("#pmPickListScheduleEnabled").check();
  await page.locator("#pmPickListTime").fill(firstTime);
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  const first = await page.evaluate((sn) => window.PaywizardPickList.getSchedule(sn), TERMINAL_SN);
  expect(first.status).toBe("scheduled");
  await page.goto(PRODUCT_MAP_URL);
  await expect(page.getByRole("button", { name: "View / Change" })).toHaveCount(0);
  await openGenerateModal(page);
  await expect(page.locator("#pmPickListScheduleEnabled")).toBeChecked();
  await expect(page.locator("#pmPickListTime")).toHaveValue(firstTime);
  await expect(page.getByRole("button", { name: "Update Pick List" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel Scheduled Fill" })).toBeVisible();

  const secondTime = await futureLocalValue(page, 120);
  await page.locator("#pmPickListTime").fill(secondTime);
  await page.getByRole("button", { name: "Update Pick List" }).click();
  const second = await page.evaluate((sn) => window.PaywizardPickList.getSchedule(sn), TERMINAL_SN);
  expect(second.scheduleId).toBe(first.scheduleId);
  expect(second.scheduledFor).not.toBe(first.scheduledFor);

  await page.goto(PRODUCT_MAP_URL);
  await openGenerateModal(page);
  await page.getByRole("button", { name: "Cancel Scheduled Fill" }).click();
  await expect(page.locator("#pmConfirmTitle")).toHaveText("Cancel automatic fill?");
  await page.locator("#pmConfirmAccept").click();
  expect(await page.evaluate((sn) => window.PaywizardPickList.getSchedule(sn), TERMINAL_SN)).toBeNull();
});

test("validates a past completion time without leaving Product Map", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await openGenerateModal(page);
  await page.locator("#pmPickListScheduleEnabled").check();
  await page.locator("#pmPickListTime").fill("2020-01-01T00:00");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.locator("#pmPickListTimeError")).toHaveText("Choose a future completion time.");
  await expect(page).toHaveURL(/1\.terminalmanage_nayax\.html/);
});

test("downloads Excel-compatible XML and invokes PDF printing from one compact dialog", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PICK_LIST_URL);
  await page.evaluate((sn) => {
    const api = window.PaywizardProductCatalog;
    const rows = api.getProductMap(sn);
    rows[1].productNameSnapshot = "薯片, 大包 & 特价";
    rows[1].productName = "薯片, 大包 & 特价";
    api.saveProductMap(sn, rows);
  }, TERMINAL_SN);

  await page.getByRole("button", { name: "Download Pick List" }).click();
  await expect(page.getByRole("heading", { name: "Download Pick List" })).toBeVisible();
  await page.getByLabel("Export Pick List to Excel").check();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^pick-list-WP6267UQ36002376-\d{8}-\d{4}\.xls$/);
  const workbook = fs.readFileSync(await download.path(), "utf8");
  expect(workbook).toContain('Worksheet ss:Name="Pick List"');
  expect(workbook).toContain("PA Code");
  expect(workbook).toContain("MDB Code");
  expect(workbook).not.toContain(">BIN<");
  expect(workbook).toContain("薯片, 大包 &amp; 特价");
  expect(workbook).not.toContain("Trail Mix");
  expect(workbook).not.toContain("Starburst");

  await page.evaluate(() => { window.__pickListPrintCalled = false; window.print = () => { window.__pickListPrintCalled = true; }; });
  await page.getByRole("button", { name: "Download Pick List" }).click();
  await page.getByLabel("Export Pick List to PDF").check();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__pickListPrintCalled)).toBe(true);
});

test("catches up an overdue schedule once and fills the latest saved Product Map", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PICK_LIST_URL);
  await page.evaluate((sn) => window.PaywizardPickList.saveSchedule(sn, new Date(Date.now() + 3600000)), TERMINAL_SN);
  await makeScheduleDue(page);
  await page.reload();

  await expect(page.locator("#emptyState")).toBeVisible();
  const state = await page.evaluate((sn) => ({ rows: window.PaywizardProductCatalog.getProductMap(sn), schedule: window.PaywizardPickList.getSchedule(sn), last: window.PaywizardPickList.getLastExecution(sn) }), TERMINAL_SN);
  expect(state.rows.every((row) => row.onHand === row.par)).toBeTruthy();
  expect(state.schedule).toBeNull();
  expect(state.last.source).toBe("scheduled");
  const executionId = state.last.executionId;
  await page.reload();
  expect(await page.evaluate((sn) => window.PaywizardPickList.getLastExecution(sn).executionId, TERMINAL_SN)).toBe(executionId);
});

test("marks a due schedule failed without partially changing inventory", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PICK_LIST_URL);
  await page.evaluate((sn) => {
    window.PaywizardPickList.saveSchedule(sn, new Date(Date.now() + 3600000));
    window.PaywizardProductCatalog.saveProductMap(sn, []);
  }, TERMINAL_SN);
  await makeScheduleDue(page);
  await page.reload();
  const result = await page.evaluate((sn) => ({ rows: window.PaywizardProductCatalog.getProductMap(sn), schedule: window.PaywizardPickList.getSchedule(sn), last: window.PaywizardPickList.getLastExecution(sn) }), TERMINAL_SN);
  expect(result.rows).toEqual([]);
  expect(result.schedule.status).toBe("failed");
  expect(result.last.status).toBe("failed");
  await expect(page.locator("#pageNote")).toContainText("Automatic fill failed");
});

test("manual Product Map fill cancels a schedule only after inventory saves", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await page.evaluate((sn) => window.PaywizardPickList.saveSchedule(sn, new Date(Date.now() + 3600000)), TERMINAL_SN);
  await expect(page.getByRole("button", { name: "View / Change" })).toHaveCount(0);
  await page.getByRole("button", { name: "Stock", exact: true }).click();
  await page.getByRole("menuitem", { name: "Fill Machine 100%" }).click();
  await expect(page.locator("#pmConfirmTitle")).toHaveText("Fill now and cancel schedule?");
  await page.locator("#pmConfirmAccept").click();
  expect(await page.evaluate((sn) => window.PaywizardPickList.getSchedule(sn), TERMINAL_SN)).toBeNull();
  const rows = await page.evaluate((sn) => window.PaywizardProductCatalog.getProductMap(sn), TERMINAL_SN);
  expect(rows.every((row) => row.onHand === row.par)).toBeTruthy();
});

test("keeps the schedule and inventory unchanged when a manual fill cannot be saved", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await page.evaluate((sn) => {
    window.PaywizardPickList.saveSchedule(sn, new Date(Date.now() + 3600000));
    window.__originalStorageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "paywizard.productCatalog.v2") throw new Error("simulated storage failure");
      return window.__originalStorageSetItem.call(this, key, value);
    };
  }, TERMINAL_SN);
  const before = await page.evaluate((sn) => window.PaywizardProductCatalog.getProductMap(sn), TERMINAL_SN);
  await page.getByRole("button", { name: "Stock", exact: true }).click();
  await page.getByRole("menuitem", { name: "Fill Machine 100%" }).click();
  await page.locator("#pmConfirmAccept").click();
  await expect(page.locator("#prototypeToast")).toContainText("could not be saved");
  const after = await page.evaluate((sn) => {
    Storage.prototype.setItem = window.__originalStorageSetItem;
    return {
      rows: window.PaywizardProductCatalog.getProductMap(sn),
      schedule: window.PaywizardPickList.getSchedule(sn)
    };
  }, TERMINAL_SN);
  expect(after.rows).toEqual(before);
  expect(after.schedule.status).toBe("scheduled");
});

test("shows the zero-pick state and keeps the page within a 390px viewport", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PICK_LIST_URL);
  await page.evaluate((sn) => window.PaywizardProductCatalog.fillProductMapToPar(sn), TERMINAL_SN);
  await page.reload();
  await expect(page.locator("#emptyState")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Pick List" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Fill Pick List" })).toHaveCount(0);

  await page.goto(`${PICK_LIST_URL}&download=1`);
  await expect(page.locator("#downloadDialog")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("download")).toBeFalsy();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});
