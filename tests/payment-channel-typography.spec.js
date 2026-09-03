const { test, expect } = require("@playwright/test");

test("Payment Channel Setting uses the shared typography and compact layout", async ({ page }) => {
  await page.goto("/23.payment_channel_setting.html");

  await expect(page.locator("body")).toHaveCSS("font-family", /Poppins/);
  await expect(page.locator(".page-title")).toHaveCSS("font-size", "25px");
  await expect(page.locator(".page-title")).toHaveCSS("font-weight", "600");

  const sectionTitles = page.locator(".section-title");
  await expect(sectionTitles).toHaveCount(3);
  for (const title of await sectionTitles.all()) {
    await expect(title).toHaveCSS("font-size", "15px");
    await expect(title).toHaveCSS("font-weight", "600");
  }

  await expect(page.locator("thead th").first()).toHaveCSS("font-size", "12px");
  await expect(page.locator("thead th").first()).toHaveCSS("font-weight", "700");
  await expect(page.locator(".section-note")).toHaveCount(0);

  await expect(page.locator(".store-summary")).toHaveCSS("min-height", "64px");
  await expect(page.locator(".store-summary")).toHaveCSS("margin-bottom", "16px");
  await expect(page.locator(".channel-card").first()).toHaveCSS("padding", "16px");
  await expect(page.locator(".section-head").first()).toHaveCSS("padding-bottom", "12px");
  await expect(page.locator(".section-head").first()).toHaveCSS("margin-bottom", "12px");
});
