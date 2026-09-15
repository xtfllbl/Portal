const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ownerModels, resolve } = require('../../scripts/merchant-business-model.js');

test('existing Owners each demonstrate one of the three business models', () => {
  assert.deepEqual(ownerModels(), {
    Payyou: 'Full-Service',
    'Valor Training ISO': 'Attended-Service',
    'Nexus Partners': 'Unattended-Service'
  });
});

test('onboarding Owner fixtures are balanced, deduplicated and independent of source order', () => {
  const owners = ['Olivia Chen', 'Oliver Smith', 'Payyou', 'Olivia Chen', '', 'Extra Agent'];
  const map = ownerModels(owners);
  assert.deepEqual(map, ownerModels(owners.toReversed()));
  assert.equal(Object.keys(map).length, 6);
  for (const model of ['Full-Service', 'Attended-Service', 'Unattended-Service']) {
    assert.equal(Object.values(map).filter(value => value === model).length, 2);
  }
});

test('Full-Service supports mixed merchants and requires an explicit initial choice', () => {
  assert.deepEqual(resolve('Full-Service'), {
    value: '', choices: ['Full-Service', 'Attended-Service', 'Unattended-Service'], locked: false, changed: false
  });
  assert.equal(resolve('Full-Service', 'Full-Service').value, 'Full-Service');
});

test('single-service Owners prefill and lock their model', () => {
  for (const model of ['Attended-Service', 'Unattended-Service']) {
    assert.deepEqual(resolve(model), { value: model, choices: [model], locked: true, changed: false });
  }
});

test('switching Owner retains compatible choices and signals incompatible changes', () => {
  let current = resolve('Full-Service', 'Unattended-Service');
  current = resolve('Attended-Service', current.value);
  assert.equal(current.value, 'Attended-Service');
  assert.equal(current.changed, true);
  current = resolve('Full-Service', current.value);
  assert.equal(current.value, 'Attended-Service');
  assert.equal(current.changed, false);
  assert.equal(current.locked, false);
  current = resolve('Unattended-Service', current.value);
  assert.equal(current.value, 'Unattended-Service');
  assert.equal(current.changed, true);
});

test('missing or unrecognized Owner models cannot retain a stale merchant model', () => {
  for (const model of [undefined, '', 'full-service', 'Unknown']) {
    const state = resolve(model, 'Attended-Service');
    assert.deepEqual(state.choices, []);
    assert.equal(state.value, '');
    assert.equal(state.locked, true);
  }
});
