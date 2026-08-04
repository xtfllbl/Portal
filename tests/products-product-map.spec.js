const { test, expect } = require("@playwright/test");

const PRODUCTS_URL = "/35.product_management.html";
const PRODUCT_MAP_URL = "/1.terminalmanage_nayax.html?tab=productmap";
const PRODUCT_MAP_TEMPLATES_URL = "/36.product_map_templates.html";

async function resetCatalog(page) {
  await page.goto(PRODUCTS_URL);
  await page.evaluate(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();
}

async function createCategory(page, { name, code }) {
  await page.locator("#createButton").click();
  await page.getByRole("menuitem", { name: "Add Product Group" }).click();
  await expect(page.getByRole("heading", { name: "Add Product Group" })).toBeVisible();

  await page.locator("#f-name").fill(name);
  await page.locator("#f-code").fill(code);
  await page.locator('[data-action="save-editor"]').click();

  const category = page.locator("[data-category-id]", { hasText: name });
  await expect(category).toBeVisible();
  return category.getAttribute("data-category-id");
}

async function createProduct(page, { categoryId, name, productId, barcode, ean, dexName, price }) {
  await page.locator("#createButton").click();
  await page.getByRole("menuitem", { name: "Add Product", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Add Product", exact: true })).toBeVisible();
  await expect(page.locator("#f-categoryId")).toHaveValue(categoryId);

  await page.locator("#f-name").fill(name);
  await page.locator("#f-productId").fill(productId);
  await page.locator("#f-barcode").fill(barcode);
  await page.locator("#f-ean").fill(ean);
  await page.locator("#f-dexName").fill(dexName);
  await page.locator("#f-defaultRetailPrice").fill(price);
  await page.locator('[data-action="save-editor"]').click();

  const row = page.locator("tbody tr", { has: page.locator(".product-name", { hasText: name }) });
  await expect(row).toBeVisible();
  const editButton = row.getByRole("button", { name: "Edit" });
  return editButton.getAttribute("data-id");
}

async function addProductMapDraft(page) {
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.locator("#pmInlineAddButton").click();
  const draft = page.locator("#pmTableBody tr[data-inline-key]").first();
  await expect(draft).toBeVisible();
  return draft;
}

async function expectNoDocumentOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

test("creates a category and product, preselects the category, and cascades its default price into a new top Product Map row", async ({ page }) => {
  await resetCatalog(page);

  const categoryId = await createCategory(page, { name: "Cold Drinks", code: "91" });
  const productId = await createProduct(page, {
    categoryId,
    name: "Sparkling Water",
    productId: "PW-REG-001",
    barcode: "REG0001",
    ean: "1234567890123",
    dexName: "Spark Water",
    price: "4.25"
  });

  await page.goto(PRODUCT_MAP_URL);
  await expect(page.locator("#tab-productmap")).toBeVisible();
  const draft = await addProductMapDraft(page);

  const productInput = draft.locator('[data-inline-field="productId"]');
  const categoryInput = draft.locator('[data-inline-field="categoryId"]');
  await expect(productInput).toBeDisabled();
  await expect(categoryInput).toBeFocused();

  await categoryInput.fill("Cold Drinks");
  await categoryInput.press("Tab");
  const refreshedDraft = page.locator("#pmTableBody tr[data-inline-key]").first();
  const refreshedProductInput = refreshedDraft.locator('[data-inline-field="productId"]');
  await expect(refreshedProductInput).toBeEnabled();
  await expect(refreshedProductInput).toBeFocused();
  await refreshedProductInput.fill("Sparkling Water");
  await refreshedProductInput.press("Tab");

  await expect(refreshedDraft.locator('[data-inline-field="price"]')).toHaveValue("4.25");
  await expect(refreshedDraft.locator('[data-inline-field="onHand"]')).toHaveValue("0");
  await expect(refreshedDraft.locator(".pm-stock-track")).toHaveCount(0);
  await expect(refreshedDraft.locator('[data-inline-field="paCode"]')).toBeFocused();

  await refreshedDraft.locator('[data-inline-field="paCode"]').fill("Z9");
  await refreshedDraft.locator('[data-inline-field="mdbCode"]').fill("99");
  await refreshedDraft.locator('[data-inline-field="par"]').fill("10");
  await page.locator("#pmInlineSaveAll").click();

  const firstSavedRow = page.locator("#pmTableBody > tr[data-pm-id]").first();
  await expect(firstSavedRow).toContainText("Sparkling Water");
  await expect(firstSavedRow.locator("td").nth(1)).toContainText("Cold Drinks");
  await expect(firstSavedRow.locator('[data-pm-cell-field="paCode"] .pm-cell-edit-value')).toHaveText("Z9");
  await expect(firstSavedRow.locator('[data-pm-cell-field="mdbCode"] .pm-cell-edit-value')).toHaveText("99");
  await expect(firstSavedRow.locator("td").nth(5)).toContainText("0 / 10");
  await expect(firstSavedRow.locator('[data-pm-cell-field="price"] .pm-cell-edit-value')).toHaveText("4.25");
});

test("uses the simplified Product Group and Product editors and compact product list", async ({ page }) => {
  await resetCatalog(page);

  await page.locator("#createButton").click();
  await page.getByRole("menuitem", { name: "Add Product Group" }).click();
  await expect(page.getByRole("heading", { name: "Add Product Group" })).toBeVisible();
  await expect(page.locator("#f-name")).toHaveAttribute("required", "");
  await expect(page.locator("#f-operatorId, #f-status, #vatBody")).toHaveCount(0);
  await expect(page.getByText("VAT Details", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.locator("#createButton").click();
  await page.getByRole("menuitem", { name: "Add Product", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Add Product", exact: true })).toBeVisible();
  await expect(page.locator("#f-operatorId")).toHaveCount(0);
  await expect(page.locator("#f-categoryId")).toBeVisible();
  await expect(page.getByText("Nutrition", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Miscellaneous", { exact: true })).toHaveCount(0);
  const pricing = page.locator(".form-section", { has: page.getByRole("heading", { name: "Pricing" }) });
  await expect(pricing.locator("input").first()).toHaveAttribute("id", "f-defaultRetailPrice");
  await expect(pricing).not.toContainText("USD");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.locator("#productIdSearch")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Product ID" })).toHaveCount(0);
  await expect(page.locator("tbody .secondary")).toHaveCount(0);
  await expect(page.locator("tbody tr").first().locator("td").nth(2)).toHaveText(/^\d+\.\d{2}$/);
});

test("keeps Product Map validation outside the table, allows blank PA Code, and enforces two-digit MDB codes", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);

  const draft = await addProductMapDraft(page);
  await draft.locator('[data-inline-field="categoryId"]').fill("Snacks");
  await draft.locator('[data-inline-field="categoryId"]').press("Tab");
  const activeDraft = page.locator("#pmTableBody tr[data-inline-key]").first();
  await activeDraft.locator('[data-inline-field="productId"]').fill("Trail Mix");
  await activeDraft.locator('[data-inline-field="productId"]').press("Tab");
  await activeDraft.locator('[data-inline-field="paCode"]').fill("");
  await activeDraft.locator('[data-inline-field="mdbCode"]').fill("1x");
  await expect(activeDraft.locator('[data-inline-field="mdbCode"]')).toHaveValue("1");
  await activeDraft.locator('[data-inline-field="par"]').fill("10");
  await expect(activeDraft.locator('[data-inline-field="onHand"]')).toHaveValue("0");

  await page.locator("#pmInlineSaveAll").click();
  const summary = page.locator("#pmValidationSummary");
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("MDB Code must be exactly 2 digits.");
  await expect(summary).not.toContainText("PA Code");
  await expect(summary.locator("xpath=ancestor::table")).toHaveCount(0);
  await expect(activeDraft.locator('[data-inline-field="paCode"]')).not.toHaveClass(/is-invalid/);
  await expect(activeDraft.locator('[data-inline-field="mdbCode"]')).toHaveClass(/is-invalid/);
});

test("Add Multiple BINS modal focuses its quantity input, traps focus, closes with Escape, and restores the trigger", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);

  const mapButton = page.getByRole("button", { name: "Map", exact: true });
  await mapButton.click();
  const trigger = page.locator("#pmInlineBulkAddButton");
  await trigger.focus();
  await trigger.click();

  const modal = page.locator("#pmQuantityModal");
  await expect(modal).toHaveClass(/open/);
  await expect(page.locator("#pmQuantityInput")).toBeFocused();
  await expect(page.locator("#pmQuantityConfirm")).toHaveCSS("font-size", "13px");
  await expect(page.locator("#pmQuantityConfirm")).toHaveCSS("font-weight", "700");
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#pmQuantityConfirm")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(modal).not.toHaveClass(/open/);
  await expect(modal).toHaveAttribute("aria-hidden", "true");
  await expect(mapButton).toBeFocused();
});

test("a referenced product is archived instead of removed and remains visible only in its existing Product Map mapping", async ({ page }) => {
  await resetCatalog(page);

  await page.locator('[data-category-id="category-snacks"]').click();
  const trailMixRow = page.locator("tbody tr", { has: page.locator(".product-name", { hasText: "Trail Mix" }) });
  await trailMixRow.getByRole("button", { name: "Delete" }).click();

  const dialog = page.locator("#dialogLayer");
  await expect(dialog).toBeVisible();
  await expect(page.locator("#dialogTitle")).toHaveText("Set product to Inactive?");
  await expect(page.locator("#dialogMessage")).toContainText("Product Map");
  await page.locator("#dialogConfirm").click();

  const archivedRow = page.locator("tbody tr", { has: page.locator(".product-name", { hasText: "Trail Mix" }) });
  await expect(archivedRow.locator(".chip")).toHaveText("Inactive");

  await page.goto(PRODUCT_MAP_URL);
  const existingMapping = page.locator("#pmTableBody tr[data-pm-id]", { hasText: "Trail Mix" });
  await expect(existingMapping).toContainText("Inactive");

  const draft = await addProductMapDraft(page);
  await draft.locator('[data-inline-field="categoryId"]').fill("Snacks");
  await draft.locator('[data-inline-field="categoryId"]').press("Tab");
  const productInput = page.locator("#pmTableBody tr[data-inline-key]").first().locator('[data-inline-field="productId"]');
  const productListId = await productInput.getAttribute("list");
  await expect(page.locator(`#${productListId} option[value="Trail Mix"]`)).toHaveCount(0);
});

test("creates catalog entries and immediately saves one Product Map cell at a time", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);

  const draft = await addProductMapDraft(page);
  const categoryInput = draft.locator('[data-inline-field="categoryId"]');
  const productInput = draft.locator('[data-inline-field="productId"]');
  await categoryInput.fill("Fresh Meals");
  await categoryInput.press("Tab");
  await expect(productInput).toBeEnabled();
  await productInput.fill("Veggie Wrap");
  await productInput.press("Tab");
  await draft.locator('[data-inline-field="mdbCode"]').fill("77");
  await draft.locator('[data-inline-field="par"]').fill("5");
  await draft.locator('[data-inline-field="price"]').fill("6.50");
  await page.locator("#pmInlineSaveAll").click();

  const saved = page.locator('#pmTableBody tr[data-pm-id]', { hasText: "Veggie Wrap" }).first();
  await expect(saved).toBeVisible();
  await expect(saved.locator("td").nth(1)).toContainText("Fresh Meals");
  await expect(saved.locator('[data-pm-cell-field="paCode"] .pm-cell-edit-value')).toHaveText("—");
  const catalog = await page.evaluate(() => ({
    groups: window.PaywizardProductCatalog.getCategories(),
    products: window.PaywizardProductCatalog.getProducts()
  }));
  const group = catalog.groups.find((item) => item.name === "Fresh Meals");
  expect(group).toBeTruthy();
  expect(catalog.products.some((item) => item.name === "Veggie Wrap" && item.categoryId === group.id)).toBeTruthy();
  const savedId = await saved.getAttribute("data-pm-id");
  const savedRow = page.locator(`#pmTableBody tr[data-pm-id="${savedId}"]`);

  await expect(savedRow.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  await expect(page.locator(".pm-cell-edit-label")).toHaveCount(0);
  const deleteButton = savedRow.getByRole("button", { name: "Delete Veggie Wrap" });
  await expect(deleteButton).toBeVisible();
  await expect(deleteButton.locator('img[src="assets/icons/delete.svg"]')).toHaveCount(1);

  await savedRow.locator('[data-pm-cell-field="paCode"]').click();
  let cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="paCode"]');
  await expect(cellEditor).toBeFocused();
  await expect(savedRow.locator('[data-pm-cell-editor]')).toHaveCount(1);
  await cellEditor.fill("B7");
  await cellEditor.press("Enter");
  await expect(savedRow.locator('[data-pm-cell-field="paCode"] .pm-cell-edit-value')).toHaveText("B7");
  await expect(page.locator("#pmInlineStatus")).toHaveText("All changes saved");

  await savedRow.locator('[data-pm-cell-field="mdbCode"]').click();
  cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="mdbCode"]');
  await cellEditor.fill("16");
  await cellEditor.press("Enter");
  await expect(cellEditor).toBeFocused();
  await expect(cellEditor).toHaveClass(/is-invalid/);
  await expect(page.locator("#pmValidationSummary")).toContainText("This MDB Code is already mapped.");
  await cellEditor.fill("78");
  await cellEditor.press("Enter");
  await expect(savedRow.locator('[data-pm-cell-field="mdbCode"] .pm-cell-edit-value')).toHaveText("78");
  await expect(page.locator("#pmValidationSummary")).toBeHidden();

  await savedRow.locator('[data-pm-cell-field="par"]').click();
  cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="par"]');
  await cellEditor.fill("9");
    await cellEditor.press("Escape");
    await expect(savedRow.locator('[data-pm-cell-field="par"] .pm-cell-edit-value')).toHaveText("5");
    await expect(savedRow.locator('[data-pm-cell-edit][data-pm-cell-field="par"]')).toBeFocused();

  const rowBoxBeforeGroupEdit = await savedRow.boundingBox();
  const paCellBoxBeforeGroupEdit = await savedRow.locator('td').nth(2).boundingBox();
  await savedRow.locator('[data-pm-cell-field="categoryId"]').click();
  cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="categoryId"]');
  await expect(savedRow.locator('.pm-cell-combobox-icon')).toHaveAttribute('src', 'assets/icons/chevron-down.svg');
  const rowBoxDuringGroupEdit = await savedRow.boundingBox();
  const paCellBoxDuringGroupEdit = await savedRow.locator('td').nth(2).boundingBox();
  expect(Math.abs(rowBoxDuringGroupEdit.height - rowBoxBeforeGroupEdit.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(paCellBoxDuringGroupEdit.x - paCellBoxBeforeGroupEdit.x)).toBeLessThanOrEqual(2);
  await cellEditor.fill("Hot Meals");
  await cellEditor.press("Enter");
  await expect(savedRow.locator('[data-pm-cell-field="categoryId"] .pm-cell-edit-value')).toHaveText("Hot Meals");
  await expect(savedRow.locator('[data-pm-cell-field="productId"]')).toContainText("Select product");
  let storedRow = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376").find((row) => row.mdbCode === "78"));
  expect(storedRow.productId).toBe("");
  expect(storedRow.productNameSnapshot).toBe("");
  await page.reload();
  await expect(savedRow.locator('[data-pm-cell-field="categoryId"] .pm-cell-edit-value')).toHaveText("Hot Meals");
  await expect(savedRow.locator('[data-pm-cell-field="productId"]')).toContainText("Select product");

  await savedRow.locator('[data-pm-cell-field="productId"]').click();
  cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="productId"]');
  await cellEditor.fill("Tomato Soup");
  await cellEditor.press("Enter");
  await expect(savedRow.locator('[data-pm-cell-field="productId"] .pm-cell-edit-value')).toContainText("Tomato Soup");

  await savedRow.locator('[data-pm-cell-field="onHand"]').click();
  cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="onHand"]');
  await cellEditor.fill("3");
  await cellEditor.press("Enter");
  await expect(savedRow.locator('[data-pm-cell-field="onHand"]')).toContainText("3 / 5");
  await expect(savedRow.locator("td").nth(6)).toHaveText("2");

  await savedRow.locator('[data-pm-cell-field="price"]').click();
  cellEditor = savedRow.locator('[data-pm-cell-editor][data-pm-cell-field="price"]');
  await cellEditor.fill("7.25");
  await page.locator("#pmInlineStatus").click();
  await expect(savedRow.locator('[data-pm-cell-field="price"] .pm-cell-edit-value')).toHaveText("7.25");
  storedRow = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376").find((row) => row.mdbCode === "78"));
  expect(storedRow.onHand).toBe(3);
  expect(storedRow.priceCents).toBe(725);
  expect(storedRow.productNameSnapshot).toBe("Tomato Soup");

  await savedRow.locator("[data-pm-delete]").click();
  await expect(page.locator("#pmConfirmModal")).toBeVisible();
  await expect(page.locator("#pmConfirmTitle")).toHaveText("Confirm Delete");
  await page.locator("#pmConfirmModal [data-feature-close]").click();
  await expect(savedRow).toBeVisible();
});

