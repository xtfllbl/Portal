const { test, expect } = require('@playwright/test');

const paths = {
  leads: '/29.INTL_PSP_merchant_lead_list.html',
  onboarding: '/38.Merchant_onboard.html',
  merchants: '/5.merchant_manage_iso.html'
};

test('Leads, Onboarding and Merchant List navigation is connected in both directions', async ({ page }) => {
  await page.goto(paths.leads);
  await expect(page.locator('.pw-sidebar [aria-current="page"]')).toHaveText('Leads');

  await page.locator('.pw-sidebar a', { hasText: 'Merchant List' }).click();
  await expect(page).toHaveURL(new RegExp('5\\.merchant_manage_iso\\.html$'));
  await expect(page.locator('.pw-sidebar [aria-current="page"]')).toHaveText('Merchant List');

  await page.locator('.pw-sidebar a', { hasText: 'Onboarding' }).click();
  await expect(page).toHaveURL(new RegExp('38\\.Merchant_onboard\\.html$'));
  await expect(page.locator('.sidebar [aria-current="page"]')).toHaveText('Onboarding');

  await page.locator('.sidebar a', { hasText: 'Leads' }).click();
  await expect(page).toHaveURL(new RegExp('29\\.INTL_PSP_merchant_lead_list\\.html$'));
});

