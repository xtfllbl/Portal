const { test, expect } = require('@playwright/test');

// These exact cosmetic-filter selectors were observed in Chrome's matched
// user-agent styles on the production page. Keep the fixture independent of
// the application's current class names so it catches future collisions.
const cosmeticFilter = '#adsContent, .ads-card { display: none !important; }';

async function expectEditorVisible(page) {
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Display Mode', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Playlist', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Media', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Targets', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Terminal Preview', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Name', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeFocused();
  const heights = await page.locator('.ads-editor-footer button:visible').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThanOrEqual(2);
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe(`Advertising visibility at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('media, new campaign and existing campaign survive the observed cosmetic filters', async ({ page }) => {
      // External font availability is unrelated to the visibility regression.
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      await page.route('https://fonts.gstatic.com/**', route => route.abort());
      await page.goto('/45.advertising.html?view=media');
      await page.addStyleTag({ content: cosmeticFilter });
      await expect(page.getByRole('searchbox', { name: 'Search media', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Upload Media', exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Campaigns', exact: true }).click();
      await page.getByRole('button', { name: 'New Campaign', exact: true }).click();
      await expectEditorVisible(page);
      await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('');
      await page.getByRole('button', { name: 'Add Media', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Select Media', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add to Playlist', exact: true }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Close media picker', exact: true }).click();
      await page.getByRole('button', { name: 'Back to campaigns', exact: true }).click();

      await page.getByRole('button', { name: 'Everyday coffee', exact: true }).click();
      await expectEditorVisible(page);
      await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Everyday coffee');
      await expect(page.getByRole('spinbutton', { name: 'Duration for A better coffee break', exact: true })).toBeVisible();
      await page.getByRole('combobox', { name: 'Model', exact: true }).selectOption('q3min');
      await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveValue('q3min');
      await expect(page.getByRole('heading', { name: 'Targets', exact: true })).toBeVisible();
    });
  });
}