test("Products and Product Map keep wide content inside local scroll containers on desktop and mobile", async ({ page }) => {
  await resetCatalog(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRODUCTS_URL);
  await expectNoDocumentOverflow(page);
  await page.goto(PRODUCT_MAP_URL);
  await expectNoDocumentOverflow(page);
  await expect(page.locator(".pm-table-wrap")).toHaveCSS("overflow-x", "auto");
  await page.goto(PRODUCT_MAP_TEMPLATES_URL);
  await expectNoDocumentOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PRODUCTS_URL);
  await expectNoDocumentOverflow(page);
  const mobileColumnCount = await page.locator(".workspace").evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
  );
  expect(mobileColumnCount).toBe(1);

  await page.goto(PRODUCT_MAP_URL);
  await expectNoDocumentOverflow(page);
  const mobileToolbarCommands = page.locator(".pm-inline-toolbar > .pm-inline-toolbar-group").first();
  await expect(mobileToolbarCommands).toHaveCSS("flex-direction", "row");
  const mobileMapButton = page.locator("#pmMapMenuButton");
  const mobileStockButton = page.locator("#pmStockMenuButton");
  await expect(mobileMapButton).toHaveCSS("height", "38px");
  await expect(mobileStockButton).toHaveCSS("height", "38px");
  await mobileMapButton.click();
  const mobileMapMenuBox = await page.locator("#pmMapMenuPanel").boundingBox();
  expect(mobileMapMenuBox.x + mobileMapMenuBox.width).toBeLessThanOrEqual(391);
  await page.keyboard.press("Escape");
  const tableWidths = await page.locator(".pm-table-wrap").evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth
  }));
  expect(tableWidths.scrollWidth).toBeGreaterThan(tableWidths.clientWidth);
  await page.goto(PRODUCT_MAP_TEMPLATES_URL);
  await expectNoDocumentOverflow(page);
  const templateColumns = await page.locator(".workspace").evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
  );
  expect(templateColumns).toBe(1);
});

