const { test, expect } = require("@playwright/test");

async function openTerminalPage(page) {
  await page.goto("/2.resellermerchantterminal.html");
  await expect(page.locator(".terminal-table tbody tr")).toHaveCount(15);
}

test("uses the unified device-management shell and renders service status dots", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await openTerminalPage(page);

  await expect(page.locator("body")).toHaveClass(/pw-admin/);
  await expect(page.locator(".pw-brand img")).toHaveAttribute("src", "assets/paywizard-logo-sidebar.png");
  await expect(page.locator(".pw-brand-environment")).toHaveText("SANDBOX");
  await expect(page.locator(".pw-menu-item.active")).toContainText("Device Management");
  await expect(page.locator(".pw-menu-item.active")).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".pw-breadcrumb")).toContainText("DEVICE MANAGEMENT");
  await expect(page.locator(".pw-breadcrumb")).toContainText("TERMINAL MANAGEMENT");

  await expect(page.locator(".terminal-table th")).toHaveText([
    "SN",
    "Terminal Name (Device Label)",
    "TCI",
    "Model",
    "Status",
    "Device Service",
    "Payment Service",
    "Merchant Name",
    "Store Name",
    "Created Date",
    "Actions"
  ]);

  await expect(page.locator(".terminal-service-status.device")).toHaveCount(15);
  await expect(page.locator(".terminal-service-status.payment")).toHaveCount(15);
  await expect(page.locator(".terminal-service-status.device.online")).toHaveCount(11);
  await expect(page.locator(".terminal-service-status.device.offline")).toHaveCount(4);
  await expect(page.locator(".terminal-service-status.payment.online")).toHaveCount(5);
  await expect(page.locator(".terminal-service-status.payment.offline")).toHaveCount(10);
  await expect(page.locator(".terminal-service-status")).toHaveText(Array(30).fill(""));

  await expect(page.locator("tr.inventory-only .terminal-service-status.payment.online")).toHaveCount(0);
  await expect(page.locator("tr.inventory-only .terminal-service-status.payment.offline")).toHaveCount(6);
  await expect(page.locator('tr[data-terminal-status="active"] .terminal-service-status.payment.online')).toHaveCount(5);
  await expect(page.locator('tr[data-terminal-status="active"] .terminal-service-status.payment.offline')).toHaveCount(2);
  await expect(page.locator('tr[data-terminal-status="assigned"] .terminal-service-status.payment.online')).toHaveCount(0);
  await expect(page.locator('tr[data-terminal-status="assigned"] .terminal-service-status.payment.offline')).toHaveCount(2);

  await expect(page.locator('tr[data-terminal-status="active"]')).toHaveCount(7);
  await expect(page.locator('tr[data-terminal-status="assigned"]')).toHaveCount(2);
  await expect(page.locator('tr[data-terminal-status="inact"]')).toHaveCount(6);
  await expect(page.locator(".status-tag.active")).toHaveText(Array(7).fill("ACTIVE"));
  await expect(page.locator(".status-tag.assigned")).toHaveText(Array(2).fill("ASSIGNED"));
  await expect(page.locator(".status-tag.unactivated")).toHaveText(Array(6).fill("INACT"));
  await expect(page.locator(".status-tag.unactivated").first()).toHaveCSS("color", "rgb(102, 112, 133)");
  await expect(page.locator(".status-tag.unactivated").first()).toHaveCSS("background-color", "rgb(242, 244, 247)");
  await expect(page.locator(".status-tag.unactivated").first()).toHaveCSS("border-color", "rgb(208, 213, 221)");
  await expect(page.locator(".terminal-table tr.inventory-only td").first()).toHaveCSS("background-color", "rgb(250, 250, 250)");
  await expect(page.locator(".status-tag.active").first()).toHaveCSS("background-color", "rgb(220, 252, 231)");
  await expect(page.locator(".status-tag.assigned").first()).toHaveCSS("background-color", "rgb(232, 243, 255)");

  const terminalIds = await page.locator(".terminal-table tbody tr").evaluateAll((rows) => rows.map((row) => ({
    status: row.dataset.terminalStatus,
    sn: row.cells[0].textContent.trim(),
    tci: row.cells[2].textContent.trim()
  })));
  const assignedOrActive = terminalIds.filter((row) => row.status === "active" || row.status === "assigned");
  expect(assignedOrActive).toHaveLength(9);
  expect(new Set(assignedOrActive.map((row) => row.tci)).size).toBe(9);
  assignedOrActive.forEach((row) => {
    expect(row.tci).toMatch(/^TC\d{8}$/);
    expect(row.tci).toBe(`TC${row.sn.replace(/\D/g, "").slice(-8).padStart(8, "0")}`);
  });
  terminalIds.filter((row) => row.status === "inact").forEach((row) => expect(row.tci).toBe("-"));
  await expect(page.locator("#terminalFilterTci")).toHaveAttribute("placeholder", "TCI");
  await expect(page.locator("#terminalFilterTci")).toHaveAttribute("aria-label", "Filter by TCI");
  await expect(page.locator("#terminalFilterStatus option")).toHaveText(["Status", "ACTIVE", "ASSIGNED", "INACT"]);
  await expect(page.locator(".tci-cell").first()).toHaveCSS("font-weight", "700");
  const tciHeaderFits = await page.getByRole("columnheader", { name: "TCI" }).evaluate((header) => (
    header.scrollWidth <= header.clientWidth
  ));
  expect(tciHeaderFits).toBeTruthy();

  const deviceOnline = page.locator(".terminal-service-status.device.online").first();
  const paymentOffline = page.locator(".terminal-service-status.payment.offline").first();
  await expect(deviceOnline).toHaveAttribute("data-service", "device");
  await expect(deviceOnline).toHaveAttribute("data-service-status", "Online");
  await expect(deviceOnline).toHaveAttribute("title", "Online");
  await expect(deviceOnline).toHaveAttribute("aria-label", "Device Service: Online");
  await expect(paymentOffline).toHaveAttribute("data-service", "payment");
  await expect(paymentOffline).toHaveAttribute("data-service-status", "Offline");
  await expect(paymentOffline).toHaveAttribute("title", "Offline");
  await expect(paymentOffline).toHaveAttribute("aria-label", "Payment Service: Offline");
  await expect(deviceOnline).toHaveCSS("width", "10px");
  await expect(deviceOnline).toHaveCSS("height", "10px");
  await expect(deviceOnline).toHaveCSS("background-color", "rgb(34, 197, 94)");
  await expect(paymentOffline).toHaveCSS("background-color", "rgb(239, 68, 68)");
  await expect(page.locator("th.terminal-service-column").first()).toHaveCSS("text-align", "center");
  const firstHeader = page.locator(".terminal-table thead th").first();
  await expect(firstHeader).toHaveCSS("background-color", "rgb(245, 245, 246)");
  await expect(firstHeader).toHaveCSS("color", "rgb(85, 88, 98)");
  await expect(firstHeader).toHaveCSS("border-bottom-color", "rgb(222, 223, 227)");
  const paymentHeaderFits = await page.getByRole("columnheader", { name: "Payment Service" }).evaluate((header) => (
    header.scrollWidth <= header.clientWidth
  ));
  expect(paymentHeaderFits).toBeTruthy();
  await expect(page.locator(".terminal-table")).toHaveCSS("min-width", "1440px");
  await expect(page.locator(".terminal-table thead th").first()).toHaveCSS("height", "34px");
  await expect(page.locator(".terminal-table tbody td").first()).toHaveCSS("height", "45px");
  const serviceColumnWidth = await page.locator("th.terminal-service-column").first().evaluate((header) => (
    header.getBoundingClientRect().width
  ));
  expect(serviceColumnWidth).toBeGreaterThanOrEqual(112);
  expect(serviceColumnWidth).toBeLessThan(114);
  await expect(page.locator(".terminal-pagination")).toHaveCSS("height", "54px");
  await expect(page.locator(".pager-page.active")).toHaveCSS("width", "38px");
  await expect(page.locator(".pager-page.active")).toHaveCSS("height", "38px");

  await expect(page.locator(".terminal-stat-card")).toHaveCount(4);
  await expect(page.locator(".terminal-stat-label")).toHaveText([
    "Total",
    "Activated",
    "Unactivated",
    "Activation Rate"
  ]);
  await expect(page.locator("#terminalDeviceStatusFilter, #terminalPaymentStatusFilter")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("preserves terminal filtering, sync, bind, and navigation behavior", async ({ page }) => {
  await openTerminalPage(page);

  await page.locator("#hierAddBtn").click();
  await expect(page.locator("#hierAddMenu")).toHaveClass(/show/);
  await expect(page.locator("#hierAddMenu")).toHaveCSS("width", "168px");
  await expect(page.locator("#hierAddMenu .dropdown-item").first()).toHaveCSS("font-size", "12px");
  const quickAddFits = await page.locator("#hierAddMenu .dropdown-item").evaluateAll((items) => (
    items.every((item) => item.scrollWidth <= item.clientWidth && getComputedStyle(item).whiteSpace === "nowrap")
  ));
  expect(quickAddFits).toBeTruthy();
  await page.locator("#hierAddBtn").click();

  await page.locator("#terminalFilterBtn").click();
  await expect(page.locator("#terminalFilterPopover")).toHaveCSS("width", "460px");
  await expect(page.locator("#terminalFilterName")).toHaveCSS("height", "36px");
  await expect(page.locator("#terminalFilterName")).toHaveCSS("font-size", "12px");
  await expect(page.locator("#terminalFilterSearch")).toHaveCSS("height", "36px");
  await expect(page.locator("#terminalFilterSearch")).toHaveCSS("font-size", "12px");
  await page.locator("#terminalFilterStatus").selectOption("active");
  await page.locator("#terminalFilterSearch").click();
  await expect(page.locator(".terminal-table tbody tr:visible")).toHaveCount(7);

  await page.locator("#terminalFilterBtn").click();
  await page.locator("#terminalFilterReset").click();
  await page.locator("#terminalFilterStatus").selectOption("assigned");
  await page.locator("#terminalFilterSearch").click();
  await expect(page.locator(".terminal-table tbody tr:visible")).toHaveCount(2);

  await page.locator("#terminalFilterBtn").click();
  await page.locator("#terminalFilterReset").click();
  await page.locator("#terminalFilterStatus").selectOption("inact");
  await page.locator("#terminalFilterSearch").click();
  await expect(page.locator(".terminal-table tbody tr:visible")).toHaveCount(6);

  await page.locator("#terminalFilterBtn").click();
  await page.locator("#terminalFilterReset").click();
  await page.locator("#terminalFilterTci").fill("33000052");
  await page.locator("#terminalFilterModel").selectOption("q3ru");
  await page.locator("#terminalFilterTci").press("Enter");
  await expect(page.locator(".terminal-table tbody tr:visible")).toHaveCount(1);
  await expect(page.locator(".terminal-table tbody tr:visible .tci-cell")).toHaveText("TC33000052");

  await page.locator("#terminalFilterBtn").click();
  await page.locator("#terminalFilterReset").click();
  await expect(page.locator("#terminalFilterStatus")).toHaveValue("");
  await expect(page.locator(".terminal-table tbody tr:visible")).toHaveCount(15);

  await page.locator("#refreshTmsBtn").click();
  await expect(page.locator("#refreshTmsBtn")).toHaveClass(/is-loading/);
  await expect(page.locator("#terminalSyncStatus")).toContainText("Pulling latest TMS inventory");
  await expect(page.locator("#refreshTmsBtn")).not.toHaveClass(/is-loading/, { timeout: 3000 });
  await expect(page.locator("#terminalSyncStatus")).toContainText("Last sync:");

  await expect(page.locator(".terminal-table tbody tr").first().locator(".sn-link"))
    .toHaveAttribute("href", "1.terminalmanage.html");

  await page.locator("tr.inventory-only .terminal-bind-button").first().click();
  await expect(page.locator("#bindStoreModal")).toHaveClass(/show/);
  await expect(page.locator("#bindStoreSn")).toHaveText("WP5445UQ33200102");
  await expect(page.locator("#bindStoreModel")).toHaveText("Q3VU");
  await page.locator("#bindStoreCancel").click();
  await expect(page.locator("#bindStoreModal")).not.toHaveClass(/show/);
});

test("provides a floating horizontal scrollbar for the wide terminal table", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 853 });
  await openTerminalPage(page);

  const floatingScroll = page.locator("#terminalFloatingHScroll");
  const inlineScroll = page.locator("#terminalInlineHScroll");
  const tableWrap = page.locator(".terminal-table").locator("xpath=ancestor::div[contains(@class,'table-wrapper')][1]");
  await expect(floatingScroll).toHaveClass(/show/);
  await expect(floatingScroll).toHaveAttribute("role", "scrollbar");
  await expect(floatingScroll).toHaveAttribute("aria-label", "Scroll terminal columns horizontally");
  await expect(floatingScroll).toHaveAttribute("aria-orientation", "horizontal");
  await expect(floatingScroll).toHaveAttribute("aria-hidden", "false");
  await expect(floatingScroll).toHaveAttribute("tabindex", "0");
  await expect(inlineScroll).toHaveAttribute("role", "scrollbar");
  await expect(inlineScroll).toHaveAttribute("aria-label", "Scroll terminal columns horizontally");
  await expect(inlineScroll).toHaveAttribute("aria-hidden", "false");
  await expect(inlineScroll).toHaveAttribute("aria-valuemax", String(await tableWrap.evaluate((element) => element.scrollWidth - element.clientWidth)));

  const geometry = await page.evaluate(() => {
    const floating = document.querySelector("#terminalFloatingHScroll");
    const wrap = document.querySelector(".terminal-table").closest(".table-wrapper");
    const thumb = document.querySelector("#terminalFloatingHScrollThumb");
    const floatingRect = floating.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const scrollViewportRect = document.querySelector(".pw-device-content").getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    return {
      leftDelta: Math.abs(floatingRect.left - Math.max(0, scrollViewportRect.left, wrapRect.left)),
      widthDelta: Math.abs(floatingRect.width - (Math.min(innerWidth, scrollViewportRect.right, wrapRect.right) - Math.max(0, scrollViewportRect.left, wrapRect.left))),
      viewportBottomGap: scrollViewportRect.bottom - floatingRect.bottom,
      height: floatingRect.height,
      thumbWidth: thumbRect.width,
      trackWidth: floatingRect.width,
      maxScroll: wrap.scrollWidth - wrap.clientWidth
    };
  });
  expect(geometry.leftDelta).toBeLessThanOrEqual(1);
  expect(geometry.widthDelta).toBeLessThanOrEqual(1);
  expect(geometry.viewportBottomGap).toBeGreaterThanOrEqual(7);
  expect(geometry.viewportBottomGap).toBeLessThanOrEqual(9);
  expect(geometry.height).toBe(10);
  expect(geometry.thumbWidth).toBeGreaterThanOrEqual(48);
  expect(geometry.thumbWidth).toBeLessThan(geometry.trackWidth);
  expect(geometry.maxScroll).toBeGreaterThan(0);

  await floatingScroll.focus();
  await floatingScroll.press("End");
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBe(geometry.maxScroll);
  await expect(floatingScroll).toHaveAttribute("aria-valuenow", String(geometry.maxScroll));
  await floatingScroll.press("ArrowLeft");
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBe(geometry.maxScroll - 80);
  await floatingScroll.press("Home");
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBe(0);

  const trackBox = await floatingScroll.boundingBox();
  expect(trackBox).not.toBeNull();
  await page.mouse.click(trackBox.x + trackBox.width * 0.95, trackBox.y + trackBox.height / 2);
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBeGreaterThan(0);
  await floatingScroll.press("Home");

  await page.locator(".pw-device-content").evaluate((element) => {
    const pagination = element.querySelector(".terminal-pagination");
    const viewportBottom = element.getBoundingClientRect().bottom;
    const paginationTop = pagination.getBoundingClientRect().top;
    element.scrollTop += paginationTop - viewportBottom + 8;
  });
  await expect.poll(() => page.locator(".terminal-pagination").evaluate((pagination) => {
    const viewport = document.querySelector(".pw-device-content").getBoundingClientRect();
    return pagination.getBoundingClientRect().top < viewport.bottom;
  })).toBeTruthy();
  await expect(floatingScroll).not.toHaveClass(/show/);
  await expect(floatingScroll).toHaveAttribute("aria-hidden", "true");
  await expect(inlineScroll).toBeInViewport();

  await page.locator(".pw-device-content").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(floatingScroll).not.toHaveClass(/show/);
  await expect(floatingScroll).toHaveAttribute("aria-hidden", "true");
  await expect(inlineScroll).toBeInViewport();
  const inlineBox = await inlineScroll.boundingBox();
  expect(inlineBox).not.toBeNull();
  await page.mouse.click(inlineBox.x + inlineBox.width * 0.95, inlineBox.y + inlineBox.height / 2);
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBeGreaterThan(0);
  await inlineScroll.focus();
  await inlineScroll.press("End");
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBe(geometry.maxScroll);
  await expect(inlineScroll).toHaveAttribute("aria-valuenow", String(geometry.maxScroll));
  await inlineScroll.press("Home");
  await expect.poll(() => tableWrap.evaluate((element) => Math.round(element.scrollLeft))).toBe(0);
  await page.locator(".pw-device-content").evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(floatingScroll).toHaveClass(/show/);

  await page.locator('.tab[data-target="reseller-detail"]').click();
  await expect(floatingScroll).not.toHaveClass(/show/);
  await expect(floatingScroll).toHaveAttribute("aria-hidden", "true");
});

