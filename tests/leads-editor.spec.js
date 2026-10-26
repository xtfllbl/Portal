const { test, expect } = require('@playwright/test');
const list = '/29.INTL_PSP_merchant_lead_list.html';
const editor = '/29.UPT_merchant_lead_edit.html';
const details = '/28.UPT_merchant_lead_detail.html';
async function choose(page, id, value) {
  const input=page.locator(`#field-${id} .merchant-select input`);
  await input.fill(value); await input.press('Enter');
  await expect(page.locator('#'+id)).toHaveValue(value);
}
async function required(page, name='Prototype Merchant') {
  await choose(page,'country','United States of America');
  await page.locator('#merchantName').fill(name);
  await page.locator('#contactName').fill('Alex Chen');
  await page.locator('#email').fill('alex@example.com');
}
async function save(page) {
  await page.locator('#saveLead').click();
  await expect(page.locator('#leadConfirm')).toBeVisible();
  await page.locator('#acceptConfirm').click();
  await page.waitForURL('**/29.INTL_PSP_merchant_lead_list.html*');
}
test.beforeEach(async ({page})=>{ await page.setViewportSize({width:1600,height:1000}); });

test('Add validates visibly, supports keyboard search and creates a persistent Lead with six sections',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(list); await page.locator('#addLead').click();
  await expect(page.locator('.lead-detail-section')).toHaveCount(6);
  await page.locator('.lead-editor-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
  await page.locator('#saveLead').click();
  await expect(page.locator('#formError')).toBeFocused();
  await expect(page.locator('#formError')).toBeInViewport();
  await expect(page.locator('.field-error')).toHaveCount(4);
  await required(page);
  await choose(page,'region','California');
  await choose(page,'partnerName','上海比至');
  await expect(page.locator('#snOptions input:disabled').first()).toBeVisible();
  const sn=await page.locator('#snOptions input:not(:disabled)').first().getAttribute('value');
  await page.locator('#snOptions input:not(:disabled)').first().check();
  await page.locator('#snSearch').fill('NO MATCH');
  await expect(page.locator('#selectedSn')).toContainText(sn);
  await page.locator('#snSearch').fill('');
  await page.locator('#sameAsMerchant').check(); await page.locator('#sameAsFirst').check();
  await page.locator('#contactName').fill('Alex Updated');
  await expect(page.locator('#decisionName')).toHaveValue('Alex Updated');
  await expect(page.locator('#secondName')).toHaveValue('Alex Updated');
  await page.locator('#attachmentInput').setInputFiles({name:'proposal.txt',mimeType:'text/plain',buffer:Buffer.from('prototype')});
  await page.locator('#notes').fill('First pilot location.');
  await choose(page,'vendingMachineType','Other');
  await page.locator('#otherServiceType').fill('Library kiosk');
  await save(page);
  await expect(page.locator('#uptLeadRows tr').first()).toContainText('Prototype Merchant');
  const process=await page.locator('#uptLeadRows tr').first().locator('td').first().innerText();
  await page.reload();await expect(page.locator('#uptLeadRows tr').first()).toContainText('Prototype Merchant');
  await page.locator('#uptLeadRows tr').first().getByLabel('View detail',{exact:true}).click();
  await expect(page.locator('[data-field="merchantName"]')).toHaveText('Prototype Merchant');
  await expect(page.locator('[data-field="decisionMaker.name"]')).toHaveText('Alex Updated');
  await expect(page.locator('#leadAttachments')).toContainText('proposal.txt');
  await expect(page.locator('[data-field="otherServiceType"]')).toHaveText('Library kiosk');
  await page.goto(list);await page.locator('#uptLeadRows tr').first().getByLabel('Edit',{exact:true}).click();
  await page.locator('#email').fill('updated@example.com');await save(page);
  await expect(page.locator('#uptLeadRows tr').first()).toContainText('updated@example.com');
  expect(await page.evaluate(()=>window.PaywizardUptLeadData.getRecords().filter(r=>r.createdLead).length)).toBe(1);
  expect(await page.evaluate(id=>window.PaywizardUptLeadData.getByProcessId(id).serialNumbers,process)).toEqual([sn]);
  expect(errors).toEqual([]);
});

