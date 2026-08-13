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

  await expect(page.locator("#onboarding-rows tr")).toHaveCount(12);
  await expect(page.getByRole("button", { name: /Review application 00000339/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Review application 00000338/ })).toBeVisible();
  await page.locator("#status-filter").selectOption({ label: "Approved" });
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(3);

  await page.locator("#merchant-filter").fill("FISERV");
  await page.getByRole("button", { name: "Search onboarding" }).click();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(1);
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("FISERV PROD TEST");

  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(12);
});

test("renders the state-specific action matrix", async ({ page }) => {
  await openCleanPage(page);
  const draft = page.locator("#onboarding-rows tr", { hasText: "00000336" });
  await expect(draft.getByRole("button", { name: /Edit process/ })).toBeVisible();
  await expect(draft.getByRole("button", { name: /View process/ })).toHaveCount(0);
  const submitted = page.locator("#onboarding-rows tr", { hasText: "00000339" });
  await expect(submitted.getByRole("button", { name: /Review application/ })).toBeVisible();
  await expect(submitted.getByRole("button", { name: /View process/ })).toHaveCount(0);
  const approved = page.locator("#onboarding-rows tr", { hasText: "00000328" });
  await expect(approved.getByRole("button", { name: /View process/ })).toBeVisible();
  await expect(approved.getByRole("button", { name: /Edit process/ })).toHaveCount(0);
  await expect(approved.getByRole("button", { name: /Share process/ })).toBeVisible();
});

test("opens a genuine read-only channel view", async ({ page }) => {
  await openCleanPage(page);
  await page.getByRole("button", { name: "View process 00000328" }).click();
  await expect(page).toHaveURL(/27\.Merchant_onboard_elavon\.html\?mode=view&applicationId=APP-LEGACY-02/);
  await expect(page.getByRole("heading", { name: "View Elavon EU Application" })).toBeVisible();
  await expect(page.locator('[name="registeredBusinessName"]')).toHaveValue("ceshi123213243234");
  await expect(page.locator('[name="registeredBusinessName"]')).toHaveAttribute("readonly", "");
  await expect(page.getByRole("button", { name: "Pass", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Issue", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to Onboarding" }).last()).toBeVisible();
});

