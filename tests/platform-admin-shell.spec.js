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

const panelPages = new Set([
  "2.agent_list_iso.html",
  "7.merchant_contact.html",
  "8.splitbill.html",
  "12.transaction_list.html",
  "20.provider_custom_email_service.html",
  "21.service_provider.html",
  "22.sp_payment_channel_setting.html",
  "23.payment_channel_setting.html",
  "23.sp_merchant_list.html",
  "24.maintain_terminal_log.html",
  "28.UPT_merchant_lead_detail.html",
  "29.INTL_PSP_merchant_lead_list.html",
  "35.product_management.html",
  "36.product_map_templates.html",
  "37.pick_list.html",
  "38.Merchant_onboard.html",
  "39.customer_alerts.html",
  "40.notifications.html"
]);

test("keeps the legacy page hidden until the shared shell is ready", async ({ page }) => {
  let releaseShell;
  let markShellRequested;
  const shellReleased = new Promise((resolve) => { releaseShell = resolve; });
  const shellRequested = new Promise((resolve) => { markShellRequested = resolve; });

  await page.route("**/scripts/platform-admin-shell.js", async (route) => {
    markShellRequested();
    await shellReleased;
    await route.continue();
  });

  const navigation = page.goto("/1.terminalmanage_nayax.html");
  await shellRequested;
  await page.locator("body > .top-header").waitFor({ state: "attached" });

  expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe("hidden");

  releaseShell();
  await navigation;
  await expect(page.locator(".pw-platform-frame")).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe("visible");
});

test("reveals the original page if the shared shell cannot load", async ({ page }) => {
  await page.route("**/scripts/platform-admin-shell.js", (route) => route.abort());
  await page.goto("/1.terminalmanage_nayax.html");

  await expect.poll(
    () => page.evaluate(() => getComputedStyle(document.body).visibility),
    { timeout: 5000 }
  ).toBe("visible");
  await expect(page.locator("body > .top-header")).toBeVisible();
});

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
    await expect(page.locator('.pw-platform-brand img[alt="PAYwizard"]'), file).toHaveAttribute("src", "assets/paywizard-logo-sidebar.png");
    await expect(page.locator(".pw-platform-brand .brand-environment"), file).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), file).toBeLessThanOrEqual(1);
    expect(browserErrors, file).toEqual([]);
  }
});

test("shared sidebar logo is compact, centered, and keeps its natural ratio", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900, logoWidth: 188 },
    { width: 1024, height: 768, logoWidth: 56 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/38.Merchant_onboard.html");

    const metrics = await page.locator(".pw-platform-brand").evaluate((brand) => {
      const image = brand.querySelector("img");
      const brandBox = brand.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      return {
        brandCenter: brandBox.left + brandBox.width / 2,
        imageCenter: imageBox.left + imageBox.width / 2,
        imageWidth: imageBox.width,
        imageRatio: imageBox.width / imageBox.height,
        naturalRatio: image.naturalWidth / image.naturalHeight
      };
    });

    expect(Math.round(metrics.imageWidth)).toBe(viewport.logoWidth);
    expect(Math.abs(metrics.brandCenter - metrics.imageCenter)).toBeLessThanOrEqual(1);
    expect(metrics.imageRatio).toBeCloseTo(362 / 106, 2);
    expect(metrics.imageRatio).toBeCloseTo(metrics.naturalRatio, 2);
  }
});