for (const viewport of [
  { width: 2048, height: 1138, sidebar: 264 },
  { width: 1440, height: 900, sidebar: 264 },
  { width: 1024, height: 768, sidebar: 74 },
  { width: 390, height: 844, sidebar: 0 }
]) {
  test(`unified admin shell is responsive at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const path of [paths.leads, paths.merchants]) {
      await page.goto(path);
      const metrics = await page.evaluate(() => {
        const sidebar = document.querySelector('.pw-sidebar');
        const topbar = document.querySelector('.pw-topbar');
        const active = document.querySelector('.pw-sidebar [aria-current="page"]');
        const logo = document.querySelector('.pw-sidebar img[src="assets/paywizard-logo.png"]');
        const header = document.querySelector('table thead th');
        return {
          font: getComputedStyle(document.body).fontFamily,
          sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : '',
          sidebarWidth: sidebar && getComputedStyle(sidebar).display !== 'none' ? sidebar.getBoundingClientRect().width : 0,
          topbarHeight: topbar ? topbar.getBoundingClientRect().height : 0,
          activeText: active ? active.textContent.trim() : '',
          hasLogo: Boolean(logo),
          headerBackground: header ? getComputedStyle(header).backgroundColor : '',
          overflow: document.documentElement.scrollWidth - window.innerWidth
        };
      });

      expect(metrics.font).toContain('Poppins');
      expect(metrics.hasLogo).toBeTruthy();
      expect(metrics.activeText).toBe(path === paths.leads ? 'Leads' : 'Merchant List');
      expect(Math.round(metrics.sidebarWidth)).toBe(viewport.sidebar);
      expect(metrics.sidebarDisplay === 'none').toBe(viewport.sidebar === 0);
      expect(Math.round(metrics.topbarHeight)).toBe(viewport.width <= 760 ? 58 : 70);
      expect(metrics.headerBackground).toBe('rgb(23, 24, 28)');
      expect(metrics.overflow).toBeLessThanOrEqual(1);
    }
  });
}

test('Leads tabs, filters and sharing modal remain operational', async ({ page }) => {
  await page.goto(paths.leads);
  await page.getByRole('tab', { name: 'PSP Activate' }).click();
  await expect(page.locator('[data-table-view="intl"]')).toBeVisible();
  await page.locator('#partnerFilter').fill('AtlasPay');
  await page.locator('#filterButton').click();
  await expect(page.locator('[data-table-view="intl"] tbody tr:visible')).not.toHaveCount(0);

  await page.getByRole('button', { name: 'Sharing Landing Page' }).first().click();
  await expect(page.locator('#shareLandingModal')).toHaveClass(/show/);
  await page.locator('#cancelShareLanding').click();
  await expect(page.locator('#shareLandingModal')).not.toHaveClass(/show/);
});

test('UPT Leads content scrolls vertically to its pagination', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(paths.leads);
  const panel = page.locator('.pw-leads-page .pw-content-panel');
  const before = await panel.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY
  }));
  expect(before.overflowY).toBe('auto');
  expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
  await panel.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator('.pw-leads-page .footer-bar')).toBeInViewport();
});

test('Merchant List actions and Custom eReceipt remain operational', async ({ page }) => {
  await page.goto(paths.merchants);
  await expect(page.getByRole('link', { name: /Add Merchant/ })).toHaveAttribute('href', '5.merchant_add_merchant_only_iso.html');

  const firstMenu = page.locator('[data-row-menu-trigger]').first();
  await firstMenu.click();
  await expect(firstMenu).toHaveAttribute('aria-expanded', 'true');
  const firstRow = page.locator('#merchantTableBody tr').first();
  await firstRow.locator('[data-open-ereceipt]').click();
  await expect(page.locator('#ereceiptModal')).toHaveClass(/show/);
});

test('Action icons explain their function on hover and keyboard focus', async ({ page }) => {
  await page.goto(paths.onboarding);
  const tooltip = page.locator('#action-function-tooltip');
  for (const label of ['Edit application', 'View application', 'Create merchant', 'Review application', 'Share application links']) {
    const action = page.locator(`[data-tooltip="${label}"]`).first();
    await action.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(label);
  }

  const shareAction = page.locator('[data-tooltip="Share application links"]').first();
  await shareAction.focus();
  await expect(tooltip).toHaveText('Share application links');
  await expect(shareAction).toHaveAttribute('aria-describedby', 'action-function-tooltip');

  await page.goto(paths.merchants);
  await page.locator('.table-actions .table-action[aria-label="Open merchant detail"]').first().hover();
  await expect(page.locator('#action-function-tooltip')).toHaveText('Open merchant detail');
});

test('Merchant filters follow the intentional responsive grid', async ({ page }) => {
  const cases = [
    { width: 2048, height: 1138, rows: [8] },
    { width: 1440, height: 900, rows: [8] },
    { width: 1320, height: 900, rows: [4, 4] },
    { width: 1024, height: 768, rows: [4, 4] },
    { width: 390, height: 844, rows: [2, 2, 2, 2] },
    { width: 320, height: 844, rows: [1, 1, 1, 1, 1, 1, 2] }
  ];

  for (const item of cases) {
    await page.setViewportSize({ width: item.width, height: item.height });
    await page.goto(paths.merchants);
    const rowCounts = await page.locator('.panel-filters > .filter-field, .panel-toolbar > .panel-tool').evaluateAll((controls) => {
      const groups = [];
      controls.forEach((control) => {
        const y = Math.round(control.getBoundingClientRect().top);
        const existing = groups.find((group) => Math.abs(group.y - y) <= 1);
        if (existing) existing.count += 1;
        else groups.push({ y, count: 1 });
      });
      return groups.sort((a, b) => a.y - b.y).map((group) => group.count);
    });
    expect(rowCounts).toEqual(item.rows);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('Leads and Merchant List typography matches the Onboarding visual tokens', async ({ page }) => {
  async function readTokens(path, selectors) {
    await page.goto(path);
    return page.evaluate((requested) => {
      const read = (selector, property) => getComputedStyle(document.querySelector(selector))[property];
      return Object.fromEntries(Object.entries(requested).map(([name, [selector, property]]) => [name, read(selector, property)]));
    }, selectors);
  }

  const common = {
    bodyFont: ['body', 'fontFamily'],
    bodySize: ['body', 'fontSize'],
    titleSize: ['.page-title', 'fontSize'],
    titleWeight: ['.page-title', 'fontWeight'],
    titleLineHeight: ['.page-title', 'lineHeight'],
    menuSize: ['.menu-item', 'fontSize'],
    subMenuSize: ['.sub-item', 'fontSize'],
    breadcrumbSize: ['.breadcrumb, .breadcrumbs', 'fontSize'],
    tableHeadSize: ['table thead th', 'fontSize'],
    tableHeadWeight: ['table thead th', 'fontWeight'],
    tableCellSize: ['table tbody td', 'fontSize'],
    tableCellWeight: ['table tbody td', 'fontWeight'],
    tableCellLineHeight: ['table tbody td', 'lineHeight']
  };
  const onboarding = await readTokens(paths.onboarding, common);
  const leads = await readTokens(paths.leads, common);
  const merchants = await readTokens(paths.merchants, common);
  expect(leads).toEqual(onboarding);
  expect(merchants).toEqual(onboarding);

  await page.goto(paths.leads);
  await expect(page.locator('.filter-field').first()).toHaveCSS('height', '39px');
  await expect(page.locator('.lead-table .mono').first()).toHaveCSS('font-family', /Poppins/);
  await expect(page.locator('.lead-table .mono').first()).toHaveCSS('font-size', '11px');
  await page.goto(paths.merchants);
  await expect(page.locator('.panel-filters .filter-field').first()).toHaveCSS('height', '39px');
  await expect(page.locator('.panel-tool').first()).toHaveCSS('height', '39px');
  await expect(page.locator('.merchant-link').first()).toHaveCSS('font-size', '11px');
  await expect(page.locator('.merchant-link').first()).toHaveCSS('font-weight', '600');
  await expect(page.locator('#merchantTableBody .merchant-meta')).toHaveCount(0);
});
