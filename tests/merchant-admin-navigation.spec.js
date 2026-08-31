const { test, expect } = require('@playwright/test');

const paths = {
  leads: '/29.INTL_PSP_merchant_lead_list.html',
  uptLeadDetail: '/28.UPT_merchant_lead_detail.html',
  onboarding: '/38.Merchant_onboard.html',
  merchants: '/5.merchant_manage_iso.html'
};

const merchantFlowPages = [
  { path: '/5.merchant_add_iso.html', current: 'New Merchant Onboarding' },
  { path: '/5.merchant_add_merchant_only_iso.html', current: 'Add Merchant' },
  { path: '/5.merchant_add_device_iso.html', current: 'Add Device' },
  { path: '/5.merchant_device_settings_iso.html', current: 'Device Settings' },
  { path: '/5.merchant_detail_iso.html', current: 'Merchant Overview' },
  { path: '/5.merchant_detail_no_store_iso.html', current: 'Merchant Overview' }
];

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

    for (const path of [paths.leads, paths.merchants, `${paths.uptLeadDetail}?leadProcessId=00000439`]) {
      await page.goto(path);
      const metrics = await page.evaluate(() => {
        const sidebar = document.querySelector('.pw-sidebar');
        const topbar = document.querySelector('.pw-topbar');
        const active = document.querySelector('.pw-sidebar [aria-current="page"]');
        const logo = document.querySelector('.pw-sidebar img[src="assets/paywizard-logo-sidebar.png"]');
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
      expect(metrics.activeText).toBe(path === paths.merchants ? 'Merchant List' : 'Leads');
      expect(Math.round(metrics.sidebarWidth)).toBe(viewport.sidebar);
      expect(metrics.sidebarDisplay === 'none').toBe(viewport.sidebar === 0);
      expect(Math.round(metrics.topbarHeight)).toBe(viewport.width <= 760 ? 58 : 70);
      if (metrics.headerBackground) expect(metrics.headerBackground).toBe('rgb(23, 24, 28)');
      expect(metrics.overflow).toBeLessThanOrEqual(1);
    }
  });
}