test("keeps the unified shell responsive and confines table overflow", async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 853, sidebar: "full" },
    { width: 1040, height: 900, sidebar: "compact" },
    { width: 390, height: 844, sidebar: "hidden" }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openTerminalPage(page);

    const layout = await page.evaluate(() => {
      const sidebar = document.querySelector(".pw-sidebar");
      const tableWrap = document.querySelector(".terminal-table").closest(".table-wrapper");
      const floatingScroll = document.querySelector("#terminalFloatingHScroll");
      const menuLabel = document.querySelector(".pw-menu-item.active .pw-menu-main span:last-child");
      const hierarchy = document.querySelector(".hierarchy-card");
      const hero = document.querySelector(".reseller-hero");
      const stat = document.querySelector(".terminal-stat-card");
      const title = document.querySelector(".workspace-title");
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        tableScrolls: tableWrap.scrollWidth > tableWrap.clientWidth,
        floatingScrollDisplay: getComputedStyle(floatingScroll).display,
        floatingScrollVisible: floatingScroll.classList.contains("show"),
        sidebarDisplay: getComputedStyle(sidebar).display,
        sidebarWidth: sidebar.getBoundingClientRect().width,
        menuLabelDisplay: getComputedStyle(menuLabel).display,
        hierarchyWidth: hierarchy.getBoundingClientRect().width,
        heroHeight: hero.getBoundingClientRect().height,
        statHeight: stat.getBoundingClientRect().height,
        titleFontSize: getComputedStyle(title).fontSize
      };
    });

    expect(layout.documentOverflow).toBeLessThanOrEqual(1);
    expect(layout.tableScrolls).toBeTruthy();
    if (viewport.sidebar === "full") {
      expect(layout.sidebarDisplay).not.toBe("none");
      expect(layout.sidebarWidth).toBeGreaterThan(200);
      expect(layout.menuLabelDisplay).not.toBe("none");
      expect(layout.hierarchyWidth).toBeGreaterThanOrEqual(318);
      expect(layout.hierarchyWidth).toBeLessThanOrEqual(322);
      expect(layout.heroHeight).toBeGreaterThanOrEqual(87);
      expect(layout.heroHeight).toBeLessThanOrEqual(89);
      expect(layout.statHeight).toBeLessThanOrEqual(72);
      expect(layout.titleFontSize).toBe("24px");
      expect(layout.floatingScrollDisplay).not.toBe("none");
      expect(layout.floatingScrollVisible).toBeTruthy();
    } else if (viewport.sidebar === "compact") {
      expect(layout.sidebarDisplay).not.toBe("none");
      expect(layout.sidebarWidth).toBeLessThan(100);
      expect(layout.menuLabelDisplay).toBe("none");
      expect(layout.floatingScrollDisplay).not.toBe("none");
      expect(layout.floatingScrollVisible).toBeTruthy();
    } else {
      expect(layout.sidebarDisplay).toBe("none");
      expect(layout.floatingScrollDisplay).toBe("none");
      expect(layout.floatingScrollVisible).toBeFalsy();
    }
  }
});
