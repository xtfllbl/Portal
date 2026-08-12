const { test, expect } = require("@playwright/test");

const ONBOARDING_URL = "/38.Merchant_onboard.html";

async function openCleanPage(page) {
  await page.goto(ONBOARDING_URL);
  await page.evaluate(() => localStorage.removeItem("paywizard-merchant-onboarding-draft"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
}

async function openRegistration(page) {
  await page.getByRole("button", { name: "New Onboarding" }).click();
  await expect(page).toHaveURL(/#new-onboarding$/);
  await expect(page.getByRole("heading", { name: "Merchant Registration" })).toBeVisible();
}

async function fillRequiredRegistration(page) {
  await page.locator("#merchant-name-select").selectOption({ label: "techsupport" });
  await page.locator("#merchant-email").fill("new-merchant@example.com");
  await page.locator("#merchant-phone").fill("+1 555 0100");
  await page.locator("#contact-name").fill("Alex Merchant");
  await page.locator("#merchant-permissions").selectOption({ label: "Merchant Admin" });
  await page.locator("#currency-name").selectOption("USD");
  await page.locator("#country-name").selectOption({ label: "United States of America" });
  await page.locator("#payment-channel").selectOption({ label: "Elavon EU" });
}

test("renders the onboarding list and filters mock applications", async ({ page }) => {
  await openCleanPage(page);

  await expect(page.locator("#onboarding-rows tr")).toHaveCount(10);
  await page.locator("#status-filter").selectOption({ label: "Approved" });
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(3);
  await expect(page.locator("#onboarding-rows .status-pill")).toHaveText(["Approved", "Approved", "Approved"]);

  await page.locator("#merchant-filter").fill("FISERV");
  await page.getByRole("button", { name: "Search onboarding" }).click();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(1);
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("FISERV PROD TEST");

  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(10);
  await expect(page.locator("#pagination-total")).toHaveText("/ 1 (10)");
});

test("switches between the list and registration views in one HTML", async ({ page }) => {
  await openCleanPage(page);
  await openRegistration(page);

  await expect(page.getByLabel("Breadcrumb")).toContainText("Merchant Registration");
  await expect(page.locator("#merchant-name-select")).toBeVisible();
  await expect(page.locator("#merchant-name-input")).toBeHidden();

  await page.locator("#new-merchant").check();
  await expect(page.locator("#merchant-name-select")).toBeHidden();
  await expect(page.locator("#merchant-name-input")).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  await expect(page).not.toHaveURL(/#new-onboarding$/);
});

test("saves and restores a new merchant draft", async ({ page }) => {
  await openCleanPage(page);
  await openRegistration(page);

  await page.locator("#new-merchant").check();
  await page.locator("#merchant-name-input").fill("Draft Coffee Shop");
  await page.locator("#merchant-email").fill("draft@example.com");
  await page.locator("#merchant-phone").fill("+86 138 0000 0000");
  await page.locator("#contact-name").fill("Jamie Draft");
  await page.locator("#merchant-permissions").selectOption({ label: "Merchant User" });
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");

  await page.reload();
  await expect(page.locator("#new-merchant")).toBeChecked();
  await expect(page.locator("#merchant-name-input")).toHaveValue("Draft Coffee Shop");
  await expect(page.locator("#merchant-email")).toHaveValue("draft@example.com");
  await expect(page.locator("#merchant-permissions")).toHaveValue("Merchant User");
});

test("validates required fields and adds a submitted row", async ({ page }) => {
  await openCleanPage(page);
  await openRegistration(page);

  await page.getByRole("button", { name: "Submit" }).click();
  expect(await page.locator("#merchant-form :invalid").count()).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Merchant Registration" })).toBeVisible();

  await fillRequiredRegistration(page);
  await page.locator("#cost-rate").fill("2.5");
  await page.locator("#fee-cap").fill("12");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(11);
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("new-merchant@example.com");
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("Merchant Submit");
  await expect(page.getByRole("status")).toContainText("Application submitted");
});

test("keeps the page inside the viewport on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCleanPage(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await openRegistration(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(3);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".table-shell").evaluate((shell) => shell.scrollWidth > shell.clientWidth)).toBe(true);
});
