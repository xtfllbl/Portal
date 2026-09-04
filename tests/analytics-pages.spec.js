const { test, expect } = require("@playwright/test");

const profileKey = "paywizard.portalAccessProfile.v1";

async function openAs(page, profile, route) {
  await page.goto("/12.transaction_list.html");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: profileKey, value: profile });
  await page.goto(route);
}

for (const profile of ["wizarpos", "attended", "unattended"]) {
  test(`analytics pages are available to the ${profile} profile`, async ({ page }) => {
    await openAs(page, profile, "/2.agent_analytics.html");
    await expect(page.locator("h1")).toHaveText("Agent Analytics");
    await expect(page.locator('[data-pw-menu="agents"] a')).toHaveText(["Agent List", "Analytics"]);

    await page.goto("/8.merchant_analytics.html");
    await expect(page.locator("h1")).toHaveText("Merchant Analytics");
    await expect(page.locator('[data-pw-menu="merchants"] a').filter({ hasText: "Analytics" })).toHaveCount(1);
  });
}

test("agent analytics filters and table expansion work", async ({ page }) => {
  await openAs(page, "wizarpos", "/2.agent_analytics.html");
  await page.locator('[data-period="30D"]').click();
  await expect(page.locator("[data-metric]").first()).toHaveText("$8,942.15");
  await page.locator("[data-agent-filter]").selectOption("JMSC POS");
  await expect(page.locator("[data-agent-table] tr")).toHaveCount(1);
  await expect(page.locator("[data-recent-merchant-table] tr")).toHaveCount(5);
  await page.locator('[data-view-all="merchants"]').click();
  await expect(page.locator('[data-view-all="merchants"]')).toHaveText("Show Less");
});

test("merchant analytics range and pagination controls work", async ({ page }) => {
  await openAs(page, "wizarpos", "/8.merchant_analytics.html");
  await page.locator('[data-period="90D"]').click();
  await expect(page.locator("[data-metric]").nth(1)).toHaveText("$1,108,509.30");
  await page.locator('[data-page="2"]').click();
  await expect(page.locator("[data-pagination] .page-count")).toHaveText("2 / 2 (13)");
  await expect(page.locator("[data-merchant-table] tr")).toHaveCount(3);
});

test("analytics controls keep equal heights on desktop and mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/2.agent_analytics.html");
    const heights = await page.locator(".analytics-select, .analytics-periods").evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
    expect(heights[0]).toBe(42);
  }
});

test("analytics surfaces use compact content-driven spacing", async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 1140 });
  await page.goto("/2.agent_analytics.html");

  const dimensions = await page.evaluate(() => ({
    cardHeight: Math.round(document.querySelector(".metric-card").getBoundingClientRect().height),
    lowerHeight: Math.round(document.querySelector(".agent-lower-grid .analytics-section").getBoundingClientRect().height),
    pagePadding: parseInt(getComputedStyle(document.querySelector(".analytics-page")).paddingLeft, 10),
    gridGap: parseInt(getComputedStyle(document.querySelector(".metric-grid")).gap, 10)
  }));

  expect(dimensions.cardHeight).toBeLessThanOrEqual(125);
  expect(dimensions.lowerHeight).toBeLessThan(300);
  expect(dimensions.pagePadding).toBe(20);
  expect(dimensions.gridGap).toBe(14);
});

test("merchant performance table restores rounded header corners", async ({ page }) => {
  await page.goto("/8.merchant_analytics.html");
  const radii = await page.locator(".merchant-table thead th").evaluateAll((cells) => [
    getComputedStyle(cells[0]).borderTopLeftRadius,
    getComputedStyle(cells[cells.length - 1]).borderTopRightRadius
  ]);
  expect(radii).toEqual(["8px", "8px"]);
});
