const { test, expect } = require("@playwright/test");

const NUVEI_URL = "/27.INTL_PSP_merchant_lead_nuvei_simplified.html";

async function openCleanForm(page) {
  await page.goto(NUVEI_URL);
  await page.evaluate(() => localStorage.removeItem("paywizard-nuvei-draft"));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nuvei Merchant Registration" })).toBeVisible();
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
    if (type === "date") await input.fill("2026-08-12");
    else if (type === "email") await input.fill(`merchant${index}@example.com`);
    else if (type === "number") {
      if ((await input.getAttribute("name")) === "additionalOwnerCount") {
        await input.fill("0");
        continue;
      }
      const minimum = Number(await input.getAttribute("min"));
      await input.fill(String(Number.isFinite(minimum) ? Math.max(minimum, 1) : 1));
    } else if ((await input.getAttribute("name")) === "businessDuration") {
      await input.fill("2 Years, 3 months");
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
      name: `verification-${index}.png`,
      mimeType: "image/png",
      buffer: Buffer.from("nuvei-test-file")
    });
  }
}

test("matches the six source sections and removes non-source fields", async ({ page }) => {
  await openCleanForm(page);

  await expect(page.locator(".form-section h2")).toHaveText([
    "Legal Business Information",
    "DBA Information",
    "Owners or Officers",
    "Electronic Debit / Credit Authorization (Banking Information)",
    "Terminal & Vending Machine Information",
    "Supporting Documents"
  ]);

  for (const name of [
    "authorizedContact", "statementEmail", "merchantCustomerServicePhone", "federalRegistryNumber",
    "additionalOwnerCount", "terminalsToOnboard", "snNumber", "dispatchDate", "arrivalDate",
    "connectivity[]", "averageTransactionAmount", "vendingProducts", "vendingMachinePhoto",
    "businessStructure", "onlineBusinessValidation"
  ]) {
    await expect(page.locator(`[name="${name}"]`).first()).toBeAttached();
  }

  for (const name of [
    "monthlyVolume", "highestTicket", "cardPresentPercent", "onlinePercent", "riskProgramName",
    "processorName", "proofOfBusiness", "additionalInformation", "certifyAccuracy", "authorizeReview"
  ]) {
    await expect(page.locator(`[name="${name}"]`)).toHaveCount(0);
  }
  await expect(page.getByText("Government ID Type", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Government ID Number", { exact: true })).toHaveCount(0);
});

test("uses the source requiredness and preserves confirmed dropdown values", async ({ page }) => {
  await openCleanForm(page);

  for (const name of ["timeZone", "owners[0][title]", "snNumber", "arrivalDate"]) {
    await expect(page.locator(`[name="${name}"]`)).not.toHaveAttribute("required", "");
  }
  await expect(page.locator('[name="owners[0][residencePhone]"]')).toHaveAttribute("required", "");
  await expect(page.locator('[name="owners[0][cellPhone]"]')).toHaveAttribute("required", "");
  await expect(page.locator('[name="bankProvince"]')).toHaveAttribute("type", "text");
  await expect(page.locator('select[name="bankProvince"]')).toHaveCount(0);
  await expect(page.locator('[name="snNumber"]')).toHaveAttribute("placeholder", "WizarPOS 16-digit Serial#");
  await expect(page.locator("#sn-number-help")).toContainText("WizarPOS 16-digit Serial#");

  await expect(page.locator('[name="ownershipType"] option')).toHaveText([
    "Please Select", "Sole Proprietorship", "Partnership", "Publicly Traded", "Not for Profit",
    "Limited Liability", "Privately Held", "Government", "International Organization"
  ]);
  await expect(page.locator('[name="timeZone"] option')).toHaveText([
    "Please Select", "Atlantic Time Zone", "Canada Central Time Zone (Saskatchewan)",
    "Central Time Zone", "Eastern Time Zone", "Mountain Time Zone", "Newfoundland Time Zone", "Pacific Time Zone"
  ]);
  await expect(page.locator('[name="owners[0][title]"] option')).toHaveText([
    "Please Select", "Owner", "Co owner", "President", "Legal contact", "Secretary/Treasurer", "Partner",
    "General Manager", "Administrator", "Vice President", "Director", "CEO", "Corporate Office Title", "Principal"
  ]);
});

test("builds and removes required additional-owner rows from the count", async ({ page }) => {
  await openCleanForm(page);

  await expect(page.locator("#configurable-list-title")).toHaveText("Configurable list*");
  await expect(page.locator(".configurable-list #additional-owner-count")).toHaveCount(1);
  await expect(page.locator("#additional-owners-list")).toBeEmpty();
  await page.locator("#additional-owner-count").fill("2");
  await expect(page.locator("[data-additional-owner-index]")).toHaveCount(2);
  await expect(page.locator('[name="additionalOwners[1][fullName]"]')).toHaveAttribute("required", "");
  await expect(page.locator('[name="additionalOwners[1][residencePhone]"]')).toHaveAttribute("required", "");

  await page.locator("#additional-owner-count").fill("1");
  await expect(page.locator("[data-additional-owner-index]")).toHaveCount(1);
  await expect(page.locator('[name="additionalOwners[1][fullName]"]')).toHaveCount(0);
});

test("requires one connectivity option and accepts a complete source-aligned form", async ({ page }) => {
  await openCleanForm(page);

  expect(await page.locator('input[name="connectivity[]"]').first().evaluate((input) => input.validationMessage)).toContain("Select at least one");
  await fillRequiredForm(page);

  await expect(page.locator('[name="timeZone"]')).toHaveValue("");
  await expect(page.locator('[name="owners[0][title]"]')).toHaveValue("");
  await expect(page.locator('[name="snNumber"]')).toHaveValue("");
  await expect(page.locator('[name="arrivalDate"]')).toHaveValue("");
  const invalidControls = await page.locator("#nuvei-form").evaluate((form) => Array.from(form.querySelectorAll(":invalid")).map((control) => ({ name: control.name, value: control.value, message: control.validationMessage })));
  expect(invalidControls).toEqual([]);

  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(page.locator("#success-title")).toHaveText("Application ready");
});

test("saves and restores new text, choices, and dynamic-owner fields", async ({ page }) => {
  await openCleanForm(page);

  await page.locator('[name="authorizedContact"]').fill("Alex Merchant");
  await page.locator("#additional-owner-count").fill("1");
  await page.locator('[name="additionalOwners[0][fullName]"]').fill("Jamie Owner");
  await page.locator('input[name="connectivity[]"][value="Ethernet"]').check();
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.locator("#success-title")).toHaveText("Draft saved");

  await page.reload();
  await expect(page.locator('[name="authorizedContact"]')).toHaveValue("Alex Merchant");
  await expect(page.locator("#additional-owner-count")).toHaveValue("1");
  await expect(page.locator('[name="additionalOwners[0][fullName]"]')).toHaveValue("Jamie Owner");
  await expect(page.locator('input[name="connectivity[]"][value="Ethernet"]')).toBeChecked();
  await expect(page.locator('input[name="vendingMachinePhoto"]')).toHaveValue("");
});

test("has no horizontal overflow on desktop or mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCleanForm(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".field-grid").first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
});
