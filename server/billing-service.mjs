import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { makeBill, publicView, summary, checkout, collect, day } from './billing-engine.mjs';

export function createBillingService({ filename, now = () => new Date(), publicOrigin = process.env.BILLING_PUBLIC_ORIGIN } = {}) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS bills (id TEXT PRIMARY KEY, token TEXT UNIQUE, document TEXT NOT NULL)');
  const adminSecret = randomBytes(32).toString('hex');
  const readAll = () => db.prepare('SELECT document FROM bills').all().map(r => JSON.parse(r.document)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const find = id => { const row = db.prepare('SELECT document FROM bills WHERE id=?').get(id); return row && JSON.parse(row.document); };
  const findToken = token => { const row = db.prepare('SELECT document FROM bills WHERE token=?').get(token); return row && JSON.parse(row.document); };
  const save = bill => db.prepare('INSERT INTO bills(id,token,document) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,document=excluded.document').run(bill.id, bill.linkToken, JSON.stringify(bill));
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const value = fn(); db.exec('COMMIT'); return value; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  const adminView = bill => ({ ...publicView(bill, now()), linkToken: bill.linkToken, deliveries: bill.deliveries });
  function tick() {
    transaction(() => {
      for (const bill of readAll()) {
        if (!bill.recurring || !bill.authorization || bill.status === 'Paid' || bill.installments.some(i => i.status === 'Failed')) continue;
        if (!bill.installments.some(i => i.status !== 'Paid' && i.due <= day(now()))) continue;
        collect(bill, { now: now() }); save(bill);
      }
    });
  }
  const secureEqual = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  function cookieName(req) { return 'pw_billing_admin_' + (req.headers.host?.split(':').pop().replace(/[^0-9]/g, '') || '80'); }
  function authenticated(req) { const prefix = cookieName(req) + '='; const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(prefix))?.slice(prefix.length) || ''; return secureEqual(cookie, adminSecret); }
  function originFor(req) {
    if (publicOrigin) return publicOrigin.replace(/\/$/, '');
    const host = req.headers.host || 'localhost:4173';
    const ip = Object.values(networkInterfaces()).flat().find(info => info.family === 'IPv4' && !info.internal)?.address;
    return 'http://' + (ip && /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? ip + ':' + (host.split(':')[1] || '80') : host);
  }
  async function body(req) {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 2_000_000) throw new Error('Request too large.'); chunks.push(chunk); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  }
  async function middleware(req, res, next) {
    if (!req.url.startsWith('/api/billing/')) return next();
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
    const reply = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return reply(403, { error: 'Cross-origin changes are not allowed.' });
      if (path === '/api/billing/session' && req.method === 'POST') {
        const address = req.socket.remoteAddress;
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return reply(403, { error: 'Open Billing Setup on the host computer to manage this prototype.' });
        res.setHeader('Set-Cookie', `${cookieName(req)}=${adminSecret}; HttpOnly; SameSite=Strict; Path=/api/billing/`);
        return reply(200, { ok: true });
      }
      const match = path.match(/^\/api\/billing\/public\/([a-f0-9]{48})(\/pay)?$/);
      if (match) {
        const bill = findToken(match[1]);
        if (!bill || bill.status === 'Draft') return reply(404, { error: 'This payment link is unavailable.' });
        if (req.method === 'GET' && !match[2]) return reply(200, publicView(bill, now()));
        if (req.method === 'POST' && match[2]) {
          const input = await body(req);
          const result = transaction(() => { const current = findToken(match[1]); checkout(current, input, now()); save(current); return publicView(current, now()); });
          return reply(200, result);
        }
        return reply(405, { error: 'Method not allowed.' });
      }
      if (!authenticated(req)) return reply(401, { error: 'Billing management session unavailable. Open this page on the host computer.' });
      if (path === '/api/billing/records' && req.method === 'GET') return reply(200, { records: readAll().map(adminView), publicOrigin: originFor(req) });
      if (path === '/api/billing/import' && req.method === 'POST') {
        const { records } = await body(req);
        if (!Array.isArray(records) || records.length > 2000) throw new Error('Invalid billing import.');
        transaction(() => { records.forEach(record => { if (!find(String(record.id))) save(makeBill(record, now(), true)); }); });
        return reply(200, { records: readAll().map(adminView), publicOrigin: originFor(req) });
      }
      if (path === '/api/billing/records' && req.method === 'POST') {
        const input = await body(req);
        const result = transaction(() => {
          const old = find(String(input.id));
          if (old && old.status !== 'Draft') throw new Error('Only draft bills can be edited.');
          const bill = makeBill(input, now()); save(bill); return adminView(bill);
        });
        return reply(200, result);
      }
      const action = path.match(/^\/api\/billing\/records\/([^/]+)\/(pay|send)$/);
      if (action && req.method === 'POST') {
        const input = await body(req), id = decodeURIComponent(action[1]);
        const result = transaction(() => {
          const bill = find(id); if (!bill || bill.status === 'Draft') throw new Error('Bill unavailable.');
          if (action[2] === 'pay') {
            if (String(input.merchantId) !== bill.merchantId) throw new Error('Merchant does not match this bill.');
            checkout(bill, { ...input, source: 'portal' }, now());
          } else {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || '') || input.email.length > 254) throw new Error('Enter a valid recipient email.');
            if (summary(bill, now()).linkExpired || bill.status === 'Paid' || bill.authorization) throw new Error('This bill no longer needs a payment link.');
            bill.deliveries.push({ email: input.email, at: now().toISOString(), status: 'Simulated' });
          }
          save(bill); return adminView(bill);
        });
        return reply(200, result);
      }
      reply(404, { error: 'Billing endpoint not found.' });
    } catch (error) { reply(400, { error: error.message }); }
  }
  return { middleware, tick, close: () => db.close() };
}
