const { test, expect } = require("@playwright/test");

async function sidebarNavigationSignature(page, route) {
  await page.goto(route);
  await expect(page.locator(".pw-platform-sidebar")).toBeVisible();

  return page.locator(".pw-platform-sidebar").evaluate((sidebar) => {
    const rect = sidebar.getBoundingClientRect();
    const firstItem = sidebar.querySelector(".pw-platform-nav > :is(.pw-platform-menu-item, .pw-platform-menu-toggle, .pw-platform-menu-row)");
    const nav = sidebar.querySelector(".pw-platform-nav");
    const navRect = nav.getBoundingClientRect();
    const navStyle = getComputedStyle(nav);
    const firstItemRect = firstItem.getBoundingClientRect();

    return {
      navInset: Math.round(navRect.left - rect.left),
      navPadding: navStyle.padding,
      navMaxHeight: navStyle.maxHeight,
      navOverflowY: navStyle.overflowY,
      itemInset: Math.round(firstItemRect.left - rect.left),
      itemWidth: Math.round(firstItemRect.width)
    };
  });
}

test("Agents uses the same sidebar shell as the other platform pages", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 853 });

  const reference = await sidebarNavigationSignature(page, "/2.resellermerchantterminal.html");
  const agents = await sidebarNavigationSignature(page, "/2.agent_list_iso.html");

  expect(agents).toEqual(reference);
});
