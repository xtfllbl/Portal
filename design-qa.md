# Prepaid Cards tab redesign — visual QA

## Comparison target

- Source visual truth: `.artifacts/design-qa/app-management-source-1440x900.png` and `.artifacts/design-qa/app-management-tabs-focus.png` from the repository's canonical APP Management page (`10.customer_app_upload_manage.html`).
- Implementations:
  - `.artifacts/design-qa/activation-1440x900.png`
  - `.artifacts/design-qa/loss-replacement-1440x900.png`
  - `.artifacts/design-qa/card-details-1440x900.png`
  - `.artifacts/design-qa/activation-mobile-390x844.png`
  - `.artifacts/design-qa/card-details-mobile-390x844.png`
- Focused implementation evidence:
  - `.artifacts/design-qa/activation-tabs-focus.png`
  - `.artifacts/design-qa/loss-replacement-tabs-focus.png`
  - `.artifacts/design-qa/card-details-tabs-focus.png`
- Desktop viewport and captures: 1440 × 900 CSS px, 1440 × 900 image px, device scale factor 1.
- Mobile viewport and captures: 390 × 844 CSS px, 390 × 844 image px, device scale factor 1.
- State: first tab selected for visual comparison; secondary tabs also exercised interactively.

## Full-view comparison evidence

The three Prepaid Cards pages now use the same composition as APP Management: one white bordered workflow card, page title and actions at the top, a full-width divider under the tab row, a transparent active tab with a dark underline, and content continuing inside the same surface. The earlier segmented black-filled tab control and detached content cards are absent.

Card Details keeps its identity and status context visible above the tabs. That context is compact on desktop and becomes a readable single-column strip on the 390 px viewport. Card Activation and Card Details remain contained without horizontal page overflow at 390 px.

## Focused region comparison evidence

Focused crops compare the title/tab/content junction at 1128 px wide. Padding, underline placement, inactive color, surface border, 8 px outer radius, and content continuity follow the APP Management reference. Card Details intentionally inserts the agreed compact context strip between its title/action header and tabs.

## Required fidelity surfaces

- Fonts and typography: existing project font stack is preserved; title, tab, field label, and section-heading weights remain consistent with the shared portal shell.
- Spacing and layout rhythm: 24 px desktop and 16 px mobile horizontal padding, full-row divider, compact tab spacing, and a single outer radius establish the same hierarchy as APP Management.
- Colors and visual tokens: existing neutral surface, border, text, focus, and semantic status tokens are reused; the active tab has no filled background.
- Image quality and asset fidelity: this interface contains no new raster or decorative assets. Existing logo and navigation assets are unchanged.
- Copy and content: tab names, field labels, actions, card data, and business content are preserved.

## Findings

No actionable P0, P1, or P2 visual mismatches remain.

## Interaction and console checks

- Activation: switching to Batch Import shows the batch pane and hides the Single Card-only Activate Card action.
- Loss & Replacement: switching to Records shows the records pane and hides the replacement form.
- Card Details: switching to History keeps the compact card summary visible and keeps Save hidden until General is dirty.
- Keyboard navigation, ARIA selection, deep links, and responsive containment are covered by the Playwright regression suite.
- Browser console warnings/errors during the interaction pass: none.

## Comparison history

- Pass 1: no P0/P1/P2 findings; no visual correction loop was required.

## Follow-up polish

No blocking follow-up. A future project-wide typography pass could further normalize minor historical font-size differences outside these three pages.

final result: passed