for (const viewport of [
  { width: 2048, height: 1138, sidebar: 264 },
  { width: 1440, height: 900, sidebar: 264 },
  { width: 1024, height: 768, sidebar: 74 },
  { width: 390, height: 844, sidebar: 0 }
]) {
  test(`all 5.x merchant flow pages share the Merchant List shell at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const target of merchantFlowPages) {
      const browserErrors = [];
      page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
      page.on('pageerror', (error) => browserErrors.push(error.message));
      await page.goto(target.path);

      const metrics = await page.evaluate(() => {
        const sidebar = document.querySelector('.pw-sidebar');
        const topbar = document.querySelector('.pw-topbar');
        const content = document.querySelector('.pw-flow-content');
        return {
          bodyClass: document.body.className,
          logo: document.querySelector('.pw-brand img')?.getAttribute('src'),
          sidebarDisplay: getComputedStyle(sidebar).display,
          sidebarWidth: getComputedStyle(sidebar).display === 'none' ? 0 : sidebar.getBoundingClientRect().width,
          topbarHeight: topbar.getBoundingClientRect().height,
          currentBreadcrumb: document.querySelector('.pw-breadcrumb strong')?.textContent.trim(),
          activeNavigation: document.querySelector('.pw-sub-item[aria-current="page"]')?.textContent.trim(),
          navigationTargets: [...document.querySelectorAll('.pw-sub-item')].slice(1, 4).map((link) => link.getAttribute('href')),
          horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
          contentOverflow: getComputedStyle(content).overflowY,
          contentScrollable: content.scrollHeight > content.clientHeight
        };
      });

      expect(metrics.bodyClass).toContain('pw-merchant-flow-page');
      expect(metrics.logo).toBe('assets/paywizard-logo-sidebar.png');
      expect(Math.round(metrics.sidebarWidth)).toBe(viewport.sidebar);
      expect(metrics.sidebarDisplay === 'none').toBe(viewport.sidebar === 0);
      expect(Math.round(metrics.topbarHeight)).toBe(viewport.width <= 760 ? 58 : 70);
      expect(metrics.currentBreadcrumb).toBe(target.current);
      expect(metrics.activeNavigation).toBe('Merchant List');
      expect(metrics.navigationTargets).toEqual([
        '29.INTL_PSP_merchant_lead_list.html',
        '38.Merchant_onboard.html',
        '5.merchant_manage_iso.html'
      ]);
      expect(metrics.horizontalOverflow).toBeLessThanOrEqual(1);
      expect(metrics.contentOverflow).toBe(viewport.width <= 760 ? 'visible' : 'auto');

      if (metrics.contentScrollable && viewport.width > 760) {
        const reachedBottom = await page.locator('.pw-flow-content').evaluate((content) => {
          content.scrollTop = content.scrollHeight;
          return Math.abs(content.scrollHeight - content.clientHeight - content.scrollTop) <= 2;
        });
        expect(reachedBottom).toBeTruthy();
      }
      expect(browserErrors).toEqual([]);
    }
  });
}

test('all 5.x merchant flow pages use the compact Merchant List surface geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const target of merchantFlowPages) {
    await page.goto(target.path);
    const geometry = await page.evaluate(() => {
      const mainSurfaceSelector = [
        '.wizard-shell', '.merchant-panel', '.detail-panel', '.profile-card', '.section-card'
      ].join(',');
      const secondarySurfaceSelector = [
        '.wizard-panel', '.store-card', '.review-card', '.param-group', '.payment-config',
        '.source-alert', '.clone-source-banner', '.clone-source-preview', '.compatibility-list',
        '.clone-bind-summary', '.delete-confirm-summary', '.validate-warning', '.scan-info',
        '.device-table-shell'
      ].join(',');
      const dialogSelector = [
        '.modal', '.confirm-dialog', '.mid-floating-popover', '.store-settings-menu', '.device-settings-menu'
      ].join(',');
      const radii = (selector) => [...document.querySelectorAll(selector)]
        .map((element) => getComputedStyle(element).borderRadius);
      return {
        main: radii(mainSurfaceSelector),
        secondary: radii(secondarySurfaceSelector),
        dialogs: radii(dialogSelector),
        wizardDots: radii('.wizard-dot'),
        roundButtons: radii('.pw-round-btn')
      };
    });

    expect(geometry.main.length).toBeGreaterThan(0);
    for (const radius of [...geometry.main, ...geometry.secondary, ...geometry.dialogs]) {
      expect(radius).toBe('8px');
    }
    for (const radius of geometry.wizardDots) expect(radius).toBe('50%');
    for (const radius of geometry.roundButtons) expect(radius).toBe('50%');
  }
});

test('merchant flow form controls preserve their original underline and specialized geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const path of ['/5.merchant_add_merchant_only_iso.html', '/5.merchant_add_iso.html']) {
    await page.goto(path);
    const underlineControls = page.locator('.input-field');
    expect(await underlineControls.count()).toBeGreaterThan(0);
    await expect(underlineControls.first()).toHaveCSS('border-radius', '0px');
    await expect(underlineControls.first()).toHaveCSS('border-top-style', 'none');
    await expect(underlineControls.first()).toHaveCSS('border-bottom-style', 'solid');
  }

  await page.goto('/5.merchant_add_merchant_only_iso.html');
  const specializedControl = page.locator('.input').first();
  if (await specializedControl.count()) {
    await expect(specializedControl).toHaveCSS('border-radius', '12px');
  }
});

test('Leads tabs, filters and sharing modal remain operational', async ({ page }) => {
  await page.goto(paths.leads);
  await page.getByRole('tab', { name: 'PSP', exact: true }).click();
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

test('Leads tabs and action matrix match the UPT and PSP workflow', async ({ page }) => {
  await page.goto(paths.leads);
  await expect(page.getByRole('tab')).toHaveText(['UPT', 'PSP']);

  const firstUptActions = page.locator('[data-table-view="upt"] tbody tr').first().locator('.actions > *');
  await expect(firstUptActions).toHaveCount(3);
  await expect(firstUptActions.nth(0)).toHaveAttribute('aria-label', 'View detail');
  await expect(firstUptActions.nth(1)).toHaveAttribute('aria-label', 'Edit');
  await expect(firstUptActions.nth(2)).toHaveAttribute('aria-label', 'More');

  await page.getByRole('tab', { name: 'PSP', exact: true }).click();
  const firstPspActions = page.locator('[data-table-view="intl"] tbody tr').first().locator('.actions > *');
  await expect(firstPspActions).toHaveCount(1);
  await expect(firstPspActions.first()).toHaveAttribute('aria-label', 'View detail');
});

test('UPT and PSP Actions stay fixed while the business columns scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(paths.leads);

  for (const tableView of ['upt', 'intl']) {
    if (tableView === 'intl') await page.getByRole('tab', { name: 'PSP', exact: true }).click();
    const table = page.locator(`[data-table-view="${tableView}"]`);
    const wrap = page.locator('.table-wrap');
    const firstCell = table.locator('tbody tr').first().locator('td').first();
    const actionCell = table.locator('tbody tr').first().locator('td').last();
    const before = await Promise.all([firstCell.boundingBox(), actionCell.boundingBox(), wrap.boundingBox()]);
    await wrap.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    const after = await Promise.all([firstCell.boundingBox(), actionCell.boundingBox(), wrap.boundingBox()]);

    expect(after[0].x).toBeLessThan(before[0].x - 100);
    expect(Math.abs((after[1].x + after[1].width) - (after[2].x + after[2].width))).toBeLessThanOrEqual(2);
    expect(Math.abs(after[1].x - before[1].x)).toBeLessThanOrEqual(2);
    await expect(actionCell).toHaveCSS('position', 'sticky');
    expect(await actionCell.evaluate((element) => getComputedStyle(element).boxShadow)).not.toContain('12px');
    expect(await actionCell.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
    expect(await table.locator('tbody tr').nth(1).locator('td').last().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(250, 250, 250)');
  }
});

test('UPT headers have complete non-overlapping column widths', async ({ page }) => {
  for (const viewport of [
    { width: 2048, height: 1138 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(paths.leads);
    const headers = await page.locator('[data-table-view="upt"] thead th').evaluateAll((cells) => cells.map((cell) => ({
      text: cell.textContent.trim(),
      clientWidth: cell.clientWidth,
      scrollWidth: cell.scrollWidth
    })));
    expect(headers).toHaveLength(14);
    for (const header of headers) expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth + 1);
    expect(headers[5].text).toBe('Terminal Number');
    expect(headers[5].clientWidth).toBeGreaterThanOrEqual(124);
    expect(headers[6].text).toBe('Assigned SN');
    expect(headers[6].clientWidth).toBeGreaterThanOrEqual(104);
  }
});

test('six UPT Leads provide high-volume unique SN samples and merge stored overrides', async ({ page }) => {
  await page.goto(paths.leads);
  await page.evaluate(() => localStorage.removeItem('paywizard-upt-lead-overrides-v1'));
  await page.reload();
  const sample = await page.evaluate(() => window.PaywizardUptLeadData.getRecords().map((record) => ({
    processId: record.processId,
    terminalNumber: record.terminalNumber,
    serialNumbers: record.serialNumbers
  })));
  const expected = {
    '00000439': 12,
    '00000438': 14,
    '00000436': 16,
    '00000434': 18,
    '00000431': 20,
    '00000430': 24
  };
  expect(Object.fromEntries(sample.filter((record) => expected[record.processId]).map((record) => [record.processId, record.terminalNumber]))).toEqual(expected);
  expect(sample.filter((record) => record.terminalNumber >= 10)).toHaveLength(6);
  const serialNumbers = sample.flatMap((record) => record.serialNumbers);
  expect(new Set(serialNumbers).size).toBe(serialNumbers.length);
  expect(serialNumbers.every((serialNumber) => /^[A-Z0-9]{16}$/.test(serialNumber))).toBeTruthy();

  await page.evaluate(() => localStorage.setItem('paywizard-upt-lead-overrides-v1', JSON.stringify({
    '00000439': {
      serialNumbers: ['WP5305UQ33200439', 'ZZ00000000000439'],
      snAssignments: {
        WP5305UQ33200439: {
          sn: 'WP5305UQ33200439',
          merchantName: 'Jeeves Vending',
          storeName: 'Main Store',
          assignedAt: '2026-08-14T00:00:00.000Z'
        }
      }
    }
  })));
  await page.reload();
  const merged = await page.evaluate(() => window.PaywizardUptLeadData.getByProcessId('00000439'));
  expect(merged.terminalNumber).toBe(13);
  expect(merged.assignedSnCount).toBe(1);
  expect(merged.serialNumbers).toContain('ZZ00000000000439');
});

test('all ten UPT rows open their own complete Merchant Information record', async ({ page }) => {
  const browserErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(paths.leads);
  const rows = await page.locator('[data-table-view="upt"] tbody tr').evaluateAll((items) => items.map((row) => {
    const cells = row.querySelectorAll('td');
    return {
      processId: cells[0].textContent.trim(),
      country: cells[3].textContent.trim(),
      merchantName: cells[4].textContent.trim(),
      terminalNumber: Number(cells[5].textContent.trim()),
      assignedSn: Number(cells[6].textContent.trim()),
      contactName: cells[7].textContent.trim(),
      email: cells[8].textContent.trim(),
      href: row.querySelector('[aria-label="View detail"]').getAttribute('href')
    };
  }));
  expect(rows).toHaveLength(10);

  for (const lead of rows) {
    expect(lead.href).toBe(`28.UPT_merchant_lead_detail.html?leadProcessId=${lead.processId}`);
    await page.goto(`${paths.uptLeadDetail}?leadProcessId=${lead.processId}`);
    await expect(page.locator('.lead-detail-section')).toHaveCount(6);
    await expect(page.locator('[data-field="processId"]')).toHaveText(lead.processId);
    await expect(page.locator('[data-field="country"]')).toHaveText(lead.country);
    await expect(page.locator('[data-field="merchantName"]')).toHaveText(lead.merchantName);
    await expect(page.locator('[data-field="contactName"]')).toHaveText(lead.contactName);
    await expect(page.locator('[data-field="email"]')).toHaveText(lead.email);
    await expect(page.locator('[data-field="terminalNumber"]')).toHaveText(String(lead.terminalNumber));
    await expect(page.locator('#snCount')).toHaveText(String(lead.terminalNumber));
  }
  expect(browserErrors).toEqual([]);
});

test('UPT SN List supports exact counts, empty state and all close methods', async ({ page }) => {
  await page.goto(`${paths.uptLeadDetail}?leadProcessId=00000431`);
  await page.locator('#openSnList').click();
  await expect(page.locator('#snModal')).toBeVisible();
  await expect(page.locator('.sn-item')).toHaveCount(20);
  await expect(page.locator('#snTotal')).toHaveText('20');
  await page.keyboard.press('Escape');
  await expect(page.locator('#snModal')).toBeHidden();

  await page.locator('#openSnList').click();
  await page.locator('#closeSnModal').click();
  await expect(page.locator('#snModal')).toBeHidden();

  await page.goto(`${paths.uptLeadDetail}?leadProcessId=00000440`);
  await page.locator('#openSnList').click();
  await expect(page.locator('.sn-empty')).toHaveText('No Data Found');
  await expect(page.locator('.sn-item')).toHaveCount(0);
  await expect(page.locator('#snTotal')).toHaveText('0');
  await page.locator('#snModal').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#snModal')).toBeHidden();
});

test('UPT detail redirects invalid IDs and remains responsive', async ({ page }) => {
  await page.goto(`${paths.uptLeadDetail}?leadProcessId=does-not-exist`);
  await expect(page).toHaveURL(new RegExp('29\\.INTL_PSP_merchant_lead_list\\.html$'));
  await expect(page.getByText('Lead not found')).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${paths.uptLeadDetail}?leadProcessId=00000439`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator('.lead-detail-grid').first().evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).length)).toBe(1);
  await page.getByRole('link', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(new RegExp('29\\.INTL_PSP_merchant_lead_list\\.html$'));
});

