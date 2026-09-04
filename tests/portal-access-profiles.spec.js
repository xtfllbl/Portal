const { test, expect } = require("@playwright/test");

const profileKey = "paywizard.portalAccessProfile.v1";

async function setProfile(page, profile, route = "/12.transaction_list.html") {
  await page.goto("/12.transaction_list.html");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: profileKey, value: profile });
  await page.goto(route);
}

test("the user control switches and persists the active portal access profile", async ({ page }) => {
  await setProfile(page, "wizarpos", "/38.Merchant_onboard.html");
  await expect(page.locator(".pw-platform-profile-label")).toHaveText("WizarPOS Provider");

  await page.locator("[data-pw-profile-trigger]").click();
  await expect(page.locator("[data-pw-profile-menu]")).toBeVisible();
  await expect(page.locator("[data-pw-profile]")).toHaveText([
    "WizarPOS Providercheck",
    "Attended Providercheck",
    "Unattended Providercheck"
  ]);
  await page.locator('[data-pw-profile="attended"]').click();

  await expect(page).toHaveURL(/5\.merchant_manage_iso\.html$/);
  await expect(page.locator(".pw-platform-profile-label")).toHaveText("Attended Provider");
  expect(await page.evaluate((key) => localStorage.getItem(key), profileKey)).toBe("attended");
});

