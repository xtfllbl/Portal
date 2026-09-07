const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('scripts/billing-store.js', 'utf8');
const bill = (extra = {}) => ({ id: 'b1', merchantId: 'm1', merchantName: 'Shop', invoice: '123', currency: 'EUR', amount: 36, recurring: true, cycle: 3, start: '2026-09-05', expiry: '2099-10-10', status: 'Active', ...extra });
function setup(records) {
  const data = new Map(records === undefined ? [] : [['paywizard-billing-setup-v1', JSON.stringify(records)]]);
  const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const context = { localStorage, window: { PaywizardPlatformMerchantStore: { readAll: () => [{ merchantId: 'm1' }] } } };
  vm.runInNewContext(source, context);
  return { store: context.window.PaywizardBillingStore, data, localStorage };
}
test('recurring payment persists exactly one installment and prevents repeat payment', () => {
  const { store, data } = setup([bill()]);
  assert.equal(store.total(store.read()[0]), 108);
  assert.equal(store.pay('b1', 'm1').paidInstallments, 1);
  assert.equal(store.read()[0].status, 'Active');
  assert.equal(store.pending(store.read()[0]), false);
  assert.throws(() => store.pay('b1', 'm1'), /no longer/);
  assert.equal(JSON.parse(data.get(store.key))[0].paidInstallments, 1);
  assert.equal(/card|cvc|email/i.test(data.get(store.key)), false);
});
test('one-time and final installment transition to Paid', () => {
  const { store } = setup([bill({ recurring: false })]);
  assert.equal(store.pay('b1', 'm1').status, 'Paid');
  store.write([bill({ paidInstallments: 2 })]);
  assert.equal(store.pay('b1', 'm1').status, 'Paid');
});
test('merchant isolation, draft and expired payment blocks preserve records', () => {
  const { store } = setup([bill()]);
  assert.throws(() => store.pay('b1', 'm2'));
  store.write([bill({ status: 'Draft' })]);
  assert.throws(() => store.pay('b1', 'm1'));
  store.write([bill({ expiry: '2000-01-01' })]);
  assert.throws(() => store.pay('b1', 'm1'), /expired/);
  assert.equal(store.count(store.read()[0]), 0);
});
test('fresh read retains other merchants and rejects stale paid records', () => {
  const { store } = setup([bill()]);
  store.read();
  store.write([bill(), bill({ id: 'b2', merchantId: 'm2' })]);
  store.pay('b1', 'm1');
  assert.equal(store.read().length, 2);
  assert.equal(store.read()[1].merchantId, 'm2');
  assert.equal(store.read()[1].status, 'Active');
});
test('corrupt data is never replaced, storage failures do not report payment success', () => {
  const { store, localStorage, data } = setup([bill()]);
  localStorage.setItem(store.key, '{bad');
  assert.throws(() => store.read());
  assert.equal(data.get(store.key), '{bad');
  localStorage.setItem(store.key, JSON.stringify([bill()]));
  localStorage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => store.pay('b1', 'm1'), /quota/);
  assert.equal(store.count(store.read()[0]), 0);
});
test('no sample injection for existing merchants; month-end date and cent totals', () => {
  const { store } = setup();
  assert.equal(store.read().length, 0);
  assert.equal(store.endDate(bill({ start: '2026-01-31', cycle: 1 })), '2026-02-28');
  assert.equal(store.total(bill({ amount: 0.1, cycle: 3 })), 0.3);
  assert.equal(store.count(bill({ status: 'Paid' })), 3);
});