test('UPT Add SN validates atomically, persists, and switches to Assign/New Merchant', async ({ page }) => {
  await page.goto(paths.leads);
  await page.evaluate(() => localStorage.removeItem('paywizard-upt-lead-overrides-v1'));
  await page.reload();
  const uptRows = page.locator('[data-table-view="upt"] tbody tr');
  const zeroTerminalRow = uptRows.filter({ has: page.locator('td:nth-child(6)', { hasText: /^0$/ }) }).first();

  await zeroTerminalRow.locator('.lead-more-trigger').click();
  await expect(page.locator('[data-lead-menu-action="terminal"]')).toContainText('Add SN');
  await expect(page.locator('[data-lead-menu-action="onboard"]')).toBeVisible();
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(page.locator('#leadAddSnModal')).toBeVisible();

  await page.locator('#leadAddSnInput').fill('TOO-SHORT');
  await page.locator('#leadAddSnForm button[type="submit"]').click();
  await expect(page.locator('#leadAddSnError')).toContainText('exactly 16');
  await expect(zeroTerminalRow.locator('td:nth-child(6)')).toHaveText('0');

  await page.locator('#leadAddSnInput').fill('WP5305UQ33200439');
  await page.locator('#leadAddSnForm button[type="submit"]').click();
  await expect(page.locator('#leadAddSnError')).toContainText('already assigned');
  await expect(zeroTerminalRow.locator('td:nth-child(6)')).toHaveText('0');

  await page.locator('#leadAddSnInput').fill('ab12cd34ef56gh78,\nzx98cv76bn54mk32');
  await page.locator('#leadAddSnForm button[type="submit"]').click();
  await expect(page.locator('#leadAddSnModal')).toBeHidden();
  await expect(page.locator('[data-table-view="upt"] tbody tr').filter({ has: page.locator('td:first-child', { hasText: '00000440' }) }).locator('td:nth-child(6)')).toHaveText('2');

  await page.reload();
  const updatedRow = page.locator('[data-table-view="upt"] tbody tr').filter({ has: page.locator('td:first-child', { hasText: '00000440' }) });
  await expect(updatedRow.locator('td:nth-child(6)')).toHaveText('2');
  await updatedRow.locator('.lead-more-trigger').click();
  await expect(page.locator('[data-lead-menu-action="terminal"]')).toContainText('Assign/New Merchant');
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(page.locator('#leadAssignModal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#leadAssignModal')).toBeHidden();

  await page.goto(`${paths.uptLeadDetail}?leadProcessId=00000440`);
  await expect(page.locator('[data-field="terminalNumber"]')).toHaveText('2');
  await expect(page.locator('#snCount')).toHaveText('2');
  await page.locator('#openSnList').click();
  await expect(page.locator('.sn-item')).toHaveText(['AB12CD34EF56GH78', 'ZX98CV76BN54MK32']);
  await expect(page.locator('#snTotal')).toHaveText('2');
});