test('Edit preserves legacy values, readonly fields and terminal assignments while updating list and details',async({page})=>{
  await page.goto(list);
  const before=await page.evaluate(()=>{
    const d=window.PaywizardUptLeadData, lead=d.getByProcessId('00000438');
    d.assignSerialNumbers(lead.processId,'Existing Merchant','Existing Store',[lead.serialNumbers[0]],{scenario:'Vending Machine',cardless:true,routing:true});
    return d.getByProcessId(lead.processId);
  });
  const row=page.locator('#uptLeadRows tr').filter({has:page.locator('td', {hasText:/^00000438$/})});
  await row.getByLabel('Edit',{exact:true}).click();
  await expect(page.locator('#field-partnerName .merchant-select input')).toBeDisabled();
  await expect(page.locator('#field-pageStyle .merchant-select input')).toBeDisabled();
  await expect(page.locator('#selectedSn button')).toHaveCount(0);
  await expect(page.locator('#attendant')).toHaveValue('Mixed');
  await expect(page.locator('#vendingMachineType')).toHaveValue(before.vendingMachineType);
  await page.locator('#merchantName').fill('Updated Arena');
  await choose(page,'status','Onboarding Complete');
  await save(page);
  await expect(row).toContainText('Updated Arena');
  await page.locator('#filterButton').click();
  await page.locator('#statusPicker input').fill('Onboarding Complete');
  await page.locator('#statusPicker input').press('Enter');
  await page.locator('#leadFilterPanel').getByRole('button', {name:'Search',exact:true}).click();
  await expect(row).toBeVisible();
  const after=await page.evaluate(()=>window.PaywizardUptLeadData.getByProcessId('00000438'));
  expect(after.snAssignments).toEqual(before.snAssignments);
  expect(after.serialNumbers).toEqual(before.serialNumbers);
  expect(after.processing).toEqual(before.processing);
  expect(after.attachments).toEqual(before.attachments);
  await row.getByLabel('View detail',{exact:true}).click();
  await expect(page.locator('[data-field="merchantName"]')).toHaveText('Updated Arena');
});

test('legacy pending date and long decision-maker name survive unrelated edits',async({page})=>{
  await page.goto(editor+'?leadProcessId=00000440');
  await expect(page.locator('#arrivalTime')).toHaveValue('Pending');
  await page.locator('#leadOwner').fill('New Owner');await save(page);
  expect(await page.evaluate(()=>window.PaywizardUptLeadData.getByProcessId('00000440').arrivalTime)).toBe('Pending');
  await page.goto(editor+'?leadProcessId=00000434');
  await expect(page.locator('#decisionName')).toHaveValue('Wahyu Yudhistira Tafrikun');
  await page.locator('#leadOwner').fill('New Owner');await save(page);
  expect(await page.evaluate(()=>window.PaywizardUptLeadData.getByProcessId('00000434').decisionMaker.name)).toBe('Wahyu Yudhistira Tafrikun');
});

test('cancel protects unsaved values and returning restores filters; PSP retains only View',async({page})=>{
  await page.goto(list);await page.locator('#partnerFilter').fill('IMT');await page.locator('#partnerFilter').press('Enter');
  await page.locator('#uptLeadRows tr:visible').first().getByLabel('Edit',{exact:true}).click();
  await page.locator('#merchantName').fill('Unsaved');await page.locator('#cancelLead').click();
  await expect(page.locator('#confirmTitle')).toHaveText('Discard changes?');
  await page.keyboard.press('Escape');await expect(page.locator('#merchantName')).toHaveValue('Unsaved');
  await page.locator('#cancelLead').click();await page.locator('#acceptConfirm').click();
  await expect(page.locator('#partnerFilter')).toHaveValue('IMT');
  await expect(page.locator('#uptLeadRows')).not.toContainText('Unsaved');
  await page.getByRole('tab',{name:'PSP',exact:true}).click();
  await expect(page.locator('[data-table-view="intl"] .edit')).toHaveCount(0);
  await page.locator('#addLead').click();await expect(page.locator('#pageStyle')).toHaveValue('UPT');
  await page.locator('#cancelLead').click();await expect(page.getByRole('tab',{name:'PSP',exact:true})).toHaveAttribute('aria-selected','true');
});

