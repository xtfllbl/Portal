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
    "WizarPOS Providercheck", "Full-Service Providercheck", "Billing-only Merchantcheck",
    "Unattended Providercheck", "Unattended Merchantcheck", "Unattended Storecheck",
    "Attended Providercheck", "Attended Merchantcheck", "Attended Storecheck"
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
      merchantItems: ["Contact", "Leads", "Onboarding", "Merchant List", "Analytics"],
      deviceItems: ["Attended Terminals", "Unattended Terminals", "Card Readers"],
      settingsItems: ["Alerts", "Branding", "Products", "Product Map Templates"],
      partners: 1,
      prepaid: 1
    },
    {
      profile: "attended",
      merchantItems: ["Merchant List", "Analytics"],
      deviceItems: ["Attended Terminals"],
      settingsItems: ["Branding"],
      partners: 0,
      prepaid: 0
    },
    {
      profile: "unattended",
      merchantItems: ["Merchant List", "Analytics"],
      deviceItems: ["Unattended Terminals"],
      settingsItems: ["Alerts", "Branding", "Products", "Product Map Templates"],
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

for (const width of [1440, 390]) {
  test(`product settings access follows terminal profiles at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const routes = ["35.product_management.html", "36.product_map_templates.html"];
    for (const profile of ["attended", "attended-merchant", "attended-store"]) {
      await setProfile(page, profile);
      for (const route of routes) {
        await expect(page.locator(`.pw-platform-nav a[href="${route}"]`)).toHaveCount(0);
        await page.goto("/" + route);
        await expect(page).toHaveURL(/12\.transaction_list\.html$/);
        await setProfile(page, "full-service", "/" + route);
        await page.locator("[data-pw-profile-trigger]").click();
        await page.locator(`[data-pw-profile="${profile}"]`).click();
        await expect(page).toHaveURL(/12\.transaction_list\.html$/);
      }
    }
    for (const profile of ["wizarpos", "full-service", "unattended"]) {
      await setProfile(page, profile);
      for (const route of routes) {
        await expect(page.locator(`.pw-platform-nav a[href="${route}"]`)).toHaveCount(1);
        await page.goto("/" + route);
        await expect(page).toHaveURL(new RegExp(route.replaceAll(".", "\\.") + "$"));
      }
    }
  });
}

test("profile guards redirect restricted back-office pages to an allowed destination", async ({ page }) => {
  await setProfile(page, "wizarpos", "/8.splitbill.html");
  await expect(page).toHaveURL(/5\.merchant_manage_iso\.html$/);
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

test("Agents and Merchants follow the current navigation accordion", async ({ page }) => {
  await setProfile(page, "wizarpos", "/2.agent_list_iso.html");
  await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
  await page.locator('[data-pw-menu-toggle="merchants"]').click();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeVisible();

  await page.locator('[data-pw-menu-toggle="merchants"]').click();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
  await expect(page.locator('[data-pw-menu="agents"]')).toBeHidden();
  await page.reload();
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
  await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
});

test("Transactions exposes only the system view and terminal scenarios allowed by the profile", async ({ page }) => {
  for (const roleCase of [
    { profile: "full-service", views: ["Attended", "Unattended"], groups: ["Attended Scenarios", "Unattended Scenarios"] },
    { profile: "wizarpos", views: ["Attended", "Unattended"], groups: ["Attended Scenarios", "Unattended Scenarios"] },
    { profile: "attended", views: ["Attended"], groups: ["Attended Scenarios"] },
    { profile: "unattended", views: ["Unattended"], groups: ["Unattended Scenarios"] },
    { profile: "attended-merchant", views: ["Attended"], groups: ["Attended Scenarios"] },
    { profile: "unattended-merchant", views: ["Unattended"], groups: ["Unattended Scenarios"] },
    { profile: "attended-store", views: ["Attended"], groups: ["Attended Scenarios"] },
    { profile: "unattended-store", views: ["Unattended"], groups: ["Unattended Scenarios"] }
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

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`merchant menus and role switcher at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const profile of ["attended-merchant", "unattended-merchant"]) {
      await setProfile(page, profile);
      const nav = page.locator(".pw-platform-sidebar");
      expect(await nav.locator("[data-pw-nav-label]").evaluateAll(nodes => nodes.map(node => node.dataset.pwNavLabel))).toEqual([
        "Dashboard", "Transactions", "Merchant", "Billing & Payments", "Device Management", "Remote Diagnostic", "User Management", "Settings", "Tickets", "Developer Center"
      ]);
      await expect(page.locator('[data-pw-menu="device"] a')).toHaveText([profile === "attended-merchant" ? "Attended Terminals" : "Unattended Terminals"]);
      await expect(page.locator('[data-pw-menu="users"] .pw-platform-sub-item')).toHaveText(["User List", "Role Permissions"]);
      await expect(page.locator('[data-pw-menu="settings"] .pw-platform-sub-item')).toHaveText(["Branding"]);
      await expect(page.locator('[data-pw-menu="developer"] .pw-platform-sub-item')).toHaveText(["Document Center"]);
      await expect(nav.locator('[data-pw-nav-label="Merchant"]')).toHaveAttribute("href", "5.merchant_detail_iso.html");
      if (viewport.width < 761) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      for (const group of ["users", "settings", "developer"]) await page.locator(`[data-pw-menu-toggle="${group}"]`).click();
      await expect(page.locator('[data-pw-menu="developer"]')).toBeVisible();
      await page.screenshot({ path: `artifacts/${profile}-menus-${viewport.width}.png`, fullPage: true });
      if (viewport.width < 761) await page.getByRole("button", { name: "Close navigation", exact: true }).click({ position: { x: viewport.width - 5, y: 100 } });
      await page.locator("[data-pw-profile-trigger]").click();
      const heights = await page.locator("[data-pw-profile]").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      expect(heights).toHaveLength(9);
      expect(new Set(heights).size).toBe(1);
      await expect(page.locator('[data-pw-profile="billing-merchant"]')).toBeInViewport();
      await page.locator('[data-pw-profile="billing-merchant"]').click();
      await expect(page).toHaveURL(/42\.billing_payments\.html$/);
      await expect(nav.locator('[data-pw-nav-label]')).toHaveCount(1);
      await expect(nav.locator('[data-pw-nav-label]')).toHaveText("receipt_longBilling & Payments");
      await page.locator("[data-pw-profile-trigger]").click();
      await page.locator('[data-pw-profile="wizarpos"]').click();
      await expect(page).toHaveURL(/12\.transaction_list\.html$/);
    }
  });
}