test('UPT assigned Lead still opens the Assign/New Merchant dialog safely', async ({ page }) => {
  await page.goto(paths.leads);
  const assignedTerminalRow = page.locator('[data-table-view="upt"] tbody tr').filter({ has: page.locator('td:nth-child(6)', { hasText: /^[1-9]/ }) }).first();

  await assignedTerminalRow.locator('.lead-more-trigger').click();
  await expect(page.locator('[data-lead-menu-action="terminal"]')).toContainText('Assign/New Merchant');
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(page.locator('#leadAssignModal')).toBeVisible();
  await page.getByRole('button', { name: '+ Create New Merchant' }).click();
  await page.getByRole('textbox', { name: 'New merchant name' }).fill('Prototype Merchant');
  await page.getByRole('button', { name: '+ Create New Store' }).click();
  await page.getByRole('textbox', { name: 'New store name' }).fill('Prototype Store');
  await page.keyboard.press('Escape');
  await expect(page.locator('#leadAssignModal')).toBeHidden();
});

test('UPT SNs can be assigned in batches and Assigned SN persists', async ({ page }) => {
  await page.goto(paths.leads);
  await page.evaluate(() => localStorage.removeItem('paywizard-upt-lead-overrides-v1'));
  await page.reload();
  const row = page.locator('[data-table-view="upt"] tbody tr').filter({ has: page.locator('td:first-child', { hasText: '00000438' }) });
  await expect(row.locator('td:nth-child(6)')).toHaveText('14');
  await expect(row.locator('td:nth-child(7)')).toHaveText('0');

  await row.locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(page.locator('#leadAssignSnList input[type="checkbox"]')).toHaveCount(14);
  await expect(page.locator('#leadAssignSnList input[type="checkbox"]:checked')).toHaveCount(14);
  await expect(page.locator('#leadAssignSnCount')).toHaveText('14 selected · 14 total');
  await page.locator('#saveLeadAssign').click();
  await expect(page.locator('#leadAssignError')).toHaveText('Select or enter a merchant name.');
  await page.locator('#leadAssignMerchant').selectOption({ label: 'Maple Street Coffee' });
  await page.locator('#saveLeadAssign').click();
  await expect(page.locator('#leadAssignError')).toHaveText('Select or enter a store name.');
  await page.locator('#leadAssignStore').selectOption({ label: 'Main Store' });
  await page.locator('#leadAssignSelectAll').uncheck();
  await page.locator('#saveLeadAssign').click();
  await expect(page.locator('#leadAssignError')).toHaveText('Select at least one unassigned SN.');
  await page.locator('#leadAssignSnList input[type="checkbox"]').nth(0).check();
  await page.locator('#leadAssignSnList input[type="checkbox"]').nth(1).check();
  await page.locator('#leadAssignSnList input[type="checkbox"]').nth(2).check();
  await expect(page.locator('#leadAssignSnCount')).toHaveText('3 selected · 14 total');
  await page.locator('#saveLeadAssign').click();
  await expect(page.locator('#leadAssignModal')).toBeHidden();
  await expect(row.locator('td:nth-child(7)')).toHaveText('3');

  await page.reload();
  const persistedRow = page.locator('[data-table-view="upt"] tbody tr').filter({ has: page.locator('td:first-child', { hasText: '00000438' }) });
  await expect(persistedRow.locator('td:nth-child(7)')).toHaveText('3');
  await persistedRow.locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(page.locator('#leadAssignSnList input:disabled')).toHaveCount(3);
  await expect(page.locator('#leadAssignSnList input:not(:disabled):checked')).toHaveCount(11);
  await expect(page.locator('.lead-assign-sn-item.is-assigned').first()).toContainText('Maple Street Coffee · Main Store');

  await page.locator('#leadAssignMerchant').selectOption({ label: 'Jeeves Vending' });
  await page.locator('#leadAssignStore').selectOption({ label: 'Downtown Store' });
  await page.locator('#saveLeadAssign').click();
  await expect(persistedRow.locator('td:nth-child(7)')).toHaveText('14');

  await persistedRow.locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="terminal"]').click();
  await expect(page.locator('#leadAssignSnEmpty')).toBeVisible();
  await expect(page.locator('#saveLeadAssign')).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('.lead-assign-sn-list')).toHaveCSS('grid-template-columns', /\d+px/);
});

