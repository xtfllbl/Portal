const {test,expect}=require('@playwright/test');
const profile=async(page,value='maintain')=>{await page.addInitScript(p=>localStorage.setItem('paywizard.portalAccessProfile.v1',p),value);};
const billPath='52.service_provider_bill.html?id=PB-2026Q3-1050';
async function draftFixture(page){await page.evaluate(()=>{const api=PaywizardProviderBilling,state=api.load(),bill=state.bills.find(b=>b.id==='PB-2026Q3-1050');bill.status='Draft';bill.publishedAt=null;bill.expiry=null;localStorage.setItem(api.KEY,JSON.stringify(state));});await page.reload();}
test('operations lists bills and uses keyboard-searchable provider filters',async({page})=>{
 await profile(page);await page.goto('/52.service_provider_billing.html');await expect(page.getByRole('heading',{name:'Service Provider Billing',exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Service provider',exact:true}).click();await page.getByRole('combobox',{name:'Search Service provider',exact:true}).fill('Civitronic');await page.keyboard.press('Enter');
 await expect(page.locator('.pb-table tbody tr')).toHaveCount(4);
 await page.getByRole('tab',{name:/Drafts/}).click();await expect(page.getByText('No bills found')).toBeVisible();
 await page.getByRole('tab',{name:/Drafts/}).press('ArrowRight');await expect(page.getByRole('tab',{name:/Unpaid/})).toHaveAttribute('aria-selected','true');await expect(page.locator('.pb-table tbody tr')).toHaveCount(2);
});
test('draft edits require a reason, preserve input, and publish a revised bill',async({page})=>{
 await profile(page);await page.goto('/'+billPath);await draftFixture(page);
 const quantity=page.locator('[data-field="quantity"]').first();await quantity.fill('1');
 await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#pbError')).toBeFocused();await expect(quantity).toHaveValue('1');
 await page.getByLabel('Internal adjustment reason').fill('Quarterly commercial review');await page.getByRole('button',{name:'Publish Bill',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Publish Bill'})).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Publish Bill',exact:true}).click();
 await expect(page.locator('.pb-meta-status')).toContainText('Unpaid');await expect(page.getByRole('button',{name:'Save Changes'})).toBeVisible();
 await page.getByRole('tab',{name:'Activity',exact:true}).click();await expect(page.getByText('Quarterly commercial review')).toBeVisible();
});
test('provider sees final amounts without draft bills or internal calculations',async({page})=>{
 await profile(page,'full-service');await page.goto('/52.provider_billing.html');await expect(page.locator('.pb-title')).toContainText('Cantaloupe Inc');await expect(page.locator('.pb-table')).not.toContainText('Civitronic');
 await page.getByRole('link',{name:'PB-2026Q3-1047',exact:true}).click();await expect(page.getByRole('link',{name:'Pay now'})).toBeVisible();await expect(page.getByRole('tab',{name:'System calculation'})).toHaveCount(0);await expect(page.getByLabel('Internal adjustment reason')).toHaveCount(0);
 await page.goto('/52.provider_bill.html?id=PB-2026Q3-1050');await expect(page.locator('#pbError')).toContainText('not available for your account');
});
test('provider checkout records simulated payment, locks operations editing, and keeps privacy',async({page})=>{
 await profile(page,'full-service');await page.goto('/52.provider_bill.html?id=PB-2026Q3-1047');await page.getByRole('link',{name:'Pay now'}).click();
 await expect(page.locator('#billInformation')).toContainText('Cantaloupe Inc');await expect(page.locator('#billInformation')).not.toContainText('System calculation');
 await page.getByLabel('Email',{exact:true}).fill('finance@example.com');await page.getByRole('textbox',{name:'Card number'}).fill('4242424242424242');await page.locator('#cardExpiry').fill('12/39');await page.locator('#cardCvc').fill('123');await page.locator('#cardholder').fill('Alex Chen');await page.locator('.card-agreements input').check();await page.locator('#submitCard').click();
 await expect(page.getByRole('heading',{name:'Payment received'})).toBeVisible();
 await page.goto('/52.service_provider_bill.html?id=PB-2026Q3-1047');await expect(page.locator('.pb-meta-status')).toContainText('Paid');await expect(page.getByRole('button',{name:'Save Changes'})).toHaveCount(0);
});
test('published bill can be edited but a stale payment confirmation is rejected',async({page})=>{
 await profile(page);await page.goto('/52.service_provider_bill.html?id=PB-2026Q3-1047');await page.locator('[data-field="amount"]').first().fill('100.00');await page.getByLabel('Internal adjustment reason').fill('Agreed activation fee');await page.getByRole('button',{name:'Save Changes'}).click();await expect(page.locator('#pbFeedback')).toContainText('updated');
 const result=await page.evaluate(()=>{const api=PaywizardProviderBilling,state=api.load(),bill=state.bills.find(b=>b.id==='PB-2026Q3-1047');try{api.beginPayment(bill.token,bill.revision-1,'stale-confirmation');return 'accepted';}catch(error){return error.message;}});expect(result).toContain('changed');
});
test('fee settings support future prices without rewriting existing bills',async({page})=>{
 await profile(page);await page.goto('/52.service_fee_settings.html');await page.locator('[data-rate="1050"]').click();await page.getByLabel('Activation fee',{exact:true}).fill('65');await page.getByLabel('Monthly service fee',{exact:true}).fill('15');await page.getByRole('button',{name:'Save Fees',exact:true}).click();await expect(page.locator('#pbFeedback')).toContainText('saved');await expect(page.locator('.pb-settings-table tbody tr').first()).toContainText('USD 2.00');
});
test('event filters and event detail retain terminal name and serial separation',async({page})=>{
 await profile(page);await page.goto('/52.service_fee_log.html');await page.getByRole('combobox',{name:'Event type',exact:true}).click();await page.getByRole('option',{name:'Unbound',exact:true}).click();await page.locator('button[data-event]').first().click();await expect(page.getByRole('dialog')).toContainText('Unbound');await expect(page.getByRole('dialog')).toContainText('No charge');await expect(page.getByRole('dialog')).toContainText('Terminal name');await expect(page.getByRole('dialog')).toContainText('S/N');
});
test('zero bill stays visible without a payment action',async({page})=>{
 await profile(page,'unattended');await page.goto('/52.provider_billing.html');await expect(page.locator('.pb-table')).toContainText('No payment required');await page.getByRole('link',{name:'PB-2026Q1-1049',exact:true}).click();await expect(page.getByRole('link',{name:'Pay now'})).toHaveCount(0);await expect(page.getByText('No payment is required for this bill.')).toBeVisible();
});
test('new fee setup and duplicate generation validate inside the dialog',async({page})=>{
 await profile(page);await page.goto('/52.service_fee_settings.html');await page.getByRole('button',{name:'Set Up Fees'}).click();await page.getByRole('button',{name:'Save Settings'}).click();await expect(page.locator('#pbFeedback')).toContainText('configured');
 await page.goto('/52.service_provider_billing.html');await page.getByRole('button',{name:'Generate Bill',exact:true}).click();await page.getByRole('button',{name:'Generate Draft'}).click();await expect(page.locator('#pbDialogError')).toBeFocused();await expect(page.locator('#pbDialogError')).toContainText('already exists');
});
test('merchant and store profiles do not acquire service-provider billing',async({page})=>{
 await profile(page,'full-service-merchant');await page.goto('/52.provider_billing.html');await expect(page).toHaveURL(/12.transaction_list/);await expect(page.locator('a[href="52.provider_billing.html"]')).toHaveCount(0);
});
test('publication keeps invalid expiry in the dialog and focuses its error',async({page})=>{
 await profile(page);await page.goto('/'+billPath);await draftFixture(page);await page.getByRole('button',{name:'Publish Bill',exact:true}).click();
 const dialog=page.getByRole('dialog'),expiry=dialog.locator('#pbExpiry');
 await expiry.fill('2020-01-01');await dialog.getByRole('button',{name:'Publish Bill',exact:true}).click();
 await expect(dialog).toBeVisible();await expect(expiry).toHaveValue('2020-01-01');await expect(dialog.locator('#pbDialogError')).toBeFocused();
 await expiry.fill('');await dialog.getByRole('button',{name:'Publish Bill',exact:true}).click();await expect(expiry).toHaveValue('');await expect(dialog.locator('#pbDialogError')).toBeFocused();
 await expiry.fill(await page.evaluate(()=>PaywizardProviderBilling.today()));await dialog.getByRole('button',{name:'Publish Bill',exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.locator('.pb-meta-status')).toContainText('Unpaid');
});
test('future commencement fees reopen and cannot move before billing starts',async({page})=>{
 await profile(page);await page.goto('/52.service_fee_settings.html');await page.getByRole('button',{name:'Set Up Fees'}).click();
 const future=await page.evaluate(()=>PaywizardProviderBilling.nextMonth(PaywizardProviderBilling.nextMonth(PaywizardProviderBilling.today())));
 const providerId=await page.locator('#pbDialog').getAttribute('data-provider');await page.getByLabel('Billing starts · UTC').fill(future);await page.getByLabel('Activation fee',{exact:true}).fill('75.00');await page.getByRole('button',{name:'Save Settings'}).click();
 await page.locator(`[data-rate="${providerId}"]`).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByLabel('Activation fee',{exact:true})).toHaveValue('75.00');await expect(page.getByLabel('Effective from · UTC')).toHaveValue(future);
 await page.getByLabel('Effective from · UTC').fill(await page.evaluate(()=>PaywizardProviderBilling.nextMonth(PaywizardProviderBilling.today())));await page.getByRole('button',{name:'Save Fees',exact:true}).click();await expect(page.locator('#pbDialogError')).toBeFocused();await expect(page.locator('#pbDialogError')).toContainText('on or after billing starts');
 await page.getByLabel('Effective from · UTC').fill(future);await page.getByLabel('Monthly service fee',{exact:true}).fill('18.00');await page.getByRole('button',{name:'Save Fees',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await page.locator(`[data-rate="${providerId}"]`).click();await expect(page.getByLabel('Monthly service fee',{exact:true})).toHaveValue('18.00');
});