test("desktop sidebar collapses with the workspace and persists across pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/2.agent_list_iso.html");
  await page.evaluate(() => localStorage.removeItem("paywizard.platformSidebarCollapsed.v1"));
  await page.reload();

  const before = await page.evaluate(() => {
    const sidebar = document.querySelector(".pw-platform-sidebar").getBoundingClientRect();
    const topbar = document.querySelector(".pw-platform-topbar").getBoundingClientRect();
    const content = document.querySelector(".pw-platform-content-host").getBoundingClientRect();
    return { sidebarWidth: sidebar.width, topbarLeft: topbar.left, contentLeft: content.left, contentWidth: content.width };
  });

  const toggle = page.locator(".pw-platform-sidebar-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Collapse navigation");
  const toggleBox = await toggle.boundingBox();
  expect(toggleBox.width).toBeGreaterThanOrEqual(44);
  expect(toggleBox.height).toBeGreaterThanOrEqual(44);
  await toggle.click();

  await expect(page.locator(".pw-platform-frame")).toHaveClass(/pw-sidebar-collapsed/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-label", "Expand navigation");
  await expect.poll(() => page.locator(".pw-platform-sidebar").evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(74);

  const after = await page.evaluate(() => {
    const sidebar = document.querySelector(".pw-platform-sidebar").getBoundingClientRect();
    const topbar = document.querySelector(".pw-platform-topbar").getBoundingClientRect();
    const content = document.querySelector(".pw-platform-content-host").getBoundingClientRect();
    return {
      sidebarWidth: sidebar.width,
      topbarLeft: topbar.left,
      contentLeft: content.left,
      contentWidth: content.width,
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  });

  expect(Math.round(before.sidebarWidth)).toBe(264);
  expect(after.sidebarWidth).toBe(74);
  expect(Math.round(before.topbarLeft - after.topbarLeft)).toBe(190);
  expect(Math.round(before.contentLeft - after.contentLeft)).toBe(190);
  expect(Math.round(after.contentWidth - before.contentWidth)).toBe(190);
  expect(Math.abs(after.topbarLeft - after.contentLeft)).toBeLessThanOrEqual(1);
  expect(after.overflow).toBeLessThanOrEqual(1);
  await expect(page.locator(".pw-platform-brand")).toBeHidden();
  await expect(page.locator(".pw-platform-menu-label").first()).toBeHidden();
  await expect(page.locator('[data-pw-menu="agents"]')).toBeHidden();
  await expect(page.locator('[data-pw-menu-toggle="agents"]')).toHaveClass(/active/);
  await expect(page.locator('[data-pw-menu-toggle="agents"]')).toHaveAttribute("title", "Agents");

  await page.goto("/12.transaction_list.html");
  await expect(page.locator(".pw-platform-frame")).toHaveClass(/pw-sidebar-collapsed/);
  await expect(page.locator('.pw-platform-menu-item[href="12.transaction_list.html"]')).toHaveClass(/active/);

  for (const route of ["/1.terminalmanage.html", "/1.terminalmanage_CardReader.html", "/1.terminalmanage_nayax.html"]) {
    await page.goto(route);
    await expect(page.locator(".pw-platform-frame"), route).toHaveClass(/pw-sidebar-collapsed/);
    await expect.poll(() => page.locator(".pw-platform-sidebar").evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(74);
    const alignment = await page.evaluate(() => ({
      topbarLeft: document.querySelector(".pw-platform-topbar").getBoundingClientRect().left,
      contentLeft: document.querySelector(".pw-platform-content-host").getBoundingClientRect().left,
      overflow: document.documentElement.scrollWidth - innerWidth
    }));
    expect(Math.abs(alignment.topbarLeft - alignment.contentLeft), route).toBeLessThanOrEqual(1);
    expect(alignment.overflow, route).toBeLessThanOrEqual(1);
  }

  await Promise.all([
    page.waitForURL(/2\.agent_list_iso\.html$/),
    page.locator('[data-pw-menu-toggle="agents"]').click()
  ]);
  await expect(page.locator(".pw-platform-frame")).toHaveClass(/pw-sidebar-collapsed/);
  await expect(page.locator('[data-pw-menu-toggle="agents"]')).toHaveClass(/active/);
});

test("collapsed groups navigate to the first available destination for each access profile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const cases = [
    ["wizarpos", "agents", "2.agent_list_iso.html"],
    ["wizarpos", "merchants", "7.merchant_contact.html"],
    ["wizarpos", "settings", "32.sla_alert_rules.html"],
    ["wizarpos", "device", "2.resellermerchantterminal.html"],
    ["attended", "merchants", "5.merchant_manage_iso.html"],
    ["attended", "settings", "20.provider_custom_email_service.html"],
    ["attended", "device", "2.resellermerchantterminal.html"],
    ["unattended", "merchants", "5.merchant_manage_iso.html"],
    ["unattended", "settings", "39.customer_alerts.html"],
    ["unattended", "device", "2.resellermerchantterminal.html"]
  ];

  for (const [profile, group, destination] of cases) {
    await page.goto("/10.customer_app_upload_manage.html");
    await page.evaluate(({ profile }) => {
      localStorage.setItem("paywizard.portalAccessProfile.v1", profile);
      localStorage.setItem("paywizard.platformSidebarCollapsed.v1", "true");
    }, { profile });
    await page.reload();
    const selector = group === "device"
      ? '.pw-platform-menu-row .pw-platform-menu-link'
      : `[data-pw-menu-toggle="${group}"]`;
    await Promise.all([
      page.waitForURL(new RegExp(`${destination.replaceAll(".", "\\.")}$`)),
      page.locator(selector).click()
    ]);
    await expect(page.locator(".pw-platform-frame"), `${profile}:${group}`).toHaveClass(/pw-sidebar-collapsed/);
    await expect.poll(() => page.locator(".pw-platform-sidebar").evaluate((element) => Math.round(element.getBoundingClientRect().width)), {
      message: `${profile}:${group} keeps the compact 74px sidebar after navigation`
    }).toBe(74);
  }
});

