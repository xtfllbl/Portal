const { test, expect } = require("@playwright/test");

const CASES = [
  {
    path: "/1.terminalmanage.html?tab=basic",
    name: "New York, NY",
    coordinates: "40.7580, -73.9855"
  },
  {
    path: "/1.terminalmanage_nayax.html?tab=basic",
    name: "Los Angeles, CA",
    coordinates: "34.0522, -118.2437"
  }
];

for (const terminal of CASES) {
  test(`${terminal.name} uses an interactive terminal location map`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(terminal.path);

    const map = page.locator("[data-terminal-location-map]");
    await expect(map).toBeVisible();
    await expect(map).toHaveClass(/leaflet-container/);
    await expect(map.locator(".leaflet-control-zoom-in")).toBeVisible();
    await expect(map.locator(".leaflet-control-zoom-out")).toBeVisible();
    await expect(page.locator(".map-refresh")).toHaveCount(0);
    await expect(page.locator(".terminal-location-label")).toHaveCount(0);

    const initialTileUrl = await map.locator(".leaflet-tile").first().getAttribute("src");
    await map.locator(".leaflet-control-zoom-in").click();
    await expect.poll(() => map.locator(".leaflet-tile").first().getAttribute("src")).not.toBe(initialTileUrl);

    await map.locator(".leaflet-marker-icon").click();
    const popup = map.locator(".leaflet-popup-content");
    await expect(popup).toContainText(terminal.name);
    await expect(popup).toContainText(terminal.coordinates);
    expect(pageErrors).toEqual([]);
  });
}

test("attended and unattended maps use different demo coordinates", async ({ page }) => {
  const locations = [];
  for (const terminal of CASES) {
    await page.goto(terminal.path);
    locations.push(await page.locator("[data-terminal-location-map]").evaluate((element) => ({
      lat: element.dataset.lat,
      lng: element.dataset.lng
    })));
  }
  expect(locations[0]).not.toEqual(locations[1]);
});
