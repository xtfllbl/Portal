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

# Open Alert Center Bell Icon Design QA

## Comparison target

- Source visual truth: the user-provided Open Alert Center button screenshot and the selected option `1`, defined as a simple outlined notification bell. The earlier rendered toolbar state is preserved at `design-qa/evidence/terminal-alerts-desktop.png`.
- Implementation: Material Symbols Rounded `notifications`, weight 400 and fill 0, inside the existing Product Map command-button component.
- Desktop implementation screenshot: `design-qa/evidence/terminal-alerts-bell-modal-desktop.png`.
- Mobile implementation screenshot: `design-qa/evidence/terminal-alerts-bell-mobile.png`.
- Focused toolbar screenshots: `design-qa/evidence/terminal-alerts-bell-toolbar-desktop.png` and `design-qa/evidence/terminal-alerts-bell-toolbar-mobile.png`.
- Side-by-side comparison: `design-qa/evidence/terminal-alerts-bell-comparison.png`.
- Desktop viewport and pixels: 1440 x 1000 CSS px, device scale factor 1, 1440 x 1000 output pixels.
- Mobile viewport and pixels: 390 x 844 CSS px, device scale factor 1, 390 x 844 output pixels.
- State: Terminal Management > Alerts; desktop comparison has Create Alert Rule open with Temperature Out of Range selected. Mobile validation uses the Alerts default state.

## Evidence and required fidelity surfaces

- Full-view comparison: the side-by-side image confirms that the toolbar placement, button dimensions, type, border, radius, and spacing remain stable; only the Open Alert Center icon changes.
- Focused region: dedicated desktop and mobile command-bar captures confirm icon size, baseline alignment, equal button heights, and responsive wrapping.
- Fonts and typography: Poppins text is unchanged; the icon uses the page's existing Material Symbols Rounded font with the intended outlined weight.
- Spacing and layout rhythm: the bell occupies the existing 18 x 18 command-icon slot, remains vertically centered, and preserves the 8 px text gap. Both command buttons keep equal height on desktop and mobile.
- Colors and tokens: the bell inherits the same neutral command-icon color and opacity as Map and Stock icons.
- Image and asset fidelity: the bell comes from the existing Material Symbols icon library rather than a handcrafted SVG, text glyph, emoji, or CSS drawing.
- Copy and content: `Open Alert Center` and its link behavior remain unchanged.
- Responsive behavior: at 390 px, both actions wrap to two balanced lines without overflow; the icon remains aligned with the label.
- Interaction and console: the command-bar regression test passed; desktop capture recorded no page or console errors.

## Findings

- No actionable P0, P1, or P2 differences.
- The bell is more semantically recognizable than the prior assignment/clipboard icon while retaining the established toolbar visual language.

## Comparison history

- Initial implementation used the selected Material Symbols `notifications` icon and passed the first same-state comparison; no corrective visual iteration was required.

## Implementation checklist

- [x] Replace only the Open Alert Center icon.
- [x] Preserve button geometry, typography, and link behavior.
- [x] Verify desktop and mobile alignment.
- [x] Verify the existing Alerts interaction test and browser console.

final result: passed

---

# Onboarding Wizard mock-fill and Review cleanup — visual QA

## Comparison target

- Source visual truth: user-provided switch crop `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-e384aa1c-c980-4625-b8ef-422519751887.png` (526 × 86 px) and Review crop `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-8ebc2261-fc69-4065-a697-7b94849888e3.png` (926 × 900 px).
- Implementation evidence: `/tmp/onboarding-wizard-device-implemented.png`, `/tmp/onboarding-wizard-device-actions-implemented.png`, and `/tmp/onboarding-wizard-review-implemented.png`.
- Browser viewport and captures: 2048 × 1138 CSS px, device scale factor 1, 2048 × 1138 image px.
- States: Device after `Fill Mock Data`, focused Device action row, and Review after the mocked Device data passed existing validation.

## Full-view comparison evidence

- The wizard retains the existing portal shell, five-step layout, Device information hierarchy, and action-bar alignment.
- The deployment switch uses the portal's strong black token when checked while retaining its white thumb and existing focus/disabled behavior.
- `Fill Mock Data` appears only in the Merchant, Store, and Device action bars. The Device action row keeps Back left-aligned, mock fill centered, and Save/Review right-aligned.
- Review no longer renders the `Template` row or the `Configuration details` disclosure region.

