# Billing demo runtime

Billing Setup supports both direct static preview and shared simulated billing. Merchant Billing and Standalone Billing are selected above the form; both support General/eSIM and One-time/Fixed-term monthly payments.

## Live Server and static hosting

Open `41.billing_setup.html` with VS Code Live Server. When the site has no billing API, it uses **Local demo** automatically; drafts, records, links and simulated payments work without starting Node. An initially unconfigured Vercel deployment also remains usable as Local demo.

Local records live in `paywizard-billing-local-v1`. The original `paywizard-billing-setup-v1` remains the shared cache; first local use copies legacy records without deleting them. Local data is not automatically uploaded when changing modes. Existing paid counts are preserved, and no card credentials are invented during migration.

Local payment links carry a non-secret bill snapshot in their fragment. On the same browser/origin, checkout updates the local record; another browser gets an independent demo and sees an explicit local-demo notice. This is not authoritative cross-device payment state. Shared token links never fall back to snapshot or local payment handling.

The **Demo settings** button selects Local demo or connects to a Shared demo URL with a management key. Localhost HTTP is supported for development; remote shared URLs require HTTPS. A known shared service outage keeps the form and blocks shared writes until reconnection or an explicit switch to Local demo.

## Shared Vite development

Run Node 22.13+ (validated with Node 24):

```sh
npm run dev -- --host 127.0.0.1 --port 4175 --strictPort
```

Vite hosts the existing SQLite service in `.data/billing.sqlite`; the directory is ignored and denied by Vite. Existing browser bills import by ID without replacing shared payment state. Do not delete the database to reset a demo without confirmation.

This development service gives a management cookie only to direct loopback clients. It is not the hosted management authentication mechanism. External devices use the public bill link if the host is reachable.

## Shared Vercel deployment

`npm run build` creates static output in `dist/`. Vercel also packages `api/billing.js`, routed from `/api/billing/*`; the Vite development middleware is not used on Vercel. Deployment excludes SQLite files, environment files, tests and server source from the static output.

The deployable implementation uses a **private Vercel Blob store** and the following runtime settings:

| Setting | Requirement |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Secret from the connected private Blob store; alternatively configure supported Blob OIDC with `BLOB_STORE_ID`. |
| `BILLING_ADMIN_KEY` | Random secret of at least 32 characters, used only for management login. |
| `CRON_SECRET` | Independent random secret for the daily scheduled simulation. |
| `BILLING_PUBLIC_ORIGIN` | Optional stable HTTPS site URL; otherwise the current request host is used. |
| `BILLING_ALLOWED_ORIGINS` | Optional comma-separated origins allowed to manage this shared demo; localhost Live Server origins are supported by default. |
| `BILLING_BLOB_PATH` | Optional storage pathname, default `billing/v1/state.json`. |

Connect production storage and secrets to production only. Preview deployments should use a separate private store and management key, or remain Local demo until configured. Never put a management key or Blob token in HTML, browser configuration or a payment link.

Management login returns an eight-hour signed session. Same-site pages can use an HttpOnly cookie; Live Server connections use a session-scoped bearer token. Public access is limited to the token's bill, and public responses omit internal credentials and payer email.

Blob reads bypass cache, and updates use ETag conditional writes with bounded retries. One small JSON document provides a single atomic boundary for this prototype's records and payment idempotency, with a 3 MB safety limit. It is not a general-purpose SQL database. A concurrent payment retries against the latest state; it cannot overwrite a completed payment with stale data.

**Cloud activation is pending:** the linked `bortol` project was verified on the Hobby plan with no Blob stores or environment variables. No plan upgrade, store creation or cloud deployment was performed during this change. Hobby is personal/non-commercial only; Paywizard business use needs an eligible plan. Pro currently starts at $20/month plus applicable usage. Sources: [plan](https://vercel.com/docs/plans/pro-plan), [fair use](https://vercel.com/docs/limits/fair-use-guidelines), [Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing).

## Payment behavior

All modes use `scripts/billing-domain.js`. Payment and email delivery are simulated; no real money or email is sent. Full card numbers and CVC are never included in API requests or persisted. A first successful checkout collects installment 1 immediately, even for a future Billing Start Date. Remaining monthly dates retain the service-date anchor; short months clamp to month-end. Overdue installments are charged separately, oldest first, stopping at failure. A paid or authorized link reopens the existing result.

Vercel runs a daily UTC cron and also processes due installments when a bill or records are read. Vite processes due collections once a minute while running. Local demo advances due state while viewed. An expired initial link does not stop an authorized contract, and collection ends at the agreed term.

Standalone bills remain excluded from merchant selectors, merchant billing views and merchant portal payment actions. Operations can manage them through Billing Records and the external payment link.

## Verification

```sh
npm run test:billing
npx playwright test tests/billing-setup.spec.js tests/billing-checkout.spec.js --workers=1
npm run build
npx playwright test --config playwright.static.config.js --workers=1
vercel build --prod
```

API tests use isolated memory/SQLite stores. Conditional Blob behavior is tested with the official SDK's conflict error and injected storage calls; no live Blob store was provisioned. Browser coverage includes 1440px/390px layout, plain static HTTP with no billing API, local payment and reload, shared-service failure without silent fallback, and Live Server connecting to a separate shared handler with an independent payer browser. These are simulated payment tests, not real card charges or a claim of live cloud deployment.
