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

  const sidebarDensity = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".pw-nav > .pw-menu-item, .pw-nav .pw-sub-item")];
    const nav = document.querySelector(".pw-nav");
    return {
      rowHeights: rows.map((row) => row.getBoundingClientRect().height),
      navHeight: nav.getBoundingClientRect().height,
      sidebarHeight: document.querySelector(".pw-sidebar").getBoundingClientRect().height
    };
  });
  expect(Math.max(...sidebarDensity.rowHeights)).toBeLessThanOrEqual(48);
  expect(sidebarDensity.navHeight).toBeLessThan(sidebarDensity.sidebarHeight * 0.75);

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

  const tabTypography = await page.getByRole("tab", { name: "Terminal List" }).evaluate((tab) => {
    const styles = getComputedStyle(tab);
    return {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight
    };
  });
  expect(tabTypography.fontFamily).toContain("Poppins");
  expect(tabTypography.fontSize).toBe("13px");
  expect(tabTypography.fontWeight).toBe("600");
  expect(tabTypography.lineHeight).toBe("17.55px");

  await expect(page.locator('[data-terminal-stat="total"]')).toHaveText("64");
  await expect(page.locator('[data-terminal-stat="inventory"]')).toHaveText("36");
  await expect(page.locator('[data-terminal-stat="assigned"]')).toHaveText("18");
  await expect(page.locator('[data-terminal-stat="activated"]')).toHaveText("8");
  await expect(page.locator(".terminal-status.activated")).toHaveCount(8);
  await expect(page.locator(".terminal-status.assigned")).toHaveCount(10);
  await expect(page.locator(".terminal-status.outbound")).toHaveCount(10);
  await expect(page.locator(".terminal-status.inbound")).toHaveCount(36);

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
  await expect(page.locator(".terminal-status")).toHaveCount(10);
  await expect(page.locator(".terminal-status")).toHaveText(Array(10).fill("Assigned"));
  expect(await page.locator(".terminal-stat-value").allTextContents()).toEqual(summaryBefore);

  await page.getByRole("button", { name: "Clear terminal filters" }).click();
  const firstSn = await page.locator(".terminal-list-table tbody tr").first().locator("td").first().textContent();
  await page.locator("#terminalSnFilter").fill(firstSn);
  await page.locator("#terminalSnFilter").press("Enter");
  await expect(page.locator(".terminal-list-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".terminal-list-table tbody tr").first()).toContainText(firstSn);
  expect(await page.locator(".terminal-stat-value").allTextContents()).toEqual(summaryBefore);

  await page.getByRole("button", { name: "Clear terminal filters" }).click();
  await expect(page.locator(".terminal-list-table tbody tr")).toHaveCount(64);
});

test("provides more than 50 lifecycle samples for every UPT partner", async ({ page }) => {
  const uptPartnerIds = [
    "p-huangjiaowan",
    "p-taizhou-lianchuang",
    "p-guangzhou-ailer",
    "p-guangzhou-xianghe",
    "p-shenzhen-gengxin",
    "p-songjie-baxi",
    "p-shenzhen-bianya",
    "p-guangzhou-xiaorui",
    "p-guangzhou-jiecheng"
  ];

  await page.goto("/26.partner_information.html");
  for (const partnerId of uptPartnerIds) {
    await page.locator(`[data-select-id="${partnerId}"]`).click();
    await page.getByRole("tab", { name: "Terminal List" }).click();
    const total = Number(await page.locator('[data-terminal-stat="total"]').textContent());
    expect(total).toBeGreaterThan(50);
    await expect(page.locator(".terminal-list-table tbody tr")).toHaveCount(total);
    for (const status of ["inbound", "outbound", "assigned", "activated"]) {
      expect(await page.locator(`.terminal-status.${status}`).count()).toBeGreaterThan(0);
    }
  }
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
