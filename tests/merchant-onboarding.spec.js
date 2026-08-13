const { test, expect } = require("@playwright/test");

const ONBOARDING_URL = "/38.Merchant_onboard.html";
const DRAFT_KEY = "paywizard-merchant-onboarding-draft";
const APPLICATIONS_KEY = "paywizard-onboarding-applications-v2";
const PLATFORM_MERCHANTS_KEY = "paywizard-platform-merchants-v1";

async function openCleanPage(page) {
  await page.goto(ONBOARDING_URL);
  await page.evaluate(({ draftKey, applicationsKey, platformMerchantsKey }) => {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(applicationsKey);
    localStorage.removeItem(platformMerchantsKey);
  }, { draftKey: DRAFT_KEY, applicationsKey: APPLICATIONS_KEY, platformMerchantsKey: PLATFORM_MERCHANTS_KEY });
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
  const processIds = await page.locator("#onboarding-rows tr td:first-child").allTextContents();
  expect(processIds).toEqual(["00000339", "00000338", "00000336", "00000328", "00000318", "00000277", "00000274", "00000205", "00000201", "00000199", "00000098", "-"]);
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

test("keeps Process ID order stable when application states and update times change", async ({ page }) => {
  await openCleanPage(page);
  const initialIds = await page.locator("#onboarding-rows tr td:first-child").allTextContents();

  await page.evaluate(() => {
    const latest = window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01");
    latest.status = "Merchant Created";
    latest.lastUpdate = "2020-01-01 00:00:00";
    window.PaywizardOnboardingStore.upsertApplication(latest);

    const older = window.PaywizardOnboardingStore.findApplication("APP-LEGACY-02");
    older.status = "Returned";
    older.lastUpdate = "2099-12-31 23:59:59";
    window.PaywizardOnboardingStore.upsertApplication(older);
  });
  await page.reload();

  const updatedIds = await page.locator("#onboarding-rows tr td:first-child").allTextContents();
  expect(updatedIds).toEqual(initialIds);
  await expect(page.locator("#onboarding-rows tr").first()).toContainText("00000339");
  await expect(page.locator("#onboarding-rows tr").last()).toContainText("-");
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
  await expect(approved.getByRole("button", { name: /Create merchant/ })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Application Progress & Audit History" })).toBeVisible();
  await expect(page.locator(".progress-history")).not.toHaveAttribute("open", "");
  await expect(page.locator(".progress-event-list")).toBeHidden();
  const historyTitleBox = await page.locator(".progress-history-summary > span").first().boundingBox();
  const historyToggleBox = await page.locator(".progress-history-toggle").boundingBox();
  expect(historyToggleBox.x - (historyTitleBox.x + historyTitleBox.width)).toBeLessThanOrEqual(16);
  await page.locator(".progress-history-summary").click();
  await expect(page.locator(".progress-event-list")).toBeVisible();
  await expect(page.locator(".progress-event-list")).toContainText("Application approved");
  await expect(page.locator(".progress-event-list")).toContainText("Operations");
  await expect(page.locator(".progress-step").nth(4)).toContainText("Approved");
  await expect(page.locator(".progress-step").last()).toContainText("Merchant Created");
  await expect(page.locator(".progress-step").last()).toContainText("Not reached");
  await expect(page.locator(".progress-current")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to Onboarding" }).last()).toBeVisible();
});

test("does not start review until the first reviewer decision", async ({ page }) => {
  await openCleanPage(page);
  await page.getByRole("button", { name: "Review application 00000339" }).click();
  expect(await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01").status)).toBe("Merchant Submit");
  await page.locator('.form-section[data-section="legal"]').getByRole("button", { name: "Pass", exact: true }).click();
  const reviewState = await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01"));
  expect(reviewState.status).toBe("Under Review");
  expect(reviewState.statusHistory.at(-1).status).toBe("Under Review");
  expect(reviewState.statusHistory.at(-1).actor).toBe("Operations");
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
  await form.getByRole("button", { name: "Save Draft" }).click();
  const merchantDraft = await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01"));
  expect(merchantDraft.status).toBe("Merchant Draft");
  expect(merchantDraft.statusHistory.filter((event) => event.status === "Merchant Draft").length).toBe(2);
  await expect(page.locator(".guidance-grid")).toBeVisible();
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
  await expect(page.locator(".application-section-number")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Internal Commercial Terms" })).toHaveCount(0);
  await expect(page.locator(".application-section-header p")).toHaveCount(0);
  await expect(page.locator("#cost-rate, #fee-cap")).toHaveCount(0);
  await expect(page.locator("#payment-channel option")).toHaveText(["", "Nuvei", "Elavon EU"]);

  const creatorStyles = await page.locator("#merchant-name").evaluate((control) => {
    const field = control.closest(".field");
    const label = field.querySelector(".field-label");
    const section = control.closest(".application-section");
    const header = section.querySelector(".application-section-header");
    const inputStyle = getComputedStyle(control);
    const labelStyle = getComputedStyle(label);
    const sectionStyle = getComputedStyle(section);
    const headerStyle = getComputedStyle(header);
    const setupStyle = getComputedStyle(document.querySelector(".application-setup"));
    return {
      inputFontSize: inputStyle.fontSize,
      inputBorderTop: inputStyle.borderTopWidth,
      inputBorderBottom: inputStyle.borderBottomWidth,
      inputRadius: inputStyle.borderRadius,
      inputBackground: inputStyle.backgroundColor,
      labelFontSize: labelStyle.fontSize,
      labelWeight: labelStyle.fontWeight,
      labelTransform: labelStyle.textTransform,
      sectionBorder: sectionStyle.borderTopWidth,
      sectionRadius: sectionStyle.borderRadius,
      headerBackground: headerStyle.backgroundColor,
      setupDivider: setupStyle.borderLeftWidth,
      cardBorder: getComputedStyle(document.querySelector(".application-sections")).borderTopWidth,
      cardRadius: getComputedStyle(document.querySelector(".application-sections")).borderRadius,
      inputHeight: inputStyle.height,
    };
  });
  expect(creatorStyles).toEqual({
    inputFontSize: "14px",
    inputBorderTop: "1px",
    inputBorderBottom: "1px",
    inputRadius: "7px",
    inputBackground: "rgb(255, 255, 255)",
    labelFontSize: "12px",
    labelWeight: "600",
    labelTransform: "uppercase",
    sectionBorder: "0px",
    sectionRadius: "0px",
    headerBackground: "rgba(0, 0, 0, 0)",
    setupDivider: "0px",
    cardBorder: "1px",
    cardRadius: "8px",
    inputHeight: "44px",
  });

  await expect(page.locator(".application-sections")).toHaveCSS("display", "block");
  await expect(page.locator(".merchant-details .form-grid")).toHaveCSS("grid-template-columns", /.+ .+/);
  await expect(page.locator(".application-setup .form-grid")).toHaveCSS("grid-template-columns", /.+ .+ .+/);

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
  await expect(page.getByRole("heading", { name: "Application links", exact: true })).toBeVisible();
  await expect(page.locator("#share-merchant-name")).toHaveText("Northstar Coffee");
  await expect(page.locator("#share-payment-channel")).toHaveText("Elavon EU");
  await expect(page.locator("#share-link")).toHaveValue(/38\.Merchant_onboard_elavon_public\.html\?/);
  await expect(page.locator("#progress-link")).toHaveValue(/38\.Merchant_onboarding_progress\.html\?applicationId=/);
  await expect(page.getByText("Merchant Application Link", { exact: true })).toBeVisible();
  await expect(page.getByText("Application Progress Link", { exact: true })).toBeVisible();
  await expect(page.locator("#open-merchant-page")).toHaveAttribute("href", /38\.Merchant_onboard_elavon_public\.html/);
  await expect(page.locator("#open-progress-page")).toHaveAttribute("href", /38\.Merchant_onboarding_progress\.html/);
  await expect(page.locator(".share-dialog-header p, .share-link-block label, .share-help")).toHaveCount(0);
  await expect(page.getByText("Private form for the merchant", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Safe read-only status tracking", { exact: false })).toHaveCount(0);

  const applications = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), APPLICATIONS_KEY);
  expect(applications).toHaveLength(13);
  const createdApplication = applications.find((item) => item.merchantName === "Northstar Coffee");
  expect(createdApplication.status).toBe("Awaiting Merchant");
  expect(createdApplication.shareUrl).toContain("merchantName=Northstar+Coffee");
  expect(createdApplication.statusHistory.map((event) => event.status)).toEqual(["Draft", "Awaiting Merchant"]);
  expect(createdApplication.statusHistory.map((event) => event.actor)).toEqual(["Platform", "Platform"]);

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
  await sections.nth(0).getByRole("textbox", { name: "Reason for returning this section" }).fill("Please confirm the VAT ID and legal company name.\nThe registered name must match the uploaded tax document exactly before this section can be reviewed again.");
  await expect(page.getByRole("button", { name: "Return to Merchant" })).toBeEnabled();
  await page.getByRole("button", { name: "Return to Merchant" }).click();
  await expect(page.getByRole("status")).toContainText("Returned to merchant");
  await expect(page.getByRole("link", { name: "Back to Onboarding" }).last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve Application" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Return to Merchant" })).toBeDisabled();

  let application = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).find((item) => item.applicationId === "APP-DEMO-ELAVON-01"), APPLICATIONS_KEY);
  expect(application.status).toBe("Returned");
  expect(application.review.sections.business.status).toBe("rejected");
  expect(application.review.sections.contact.status).toBe("approved");
  expect(application.statusHistory.slice(-2).map((event) => event.status)).toEqual(["Under Review", "Returned"]);

  await page.goto("/27.Merchant_onboard_elavon.html?mode=view&applicationId=APP-DEMO-ELAVON-01");
  await expect(page.locator('#business .view-review-result')).toContainText("Review feedback");
  await expect(page.locator('#business .view-review-result')).toContainText("uploaded tax document exactly");
  await expect(page.locator('#business .section-header')).not.toContainText("uploaded tax document exactly");

  await page.goto("/38.Merchant_onboard_elavon_public.html?applicationId=APP-DEMO-ELAVON-01");
  await expect(page.getByRole("heading", { name: "Complete your Elavon application" })).toBeVisible();
  await expect(page.locator(".guidance-grid")).toBeHidden();
  await expect(page.locator(".changes-requested")).toContainText("Changes requested");
  await expect(page.getByRole("heading", { name: "Your Application Progress" })).toBeVisible();
  await expect(page.getByText("Follow the latest onboarding status and the time each milestone was reached.", { exact: true })).toHaveCount(0);
  await expect(page.locator("#merchant-application-progress")).toContainText("Changes requested");
  await expect(page.locator(".progress-current")).toHaveCount(0);
  const returnedSteps = page.locator(".progress-step");
  for (let index = 0; index < 4; index += 1) {
    await expect(returnedSteps.nth(index)).toHaveClass(/is-completed-stage/);
    expect(await returnedSteps.nth(index).locator(".progress-dot").evaluate((dot) => getComputedStyle(dot).backgroundColor)).toBe("rgb(21, 129, 74)");
  }
  await expect(returnedSteps.nth(4)).toContainText("Changes Requested");
  await expect(returnedSteps.nth(4)).toHaveClass(/is-outcome-returned/);
  expect(await returnedSteps.nth(4).locator(".progress-dot").evaluate((dot) => getComputedStyle(dot).backgroundColor)).toBe("rgb(196, 59, 49)");
  await expect(returnedSteps.nth(4).locator(".progress-change-icon")).toBeVisible();
  expect((await returnedSteps.nth(4).locator(".progress-dot").textContent()).trim()).toBe("");
  await expect(returnedSteps.last()).toContainText("Merchant Created");
  await expect(returnedSteps.last()).toContainText("Not reached");
  await page.locator(".progress-history-summary").click();
  const eventColors = await page.locator(".progress-event-dot").evaluateAll((dots) => [...new Set(dots.map((dot) => getComputedStyle(dot).backgroundColor))]);
  expect(eventColors.sort()).toEqual(["rgb(21, 129, 74)", "rgb(196, 59, 49)"].sort());
  const welcomeBox = await page.locator(".welcome-card").boundingBox();
  const progressBox = await page.locator("#merchant-application-progress").boundingBox();
  expect(progressBox.y - (welcomeBox.y + welcomeBox.height)).toBeGreaterThanOrEqual(16);
  expect(progressBox.y - (welcomeBox.y + welcomeBox.height)).toBeLessThanOrEqual(24);
  const merchantForm = page.frameLocator("#source-frame");
  await expect(merchantForm.locator("#business")).toHaveClass(/merchant-review-rejected/);
  await expect(merchantForm.locator("#business .section-header")).not.toContainText("Please confirm the VAT ID and legal company name.");
  await expect(merchantForm.locator("#business .merchant-review-feedback")).toContainText("Review feedback");
  await expect(merchantForm.locator("#business .merchant-review-feedback")).toContainText("Please confirm the VAT ID and legal company name.");
  await expect(merchantForm.locator("#business .merchant-review-feedback")).toContainText("uploaded tax document exactly");
  const rejectedSectionStyle = await merchantForm.locator("#business").evaluate((section) => {
    const style = getComputedStyle(section);
    return { radius: style.borderRadius, overflow: style.overflow };
  });
  expect(rejectedSectionStyle.radius).toBe("7px");
  expect(rejectedSectionStyle.overflow).toBe("hidden");
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
  expect(application.statusHistory.slice(-3).map((event) => event.status)).toEqual(["Under Review", "Returned", "Merchant Submit"]);
  expect(application.statusHistory.at(-1).submissionVersion).toBe(2);
  await expect(page.locator("#merchant-application-progress")).toContainText("Application resubmitted");
});

test("shows submitted progress on the original merchant link", async ({ page }) => {
  await page.goto("/38.Merchant_onboard_nuvei_public.html?applicationId=APP-DEMO-NUVEI-01");
  await expect(page.getByRole("heading", { name: "Your Application Progress" })).toBeVisible();
  await expect(page.locator(".progress-current")).toHaveCount(0);
  await expect(page.locator(".progress-step.is-current")).toContainText("Submitted");
  await expect(page.locator(".progress-history")).not.toHaveAttribute("open", "");
  await expect(page.locator(".progress-event-list")).toBeHidden();
  await expect(page.locator(".guidance-grid")).toBeHidden();
  await expect(page.locator(".progress-steps")).toContainText("2026-08-12 16:42:08");
  await expect(page.locator(".progress-event-list")).toContainText("Submission v1");
});

test("external progress page exposes status metadata only", async ({ page }) => {
  await page.goto("/38.Merchant_onboarding_progress.html?applicationId=APP-DEMO-NUVEI-01");
  await expect(page.getByRole("heading", { name: "Merchant Application Progress" })).toBeVisible();
  await expect(page.locator("#tracking-merchant")).toHaveText("Maple Street Coffee Inc.");
  await expect(page.locator("#tracking-channel")).toHaveText("Nuvei");
  await expect(page.locator("#tracking-process")).toHaveText("00000339");
  await expect(page.locator(".progress-current")).toHaveCount(0);
  await expect(page.locator(".progress-step.is-current")).toContainText("Submitted");
  await expect(page.locator(".progress-history")).toHaveAttribute("open", "");
  await expect(page.locator(".progress-event-list")).toBeVisible();
  await page.locator(".progress-history-summary").click();
  await expect(page.locator(".progress-event-list")).toBeHidden();
  await expect(page.locator("form, iframe, input, textarea, select, .upload-card, .review-reason")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("finance@maplestreetcoffee.ca");
  await expect(page.locator("body")).not.toContainText("rbc-void-cheque.pdf");
});

test("backfills prerequisite milestones for legacy reviewed applications", async ({ page }) => {
  await openCleanPage(page);
  const migrated = await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-LEGACY-03"));
  expect(migrated.status).toBe("Under Review");
  expect(migrated.statusHistory.map((event) => event.status)).toEqual([
    "Draft", "Awaiting Merchant", "Merchant Draft", "Merchant Submit", "Under Review"
  ]);
  expect(migrated.statusHistory.slice(0, 4).every((event) => event.inferred === true)).toBeTruthy();
  expect(migrated.statusHistory.at(-1).occurredAt).toBe("2025-12-29 14:40:21");

  await page.goto("/27.Merchant_onboard_nuvei.html?mode=view&applicationId=APP-LEGACY-03");
  await expect(page.locator(".progress-step").nth(0)).not.toContainText("Not reached");
  await expect(page.locator(".progress-step").nth(1)).not.toContainText("Not reached");
  await expect(page.locator(".progress-step").nth(2)).not.toContainText("Not reached");
  await expect(page.locator(".progress-step").nth(3)).not.toContainText("Not reached");
  await expect(page.locator(".progress-step").nth(4)).toContainText("Not reached");
  await expect(page.locator(".progress-step").nth(5)).toContainText("Not reached");
  await expect(page.locator(".progress-event-list")).toContainText("Migrated estimate");

  const directSubmit = await page.evaluate(() => {
    const application = {
      applicationId: "APP-DIRECT-SUBMIT",
      status: "Awaiting Merchant",
      submissionVersion: 1,
      lastUpdate: "2026-08-13 10:00:00",
      statusHistory: [
        { eventId: "draft", status: "Draft", occurredAt: "2026-08-13 09:50:00", actor: "Platform", submissionVersion: 0 },
        { eventId: "shared", status: "Awaiting Merchant", occurredAt: "2026-08-13 10:00:00", actor: "Platform", submissionVersion: 0 }
      ]
    };
    window.PaywizardOnboardingStore.recordStatus(application, "Merchant Submit", "Merchant", "2026-08-13 10:10:00");
    return application.statusHistory;
  });
  expect(directSubmit.map((event) => event.status)).toEqual(["Draft", "Awaiting Merchant", "Merchant Draft", "Merchant Submit"]);
  expect(directSubmit[2].inferred).toBe(true);
  expect(directSubmit[2].occurredAt).toBe("2026-08-13 10:05:00");
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
  await expect(page.getByRole("link", { name: "Back to Onboarding" }).last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve Application" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Return to Merchant" })).toBeDisabled();
  const application = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).find((item) => item.applicationId === "APP-DEMO-NUVEI-01"), APPLICATIONS_KEY);
  expect(application.status).toBe("Approved");
  expect(Object.values(application.review.sections).every((section) => section.status === "approved")).toBeTruthy();
  await page.getByRole("link", { name: "Back to Onboarding" }).last().click();
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
});

