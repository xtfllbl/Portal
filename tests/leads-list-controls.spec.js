const {test, expect} = require('@playwright/test');
const list = '/29.INTL_PSP_merchant_lead_list.html';
const storageKey = 'paywizard-upt-lead-columns-v1';
const visibleRows = page => page.locator('#uptLeadRows tr:visible');
const column = (page, key) => page.locator(`#leadColumnsList [data-column-key="${key}"]`);
async function openFilters(page) { await page.locator('#filterButton').click(); }
async function search(page) { await page.locator('#leadFilterPanel').getByRole('button', {name:'Search', exact:true}).click(); }
test.beforeEach(async ({page}) => { await page.setViewportSize({width:1600,height:1000}); await page.goto(list); });

test('UPT advanced filters combine conditions, reset all fields and survive an edit return', async ({page}) => {
  await openFilters(page);
  await page.locator('#leadMerchantFilter').fill('arena');
  await page.locator('#leadContactFilter').fill('KHALIUN');
  await page.locator('#leadEmailFilter').fill('@steppe');
  await page.locator('#leadProcessFilter').fill(' 00000438 ');
  await expect(visibleRows(page)).toHaveCount(10); // Draft text does not submit a search.
  await search(page);
  await expect(visibleRows(page)).toHaveCount(1);
  await expect(visibleRows(page)).toContainText('Steppe Arena LLC');
  await visibleRows(page).getByLabel('Edit', {exact:true}).click();
  await page.locator('#cancelLead').click();
  await expect(visibleRows(page)).toHaveCount(1);
  await openFilters(page);
  await expect(page.locator('#leadMerchantFilter')).toHaveValue('arena');
  await expect(page.locator('#leadContactFilter')).toHaveValue('KHALIUN');
  await expect(page.locator('#leadEmailFilter')).toHaveValue('@steppe');
  await page.locator('#leadProcessFilter').fill('0000043');
  await page.locator('#leadProcessFilter').press('Enter');
  await expect(visibleRows(page)).toHaveCount(0);
  await expect(page.locator('#leadListEmpty')).toBeVisible();
  await openFilters(page);
  await page.locator('#leadResetFilters').click();
  await expect(visibleRows(page)).toHaveCount(10);
  for (const id of ['leadMerchantFilter','leadContactFilter','leadEmailFilter','leadProcessFilter','partnerFilter','snFilter','statusFilter','secondaryFilter']) {
    await expect(page.locator('#'+id)).toHaveValue('');
  }
});

test('SN is exact and includes unassigned SNs; searchable country and new status apply with Enter', async ({page}) => {
  const sn = await page.evaluate(() => window.PaywizardUptLeadData.getByProcessId('00000438').serialNumbers[0]);
  await page.locator('#snFilter').fill(sn.slice(0,-1)); await page.locator('#snFilter').press('Enter');
  await expect(visibleRows(page)).toHaveCount(0);
  await page.locator('#snFilter').fill(sn); await page.locator('#snFilter').press('Enter');
  await expect(visibleRows(page)).toHaveCount(1);
  await expect(visibleRows(page).locator('.assigned-sn-count')).toHaveText('0');
  await openFilters(page); await page.locator('#leadResetFilters').click();
  await page.keyboard.press('Escape');
  await page.locator('#leadCountryPicker input').fill('Mongolia');
  await page.locator('#leadCountryPicker input').press('Enter');
  await expect(visibleRows(page)).toHaveCount(1);
  await openFilters(page);
  await page.locator('#statusPicker input').fill('Deployment');
  await page.locator('#statusPicker input').press('Enter');
  await expect(visibleRows(page)).toHaveCount(0);
  await expect(page.locator('#statusFilter')).toHaveValue('Deployment Complete');
  await page.locator('#leadResetFilters').click();
  await expect(visibleRows(page)).toHaveCount(10);
  await expect(page.locator('#leadCountryPicker input')).toHaveValue('');
});

test('drag order and hidden columns persist without breaking row operations or edit links', async ({page}) => {
  await page.locator('#leadColumnsButton').click();
  await column(page,'merchantName').locator('button').dragTo(column(page,'processId').locator('button'));
  await column(page,'processId').getByRole('checkbox').uncheck();
  await page.keyboard.press('Escape');
  await page.reload();
  const table = page.locator('[data-table-view="upt"]');
  await expect(table.locator('th:visible').first()).toHaveText('Merchant Name');
  await expect(table.locator('th[data-lead-column="processId"]')).toBeHidden();
  await expect(table.locator('th:visible').last()).toHaveText('Actions');
  const row = page.locator('#uptLeadRows tr[data-process-id="00000440"]');
  await row.getByLabel('More',{exact:true}).click();
  await page.locator('[data-lead-terminal-label]').click();
  await expect(page.locator('#leadAddSnModal')).toBeVisible();
  await page.locator('#leadAddSnInput').fill('WP99999999999907');
  await page.locator('#leadAddSnForm').getByRole('button',{name:'Confirm',exact:true}).click();
  expect(await page.evaluate(() => window.PaywizardUptLeadData.getByProcessId('00000440').serialNumbers)).toContain('WP99999999999907');
  await expect(row.locator('[data-lead-column="merchantName"]')).toHaveText('Brittney Rodriguez');
  await expect(row.locator('[data-lead-column="terminalNumber"]')).toHaveText('1');
  await row.getByLabel('Edit',{exact:true}).click();
  await expect(page).toHaveURL(/leadProcessId=00000440/);
  await page.locator('#cancelLead').click();
  await expect(table.locator('th:visible').first()).toHaveText('Merchant Name');
});

