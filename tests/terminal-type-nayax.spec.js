const { test, expect } = require("@playwright/test");

const TERMINAL_URL = "/1.terminalmanage_nayax.html?tab=basic";
const STORAGE_KEY = "paywizard.nayaxTerminalTypes.v1";

async function resetTerminalTypes(page, url = TERMINAL_URL) {
  await page.goto(url);
  await page.evaluate((key) => sessionStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
}

test("keeps the header compact and aligns the Terminal Type card with the dashboard", async ({ page }) => {
  await resetTerminalTypes(page);

  const card = page.locator("#terminalTypeCard");
  const trigger = page.locator("#terminalTypeButton");
  const back = page.getByRole("link", { name: "Back to Device Management" });
  await expect(card).toBeVisible();
  await expect(page.locator("#terminalTypeAttendance")).toHaveText("Unattended");
  await expect(page.locator("#terminalTypeName")).toHaveText("Vending Machine");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-label", "Edit terminal type, current Vending Machine");
  await expect(trigger).toHaveText("");
  await expect(trigger.locator("img")).toHaveAttribute("src", "assets/icons/edit.svg");
  await expect(back).toHaveAttribute("href", "2.resellermerchantterminal.html");
  await expect(page.locator(".card-banner h1")).toHaveCount(0);
  await expect(card).not.toContainText("Group List");
  await expect(page.locator(".terminal-details-card .panel-title")).toHaveText("Terminal Details");
  await expect(page.locator(".terminal-device-visual img")).toHaveAttribute("src", "assets/terminal-q3-device.png");
  await expect(page.locator(".terminal-details-card .kv-list")).toContainText("Terminal Name:");
  await expect(page.locator(".terminal-details-card .kv-list")).toContainText("Version:");
  await expect(page.locator(".terminal-details-card")).not.toContainText("View Detail");

  const measureVisibleBottoms = () => page.evaluate(() => {
    const stats = document.querySelector(".stat-grid").getBoundingClientRect();
    const type = document.querySelector("#terminalTypeCard").getBoundingClientRect();
    return { statsBottom: stats.bottom, typeBottom: type.bottom };
  });
  let alignment = await measureVisibleBottoms();
  expect(Math.abs(alignment.statsBottom - alignment.typeBottom)).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Collapse menu" }).click();
  alignment = await measureVisibleBottoms();
  expect(Math.abs(alignment.statsBottom - alignment.typeBottom)).toBeLessThanOrEqual(1);
});

test("opens a fixed dialog with all six choices and saves immediately", async ({ page }) => {
  await resetTerminalTypes(page);
  const trigger = page.locator("#terminalTypeButton");
  const card = page.locator("#terminalTypeCard");
  const before = await card.boundingBox();

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Edit Terminal Type" });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#terminalTypeOptions")).toContainText("Attended Scenarios");
  await expect(page.locator("#terminalTypeOptions")).toContainText("Unattended Scenarios");
  await expect(page.locator("#terminalTypeOptions [data-terminal-type]")).toHaveCount(6);
  await expect(page.getByRole("menuitem", { name: /Vending Machine/ })).toBeDisabled();
  await expect(page.locator("#terminalTypeOptions .terminal-type-current")).toHaveText("Current");
  const after = await card.boundingBox();
  expect(after.height).toBeCloseTo(before.height, 1);

  await page.getByRole("menuitem", { name: "Coffee Machine", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#terminalTypeName")).toHaveText("Coffee Machine");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(page.locator("#prototypeToast")).toContainText("Terminal type changed to Coffee Machine.");
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), STORAGE_KEY)).toEqual({
    WP6267UQ36002376: "unattended_coffee"
  });

  await page.reload();
  await expect(page.locator("#terminalTypeName")).toHaveText("Coffee Machine");
  await page.goto("/1.terminalmanage_nayax.html?tab=basic&sn=SECOND-SN&terminalName=Second%20Terminal");
  await expect(page.locator("#terminalTypeName")).toHaveText("Vending Machine");
});

test("uses URL initialization, lets stored SN state win, and recovers from invalid state", async ({ page }) => {
  await resetTerminalTypes(page, `${TERMINAL_URL}&terminalType=unattended_ev`);
  await expect(page.locator("#terminalTypeName")).toHaveText("EV Charging");

  await page.evaluate((key) => {
    sessionStorage.setItem(key, JSON.stringify({ WP6267UQ36002376: "unattended_coffee" }));
  }, STORAGE_KEY);
  await page.goto(`${TERMINAL_URL}&terminalType=unattended_ev`);
  await expect(page.locator("#terminalTypeName")).toHaveText("Coffee Machine");

  await page.evaluate((key) => sessionStorage.setItem(key, "{broken"), STORAGE_KEY);
  await page.goto(`${TERMINAL_URL}&terminalType=not-a-type`);
  await expect(page.locator("#terminalTypeName")).toHaveText("Vending Machine");
  await expect.poll(() => page.evaluate((key) => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test("supports keyboard navigation, cancel, backdrop close, Escape and mobile layout", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await resetTerminalTypes(page);
  const trigger = page.locator("#terminalTypeButton");

  await trigger.focus();
  await trigger.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Standalone Terminal", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Terminal + ECR", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator("#terminalTypeModal").click({ position: { x: 3, y: 3 } });
  await expect(page.locator("#terminalTypeModal")).toHaveAttribute("aria-hidden", "true");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    columns: getComputedStyle(document.querySelector(".dash-grid")).gridTemplateColumns
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.columns.split(" ")).toHaveLength(1);
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Edit Terminal Type" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