test("billing and merchant direct links obey role visibility", async ({ page }) => {
  for (const profile of ["wizarpos", "full-service", "attended", "unattended"]) {
    await setProfile(page, profile, "/42.billing_payments.html");
    await expect(page).toHaveURL(/12\.transaction_list\.html$/);
    await expect(page.locator('[data-pw-nav-label="Billing & Payments"]')).toHaveCount(0);
    await page.goto("/41.billing_setup.html");
    await expect(page).toHaveURL(profile === "wizarpos" ? /41\.billing_setup\.html$/ : /12\.transaction_list\.html$/);
  }
  for (const profile of ["attended-merchant", "unattended-merchant"]) {
    await setProfile(page, profile, "/41.billing_setup.html");
    await expect(page).toHaveURL(/12\.transaction_list\.html$/);
    await page.goto("/5.merchant_manage_iso.html");
    await expect(page).toHaveURL(/5\.merchant_detail_iso\.html$/);
    for (const route of ["2.agent_list_iso.html", "35.product_management.html", "14.prepaid_card_list.html"]) {
      await page.goto("/" + route);
      await expect(page).toHaveURL(/12\.transaction_list\.html$/);
    }
    await page.goto(profile === "attended-merchant" ? "/1.terminalmanage_nayax.html" : "/1.terminalmanage.html");
    await expect(page).toHaveURL(profile === "attended-merchant" ? /1\.terminalmanage\.html$/ : /1\.terminalmanage_nayax\.html$/);
  }
  await setProfile(page, "billing-merchant");
  for (const route of ["41.billing_setup.html", "5.merchant_detail_iso.html", "40.notifications.html", "1.terminalmanage.html"]) {
    await page.goto("/" + route);
    await expect(page).toHaveURL(/42\.billing_payments\.html$/);
  }
});