test('attachment cap, Partner changes and storage failure preserve input and show focused errors',async({page})=>{
  await page.goto(editor);await required(page,'Save Failure Merchant');
  await choose(page,'partnerName','上海比至');await page.locator('#snOptions input:not(:disabled)').first().check();
  await choose(page,'partnerName','IMT');await expect(page.locator('#snCount')).toHaveText('0 selected');
  const files=Array.from({length:6},(_,i)=>({name:`file-${i}.txt`,mimeType:'text/plain',buffer:Buffer.from('x')}));
  await page.locator('#attachmentInput').setInputFiles(files);await expect(page.locator('#attachmentError')).toBeVisible();
  await expect(page.locator('#attachmentList li')).toHaveCount(0);
  await page.locator('#attachmentInput').setInputFiles(files.slice(0,5));await expect(page.locator('#attachmentList li')).toHaveCount(5);
  await page.getByLabel('Remove file-0.txt',{exact:true}).click();await expect(page.locator('#attachmentList li')).toHaveCount(4);
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='paywizard-upt-lead-overrides-v1')throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v);};});
  await page.locator('#saveLead').click();await page.locator('#acceptConfirm').click();
  await expect(page.locator('#formError')).toContainText('Unable to save');await expect(page.locator('#formError')).toBeFocused();
  await expect(page.locator('#formError')).toBeInViewport();await expect(page.locator('#merchantName')).toHaveValue('Save Failure Merchant');
  await expect(page.locator('#saveLead')).toBeEnabled();
});

test('new Lead continues through Add SN and assignment; submission rechecks occupied SNs',async({page})=>{
  await page.goto(editor);await required(page);await save(page);
  const result=await page.evaluate(()=>{
    const d=window.PaywizardUptLeadData, record=d.getRecords()[0];
    const added=d.addSerialNumbers(record.processId,'WP99999999999901');
    const assigned=d.assignSerialNumbers(record.processId,'Merchant','Store',['WP99999999999901'],{scenario:'Vending Machine',cardless:true,routing:false});
    return {added,assigned};
  });
  expect(result.added.valid).toBe(true);expect(result.assigned.valid).toBe(true);
  await page.goto(editor);await required(page,'Conflict Merchant');await choose(page,'partnerName','上海比至');
  await page.locator('#snOptions input:not(:disabled)').first().check();
  const sn=await page.locator('#snOptions input:checked').inputValue();
  await page.evaluate(sn=>window.PaywizardUptLeadData.addSerialNumbers('00000440',sn),sn);
  await page.locator('#saveLead').click();await page.locator('#acceptConfirm').click();
  await expect(page.locator('#formError')).toContainText('no longer available');
  await expect(page.locator('#selectedSn')).toContainText(sn);
  await page.getByLabel('Remove '+sn,{exact:true}).click();await save(page);
});

test('invalid or onboarded Leads cannot edit or write',async({page})=>{
  await page.goto(editor+'?leadProcessId=missing');await expect(page.locator('#saveLead')).toBeDisabled();await expect(page.locator('#formError')).toContainText('could not be found');
  await page.goto(list);await page.evaluate(()=>localStorage.setItem('paywizard-onboarding-applications-v2',JSON.stringify([{sourceLeadProcessId:'00000440'}])));await page.reload();
  await expect(page.locator('#uptLeadRows tr').first().getByLabel('Edit',{exact:true})).toBeDisabled();
  await page.goto(editor+'?leadProcessId=00000440');await expect(page.locator('#saveLead')).toBeDisabled();await expect(page.locator('#formError')).toBeInViewport();
});

