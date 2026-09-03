const { test, expect } = require("@playwright/test");

const NOTIFICATION_STATE_KEY = "paywizard.notifications.v1";
const ALERT_STATE_KEY = "paywizard.customerAlerts.v1";

async function resetNotifications(page) {
  await page.goto("/40.notifications.html");
  await page.evaluate(({ notificationKey, alertKey }) => {
    localStorage.removeItem(notificationKey);
    localStorage.removeItem(alertKey);
  }, { notificationKey: NOTIFICATION_STATE_KEY, alertKey: ALERT_STATE_KEY });
  await page.reload();
}

test("filters notifications and persists independent read state", async ({ page }) => {
  await resetNotifications(page);

  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(4);
  await expect(page.getByRole("tab", { name: "All Notifications" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Alerts" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Onboarding" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Leads" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Leads" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("[data-notification-count]")).toHaveText("60");
  await expect(page.locator("[data-notification-rows] tr")).toHaveCount(42);
  await page.getByRole("tab", { name: "All Notifications" }).click();
  await expect(page.locator("[data-notification-rows] tr")).toHaveCount(61);
  await expect(page.locator(".notifications-view").getByText(/Manage your merchant alerts/i)).toHaveCount(0);

  await page.getByRole("tab", { name: "Alerts" }).click();
  await expect(page.locator("[data-notification-rows] tr")).toHaveCount(9);
  await expect(page.locator("[data-notification-rows]")).toContainText("Customer Alert");
  await expect(page.locator("[data-notification-rows]")).toContainText("Payment Service Offline");

  const firstAlert = page.locator("[data-notification-rows] tr").first();
  await firstAlert.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Mark Read", exact: true }).click();
  await expect(firstAlert.locator(".status-pill")).toHaveText("Read");
  await expect(page.locator("[data-notification-count]")).toHaveText("59");

  await page.reload();
  await page.getByRole("tab", { name: "Alerts" }).click();
  await expect(page.locator("[data-notification-rows] tr").first().locator(".status-pill")).toHaveText("Read");

  await page.getByRole("button", { name: "Mark All Read" }).click();
  await expect(page.locator("[data-notification-rows] .status-pill.unread")).toHaveCount(0);
  await expect(page.locator("[data-notification-count]")).toHaveText("51");

  await page.getByRole("button", { name: "Refresh List" }).click();
  await expect(page.getByRole("button", { name: "Refresh List" })).toBeEnabled();
  await expect(page.locator("[data-notification-count]")).toHaveText("51");
});

test("uses shared Alert Incident state and opens a deep-linked incident", async ({ page }) => {
  await page.goto("/40.notifications.html");
  await page.evaluate(({ notificationKey, alertKey }) => {
    localStorage.removeItem(notificationKey);
    localStorage.setItem(alertKey, JSON.stringify({
      rules: [],
      incidents: [{
        id: "notification-shared-incident",
        ruleId: "",
        monitoringState: "Active",
        condition: "opc_offline",
        terminalId: "WP6267UQ36002376",
        terminalName: "Terminal - WP6267UQ36002376",
        store: "Midtown Store",
        evidence: "Payment Service unavailable for 22 minutes",
        opened: "2026-08-30 11:22",
        duration: "22m",
        events: [{ at: "2026-08-30 11:22", type: "opened", label: "Opened", evidence: "Payment Service unavailable for 22 minutes" }],
        nextChecks: ["normal", "normal"]
      }]
    }));
  }, { notificationKey: NOTIFICATION_STATE_KEY, alertKey: ALERT_STATE_KEY });
  await page.reload();

  await page.getByRole("tab", { name: "Alerts" }).click();
  const row = page.locator('[data-notification-id="alert-notification-shared-incident"]');
  await expect(row).toContainText("Payment Service unavailable for 22 minutes");
  await row.getByRole("button", { name: "Detail" }).click();

  await expect(page).toHaveURL(/39\.customer_alerts\.html\?view=incidents&incident=notification-shared-incident/);
  await expect(page.getByRole("dialog", { name: "Payment Service Offline" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Payment Service Offline" })).toContainText("Payment Service unavailable for 22 minutes");
});

for (const viewport of [
  { width: 2048, height: 910, sidebar: 264 },
  { width: 1440, height: 900, sidebar: 264 },
  { width: 1024, height: 768, sidebar: 74 },
  { width: 390, height: 844, sidebar: 0 }
]) {
  test(`Notifications shell is responsive at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await resetNotifications(page);
    const metrics = await page.evaluate(() => {
      const sidebar = document.querySelector(".sidebar");
      const topbar = document.querySelector(".topbar");
      const tableWrap = document.querySelector(".table-wrap");
      return {
        sidebarDisplay: getComputedStyle(sidebar).display,
        sidebarWidth: getComputedStyle(sidebar).display === "none" ? 0 : sidebar.getBoundingClientRect().width,
        topbarHeight: topbar.getBoundingClientRect().height,
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
        tableScrollable: tableWrap.scrollWidth > tableWrap.clientWidth
      };
    });

    expect(Math.round(metrics.sidebarWidth)).toBe(viewport.sidebar);
    expect(metrics.sidebarDisplay === "none").toBe(viewport.sidebar === 0);
    expect(Math.round(metrics.topbarHeight)).toBe(viewport.width <= 760 ? 58 : 70);
    expect(metrics.documentOverflow).toBeLessThanOrEqual(1);
    if (viewport.width <= 1024) expect(metrics.tableScrollable).toBeTruthy();
    if (viewport.width <= 760) {
      const activeTabVisible = await page.getByRole("tab", { name: "Leads" }).evaluate((tab) => {
        const tabList = tab.closest('[role="tablist"]');
        const tabBox = tab.getBoundingClientRect();
        const listBox = tabList.getBoundingClientRect();
        return tabBox.left >= listBox.left - 1 && tabBox.right <= listBox.right + 1;
      });
      expect(activeTabVisible).toBeTruthy();
    }
  });
}
