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