test("collapsed group without an available destination expands to show its disabled items", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/10.customer_app_upload_manage.html");
  await page.evaluate(() => localStorage.setItem("paywizard.platformSidebarCollapsed.v1", "true"));
  await page.reload();

  await page.locator('[data-pw-menu-toggle="users"]').click();

  await expect(page).toHaveURL(/10\.customer_app_upload_manage\.html$/);
  await expect(page.locator(".pw-platform-frame")).not.toHaveClass(/pw-sidebar-collapsed/);
  await expect(page.locator('[data-pw-menu="users"]')).toBeVisible();
  await expect(page.locator('[data-pw-menu="users"] .pw-platform-unavailable-sub')).toHaveCount(3);
});

test("collapsed sidebar reveal control keeps a stable pointer target", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/10.customer_app_upload_manage.html");
  await page.evaluate(() => localStorage.setItem("paywizard.platformSidebarCollapsed.v1", "true"));
  await page.reload();

  const toggle = page.locator(".pw-platform-sidebar-toggle");
  const toggleBox = await toggle.boundingBox();
  expect(toggleBox.width).toBeGreaterThanOrEqual(44);
  expect(toggleBox.height).toBeGreaterThanOrEqual(44);

  const centerIsClickable = await toggle.evaluate((button) => {
    const box = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
  });
  expect(centerIsClickable).toBeTruthy();

  await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
  await expect(toggle.locator(".pw-platform-sidebar-toggle-icon")).toHaveCSS("opacity", "1");
  await page.mouse.click(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
  await expect(page.locator(".pw-platform-frame")).not.toHaveClass(/pw-sidebar-collapsed/);
});

test("expanded sidebar toggle only appears near its edge sensor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/2.agent_list_iso.html");
  await page.evaluate(() => localStorage.setItem("paywizard.platformSidebarCollapsed.v1", "false"));
  await page.reload();

  const toggle = page.locator(".pw-platform-sidebar-toggle");
  const icon = toggle.locator(".pw-platform-sidebar-toggle-icon");
  const toggleBox = await toggle.boundingBox();

  await page.mouse.move(900, 200);
  await expect(icon).toHaveCSS("opacity", "0");

  await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
  await expect(icon).toHaveCSS("opacity", "1");

  await page.mouse.move(900, 200);
  await expect(icon).toHaveCSS("opacity", "0");
});

test("Alerts sidebar toggle keeps a visible white chevron", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/39.customer_alerts.html");

  const icon = page.locator(".pw-platform-sidebar-toggle-icon");
  await expect(icon).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(icon).toHaveCSS("display", "grid");
  await expect(icon).toHaveCSS("place-items", "center");
});

