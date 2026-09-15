const { test, expect } = require('@playwright/test');

test('Terminal List keeps business names separate from S/N values', async ({ page }) => {
  await page.goto('/2.resellermerchantterminal.html');
  const rows = page.locator('tbody tr[data-terminal-status]').filter({ has: page.locator('td:nth-child(2)') });
  const values = await rows.evaluateAll((items) => items.map((row) => ({
    sn: row.cells[0]?.textContent.trim() || '',
    name: row.cells[1]?.textContent.trim() || ''
  })));
  for (const { sn, name } of values) {
    expect(name).not.toBe(sn);
    expect(name).not.toContain(sn);
    expect(name).not.toMatch(/^Terminal\s*[-–—:]\s*/i);
  }
  expect(values.find((item) => item.sn === 'WP1110KQ20000115')?.name).toBe('Retail Tech Front Counter 01');
  expect(values.find((item) => item.sn === 'WP6030VQ33000340')?.name).toBe('Anime World Checkout 01');
});

test('terminal details show a meaningful mock name and omit an absent optional name', async ({ page }) => {
  await page.goto('/1.terminalmanage_nayax.html?tab=basic');
  await expect(page.locator('#detailsTerminalName')).toHaveText('Midtown Cooler 01');
  await expect(page.locator('#detailsSn')).toHaveText('WP6267UQ36002376');

  await page.goto('/1.terminalmanage_nayax.html?tab=basic&sn=SECOND-SN');
  await expect(page.locator('#detailsTerminalName')).toBeHidden();
  await expect(page.locator('#detailsTerminalName')).not.toHaveText('SECOND-SN');
});

test('Customer Alert email sample labels the name and S/N without conflating them', async ({ page }) => {
  await page.goto('/%E9%82%AE%E4%BB%B6%E6%A8%A1%E7%89%88html/%E9%82%AE%E4%BB%B6%E6%A8%A1%E7%89%88html/customerAlertSample.html');
  await expect(page.locator('body')).toContainText('Terminal · Midtown Cooler 01');
  await expect(page.locator('body')).toContainText('Midtown Cooler 01 · S/N WP6267UQ36002376');
  await expect(page.locator('body')).not.toContainText('Terminal - WP6267UQ36002376');
});
