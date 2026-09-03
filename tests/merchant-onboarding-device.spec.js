const { test, expect } = require('@playwright/test');

async function openDeviceStep(page) {
  await page.goto('/5.merchant_add_iso.html');
  await page.locator('.wizard-step[data-step="3"]').click();
  await expect(page.locator('.wizard-panel[data-step="3"]')).toHaveClass(/active/);
}

test('onboarding Device step uses the current device identity and processor catalog', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await openDeviceStep(page);

  await expect(page.locator('#onboard-device-tci')).toHaveValue(/^TC\d{8}$/);
  await expect(page.locator('#onboard-device-manufacturer')).toHaveValue('WizarPOS');
  await expect(page.locator('#onboard-device-tpn')).not.toHaveAttribute('required', '');
  await expect(page.locator('#onboard-device-model option')).toHaveText([
    'Select Model', 'Q2', 'Q3V', 'Q3PRT', 'Q3MINI-R'
  ]);
  await expect(page.locator('#onboard-device-processor option')).toHaveText([
    'Select Processor', 'TSYS', 'FISERV', 'ELAVON', 'NUVEI ATTD', 'NUVEI UPT', 'OXPAY'
  ]);
  await expect(page.getByText('Assign the initial device used for transactions.')).toBeHidden();
  expect(browserErrors).toEqual([]);
});

test('processor and OPC schemas render dynamically and preserve processor state', async ({ page }) => {
  await openDeviceStep(page);
  await page.locator('#onboard-device-model').selectOption('Q2');
  await page.locator('#onboard-device-processor').selectOption('ELAVON');

  await expect(page.locator('#onboard-processor-params')).toBeVisible();
  await expect(page.locator('#param-elavon-mid')).toBeVisible();
  await expect(page.locator('#onboard-processor-version')).toHaveValue('v1.1.57');
  await expect(page.locator('#onboard-key-option')).toBeVisible();

  await page.locator('#onboard-device-integration').selectOption('OPC_ATTENDED_TCP');
  await expect(page.locator('#onboard-opc-params')).toBeVisible();
  expect(await page.locator('#onboard-opc-param-sets .parameter-value').count()).toBeGreaterThan(70);

  await page.locator('#onboard-device-model').selectOption('Q3MINI-R');
  await expect(page.locator('#onboard-deployment-title')).toHaveText('Card Reader Deployment');
  await expect(page.locator('#onboard-version-field')).toBeHidden();
  await expect(page.locator('#onboard-device-processor option').first()).toHaveText('Select Payment Channel');

  await page.locator('#onboard-device-model').selectOption('Q2');
  await expect(page.locator('#onboard-device-processor')).toHaveValue('ELAVON');
  await expect(page.locator('#param-elavon-mid')).toBeVisible();
});

test('configuration-only onboarding validates, reviews, and reports the real completion outcome', async ({ page }) => {
  await openDeviceStep(page);

  await page.locator('.wizard-panel[data-step="3"] button[data-goto="4"]').click();
  await expect(page.locator('.wizard-panel[data-step="3"]')).toHaveClass(/active/);
  await expect(page.locator('#onboard-device-errors')).toBeVisible();

  await page.locator('#onboard-device-model').selectOption('Q2');
  await page.locator('label[for="onboard-device-provision"]').click();
  await expect(page.locator('#onboard-device-provision')).not.toBeChecked();
  await page.locator('.wizard-panel[data-step="3"] button[data-goto="4"]').click();
  await expect(page.locator('.wizard-panel[data-step="4"]')).toHaveClass(/active/);
  await expect(page.locator('#review-device-card-title')).toHaveText('Device Configuration');
  await expect(page.locator('#review-device-tpn')).toHaveText('Not assigned');
  await expect(page.locator('#review-device-deployment')).toHaveText('Configuration only — no device assigned');

  await page.locator('#onboardMerchantBtn').click();
  await expect(page.locator('.device-toast-message')).toHaveText([
    'Merchant add success',
    'Store add success',
    'Device configuration save success'
  ]);
  await expect(page.locator('#reviewHeroTitle')).toHaveText('Onboarding Complete');
});

test('parameter templates use portal modals and exclude device identity', async ({ page }) => {
  await openDeviceStep(page);
  await page.locator('#onboard-device-model').selectOption('Q2');
  await page.locator('#onboard-device-processor').selectOption('OXPAY');
  await page.locator('#onboard-device-tpn').fill('WP-IDENTITY-NOT-IN-TEMPLATE');
  await page.locator('#saveDeviceTemplateBtn').click();

  await expect(page.locator('#deviceTemplateModal')).toBeVisible();
  await page.locator('#deviceTemplateName').fill('Kiosk configuration');
  await page.locator('#confirmDeviceTemplate').click();
  await expect(page.locator('.device-toast-message')).toHaveText('Template saved');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pw_device_param_templates'))[0]);
  expect(saved.name).toBe('Kiosk configuration');
  expect(saved.configuration.processorKey).toBe('OXPAY');
  expect(JSON.stringify(saved)).not.toContain('WP-IDENTITY-NOT-IN-TEMPLATE');
  expect(saved).not.toHaveProperty('sn');
});