test("saved desktop collapse state does not change tablet or mobile navigation rules", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("paywizard.platformSidebarCollapsed.v1", "true"));

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/2.agent_list_iso.html");
  await expect(page.locator(".pw-platform-sidebar")).toHaveCSS("width", "74px");
  await expect(page.locator(".pw-platform-sidebar-toggle")).toBeHidden();
  await expect(page.locator(".pw-platform-brand")).toBeVisible();
  await expect(page.locator('[data-pw-menu-toggle="agents"]')).toHaveAttribute("title", "Agents");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".pw-platform-sidebar")).toBeHidden();
  await page.locator(".pw-platform-mobile-menu").click();
  await expect(page.locator(".pw-platform-sidebar")).toBeVisible();
  await expect(page.locator(".pw-platform-brand")).toBeVisible();
  await expect(page.locator(".pw-platform-menu-label").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("shared content aligns with the topbar on one neutral canvas", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const file of includedPages) {
    await page.goto(routeFor(file));
    const metrics = await page.evaluate(() => {
      const host = document.querySelector(".pw-platform-content-host");
      const source = document.querySelector(".pw-platform-content");
      const hostStyle = getComputedStyle(host);
      const sourceStyle = getComputedStyle(source);
      const hostRect = host.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
      return {
        hostClass: host.className,
        hostBackground: hostStyle.backgroundColor,
        hostBorderWidth: hostStyle.borderLeftWidth,
        hostShadow: hostStyle.boxShadow,
        hostPadding: parseFloat(hostStyle.paddingLeft),
        sourceBackground: sourceStyle.backgroundColor,
        sourcePadding: sourceStyle.padding,
        sourceInset: sourceRect.left - hostRect.left,
        overflow: document.documentElement.scrollWidth - innerWidth
      };
    });

    expect(metrics.hostBackground, file).toBe("rgb(245, 245, 246)");
    expect(metrics.hostBorderWidth, file).toBe("0px");
    expect(metrics.hostShadow, file).toBe("none");
    expect(metrics.overflow, file).toBeLessThanOrEqual(1);

    expect(metrics.hostPadding, file).toBe(0);
    expect(Math.abs(metrics.sourceInset), file).toBeLessThanOrEqual(1);

    if (/^1\./.test(file)) expect(metrics.hostClass, file).toContain("pw-layout-self-guttered");

    if (panelPages.has(file)) {
      expect(metrics.hostClass, file).toContain("pw-layout-panel");
      expect(metrics.sourceBackground, file).toBe("rgb(255, 255, 255)");
    } else if (!/^1\./.test(file)) {
      expect(metrics.hostClass, file).toContain("pw-layout-canvas");
      expect(metrics.sourcePadding, file).toBe("0px");
    }
  }
});

test("shared content stays aligned with the mobile topbar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of [
    "/13.remote_control.html",
    "/14.prepaid_card_list.html",
    "/29.INTL_PSP_merchant_lead_list.html",
    "/40.notifications.html"
  ]) {
    await page.goto(route);
    const metrics = await page.evaluate(() => {
      const host = document.querySelector(".pw-platform-content-host");
      const source = document.querySelector(".pw-platform-content");
      const hostRect = host.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
      return {
        padding: parseFloat(getComputedStyle(host).paddingLeft),
        sourceInset: sourceRect.left - hostRect.left,
        overflow: document.documentElement.scrollWidth - innerWidth
      };
    });
    expect(metrics.padding, route).toBe(0);
    expect(Math.abs(metrics.sourceInset), route).toBeLessThanOrEqual(1);
    expect(metrics.overflow, route).toBeLessThanOrEqual(1);
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
  await expect(page.locator('.pw-platform-disabled[aria-disabled="true"]')).toHaveCount(3);
});

