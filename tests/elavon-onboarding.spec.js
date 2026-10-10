const { test, expect } = require("@playwright/test");

const ELAVON_URL = "/27.Merchant_onboard_elavon.html";

async function openCleanForm(page) {
  await page.goto(ELAVON_URL);
  await page.evaluate(() => localStorage.removeItem("paywizard-elavon-draft"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Elavon Merchant Registration" })).toBeVisible();
}

async function fillRequiredForm(page) {
  const requiredSelects = page.locator("select[required]");
  for (let index = 0; index < await requiredSelects.count(); index += 1) {
    await requiredSelects.nth(index).selectOption({ index: 1 });
  }

  const requiredInputs = page.locator("input[required]:not([type=radio]):not([type=checkbox]):not([type=file])");
  for (let index = 0; index < await requiredInputs.count(); index += 1) {
    const input = requiredInputs.nth(index);
    const type = await input.getAttribute("type");
    const name = await input.getAttribute("name");
    if (type === "date") await input.fill("2026-08-12");
    else if (type === "email") await input.fill(`elavon${index}@example.com`);
    else if (type === "number") {
      if (name === "additionalOwnerCount") {
        await input.fill("0");
        continue;
      }
      const minimum = Number(await input.getAttribute("min"));
      await input.fill(String(Number.isFinite(minimum) ? Math.max(minimum, 1) : 1));
    } else if (name === "siretCode") {
      await input.fill("N/A");
    } else {
      await input.fill("Test value");
    }
  }

  const requiredTextareas = page.locator("textarea[required]");
  for (let index = 0; index < await requiredTextareas.count(); index += 1) {
    await requiredTextareas.nth(index).fill("Test value");
  }

  const requiredRadioNames = await page.locator("input[type=radio][required]").evaluateAll((radios) => [...new Set(radios.map((radio) => radio.name))]);
  for (const name of requiredRadioNames) {
    await page.locator(`input[type=radio][name="${name}"]`).first().check();
  }

  await page.locator('input[name="connectivity[]"]').first().check();
  const files = page.locator("input[type=file][required]");
  for (let index = 0; index < await files.count(); index += 1) {
    await files.nth(index).setInputFiles({
      name: `elavon-verification-${index}.png`,
      mimeType: "image/png",
      buffer: Buffer.from("elavon-test-file")
    });
  }
}

test("matches the six Elavon source sections and fields", async ({ page }) => {
  await openCleanForm(page);

  await expect(page.locator(".form-section h2")).toHaveText([
    "Business Information",
    "Beneficial Owner/s",
    "Signatory",
    "Banking Information",
    "Operation",
    "Contact Person Info"
  ]);

  for (const name of [
    "ownershipType", "registeredBusinessName", "dbaName", "vatTaxId", "companyEmail", "companyPhone",
    "companyRegistrationNo", "companyRegistrationAddress", "companyRegistrationDate", "businessRegistrationCertificate",
    "siretCode", "businessStructure", "totalBeneficialOwners", "additionalOwnerCount",
    "signatoryFirstName", "signatoryLastName", "signatoryEmail", "signatoryCellCountryCode", "signatoryCellPhone",
    "signatoryResidentialAddress", "signatoryZipCode", "signatoryCity",
    "ownerSignatoryPassports", "ownerSignatorySecondKyc", "accountNumber", "beneficiaryName", "bankTransferReceipt",
    "terminalsToOnboard", "snNumber", "dispatchDate", "arrivalDate", "previousProcessor", "vendingProducts",
    "averageTransactionAmount", "annualTransactionCashCards", "annualTransactionCards", "connectivity[]",
    "authorizedContact", "statementEmail", "merchantCustomerServicePhone"
  ]) {
    await expect(page.locator(`[name="${name}"]`).first()).toBeAttached();
  }

  for (const name of ["legalCivic", "bankProvince", "vendingMachinePhoto", "voidCheck", "driversLicense", "onlineBusinessValidation"]) {
    await expect(page.locator(`[name="${name}"]`)).toHaveCount(0);
  }
});

test("uses source requiredness and confirmed dropdown values", async ({ page }) => {
  await openCleanForm(page);

  for (const name of ["owners[0][title]", "snNumber", "arrivalDate"]) {
    await expect(page.locator(`[name="${name}"]`)).not.toHaveAttribute("required", "");
  }
  for (const name of ["siretCode", "totalBeneficialOwners", "ownerSignatoryPassports", "ownerSignatorySecondKyc", "bankTransferReceipt", "annualTransactionCashCards", "annualTransactionCards", "companyRegistrationNo", "companyRegistrationAddress", "companyRegistrationDate", "signatoryResidentialAddress", "signatoryZipCode", "signatoryCity", "businessRegistrationCertificate"]) {
    await expect(page.locator(`[name="${name}"]`)).toHaveAttribute("required", "");
  }
  await expect(page.locator('[name="snNumber"]')).toHaveAttribute("placeholder", "WizarPOS 16-digit Serial#");
  await expect(page.locator('[name="ownershipType"] option')).toHaveText([
    "Please Select", "Sole Proprietorship", "Partnership", "Publicly Traded", "Not for Profit",
    "Limited Liability", "Privately Held", "Government", "International Organization"
  ]);
  await expect(page.locator('[name="owners[0][title]"] option')).toHaveText([
    "Please Select", "Owner", "Co owner", "President", "Legal contact", "Secretary/Treasurer", "Partner",
    "General Manager", "Administrator", "Vice President", "Director", "CEO", "Corporate Office Title", "Principal"
  ]);
  await expect(page.locator('input[name="businessStructure"]')).toHaveCount(2);
});

test("keeps every upload requirement with its own file control and line breaks", async ({ page }) => {
  await openCleanForm(page);

  const passportField = page.locator('[name="ownerSignatoryPassports"]').locator('xpath=ancestor::div[contains(@class, "upload-field")]');
  const secondKycField = page.locator('[name="ownerSignatorySecondKyc"]').locator('xpath=ancestor::div[contains(@class, "upload-field")]');
  const receiptField = page.locator('[name="bankTransferReceipt"]').locator('xpath=ancestor::div[contains(@class, "upload-field")]');

  await expect(passportField.locator('.upload-title')).toHaveText("Please Upload All The Owner/s and Signatory's Passport*");
  await expect(passportField.locator('.upload-requirements span')).toHaveText([
    "* Must be valid, cannot be expired",
    "* Information must be clear"
  ]);
  await expect(secondKycField.locator('.upload-title')).toHaveText("Please Upload 2nd KYC for all the Owner/s and Signatory's*");
  await expect(secondKycField.locator('.upload-requirements span')).toHaveText([
    "* 2nd KYC is a document confirming personal residential address of each owner/s UBOs (e.g., any utility bill e.g.electricity bill or phone bill etc. that clearly shows personal residential address)",
    "* Must be dated anytime within last 3 months"
  ]);
  await expect(receiptField.locator('.upload-title')).toHaveText("Bank Transfer Receipt*");
  await expect(receiptField.locator('.upload-requirements span')).toHaveText([
    "* Must be dated within last 3 months (amount can be even 0)"
  ]);
  await expect(page.locator('.upload-stack > .upload-field')).toHaveCount(2);
  await expect(page.locator('[data-file-name]')).toHaveText([
    "Drag and drop files here",
    "Drag and drop files here",
    "Drag and drop files here",
    "Drag and drop files here"
  ]);
});

test("creates the requested number of required additional beneficial owners", async ({ page }) => {
  await openCleanForm(page);

  await expect(page.locator(".configurable-list #additional-owner-count")).toHaveCount(1);
  await page.locator("#additional-owner-count").fill("2");
  await expect(page.locator("[data-additional-owner-index]")).toHaveCount(2);
  await expect(page.locator('[name="additionalOwners[1][firstName]"]')).toHaveAttribute("required", "");
  await expect(page.locator('[name="additionalOwners[1][phone]"]')).toHaveAttribute("required", "");
  await expect(page.locator('[name="additionalOwners[1][title]"]')).not.toHaveAttribute("required", "");
  await expect(page.locator('[name="additionalOwners[1][fullResidentialAddress]"]')).toHaveAttribute("required", "");
  await expect(page.locator('[name="owners[0][fullResidentialAddress]"]')).toHaveCount(0);

  await page.locator("#additional-owner-count").fill("1");
  await expect(page.locator("[data-additional-owner-index]")).toHaveCount(1);
  await expect(page.locator('[name="additionalOwners[1][firstName]"]')).toHaveCount(0);
});

test("requires connectivity and accepts a complete Elavon form", async ({ page }) => {
  await openCleanForm(page);

  expect(await page.locator('input[name="connectivity[]"]').first().evaluate((input) => input.validationMessage)).toContain("Select at least one");
  await fillRequiredForm(page);

  await expect(page.locator('#signatory .onboarding-file-list').first()).toContainText("elavon-verification-1.png");
  await expect(page.locator('#banking .onboarding-file-list')).toContainText("elavon-verification-3.png");

  await expect(page.locator('[name="owners[0][title]"]')).toHaveValue("");
  await expect(page.locator('[name="snNumber"]')).toHaveValue("");
  await expect(page.locator('[name="arrivalDate"]')).toHaveValue("");
  const invalidControls = await page.locator("#elavon-form").evaluate((form) => Array.from(form.querySelectorAll(":invalid")).map((control) => control.name));
  expect(invalidControls).toEqual([]);

  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(page.locator("#success-title")).toHaveText("Application ready");
});

test("saves and restores Elavon draft data while excluding files", async ({ page }) => {
  await openCleanForm(page);

  await page.locator('[name="registeredBusinessName"]').fill("Elavon Test Merchant");
  await page.locator("#additional-owner-count").fill("1");
  await page.locator('[name="additionalOwners[0][firstName]"]').fill("Jamie");
  await page.locator('[name="additionalOwners[0][fullResidentialAddress]"]').fill("10 Main Street, Dublin, D02 AB12, Ireland");
  await page.locator('[name="companyRegistrationNo"]').fill("REG-123456");
  await page.locator('[name="companyRegistrationAddress"]').fill("20 Market Street, Dublin, Ireland");
  await page.locator('[name="companyRegistrationDate"]').fill("May 2010");
  await page.locator('[name="signatoryResidentialAddress"]').fill("30 Main Street, Dublin, Ireland");
  await page.locator('[name="signatoryZipCode"]').fill("D02 XY34");
  await page.locator('[name="signatoryCity"]').fill("Dublin");
  await page.locator('input[name="connectivity[]"][value="Ethernet"]').check();
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.locator("#success-title")).toHaveText("Draft saved");

  await page.reload();
  await expect(page.locator('[name="registeredBusinessName"]')).toHaveValue("Elavon Test Merchant");
  await expect(page.locator("#additional-owner-count")).toHaveValue("1");
  await expect(page.locator('[name="additionalOwners[0][firstName]"]')).toHaveValue("Jamie");
  await expect(page.locator('[name="additionalOwners[0][fullResidentialAddress]"]')).toHaveValue("10 Main Street, Dublin, D02 AB12, Ireland");
  await expect(page.locator('[name="companyRegistrationNo"]')).toHaveValue("REG-123456");
  await expect(page.locator('[name="companyRegistrationAddress"]')).toHaveValue("20 Market Street, Dublin, Ireland");
  await expect(page.locator('[name="companyRegistrationDate"]')).toHaveValue("May 2010");
  await expect(page.locator('[name="signatoryResidentialAddress"]')).toHaveValue("30 Main Street, Dublin, Ireland");
  await expect(page.locator('[name="signatoryZipCode"]')).toHaveValue("D02 XY34");
  await expect(page.locator('[name="signatoryCity"]')).toHaveValue("Dublin");
  await expect(page.locator('input[name="connectivity[]"][value="Ethernet"]')).toBeChecked();
  await expect(page.locator('input[name="ownerSignatoryPassports"]')).toHaveValue("");
});

function documentFile(name) {
  return { name, mimeType: "application/pdf", buffer: Buffer.from("elavon-test-document") };
}

test("accepts manually entered registration dates without format or future restrictions", async ({ page }) => {
  await openCleanForm(page);
  const date = page.locator('[name="companyRegistrationDate"]');
  await expect(date).toHaveAttribute("type", "text");
  for (const value of ["May 2010", "2035/12/31"]) {
    await date.fill(value);
    expect(await date.evaluate((input) => input.checkValidity())).toBeTruthy();
  }
  await date.fill("");
  expect(await date.evaluate((input) => input.checkValidity())).toBeFalsy();
});

test("applies the ten-file limit to each Elavon upload and preserves files after rejected batches", async ({ page }) => {
  await openCleanForm(page);
  for (const name of ["businessRegistrationCertificate", "ownerSignatoryPassports", "ownerSignatorySecondKyc", "bankTransferReceipt"]) {
    const input = page.locator(`[name="${name}"]`);
    const upload = page.locator(".onboarding-upload").filter({ has: input });
    await expect(input).toHaveAttribute("multiple", "");
    expect(await input.evaluate((control) => control.checkValidity())).toBeFalsy();
    await input.setInputFiles(documentFile("first.pdf"));
    await input.setInputFiles(Array.from({ length: 9 }, (_, index) => documentFile(`extra-${index}.pdf`)));
    await expect(upload.locator("li")).toHaveCount(10);
    await input.setInputFiles(documentFile("eleventh.pdf"));
    await expect(upload.locator('[role="alert"]')).toBeFocused();
    await expect(upload.locator('[role="alert"]')).toContainText("up to 10 files");
    await expect(upload.locator("li")).toHaveCount(10);
    await upload.getByRole("button", { name: "Remove first.pdf" }).click();
    await input.setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
    await expect(upload.locator('[role="alert"]')).toContainText("is not supported");
    await expect(upload.locator("li")).toHaveCount(9);
    while (await upload.locator("li").count()) await upload.locator("button").first().click();
    expect(await input.evaluate((control) => control.checkValidity())).toBeFalsy();
  }
});

async function openPublicDraft(page) {
  await openCleanForm(page);
  await page.evaluate(() => {
    const Store = window.PaywizardOnboardingStore;
    const draft = Store.demos()[1];
    draft.applicationId = "APP-TEST-ELAVON-MULTI";
    draft.status = "Awaiting Merchant";
    draft.documents = {};
    draft.formData = {};
    draft.review = Store.createReview("Elavon");
    Store.upsertApplication(draft);
  });
  await page.goto("/38.Merchant_onboard_elavon_public.html?applicationId=APP-TEST-ELAVON-MULTI");
  const frame = page.frameLocator("#source-frame");
  await expect(frame.locator("#elavon-form")).toBeVisible();
  return frame;
}

test("restores certificate metadata, counts saved files in the limit and locks review and view", async ({ page }) => {
  let frame = await openPublicDraft(page);
  await frame.locator('[name="companyRegistrationDate"]').fill("May 2010");
  await frame.locator("#additional-owner-count").fill("1");
  await frame.locator('[name="additionalOwners[0][fullResidentialAddress]"]').fill("10 Main Street, Dublin, Ireland");
  const input = () => frame.locator('[name="businessRegistrationCertificate"]');
  const upload = () => frame.locator(".onboarding-upload").filter({ has: input() });
  await input().setInputFiles([documentFile("certificate.pdf"), documentFile("tax.pdf")]);
  await frame.getByRole("button", { name: "Save Draft" }).click();
  await page.reload();
  frame = page.frameLocator("#source-frame");
  await expect(upload().locator("li")).toHaveCount(2);
  expect(await input().evaluate((control) => control.checkValidity())).toBeTruthy();
  await expect(frame.locator('[name="companyRegistrationDate"]')).toHaveValue("May 2010");
  await expect(frame.locator('[name="additionalOwners[0][fullResidentialAddress]"]')).toHaveValue("10 Main Street, Dublin, Ireland");
  await input().setInputFiles(Array.from({ length: 8 }, (_, index) => documentFile(`extra-${index}.pdf`)));
  await input().setInputFiles(documentFile("eleventh.pdf"));
  await expect(upload().locator("li")).toHaveCount(10);
  await upload().getByRole("button", { name: "Remove tax.pdf" }).click();
  await frame.getByRole("button", { name: "Save Draft" }).click();
  for (const mode of ["review", "view"]) {
    await page.goto(`${ELAVON_URL}?mode=${mode}&applicationId=APP-TEST-ELAVON-MULTI`);
    const readonly = page.locator("#business .onboarding-upload");
    await expect(readonly.locator("li")).toHaveCount(9);
    await expect(readonly.locator("input")).toBeDisabled();
    await expect(readonly.locator("button").first()).toBeHidden();
  }
});

test("reveals required certificate errors in the public frame and submits the new fields", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const frame = await openPublicDraft(page);
  await fillRequiredForm(frame);
  const upload = frame.locator("#business .onboarding-upload");
  await upload.locator("button").first().click();
  await frame.getByRole("button", { name: "Submit Application" }).click();
  const error = upload.locator('[role="alert"]');
  await expect(error).toBeFocused();
  const bounds = await error.boundingBox();
  expect(bounds.y).toBeGreaterThan(0);
  expect(bounds.y + bounds.height).toBeLessThan(1000);
  await frame.locator('[name="businessRegistrationCertificate"]').setInputFiles(documentFile("certificate.pdf"));
  await frame.getByRole("button", { name: "Submit Application" }).click();
  await expect(frame.locator("#success-title")).toHaveText("Thank you — application received");
  const application = await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-TEST-ELAVON-MULTI"));
  expect(application.status).toBe("Merchant Submit");
  expect(application.formData.companyRegistrationDate).toBe("Test value");
  expect(application.documents.businessRegistrationCertificate[0].name).toBe("certificate.pdf");
});

test("records desktop business, additional-owner and signatory visual evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1710, height: 1000 });
  await openCleanForm(page);
  await page.screenshot({ path: "artifacts/elavon-business-2026-10-10.png" });
  await page.locator("#additional-owner-count").fill("1");
  await page.locator("[data-additional-owner-index]").evaluate((card) => card.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.screenshot({ path: "artifacts/elavon-additional-owner-2026-10-10.png" });
  await page.locator("#signatory").evaluate((section) => section.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.screenshot({ path: "artifacts/elavon-signatory-2026-10-10.png" });
  await expect(page.locator("#save-draft")).toHaveCSS("min-height", "40px");
  await expect(page.locator('.form-actions button[type="submit"]')).toHaveCSS("min-height", "40px");
});

test("has no horizontal overflow on desktop or mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCleanForm(page);
  await page.locator("#additional-owner-count").fill("2");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".field-grid").first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
  await expect(page.locator(".upload-stack > .upload-field")).toHaveCount(2);
  expect(await page.locator(".upload-card").first().evaluate((card) => card.getBoundingClientRect().width)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "/tmp/elavon-onboarding-qa/implementation-mobile.png", fullPage: true });
});
