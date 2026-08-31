const fs = require("fs");
const { test, expect } = require("@playwright/test");

const excludedPages = [
  "25.merchant_lead.html",
  "27.INTL_PSP_merchant_lead.html",
  "30.landing_page_requirements.html",
  "31.prepaid_card_requirements.html",
  "33.INTL_PSP_merchant_lead_elavon.html",
  "38.Merchant_onboard_elavon_public.html",
  "38.Merchant_onboard_nuvei_public.html",
  "38.Merchant_onboarding_progress.html"
];

const includedPages = fs.readdirSync(process.cwd())
  .filter((file) => /^(?:[1-9]|40\.)/.test(file) && file.endsWith(".html") && !excludedPages.includes(file))
  .sort();

const routeFor = (file) => file === "28.UPT_merchant_lead_detail.html"
  ? `/${file}?leadProcessId=00000439`
  : `/${file}`;

test("all numbered back-office pages mount one shared platform shell", async ({ page }) => {
  expect(includedPages).toHaveLength(47);
  await page.setViewportSize({ width: 1440, height: 900 });
  let browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  for (const file of includedPages) {
    browserErrors = [];
    await page.goto(routeFor(file));
    await expect(page.locator(".pw-platform-frame"), file).toHaveCount(1);
    await expect(page.locator(".pw-platform-sidebar"), file).toHaveCount(1);
    await expect(page.locator(".pw-platform-topbar"), file).toHaveCount(1);
    await expect(page.locator(".pw-platform-content"), file).toHaveCount(1);
    await expect(page.locator('.pw-platform-brand img[alt="PAYwizard"]'), file).toHaveCount(1);
    await expect(page.locator(".pw-platform-brand .brand-environment"), file).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), file).toBeLessThanOrEqual(1);
    expect(browserErrors, file).toEqual([]);
  }
});

test("shared navigation uses real destinations and the agreed module entries", async ({ page }) => {
  await page.goto("/38.Merchant_onboard.html");
  const links = await page.locator(".pw-platform-sidebar a").evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")));
  expect(links).not.toContain("#");
  for (const href of links) {
    const target = href.split("?")[0];
    expect(fs.existsSync(target), href).toBeTruthy();
  }

  await expect(page.locator('.pw-platform-menu-link[href="2.resellermerchantterminal.html"]')).toHaveText(/Device Management/);
  await expect(page.locator('[data-pw-menu="merchants"]')).toContainText("Split Rules");
  await expect(page.locator('[data-pw-menu="settings"]')).toContainText("SLA Alerts");
  await expect(page.locator('[data-pw-menu="settings"]')).toContainText("Alerts");
  await expect(page.locator('.pw-platform-disabled[aria-disabled="true"]')).toHaveCount(4);
});

test("mobile navigation opens as a drawer without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/12.transaction_list.html", "/29.INTL_PSP_merchant_lead_list.html", "/2.resellermerchantterminal.html", "/39.customer_alerts.html"]) {
    await page.goto(route);
    await expect(page.locator(".pw-platform-sidebar")).toBeHidden();
    await page.locator(".pw-platform-mobile-menu").click();
    await expect(page.locator(".pw-platform-sidebar")).toBeVisible();
    await expect(page.locator(".pw-platform-drawer-overlay")).toBeVisible();
    await page.locator(".pw-platform-drawer-overlay").click({ position: { x: 380, y: 20 } });
    await expect(page.locator(".pw-platform-sidebar")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
  }
});

test("notification action shares unread state and opens Notifications", async ({ page }) => {
  await page.goto("/38.Merchant_onboard.html");
  await page.evaluate(() => {
    localStorage.removeItem("paywizard.notifications.v1");
    localStorage.removeItem("paywizard.customerAlerts.v1");
  });
  await page.reload();
  await expect(page.locator("[data-shell-notification-count]")).toHaveText("61");
  await page.locator('.pw-platform-round-btn[aria-label="Notifications"]').click();
  await expect(page).toHaveURL(/40\.notifications\.html$/);
  await expect(page.locator(".pw-platform-breadcrumb strong")).toHaveText("Notifications");
});

test("public and requirement pages remain outside the platform shell", async ({ page }) => {
  for (const file of excludedPages) {
    const source = fs.readFileSync(file, "utf8");
    expect(source, file).not.toContain("platform-admin-shell");
    await page.goto(`/${file}`);
    await expect(page.locator(".pw-platform-frame"), file).toHaveCount(0);
  }
});