test("shared navigation exposes prepaid and user management submenus", async ({ page }) => {
  await page.goto("/38.Merchant_onboard.html");

  const prepaidToggle = page.locator('[data-pw-menu-toggle="prepaid"]');
  await prepaidToggle.click();
  await expect(page.locator('[data-pw-menu="prepaid"] a')).toHaveText([
    "Card List",
    "Activation",
    "Balance Adjustment",
    "Loss & Replacement"
  ]);
  expect(await page.locator('[data-pw-menu="prepaid"] a').evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual([
    "14.prepaid_card_list.html",
    "15.prepaid_card_activation.html",
    "16.prepaid_credit_adjustment.html",
    "17.prepaid_loss_replacement.html"
  ]);

  const userToggle = page.locator('[data-pw-menu-toggle="users"]');
  await userToggle.click();
  await expect(page.locator('[data-pw-menu="users"] .pw-platform-unavailable-sub')).toHaveText([
    "User List",
    "Role Management",
    "Appeals"
  ]);
  await expect(page.locator('[data-pw-menu="users"] a')).toHaveCount(0);
});

test("prepaid pages select their matching submenu destination", async ({ page }) => {
  const routes = [
    ["/14.prepaid_card_list.html", "Card List"],
    ["/15.prepaid_card_activation.html", "Activation"],
    ["/16.prepaid_credit_adjustment.html", "Balance Adjustment"],
    ["/17.prepaid_loss_replacement.html", "Loss & Replacement"],
    ["/19.prepaid_card_detail.html", "Card List"]
  ];

  for (const [route, label] of routes) {
    await page.goto(route);
    await expect(page.locator('[data-pw-menu-toggle="prepaid"]')).toHaveClass(/active/);
    await expect(page.locator('[data-pw-menu="prepaid"]')).toBeVisible();
    await expect(page.locator('[data-pw-menu="prepaid"] .pw-platform-sub-item.active')).toHaveText(label);
  }
});

test("active navigation group ignores legacy persisted menu state", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("paywizard.platformSidebarMenus.v1.wizarpos", JSON.stringify({
      agents: true,
      merchants: false
    }));
  });
  await page.goto("/38.Merchant_onboard.html");

  await expect(page.locator('[data-pw-menu="merchants"]')).toBeVisible();
  await expect(page.locator('[data-pw-menu-toggle="merchants"]')).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[data-pw-menu="agents"]')).toBeHidden();
});

test("secondary navigation groups form one accordion on desktop and mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/38.Merchant_onboard.html");
    if (viewport.width < 761) await page.locator(".pw-platform-mobile-menu").click();

    const agentsToggle = page.locator('[data-pw-menu-toggle="agents"]');
    const merchantsToggle = page.locator('[data-pw-menu-toggle="merchants"]');
    await agentsToggle.click();
    await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
    await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
    await expect(merchantsToggle).toHaveAttribute("aria-expanded", "false");

    await agentsToggle.click();
    await expect(page.locator('[data-pw-menu="agents"]')).toBeHidden();
  }
});

test("secondary navigation animation respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/38.Merchant_onboard.html");
  await page.locator('[data-pw-menu-toggle="agents"]').click();

  await expect(page.locator('[data-pw-menu="agents"]')).toBeVisible();
  expect(await page.locator('[data-pw-menu="agents"]').evaluate((menu) => menu.getAnimations().length)).toBe(0);
  await expect(page.locator('[data-pw-menu="merchants"]')).toBeHidden();
});

test("selected secondary navigation uses one pill treatment across legacy pages", async ({ page }) => {
  for (const route of ["/38.Merchant_onboard.html", "/1.terminalmanage.html"]) {
    await page.goto(route);
    const selected = page.locator(".pw-platform-sub-item.active");
    const hovered = selected.locator("xpath=..").locator(".pw-platform-sub-item:not(.active)").first();
    await expect(selected, route).toHaveCount(1);
    await expect(selected, route).toHaveCSS("border-radius", "999px");
    await expect(selected, route).toHaveCSS("background-color", "rgb(41, 41, 44)");
    await expect(selected, route).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(selected, route).toHaveCSS("min-height", "43px");
    await expect(selected, route).toHaveCSS("padding-left", "26px");
    const metrics = await selected.evaluate((item) => {
      const dot = getComputedStyle(item, "::before");
      return {
        itemWidth: item.getBoundingClientRect().width,
        menuWidth: item.parentElement.getBoundingClientRect().width,
        dotWidth: dot.width,
        dotHeight: dot.height,
        dotBorderWidth: dot.borderWidth,
        dotBackground: dot.backgroundColor
      };
    });
    expect(metrics.itemWidth, route).toBe(metrics.menuWidth);
    expect(metrics.dotWidth, route).toBe("7px");
    expect(metrics.dotHeight, route).toBe("7px");
    expect(metrics.dotBorderWidth, route).toBe("0px");
    expect(metrics.dotBackground, route).toBe("rgb(255, 255, 255)");
    await hovered.hover();
    await expect(hovered, route).toHaveCSS("border-radius", "999px");
    await expect(hovered, route).toHaveCSS("background-color", "rgb(243, 243, 244)");
  }
});

