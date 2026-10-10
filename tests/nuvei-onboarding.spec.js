const { test, expect } = require("@playwright/test");

const NUVEI_URL = "/27.Merchant_onboard_nuvei.html";

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

test("matches the seven confirmed sections and removes non-source fields", async ({ page }) => {
  await openCleanForm(page);

  await expect(page.locator(".form-section h2")).toHaveText([
    "Legal Business Information",
    "DBA Information",
    "Owners or Officers",
    "Electronic Debit / Credit Authorization (Banking Information)",
    "Terminal & Vending Machine Information",
    "Supporting Documents",
    "Additional Supporting Documents"
  ]);

  for (const name of [
    "authorizedContact", "statementEmail", "merchantCustomerServicePhone", "federalRegistryNumber",
    "additionalOwnerCount", "terminalsToOnboard", "snNumber", "dispatchDate", "arrivalDate",
    "connectivity[]", "averageTransactionAmount", "vendingProducts", "vendingMachinePhoto",
    "businessStructure", "onlineBusinessValidation", "terminalType", "machinePlacementAddress",
    "proofOfInventory", "proofOfPurchase", "businessLocationLease", "additionalSupportingDocuments"
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
  await page.locator('[name="terminalType"][value="Unattended"]').check();
  await page.locator('[name="machinePlacementAddress"]').fill("100 Main Street, Toronto, ON — 3 machines");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.locator("#success-title")).toHaveText("Draft saved");

  await page.reload();
  await expect(page.locator('[name="authorizedContact"]')).toHaveValue("Alex Merchant");
  await expect(page.locator("#additional-owner-count")).toHaveValue("1");
  await expect(page.locator('[name="additionalOwners[0][fullName]"]')).toHaveValue("Jamie Owner");
  await expect(page.locator('input[name="connectivity[]"][value="Ethernet"]')).toBeChecked();
  await expect(page.locator('[name="terminalType"][value="Unattended"]')).toBeChecked();
  await expect(page.locator('[name="machinePlacementAddress"]')).toHaveValue("100 Main Street, Toronto, ON — 3 machines");
  await expect(page.locator('input[name="vendingMachinePhoto"]')).toHaveValue("");
});

const documentFile = (name) => ({ name, mimeType: "application/pdf", buffer: Buffer.from("test document") });

test("requires placement and evidence for both mutually exclusive terminal types", async ({ page }) => {
  await openCleanForm(page);
  await expect(page.locator('[name="terminalType"]:checked')).toHaveCount(0);
  for (const type of ["Attended", "Unattended"]) {
    await page.locator(`[name="terminalType"][value="${type}"]`).check();
    await expect(page.locator('[name="terminalType"]:checked')).toHaveCount(1);
    for (const name of ["machinePlacementAddress", "proofOfInventory", "proofOfPurchase", "businessLocationLease"]) {
      const input = page.locator(`#banking [name="${name}"]`);
      await expect(input).toHaveAttribute("required", "");
      expect(await input.evaluate((control) => control.closest(".field").getBoundingClientRect().height)).toBeGreaterThan(0);
      expect(await input.evaluate((control) => control.checkValidity())).toBeFalsy();
    }
  }
  await expect(page.locator('input[type="file"][multiple]')).toHaveCount(7);
  await expect(page.locator('[name="additionalSupportingDocuments"]')).not.toHaveAttribute("required", "");
  await expect(page.locator("#documents strong").first()).toHaveText("Void Check / Bank Letter*");
});

test("appends files, rejects the eleventh without losing selections, and removes individually", async ({ page }) => {
  await openCleanForm(page);
  const input = page.locator('[name="proofOfInventory"]');
  const upload = page.locator(".onboarding-upload").filter({ has: input });
  await input.setInputFiles([documentFile("invoice.pdf"), documentFile("receipt.pdf")]);
  await input.setInputFiles(Array.from({ length: 8 }, (_, index) => documentFile(`proof-${index}.pdf`)));
  await expect(upload.locator("li")).toHaveCount(10);
  await input.setInputFiles(documentFile("eleventh.pdf"));
  await expect(upload.locator("li")).toHaveCount(10);
  await expect(upload.locator('[role="alert"]')).toContainText("up to 10 files");
  await expect(upload.locator('[role="alert"]')).toBeFocused();
  expect(await input.evaluate((control) => control.files.length)).toBe(10);
  const messageBox = await upload.locator('[role="alert"]').boundingBox();
  expect(messageBox.y).toBeGreaterThan(66);
  expect(messageBox.y + messageBox.height).toBeLessThan(1000);
  await page.screenshot({ path: "artifacts/nuvei-upload-limit-2026-10-10.png" });
  await upload.getByRole("button", { name: "Remove invoice.pdf", exact: true }).click();
  await expect(upload.locator("li")).toHaveCount(9);
  await expect(upload.locator('[role="alert"]')).toBeHidden();
  await input.setInputFiles(documentFile("replacement.pdf"));
  await expect(upload.locator("li")).toHaveCount(10);
  await input.setInputFiles(documentFile("unsupported.exe"));
  await expect(upload.locator('[role="alert"]')).toContainText("not supported");
  await expect(upload.locator("li")).toHaveCount(10);
});

test("supports dropping files and restoring requiredness after removing the last file", async ({ page }) => {
  await openCleanForm(page);
  const upload = page.locator(".onboarding-upload").filter({ has: page.locator('[name="proofOfPurchase"]') });
  await upload.locator(".upload-card").evaluate((card) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["invoice"], "purchase.pdf", { type: "application/pdf" }));
    card.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  });
  await expect(upload.locator("li")).toHaveText("purchase.pdfclose");
  expect(await upload.locator("input").evaluate((input) => input.checkValidity())).toBeTruthy();
  await upload.getByRole("button", { name: "Remove purchase.pdf" }).click();
  await expect(upload.locator("li")).toHaveCount(0);
  expect(await upload.locator("input").evaluate((input) => input.checkValidity())).toBeFalsy();
});