test('desktop layout keeps footer visible and selector popup within the viewport',async({page})=>{
  await page.goto(editor);
  for(const width of [1600,1280]) {
    await page.setViewportSize({width,height:width===1600?1000:800});
    await expect(page.locator('#saveLead')).toBeInViewport();
    expect(await page.locator('#saveLead').evaluate(el=>el.getBoundingClientRect().height)).toBe(40);
    await page.locator('#field-country .merchant-select input').click();
    const popup=page.locator('#field-country [role="listbox"]');await expect(popup).toBeVisible();
    const box=await popup.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(width===1600?1000:800);
    await page.keyboard.press('Escape');
    await page.screenshot({path:`artifacts/leads-editor/add-${width}.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('.lead-editor-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
    await expect(page.locator('#additionalInformation')).toBeInViewport();await expect(page.locator('#saveLead')).toBeInViewport();
    await page.screenshot({path:`artifacts/leads-editor/bottom-${width}.png`});
    await page.locator('.lead-editor-scroll').evaluate(el=>el.scrollTop=0);
  }
});

test('five Lead stages stay consistent across UPT, PSP, editor, filters and details', async ({page}) => {
  const stages = ['Awaiting Customer Response', 'Onboarding in Progress', 'Onboarding Complete', 'Store Created', 'Deployment Complete'];
  await page.goto(editor);
  await expect(page.locator('#status')).toHaveValue(stages[0]);
  expect(await page.locator('#status option:not([disabled])').allTextContents()).toEqual(stages);
  await choose(page, 'status', stages[4]);
  await required(page, 'Deployment Stage Merchant');
  await save(page);
  const row = page.locator('#uptLeadRows tr').first();
  await expect(row).toContainText(stages[4]);
  await page.locator('#filterButton').click();
  const input = page.locator('#statusPicker input');
  await input.fill('Deployment');
  await input.press('Enter');
  await expect(page.locator('#uptLeadRows tr:visible')).toHaveCount(1);
  await input.click();
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue(stages[4]);
  await page.locator('#leadFilterPanel').getByRole('button', {name:'Search',exact:true}).click();
  await row.getByLabel('Edit', {exact:true}).click();
  await expect(page.locator('#status')).toHaveValue(stages[4]);
  await page.locator('#cancelLead').click();
  await page.locator('#filterButton').click();
  await expect(page.locator('#statusPicker input')).toHaveValue(stages[4]);
  await page.keyboard.press('Escape');
  await page.locator('#uptLeadRows tr:visible').getByLabel('View detail', {exact:true}).click();
  await expect(page.locator('[data-field="status"]')).toHaveText(stages[4]);
  await page.goto(list);
  await page.getByRole('tab', {name:'PSP', exact:true}).click();
  expect(await page.locator('#statusFilter option').allTextContents()).toEqual(['Status', ...stages]);
  const samples = await page.locator('#intlLeadRows tr').evaluateAll(rows => rows.map(row => ({
    status: row.dataset.status, text: row.querySelector('.status').textContent,
    href: row.querySelector('a.view').getAttribute('href')
  })));
  expect(new Set(samples.map(row => row.status))).toEqual(new Set(stages));
  for (const sample of samples) {
    expect(sample.text).toBe(sample.status);
    await page.goto('/' + sample.href);
    await expect(page.locator('#leadStatus')).toHaveText(sample.status);
  }
});

test('old local statuses migrate without losing SN data or unlocking protected Leads', async ({page}) => {
  await page.goto(list);
  const assignments = { WP99999999999901: {sn:'WP99999999999901', merchantName:'Kept Merchant', storeName:'Kept Store', assignedAt:'2026-10-25'} };
  const saved = {
    '00000440': {status:'Successful Pitch', merchantName:'Kept Name', serialNumbers:['WP99999999999901'], snAssignments:assignments, notes:'Kept notes'},
    '00000439': {status:'Negotiation'},
    '00000438': {status:'6'},
    '00000437': {status:'Deployment Complete'},
    '00000436': {status:'Activation Complete'}
  };
  await page.evaluate(value => localStorage.setItem('paywizard-upt-lead-overrides-v1', JSON.stringify(value)), saved);
  await page.reload();
  const result = await page.evaluate(() => ({
    saved: JSON.parse(localStorage.getItem('paywizard-upt-lead-overrides-v1')),
    protectedEditable: window.PaywizardUptLeadData.canEdit(window.PaywizardUptLeadData.getByProcessId('00000438'))
  }));
  expect(result.saved['00000440']).toEqual({...saved['00000440'], status:'Awaiting Customer Response'});
  expect(result.saved['00000439'].status).toBe('Onboarding in Progress');
  expect(result.saved['00000437'].status).toBe('Deployment Complete');
  expect(result.saved['00000436'].status).toBe('Deployment Complete');
  expect(result.protectedEditable).toBe(false);
  await page.goto(editor+'?leadProcessId=00000440');
  await expect(page.locator('#status')).toHaveValue('Awaiting Customer Response');
  expect(await page.locator('#status option').allTextContents()).not.toContain('Successful Pitch');
  await page.locator('#leadOwner').fill('Updated Owner');
  await save(page);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('paywizard-upt-lead-overrides-v1'))['00000440']);
  expect(after.snAssignments).toEqual(assignments);
  expect(after.serialNumbers).toEqual(saved['00000440'].serialNumbers);
  expect(after.merchantName).toBe('Kept Name');
});
