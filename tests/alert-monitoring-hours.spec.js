const { test, expect } = require('@playwright/test');

async function createCustomer(page, terminal) {
  await page.goto(terminal ? '/1.terminalmanage_nayax.html?tab=alerts' : '/39.customer_alerts.html?role=merchant');
  await page.getByRole('button', { name: 'Create Alert Rule', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create Alert Rule' });
  if (!terminal) {
    await dialog.getByLabel('Monitor Scope').selectOption('Store');
    await dialog.getByLabel('Store', { exact: true }).selectOption('s-midtown');
  }
  await dialog.getByLabel('Unavailable for').fill('37');
  return dialog;
}
async function customHours(dialog) {
  await expect(dialog.getByLabel('Monitoring Hours', { exact: true })).toHaveValue('all_day');
  await expect(dialog.getByLabel('Start Time', { exact: true })).toBeHidden();
  await dialog.getByLabel('Monitoring Hours', { exact: true }).selectOption('custom');
  await expect(dialog.getByLabel('Time Zone', { exact: true })).not.toHaveValue('');
  await dialog.getByLabel('Time Zone', { exact: true }).fill('New_York');
  await dialog.getByRole('option', { name: /^America\/New_York \(/ }).click();
  await dialog.getByLabel('Start Time', { exact: true }).fill('22:00');
  await dialog.getByLabel('End Time').fill('06:00');
  await expect(dialog.getByText('(next day)', { exact: true })).toBeVisible();
}
for (const terminal of [false, true]) {
  test(`custom hours survive save and reload: ${terminal ? 'terminal' : 'center'}`, async ({ page }) => {
    const dialog = await createCustomer(page, terminal);
    await customHours(dialog);
    await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await page.getByRole('tab', { name: 'Rules', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: 'Unavailable for 37 minutes' });
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    const edit = page.getByRole('dialog', { name: 'Edit Alert Rule' });
    await expect(edit.getByLabel('Time Zone', { exact: true })).toHaveValue(/^America\/New_York \([+-]\d{2}:\d{2}\)$/);
    await expect(edit.getByLabel('Start Time', { exact: true })).toHaveValue('22:00');
    await expect(edit.getByLabel('End Time')).toHaveValue('06:00');
    await edit.getByLabel('Monitoring Hours', { exact: true }).selectOption('all_day');
    await edit.getByRole('button', { name: 'Save Rule', exact: true }).click();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(edit.getByLabel('Monitoring Hours', { exact: true })).toHaveValue('all_day');
  });
}
test('required times, equal-time validation, condition switching and duplicate schedules', async ({ page }) => {
  const dialog = await createCustomer(page, true);
  await dialog.getByLabel('Monitoring Hours', { exact: true }).selectOption('custom');
  await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Start Time', { exact: true }).fill('09:00');
  await dialog.getByLabel('End Time').fill('09:00');
  await expect(dialog.getByRole('alert').filter({ hasText: 'Choose different' })).toBeVisible();
  await dialog.getByLabel('Condition', { exact: true }).selectOption('sold_out');
  await expect(dialog.getByLabel('Monitoring Hours', { exact: true })).toBeHidden();
  await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Create Alert Rule', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Create Alert Rule', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('An identical active rule already exists for this owner and target.')).toBeVisible();
  await customHours(dialog);
  await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(dialog).toBeHidden();
});
test('SLA hours save and return in edit', async ({ page }) => {
  await page.goto('/32.sla_alert_rules.html');
  await page.getByRole('button', { name: 'Edit rule', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Edit Rule', exact: true });
  await customHours(dialog);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Edit rule', exact: true }).first().click();
  await expect(dialog.getByLabel('Start Time', { exact: true })).toHaveValue('22:00');
  await expect(dialog.getByLabel('End Time')).toHaveValue('06:00');
  await expect(dialog.getByLabel('Time Zone', { exact: true })).toHaveValue(/^America\/New_York \([+-]\d{2}:\d{2}\)$/);
});
for (const width of [1440, 390]) {
  test(`three dialogs fit viewport and keep footer buttons equal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['center', 'terminal', 'sla']) {
      let dialog;
      if (route === 'sla') {
        await page.goto('/32.sla_alert_rules.html');
        await page.getByRole('button', { name: 'Edit rule', exact: true }).first().click();
        dialog = page.getByRole('dialog', { name: 'Edit Rule', exact: true });
      } else dialog = await createCustomer(page, route === 'terminal');
      await customHours(dialog);
      const geometry = await dialog.evaluate(el => {
        const box = el.getBoundingClientRect();
        const actions = el.querySelector('.alert-modal-actions, .modal-actions');
        return { x: box.x, right: box.right, overflow: el.scrollWidth > el.clientWidth, heights: [...actions.querySelectorAll('button')].map(b => b.getBoundingClientRect().height), footerBottom: actions.getBoundingClientRect().bottom };
      });
      expect(geometry.x).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(width);
      expect(geometry.overflow).toBe(false);
      expect(new Set(geometry.heights).size).toBe(1);
      expect(geometry.footerBottom).toBeLessThanOrEqual(900);
    }
  });
}

for (const width of [1440, 390]) {
  test(`time zone search supports names, offsets, keyboard and no results at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const dialog = await createCustomer(page, true);
    await dialog.getByLabel('Monitoring Hours', { exact: true }).selectOption('custom');
    const zone = dialog.getByRole('combobox', { name: 'Time Zone', exact: true });
    await zone.fill('Shanghai');
    await expect(dialog.getByRole('listbox', { name: 'Time zones' }).getByRole('option')).toHaveText(['Asia/Shanghai (+08:00)']);
    await zone.press('ArrowDown');
    await zone.press('Enter');
    await expect(zone).toHaveValue('Asia/Shanghai (+08:00)');
    await zone.fill('+05:45');
    await expect(dialog.getByRole('listbox', { name: 'Time zones' }).getByRole('option').first()).toContainText('(+05:45)');
    await zone.fill('no-such-zone');
    await expect(dialog.getByText('No time zones found')).toBeVisible();
    await zone.press('Escape');
    await expect(zone).toHaveValue('Asia/Shanghai (+08:00)');
    await expect(dialog).toBeVisible();
  });
}
