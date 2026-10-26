(function (global) {
  'use strict';

  const values = Object.freeze([
    'Awaiting Customer Response',
    'Onboarding in Progress',
    'Onboarding Complete',
    'Store Created',
    'Deployment Complete'
  ]);

  function normalize(value) {
    if (values.includes(value)) return value;
    if (value === 'Negotiation' || value === 'Pitch Scheduled') return values[1];
    // The final stage was renamed by the product owner.
    if (value === 'Activation Complete') return values[4];
    return values[0];
  }

  // New demonstration fixtures, not inferred production migration results.
  const pspSamples = Object.freeze({
    '00000452': values[1], '00000451': values[2],
    '00000450': values[4], '00000449': values[3],
    '00000448': values[0], '00000447': values[1],
    '00000446': values[3], '00000445': values[4]
  });

  global.PaywizardLeadStatus = Object.freeze({ values, normalize, pspSamples });
})(window);
