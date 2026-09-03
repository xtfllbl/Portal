const { test, expect } = require("@playwright/test");

test("Payment Method filters Card, QR, and Prepaid transactions", async ({ page }) => {
  await page.goto("/12.transaction_list.html");
  await page.locator("#filterBtn").click();

  const paymentMethod = page.locator("#fPaymentMethod");
  await expect(paymentMethod).toBeVisible();

  for (const method of ["Card", "QR", "Prepaid"]) {
    await paymentMethod.selectOption(method);
    await page.locator("#searchBtn").click();

    const rows = page.locator("#bodyRows .transaction-row");
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(page.locator("#bodyRows .method")).toHaveText(
      Array(await rows.count()).fill(method)
    );
    await expect(page.locator("#filterState")).toHaveText("1 Active");
  }
});

test("Payment Method persists across tabs and Reset clears it", async ({ page }) => {
  await page.goto("/12.transaction_list.html");
  await page.locator("#filterBtn").click();
  await page.locator("#fPaymentMethod").selectOption("Card");
  await page.locator("#searchBtn").click();

  await page.locator('.tab[data-tab="failed"]').click();
  await expect(page.locator("#fPaymentMethod")).toHaveValue("Card");
  const failedRows = page.locator("#bodyRows .transaction-row");
  expect(await failedRows.count()).toBeGreaterThan(0);
  await expect(page.locator("#bodyRows .method")).toHaveText(
    Array(await failedRows.count()).fill("Card")
  );

  await page.locator("#resetFilters").click();
  await expect(page.locator("#fPaymentMethod")).toHaveValue("");
  await expect(page.locator("#filterState")).toHaveText("0 Active");
});
