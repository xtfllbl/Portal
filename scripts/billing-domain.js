(function (root) {
  'use strict';
  const randomUUID = () => root.crypto.randomUUID();
  const randomToken = () => Array.from(root.crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');

const day = (now = new Date()) => now.toISOString().slice(0, 10);
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && day(new Date(value)) === value;
const stopped = bill => bill.status === 'Stopped' || !!bill.collectionStop;
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
  if (!legacy && String(input.notes || '').length > 2000) throw new Error('Billing notes must be at most 2000 characters.');
  if (!legacy && input.amount !== '' && input.amount != null && (!Number.isFinite(amount) || amount <= 0 || amount > 999999999 || Math.abs(Number(input.amount) * 100 - Math.round(Number(input.amount) * 100)) > 0.00001)) throw new Error('Enter a valid billing amount with at most two decimal places.');
  const cycle = recurring ? Number(input.cycle) : 1;
  const includedData = input.billType === 'eSIM Billing' && input.includedData != null && input.includedData !== '' ? Number(input.includedData) : null;
  if (includedData !== null && (!Number.isSafeInteger(includedData) || includedData < 0)) throw new Error('Included data must be a non-negative whole number of MB.');
  if (assignment === 'merchant' && !merchantId || !input.id || !['EUR', 'USD', 'CAD'].includes(input.currency)) throw new Error('Invalid merchant or currency.');
  if (!draft && (!Number.isFinite(amount) || amount <= 0 || amount > 999999999)) throw new Error('Enter a valid billing amount.');
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 36) throw new Error('Invalid contract term.');
  if (!draft && recurring && !validDate(input.start)) throw new Error('A valid service start date is required.');
  if (!validDate(input.expiry)) throw new Error('A valid payment link expiry date is required.');
  const paid = legacy ? Math.min(cycle, Math.max(0, Number(input.paidInstallments ?? (input.status === 'Paid' ? cycle : 0)))) : 0;
  const bill = {
    id: String(input.id), assignment, merchantId, merchantName: assignment === 'merchant' ? String(input.merchantName || merchantId).slice(0, 200) : '',
    invoice: draft ? '' : String(input.invoice || Date.now()), billType: String(input.billType || 'General Billing').slice(0, 100),
    currency: input.currency, amount: draft && !amount ? '' : amount, recurring, cycle, start: input.start || '', expiry: input.expiry,
    includedData,
    notes: String(input.notes || '').slice(0, 2000), createdAt: input.createdAt || now.toISOString(),
    status: draft ? 'Draft' : legacy && input.status === 'Stopped' ? 'Stopped' : paid === cycle ? 'Paid' : input.status === 'Overdue' ? 'Overdue' : 'Pending',
    authorization: null, installments: [], payments: [], requests: {}, deliveries: [], notifications: [], collectionRounds: [], scheduledRuns: {}, audit: [], linkToken: draft ? null : randomToken()
  };
  if (!draft) bill.installments = Array.from({ length: cycle }, (_, i) => ({ number: i + 1, due: recurring ? monthlyDate(bill.start, i) : day(now), amount, status: i < paid ? 'Paid' : 'Pending', paidAt: i < paid ? input.paidAt || null : null, legacy: i < paid }));
  return bill;
}
function summary(bill, now = new Date()) {
  const paidInstallments = bill.installments.filter(i => i.status === 'Paid').length;
  const unpaid = bill.installments.filter(i => i.status !== 'Paid');
  const due = unpaid.filter(i => i.due <= day(now) || i.number === 1);
  const linkExpired = bill.expiry < day(now);
  const status = stopped(bill) ? 'Stopped' : bill.status === 'Draft' ? 'Draft' : !unpaid.length ? 'Paid'
    : bill.status === 'Overdue' || unpaid.some(i => i.status === 'Failed' || bill.recurring && i.due < day(now)) ? 'Overdue'
    : bill.authorization ? 'Active' : 'Pending';
  const linkStatus = status === 'Stopped' || status === 'Draft' ? 'Disabled' : bill.authorization || paidInstallments > 0 || status === 'Paid' ? 'Used' : linkExpired ? 'Expired' : 'Valid';
  return { status, paidInstallments, currentInstallmentPaid: paidInstallments > 0,
    nextPaymentDate: status === 'Stopped' ? null : unpaid[0]?.due || null,
    nextScheduledPaymentDate: status === 'Stopped' ? null : unpaid.find(i => i.number > 1 && i.due > day(now))?.due || null,
    nextAutomaticAttemptAt: nextAutomaticAttempt(bill, now),
    finalInstallmentDate: bill.recurring ? bill.installments.at(-1)?.due || null : null,
    dueInstallments: due.map(i => i.number), dueAmount: due.reduce((sum, i) => sum + Math.round(i.amount * 100), 0) / 100,
    linkExpired, linkStatus, canRetry: !!bill.authorization && status === 'Overdue' && due.length > 0,
    canStop: !['Draft','Paid','Stopped'].includes(status), canRenew: !['Draft','Paid','Stopped'].includes(status) && linkStatus === 'Expired',
    totalAmount: Math.round(Number(bill.amount) * 100) * bill.cycle / 100 };
}
function publicView(bill, now = new Date()) {
  const { requests, linkToken, linkSnapshot, deliveries, notifications, payerContact, collectionRounds, scheduledRuns, lastManualFailureDate, authorization, audit, collectionStop, ...view } = bill;
  // Public links expose payment results, never management audit details or payer contact data.
  return { ...view, assignment: bill.assignment ?? 'merchant', ...summary(bill, now), canRetry: false, stoppedAt: collectionStop?.at || null,
    authorization: authorization ? { status: authorization.status, brand: authorization.brand, last4: authorization.last4, authorizedAt: authorization.authorizedAt } : null };
}
function scheduledAt(installment) { return installment.due + 'T09:00:00.000Z'; }
function lastPayerAttemptAt(bill) {
  return bill.payments.filter(p => p.source !== 'scheduled').reduce((latest, p) => p.at > latest ? p.at : latest, bill.authorization?.authorizedAt || '');
}
function manualFailureOn(bill, date) {
  return bill.lastManualFailureDate === date || bill.payments.some(p => p.status === 'Failed' && p.source !== 'scheduled' && p.at.slice(0, 10) === date);
}
function nextAutomaticAttempt(bill, now = new Date()) {
  if (stopped(bill) || !bill.recurring || !bill.authorization || bill.authorization.status !== 'Authorized' || bill.installments.every(i => i.status === 'Paid')) return null;
  return bill.installments.find(i => i.number > 1 && scheduledAt(i) > now.toISOString() && !bill.scheduledRuns?.[i.due] && !(i.due === day(now) && manualFailureOn(bill, day(now))))?.due.concat('T09:00:00.000Z') || null;
}
function notificationSnapshot(bill, now) {
  const state = summary(bill, now);
  return { invoiceNumber: bill.invoice, issuerName: 'Paywizard', assignment: bill.assignment || 'merchant', merchantName: bill.merchantName,
    description: bill.billType, billType: bill.billType, currency: bill.currency, amount: bill.amount, recurring: bill.recurring,
    installmentCount: bill.cycle, paidInstallmentCount: state.paidInstallments, contractTotal: state.totalAmount, notes: bill.notes,
    includedData: bill.includedData, linkExpiryDate: bill.expiry, collectionStopped: stopped(bill),
    paymentMethod: bill.payerContact || bill.authorization ? {brand: (bill.authorization || bill.payerContact).brand, last4: (bill.authorization || bill.payerContact).last4} : null,
    unpaidInstallments: bill.installments.filter(i => state.dueInstallments.includes(i.number)).map(i => ({number:i.number,due:i.due,amount:i.amount})),
    overdueRemaining: state.dueInstallments.length > 0, nextAutomaticAttemptAt: state.nextAutomaticAttemptAt,
    nextPaymentDate: state.nextAutomaticAttemptAt?.slice(0,10) || null, nextAmount: bill.amount };
}
function queueNotification(bill, type, eventId, email, now, extra = {}) {
  if (!email) return;
  const id = type + ':' + eventId;
  const notifications = bill.notifications ||= [];
  if (notifications.some(n => n.id === id)) return;
  notifications.push({id, type, eventId, email, at:now.toISOString(), status:'Simulated', snapshot:{...notificationSnapshot(bill, now), ...extra}});
}
function collect(bill, { now = new Date(), source = 'scheduled', failAt = 0 } = {}) {
  if (stopped(bill) || bill.status === 'Draft' || bill.installments.every(i => i.status === 'Paid')) return bill;
  let scheduleDate = null;
  if (source === 'scheduled') {
    if (!bill.recurring || bill.authorization?.status !== 'Authorized' || manualFailureOn(bill, day(now))) return bill;
    // Coalesce missed scheduler wake-ups into the latest normal contract date.
    // A payer attempt supersedes earlier schedules; never invent dates beyond the term.
    const latest = bill.installments.filter(i => i.number > 1 && scheduledAt(i) <= now.toISOString() && scheduledAt(i) > lastPayerAttemptAt(bill) && !manualFailureOn(bill, i.due)).at(-1);
    if (!latest || bill.scheduledRuns?.[latest.due] || bill.payments.some(p => p.source === 'scheduled' && p.at >= scheduledAt(latest))) return bill;
    scheduleDate = latest.due;
    (bill.scheduledRuns ||= {})[scheduleDate] = {at:now.toISOString(), status:'Processing'};
  }
  const due = summary(bill, now).dueInstallments;
  if (!due.length) return bill;
  const round = {id:randomUUID(), source, scheduleDate, at:now.toISOString(), installments:due, paymentIds:[], status:'Succeeded'};
  (bill.collectionRounds ||= []).push(round);
  const email = bill.authorization?.email || bill.payerContact?.email;
  for (const installment of bill.installments) {
    if (!due.includes(installment.number) || installment.status === 'Paid') continue;
    const success = installment.number !== failAt;
    const payment = { id: randomUUID(), roundId:round.id, installment: installment.number, amount: installment.amount, currency: bill.currency, status: success ? 'Succeeded' : 'Failed', at: now.toISOString(), source };
    bill.payments.push(payment); round.paymentIds.push(payment.id);
    installment.status = success ? 'Paid' : 'Failed';
    if (!success) {
      bill.status = 'Overdue'; round.status = 'Failed';
      if (source !== 'scheduled') bill.lastManualFailureDate = day(now);
      queueNotification(bill, 'failure', round.id, email, now, {failedPayment: {...payment}, successfulPayments: bill.payments.filter(p => p.roundId === round.id && p.status === 'Succeeded').map(p => ({...p})), hasAuthorization:!!bill.authorization});
      break;
    }
    installment.paidAt = payment.at;
    bill.status = bill.installments.every(i => i.status === 'Paid') ? 'Paid' : bill.installments.some(i => i.status === 'Failed') ? 'Overdue' : 'Active';
    queueNotification(bill, 'receipt', payment.id, email, now, {payment: {...payment}});
  }
  round.completedAt = now.toISOString();
  if (scheduleDate) bill.scheduledRuns[scheduleDate] = {roundId:round.id, at:now.toISOString(), status:round.status};
  return bill;
}
function checkExpectedPayments(bill, input, now) {
  if (Array.isArray(input.expectedInstallments) && JSON.stringify(input.expectedInstallments) !== JSON.stringify(summary(bill, now).dueInstallments)) throw new Error('The payable installments have changed. Refresh the bill and confirm the updated amounts.');
}
function checkout(bill, input, now = new Date(), simulation = {}) {
  if (bill.requests[input.requestId]) return bill;
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId || '')) throw new Error('Invalid payment request.');
  if (stopped(bill)) throw new Error('Collection has been stopped for this bill.');
  if (bill.status === 'Draft') throw new Error('This bill is not available for payment.');
  if (bill.authorization || summary(bill, now).paidInstallments > 0) throw new Error('This bill has already been paid or authorized.');
  if (bill.expiry < day(now)) throw new Error('This payment link has expired.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254) throw new Error('Enter a valid email.');
  if (input.acceptedTerms !== true || bill.recurring && input.recurringConsent !== true) throw new Error('Please confirm the payment authorization.');
  if (!/^[0-9]{4}$/.test(input.last4 || '') || !['Visa', 'Mastercard', 'Card'].includes(input.brand)) throw new Error('Invalid simulated payment method.');
  checkExpectedPayments(bill, input, now);
  bill.payerContact = {email:input.email, brand:input.brand, last4:input.last4};
  if (bill.recurring) bill.authorization = { status: 'Authorized', token: 'sim_' + randomUUID(), brand: input.brand, last4: input.last4, email: input.email, authorizedAt: now.toISOString(), consentVersion: 'fixed-term-v4-catch-up' };
  collect(bill, { now, source: input.source === 'portal' ? 'portal' : 'public', ...simulation });
  bill.requests[input.requestId] = now.toISOString();
  return bill;
}

