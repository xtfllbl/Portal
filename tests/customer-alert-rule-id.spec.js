const { test, expect } = require('@playwright/test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const key = 'paywizard.customerAlerts.v1';
const center = '/39.customer_alerts.html?role=operations-manager';
const terminal = '/1.terminalmanage_nayax.html?tab=alerts&role=operations-manager';

test('numeric Rule ID searches all four tables and disappears outside operations', async ({ page }) => {
  for (const route of [center, terminal]) {
    await page.goto(route);
    const surface = page.locator('[data-alert-page]');
    await expect(surface.getByRole('columnheader', { name: 'Rule ID', exact: true })).toBeVisible();
    const input = surface.getByRole('searchbox', { name: 'Rule ID', exact: true });
    await input.fill(' 100009 ');
    await input.press('Enter');
    await expect(surface.locator('[data-alert-incidents] tr')).toHaveCount(1);
    await expect(surface.locator('[data-alert-incidents] tr td').first()).toHaveText('100009');
    await surface.getByRole('tab', { name: 'Rules', exact: true }).click();
    await expect(surface.locator('[data-alert-rules] tr')).toHaveCount(1);
    await expect(surface.locator('[data-alert-rules] tr td').first()).toHaveText('100009');
    await input.fill('10001');
    await surface.getByRole('button', { name: 'Search', exact: true }).click();
    const numbers = await surface.locator('[data-alert-rules] .alert-rule-id-cell').allTextContents();
    expect(numbers.length).toBeGreaterThan(1);
    expect(numbers.every(value => /^\d+$/.test(value) && value.includes('10001'))).toBe(true);
    await input.fill('999999');
    await input.press('Enter');
    await expect(surface.locator('[data-alert-rules] .alert-empty')).toBeVisible();
    await expect(surface.locator('[data-alert-rules] .alert-empty')).toHaveAttribute('colspan', route === center ? '9' : '8');
    await surface.getByLabel('Alerts role', { exact: true }).selectOption('merchant');
    await expect(input).toBeHidden();
    await expect(surface.getByRole('columnheader', { name: 'Rule ID', exact: true })).toHaveCount(0);
    await expect(surface.locator('[data-alert-rules] .alert-rule-id-cell')).toHaveCount(0);
    await expect(surface.locator('[data-alert-rules] .alert-empty')).toHaveCount(0);
  }
});

test('migrated rule numbers survive reload, edits, archival and cross-page navigation', async ({ page }) => {
  await page.goto(center);
  await page.evaluate(key => {
    const data = JSON.parse(localStorage.getItem(key));
    data.rules.forEach(rule => delete rule.ruleNumber);
    delete data.nextRuleNumber;
    data.rules.push({ ...data.rules.find(rule => rule.id === 'r-merchant-temp-range'), id: 'legacy-custom-rule' });
    localStorage.setItem(key, JSON.stringify(data));
  }, key);
  await page.reload();
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const numbers = before.rules.map(rule => rule.ruleNumber);
  expect(numbers.every(Number.isSafeInteger)).toBe(true);
  expect(new Set(numbers).size).toBe(numbers.length);
  const customNumber = before.rules.find(rule => rule.id === 'legacy-custom-rule').ruleNumber;
  const surface = page.locator('[data-alert-page]');
  await surface.getByRole('tab', { name: 'Rules', exact: true }).click();
  const row = surface.locator('[data-rule-id="legacy-custom-rule"]');
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('[data-alert-modal]').getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(row.locator('.alert-rule-id-cell')).toHaveText(String(customNumber));
  await row.getByRole('button', { name: 'Pause', exact: true }).click();
  await row.getByRole('button', { name: 'Delete rule', exact: true }).click();
  await page.locator('[data-alert-delete-confirm]').click();
  await surface.getByLabel('Rule status', { exact: true }).selectOption('Archived');
  await surface.getByRole('searchbox', { name: 'Rule ID', exact: true }).fill(String(customNumber));
  await surface.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(row.locator('.alert-rule-id-cell')).toHaveText(String(customNumber));
  await page.goto(terminal);
  const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(after.rules.map(rule => [rule.id, rule.ruleNumber])).toEqual(before.rules.map(rule => [rule.id, rule.ruleNumber]));
  expect(after.nextRuleNumber).toBeGreaterThan(customNumber);
});

test('email sample uses the matching numeric rule ID in the secondary footer', async ({ page }) => {
  await page.goto(center);
  const value = await page.locator('[data-incident-id="i-mid-03"] .alert-rule-id-cell').textContent();
  await page.goto('/邮件模版html/邮件模版html/customerAlertSample.html');
  const reference = page.getByText(`Triggered by Rule ID: ${value}`, { exact: true });
  await expect(reference).toBeVisible();
  expect(await reference.evaluate(node => getComputedStyle(node).fontSize)).toBe('12px');
  expect(await reference.evaluate(node => node.parentElement.textContent)).toContain('All rights reserved');
  const template = readFileSync(join(__dirname, '../邮件模版html/邮件模版html/customerAlert.html'), 'utf8');
  expect(template).toContain('Triggered by Rule ID: ${ruleId}');
});


test('new rules receive distinct persistent numeric IDs', async ({ page }) => {
  await page.goto('/1.terminalmanage_nayax.html?tab=alerts');
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const surface = page.locator('[data-alert-page]');
  const dialog = page.locator('[data-alert-modal]');
  await surface.getByRole('button', { name: 'Create Alert Rule', exact: true }).click();
  await dialog.getByLabel('Condition', { exact: true }).selectOption('sold_out');
  await dialog.getByRole('button', { name: 'Save Rule', exact: true }).click();
  await expect(dialog).not.toHaveClass(/open/);
  await page.goto(center);
  const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const created = after.rules.filter(rule => !before.rules.some(old => old.id === rule.id));
  expect(created).toHaveLength(1);
  expect(created[0].ruleNumber).toBe(before.nextRuleNumber);
  expect(after.nextRuleNumber).toBe(created[0].ruleNumber + 1);
  expect(new Set(after.rules.map(rule => rule.ruleNumber)).size).toBe(after.rules.length);
});
