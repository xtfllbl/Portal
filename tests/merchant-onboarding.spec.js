const { test, expect } = require("@playwright/test");

const ONBOARDING_URL = "/38.Merchant_onboard.html";
const DRAFT_KEY = "paywizard-merchant-onboarding-draft";
const APPLICATIONS_KEY = "paywizard-onboarding-applications-v2";

async function openCleanPage(page) {
  await page.goto(ONBOARDING_URL);
  await page.evaluate(({ draftKey, applicationsKey }) => {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(applicationsKey);
  }, { draftKey: DRAFT_KEY, applicationsKey: APPLICATIONS_KEY });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
}

async function openCreateApplication(page) {
  await page.getByRole("button", { name: "New Onboarding" }).click();
  await expect(page).toHaveURL(/#new-onboarding$/);
  await expect(page.getByRole("heading", { name: "Create Onboarding Application" })).toBeVisible();
}

async function fillApplication(page, channel = "Elavon EU") {
  await page.locator("#merchant-name").fill("Northstar Coffee");
  await page.locator("#contact-name").fill("Alex Merchant");
  await page.locator("#merchant-email").fill("northstar@example.com");
  await page.locator("#merchant-phone").fill("+1 555 0100");
  await page.locator("#payment-channel").selectOption(channel);
  await page.locator("#country-name").selectOption({ label: "Canada" });
  await page.locator("#currency-name").selectOption("CAD");
}

test("renders and filters the onboarding list", async ({ page }) => {
  await openCleanPage(page);

  await expect(page.locator("#onboarding-rows tr")).toHaveCount(10);
  await page.locator("#status-filter").selectOption({ label: "Approved" });
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(3);

  await page.locator("#merchant-filter").fill("FISERV");
  await page.getByRole("button", { name: "Search onboarding" }).click();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(1);
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("FISERV PROD TEST");

  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(10);
});

test("uses the redesigned application creator without assignment or side rail", async ({ page }) => {
  await openCleanPage(page);
  await openCreateApplication(page);

  await expect(page.getByLabel("Breadcrumb")).toContainText("Create Onboarding Application");
  await expect(page.getByText("Assign/New Merchant", { exact: true })).toHaveCount(0);
  await expect(page.locator(".section-rail")).toHaveCount(0);
  await expect(page.locator("#merchant-permissions")).toHaveCount(0);
  await expect(page.locator(".create-application-intro")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Merchant & Contact Details" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Application Setup" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Internal Commercial Terms" })).toHaveCount(0);
  await expect(page.locator(".application-section-header p")).toHaveCount(0);
  await expect(page.locator("#cost-rate, #fee-cap")).toHaveCount(0);
  await expect(page.locator("#payment-channel option")).toHaveText(["", "Nuvei", "Elavon EU"]);

  const cancelBox = await page.getByRole("button", { name: "Cancel" }).boundingBox();
  const saveBox = await page.getByRole("button", { name: "Save", exact: true }).boundingBox();
  const sectionsBox = await page.locator(".application-sections").boundingBox();
  const actionsBox = await page.locator(".form-actions").boundingBox();
  expect(cancelBox.x).toBeLessThan(saveBox.x);
  expect(actionsBox.y - (sectionsBox.y + sectionsBox.height)).toBeGreaterThanOrEqual(16);
  expect(actionsBox.y - (sectionsBox.y + sectionsBox.height)).toBeLessThanOrEqual(32);

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
});

test("saves and restores the application draft", async ({ page }) => {
  await openCleanPage(page);
  await openCreateApplication(page);
  await fillApplication(page, "Nuvei");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Application draft saved");

  await page.reload();
  await expect(page.locator("#merchant-name")).toHaveValue("Northstar Coffee");
  await expect(page.locator("#payment-channel")).toHaveValue("Nuvei");
  await expect(page.locator("#currency-name")).toHaveValue("CAD");
});

test("validates, saves, and generates a shareable merchant link", async ({ page }) => {
  await openCleanPage(page);
  await openCreateApplication(page);

  await page.getByRole("button", { name: "Save & Share" }).click();
  expect(await page.locator("#merchant-form :invalid").count()).toBeGreaterThan(0);
  await expect(page.locator("#share-modal")).toBeHidden();

  await fillApplication(page, "Elavon EU");
  await page.getByRole("button", { name: "Save & Share" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#share-merchant-name")).toHaveText("Northstar Coffee");
  await expect(page.locator("#share-payment-channel")).toHaveText("Elavon EU");
  await expect(page.locator("#share-link")).toHaveValue(/38\.Merchant_onboard_elavon_public\.html\?/);

  const applications = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), APPLICATIONS_KEY);
  expect(applications).toHaveLength(1);
  expect(applications[0].status).toBe("Awaiting Merchant");
  expect(applications[0].shareUrl).toContain("merchantName=Northstar+Coffee");

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(11);
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("Awaiting Merchant");
});

for (const merchantPage of [
  { channel: "Nuvei", path: "/38.Merchant_onboard_nuvei_public.html", businessField: "legalName" },
  { channel: "Elavon EU", path: "/38.Merchant_onboard_elavon_public.html", businessField: "registeredBusinessName" }
]) {
  test(`opens the public ${merchantPage.channel} form with a flat layout and prefills`, async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    const query = new URLSearchParams({
      applicationId: "APP-TEST-01",
      merchantName: "Northstar Coffee",
      contactName: "Alex Merchant",
      email: "northstar@example.com",
      phone: "+1 555 0100",
      country: "Canada",
      currency: "CAD"
    });
    await page.goto(`${merchantPage.path}?${query}`);

    await expect(page.getByRole("heading", { name: new RegExp(`Complete your ${merchantPage.channel.split(" ")[0]} application`) })).toBeVisible();
    await expect(page.getByText("No login required", { exact: false })).toHaveCount(0);
    await expect(page.locator(".application-meta, .application-frame-shell, .application-frame-title")).toHaveCount(0);
    await expect(page.locator(".paywizard-brand")).toBeVisible();
    expect((await page.locator(".paywizard-brand").boundingBox()).width).toBeGreaterThanOrEqual(176);

    const application = page.frameLocator("#source-frame");
    await expect(application.locator(".sidebar")).toBeHidden();
    await expect(application.locator(".topbar")).toBeHidden();
    await expect(application.locator(`[name="${merchantPage.businessField}"]`)).toHaveValue("Northstar Coffee");
    await expect(application.locator('[name="authorizedContact"]')).toHaveValue("Alex Merchant");
    await expect(application.locator('[name="statementEmail"]')).toHaveValue("northstar@example.com");
    expect(consoleErrors).toEqual([]);
  });
}

test("keeps creator and merchant pages responsive", async ({ page }) => {
  await page.setViewportSize({ width: 2048, height: 1138 });
  await openCleanPage(page);
  await openCreateApplication(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  let sectionsBox = await page.locator(".application-sections").boundingBox();
  let actionsBox = await page.locator(".form-actions").boundingBox();
  expect(actionsBox.y - (sectionsBox.y + sectionsBox.height)).toBeGreaterThanOrEqual(16);
  expect(actionsBox.y - (sectionsBox.y + sectionsBox.height)).toBeLessThanOrEqual(32);

  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".application-sections").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
  expect(await page.locator(".merchant-details .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(4);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".application-sections").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
  let cancelBox = await page.getByRole("button", { name: "Cancel" }).boundingBox();
  let saveBox = await page.getByRole("button", { name: "Save", exact: true }).boundingBox();
  let shareBox = await page.getByRole("button", { name: "Save & Share" }).boundingBox();
  expect(Math.abs(cancelBox.y - saveBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(saveBox.y - shareBox.y)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  cancelBox = await page.getByRole("button", { name: "Cancel" }).boundingBox();
  saveBox = await page.getByRole("button", { name: "Save", exact: true }).boundingBox();
  shareBox = await page.getByRole("button", { name: "Save & Share" }).boundingBox();
  expect(cancelBox.y).toBeLessThan(saveBox.y);
  expect(Math.abs(saveBox.y - shareBox.y)).toBeLessThanOrEqual(1);

  await page.goto("/38.Merchant_onboard_elavon_public.html?applicationId=APP-MOBILE&merchantName=Mobile+Shop");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByRole("heading", { name: "Complete your Elavon application" })).toBeVisible();
});
