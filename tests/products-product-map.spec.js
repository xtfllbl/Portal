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
  await page.getByRole("menuitem", { name: "Add Product Category" }).click();
  await expect(page.getByRole("heading", { name: "Add Product Category" })).toBeVisible();

  await page.locator("#f-name").fill(name);
  await page.locator("#f-code").fill(code);
  await page.locator('[data-action="save-editor"]').click();

  const category = page.locator("[data-category-id]", { hasText: name });
  await expect(category).toBeVisible();
  return category.getAttribute("data-category-id");
}

async function createProduct(page, { categoryId, name, productId, barcode, ean, dexName, price }) {
  await page.locator("#createButton").click();
  await page.getByRole("menuitem", { name: "Add Product" }).click();
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

  const productSelect = draft.locator('[data-inline-field="productId"]');
  const categorySelect = draft.locator('[data-inline-field="categoryId"]');
  await expect(productSelect).toBeDisabled();
  await expect(categorySelect).toBeFocused();

  await categorySelect.selectOption(categoryId);
  const refreshedDraft = page.locator("#pmTableBody tr[data-inline-key]").first();
  const refreshedProductSelect = refreshedDraft.locator('[data-inline-field="productId"]');
  await expect(refreshedProductSelect).toBeEnabled();
  await expect(refreshedProductSelect).toBeFocused();
  await refreshedProductSelect.selectOption(productId);

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
  await expect(firstSavedRow.locator("td").nth(1)).toHaveText("Cold Drinks");
  await expect(firstSavedRow.locator("td").nth(2)).toHaveText("Z9");
  await expect(firstSavedRow.locator("td").nth(3)).toHaveText("99");
  await expect(firstSavedRow.locator("td").nth(5)).toContainText("0 / 10");
  await expect(firstSavedRow.locator("td").nth(7)).toHaveText("$4.25");
});

test("keeps Product Map validation outside the table and enforces two-character PA and two-digit MDB codes", async ({ page }) => {
  await resetCatalog(page);
  await page.goto(PRODUCT_MAP_URL);

  const draft = await addProductMapDraft(page);
  await draft.locator('[data-inline-field="categoryId"]').selectOption("category-snacks");
  const activeDraft = page.locator("#pmTableBody tr[data-inline-key]").first();
  await activeDraft.locator('[data-inline-field="productId"]').selectOption("product-trail-mix");
  await activeDraft.locator('[data-inline-field="paCode"]').fill("A");
  await activeDraft.locator('[data-inline-field="mdbCode"]').fill("1x");
  await expect(activeDraft.locator('[data-inline-field="mdbCode"]')).toHaveValue("1");
  await activeDraft.locator('[data-inline-field="par"]').fill("10");
  await expect(activeDraft.locator('[data-inline-field="onHand"]')).toHaveValue("0");

  await page.locator("#pmInlineSaveAll").click();
  const summary = page.locator("#pmValidationSummary");
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("PA Code must be exactly 2 letters or numbers.");
  await expect(summary).toContainText("MDB Code must be exactly 2 digits.");
  await expect(summary.locator("xpath=ancestor::table")).toHaveCount(0);
  await expect(activeDraft.locator('[data-inline-field="paCode"]')).toHaveClass(/is-invalid/);
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
  await draft.locator('[data-inline-field="categoryId"]').selectOption("category-snacks");
  const productOptions = page.locator("#pmTableBody tr[data-inline-key]").first().locator('[data-inline-field="productId"] option');
  await expect(productOptions.filter({ hasText: "Trail Mix" })).toHaveCount(0);
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