test("saves the current Product Map as a template and imports it into another terminal as a staged replacement", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);

  const mapButton = page.getByRole("button", { name: "Map", exact: true });
  await expect(mapButton.locator(".pm-map-caret")).toBeVisible();
  await mapButton.click();
  await expect(mapButton).toHaveAttribute("aria-expanded", "true");
  const mapMenuWidth = await page.locator("#pmMapMenuPanel").evaluate((node) => node.getBoundingClientRect().width);
  expect(mapMenuWidth).toBe(220);
  const mapItems = await page.locator("#pmMapMenuPanel [role=menuitem]").allTextContents();
  expect(mapItems).toEqual(["Add BIN", "Add Multiple BINS", "Save as Template", "Import Template"]);
  await page.getByRole("menuitem", { name: "Save as Template" }).click();
  await expect(page.locator("#pmSaveTemplateModal")).toHaveClass(/open/);
  await expect(page.locator("#pmTemplateTerminalNameSummary")).toHaveText("Terminal - WP6267UQ36002376");
  await expect(page.locator("#pmTemplateBinSummary")).toHaveText("8");
  const summaryTopPositions = await page.locator("#pmSaveTemplateModal .template-summary-item").evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
  expect(new Set(summaryTopPositions).size).toBe(1);
  const saveButtonMetrics = await page.locator("#pmSaveTemplateModal .feature-modal-footer button").evaluateAll((buttons) => buttons.map((button) => ({
    width: button.getBoundingClientRect().width,
    height: button.getBoundingClientRect().height,
    fontSize: getComputedStyle(button).fontSize,
    fontWeight: getComputedStyle(button).fontWeight
  })));
  expect(saveButtonMetrics).toEqual([
    { width: 124, height: 36, fontSize: "13px", fontWeight: "700" },
    { width: 124, height: 36, fontSize: "13px", fontWeight: "700" }
  ]);
  await page.locator("#pmTemplateName").fill("Q3RU Standard Snacks");
  await page.locator("#pmTemplateMachineModel").fill("Vendo 721");
  await page.locator("#pmTemplateDescription").fill("Standard eight-BIN layout");
  await page.getByRole("button", { name: "Save Template" }).click();

  const template = await page.evaluate(() => window.PaywizardProductCatalog.getProductMapTemplates()[0]);
  expect(template.name).toBe("Q3RU Standard Snacks");
  expect(template.machineModel).toBe("VENDO 721");
  expect(template.sourceTerminalName).toBe("Terminal - WP6267UQ36002376");
  expect(template.rows).toHaveLength(8);
  expect(template.rows[0]).not.toHaveProperty("onHand");

  const managerPage = await page.context().newPage();
  await managerPage.goto(PRODUCT_MAP_TEMPLATES_URL);
  await expect(managerPage.locator('[data-template-id]', { hasText: "Q3RU Standard Snacks" })).toBeVisible();
  await managerPage.close();

  const targetUrl = `${PRODUCT_MAP_URL}&sn=TARGET0001&terminalName=Terminal%20-%20TARGET0001`;
  await page.goto(targetUrl);
  await expect(page.locator("#pmTableBody tr[data-pm-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("menuitem", { name: "Import Template" }).click();
  await expect(page.locator("#pmImportTemplateModal")).toHaveClass(/open/);
  await expect(page.locator("#pmImportTemplateModal input[type=search]")).toHaveCount(0);
  await expect(page.locator("#pmImportTemplateModal table")).toHaveCount(0);
  const importWidth = await page.locator("#pmImportTemplateModal .feature-modal").evaluate((node) => node.getBoundingClientRect().width);
  expect(importWidth).toBeLessThanOrEqual(560);
  await expect(page.locator("#pmTemplateList")).toContainText("Q3RU Standard Snacks");
  await expect(page.locator("#pmTemplateList")).toContainText("VENDO 721");
  await expect(page.locator("#pmImportTemplateModal")).not.toContainText("ready to import");
  await expect(page.locator("#pmTemplatePreview")).toHaveCount(0);
  await page.getByRole("button", { name: "Import Template", exact: true }).click();

  await expect(page.locator("#pmInlineStatus")).toHaveText("8 imported changes");
  await expect(page.locator("#pmTableBody tr.pm-template-import-row")).toHaveCount(8);
  await expect(page.locator("#pmTableBody tr[data-pm-id]").first().locator("td").nth(5)).toContainText("0 / 12");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.locator("#pmInlineAddButton")).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Cancel Changes" }).click();
  await expect(page.locator("#pmTableBody tr[data-pm-id]")).toHaveCount(0);

  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("menuitem", { name: "Import Template" }).click();
  await page.getByRole("button", { name: "Import Template", exact: true }).click();
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.locator("#pmInlineStatus")).toHaveText("All changes saved");
  await expect(page.locator("#pmTableBody tr[data-pm-id]")).toHaveCount(8);
  const savedTarget = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("TARGET0001"));
  expect(savedTarget).toHaveLength(8);
  expect(savedTarget.every((row) => row.onHand === 0)).toBeTruthy();
  expect(savedTarget.map((row) => row.mdbCode)).toEqual(template.rows.map((row) => row.mdbCode));
});