test("does not start review until the first reviewer decision", async ({ page }) => {
  await openCleanPage(page);
  await page.getByRole("button", { name: "Review application 00000339" }).click();
  expect(await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01").status)).toBe("Merchant Submit");
  await page.locator('.form-section[data-section="legal"]').getByRole("button", { name: "Pass", exact: true }).click();
  expect(await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01").status)).toBe("Under Review");
});

test("merchant save creates Merchant Draft and a read-only platform view", async ({ page }) => {
  await page.goto("/38.Merchant_onboard_nuvei_public.html?applicationId=APP-DEMO-NUVEI-01");
  await page.evaluate((key) => {
    const item = window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01");
    item.status = "Awaiting Merchant";
    localStorage.setItem(key, JSON.stringify([item]));
  }, APPLICATIONS_KEY);
  await page.reload();
  const form = page.frameLocator("#source-frame");
  await form.getByRole("button", { name: "Save Draft" }).click();
  expect(await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01").status)).toBe("Merchant Draft");
  await page.goto(ONBOARDING_URL);
  const row = page.locator("#onboarding-rows tr", { hasText: "00000339" });
  await expect(row).toContainText("Merchant Draft");
  await expect(row.getByRole("button", { name: "View process 00000339" })).toBeVisible();
  await expect(row.getByRole("button", { name: /Review application/ })).toHaveCount(0);
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
  expect(applications).toHaveLength(13);
  const createdApplication = applications.find((item) => item.merchantName === "Northstar Coffee");
  expect(createdApplication.status).toBe("Awaiting Merchant");
  expect(createdApplication.shareUrl).toContain("merchantName=Northstar+Coffee");

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  await expect(page.locator("#onboarding-rows tr")).toHaveCount(13);
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
    await expect(page.locator(".privacy-note")).toHaveCount(0);
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

test("reviews, returns, corrects and resubmits an Elavon application", async ({ page }) => {
  await openCleanPage(page);
  await page.getByRole("button", { name: "Review application 00000338" }).click();
  await expect(page).toHaveURL(/27\.Merchant_onboard_elavon\.html\?mode=review&applicationId=APP-DEMO-ELAVON-01/);
  await expect(page.getByRole("heading", { name: "Review Elavon EU Application" })).toBeVisible();
  await expect(page.locator('[name="registeredBusinessName"]')).toHaveValue("Northstar Vending Europe Ltd.");
  await expect(page.locator('[name="registeredBusinessName"]')).toHaveAttribute("readonly", "");
  await expect(page.getByRole("button", { name: "Pass", exact: true })).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Issue", exact: true })).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Approve Application" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Return to Merchant" })).toBeDisabled();

  const sections = page.locator(".form-section[data-section]");
  await sections.nth(0).getByRole("button", { name: "Issue" }).click();
  for (let index = 1; index < 6; index += 1) {
    await sections.nth(index).getByRole("button", { name: "Pass", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Return to Merchant" })).toBeDisabled();
  await sections.nth(0).getByRole("textbox", { name: "Reason for returning this section" }).fill("Please confirm the VAT ID and legal company name.");
  await expect(page.getByRole("button", { name: "Return to Merchant" })).toBeEnabled();
  await page.getByRole("button", { name: "Return to Merchant" }).click();
  await expect(page.getByRole("status")).toContainText("Returned to merchant");

  let application = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).find((item) => item.applicationId === "APP-DEMO-ELAVON-01"), APPLICATIONS_KEY);
  expect(application.status).toBe("Returned");
  expect(application.review.sections.business.status).toBe("rejected");
  expect(application.review.sections.contact.status).toBe("approved");

  await page.goto("/38.Merchant_onboard_elavon_public.html?applicationId=APP-DEMO-ELAVON-01");
  await expect(page.getByRole("heading", { name: "Complete your Elavon application" })).toBeVisible();
  await expect(page.locator(".changes-requested")).toContainText("Changes requested");
  const merchantForm = page.frameLocator("#source-frame");
  await expect(merchantForm.locator("#business")).toHaveClass(/merchant-review-rejected/);
  await expect(merchantForm.locator("#business")).toContainText("Please confirm the VAT ID and legal company name.");
  await expect(merchantForm.locator("#contact")).toHaveClass(/merchant-review-approved/);
  await expect(merchantForm.locator('[name="registeredBusinessName"]')).toBeEditable();
  await expect(merchantForm.locator('[name="authorizedContact"]')).toBeDisabled();
  await merchantForm.locator('[name="vatTaxId"]').fill("IE6388047V-CORRECTED");
  await merchantForm.getByRole("button", { name: "Submit Application" }).click();
  await expect(page.locator(".changes-requested")).toContainText("Application resubmitted");

  application = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).find((item) => item.applicationId === "APP-DEMO-ELAVON-01"), APPLICATIONS_KEY);
  expect(application.status).toBe("Merchant Submit");
  expect(application.submissionVersion).toBe(2);
  expect(application.review.sections.business.status).toBe("pending");
  expect(application.review.sections.business.previousReason).toContain("VAT ID");
  expect(application.review.sections.contact.status).toBe("approved");
});

test("approves a Nuvei application only after all six sections pass", async ({ page }) => {
  await openCleanPage(page);
  await page.getByRole("button", { name: "Review application 00000339" }).click();
  await expect(page.getByRole("heading", { name: "Review Nuvei Application" })).toBeVisible();
  await expect(page.locator('[name="legalName"]')).toHaveValue("Maple Street Coffee Inc.");
  const terminalSection = page.locator('.form-section[data-section="terminal"]');
  await terminalSection.getByRole("button", { name: "Issue" }).click();
  const issueUploadColors = await terminalSection.locator(".upload-card").evaluate((card) => {
    const style = getComputedStyle(card);
    return { border: style.borderTopColor, background: style.backgroundColor };
  });
  expect(issueUploadColors.border).toBe("rgb(227, 106, 98)");
  expect(issueUploadColors.background).toBe("rgb(255, 250, 250)");
  const terminalNav = page.locator('.section-nav a[href="#terminal"]');
  const terminalBadge = terminalNav.locator(".review-nav-status");
  expect(await terminalBadge.evaluate((badge) => getComputedStyle(badge).gridColumnStart)).toBe("3");
  expect(await terminalBadge.evaluate((badge) => getComputedStyle(badge).whiteSpace)).toBe("nowrap");
  for (const button of await page.getByRole("button", { name: "Pass", exact: true }).all()) await button.click();
  await expect(page.getByRole("button", { name: "Approve Application" })).toBeEnabled();
  await page.getByRole("button", { name: "Approve Application" }).click();
  await expect(page.getByRole("status")).toContainText("Application approved");
  const application = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).find((item) => item.applicationId === "APP-DEMO-NUVEI-01"), APPLICATIONS_KEY);
  expect(application.status).toBe("Approved");
  expect(Object.values(application.review.sections).every((section) => section.status === "approved")).toBeTruthy();
});

test("keeps creator and merchant pages responsive", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
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

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/27.Merchant_onboard_nuvei.html?mode=review&applicationId=APP-DEMO-NUVEI-01");
  await expect(page.getByRole("heading", { name: "Review Nuvei Application" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator(".application-nav")).toBeHidden();

  await page.goto("/38.Merchant_onboard_elavon_public.html?applicationId=APP-MOBILE&merchantName=Mobile+Shop");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.getByRole("heading", { name: "Complete your Elavon application" })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
