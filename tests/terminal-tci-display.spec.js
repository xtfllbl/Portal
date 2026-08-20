const { test, expect } = require("@playwright/test");

test("shows each transaction terminal TCI in the SN detail header", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/12.transaction_list.html");

  const firstTerminal = page.locator('.sn-main-link[data-sn="PWKIOSK03260427"]');
  await firstTerminal.hover();
  const popover = page.locator(".sn-detail-pop.show");
  const tci = popover.locator('[data-role="terminal-tci"]');
  await expect(tci).toHaveText(/^TC\d{8}$/);
  await expect(tci.locator("span")).toHaveCount(0);
  await expect(popover).toBeVisible();
  await expect(tci.locator("b")).toHaveText("TC26042703");

  const desktopGeometry = await popover.evaluate((element) => {
    const header = element.querySelector(".sn-detail-head").getBoundingClientRect();
    const title = element.querySelector(".sn-detail-title").getBoundingClientRect();
    const value = element.querySelector(".sn-detail-tci").getBoundingClientRect();
    return {
      valueRightGap: Math.round(header.right - value.right),
      separated: value.left >= title.right,
      overflow: element.scrollWidth - element.clientWidth
    };
  });
  expect(desktopGeometry.valueRightGap).toBeLessThanOrEqual(1);
  expect(desktopGeometry.separated).toBe(true);
  expect(desktopGeometry.overflow).toBe(0);

  await page.locator('.sn-main-link[data-sn="PWKIOSK04260427"]').hover();
  await expect(tci.locator("b")).toHaveText("TC26042704");
  expect(consoleErrors).toEqual([]);
});

test("keeps the SN detail TCI usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/12.transaction_list.html");
  await page.locator('.sn-main-link[data-sn="PWKIOSK03260427"]').dispatchEvent("mouseover");

  const popover = page.locator(".sn-detail-pop.show");
  await expect(popover.locator('[data-role="terminal-tci"] b')).toHaveText("TC26042703");
  const geometry = await popover.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const title = element.querySelector(".sn-detail-title").getBoundingClientRect();
    const tci = element.querySelector(".sn-detail-tci").getBoundingClientRect();
    return {
      insideViewport: bounds.left >= 0 && bounds.right <= window.innerWidth,
      noOverlap: title.bottom <= tci.top || title.right <= tci.left,
      overflow: element.scrollWidth - element.clientWidth
    };
  });
  expect(geometry.insideViewport).toBe(true);
  expect(geometry.noOverlap).toBe(true);
  expect(geometry.overflow).toBe(0);
});

test("shows one TCI across the Nayax banner, details and transaction link", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/1.terminalmanage_nayax.html?tab=basic&sn=WP6267UQ36002376&tci=TC12345678");
  await expect(page.locator("#bannerTci")).toHaveText("TC12345678");
  await expect(page.locator("#detailsTci")).toHaveText("TC12345678");
  await expect(page.locator("#bannerTid")).toHaveText("UZN10E08");
  const transactionHref = await page.locator("#viewTerminalTransactionsLink").getAttribute("href");
  expect(new URL(transactionHref, "http://example.test").searchParams.get("tci")).toBe("TC12345678");

  await page.goto("/1.terminalmanage_nayax.html?tab=basic&sn=WP6267UQ36002376");
  await expect(page.locator("#bannerTci")).toHaveText("TC36002376");
  await expect(page.locator("#detailsTci")).toHaveText("TC36002376");

  await page.goto("/1.terminalmanage_nayax.html?tab=basic&sn=SECOND-SN");
  await expect(page.locator("#bannerTci")).toHaveText("-");
  await expect(page.locator("#detailsTci")).toHaveText("-");
  expect(consoleErrors).toEqual([]);
});