test("fills and empties every BIN from the Stock menu with confirmation and immediate persistence", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);

  const mapButton = page.getByRole("button", { name: "Map", exact: true });
  const stockButton = page.getByRole("button", { name: "Stock", exact: true });
  await mapButton.click();
  await expect(mapButton).toHaveAttribute("aria-expanded", "true");
  await stockButton.click();
  await expect(mapButton).toHaveAttribute("aria-expanded", "false");
  await expect(stockButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: "Fill Machine 100%" })).toBeFocused();

  await page.getByRole("menuitem", { name: "Fill Machine 100%" }).click();
  await expect(page.locator("#pmConfirmTitle")).toHaveText("Fill Machine 100%?");
  await expect(page.locator("#pmConfirmMessage")).toContainText("On Hand to PAR");
  await expect(page.locator("#pmConfirmModal").getByRole("button", { name: "Close" })).toHaveCount(0);
  const confirmButtons = await page.locator("#pmConfirmModal .feature-modal-footer button").evaluateAll((buttons) => buttons.map((button) => ({
    width: button.getBoundingClientRect().width,
    height: button.getBoundingClientRect().height,
    fontSize: getComputedStyle(button).fontSize,
    fontWeight: getComputedStyle(button).fontWeight
  })));
  expect(confirmButtons).toEqual([
    { width: 112, height: 36, fontSize: "13px", fontWeight: "700" },
    { width: 112, height: 36, fontSize: "13px", fontWeight: "700" }
  ]);
  await page.locator("#pmConfirmModal").getByRole("button", { name: "Cancel" }).click();

  let rows = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376"));
  expect(rows.some((row) => row.onHand !== row.par)).toBeTruthy();

  await stockButton.click();
  await page.getByRole("menuitem", { name: "Fill Machine 100%" }).click();
  await page.locator("#pmConfirmAccept").click();
  await expect(page.locator("#prototypeToast")).toContainText("filled to PAR");
  rows = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376"));
  expect(rows.every((row) => row.onHand === row.par)).toBeTruthy();
  await expect(page.locator("#pmTableBody tr[data-pm-id]").first().locator("td").nth(6)).toHaveText("0");

  await page.reload();
  rows = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376"));
  expect(rows.every((row) => row.onHand === row.par)).toBeTruthy();

  await stockButton.click();
  await page.getByRole("menuitem", { name: "Empty Machine", exact: true }).click();
  await expect(page.locator("#pmConfirmTitle")).toHaveText("Empty Machine?");
  await expect(page.locator("#pmConfirmMessage")).toContainText("On Hand to 0");
  await expect(page.locator("#pmConfirmAccept")).toHaveText("Empty");
  await expect(page.locator("#pmConfirmAccept")).toHaveCSS("white-space", "normal");
  const emptyButtonHeight = await page.locator("#pmConfirmAccept").evaluate((button) => button.getBoundingClientRect().height);
  expect(emptyButtonHeight).toBe(36);
  await page.locator("#pmConfirmAccept").click();
  await expect(page.locator("#prototypeToast")).toContainText("BINS emptied");
  rows = await page.evaluate(() => window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376"));
  expect(rows.every((row) => row.onHand === 0)).toBeTruthy();
  await expect(page.locator("#pmTableBody tr[data-pm-id]").first().locator("td").nth(5)).toContainText("0 / 12");
  await expect(page.locator("#pmTableBody tr[data-pm-id]").first().locator("td").nth(6)).toHaveText("12");
});