test("prefills and creates a platform merchant from an approved Nuvei application exactly once", async ({ page }) => {
  await openCleanPage(page);
  await page.evaluate(() => {
    const application = window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01");
    application.status = "Approved";
    application.mid = "-";
    window.PaywizardOnboardingStore.upsertApplication(application);
  });
  await page.reload();

  const approvedRow = page.locator('#onboarding-rows tr[data-application-id="APP-DEMO-NUVEI-01"]');
  await expect(approvedRow).toContainText("Approved");
  await approvedRow.getByRole("button", { name: "Create merchant for process 00000339" }).click();
  await expect(page).toHaveURL(/5\.merchant_add_merchant_only_iso\.html\?source=onboarding&applicationId=APP-DEMO-NUVEI-01/);
  await expect(page.locator("#merchant-dba")).toHaveValue("Maple Street Coffee");
  await expect(page.locator("#merchant-contact")).toHaveValue("Sophie Martin");
  await expect(page.locator("#merchant-email")).toHaveValue("finance@maplestreetcoffee.ca");
  await expect(page.locator("#merchant-phone-code")).toHaveValue("+1");
  await expect(page.locator("#merchant-phone")).toHaveValue("416 555 0188");
  await expect(page.locator("#merchant-address1")).toHaveValue("128 King Street West");
  await expect(page.locator("#merchant-zip")).toHaveValue("M5H 1J9");
  await expect(page.locator("#merchant-city")).toHaveValue("Toronto");
  await expect(page.locator("#merchant-owner")).toHaveValue("Olivia Chen");
  await expect(page.locator("#merchant-country")).toHaveValue("Canada");
  await expect(page.locator("#merchant-currency")).toHaveValue("CAD");
  await expect(page.locator("#merchant-permissions")).toHaveValue("Merchant Admin");
  expect(await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-DEMO-NUVEI-01").status)).toBe("Approved");

  await page.locator("#merchant-dba").fill("Maple Street Coffee Downtown");
  await expect(page.locator(".prefill-note")).toHaveCount(0);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page).toHaveURL(/5\.merchant_manage_iso\.html\?createdMerchantId=/);
  await expect(page.locator("#createdMerchantBanner")).toHaveCount(0);
  const createdMerchantRow = page.locator("#merchantTableBody tr.merchant-row-created");
  await expect(createdMerchantRow).toContainText("Maple Street Coffee Downtown");
  await expect(createdMerchantRow).toContainText("00000339");
  await expect(createdMerchantRow).toContainText("Olivia Chen");

  const savedMerchant = await page.evaluate((key) => JSON.parse(localStorage.getItem(key))[0], PLATFORM_MERCHANTS_KEY);
  expect(savedMerchant).toMatchObject({
    applicationId: "APP-DEMO-NUVEI-01",
    dba: "Maple Street Coffee Downtown",
    processId: "00000339",
    permissions: "Merchant Admin",
    country: "Canada",
    currency: "CAD"
  });

  const created = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).find((item) => item.applicationId === "APP-DEMO-NUVEI-01"), APPLICATIONS_KEY);
  expect(created.status).toBe("Merchant Created");
  expect(created.mid).toBe("MID00000339");
  expect(created.merchantCreatedAt).toBeTruthy();
  expect(created.statusHistory.at(-1)).toMatchObject({ status: "Merchant Created", actor: "Platform" });
  expect(created.statusHistory.filter((event) => event.status === "Merchant Created")).toHaveLength(1);

  await page.goto("/5.merchant_add_merchant_only_iso.html?source=onboarding&applicationId=APP-DEMO-NUVEI-01");
  await expect(page.getByRole("alert")).toContainText("already been created");
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test("prefills Elavon business data without inventing an address", async ({ page }) => {
  await openCleanPage(page);
  const row = page.locator('#onboarding-rows tr[data-application-id="APP-LEGACY-02"]');
  await row.getByRole("button", { name: "Create merchant for process 00000328" }).click();
  await expect(page.locator("#merchant-dba")).toHaveValue("ceshi123213243234");
  await expect(page.locator("#merchant-email")).toHaveValue("uat2512003@nooboy.com");
  await expect(page.locator("#merchant-address1")).toHaveValue("");
  await expect(page.locator("#merchant-address2")).toHaveValue("");
  await expect(page.locator("#merchant-city")).toHaveValue("");
  await expect(page.locator("#merchant-state")).toHaveValue("");
  await expect(page.locator("#merchant-zip")).toHaveValue("");
  await expect(page.locator("#merchant-country")).toHaveValue("Ireland");
  await expect(page.locator("#merchant-currency")).toHaveValue("EUR");
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/38\.Merchant_onboard\.html$/);
  expect(await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-LEGACY-02").status)).toBe("Approved");
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
  expect((await page.locator(".registration-form").boundingBox()).width).toBeGreaterThan(1400);
  let sectionsBox = await page.locator(".application-sections").boundingBox();
  let actionsBox = await page.locator(".form-actions").boundingBox();
  expect(actionsBox.y - (sectionsBox.y + sectionsBox.height)).toBeGreaterThanOrEqual(16);
  expect(actionsBox.y - (sectionsBox.y + sectionsBox.height)).toBeLessThanOrEqual(32);

  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".application-sections").evaluate((grid) => getComputedStyle(grid).display)).toBe("block");
  expect(await page.locator(".merchant-details .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(2);
  expect(await page.locator(".application-setup .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(3);

  await page.setViewportSize({ width: 1200, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".application-sections").evaluate((grid) => getComputedStyle(grid).display)).toBe("block");
  expect(await page.locator(".merchant-details .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(2);
  expect(await page.locator(".application-setup .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(3);

  await page.setViewportSize({ width: 1024, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".application-sections").evaluate((grid) => getComputedStyle(grid).display)).toBe("block");
  expect(await page.locator(".merchant-details .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(2);
  expect(await page.locator(".application-setup .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(3);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".application-sections").evaluate((grid) => getComputedStyle(grid).display)).toBe("block");
  expect(await page.locator(".merchant-details .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
  expect(await page.locator(".application-setup .form-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
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

  await page.goto("/38.Merchant_onboarding_progress.html?applicationId=APP-DEMO-NUVEI-01");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator(".progress-steps")).toBeVisible();

  await page.goto(ONBOARDING_URL);
  await page.getByRole("button", { name: "Share process 00000339" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/5.merchant_add_merchant_only_iso.html");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".wizard-panel .form-grid.three").first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(3);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".wizard-panel .form-grid.three").first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
  expect(consoleErrors).toEqual([]);
});
