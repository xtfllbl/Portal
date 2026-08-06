const { test, expect } = require("@playwright/test");

const TERMINAL_SN = "WP6267UQ36002376";
const DEX_URL = `/1.terminalmanage_nayax.html?tab=dex&sn=${TERMINAL_SN}`;
const DEX_STORAGE_KEY = `paywizard.dex.v1:${TERMINAL_SN}`;

async function resetDexState(page) {
  await page.goto(DEX_URL);
  await page.evaluate((key) => sessionStorage.removeItem(key), DEX_STORAGE_KEY);
  await page.reload();
}

test("shows automation summary before a selectable DEX read history", async ({ page }) => {
  await resetDexState(page);

  await expect(page.locator(".dex-command-bar")).toBeVisible();
  await expect(page.getByRole("button", { name: "DEX Read actions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "DEX Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh History" })).toBeVisible();
  await expect(page.locator(".dex-command-bar").getByRole("button", { name: "Refresh History" })).toHaveCount(0);
  await expect(page.locator("#dexAutomationSchedule")).toContainText("Delta");
  await expect(page.locator("#dexAutomationNext")).not.toHaveText("Not scheduled");
  await expect(page.locator("#dexAutomationEmail")).toHaveText("Off");

  const headers = await page.locator(".dex-history-table thead th").allTextContents();
  expect(headers.map((value) => value.trim())).toEqual([
    "Read Time",
    "Type",
    "Trigger",
    "Status",
    "Validation",
    "Email",
    "Records",
    "Actions"
  ]);

  const rows = page.locator("#dexHistoryBody tr");
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toHaveClass(/is-selected/);
  await rows.nth(1).getByRole("button", { name: "View" }).click();
  await expect(rows.nth(1)).toHaveClass(/is-selected/);

  await expect(page.locator(".dex-snapshot-header")).toHaveCount(0);
  await expect(page.locator(".dex-meta-grid")).toHaveCount(0);
  await expect(page.locator(".dex-kpi-grid")).toHaveCount(0);
  await expect(page.locator(".dex-detail-label")).toHaveCount(0);
  const order = await page.evaluate(() => {
    const history = document.querySelector(".dex-history-first");
    const detail = document.querySelector(".dex-view-panel");
    return Boolean(history && detail && (history.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(order).toBe(true);

  await page.getByRole("tab", { name: "RAW DATA" }).click();
  await expect(page.locator("#dexRawContent")).toContainText("ST*");
});

test("saves read, parsing and email settings for the current terminal session", async ({ page }) => {
  await resetDexState(page);
  await page.getByRole("button", { name: "DEX Settings" }).click();
  await page.getByRole("menuitem", { name: "Read Schedule" }).click();

  const dialog = page.getByRole("dialog", { name: "DEX Settings" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab")).toHaveCount(3);

  await page.locator("#dexScheduleMode").selectOption("fixed");
  await expect(page.locator("#dexFixedTimesField")).toBeVisible();
  const timeLayout = await page.evaluate(() => {
    const body = document.querySelector("#dexSettingsModal .feature-modal-body").getBoundingClientRect();
    const row = document.querySelector("#dexFixedTimesList .dex-time-row");
    const input = row.querySelector("input").getBoundingClientRect();
    const remove = row.querySelector("button").getBoundingClientRect();
    return { bodyRight: body.right, inputRight: input.right, removeLeft: remove.left, removeRight: remove.right };
  });
  expect(timeLayout.removeLeft).toBeGreaterThanOrEqual(timeLayout.inputRight + 6);
  expect(timeLayout.removeRight).toBeLessThanOrEqual(timeLayout.bodyRight + 1);

  await page.locator("#dexScheduleMode").selectOption("interval");

  await page.locator("#dexIntervalMinutes").fill("45");
  await page.locator("#dexScheduledReadType").selectOption("Full");
  await expect(page.locator("#dexFullScheduleWarning")).toBeVisible();

  await dialog.getByRole("tab", { name: "Parsing & Rules" }).click();
  await page.locator("#dexRetryAttempts").fill("3");
  await page.locator("#dexRetryPeriod").fill("60");
  await page.locator("#dexMultiplyCoins").fill("0.01");
  await expect(page.locator("#dexRulesWarning")).toBeVisible();

  await dialog.getByRole("tab", { name: "Email Notifications" }).click();
  await page.locator("label.dex-switch", { has: page.locator("#dexEmailEnabled") }).click();
  await expect(page.locator("#dexEmailEnabled")).toBeChecked();
  await page.locator("#dexEmailInput").fill("ops@example.com");
  await page.locator("#dexEmailInput").press("Enter");
  await expect(page.locator("#dexEmailTags")).toContainText("ops@example.com");

  await dialog.getByRole("button", { name: "Save Settings" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#dexAutomationSchedule")).toHaveText("Every 45 min · Full");
  await expect(page.locator("#dexAutomationEmail")).toHaveText("1 recipient");

  await page.reload();
  await expect(page.locator("#dexAutomationSchedule")).toHaveText("Every 45 min · Full");
  await expect(page.locator("#dexAutomationEmail")).toHaveText("1 recipient");
});

test("runs manual reads through history and keeps the settings dialog usable on mobile", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await resetDexState(page);

  await page.getByRole("button", { name: "DEX Read actions" }).click();
  await page.getByRole("menuitem", { name: "Read DEX", exact: true }).click();
  await expect(page.locator("#dexHistoryBody tr")).toHaveCount(6);
  await expect(page.locator("#dexHistoryBody tr").first()).toContainText("Manual");
  await expect(page.locator("#dexHistoryBody tr").first()).toContainText(/Parsed|Warning/, { timeout: 5000 });
  await expect(page.locator("#dexRequestStatus")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "DEX Settings" }).click();
  await page.getByRole("menuitem", { name: "Read Schedule" }).click();
  const dialog = page.getByRole("dialog", { name: "DEX Settings" });
  await expect(dialog).toBeVisible();
  const dimensions = await page.evaluate(() => {
    const modal = document.querySelector("#dexSettingsModal .dex-settings-dialog").getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      modalLeft: modal.left,
      modalRight: modal.right,
      modalBottom: modal.bottom,
      viewportHeight: window.innerHeight
    };
  });
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.modalLeft).toBeGreaterThanOrEqual(0);
  expect(dimensions.modalRight).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.modalBottom).toBeLessThanOrEqual(dimensions.viewportHeight);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "DEX Settings" })).toBeFocused();
  expect(pageErrors).toEqual([]);
});

test("opens each DEX settings section from the grouped Settings menu", async ({ page }) => {
  await resetDexState(page);

  await page.getByRole("button", { name: "DEX Settings" }).click();
  await page.getByRole("menuitem", { name: "Email Notifications" }).click();
  const dialog = page.getByRole("dialog", { name: "DEX Settings" });
  await expect(dialog.getByRole("tab", { name: "Email Notifications" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "DEX Settings" }).click();
  await page.getByRole("menuitem", { name: "Parsing & Rules" }).click();
  await expect(dialog.getByRole("tab", { name: "Parsing & Rules" })).toHaveAttribute("aria-selected", "true");
});