for (const width of [1440, 390]) {
  test(`store role navigation and grouped picker at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const profile of ["attended-store", "unattended-store"]) {
      await setProfile(page, profile);
      expect(await page.locator('.pw-platform-nav [data-pw-nav-label]').evaluateAll(nodes => nodes.map(n => n.dataset.pwNavLabel))).toEqual(["Dashboard", "Transactions", "Device Management", "User Management"]);
      await expect(page.locator('[data-pw-menu="users"] .pw-platform-sub-item')).toHaveText(["User List", "Role Permissions"]);
      await expect(page.locator('[data-pw-menu="device"] a')).toHaveText([profile === "attended-store" ? "Attended Terminals" : "Unattended Terminals"]);
      await page.goto('/2.resellermerchantterminal.html');
      await expect(page.locator('.terminal-table .sn-link').first()).toHaveAttribute('href', profile === "attended-store" ? "1.terminalmanage.html" : "1.terminalmanage_nayax.html");
      for (const target of ['41.billing_setup.html', '42.billing_payments.html', '5.merchant_detail_iso.html', '13.remote_control.html', '20.provider_custom_email_service.html', '2.agent_list_iso.html']) {
        await page.goto('/' + target);
        await expect(page).toHaveURL(/12\.transaction_list\.html$/);
      }
      await page.goto(profile === 'attended-store' ? '/1.terminalmanage_nayax.html' : '/1.terminalmanage.html');
      await expect(page).toHaveURL(profile === 'attended-store' ? /1\.terminalmanage\.html$/ : /1\.terminalmanage_nayax\.html$/);
    }
    await page.locator('[data-pw-profile-trigger]').click();
    const grid = page.locator('.pw-platform-profile-grid');
    expect(await grid.evaluate(n => getComputedStyle(n).gridTemplateColumns.split(' ').length)).toBe(width === 1440 ? 3 : 1);
    const menu = page.locator('[data-pw-profile-menu]');
    const bounds = await menu.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    const bell = await page.getByRole('link', { name: 'Notifications', exact: true }).boundingBox();
    const trigger = await page.locator('[data-pw-profile-trigger]').boundingBox();
    expect(bell.x + bell.width).toBeLessThanOrEqual(trigger.x);
    expect(new Set(await page.locator('[data-pw-profile]').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height))).size).toBe(1);
    await page.screenshot({ path: `artifacts/role-picker-${width}.png` });
    await page.locator('[data-pw-profile="attended-store"]').click();
    await expect(page.locator('.pw-platform-profile-label')).toHaveText('Attended Store');
    await page.reload();
    await expect(page.locator('.pw-platform-profile-label')).toHaveText('Attended Store');
  });
}


test("Full-Service Provider combines ordinary provider menus without WizarPOS privileges", async ({ page }) => {
  const menus = async () => page.locator('.pw-platform-nav a[href], .pw-platform-nav [data-pw-nav-label]').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('href') || n.dataset.pwNavLabel))].sort());
  await setProfile(page, 'attended');
  const attended = await menus();
  await setProfile(page, 'unattended');
  const unattended = await menus();
  await setProfile(page, 'full-service');
  expect(await menus()).toEqual([...new Set([...attended, ...unattended])].sort());
  await expect(page.locator('[data-pw-menu="device"] a')).toHaveText(['Attended Terminals', 'Unattended Terminals']);
  for (const path of ['1.terminalmanage.html', '1.terminalmanage_nayax.html', '37.pick_list.html', '14.prepaid_card_list.html', '39.customer_alerts.html']) {
    await page.goto('/' + path);
    expect(new URL(page.url()).pathname).toBe('/' + path);
  }
  for (const path of ['1.terminalmanage_CardReader.html', '34.card_reader_management.html', '32.sla_alert_rules.html', '26.partner_information.html', '7.merchant_contact.html', '29.INTL_PSP_merchant_lead_list.html', '38.Merchant_onboard.html', '8.splitbill.html']) {
    await page.goto('/' + path);
    await expect(page).not.toHaveURL(new RegExp(path.replaceAll('.', '\\.')));
    await expect(page.locator('.pw-platform-profile-label')).toHaveText('Full-Service Provider');
  }
  await page.goto('/2.resellermerchantterminal.html');
  await expect(page.locator('.terminal-table .sn-link').nth(0)).toHaveAttribute('href', '1.terminalmanage.html');
  await expect(page.locator('.terminal-table .sn-link').nth(1)).toHaveAttribute('href', '1.terminalmanage_nayax.html');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('[data-pw-profile-trigger]').click();
    await expect(page.locator('.pw-platform-profile-column').first().locator('.pw-profile-option-label')).toHaveText(['WizarPOS Provider', 'Full-Service Provider', 'Billing-only Merchant']);
    const option = page.locator('[data-pw-profile="full-service"]');
    await expect(option).toHaveAttribute('aria-checked', 'true');
    await page.screenshot({ path: `artifacts/full-service-provider-${width}.png` });
    await page.locator('[data-pw-profile="wizarpos"]').click();
    await page.locator('[data-pw-profile-trigger]').click();
    await option.click();
    await page.reload();
    await expect(page.locator('.pw-platform-profile-label')).toHaveText('Full-Service Provider');
  }
});
