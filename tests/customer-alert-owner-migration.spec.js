const { test, expect } = require('@playwright/test');

const key = 'paywizard.customerAlerts.v1';
// The first three records come from the original Alert Center seed (e389914).
const legacyIncidents = [
  { id: 'i-1007', condition: 'no_approved_transaction', terminalId: 'WP6267UQ36002376', terminalName: 'Terminal - WP6267UQ36002376', store: 'Midtown Store', evidence: 'Last approved transaction 3h 18m ago', opened: '2026-08-28 07:24', source: 'My organization' },
  { id: 'i-1006', condition: 'any_bin', terminalId: 'NYC-Q3-0042', terminalName: 'Lobby Vending Q3', store: 'Midtown Store', evidence: 'BIN A4 On Hand 1 · threshold 2', opened: '2026-08-28 06:10', source: 'Customer Alert · Managed by Service Provider' },
  { id: 'i-1005', condition: 'opc_offline', terminalId: 'BOS-Q3-0018', terminalName: 'Cafeteria Q3', store: 'Boston Office', evidence: 'Payment Service recovered after 42m', opened: '2026-08-27 21:04', source: 'Platform-managed Alert' },
  { id: 'legacy-seattle', condition: 'opc_offline', terminalId: 'WP7300EV33001088', terminalName: 'EV Charger Bay 07', store: 'EV Charger Hub', evidence: 'Payment Service unavailable for 18 minutes', opened: '2026-08-28 10:24' }
];
const owners = [
  'Merchant · 1 of a Kind World Travel LLC',
  'Service Provider · Universal Processing',
  'Platform · Paywizard',
  'Agent Level 1 · Seattle Field Agent'
];

for (const migratedBefore of [false, true]) {
  test(`restores legacy incident owners with source already removed: ${migratedBefore}`, async ({ page }) => {
    await page.goto('/39.customer_alerts.html?role=operations-manager');
    const records = legacyIncidents.map((record, index) => {
      const item = { ...record, monitoringState: index < 3 ? 'Resolved' : 'Active', acknowledgedAt: index < 2 ? '2026-08-28 08:00' : '', events: [{ at: record.opened, type: 'opened', label: 'Opened', evidence: record.evidence }], nextChecks: [] };
      if (migratedBefore) {
        delete item.source;
        Object.assign(item, { ruleId: '', evidenceVersion: 1, evidenceKey: 'legacy', legacyEvidence: item.evidence, evidenceValues: { previous: item.evidence }, evidence: `Observation details unavailable · Previous evidence: ${item.evidence}` });
      }
      return item;
    });
    await page.evaluate(({ key, records }) => localStorage.setItem(key, JSON.stringify({ rules: [], incidents: records, deletedRuleIds: [] })), { key, records });
    await page.reload();
    for (let i = 0; i < records.length; i++) {
      await expect(page.locator(`[data-incident-id="${records[i].id}"] .alert-owner-cell`)).toHaveText(owners[i]);
    }
    const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    for (const original of records) {
      expect(stored.incidents.find(item => item.id === original.id)).toMatchObject({ monitoringState: original.monitoringState, acknowledgedAt: original.acknowledgedAt, events: original.events, opened: original.opened });
    }
    await page.reload();
    for (let i = 0; i < records.length; i++) {
      await expect(page.locator(`[data-incident-id="${records[i].id}"] .alert-owner-cell`)).toHaveText(owners[i]);
    }
    await page.getByRole('combobox', { name: 'Rule owner', exact: true }).selectOption('Service Provider|sp-universal');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('[data-incident-id="i-1006"]')).toBeVisible();
    for (const id of ['i-1007', 'i-1005', 'legacy-seattle']) await expect(page.locator(`[data-incident-id="${id}"]`)).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Rule owner', exact: true }).selectOption('');
    await page.getByRole('combobox', { name: 'Organization scope', exact: true }).selectOption('Service Provider|sp-universal');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    for (const id of ['i-1007', 'i-1006']) await expect(page.locator(`[data-incident-id="${id}"]`)).toBeVisible();
    for (const id of ['i-1005', 'legacy-seattle']) await expect(page.locator(`[data-incident-id="${id}"]`)).toHaveCount(0);
  });
}

test('retains explicit historical ownership without guessing a missing rule or recreating deleted rules', async ({ page }) => {
  await page.goto('/39.customer_alerts.html?role=operations-manager');
  await page.evaluate(({ key, legacyIncidents }) => {
    const base = { ...legacyIncidents[0], monitoringState: 'Resolved', ownerType: 'Store', ownerId: 's-midtown', ownerName: 'Midtown Store' };
    localStorage.setItem(key, JSON.stringify({
      rules: [], deletedRuleIds: ['r-provider-universal'],
      incidents: [
        base,
        { ...base, id: 'deleted-rule-history', ruleId: 'r-provider-universal' },
        { ...legacyIncidents[3], id: 'unidentified-rule-history', ruleId: 'removed-custom-rule', monitoringState: 'Active' }
      ]
    }));
  }, { key, legacyIncidents });
  await page.reload();
  for (const id of ['i-1007', 'deleted-rule-history']) await expect(page.locator(`[data-incident-id="${id}"] .alert-owner-cell`)).toHaveText('Store · Midtown Store');
  const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(state.rules.some(rule => rule.id === 'r-provider-universal')).toBe(false);
  const unresolved = state.incidents.find(item => item.id === 'unidentified-rule-history');
  expect(unresolved.ruleId).toBe('removed-custom-rule');
  expect(unresolved.ownerId).toBeUndefined();
});
