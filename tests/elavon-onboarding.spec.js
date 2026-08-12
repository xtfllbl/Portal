const { test, expect } = require("@playwright/test");

const ELAVON_URL = "/27.INTL_PSP_merchant_lead_elavon_simplified.html";

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
    "siretCode", "businessStructure", "totalBeneficialOwners", "additionalOwnerCount",
    "signatoryFirstName", "signatoryLastName", "signatoryEmail", "signatoryCellCountryCode", "signatoryCellPhone",
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
  for (const name of ["siretCode", "totalBeneficialOwners", "ownerSignatoryPassports", "ownerSignatorySecondKyc", "bankTransferReceipt", "annualTransactionCashCards", "annualTransactionCards"]) {
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
    "* Must be valid, cannot be expired * Information must be clear"
  ]);
  await expect(secondKycField.locator('.upload-title')).toHaveText("Please Upload 2nd KYC for all the Owner/s and Signatory's*");
  await expect(secondKycField.locator('.upload-requirements span')).toHaveText([
    "* 2nd KYC is a document confirming personal residential address of each owner/s UBOs (e.g., any utility bill e.g.",
    "electricity bill or phone bill etc. that clearly shows personal residential address) * Must be dated anytime within",
    "last 3 months"
  ]);
  await expect(receiptField.locator('.upload-title')).toHaveText("Bank Transfer Receipt*");
  await expect(receiptField.locator('.upload-requirements span')).toHaveText([
    "* Must be dated within last 3 months (amount can be even 0)"
  ]);
  await expect(page.locator('.upload-stack > .upload-field')).toHaveCount(2);
  await expect(page.locator('[data-file-name]')).toHaveText([
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

  await page.locator("#additional-owner-count").fill("1");
  await expect(page.locator("[data-additional-owner-index]")).toHaveCount(1);
  await expect(page.locator('[name="additionalOwners[1][firstName]"]')).toHaveCount(0);
});

test("requires connectivity and accepts a complete Elavon form", async ({ page }) => {
  await openCleanForm(page);

  expect(await page.locator('input[name="connectivity[]"]').first().evaluate((input) => input.validationMessage)).toContain("Select at least one");
  await fillRequiredForm(page);

  await expect(page.locator('[name="ownerSignatoryPassports"]').locator('xpath=ancestor::label').locator('[data-file-name]')).toHaveText("elavon-verification-0.png");
  await expect(page.locator('[name="bankTransferReceipt"]').locator('xpath=ancestor::label').locator('[data-file-name]')).toHaveText("elavon-verification-2.png");

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
  await page.locator('input[name="connectivity[]"][value="Ethernet"]').check();
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.locator("#success-title")).toHaveText("Draft saved");

  await page.reload();
  await expect(page.locator('[name="registeredBusinessName"]')).toHaveValue("Elavon Test Merchant");
  await expect(page.locator("#additional-owner-count")).toHaveValue("1");
  await expect(page.locator('[name="additionalOwners[0][firstName]"]')).toHaveValue("Jamie");
  await expect(page.locator('input[name="connectivity[]"][value="Ethernet"]')).toBeChecked();
  await expect(page.locator('input[name="ownerSignatoryPassports"]')).toHaveValue("");
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