test('last-column protection, Select All and Reset preserve their boundaries; PSP is unchanged', async ({page}) => {
  await page.locator('#partnerFilter').fill('IMT'); await page.locator('#partnerFilter').press('Enter');
  await page.locator('#leadColumnsButton').click();
  await column(page,'merchantName').locator('button').press('Alt+ArrowUp');
  const reordered = await page.locator('#leadColumnsList > div').evaluateAll(rows => rows.map(row => row.dataset.columnKey));
  for (const key of reordered.filter(key => key !== 'merchantName')) await column(page,key).getByRole('checkbox').uncheck();
  await expect(column(page,'merchantName').getByRole('checkbox')).toBeDisabled();
  await expect(page.locator('#leadColumnsHint')).toBeVisible();
  await expect(page.locator('[data-table-view="upt"] th:visible')).toHaveText(['Merchant Name','Actions']);
  await page.locator('#leadSelectAllColumns').click();
  expect(await page.locator('#leadColumnsList > div').evaluateAll(rows => rows.map(row => row.dataset.columnKey))).toEqual(reordered);
  await page.locator('#leadResetColumns').click();
  await expect(page.locator('[data-table-view="upt"] th:visible').first()).toHaveText('Process ID');
  await expect(page.locator('#partnerFilter')).toHaveValue('IMT');
  await expect(visibleRows(page)).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:'PSP',exact:true}).click();
  await expect(page.locator('#leadColumnsButton')).toBeHidden();
  await expect(page.locator('#statusPicker')).toBeVisible();
  await expect(page.locator('#secondaryFilter')).toBeVisible();
  await expect(page.locator('[data-table-view="intl"] th:visible')).toHaveCount(15);
  await page.locator('#partnerFilter').fill('AtlasPay'); await page.locator('#filterButton').click();
  await expect(page.locator('#leadFilterPanel')).toBeHidden();
  await expect(page.locator('#intlLeadRows tr:visible')).toHaveCount(2);
});

test('storage failure keeps the current selection and focuses the visible explanation', async ({page}) => {
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k,v) { if(k===key) throw new DOMException('Quota','QuotaExceededError'); return original.call(this,k,v); };
  },storageKey);
  await page.locator('#leadColumnsButton').click();
  await column(page,'email').getByRole('checkbox').uncheck();
  await expect(page.locator('#leadColumnsError')).toBeFocused();
  await expect(page.locator('#leadColumnsError')).toBeInViewport();
  await expect(page.locator('#leadColumnsError')).toContainText('Unable to remember');
  await expect(column(page,'email').getByRole('checkbox')).not.toBeChecked();
  await expect(page.locator('[data-table-view="upt"] th[data-lead-column="email"]')).toBeHidden();
});

test('desktop popovers, dropdowns, compact headers, keyboard focus and screenshots', async ({page}) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  for (const width of [1600,1280]) {
    const height = width === 1600 ? 1000 : 800;
    await page.setViewportSize({width,height});
    await openFilters(page);
    for (const id of ['leadResetFilters']) expect(await page.locator('#'+id).evaluate(el=>el.getBoundingClientRect().height)).toBe(40);
    await page.screenshot({path:`artifacts/leads-editor/filters-${width}.png`});
    await page.locator('#statusPicker input').click();
    const options=page.locator('#statusPicker [role="listbox"]'); await expect(options).toBeVisible();
    const bounds=await options.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
    await page.screenshot({path:`artifacts/leads-editor/filter-status-${width}.png`});
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await expect(page.locator('#filterButton')).toBeFocused();
    await page.locator('#leadColumnsButton').click();
    const panel=await page.locator('#leadColumnsPanel').boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.y+panel.height).toBeLessThanOrEqual(height);expect(panel.x+panel.width).toBeLessThanOrEqual(width);
    await column(page,'merchantName').locator('button').press('Alt+ArrowUp');
    await page.screenshot({path:`artifacts/leads-editor/columns-${width}.png`});
    await page.keyboard.press('Escape'); await expect(page.locator('#leadColumnsButton')).toBeFocused();
    const header=page.locator('[data-table-view="upt"] th:visible').first();
    expect(await header.evaluate(el=>el.getBoundingClientRect().height)).toBe(34);
    await expect(header).toHaveCSS('font-size','11px');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