## Required fidelity surfaces

- Fonts and typography: the existing portal type scale, weights, and button treatment are unchanged.
- Spacing and layout rhythm: the secondary mock action fits the existing footer grid without crowding Back, Save, or Review.
- Colors and visual tokens: checked deployment and Inject Key switches resolve to `rgb(15, 15, 16)`, the computed value of `--text-strong`.
- Image quality and asset fidelity: no imagery or raster assets were added or changed.
- Copy and content: the new action is consistently labeled `Fill Mock Data`; Review omits only the two requested areas.

## Interaction and console checks

- Merchant and Store mock actions overwrite only their own current-step fields and dispatch the existing input/change events.
- Store mock fill explicitly clears `Same as Merchant Info` before writing store-specific data.
- Device mock fill selects Q2, OXPAY, the first available version, Integration Disable, and valid schema-driven parameter values.
- Device mock data passes the existing validation and proceeds directly to Review.
- Browser console warnings/errors during the interaction pass: none.

## Comparison history

- Pass 1 found no actionable P0, P1, or P2 mismatch, so no visual correction iteration was required.

## Follow-up polish

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

---

# Onboarding Device parameter cleanup — visual QA

## Comparison target

- Source visual truth: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-d1b0ac68-2192-46de-aa41-79926bd08f92.png` (3840 × 1706 px) and `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-7c6597c8-feb9-4a8f-907b-9863575d46f0.png` (3098 × 596 px).
- Browser-rendered implementation: `/tmp/onboarding-wizard-no-badge-no-opc.png`.
- Browser viewport and implementation capture: 2048 × 910 CSS px, device scale factor 1, 2048 × 910 image px.
- Density normalization: the first source and implementation share the same 2.25:1 desktop aspect ratio; the second source is a focused region used to identify the module to remove rather than for pixel-aligned layout matching.
- State: Device step after `Fill Mock Data`, OXPAY selected, and Integration Mode changed to `PAYwizard OPC Attended TCP` to verify the removed module does not reappear.

## Full-view comparison evidence

- The portal shell, Payment App Deployment card, Processor Parameters heading, template selector, tabs, fields, and bottom actions retain their existing layout and styling.
- The OXPAY payment-channel pill shown in the source is absent, leaving a clean single-column section heading.
- Selecting an OPC integration mode does not render `OPC Configuration Parameters`; the action bar follows immediately after the processor fields.

## Focused region comparison evidence

- The first source and implementation were reviewed together at the same desktop aspect ratio, confirming that only the highlighted channel badge was removed from Processor Parameters.
- The focused OPC source and implementation were reviewed together, confirming the entire heading, tabs, and field grid are absent rather than merely clipped or collapsed.

## Required fidelity surfaces

- Fonts and typography: existing Poppins portal typography, weights, capitalization, and field hierarchy are unchanged.
- Spacing and layout rhythm: removing the badge does not leave an empty right-side placeholder; removing OPC closes the vertical gap before the footer actions.
- Colors and visual tokens: no remaining colors or tokens changed in this pass.
- Image quality and asset fidelity: no imagery or icon assets were introduced or altered.
- Copy and content: Processor Parameters content remains intact; only the payment-channel label and the requested OPC parameter module were removed.

## Findings and interaction checks

- No actionable P0, P1, or P2 mismatch remains for the requested cleanup.
- Integration Mode remains selectable and continues to synchronize into Review data.
- Hidden OPC controls no longer participate in validation or template serialization.
- Browser console errors: none.
- Playwright Device onboarding regression: 7/7 passed.

## Comparison history

- Pass 1 found no actionable P0, P1, or P2 mismatch after the requested removals, so no visual-fix iteration was required.

## Follow-up polish

- None required for this scope.

final result: passed

---

# Alerts Design QA

## Comparison target

- Source visual truth path: user-provided conversation attachments for the alert-condition menu, compact temperature controls, selected temperature unit, and the Product Map toolbar button style. The chat client did not expose filesystem paths for these source attachments.
- Implementation paths:
  - `design-qa/evidence/terminal-alerts-desktop.png`
  - `design-qa/evidence/customer-alerts-desktop.png`
  - `design-qa/evidence/customer-alerts-mobile.png`
  - `design-qa/evidence/terminal-temperature-controls-desktop.png`
  - `design-qa/evidence/terminal-temperature-controls-fahrenheit.png`
  - `design-qa/evidence/customer-temperature-controls-desktop.png`
  - `design-qa/evidence/customer-temperature-controls-mobile.png`
- Desktop viewport: 1440 × 1000 CSS px; deviceScaleFactor 1. Full implementation captures are 1440 × 1000 px.
- Mobile viewport: 390 × 844 CSS px; deviceScaleFactor 1. Implementation capture is 390 × 844 px.
- Focused implementation pixels: desktop temperature controls 642 × 57 px; mobile temperature controls 336 × 190 px.
- Source pixels: the latest temperature-row source was provided as a 1688 × 154 px crop. Other source crops were available in the conversation renderer but their original pixel metadata and density were not exposed. Comparison therefore used visible proportions and control geometry rather than a pixel-difference threshold.
- State: Create Alert Rule open with `Temperature Out of Range`, default `2–8 °C`; an additional focused capture shows the unchanged `2–8` values after switching to `°F`.

## Full-view comparison evidence

- Both Terminal Alerts and Customer Alert Center retain their existing portal shell, modal treatment, section order, typography, and equal-height footer buttons.
- Desktop keeps Temperature Unit, Lower bound, and Upper bound on one row. The 144 px unit selector and two 160 px number inputs avoid stretching short temperature values across the modal.
- Mobile changes the same controls to one column without horizontal overflow; the modal footer remains visible with equal-height actions.
- The removed condition is absent and the renamed Payment Service condition appears in the rendered tables and selectors.

## Focused-region comparison evidence

- Typography: Poppins remains the rendered family. Automated computed-style comparison confirms both Alerts toolbar controls match the Product Map `Map` button for family, 13 px size, 400 weight, 38 px minimum height, padding, 9 px radius, background, and shadow.
- Spacing/layout: desktop tracks are exactly `144px 160px 160px` with 12 px gaps and bottom alignment. Mobile tracks resolve to one column.
- Colors/tokens: the selected unit uses the portal near-black `#111827` with white text; the inactive option retains the existing neutral control background and border.
- Image/icon quality: existing `add-box.svg` and `assignment.svg` assets are used; no substitute glyphs or custom-drawn icons were introduced.
- Copy/content: `Payment Service Offline` is used for the compatible `opc_offline` key. `Temperature Data Unavailable` is removed. Temperature labels and summaries follow the selected °C/°F unit.