test("navigation follows the three-profile visibility matrix", async ({ page }) => {
  const cases = [
    {
      profile: "wizarpos",
      merchantItems: ["Contact", "Leads", "Onboarding", "Merchant List", "Analytics", "Split Rules"],
      deviceItems: ["Attended Terminals", "Unattended Terminals", "Card Readers"],
      settingsItems: ["SLA Alerts", "Alerts", "Branding", "Service Providers", "Payment Channels", "Application Parameters", "Products", "Product Map Templates"],
      partners: 1,
      prepaid: 1
    },
    {
      profile: "attended",
      merchantItems: ["Merchant List", "Analytics"],
      deviceItems: ["Attended Terminals"],
      settingsItems: ["Branding", "Service Providers", "Payment Channels", "Application Parameters", "Products", "Product Map Templates"],
      partners: 0,
      prepaid: 0
    },
    {
      profile: "unattended",
      merchantItems: ["Merchant List", "Analytics"],
      deviceItems: ["Unattended Terminals"],
      settingsItems: ["Alerts", "Branding", "Service Providers", "Payment Channels", "Application Parameters", "Products", "Product Map Templates"],
      partners: 0,
      prepaid: 1
    }
  ];

  for (const roleCase of cases) {
    await setProfile(page, roleCase.profile, "/5.merchant_manage_iso.html");
    await expect(page.locator('[data-pw-menu="merchants"] a')).toHaveText(roleCase.merchantItems);
    await expect(page.locator('[data-pw-menu="device"] a')).toHaveText(roleCase.deviceItems);
    await expect(page.locator('[data-pw-menu="settings"] a')).toHaveText(roleCase.settingsItems);
    await expect(page.locator('[data-pw-menu="device"] a').filter({ hasText: "Overview" })).toHaveCount(0);
    await expect(page.locator('[data-pw-menu-toggle="partners"]')).toHaveCount(roleCase.partners);
    await expect(page.locator('[data-pw-menu-toggle="prepaid"]')).toHaveCount(roleCase.prepaid);
    if (roleCase.profile === "wizarpos") {
      expect(await page.locator('[data-pw-menu="device"] a').evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual([
        "1.terminalmanage.html",
        "1.terminalmanage_nayax.html",
        "1.terminalmanage_CardReader.html"
      ]);
    }
  }
});

test("profile guards redirect restricted back-office pages to an allowed destination", async ({ page }) => {
  await setProfile(page, "attended", "/26.partner_information.html");
  await expect(page).toHaveURL(/5\.merchant_manage_iso\.html$/);

  await page.goto("/14.prepaid_card_list.html");
  await expect(page).toHaveURL(/2\.resellermerchantterminal\.html$/);

  await page.goto("/1.terminalmanage_nayax.html");
  await expect(page).toHaveURL(/1\.terminalmanage\.html$/);

  await page.goto("/32.sla_alert_rules.html");
  await expect(page).toHaveURL(/12\.transaction_list\.html$/);

  await page.goto("/39.customer_alerts.html");
  await expect(page).toHaveURL(/12\.transaction_list\.html$/);

  await page.goto("/8.splitbill.html");
  await expect(page).toHaveURL(/5\.merchant_manage_iso\.html$/);

  await setProfile(page, "unattended", "/1.terminalmanage_CardReader.html");
  await expect(page).toHaveURL(/1\.terminalmanage_nayax\.html$/);

  await page.goto("/32.sla_alert_rules.html");
  await expect(page).toHaveURL(/12\.transaction_list\.html$/);

  await page.goto("/39.customer_alerts.html");
  await expect(page).toHaveURL(/39\.customer_alerts\.html$/);

  await page.goto("/8.splitbill.html");
  await expect(page).toHaveURL(/5\.merchant_manage_iso\.html$/);
});

test("Agents and Merchants are independent persistent navigation groups", async ({ page }) => {
  await setProfile(page, "wizarpos", "/2.agent_list_iso.html");
  await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeVisible();

  await page.locator('[data-pw-menu-toggle="merchants"]').click();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
  await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
  await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
});

test("Transactions exposes only the system view and terminal scenarios allowed by the profile", async ({ page }) => {
  for (const roleCase of [
    { profile: "wizarpos", views: ["Attended", "Unattended"], groups: ["Attended Scenarios", "Unattended Scenarios"] },
    { profile: "attended", views: ["Attended"], groups: ["Attended Scenarios"] },
    { profile: "unattended", views: ["Unattended"], groups: ["Unattended Scenarios"] }
  ]) {
    await setProfile(page, roleCase.profile);
    await page.locator("#colsBtn").click();
    await expect(page.locator("#presetList .presetchip:not(.addview) .presetname")).toHaveText(roleCase.views);
    await page.locator("#colsBtn").click();
    await page.locator(".sn-icon-btn").first().click();
    await expect(page.locator(".sn-picker-title")).toHaveText(roleCase.groups);
  }
});

test("Transactions custom views are isolated by portal access profile", async ({ page }) => {
  await page.goto("/12.transaction_list.html");
  await page.evaluate(() => {
    const attended = [{ id: "attended-view", name: "Attended Ops", columns: [{ key: "processorTime", visible: true }] }];
    const unattended = [{ id: "unattended-view", name: "Kiosk Ops", columns: [{ key: "sn", visible: true }] }];
    localStorage.setItem("paywizard.transactionList.savedViews.attended", JSON.stringify(attended));
    localStorage.setItem("paywizard.transactionList.savedViews.unattended", JSON.stringify(unattended));
  });

  await setProfile(page, "attended");
  await page.locator("#colsBtn").click();
  await expect(page.locator("#presetList")).toContainText("Attended Ops");
  await expect(page.locator("#presetList")).not.toContainText("Kiosk Ops");

  await setProfile(page, "unattended");
  await page.locator("#colsBtn").click();
  await expect(page.locator("#presetList")).toContainText("Kiosk Ops");
  await expect(page.locator("#presetList")).not.toContainText("Attended Ops");
});

test("Device Management terminal links follow the active profile", async ({ page }) => {
  await setProfile(page, "wizarpos", "/2.resellermerchantterminal.html");
  await expect(page.locator(".terminal-table .sn-link").nth(0)).toHaveAttribute("href", "1.terminalmanage.html");
  await expect(page.locator(".terminal-table .sn-link").nth(1)).toHaveAttribute("href", "1.terminalmanage_nayax.html");

  await setProfile(page, "attended", "/2.resellermerchantterminal.html");
  expect(await page.locator(".terminal-table .sn-link").evaluateAll((links) => new Set(links.map((link) => link.getAttribute("href"))).size)).toBe(1);
  await expect(page.locator(".terminal-table .sn-link").first()).toHaveAttribute("href", "1.terminalmanage.html");

  await setProfile(page, "unattended", "/2.resellermerchantterminal.html");
  expect(await page.locator(".terminal-table .sn-link").evaluateAll((links) => new Set(links.map((link) => link.getAttribute("href"))).size)).toBe(1);
  await expect(page.locator(".terminal-table .sn-link").first()).toHaveAttribute("href", "1.terminalmanage_nayax.html");
});
