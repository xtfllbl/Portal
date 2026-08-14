const { test, expect } = require("@playwright/test");

async function openTerminalList(page) {
  await page.goto("/26.partner_information.html");
  await page.locator('[data-select-id="p-taizhou-lianchuang"]').click();
  await page.getByRole("tab", { name: "Terminal List" }).click();
}

test("uses the unified admin shell and renders the complete terminal lifecycle", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await openTerminalList(page);

  await expect(page.locator("body")).toHaveClass(/pw-admin/);
  await expect(page.locator(".pw-brand img")).toHaveAttribute("src", "assets/paywizard-logo.png");
  await expect(page.locator(".pw-menu-item.active")).toContainText("Partners");
  await expect(page.locator(".pw-sub-item.active")).toHaveText("Partner List");
  await expect(page.locator(".pw-breadcrumb")).toContainText("PARTNERS");
  await expect(page.locator(".pw-breadcrumb")).toContainText("PARTNER LIST");

  await expect(page.locator(".terminal-list-table th")).toHaveText([
    "SN",
    "Partner Name",
    "Terminal Status",
    "Inbound Date",
    "Outbound Date",
    "Assigned Date",
    "Activation Date"
  ]);
  await expect(page.locator(".terminal-list-table")).not.toContainText("Initial Contact Date");
  await expect(page.locator(".terminal-list-table")).not.toContainText("Onboarding Date");

  await expect(page.locator('[data-terminal-stat="total"]')).toHaveText("11");
  await expect(page.locator('[data-terminal-stat="inventory"]')).toHaveText("6");
  await expect(page.locator('[data-terminal-stat="assigned"]')).toHaveText("3");
  await expect(page.locator('[data-terminal-stat="activated"]')).toHaveText("1");
  await expect(page.locator(".terminal-status.activated")).toHaveCount(1);
  await expect(page.locator(".terminal-status.assigned")).toHaveCount(2);
  await expect(page.locator(".terminal-status.outbound")).toHaveCount(2);
  await expect(page.locator(".terminal-status.inbound")).toHaveCount(6);

  const activatedDates = await page.locator(".terminal-status.activated").first().locator("xpath=ancestor::tr").locator("td").allTextContents();
  expect(activatedDates[3]).not.toBe("-");
  expect(activatedDates[4]).not.toBe("-");
  expect(activatedDates[5]).not.toBe("-");
  expect(activatedDates[6]).not.toBe("-");
  expect(activatedDates[3] < activatedDates[4]).toBeTruthy();
  expect(activatedDates[4] < activatedDates[5]).toBeTruthy();
  expect(activatedDates[5] < activatedDates[6]).toBeTruthy();

  const assignedDates = await page.locator(".terminal-status.assigned").first().locator("xpath=ancestor::tr").locator("td").allTextContents();
  expect(assignedDates[5]).not.toBe("-");
  expect(assignedDates[6]).toBe("-");
  expect(errors).toEqual([]);
});

test("filters terminals without changing the full lifecycle summary", async ({ page }) => {
  await openTerminalList(page);
  const summaryBefore = await page.locator(".terminal-stat-value").allTextContents();

  await page.locator("#terminalStatusFilter").selectOption("Assigned");
  await page.getByRole("button", { name: "Search terminals" }).click();
  await expect(page.locator(".terminal-status")).toHaveCount(2);
  await expect(page.locator(".terminal-status")).toHaveText(["Assigned", "Assigned"]);
  expect(await page.locator(".terminal-stat-value").allTextContents()).toEqual(summaryBefore);

  await page.getByRole("button", { name: "Clear terminal filters" }).click();
  const firstSn = await page.locator(".terminal-list-table tbody tr").first().locator("td").first().textContent();
  await page.locator("#terminalSnFilter").fill(firstSn);
  await page.locator("#terminalSnFilter").press("Enter");
  await expect(page.locator(".terminal-list-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".terminal-list-table tbody tr").first()).toContainText(firstSn);
  expect(await page.locator(".terminal-stat-value").allTextContents()).toEqual(summaryBefore);

  await page.getByRole("button", { name: "Clear terminal filters" }).click();
  await expect(page.locator(".terminal-list-table tbody tr")).toHaveCount(11);
});

test("keeps partner controls and terminal layouts responsive", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900, columns: 4 },
    { width: 1040, height: 900, columns: 2 },
    { width: 390, height: 844, columns: 1 }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openTerminalList(page);
    const layout = await page.evaluate(() => {
      const stats = document.querySelector(".terminal-stats");
      const tableWrap = document.querySelector(".terminal-list-wrap");
      return {
        statColumns: getComputedStyle(stats).gridTemplateColumns.split(" ").length,
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        tableScrolls: tableWrap.scrollWidth > tableWrap.clientWidth
      };
    });
    expect(layout.statColumns).toBe(viewport.columns);
    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    if (viewport.width === 390) expect(layout.tableScrolls).toBeTruthy();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/26.partner_information.html");
  await page.getByRole("button", { name: "Add Partner", exact: true }).click();
  await expect(page.locator("#addModal")).toHaveClass(/show/);
  await page.locator("#cancelAdd").click();

  await page.locator('[data-select-id="p-taizhou-lianchuang"]').click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.locator("#editModal")).toHaveClass(/show/);
  await page.locator("#cancelEdit").click();
  await page.getByRole("tab", { name: "Partner Profile" }).click();
  await expect(page.locator(".detail-section-title")).toHaveText("Profile");
});
