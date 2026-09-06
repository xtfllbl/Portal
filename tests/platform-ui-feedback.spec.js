const { test, expect } = require('@playwright/test');

async function ready(page, route) {
  await page.goto(route);
  await page.waitForFunction(() => Boolean(window.PaywizardUI));
  await expect(page.locator('.pw-platform-content')).not.toHaveAttribute('aria-busy', 'true');
}

test('slow initial loading keeps real content and reveals only a delayed progress bar', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/2.agent_list_iso.html?uiDelay=900');
  await page.waitForFunction(() => Boolean(window.PaywizardUI));
  const before = await page.locator('.pw-platform-content').boundingBox();
  await expect(page.locator('#agentTableBody tr')).toHaveCount(8);
  await page.clock.runFor(150);
  await expect(page.locator('.pw-ui-loading')).toHaveCount(0);
  await page.clock.runFor(100);
  await expect(page.locator('.pw-ui-page-progress')).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Agent List'})).toBeVisible();
  await expect(page.locator('.pw-ui-skeleton')).toHaveCount(0);
  await page.getByRole('button', { name: 'Merchants', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Merchants', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.clock.runFor(900);
  await expect(page.locator('.pw-ui-loading')).toHaveCount(0);
  expect(await page.locator('.pw-platform-content').boundingBox()).toEqual(before);
});

test('fast searches and page loads never flash a loading indicator', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.addInitScript(() => {
    window.loadingPaints = 0;
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1 && node.matches('.pw-ui-loading, .pw-ui-button-indicator')) window.loadingPaints++;
      }
    }).observe(document, {childList: true, subtree: true});
  });
  await ready(page, '/2.agent_list_iso.html');
  await page.locator('#searchName').fill('twoAgent');
  await page.locator('#doSearch').click();
  await page.clock.runFor(1000);
  await expect(page.locator('#agentTableBody tr')).toHaveCount(2);
  expect(await page.evaluate(() => window.loadingPaints)).toBe(0);
});

test('search feedback preserves button size, clears busy state and supports Enter', async ({ page }) => {
  await ready(page, '/2.agent_list_iso.html?uiDelay=900');
  await page.clock.install();
  const search = page.getByRole('button', { name: 'Search agents', exact: true });
  const before = await search.boundingBox();
  await page.getByRole('searchbox', { name: 'Agent Name' }).fill('twoAgent');
  await search.click();
  await page.clock.runFor(250);
  await expect(page.locator('.table-wrap .pw-ui-refresh')).toBeVisible();
  await expect(search).toHaveAttribute('aria-busy', 'true');
  expect(await search.boundingBox()).toEqual(before);
  await page.clock.runFor(1000);
  await expect(page.locator('.pw-ui-refresh')).toHaveCount(0);
  await expect(search).not.toHaveAttribute('aria-busy');
  await expect(page.locator('#agentTableBody tr')).toHaveCount(2);
  await page.getByRole('searchbox', { name: 'Agent Name' }).fill('missing-agent');
  await page.getByRole('searchbox', { name: 'Agent Name' }).press('Enter');
  await page.clock.runFor(1000);
  await expect(page.locator('#agentTableBody')).toContainText('No agent found.');
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`dialogs keep actions visible, equal height and keyboard focus contained at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const entry of [
      { route: '/2.agent_list_iso.html', trigger: '#addAgent', mask: '#createMask', actions: '.modal-foot button', first: '#closeCreate', last: '#submitCreate' },
      { route: '/10.customer_app_upload_manage.html', trigger: '.upload-update', mask: '#updateModal', actions: '.modal-actions button', first: '#closeUpdateModal', last: '#submitUpdate' }
    ]) {
      await ready(page, entry.route);
      if (entry.mask === '#updateModal') await page.getByRole('button', { name: 'Manage APP', exact: true }).click();
      const trigger = page.locator(entry.trigger).first();
      await trigger.click();
      const mask = page.locator(entry.mask);
      await expect(mask).toBeVisible();
      const buttons = mask.locator(entry.actions);
      const boxes = await buttons.evaluateAll(elements => elements.map(el => {
        const r = el.getBoundingClientRect(); return { height: r.height, top: r.top, bottom: r.bottom };
      }));
      expect(boxes).toHaveLength(2);
      expect(boxes[0].height).toBe(40);
      expect(boxes[1].height).toBe(40);
      for (const box of boxes) { expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(viewport.height); }
      await page.locator(entry.last).focus();
      await page.keyboard.press('Tab');
      await expect(page.locator(entry.first)).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator(entry.last)).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(mask).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });
}

test('transaction paging shows local feedback without losing results', async ({ page }) => {
  await ready(page, '/12.transaction_list.html?uiDelay=900');
  await page.clock.install();
  await page.locator('#nextPage').click();
  await page.clock.runFor(250);
  await expect(page.locator('.tablewrap .pw-ui-refresh')).toBeVisible();
  await page.clock.runFor(1000);
  await expect(page.locator('[data-page="2"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#bodyRows tr').first()).toBeVisible();
});

test('APP upload uses a dismissible success toast and preserves its existing list result', async ({ page }) => {
  await ready(page, '/10.customer_app_upload_manage.html');
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.locator('[data-tab="upload"]').click();
  await page.locator('#appFile').setInputFiles({ name: 'ux-feedback.apk', mimeType: 'application/vnd.android.package-archive', buffer: Buffer.from('prototype fixture') });
  await page.locator('#appName').fill('UX Feedback App');
  await page.locator('#appVersion').fill('1.0.0');
  await page.locator('#appPackage').fill('com.example.uxfeedback');
  await page.locator('#submitUpload').click();
  await expect(page.locator('.pw-ui-toast')).toContainText('APP uploaded successfully.');
  await expect(page.locator('#appTableBody')).toContainText('UX Feedback App');
  expect(dialogs).toEqual([]);
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.locator('.pw-ui-toast')).toHaveCount(0);
});