## Findings

- No remaining P0, P1, or P2 findings.
- P3: source attachment density was not available for automated pixel-difference comparison; control geometry and visible state were verified at deviceScaleFactor 1 instead.

## Comparison history

1. P2: temperature controls were vertically stacked and the number inputs consumed excessive width. Fixed with one compact desktop row and 160 px bound inputs; post-fix evidence: `terminal-temperature-controls-desktop.png` and `customer-temperature-controls-desktop.png`.
2. P2: the selected unit was too subtle. Fixed with a solid near-black selected segment and white text; post-fix evidence: the desktop and Fahrenheit focused captures.
3. P2: `Open Alert Center` had a different font weight and structure from toolbar buttons on other tabs. Removed the conflicting typography, matched the Product Map computed styles, and added the existing assignment icon; post-fix evidence: `terminal-alerts-desktop.png` plus the computed-style regression assertion.
4. Responsive pass: captured the 390 × 844 state after fixes; no overflow, clipped controls, or unequal footer-button heights remain.

## Primary interactions and runtime checks

- Tested create, unit switch, save, summary rendering, edit/reopen, legacy localStorage migration, removed-rule/event cleanup, filters, and notification deep links.
- Checked the temperature flow for browser console errors and page runtime errors.
- Relevant Playwright suite: 18 passed.
- Full repository suite: 163 passed and 21 unrelated existing failures outside Alerts/Notifications.

## Implementation checklist

- [x] Rename visible condition while retaining the compatible internal key.
- [x] Remove unsupported condition and migrate stored prototype data.
- [x] Reduce temperature parameters to unit, lower, and upper.
- [x] Match desktop/mobile layout and action-button geometry.
- [x] Match Alerts toolbar controls to the existing tab toolbar design.
- [x] Capture final desktop, mobile, Celsius, and Fahrenheit evidence.

final result: passed