test("primary menu typography and hover treatment are consistent", async ({ page }) => {
  await page.goto("/38.Merchant_onboard.html");
  const rootItems = page.locator(".pw-platform-nav > .pw-platform-menu-item, .pw-platform-nav > .pw-platform-menu-toggle, .pw-platform-nav > .pw-platform-menu-row .pw-platform-menu-link");
  const styles = await rootItems.evaluateAll((items) => items.map((item) => ({
    weight: getComputedStyle(item.querySelector(".pw-platform-menu-label")).fontWeight,
    decoration: getComputedStyle(item).textDecorationLine
  })));
  expect(new Set(styles.map((style) => style.weight))).toEqual(new Set(["700"]));
  expect(styles.every((style) => style.decoration === "none")).toBeTruthy();

  const unavailable = page.locator(".pw-platform-disabled").first();
  await expect(unavailable).toHaveCSS("color", "rgb(48, 48, 54)");
  await unavailable.hover();
  await expect(unavailable).toHaveCSS("background-color", "rgb(243, 243, 244)");
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

test("1.* terminal pages fill the available workspace on wide screens", async ({ page }) => {
  const routes = [
    "/1.terminalmanage.html",
    "/1.terminalmanage_CardReader.html",
    "/1.terminalmanage_nayax.html?tab=dex&sn=WP6267UQ36002376"
  ];

  for (const width of [2048, 3420]) {
    await page.setViewportSize({ width, height: 1050 });
    for (const route of routes) {
      await page.goto(route);
      const metrics = await page.evaluate(() => {
        const workspace = document.querySelector(".pw-platform-content").getBoundingClientRect();
        const pageWrap = document.querySelector(".page-wrap").getBoundingClientRect();
        const card = document.querySelector(".terminal-card").getBoundingClientRect();
        return {
          pageWrapWidth: pageWrap.width,
          workspaceWidth: workspace.width,
          topGutter: card.top - workspace.top,
          leftGutter: card.left - workspace.left,
          rightGutter: workspace.right - card.right,
          documentOverflow: document.documentElement.scrollWidth - innerWidth
        };
      });

      expect(Math.abs(metrics.pageWrapWidth - metrics.workspaceWidth), `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(metrics.topGutter), `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(metrics.leftGutter), `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(Math.abs(metrics.rightGutter), `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(metrics.documentOverflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("APP Management uses the shared heading and fills the content host", async ({ page }) => {
  for (const width of [1440, 2048, 3420]) {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/10.customer_app_upload_manage.html");

    await expect(page.locator(".pw-platform-breadcrumb strong")).toHaveText("APP Management");
    await expect(page.locator(".pw-platform-content .crumbs, .pw-platform-content .card-head")).toHaveCount(0);
    await expect(page.locator(".pw-platform-content h1.pw-module-page-title")).toHaveText("APP Management");
    await expect(page.locator("#appFile")).toBeAttached();
    await expect(page.locator('label[for="appFile"]')).toHaveText("Choose APK");
    await page.locator("#appFile").setInputFiles({
      name: "upt-retail-plus-2.6.2.apk",
      mimeType: "application/vnd.android.package-archive",
      buffer: Buffer.from("test apk")
    });
    await expect(page.locator('label[for="appFile"]')).toHaveText("upt-retail-plus-2.6.2.apk");

    const metrics = await page.evaluate(() => {
      const workspace = document.querySelector(".pw-platform-content").getBoundingClientRect();
      const pageWrap = document.querySelector(".page-wrap").getBoundingClientRect();
      const card = document.querySelector(".card").getBoundingClientRect();
      return {
        pageWrapWidth: pageWrap.width,
        workspaceWidth: workspace.width,
        topGutter: card.top - workspace.top,
        leftGutter: card.left - workspace.left,
        rightGutter: workspace.right - card.right,
        documentOverflow: document.documentElement.scrollWidth - innerWidth
      };
    });

    expect(Math.abs(metrics.pageWrapWidth - metrics.workspaceWidth), `${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.topGutter), `${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.leftGutter), `${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.rightGutter), `${width}px`).toBeLessThanOrEqual(1);
    expect(metrics.documentOverflow, `${width}px`).toBeLessThanOrEqual(1);
  }
});

test("module-entry headings use one shared visual hierarchy", async ({ page }) => {
  for (const [route, title] of [
    ["/2.agent_list_iso.html", "Agents"],
    ["/2.resellermerchantterminal.html", "Device Management"],
    ["/7.merchant_contact.html", "Contact"],
    ["/10.customer_app_upload_manage.html", "APP Management"]
  ]) {
    await page.goto(route);
    const heading = page.locator("h1.pw-module-page-title");
    await expect(heading).toHaveText(title);
    await expect(heading).toHaveCSS("font-size", "25px");
    await expect(heading).toHaveCSS("font-weight", "600");
    await expect(heading).toHaveCSS("color", "rgb(68, 70, 77)");
  }
});

test("Device Management and Contact use the shared module-entry surface", async ({ page }) => {
  const pages = [
    ["/2.resellermerchantterminal.html", ".workspace.pw-module-page-surface"],
    ["/7.merchant_contact.html", ".page-card.pw-module-page-surface"]
  ];

  for (const [route, selector] of pages) {
    await page.goto(route);
    const surface = page.locator(selector);
    await expect(surface).toHaveCSS("border-radius", "8px");
    await expect(surface).toHaveCSS("border-color", "rgb(229, 231, 235)");
    await expect(surface).toHaveCSS("padding-left", "24px");
    await expect(surface).toHaveCSS("box-shadow", "rgba(0, 0, 0, 0.04) 0px 1px 2px 0px");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, selector] of pages) {
    await page.goto(route);
    await expect(page.locator(selector)).toHaveCSS("padding-left", "16px");
    await expect(page.locator("h1.pw-module-page-title")).toHaveCSS("font-size", "23px");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});

test("Card Readers stays full-width without collapsing payment packages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/34.card_reader_management.html");

  const metrics = await page.evaluate(() => {
    const workspace = document.querySelector(".pw-platform-content").getBoundingClientRect();
    const pageWrap = document.querySelector(".page-wrap").getBoundingClientRect();
    const table = document.querySelector(".payment-apk-table").getBoundingClientRect();
    const packageCell = document.querySelector(".payment-apk-table tbody td:nth-child(2)").getBoundingClientRect();
    return {
      leftInset: pageWrap.left - workspace.left,
      rightInset: workspace.right - pageWrap.right,
      tableWidth: table.width,
      packageWidth: packageCell.width
    };
  });

  expect(Math.abs(metrics.leftInset)).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.rightInset)).toBeLessThanOrEqual(1);
  expect(metrics.tableWidth).toBeGreaterThanOrEqual(940);
  expect(metrics.packageWidth).toBeGreaterThanOrEqual(170);
  await expect(page.locator(".pw-platform-content .crumbs")).toHaveCount(0);
  await expect(page.locator(".banner-meta")).toBeVisible();
});

test("priority pages use compact primary radii and Activation is one workflow surface", async ({ page }) => {
  for (const [route, selector] of [
    ["/1.terminalmanage_nayax.html", ".terminal-card"],
    ["/2.agent_list_iso.html", ".content"],
    ["/10.customer_app_upload_manage.html", ".card"],
    ["/13.remote_control.html", ".card.panel"],
    ["/15.prepaid_card_activation.html", ".content-inner > .tabbed-card"],
    ["/34.card_reader_management.html", ".management-card"]
  ]) {
    await page.goto(route);
    await expect(page.locator(selector).first()).toHaveCSS("border-radius", "8px");
  }

  await page.goto("/15.prepaid_card_activation.html");
  const workflow = page.locator("#singleActivation > .content-inner");
  await expect(workflow).toHaveCSS("border-radius", "0px");
  await expect(workflow).toHaveCSS("border-top-width", "0px");
  await expect(workflow.locator(":scope > .section").first()).toHaveCSS("border-radius", "0px");
  await expect(page.locator(".section-note").filter({ hasText: "same currency" })).toBeVisible();
});

test("1.* terminal pages remain contained at responsive breakpoints", async ({ page }) => {
  const routes = [
    "/1.terminalmanage.html",
    "/1.terminalmanage_CardReader.html",
    "/1.terminalmanage_nayax.html?tab=dex&sn=WP6267UQ36002376"
  ];

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      const metrics = await page.evaluate(() => {
        const workspace = document.querySelector(".pw-platform-content").getBoundingClientRect();
        const card = document.querySelector(".terminal-card").getBoundingClientRect();
        return {
          cardContained: card.left >= workspace.left - 1 && card.right <= workspace.right + 1,
          documentOverflow: document.documentElement.scrollWidth - innerWidth
        };
      });

      expect(metrics.cardContained, `${route} at ${viewport.width}px`).toBeTruthy();
      expect(metrics.documentOverflow, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(1);
    }
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

test("keeps the sidebar at the same scroll position when navigating", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/38.Merchant_onboard.html");
  await page.locator('[data-pw-menu-toggle="settings"]').click();

  const before = await page.evaluate(() => {
    const sidebar = document.querySelector(".pw-platform-sidebar");
    const target = sidebar.querySelector('a[href="36.product_map_templates.html"]');
    sidebar.scrollTop = target.offsetTop - sidebar.clientHeight / 2;
    return sidebar.scrollTop;
  });

  await Promise.all([
    page.waitForURL(/36\.product_map_templates\.html$/),
    page.locator('a[href="36.product_map_templates.html"]').evaluate((link) => link.click())
  ]);

  const after = await page.locator(".pw-platform-sidebar").evaluate((sidebar) => sidebar.scrollTop);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
});

test("Device Management selected group uses readable white text", async ({ page }) => {
  await page.goto("/1.terminalmanage.html");

  const selectedGroup = page.locator(".pw-platform-menu-row.active");
  await expect(selectedGroup).toHaveCSS("background-color", "rgb(41, 41, 44)");
  await expect(selectedGroup.locator(".pw-platform-menu-link")).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("shared sidebar dimensions do not inherit page-local legacy styles", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of [
    "/38.Merchant_onboard.html",
    "/5.merchant_manage_iso.html",
    "/1.terminalmanage.html",
    "/1.terminalmanage_nayax.html"
  ]) {
    await page.goto(route);
    const metrics = await page.evaluate(() => {
      const secondaryElement = document.querySelector(".pw-platform-sub-item:not(.active)");
      const activeSecondary = getComputedStyle(document.querySelector(".pw-platform-sub-item.active"));
      const root = getComputedStyle(document.querySelector(".pw-platform-menu-item"));
      const secondary = getComputedStyle(secondaryElement);
      const secondaryDot = getComputedStyle(secondaryElement, "::before");
      return {
        rootMinHeight: root.minHeight,
        rootPadding: root.padding,
        rootRadius: root.borderRadius,
        rootColor: root.color,
        rootBackground: root.backgroundColor,
        secondaryMinHeight: secondary.minHeight,
        secondaryPadding: secondary.padding,
        secondaryRadius: secondary.borderRadius,
        secondaryColor: secondary.color,
        secondaryBackground: secondary.backgroundColor,
        secondaryDotBorder: secondaryDot.border,
        activeSecondaryColor: activeSecondary.color,
        activeSecondaryBackground: activeSecondary.backgroundColor
      };
    });

    expect(metrics, route).toEqual({
      rootMinHeight: "47px",
      rootPadding: "9px 12px",
      rootRadius: "8px",
      rootColor: "rgb(48, 48, 54)",
      rootBackground: "rgba(0, 0, 0, 0)",
      secondaryMinHeight: "43px",
      secondaryPadding: "7px 11px 7px 26px",
      secondaryRadius: "999px",
      secondaryColor: "rgb(114, 119, 131)",
      secondaryBackground: "rgba(0, 0, 0, 0)",
      secondaryDotBorder: "2px solid rgb(114, 119, 131)",
      activeSecondaryColor: "rgb(255, 255, 255)",
      activeSecondaryBackground: "rgb(41, 41, 44)"
    });
  }
});

test("Unattended Terminals loads the shared Poppins typeface", async ({ page }) => {
  await page.goto("/1.terminalmanage_nayax.html");

  await expect(page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"][href*="Poppins"]')).toHaveCount(1);
});