function retryPayment(bill, input, now = new Date(), simulation = {}) {
  if (input.source !== 'operator') throw new Error('Only platform operations can retry payment.');
  const key = 'retry:' + input.requestId;
  if (bill.requests[key]) return bill;
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId || '')) throw new Error('Invalid payment request.');
  if (stopped(bill)) throw new Error('Collection has been stopped for this bill.');
  if (!summary(bill, now).canRetry) throw new Error('No authorized overdue payment is available to retry.');
  if (input.confirmed !== true) throw new Error('Confirm the installment payments before retrying.');
  checkExpectedPayments(bill, input, now);
  collect(bill, {now, source: 'operator-retry', ...simulation});
  bill.requests[key] = now.toISOString();
  recordAudit(bill, {action:'Retry Payment', actor:'WizarPOS Provider (demo operator)', at:now.toISOString(), requestId:input.requestId});
  return bill;
}
function recordAudit(bill, event) { (bill.audit ||= []).push(event); }
function stopCollection(bill, input, now = new Date(), actor = 'WizarPOS Provider (demo operator)') {
  if (!summary(bill, now).canStop) throw new Error('Only issued, unsettled bills can be stopped.');
  const reason = String(input.reason || '').trim();
  if (reason.length > 500) throw new Error('Stop reason must be at most 500 characters.');
  bill.collectionStop = {at: now.toISOString(), actor, reason};
  bill.status = 'Stopped';
  if (bill.authorization) bill.authorization.status = 'Revoked';
  (bill.notifications || []).filter(n => n.type === 'failure' && n.status !== 'Sent').forEach(n => {n.status = 'Suppressed'; n.suppressedReason = 'Collection stopped';});
  recordAudit(bill, {action:'Stop Collection', ...bill.collectionStop});
  return bill;
}
function sendLink(bill, input, now = new Date()) {
  if (summary(bill, now).linkStatus !== 'Valid') throw new Error('This bill no longer needs a payment link.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254) throw new Error('Enter a valid recipient email.');
  if (input.requestId && bill.deliveries?.some(d => d.requestId === input.requestId)) return bill;
  const delivery = {id:randomUUID(), requestId:input.requestId || null, email:input.email, at:now.toISOString(), status:'Simulated'};
  (bill.deliveries ||= []).push(delivery);
  queueNotification(bill, 'invitation', delivery.id, input.email, now);
  return bill;
}
function renewLink(bill, input, now = new Date(), actor = 'WizarPOS Provider (demo operator)') {
  if (!summary(bill, now).canRenew) throw new Error('Only expired, unpaid and unauthorized links can be renewed.');
  if (!validDate(input.expiry) || input.expiry <= day(now)) throw new Error('Choose an expiry date after today.');
  // Validate delivery first so local and shared renewal remain atomic when a recipient is invalid.
  if (input.send && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254)) throw new Error('Enter a valid recipient email.');
  const previousExpiry = bill.expiry;
  bill.expiry = input.expiry;
  recordAudit(bill, {action:'Renew Link', actor, at:now.toISOString(), previousExpiry, expiry:bill.expiry});
  if (input.send) sendLink(bill, input, now);
  return bill;
}

  const domain = { day, monthlyDate, makeBill, summary, publicView, collect, checkout, retryPayment, stopCollection, renewLink, sendLink, stopped, nextAutomaticAttempt, notificationSnapshot };
  if (typeof module !== 'undefined' && module.exports) module.exports = domain;
  else root.PaywizardBillingDomain = domain;
})(globalThis);
