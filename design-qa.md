# Billing Overview QA — 2026-09-09

final result: passed

No actionable P0/P1/P2 findings remain in the reviewed scope.

## Visual evidence

- Source visual truth: the four screenshots supplied in this conversation, saved as `artifacts/billing-overview/reference-1.png` through `reference-4.png`.
- Desktop implementation: `artifacts/billing-overview/overview-desktop-final.png`, route `/44.billing_overview.html`, WizarPOS Provider, issued bills, Merchant Name filtered to Vending.
- Source Overview image: 2048 × 1140 pixels as supplied to the session. Normalized to 1710 × 952 in `reference-overview-normalized.png`; compared together with the 1710 × 952 browser capture, CSS viewport 1710 × 952, device scale factor 1. Dataset differs intentionally; comparison is of layout and controls, not transaction values.
- Full-view comparison: normalized source Overview and final implementation were opened together in one image comparison input. Shared portal navigation and branding are the project's existing design, as requested; they intentionally differ from the source MAINTAIN portal.
- Focused comparison: source `reference-4.png` and `menu-desktop.png` were opened together to inspect the Copy URL / overflow menu, typography, borders, spacing and action order. Source is a magnified crop; no pixel-perfect size claim is made for that crop.
- Additional evidence: `overview-mobile.png`, `renew-desktop.png`, `renew-mobile.png`, `stop-desktop.png`, `stop-mobile.png`, `retry-mobile.png`, `records-desktop-fixed.png`.
- Mobile was exercised at a 390 × 844 CSS viewport, scale factor 1. Browser screenshot output is 375 × 812; DOM measurements, rather than screenshot pixels, establish layout and button heights. Document content width was 375 with no document overflow; the table has its own horizontal scroll region. Automated tests also cover 390 and 1440 CSS pixels.

## Comparison history and fixes

1. [P2, resolved] Overview omitted the shared portal's panel gutter. Added page 44 to the shared shell's panel page list. Evidence: `overview-desktop-v1.png` before; `overview-desktop-final.png` after. Main content now has the same spacing as adjacent project pages.
2. [P2, resolved] Initial column widths pushed too much billing information off screen. Reduced the table width from 1960 to 1765 pixels with explicit column tracks, preserving sticky actions and native horizontal scrolling. Final desktop comparison shows the intended dense table structure.
3. [P2, resolved] Opening a long Payment Records dialog focused the bottom Close button and scrolled past its title. Made the title the initial focus target and reset dialog scroll on opening. `records-desktop.png` records the problem; `records-desktop-fixed.png` confirms title and first installment visible, with measured scrollTop 0 and title top 41 pixels.

## Required fidelity surfaces

- Fonts/typography: existing project Poppins, heading weights and Material Symbols retained. Table text and wrapping were inspected in the full desktop capture and menu detail. The source Overview's narrower typography is intentionally adapted to the current project style.
- Spacing/layout: shared sidebar, top bar, panel gutters, black table header, filters, pagination and sticky actions verified. Mobile filters wrap without hiding controls. Operation buttons measure 40 pixels in the reviewed dialogs; row action buttons share a 36-pixel height.
- Colors/tokens: existing neutral portal surfaces, dark header and action buttons, restrained borders and semantic status colors retained. Stopped/Overdue/Expired remain distinguishable through text as well as color.
- Image quality/assets: existing Paywizard raster logo and library icons used; no generated or hand-drawn replacement branding. Assets render sharply at tested sizes.
- Copy/content: removed redundant row subtitles per AGENTS.md. Billing status and payment-link state are separate. Renew text explicitly preserves the original link and schedule. Stop text explains permanence, retained payments and the in-flight exception. Retry lists each installment, the total and saved card before explicit confirmation.

## Verified behavior

- Creation and draft editing remain in Setup; issued bills open in Overview. Legacy records links redirect to Overview. Merchant and standalone billing remain separate in merchant views.
- Filters, reset, pagination, CSV export, menu keyboard dismissal, details and separate payment attempts work.
- Expired unpaid unauthorized bill: renew and renew/send update expiry, retain the exact URL and schedule, and append audit metadata. The previously expired public link becomes payable after refresh.
- Stop: a reason is required; old links become non-payable and cannot renew; prior payments remain visible. Provider role visibility, direct URL access and role-switch transitions verified.
- Failed first recurring payment: retains authorization; retry requires saved-card confirmation, lists due installments, and produces separate oldest-first attempts. Duplicate requests do not duplicate payments; changed installment lists are rejected.
- Browser interaction checks and automated page-error assertions found no application errors in the exercised flows.

## Validation and limits

- `npm run test:billing`: 29 passed.
- Shared browser regression (Setup, Overview, checkout): 19 passed. After the final dialog-focus adjustment, the six Overview browser tests passed again.
- Built static demo regression: 7 passed, including independent-browser local links and a separately hosted shared service.
- `npm run build` and `git diff --check`: passed.
- Test servers used isolated ports and a temporary database; existing project demo data was preserved.
- Payment processing and email delivery remain simulated. Real processor cancellation, in-flight callbacks, delivery and production authorization require integration. Static local links share updates within the same browser storage; shared mode is required for cross-browser synchronization.

## Implementation checklist

- [x] Screenshot structure adapted to current portal components.
- [x] Management actions and payer states connected.
- [x] Desktop/mobile button heights and overflow checked.
- [x] Visual findings fixed and captured again.
- [x] State/API, browser and static build checks complete.
- [x] Local preview available; no production deployment performed.

## Local-only follow-up — 2026-09-09

The user removed Shared Demo from the portal scope. Initialization now always uses local records, ignoring old shared settings, with no mode selector or management API request. Legacy public shared links retain their existing compatibility path. Three additive, stable-ID expired examples (RENEW-0001–0003) are inserted once; renewed or paid results are never reset. Eligible rows expose Renew Link directly; Copy URL remains in the overflow menu until renewal.

Validation: 29 state/API tests and two new desktop/mobile local-only browser tests passed; build passed. New tests cover saved shared settings, no API calls, expired public page, renewal, same URL, reload persistence, no duplicate examples, equal dialog button heights and page overflow. Evidence: `artifacts/billing-local-1440.png` and `artifacts/billing-local-390.png`. Earlier shared-mode UI test results above are historical, not acceptance claims for the local-only UI.