test("disables Stock actions while Product Map changes are unsaved", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await addProductMapDraft(page);

  const stockButton = page.getByRole("button", { name: "Stock", exact: true });
  await stockButton.click();
  await expect(page.getByRole("menuitem", { name: "Fill Machine 100%" })).toBeDisabled();
  await expect(page.getByRole("menuitem", { name: "Empty Machine", exact: true })).toBeDisabled();
  await expect(page.locator("#pmStockMenuNote")).toHaveText("Save or cancel Product Map changes first.");
  await page.keyboard.press("Escape");
  await expect(stockButton).toBeFocused();
});

test("protects template creation during unsaved edits and imports templates using their vending machine model", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await page.evaluate(() => window.PaywizardProductCatalog.saveProductMapTemplate({
    name: "Other Model Layout",
    description: "",
    machineModel: "VENDO-721",
    sourceTerminalName: "Other Model Terminal",
    sourceTerminalSn: "SOURCE-OTHER",
    rows: window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376")
  }));

  await addProductMapDraft(page);
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("menuitem", { name: "Save as Template" }).click();
  await expect(page.locator("#pmSaveTemplateModal")).not.toHaveClass(/open/);
  await expect(page.locator("#prototypeToast")).toContainText("Save or cancel");
  await page.getByRole("button", { name: "Cancel Changes" }).click();

  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("menuitem", { name: "Import Template" }).click();
  const incompatible = page.locator('[data-template-id]', { hasText: "Other Model Layout" });
  await expect(incompatible).toBeEnabled();
  await expect(incompatible).toContainText("VENDO-721");
  await expect(incompatible).not.toContainText("Different model");
  await incompatible.click();
  await page.getByRole("button", { name: "Import Template", exact: true }).click();
  await expect(page.locator("#pmInlineStatus")).toHaveText("8 imported changes");
});

