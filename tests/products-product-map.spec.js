const { test, expect } = require("@playwright/test");

const PRODUCTS_URL = "/35.product_management.html";
const PRODUCT_MAP_URL = "/1.terminalmanage_nayax.html?tab=productmap";

async function resetCatalog(page) {
  await page.goto(PRODUCTS_URL);
  await page.evaluate(() => window.sessionStorage.clear());
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
  await expect(firstSavedRow.locator("td").nth(2)).toHaveText("Z9");
  await expect(firstSavedRow.locator("td").nth(3)).toHaveText("99");
  await expect(firstSavedRow.locator("td").nth(5)).toContainText("0 / 10");
  await expect(firstSavedRow.locator("td").nth(7)).toHaveText("4.25");
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
  await expect(trigger).toBeFocused();
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

test("creates new Product Groups and Products from autocomplete cells and supports saved-row quick editing", async ({ page }) => {
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
  await expect(saved.locator("td").nth(2)).toHaveText("");
  const catalog = await page.evaluate(() => ({
    groups: window.PaywizardProductCatalog.getCategories(),
    products: window.PaywizardProductCatalog.getProducts()
  }));
  const group = catalog.groups.find((item) => item.name === "Fresh Meals");
  expect(group).toBeTruthy();
  expect(catalog.products.some((item) => item.name === "Veggie Wrap" && item.categoryId === group.id)).toBeTruthy();

  await saved.locator('[data-pm-quick-field="productId"]').click();
  const quickProduct = page.locator('#pmTableBody tr[data-inline-key] [data-inline-field="productId"]');
  await expect(quickProduct).toBeFocused();
  await expect(quickProduct).toHaveValue("Veggie Wrap");
});

test("Products and Product Map keep wide content inside local scroll containers on desktop and mobile", async ({ page }) => {
  await resetCatalog(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PRODUCTS_URL);
  await expectNoDocumentOverflow(page);
  await page.goto(PRODUCT_MAP_URL);
  await expectNoDocumentOverflow(page);
  await expect(page.locator(".pm-table-wrap")).toHaveCSS("overflow-x", "auto");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PRODUCTS_URL);
  await expectNoDocumentOverflow(page);
  const mobileColumnCount = await page.locator(".workspace").evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
  );
  expect(mobileColumnCount).toBe(1);

  await page.goto(PRODUCT_MAP_URL);
  await expectNoDocumentOverflow(page);
  const tableWidths = await page.locator(".pm-table-wrap").evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth
  }));
  expect(tableWidths.scrollWidth).toBeGreaterThan(tableWidths.clientWidth);
});
