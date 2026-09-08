const { test, expect } = require('@playwright/test');
for (const width of [1440, 390]) {
  test(`terminal owner and role scope at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height:900});
    const errors=[]; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/1.terminalmanage_nayax.html?tab=alerts');
    const surface=page.locator('[data-alert-page="terminal"]');
    await expect(surface.locator('[data-alert-role-switcher]')).toHaveValue('merchant');
    await expect(surface.locator('thead').first().getByText('Rule Owner')).toBeHidden();
    if (width > 600) {
      const createBox = await surface.locator('[data-alert-create]').boundingBox();
      const roleBox = await surface.locator('[data-alert-role-switcher]').boundingBox();
      expect(Math.abs(createBox.y-roleBox.y)).toBeLessThan(2);
      expect(Math.abs(createBox.height-roleBox.height)).toBeLessThan(2);
      expect(roleBox.x).toBeGreaterThan(createBox.x+createBox.width);
    }
    await surface.locator('[data-alert-role-switcher]').selectOption('operations-manager');
    await surface.locator('[data-alert-create]').click();
    const owner=page.locator('[data-alert-context-modal]');
    await expect(owner).toHaveClass(/open/);
    await expect(owner.locator('option')).toHaveText(['Select owner level','Service Provider','Merchant','Store']);
    for (const [level,name] of [['Service Provider','Universal Processing'],['Merchant','1 of a Kind World Travel LLC'],['Store','Midtown Store']]) {
      await owner.getByLabel('Owner Level').selectOption(level);
      await expect(owner.locator('[data-alert-terminal-owner-name]')).toHaveValue(name);
    }
    if (width > 600) {
      const levelBox=await owner.getByLabel('Owner Level').boundingBox();
      const nameBox=await owner.locator('[data-alert-terminal-owner-name]').boundingBox();
      expect(levelBox.y).toBe(nameBox.y); expect(levelBox.height).toBe(nameBox.height);
    }
    const heights=await owner.locator('.alert-modal-actions button').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));
    expect(Math.abs(heights[0]-heights[1])).toBeLessThan(1);
    await owner.getByLabel('Owner Level').selectOption('Service Provider');
    await owner.screenshot({path:`artifacts/terminal-owner-dialog-${width}.png`});
    await owner.getByRole('button',{name:'Continue'}).click();
    const form=page.locator('[data-alert-modal]');
    await expect(form.locator('[data-alert-owner-context]')).toContainText('Service Provider · Universal Processing');
    await form.getByRole('button',{name:'Save Rule'}).click();
    await expect(form).not.toHaveClass(/open/);
    await surface.locator('[data-alert-view-tab="rules"]').click();
    await expect(surface.locator('[data-alert-rules]')).toContainText('Service Provider · Universal Processing');
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1')).rules[0]);
    expect(saved.ownerType).toBe('Service Provider'); expect(saved.creatorType).toBe('Paywizard Operator'); expect(saved.targetId).toBe('WP6267UQ36002376');
    await surface.locator('[data-alert-role-switcher]').selectOption('merchant');
    await expect(surface.locator('[data-alert-rules]')).not.toContainText('Service Provider ·');
    await surface.locator('[data-alert-create]').click();
    await expect(form).toHaveClass(/open/);
    await expect(owner).not.toHaveClass(/open/);
    await form.getByRole('button',{name:'Save Rule'}).click();
    await expect(form).not.toHaveClass(/open/);
    const ordinary=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1')).rules[0]);
    expect(ordinary.ownerId).toBe('merchant-kind-world'); expect(ordinary.creatorType).toBe('Customer User');
    expect(errors).toEqual([]);
    await page.screenshot({path:`artifacts/terminal-alert-owner-${width}.png`,fullPage:true});
  });
}
test('terminal ancestry with agent and another merchant is resolved from SN', async ({page}) => {
  await page.goto('/1.terminalmanage_nayax.html?tab=alerts&sn=WP7300EV33001088&role=operations-manager');
  await page.locator('[data-alert-create]').click();
  const owner=page.locator('[data-alert-context-modal]');
  await owner.getByLabel('Owner Level').selectOption('Agent');
  await owner.locator('#terminalAgentOwner').click();
  await owner.getByRole('option',{name:'Seattle Field Agent · Level 1',exact:true}).click();
  await owner.getByRole('button',{name:'Continue'}).click();
  await page.locator('[data-alert-modal]').getByRole('button',{name:'Save Rule'}).click();
  await expect(page.locator('[data-alert-modal]')).not.toHaveClass(/open/);
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1')).rules[0]);
  expect(saved.ownerType).toBe('Agent'); expect(saved.targetId).toBe('WP7300EV33001088');
  await page.locator('[data-alert-role-switcher]').selectOption('merchant');
  await page.locator('[data-alert-create]').click();
  await page.locator('[data-alert-modal]').getByRole('button',{name:'Save Rule'}).click();
  await expect(page.locator('[data-alert-modal]')).not.toHaveClass(/open/);
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1')).rules[0]);
  expect(saved.ownerId).toBe('seattle-central');
});
test('ordinary customers retain all terminal incidents but cannot act on another owner',async({page})=>{
  await page.goto('/1.terminalmanage_nayax.html?tab=alerts');
  const changedId=await page.evaluate(()=>{
    const key='paywizard.customerAlerts.v1'; const state=JSON.parse(localStorage.getItem(key));
    const incident=state.incidents.find(i=>i.terminalId==='WP6267UQ36002376');
    const rule=state.rules.find(r=>r.id===incident.ruleId);
    Object.assign(rule,{ownerType:'Service Provider',ownerId:'sp-universal',owner:'Universal Processing',ownerName:'Universal Processing'});
    Object.assign(incident,{monitoringState:'Active',acknowledgedAt:null});
    localStorage.setItem(key,JSON.stringify(state));
    return incident.id;
  });
  await page.reload();
  const row=page.locator(`[data-incident-id="${changedId}"]`);
  await expect(row).toBeVisible();
  await expect(row.locator('[data-alert-acknowledge],[data-alert-close-incident]')).toHaveCount(0);
  await row.locator('[data-alert-view]').click();
  await expect(page.locator('[data-alert-incident-modal] [data-alert-close-incident]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('[data-alert-role-switcher]').selectOption('operations-manager');
  await expect(row.locator('[data-alert-acknowledge]')).toBeVisible();
  await expect(row.locator('[data-alert-close-incident]')).toBeVisible();
});
test('three agent levels share stable ownership across terminal and center',async({page})=>{
 await page.goto('/1.terminalmanage_nayax.html?tab=alerts&sn=DEMO-AGT3-001&role=operations-manager');
 await page.locator('[data-alert-create]').click();
 const owner=page.locator('[data-alert-context-modal]');
 await expect(owner.locator('option')).toHaveText(['Select owner level','Service Provider','Agent','Merchant','Store']);
 await owner.getByLabel('Owner Level').selectOption('Agent');
 await expect(owner.getByRole('button',{name:'Continue'})).toBeDisabled();
 for (const depth of [1,2,3]) {
   await owner.locator('#terminalAgentOwner').click();
   await expect(owner.locator('#terminalAgentList').getByRole('option')).toHaveCount(3);
   await owner.getByRole('combobox',{name:'Search agent',exact:true}).fill(`demo-agent-l${depth}`);
   await owner.getByRole('option',{name:`Demo Agent Level ${depth} · Level ${depth}`,exact:true}).click();
 }
 await owner.getByRole('button',{name:'Continue'}).click();
 await page.locator('[data-alert-modal]').getByRole('button',{name:'Save Rule'}).click();
 await expect(page.locator('[data-alert-modal]')).not.toHaveClass(/open/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1')).rules[0]);
 expect(saved.ownerId).toBe('demo-agent-l3');expect(saved.ownerType).toBe('Agent');expect(saved.ownerPath).toContain('Demo Agent Level 1 / Demo Agent Level 2 / Demo Agent Level 3');
 await page.goto('/39.customer_alerts.html?role=operations-manager');
 await page.locator('[data-alert-create]').click();
 await owner.getByLabel('Owner Level').selectOption('Agent');
 await owner.locator('#alertOwnerAgent').click();
 await owner.getByRole('combobox',{name:'Search agent',exact:true}).fill('demo-agent-l3');
 await owner.getByRole('option',{name:'Demo Agent Level 3 · Level 3',exact:true}).click();
 await expect(owner.locator('#alertOwnerProvider')).toContainText('Universal Processing');
 await owner.getByRole('button',{name:'Continue'}).click();
 await expect(page.locator('[data-alert-owner-context-name]')).toContainText(saved.ownerPath);
 await page.locator('[data-alert-owner-change]').click();
 await expect(owner.locator('#alertOwnerAgent')).toContainText('Demo Agent Level 3');
});
for(const depth of [1,2,3]) test(`center direct merchant path at agent level ${depth}`,async({page})=>{
 await page.goto('/39.customer_alerts.html?role=operations-manager');await page.locator('[data-alert-create]').click();
 const owner=page.locator('[data-alert-context-modal]');await owner.getByLabel('Owner Level').selectOption('Store');
 const pick=async(field,name)=>{const root=owner.locator(`[data-alert-context-field="${field}"]`);await root.locator('.alert-owner-trigger').click();await root.getByRole('combobox').fill(name);await root.getByRole('option',{name,exact:true}).click();};
 await pick('store',`Demo Store Level ${depth}`);
 await expect(owner.locator('#alertOwnerProvider')).toContainText('Universal Processing');
 await expect(owner.locator('#alertOwnerAgent')).toContainText(`Demo Agent Level ${depth}`);
 await expect(owner.locator('#alertOwnerMerchant')).toContainText(`Demo Merchant Level ${depth}`);
 await owner.getByRole('button',{name:'Continue'}).click();
 const form=page.locator('[data-alert-modal]');
 await form.getByLabel('Monitor Scope').selectOption('Store');
 await form.getByLabel('Condition',{exact:true}).selectOption('opc_offline');
 await form.getByRole('button',{name:'Save Rule'}).click();await expect(form).not.toHaveClass(/open/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1')).rules[0]);expect(saved.ownerId).toBe(`demo-store-l${depth}`);expect(saved.targetId).toBe(`demo-store-l${depth}`);
});
for(const width of [1440,390]) test(`direct owner search and ancestor backfill at ${width}px`, async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/39.customer_alerts.html?role=operations-manager');
 await page.locator('[data-alert-create]').click();
 const dialog=page.getByRole('dialog',{name:'Select Rule Owner'});
 await dialog.getByLabel('Owner Level').selectOption('Store');
 const pick=async(field,query,id)=>{const root=dialog.locator(`[data-alert-context-field="${field}"]`);await root.locator('.alert-owner-trigger').click();await root.getByRole('combobox').fill(query);await root.locator(`[data-alert-owner-value="${id}"]`).click();};
 await pick('store','demo-store-l3','demo-store-l3');
 await expect(dialog.locator('#alertOwnerProvider')).toContainText('Universal Processing');
 await expect(dialog.locator('#alertOwnerAgent')).toContainText('Demo Agent Level 3');
 await expect(dialog.locator('#alertOwnerMerchant')).toContainText('Demo Merchant Level 3');
 await pick('store','Berlin Mitte','berlin-mitte');
 await expect(dialog.locator('#alertOwnerProvider')).toContainText('Europe Direct');
 await expect(dialog.locator('#alertOwnerAgent')).toContainText('Direct merchants');
 await expect(dialog.locator('#alertOwnerMerchant')).toContainText('Demo Cafe Berlin');
 await dialog.screenshot({path:`artifacts/owner-direct-search-${width}.png`});
 await pick('provider','Universal','sp-universal');
 await expect(dialog.locator('#alertOwnerStore')).toContainText('Select store');
 await expect(dialog.getByRole('button',{name:'Continue'})).toBeDisabled();
 await pick('agent','demo-agent-l1','demo-agent-l1');
 const store=dialog.locator('[data-alert-context-field="store"]');
 await store.locator('.alert-owner-trigger').click();await store.getByRole('combobox').fill('Demo Store');await expect(store.getByRole('option')).toHaveCount(3);
 await store.locator('[data-alert-owner-value="demo-store-l3"]').click();
 await expect(dialog.getByRole('button',{name:'Continue'})).toBeEnabled();
});
for(const width of [1440,390]) test(`terminal Agent search stays anchored at ${width}px`, async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/1.terminalmanage_nayax.html?tab=alerts&sn=DEMO-AGT3-001&role=operations-manager');await page.locator('[data-alert-create]').click();
 const dialog=page.getByRole('dialog',{name:'Select Rule Owner'});await dialog.getByLabel('Owner Level').selectOption('Agent');
 const box=await dialog.boundingBox();const footer=await dialog.locator('.alert-modal-actions').boundingBox();
 await dialog.locator('#terminalAgentOwner').click();
 const root=dialog.locator('[data-alert-owner-column="terminal-agent"]');
 for(const query of ['', 'demo-agent-l3','nothing-found']) {
  await root.getByRole('combobox').fill(query);
  await expect(root.locator('.alert-owner-popup')).toBeVisible();
  expect(await dialog.boundingBox()).toEqual(box);expect(await dialog.locator('.alert-modal-actions').boundingBox()).toEqual(footer);
  const gap=await root.evaluate(el=>{const t=el.querySelector('button').getBoundingClientRect();const panel=el.querySelector('.alert-owner-popup');const p=panel.getBoundingClientRect();return panel.dataset.placement==='top'?t.top-p.bottom:p.top-t.bottom;});expect(gap).toBeCloseTo(4,0);
 }
 await root.getByRole('combobox').fill('demo-agent-l2');
 await dialog.screenshot({path:`artifacts/terminal-agent-search-${width}.png`});
 await root.getByRole('option').click();await expect(dialog.getByRole('button',{name:'Continue'})).toBeEnabled();
 await dialog.getByRole('button',{name:'Continue'}).click();await expect(page.locator('[data-alert-owner-context-name]')).toContainText('Agent Level 2');
});