async function openPublicDraft(page) {
  await openCleanForm(page);
  await page.evaluate(() => {
    const Store = window.PaywizardOnboardingStore;
    const draft = Store.demos()[0];
    draft.applicationId = "APP-TEST-NUVEI-MULTI";
    draft.status = "Awaiting Merchant";
    draft.documents = {};
    draft.formData = {};
    draft.review = Store.createReview("Nuvei");
    Store.upsertApplication(draft);
  });
  await page.goto("/38.Merchant_onboard_nuvei_public.html?applicationId=APP-TEST-NUVEI-MULTI");
  const frame = page.frameLocator("#source-frame");
  await expect(frame.locator("#nuvei-form")).toBeVisible();
  return frame;
}

test("persists restored-file additions and deletions and keeps review and view read-only", async ({ page }) => {
  let frame = await openPublicDraft(page);
  const input = () => frame.locator('[name="additionalSupportingDocuments"]');
  await input().setInputFiles([documentFile("notes-a.pdf"), documentFile("notes-b.pdf")]);
  await frame.locator('[name="proofOfInventory"]').setInputFiles(documentFile("inventory.pdf"));
  await frame.getByRole("button", { name: "Save Draft" }).click();
  await page.reload();
  frame = page.frameLocator("#source-frame");
  const upload = () => frame.locator(".onboarding-upload").filter({ has: input() });
  await expect(upload().locator("li")).toHaveCount(2);
  const requiredUpload = frame.locator(".onboarding-upload").filter({ has: frame.locator('[name="proofOfInventory"]') });
  await expect(requiredUpload.locator("input")).not.toHaveAttribute("required", "");
  await requiredUpload.getByRole("button", { name: "Remove inventory.pdf" }).click();
  await expect(requiredUpload.locator("input")).toHaveAttribute("required", "");
  expect(await requiredUpload.locator("input").evaluate((control) => control.checkValidity())).toBeFalsy();
  await input().setInputFiles(documentFile("notes-c.pdf"));
  await expect(upload().locator("li")).toHaveCount(3);
  await upload().getByRole("button", { name: "Remove notes-b.pdf" }).click();
  await frame.getByRole("button", { name: "Save Draft" }).click();
  for (const mode of ["review", "view"]) {
    await page.goto(`${NUVEI_URL}?mode=${mode}&applicationId=APP-TEST-NUVEI-MULTI`);
    const readonlyUpload = page.locator("#additional-documents .onboarding-upload");
    await expect(readonlyUpload.locator("li")).toHaveCount(2);
    await expect(readonlyUpload.locator("li").first()).toContainText("notes-a.pdf");
    await expect(readonlyUpload.locator("li").last()).toContainText("notes-c.pdf");
    await expect(readonlyUpload.locator("input")).toBeDisabled();
    await expect(readonlyUpload.locator("button").first()).toBeHidden();
  }
  await page.goto("/38.Merchant_onboard_nuvei_public.html?applicationId=APP-TEST-NUVEI-MULTI");
  frame = page.frameLocator("#source-frame");
  await upload().getByRole("button", { name: "Remove notes-a.pdf" }).click();
  await upload().getByRole("button", { name: "Remove notes-c.pdf" }).click();
  await frame.getByRole("button", { name: "Save Draft" }).click();
  await page.reload();
  await expect(upload().locator("li")).toHaveCount(0);
});

