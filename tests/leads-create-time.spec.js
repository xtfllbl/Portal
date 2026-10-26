const {test, expect} = require('@playwright/test');
const list = '/29.INTL_PSP_merchant_lead_list.html';
test.use({timezoneId:'Asia/Shanghai', viewport:{width:1600,height:1000}});
test.beforeEach(async ({page}) => { await page.goto(list); });

test('creation time is written once and survives edit, Add SN, assignment and reload', async ({page}) => {
  const result = await page.evaluate(() => {
    const data = window.PaywizardUptLeadData;
    const start = Date.now();
    const created = data.saveLead(null, {country:'United States of America',merchantName:'Creation Time Merchant',contactName:'Alex Chen',email:'alex@example.com',status:'Awaiting Customer Response'});
    if (!created.valid) throw new Error(created.error);
    const record = created.record;
    const edited = data.saveLead(record.processId, {...record, notes:'Follow-up', createTime:'1999-01-01T00:00:00Z'});
    const added = data.addSerialNumbers(record.processId,'WP99999999999908');
    const assigned = data.assignSerialNumbers(record.processId,'Creation Merchant','Creation Store',['WP99999999999908'],{scenario:'Vending Machine',cardless:true,routing:false});
    return {start,end:Date.now(),record,edited:edited.valid,added:added.valid,assigned:assigned.valid,after:data.getByProcessId(record.processId)};
  });
  expect(result.edited && result.added && result.assigned).toBe(true);
  expect(Date.parse(result.record.createTime)).toBeGreaterThanOrEqual(result.start);
  expect(Date.parse(result.record.createTime)).toBeLessThanOrEqual(result.end);
  expect(result.after.createTime).toBe(result.record.createTime);
  await page.reload();
  const saved = await page.evaluate(id => window.PaywizardUptLeadData.getByProcessId(id), result.record.processId);
  expect(saved.createTime).toBe(result.record.createTime);
  const local = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(saved.createTime));
  await expect(page.locator(`#uptLeadRows tr[data-process-id="${saved.processId}"] .lead-create-time`)).toHaveText(local.replace(' ','\n'));
});

test('seed times use local time, while old records missing creation time remain unknown', async ({page}) => {
  await expect(page.locator('#uptLeadRows tr[data-process-id="00000440"] .lead-create-time')).toHaveText('2026-05-27\n14:25:04');
  await page.evaluate(() => {
    const data = window.PaywizardUptLeadData;
    const legacy = {...data.getByProcessId('00000440'),processId:'00000999',createdLead:true,lastUpdate:'2020-01-01 00:00:00',updatedAt:'2021-01-01T00:00:00Z'};
    delete legacy.createTime;
    localStorage.setItem(data.STORAGE_KEY,JSON.stringify({'00000999':legacy}));
    const edited = data.saveLead(legacy.processId,{...legacy,notes:'Edited after upgrade'});
    if(!edited.valid) throw new Error(edited.error);
  });
  await page.reload();
  const legacy = page.locator('#uptLeadRows tr[data-process-id="00000999"] .lead-create-time');
  await expect(legacy).toHaveText('-');
  expect(await page.evaluate(() => window.PaywizardUptLeadData.getByProcessId('00000999').createTime)).toBeUndefined();
});

test('old column preferences gain a visible Create Time before Last Update and remain configurable', async ({page}) => {
  const previous = await page.locator('[data-table-view="upt"] th').evaluateAll(headers => {
    const keys=headers.map(cell=>cell.dataset.leadColumn).filter(key=>!['actions','createTime'].includes(key));
    keys.unshift(keys.pop());
    const saved=keys.map(key=>({key,visible:!['email','lastUpdate'].includes(key)}));
    localStorage.setItem('paywizard-upt-lead-columns-v1',JSON.stringify(saved));
    return saved;
  });
  await page.reload();
  const headers=page.locator('[data-table-view="upt"] th');
  const expected=previous.map(column=>column.key);
  expected.splice(expected.indexOf('lastUpdate'),0,'createTime');
  expect(await headers.evaluateAll(cells=>cells.map(cell=>cell.dataset.leadColumn))).toEqual([...expected,'actions']);
  await expect(headers.filter({hasText:'Create Time'})).toBeVisible();
  await expect(page.locator('th[data-lead-column="email"]')).toBeHidden();
  await expect(page.locator('th[data-lead-column="lastUpdate"]')).toBeHidden();
  await page.locator('#leadColumnsButton').click();
  const item=page.locator('[data-column-key="createTime"]');
  await item.getByRole('checkbox').uncheck();
  await item.locator('button').press('Alt+ArrowUp');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('th[data-lead-column="createTime"]')).toBeHidden();
  const stored=await headers.evaluateAll(cells=>cells.map(cell=>cell.dataset.leadColumn));
  expect(stored.indexOf('createTime')).toBe(expected.indexOf('createTime')-1);
  await page.locator('#leadColumnsButton').click(); await page.locator('#leadResetColumns').click();
  expect(await headers.allTextContents()).toEqual(['Process ID','SP Name','Partner Name','Country Name','Merchant Name','Terminal Number','Assigned SN','Contact Name','Merchant Email','Create Time','Last Update','Past Days','Page Style','Status','Actions']);
  await page.keyboard.press('Escape');
  for (const width of [1600,1280]) {
    await page.setViewportSize({width,height:width===1600?1000:800});
    await page.locator('.table-wrap').evaluate(el => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
    const creationBounds=await page.locator('th[data-lead-column="createTime"]').boundingBox();
    const actionBounds=await page.locator('[data-table-view="upt"] th').last().boundingBox();
    expect(creationBounds.x+creationBounds.width).toBeLessThanOrEqual(actionBounds.x);
    await page.screenshot({path:`artifacts/leads-editor/create-time-${width}.png`});
    expect(await page.locator('th[data-lead-column="createTime"]').evaluate(el=>el.getBoundingClientRect().height)).toBe(34);
  }
  await page.getByRole('tab',{name:'PSP',exact:true}).click();
  await expect(page.locator('[data-table-view="intl"] th')).toHaveCount(15);
  await expect(page.locator('[data-table-view="intl"] th', {hasText:'Create Time'})).toHaveCount(0);
});