test("manages template details, compact metadata, deletion, and template product references", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);
  await page.evaluate(() => window.PaywizardProductCatalog.saveProductMapTemplate({
    name: "Manage Me",
    description: "Original description",
    machineModel: "VENDO-721",
    sourceTerminalName: "Lobby Vender",
    sourceTerminalSn: "WP6267UQ36002376",
    rows: window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376")
  }));

  await page.goto(PRODUCT_MAP_TEMPLATES_URL);
  await expect(page.getByRole("heading", { name: "Product Map Templates", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Product Map" })).toHaveCount(0);
  await expect(page.locator('[data-template-id]', { hasText: "Manage Me" })).toBeVisible();
  await expect(page.locator(".summary-card")).toHaveCount(4);
  await expect(page.locator(".summary-card").nth(0)).toContainText("Lobby Vender");
  await expect(page.locator(".summary-card").nth(1)).toContainText("VENDO-721");
  await expect(page.locator(".summary-card").nth(2)).toContainText("8");
  await expect(page.locator(".title-row .terminal-sn")).toHaveText("SN: WP6267UQ36002376");
  await expect(page.getByRole("button", { name: "Duplicate" })).toHaveCount(0);
  await expect(page.locator(".summary-card")).toHaveCount(4);
  await expect(page.locator(".summary-card .summary-sub")).toHaveCount(0);
  await page.getByRole("button", { name: "Edit Details" }).click();
  await page.locator("#templateName").fill("Managed Layout");
  await page.locator("#templateDescription").fill("Updated description");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Managed Layout" })).toBeVisible();

  const archived = await page.evaluate(() => window.PaywizardProductCatalog.deleteProduct("product-trail-mix"));
  expect(archived.archived).toBeTruthy();
  const references = await page.evaluate(() => window.PaywizardProductCatalog.getReferenceCounts({ productId: "product-trail-mix" }));
  expect(references.totalTemplateReferences).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator("#dialogLayer")).toBeVisible();
  await page.locator("#dialogConfirm").click();
  await expect(page.locator('[data-template-id]', { hasText: "Managed Layout" })).toHaveCount(0);

});

test("migrates the v1 session catalog to v2 without losing products or terminal Product Maps", async ({ page }) => {
  await resetCatalog(page);
  await page.evaluate(() => {
    const legacy = window.PaywizardProductCatalog.getState();
    legacy.version = 1;
    delete legacy.productMapTemplates;
    sessionStorage.setItem("paywizard.productCatalog.v1", JSON.stringify(legacy));
    sessionStorage.removeItem("paywizard.productCatalog.v2");
    localStorage.removeItem("paywizard.productCatalog.v1");
    localStorage.removeItem("paywizard.productCatalog.v2");
  });
  await page.reload();
  const migrated = await page.evaluate(() => ({
    version: window.PaywizardProductCatalog.VERSION,
    products: window.PaywizardProductCatalog.getProducts().length,
    rows: window.PaywizardProductCatalog.getProductMap("WP6267UQ36002376").length,
    templates: window.PaywizardProductCatalog.getProductMapTemplates().length,
    persisted: Boolean(localStorage.getItem("paywizard.productCatalog.v2"))
  }));
  expect(migrated).toEqual({ version: 2, products: 8, rows: 8, templates: 0, persisted: true });
});
