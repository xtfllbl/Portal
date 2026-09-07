# Shared billing prototype

Run with Node 22.13+ (validated with Node 24). The existing Vite development server now hosts the shared billing API and a SQLite database at `.data/billing.sqlite`. `.data/` is ignored by Git and denied by the static file server. Existing browser bills are imported by ID without overwriting any shared payment state; the original localStorage key remains a cache. Never delete the shared database to reset a demo without confirmation.

For a local-only preview:

```sh
BILLING_PUBLIC_ORIGIN=http://127.0.0.1:4175 npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
```

Open `41.billing_setup.html` on the host computer to manage bills. Public checkout is `43.billing_payment_link.html#<opaque-token>`. Copy URL / Preview / Send Link use the server-provided origin. `BILLING_PUBLIC_ORIGIN` can select an approved reachable host; changing that value alone does not make a loopback-bound server reachable from other devices. The current run has only loopback access: automatic approval review rejected enabling LAN access, which remains pending user approval.

The service gives a management cookie only to direct loopback clients. Public tokens grant access only to their corresponding bill. Do not place this prototype behind a reverse proxy and assume the loopback check is production authentication. A production release needs an authenticated management API and a hosted persistent service. The existing static Vercel build does not host this API; deploying only static HTML is insufficient.

## Payment behavior

The first checkout pays installment 1 immediately. The remaining schedule is anchored to Billing Start Date. Monthly day clamping preserves the original anchor after short months. Catch-up makes one transaction per overdue installment, oldest first, stopping at the first failure. There is no combined arrears charge and no automatic retry policy.

While the development server is running, a timer checks authorized contracts once a minute and simulates due collections. Failed installments stop further automatic collection. An expired initial payment link does not stop an authorized contract. Collection ends once all installments are paid. Legacy paid counts are preserved without inventing card authorization or payment transaction IDs.

Public and portal forms share validation and authorization wording. Only synthetic payment-method metadata (brand, last four digits, simulation token), consent version/time and contact email are persisted. Full card numbers and CVC never enter the API request or storage. Public responses omit internal tokens, contact email and email-delivery history. There is no real payment provider or outbound mail transport. Send Link records a `Simulated` delivery; it does not send an email.

## Verification

```sh
npm run test:billing
```

API tests create a private in-memory database and separate HTTP clients. Existing Billing Setup Playwright tests now use Vite with a separate temporary database; their fixture reset never targets `.data/billing.sqlite`. Browser verification uses the configured Browser skill. A previous automatic review prohibited the browser's final agreement/Submit interaction, so a passing API test is not described as a passing browser payment submission.
