# Design QA: Entity Hierarchy icons and terminal counts

**Source visual truth**

- User-provided PAX STORE and Paywizard hierarchy screenshots in the task brief.
- Local reference implementation: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/tmp.html`.
- Browser-rendered source capture: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/hierarchy-source-tmp.png`.

**Implementation evidence**

- Browser-rendered implementation: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/hierarchy-implementation.png`.
- Side-by-side focused comparison: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/hierarchy-design-qa-comparison.png`.
- Browser viewport: source `1710 × 896` CSS px; implementation `1710 × 952` CSS px.
- Captured pixels: source `1710 × 896`; implementation `1710 × 952`.
- Browser device pixel ratio: `2`; browser screenshot output was normalized to CSS-pixel dimensions, so no further density conversion was applied.
- State: desktop, hierarchy fully expanded, service-provider root selected.

**Full-view comparison evidence**

- The target page retains its existing portal shell, hierarchy-card placement, heading, search field, selection treatment, and right-side terminal-management content.
- The hierarchy card is 320 px wide in the target page versus 300 px in `tmp.html`; this is an existing target-page layout constraint and gives the terminal totals enough room without changing the portal grid.
- The tree remains vertically scrollable and does not introduce page-level horizontal overflow.

**Focused region comparison evidence**

- The side-by-side comparison confirms the reference's compact row rhythm, disclosure chevrons, indentation, green merchant icons, and orange store-location icons are preserved.
- Service provider and agent icons now use the same Material Symbols family already loaded by the portal, while merchant and store remain visually distinct.
- Former right-aligned role abbreviations are replaced by muted, tabular terminal totals with stable alignment.

**Findings**

- No actionable P0, P1, or P2 visual mismatch remains for the requested hierarchy change.
- Fonts and typography: existing Poppins/portal typography is preserved; node names remain 12 px in the device-management view, counts use the same UI family and tabular numerals.
- Spacing and layout rhythm: four-level indentation is readable at the existing compact row height; icons and counts do not collide with long names because names retain ellipsis behavior.
- Colors and visual tokens: service provider is neutral, agents blue, merchants green, stores orange; colors follow the restrained reference treatment and retain sufficient distinction without adding badges.
- Image quality and asset fidelity: hierarchy icons use the existing Material Symbols icon library, so they remain crisp at browser zoom and do not add raster placeholders or custom-drawn assets.
- Copy and content: role abbreviations are removed from the right edge; each node displays only its organization name and terminal total as requested.
- Accessibility: icons are decorative, count text has an explicit `X terminals` accessible label, and expand/collapse controls retain descriptive labels.

**Primary interactions tested**

- Search narrows the tree to the matched store and its ancestors.
- Expand/collapse preserves the hierarchy and selection behavior.
- Selecting a store updates the detail header to the selected store.
- All 42 hierarchy nodes render; the root is 456 terminals; every parent count equals the sum of its direct child counts.
- Browser console checked: no errors.

**Comparison history**

- Initial browser pass: no P0/P1/P2 issues found in the requested component, so no visual-fix iteration was required.

**Follow-up polish**

- None required for this scope.

final result: passed

---

# Payment Channel Setting v2 — visual QA

## Comparison target

- Source visual truth: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/payment-channel-v2/source-option-1.png`.
- Browser-rendered implementation: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/payment-channel-v2/implementation-desktop.png`.
- Mobile implementation: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/payment-channel-v2/implementation-mobile.png`.
- Full side-by-side evidence: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/payment-channel-v2/qa-comparison.png`.
- Focused evidence: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/payment-channel-v2/qa-comparison-focus.png`.
- Source pixels: 1487 × 1058. The generated source represents the requested 1440 × 1024 desktop frame and has the same 1.406 aspect ratio.
- Desktop viewport and capture: 1440 × 1024 CSS px, device scale factor 1, 1440 × 1024 image px.
- Mobile viewport: 390 × 844 CSS px, device scale factor 1; the full-page capture is 390 × 854 image px.
- State: Terminal Channels selected, Prepaid Card disabled, one terminal channel row.

## Full-view comparison evidence

The implementation preserves the selected direction's compact merchant/store context, light portal canvas, black-and-white hierarchy, tabbed channel workspace, dark table header, green channel badge, and right-aligned actions. The page is registered in the shared portal shell and deliberately highlights Merchants instead of Settings because the agreed information architecture is store-scoped.

Three visible deviations are intentional user constraints rather than drift: Store Capabilities is a compact settings row without a second black table header; one-row pagination is hidden; and the breadcrumb shows the full Merchant path. No unrelated transaction metrics, lifecycle, permissions, payment actions, subtitles, or drawer patterns were introduced.

## Focused comparison evidence

The 2880 × 900 focused composite presents the main content regions at matching scale. It confirms alignment and hierarchy for the page title, context band, capability row, tab underline, action order, terminal table, row values, status treatment, and edit/delete controls. The table copy and values match the source; the Add action appears before Filter after the visual-correction pass.

## Required fidelity surfaces

- Fonts and typography: Poppins and the shared portal font stack are used. Title, tabs, labels, row text, uppercase headers, weights, and line heights maintain the selected compact hierarchy without clipping or unintended wrapping.
- Spacing and layout rhythm: 24 px desktop page padding, 16 px mobile padding, restrained 8 px radii, lightweight dividers, compact 40 px controls, and a single table surface match the selected direction. The narrow layout has no page-level horizontal overflow; the 760 px table scrolls only inside its own container.
- Colors and visual tokens: existing shell whites, neutral borders, #29292c primary controls, dark table headers, red Disabled state, green type badge, blue edit, and red delete treatments are reused.
- Image quality and asset fidelity: the shared PAYwizard raster logo is retained. UI icons use the existing Material Symbols Rounded library; no placeholder, custom SVG, CSS drawing, decorative image, or gradient was added.
- Copy and content: page and tab names are unchanged; terminal columns and row values are unchanged. The eCommerce first column is intentionally corrected to `ECOMMERCE CHANNEL`.

## Interaction and accessibility checks

- Terminal/eCommerce tab switching and arrow-key tab navigation work.
- The empty eCommerce state exposes only `No Data Found` and its Add action.
- Add, edit, search/filter, filter reset, and delete-confirmation cancel were exercised in the browser.
- Prepaid Card confirmation updates status, MID, and Date & Time and announces success through an ARIA live region.
- Native modal dialogs provide focus containment and Escape handling; controls have visible focus styles and table headers use `scope="col"`.
- Query-string Merchant Name, Store Name, and Store ID context render correctly; Back preserves Store ID.
- Browser console warnings/errors: none.

## Comparison history

- Pass 1 found one P2 visual mismatch: Filter appeared before Add Terminal Channel, reversing the selected reference's action order.
- Fix: the toolbar DOM order and mobile stacking direction were corrected.
- Pass 2 evidence: the final desktop, mobile, full-view composite, and focused composite all show Add before Filter. No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- P3: backend persistence and production validation remain intentionally out of scope for this prototype.

final result: passed

---

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
