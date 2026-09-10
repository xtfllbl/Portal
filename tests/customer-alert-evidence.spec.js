const {test,expect}=require('@playwright/test');
test('monitoring checks update actual table evidence and survive reload',async({page})=>{
 await page.goto('/1.terminalmanage_nayax.html?tab=alerts');
 const row=page.locator('[data-incident-id="i-mid-01"]');
 await expect(row).toContainText('No approved transaction');
 await row.getByRole('button',{name:'View timeline'}).click();
 await page.getByRole('button',{name:'Run next monitoring check'}).click();
 await expect(page.locator('[data-alert-observed-evidence]')).toContainText('Recovery check 1/2');
 await page.getByRole('button',{name:'Run next monitoring check'}).click();
 await expect(page.locator('[data-alert-observed-evidence]')).toHaveText('Last approved transaction 1m ago · Threshold ≥ 2h');
 await page.reload(); await expect(row).toContainText('Resolved'); await expect(row).toContainText('Last approved transaction 1m ago');
});
test('representative multi-bin details and unavailable evaluation',async({page})=>{
 await page.goto('/1.terminalmanage_nayax.html?tab=alerts');
 const row=page.locator('[data-incident-id="i-evidence-multi-bin"]');
 await expect(row).toContainText('+1 more');
 await row.getByRole('button',{name:'View timeline'}).click();
 await expect(page.getByRole('list',{name:'Observed BIN details'}).locator('li')).toHaveCount(4);
 await page.getByRole('button',{name:'Run next monitoring check'}).click();
 await expect(page.locator('[data-alert-observed-evidence]')).toContainText('not evaluated');
 await expect(page.locator('[data-alert-incident-body]')).toContainText('Active');
});
test('arbitrary legacy evidence is preserved without fabricated observations',async({page})=>{
 await page.goto('/1.terminalmanage_nayax.html?tab=alerts');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('paywizard.customerAlerts.v1'));const i=s.incidents[0];delete i.evidenceVersion;delete i.observation;i.evidence='Historical site observation';i.monitoringState='Resolved';localStorage.setItem('paywizard.customerAlerts.v1',JSON.stringify(s));});
 await page.reload(); await expect(page.locator('[data-incident-id="i-mid-01"]')).toContainText('Observation details unavailable · Previous evidence: Historical site observation');
});
for(const width of [1440,390]) test(`case catalogue filters at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/customer-alert-evidence-cases.html');
 await page.getByRole('combobox',{name:'Condition',exact:true}).selectOption('selected_product');
 await page.getByRole('combobox',{name:'Rule Target',exact:true}).selectOption('Store');
 await page.getByLabel('Search',{exact:true}).fill('different_bin');
 await expect(page.locator('#cases tr')).toHaveCount(5);
 await expect(page.locator('#cases')).toContainText('BIN D8');
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await expect(page.locator('#cases tr')).toHaveCount(40);
});
