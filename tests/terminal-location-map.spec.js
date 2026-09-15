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

test("keeps map controls below portal overlays", async ({ page }) => {
  await page.goto(CASES[0].path);
  await page.locator("[data-pw-profile-trigger]").click();

  const stacking = await page.evaluate(() => {
    const zoom = document.querySelector(".leaflet-control-zoom");
    const menu = document.querySelector("[data-pw-profile-menu]");
    const zoomRect = zoom.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const point = {
      x: zoomRect.left + zoomRect.width / 2,
      y: zoomRect.top + zoomRect.height / 2
    };
    const topElement = document.elementFromPoint(point.x, point.y);
    return {
      overlaps: point.x >= menuRect.left && point.x <= menuRect.right && point.y >= menuRect.top && point.y <= menuRect.bottom,
      menuOwnsTopElement: menu.contains(topElement)
    };
  });

  expect(stacking.overlaps).toBe(true);
  expect(stacking.menuOwnsTopElement).toBe(true);
});

test("returns to the terminal location after the map is moved", async ({ page }) => {
  await page.goto(CASES[0].path);
  const map = page.locator("[data-terminal-location-map]");
  const locationControl = map.getByRole("button", { name: "Return to terminal location" });
  await expect(locationControl).toBeVisible();

  await map.evaluate((element) => {
    element.terminalLocationMap.setView([40.808, -73.9355], 12, { animate: false });
  });
  await locationControl.click();

  await expect.poll(() => map.evaluate((element) => {
    const center = element.terminalLocationMap.getCenter();
    return {
      lat: Number(center.lat.toFixed(4)),
      lng: Number(center.lng.toFixed(4)),
      zoom: element.terminalLocationMap.getZoom()
    };
  })).toEqual({ lat: 40.758, lng: -73.9855, zoom: 15 });
});

test("separates the location control from the zoom controls", async ({ page }) => {
  await page.goto(CASES[0].path);
  const gap = await page.locator("[data-terminal-location-map]").evaluate((map) => {
    const zoomRect = map.querySelector(".leaflet-control-zoom").getBoundingClientRect();
    const locationRect = map.querySelector(".terminal-location-control").getBoundingClientRect();
    return Math.round(locationRect.top - zoomRect.bottom);
  });

  expect(gap).toBe(8);
});