test("locates public-frame errors and submits with the optional seventh upload empty", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const frame = await openPublicDraft(page);
  await fillRequiredForm(frame);
  await frame.locator('[name="machinePlacementAddress"]').fill("");
  await frame.getByRole("button", { name: "Submit Application" }).click();
  const error = frame.locator("#machine-placement-address-error");
  await expect(error).toBeFocused();
  const bounds = await error.boundingBox();
  expect(bounds.y).toBeGreaterThan(0);
  expect(bounds.y + bounds.height).toBeLessThan(1000);
  await frame.locator('[name="machinePlacementAddress"]').fill("100 Main Street, Toronto, ON — 3 machines");
  await frame.getByRole("button", { name: "Submit Application" }).click();
  await expect(frame.locator("#success-title")).toHaveText("Thank you — application received");
  await expect(frame.locator('[name="proofOfPurchase"]')).toBeDisabled();
  await expect(frame.getByRole("button", { name: "Remove verification-1.png" })).toBeHidden();
  const application = await page.evaluate(() => window.PaywizardOnboardingStore.findApplication("APP-TEST-NUVEI-MULTI"));
  expect(application.status).toBe("Merchant Submit");
  expect(application.formData.terminalType).toBe("Attended");
  expect(application.documents.additionalSupportingDocuments).toEqual([]);
  expect(Object.keys(application.review.sections)).toHaveLength(7);
});

test("records desktop banking and final-section visual evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1710, height: 1000 });
  await openCleanForm(page);
  await page.locator('.section-nav a[href="#banking"]').click();
  await page.locator("#banking").evaluate((section) => section.scrollIntoView({ block: "start", behavior: "instant" }));
  await expect(page.locator('.section-nav a[href="#banking"]')).toHaveClass("active");
  await page.screenshot({ path: "artifacts/nuvei-banking-2026-10-10.png" });
  await page.locator('.section-nav a[href="#additional-documents"]').click();
  await page.locator("#additional-documents").evaluate((section) => section.scrollIntoView({ block: "end", behavior: "instant" }));
  await expect(page.locator('.section-nav a[href="#additional-documents"]')).toHaveClass("active");
  await expect(page.locator("#save-draft")).toHaveCSS("min-height", "40px");
  await expect(page.locator('.form-actions button[type="submit"]')).toHaveCSS("min-height", "40px");
  await page.screenshot({ path: "artifacts/nuvei-supporting-documents-2026-10-10.png" });
});

test("has no horizontal overflow on desktop or mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCleanForm(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".field-grid").first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
});
