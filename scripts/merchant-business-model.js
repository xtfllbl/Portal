(function (root) {
  'use strict';
  const models = ['Full-Service', 'Attended-Service', 'Unattended-Service'];
  // Prototype fixtures only: the account service must supply these in production.
  function ownerModels(additionalNames = []) {
    const names = ['Payyou', 'Valor Training ISO', 'Nexus Partners'];
    const additional = [...new Set(additionalNames.filter(Boolean))]
      .filter(name => !names.includes(name)).sort();
    return Object.fromEntries(names.concat(additional).map((name, index) => [name, models[index % 3]]));
  }
  function resolve(ownerModel, previous = '') {
    const choices = ownerModel === models[0] ? models.slice(1)
      : models.slice(1).includes(ownerModel) ? [ownerModel] : [];
    const value = choices.includes(previous) ? previous : choices.length === 1 ? choices[0] : '';
    return { choices, value, locked: choices.length !== 2, changed: Boolean(previous && previous !== value) };
  }
  const api = { ownerModels, resolve };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PaywizardMerchantBusinessModel = api;
})(typeof window === 'object' ? window : this);