test('UPT Onboard prefills a sourced application and prevents duplicates', async ({ page }) => {
  await page.goto(paths.leads);
  await page.evaluate(() => {
    localStorage.removeItem('paywizard-onboarding-applications-v2');
    localStorage.removeItem('paywizard-lead-onboarding-prefill-v1');
  });

  const leadRow = page.locator('[data-table-view="upt"] tbody tr').first();
  const lead = await leadRow.locator('td').evaluateAll((cells) => ({
    processId: cells[0].textContent.trim(),
    partnerName: cells[2].textContent.trim(),
    countryName: cells[3].textContent.trim(),
    merchantName: cells[4].textContent.trim(),
    contactName: cells[7].textContent.trim(),
    merchantEmail: cells[8].textContent.trim()
  }));
  const fullLead = await page.evaluate((processId) => window.PaywizardUptLeadData.getByProcessId(processId), lead.processId);
  await leadRow.locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="onboard"]').click();

  await expect(page).toHaveURL(new RegExp(`38\\.Merchant_onboard\\.html\\?source=lead&leadProcessId=${lead.processId}#new-onboarding$`));
  await expect(page.locator('#merchant-name')).toHaveValue(lead.merchantName);
  await expect(page.locator('#contact-name')).toHaveValue(lead.contactName);
  await expect(page.locator('#merchant-email')).toHaveValue(lead.merchantEmail);
  await expect(page.locator('#country-name')).toHaveValue(lead.countryName);
  await expect(page.locator('#merchant-phone')).toHaveValue(fullLead.phone);
  await expect(page.locator('#payment-channel')).toHaveValue('');
  await expect(page.locator('#currency-name')).toHaveValue(fullLead.currency);

  await page.locator('#save-draft').click();
  const sourcedApplication = await page.evaluate(({ processId }) => {
    const applications = JSON.parse(localStorage.getItem('paywizard-onboarding-applications-v2') || '[]');
    return applications.find((application) => String(application.sourceLeadProcessId || '') === processId);
  }, lead);
  expect(sourcedApplication).toMatchObject({
    sourceType: 'lead',
    sourceLeadProcessId: lead.processId,
    sourceLeadPageStyle: 'UPT',
    sourcePartnerName: lead.partnerName,
    merchantName: lead.merchantName,
    agentName: fullLead.leadOwner,
    contactName: lead.contactName,
    email: lead.merchantEmail,
    phone: fullLead.phone,
    country: lead.countryName,
    currency: fullLead.currency
  });
  expect(sourcedApplication.processId).not.toBe(lead.processId);
  expect(await page.evaluate(() => localStorage.getItem('paywizard-lead-onboarding-prefill-v1'))).toBeNull();

  await page.goto(paths.leads);
  await page.locator('[data-table-view="upt"] tbody tr').first().locator('.lead-more-trigger').click();
  await page.locator('[data-lead-menu-action="onboard"]').click();
  await expect(page).toHaveURL(new RegExp('29\\.INTL_PSP_merchant_lead_list\\.html$'));
  await expect(page.locator('#leadToast')).toContainText('already been created');
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
  await expect(page.locator('.merchant-link').first()).toHaveCSS('font-size', '14px');
  await expect(page.locator('.merchant-link').first()).toHaveCSS('text-decoration-line', 'none');
  await expect(page.locator('.merchant-link').first()).toHaveCSS('font-weight', '600');
  await expect(page.locator('#merchantTableBody .merchant-meta')).toHaveCount(0);
});
