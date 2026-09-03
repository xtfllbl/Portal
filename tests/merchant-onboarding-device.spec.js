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

test('processor schemas render dynamically without channel badges or OPC parameters', async ({ page }) => {
  await openDeviceStep(page);
  await page.locator('#onboard-device-model').selectOption('Q2');
  await page.locator('#onboard-device-processor').selectOption('ELAVON');

  await expect(page.locator('#onboard-processor-params')).toBeVisible();
  await expect(page.locator('#param-elavon-mid')).toBeVisible();
  await expect(page.locator('#onboard-processor-version')).toHaveValue('v1.1.57');
  await expect(page.locator('#onboard-key-option')).toBeVisible();
  await expect(page.locator('#onboard-processor-params #onboard-device-template')).toBeVisible();
  await expect(page.locator('#onboard-processor-name')).toHaveCount(0);
  await expect(page.locator('#saveDeviceTemplateBtn')).toHaveText('Save as Payment App Para Template');

  const presentation = await page.evaluate(() => {
    const input = document.querySelector('#param-elavon-mid');
    const group = document.querySelector('#onboard-processor-params .param-group');
    const grid = document.querySelector('#onboard-processor-params .group-grid');
    const tab = document.querySelector('#onboard-processor-params .param-tab');
    return {
      inputBorderTop: getComputedStyle(input).borderTopWidth,
      inputBorderBottom: getComputedStyle(input).borderBottomWidth,
      inputRadius: getComputedStyle(input).borderRadius,
      inputBackground: getComputedStyle(input).backgroundColor,
      groupBorder: getComputedStyle(group).borderTopWidth,
      groupBackground: getComputedStyle(group).backgroundColor,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      tabTransform: getComputedStyle(tab).textTransform,
      panelLabel: document.querySelector('#elavon-merchant-param-panel').getAttribute('aria-labelledby'),
      tabControls: document.querySelector('#elavon-merchant-param-tab').getAttribute('aria-controls')
    };
  });
  expect(presentation).toEqual({
    inputBorderTop: '0px',
    inputBorderBottom: '1px',
    inputRadius: '0px',
    inputBackground: 'rgba(0, 0, 0, 0)',
    groupBorder: '0px',
    groupBackground: 'rgba(0, 0, 0, 0)',
    columns: 3,
    tabTransform: 'none',
    panelLabel: 'elavon-merchant-param-tab',
    tabControls: 'elavon-merchant-param-panel'
  });

  await page.locator('#onboard-device-integration').selectOption('OPC_ATTENDED_TCP');
  await expect(page.locator('#onboard-opc-params')).toHaveCount(0);
  await expect(page.getByText('OPC Configuration Parameters', { exact: true })).toHaveCount(0);

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

test('checked deployment switches use the portal black theme', async ({ page }) => {
  await openDeviceStep(page);

  await expect(page.locator('#onboard-device-provision')).toBeChecked();
  const trackColor = await page.locator('#onboard-device-provision + .device-switch-track').evaluate((track) => {
    return getComputedStyle(track).backgroundColor;
  });
  expect(trackColor).toBe('rgb(15, 15, 16)');
});

test('mock buttons overwrite only the active Merchant and Store stage', async ({ page }) => {
  await page.goto('/5.merchant_add_iso.html');
  await expect(page.locator('[data-fill-mock-stage]')).toHaveCount(3);
  await expect(page.locator('.wizard-panel[data-step="4"] [data-fill-mock-stage]')).toHaveCount(0);

  await page.locator('#merchant-dba').fill('Existing merchant');
  await page.locator('[data-fill-mock-stage="merchant"]').click();
  await expect(page.locator('#merchant-dba')).toHaveValue('Mock Coffee Market');
  await expect(page.locator('#merchant-country')).toHaveValue('United States');
  await expect(page.locator('#merchant-currency')).toHaveValue('USD');
  await expect(page.locator('#store-name')).toHaveValue('');

  await page.locator('.wizard-step[data-step="2"]').click();
  await page.locator('#store-same-merchant').check();
  await page.locator('#store-name').fill('Existing store');
  await page.locator('[data-fill-mock-stage="store"]').click();
  await expect(page.locator('#store-same-merchant')).not.toBeChecked();
  await expect(page.locator('#store-stored-value')).toBeChecked();
  await expect(page.locator('#store-name')).toHaveValue('Mock Coffee Market - Downtown');
  await expect(page.locator('#merchant-dba')).toHaveValue('Mock Coffee Market');
});

test('Device mock data passes validation and removed review details stay absent', async ({ page }) => {
  await openDeviceStep(page);
  await page.locator('#onboard-device-tpn').fill('OLD-SERIAL');
  await page.locator('[data-fill-mock-stage="device"]').click();

  await expect(page.locator('#onboard-device-tpn')).toHaveValue('WP5111QC33000050');
  await expect(page.locator('#onboard-device-label')).toHaveValue('Front Counter');
  await expect(page.locator('#onboard-device-model')).toHaveValue('Q2');
  await expect(page.locator('#onboard-device-processor')).toHaveValue('OXPAY');
  await expect(page.locator('#onboard-processor-version')).toHaveValue('v1.0.19_260609');
  await expect(page.locator('#onboard-device-integration')).toHaveValue('Disable');
  await expect(page.locator('#param-oxpay-merchant-name')).toHaveValue('Mock Coffee Market');
  await expect(page.locator('#param-oxpay-merchant-phone')).toHaveValue('6155550100');
  await expect(page.locator('#param-oxpay-merchant-email')).toHaveValue('merchant.mock@example.com');

  const invalidControls = await page.locator([
    '#onboard-device-model',
    '#onboard-device-scenario',
    '#onboard-device-processor',
    '#onboard-processor-version',
    '#onboard-processor-param-sets .param-set.active .parameter-value'
  ].join(', ')).evaluateAll((controls) => {
    return controls.filter((control) => !control.checkValidity()).map((control) => ({
      id: control.id,
      value: control.value,
      message: control.validationMessage
    }));
  });
  expect(invalidControls).toEqual([]);

  await page.locator('.wizard-panel[data-step="3"] button[data-goto="4"]').click();
  await expect(page.locator('.wizard-panel[data-step="4"]')).toHaveClass(/active/);
  await expect(page.locator('#review-device-tpn')).toHaveText('WP5111QC33000050');
  await expect(page.locator('#review-device-template')).toHaveCount(0);
  await expect(page.locator('#device-review-details')).toHaveCount(0);
  await expect(page.getByText('Configuration details', { exact: true })).toHaveCount(0);
});
