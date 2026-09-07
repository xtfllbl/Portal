(function (root) {
  'use strict';
  const randomUUID = () => root.crypto.randomUUID();
  const randomToken = () => Array.from(root.crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');

const day = (now = new Date()) => now.toISOString().slice(0, 10);
function monthlyDate(start, offset) {
  const [y, m, d] = start.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + offset, 1));
  date.setUTCDate(Math.min(d, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  return day(date);
}
function makeBill(input, now = new Date(), legacy = false) {
  const assignment = input.assignment ?? 'merchant';
  if (!['merchant', 'standalone'].includes(assignment)) throw new Error('Invalid billing assignment.');
  const merchantId = assignment === 'merchant' ? String(input.merchantId || '').trim() : null;
  const recurring = input.recurring === true;
  const draft = input.status === 'Draft';
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const cycle = recurring ? Number(input.cycle) : 1;
  const includedData = input.billType === 'eSIM Billing' && input.includedData != null && input.includedData !== '' ? Number(input.includedData) : null;
  if (includedData !== null && (!Number.isSafeInteger(includedData) || includedData < 0)) throw new Error('Included data must be a non-negative whole number of MB.');
  if (assignment === 'merchant' && !merchantId || !input.id || !['EUR', 'USD', 'CAD'].includes(input.currency)) throw new Error('Invalid merchant or currency.');
  if (!draft && (!Number.isFinite(amount) || amount <= 0 || amount > 999999999)) throw new Error('Enter a valid billing amount.');
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 36) throw new Error('Invalid contract term.');
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && day(new Date(value)) === value;
  if (!draft && recurring && !validDate(input.start)) throw new Error('A valid service start date is required.');
  if (!validDate(input.expiry)) throw new Error('A valid payment link expiry date is required.');
  const paid = legacy ? Math.min(cycle, Math.max(0, Number(input.paidInstallments ?? (input.status === 'Paid' ? cycle : 0)))) : 0;
  const bill = {
    id: String(input.id), assignment, merchantId, merchantName: assignment === 'merchant' ? String(input.merchantName || merchantId).slice(0, 200) : '',
    invoice: draft ? '' : String(input.invoice || Date.now()), billType: String(input.billType || 'General Billing').slice(0, 100),
    currency: input.currency, amount: draft && !amount ? '' : amount, recurring, cycle, start: input.start || '', expiry: input.expiry,
    includedData,
    notes: String(input.notes || '').slice(0, 2000), createdAt: input.createdAt || now.toISOString(),
    status: draft ? 'Draft' : paid === cycle ? 'Paid' : input.status === 'Overdue' ? 'Overdue' : recurring ? 'Active' : 'Pending',
    authorization: null, installments: [], payments: [], requests: {}, deliveries: [], linkToken: draft ? null : randomToken()
  };
  if (!draft) bill.installments = Array.from({ length: cycle }, (_, i) => ({ number: i + 1, due: recurring ? monthlyDate(bill.start, i) : day(now), amount, status: i < paid ? 'Paid' : 'Pending', paidAt: i < paid ? input.paidAt || null : null, legacy: i < paid }));
  return bill;
}
function summary(bill, now = new Date()) {
  const paidInstallments = bill.installments.filter(i => i.status === 'Paid').length;
  const unpaid = bill.installments.filter(i => i.status !== 'Paid');
  const due = unpaid.filter(i => i.due <= day(now) || i.number === 1);
  return { paidInstallments, currentInstallmentPaid: paidInstallments > 0, nextPaymentDate: unpaid[0]?.due || null, nextScheduledPaymentDate: unpaid.find(i => i.number > 1 && i.due > day(now))?.due || null, dueInstallments: due.map(i => i.number), linkExpired: bill.expiry < day(now), totalAmount: Math.round(Number(bill.amount) * 100) * bill.cycle / 100 };
}
function publicView(bill, now = new Date()) {
  const { requests, linkToken, deliveries, authorization, ...view } = bill;
  // Only masked payment-method metadata is exposed; no credentials or payer email.
  return { ...view, assignment: bill.assignment ?? 'merchant', ...summary(bill, now), authorization: authorization ? { status: authorization.status, brand: authorization.brand, last4: authorization.last4, authorizedAt: authorization.authorizedAt } : null };
}
function collect(bill, { now = new Date(), source = 'scheduled', failAt = 0 } = {}) {
  for (const installment of bill.installments) {
    if (installment.status === 'Paid') continue;
    if (installment.number !== 1 && installment.due > day(now)) break;
    if (source === 'scheduled' && installment.status === 'Failed') break;
    const success = installment.number !== failAt;
    const payment = { id: randomUUID(), installment: installment.number, amount: installment.amount, currency: bill.currency, status: success ? 'Succeeded' : 'Failed', at: now.toISOString(), source };
    bill.payments.push(payment);
    installment.status = success ? 'Paid' : 'Failed';
    if (!success) { bill.status = 'Overdue'; break; }
    installment.paidAt = payment.at;
  }
  const state = summary(bill, now);
  bill.status = state.paidInstallments === bill.cycle ? 'Paid' : bill.installments.some(i => i.status === 'Failed') ? 'Overdue' : 'Active';
  return bill;
}
function checkout(bill, input, now = new Date(), simulation = {}) {
  if (bill.requests[input.requestId]) return bill;
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId || '')) throw new Error('Invalid payment request.');
  if (bill.status === 'Draft') throw new Error('This bill is not available for payment.');
  if (summary(bill, now).paidInstallments > 0) throw new Error('This bill has already been paid or authorized.');
  if (bill.expiry < day(now)) throw new Error('This payment link has expired.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254) throw new Error('Enter a valid email.');
  if (input.acceptedTerms !== true || bill.recurring && input.recurringConsent !== true) throw new Error('Please confirm the payment authorization.');
  if (!/^[0-9]{4}$/.test(input.last4 || '') || !['Visa', 'Mastercard', 'Card'].includes(input.brand)) throw new Error('Invalid simulated payment method.');
  if (bill.recurring) bill.authorization = { status: 'Authorized', token: 'sim_' + randomUUID(), brand: input.brand, last4: input.last4, email: input.email, authorizedAt: now.toISOString(), consentVersion: 'fixed-term-v3' };
  collect(bill, { now, source: input.source === 'portal' ? 'portal' : 'public', ...simulation });
  bill.requests[input.requestId] = now.toISOString();
  return bill;
}

  const domain = { day, monthlyDate, makeBill, summary, publicView, collect, checkout };
  if (typeof module !== 'undefined' && module.exports) module.exports = domain;
  else root.PaywizardBillingDomain = domain;
})(globalThis);
