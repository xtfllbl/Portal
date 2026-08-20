const { test, expect } = require("@playwright/test");

test("renders OPC availability with the shared terminal service dots", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 1920, height: 853 });
  await page.goto("/5.merchant_detail_iso.html", { waitUntil: "networkidle" });

  await expect(page.getByText("PAYMENT SERVICE", { exact: true })).toBeVisible();

  const statuses = page.locator(".device-grid-row [data-role='device-online-status']");
  const deviceRowCount = await page.locator(".device-grid-row").count();
  expect(deviceRowCount).toBeGreaterThan(0);
  await expect(statuses).toHaveCount(deviceRowCount);
  await expect(statuses.filter({ hasText: /Online|Offline/ })).toHaveCount(0);

  const online = page.locator(".device-grid-row .device-online-status.online");
  const offline = page.locator(".device-grid-row .device-online-status.offline");
  expect(await online.count()).toBeGreaterThan(0);
  expect(await offline.count()).toBeGreaterThan(0);

  const firstOnline = online.first();
  const firstOffline = offline.first();
  await expect(firstOnline).toHaveAttribute("data-service", "payment");
  await expect(firstOnline).toHaveAttribute("data-service-status", "Online");
  await expect(firstOnline).toHaveAttribute("title", "Online");
  await expect(firstOnline).toHaveAttribute("aria-label", "Payment Service: Online");
  await expect(firstOnline).toHaveAttribute("role", "img");
  await expect(firstOnline).toHaveCSS("width", "10px");
  await expect(firstOnline).toHaveCSS("height", "10px");
  await expect(firstOnline).toHaveCSS("background-color", "rgb(34, 197, 94)");
  await expect(firstOffline).toHaveCSS("background-color", "rgb(239, 68, 68)");

  const alignment = await page.locator(".device-grid-row > div:nth-child(6)").first().evaluate((cell) => ({
    justifySelf: getComputedStyle(cell).justifySelf,
    textAlign: getComputedStyle(cell).textAlign
  }));
  expect(alignment).toEqual({ justifySelf: "center", textAlign: "center" });
  expect(consoleErrors).toEqual([]);
});
