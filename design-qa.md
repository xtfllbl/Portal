# Rule Owner level + searchable cascade — visual QA

## Comparison target

- Source visual truth: the user-supplied annotated Select Rule Owner screenshot at `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-338611a1-b77a-4d44-ba3e-20e6cdc41d1d.png`, with the list and Search all accounts control explicitly rejected by the user.
- Browser-rendered desktop complete state: `design-qa/evidence/rule-owner-level-search-desktop.png` (`1440 × 900` px).
- Browser-rendered desktop search-open state: `design-qa/evidence/rule-owner-level-search-open.png` (`1440 × 900` px).
- Mobile implementation: `design-qa/evidence/rule-owner-level-search-mobile.png` (`390 × 844` px).
- Short-height regression evidence: user screenshot `codex-clipboard-844aef67-c66e-485e-9dce-d552a07d6c32.png` versus fixed `design-qa/evidence/rule-owner-dropdown-compact-height-fixed.png` at a `750 × 363` CSS viewport; `design-qa/evidence/rule-owner-dropdown-standard-fixed.png` confirms the normal desktop state.
- Simplification evidence: `design-qa/evidence/rule-owner-no-summary.png` and `design-qa/evidence/rule-owner-no-summary-mobile.png` confirm `Agent (AGT)` selection with the redundant Selected Rule Owner summary removed; Owner Level options also use `Merchant (MCH)` and `Store (STR)`.
- State: Operations Manager, Owner Level chosen first; desktop evidence covers Merchant search and Store completion, while mobile covers the full Store path.

## Full-view and focused comparison evidence

- The rejected all-account list is replaced by a compact Owner Level selector followed by only the searchable hierarchy fields required to reach that level.
- The existing Paywizard shell, centered desktop modal, neutral palette, typography, border radii, and black primary action remain unchanged.
- The open-state evidence confirms that search results stay attached to their field and expose both account name and stable ID without expanding into a second browsing surface.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: the existing Poppins stack and portal weights are preserved; labels, account names, IDs, and actions remain readable without clipped desktop text.
- Spacing and layout rhythm: desktop keeps the established 720 px context-dialog width and 36 px footer actions. The cascade uses compact 36 px fields with consistent 12 px vertical gaps.
- Colors and visual tokens: existing neutral surfaces and borders are retained; blue is limited to focus and selected-row states, and Continue uses the portal's black primary treatment.
- Image quality and asset fidelity: the existing PAYwizard logo is untouched. Chevron and close icons use the page's existing Material Symbols Rounded library; no placeholder or custom-drawn asset was introduced.
- Copy and content: Owner Level uses `Service Provider (SP)`, `Agent (AGT)`, `Merchant (MCH)`, and `Store (STR)`. Search all accounts, the Selected Rule Owner summary, and modal subtitles are absent.
- Accessibility and responsiveness: each search uses the combobox/listbox pattern with explicit labels, keyboard navigation, `aria-expanded`, and `aria-selected`; Continue remains the authoritative completion state. Mobile is exactly `390 × 844`, has no document overflow, and Cancel/Continue are both `36 px` high and `176 px` wide.
- Short-height behavior: the dropdown is viewport-positioned above the modal stacking context, capped to available space, independently scrollable, and uses compact rows below `520 px` viewport height. All four Service Providers remain visible at `750 × 363` without being covered by the footer.

## Primary interactions tested

- Owner Level begins blank and Continue remains disabled until the selected target depth is complete.
- Service Provider, Agent, Merchant, and Store can each be the final Owner; Merchant does not reveal or require Store.
- Merchant and Store flows require an explicit Agent or Direct merchants path.
- Per-level search matches account names and stable IDs, supports Arrow keys / Enter / Escape, rejects unmatched free text, and exposes an empty state.
- Changing Owner Level or any upper-level account clears invalid downstream selections.
- Change restores the Owner Level and full selected path before returning to Create/Edit Alert Rule.
- Desktop and mobile Cancel/Continue geometry; browser console warnings and errors: none.

## Comparison history

- Pass 1 found no actionable P0/P1/P2 issues in the level-first cascade, open search menu, or standard mobile layout.
- Follow-up found a P1 short-height issue: at an effective `750 × 363` viewport, the modal footer painted over the dropdown and hid later options. Fix: the list is now a viewport-aware fixed layer with independent scrolling and compact short-height rows; the accepted regression capture shows all four providers above the viewport edge.
- Follow-up simplification removed the redundant selected-owner summary and standardized the missing abbreviations to MCH and STR. No P0/P1/P2 issue remains in the resulting compact dialog.

## Implementation checklist

- [x] Add required Owner Level selection with no default.
- [x] Reveal only the hierarchy fields needed for the selected Owner level.
- [x] Add accessible searchable comboboxes for Service Provider, Agent path, Merchant, and Store.
- [x] Support Direct merchants routing without treating it as an Owner type.
- [x] Remove global account search and reject unmatched free text.
- [x] Use SP / AGT / MCH / STR abbreviations and remove the redundant selected-owner summary.
- [x] Preserve rule-form ownership and notification-draft behavior.
- [x] Verify desktop/mobile geometry, primary interactions, accessibility state, and console health.

## Follow-up polish

- P3: production server-side search, loading, pagination, and disabled-account states require backend account APIs and remain outside this fixed-data prototype.

final result: passed

---

# Analytics compactness and Agent List redesign — visual QA

## Comparison target

- Source visual truth: the four user-provided follow-up screenshots for compact Agent Analytics, compact Merchant Analytics, rounded Merchant Performance headers, and the Agent List redesign; the earlier full-page screenshots remain the navigation and content reference.
- Browser-rendered implementations:
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/agent-analytics-compact-desktop.png`
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/merchant-analytics-compact-desktop.png`
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/agent-list-compact-desktop.png`
  - Corresponding `*-compact-mobile.png` captures in the same directory.
- Desktop viewport/output: `2048 × 1140` CSS/image pixels. Mobile viewport/output width: `390` CSS/image pixels; full-page height follows content. Device scale factor 1, so no density normalization was required.
- State: WizarPOS Provider, 7D selected, Agents and Merchants groups expanded, Agent List default hierarchy visible.

## Full-view and focused comparison evidence

- The source screenshots and implementation captures were inspected together in the same multimodal comparison context. The new captures preserve the reference portal shell, page hierarchy, card ordering, restrained grayscale palette, semantic status colors, and navigation states.
- Agent Analytics now uses compact content-driven cards and independent lower-panel heights. The short Top Performing Agents table ends with its content instead of stretching to match the five-row merchant table.
- Merchant Analytics now keeps the summary and Quick Insights content close to their borders, while Merchant Performance retains all ten visible rows and compact pagination.
- Focused table inspection confirms 8px top-left/top-right rounding on both black headers and consistent 36px Agent List action buttons using Material Symbols Rounded.
- Mobile captures confirm single-column cards and horizontal scrolling confined to the table containers; the document itself remains 390px wide.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: Poppins and the existing portal hierarchy are retained; Agent List table terminology is consistently Agent-facing and black headers use uppercase labels.
- Spacing and layout rhythm: Analytics desktop padding is 20px, metric gaps 14px, cards approximately 120px high, lower sections content-driven, and mobile padding 14–16px.
- Colors and visual tokens: existing neutral surfaces, black headers/actions, blue edit/reset, red disable, green success, and orange negative trends remain consistent with the references.
- Image quality and assets: the existing PAYwizard logo is preserved and all new UI icons use the existing Material Symbols Rounded library; no placeholder, custom SVG, or CSS-drawn asset was introduced.
- Copy and content: page subtitles remain omitted per repository UI rules. Existing eight-row Agent hierarchy and Settings action are intentionally preserved per the confirmed product decision.
- Accessibility and responsiveness: icon controls have accessible names and titles, search controls are equal-height, disabled child creation remains exposed, and mobile has no page-level horizontal overflow.

## Primary interactions tested

- Agent Analytics filtering, periods, View All/Show Less, and Merchant Analytics periods/pagination.
- Agent List search/reset and all six accessible row actions.
- Top Add opens an enabled eligible-parent selector; row Add opens the same form with the parent locked; invalid parent scope cannot submit.
- Agents/Merchants navigation persistence and the three-profile Split Rules visibility/route guard.
- Browser console/page errors across both Analytics pages and Agent List: none.

## Comparison history

- Pass 1 found a P2 density issue: metric cards retained 134px height after the initial reduction. Fix: vertical padding and internal spacing were tightened; the final browser assertion is at or below 125px.
- Pass 1 found a P2 lower-panel issue: CSS Grid stretched the short Agent table to the height of the adjacent merchant table. Fix: `align-items: start` makes each section content-driven; the short panel now measures below 300px.
- Pass 2 found no remaining actionable P0/P1/P2 differences in desktop or mobile captures.

## Implementation checklist

- [x] Compact Analytics cards, sections, insights, tables, and pagination.
- [x] Restore rounded black table headers.
- [x] Redesign Agent List while preserving all existing data and row operations.
- [x] Add selectable-parent top Add and locked-parent row Add.
- [x] Verify desktop/mobile responsiveness, navigation access, interactions, and console.

## Follow-up polish

- P3: production API persistence remains intentionally outside this fixed-data prototype.

final result: passed

---

# Analytics navigation and pages — visual QA

## Comparison target

- Source visual truth: user-provided task screenshots 1–5; screenshot 3 is the Agent Analytics desktop target (`2048 × 1140` after conversation normalization) and screenshot 5 is the Merchant Analytics desktop target (`1856 × 1339` after normalization).
- Browser-rendered implementations:
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/agent-analytics-desktop.png`
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/merchant-analytics-desktop.png`
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/agent-analytics-mobile.png`
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/merchant-analytics-mobile.png`
  - `/Users/beaver/Paywizard/模版资料/应用推送参数原型/artifacts/analytics-mobile-navigation.png`
- Desktop comparison viewports and output pixels: Agent `2048 × 1140`; Merchant `1856 × 1339`; device scale factor 1 and no density conversion.
- Mobile validation viewport and output pixels: `390 × 844`; device scale factor 1.
- State: WizarPOS Provider, 7D selected, Agents and Merchants groups expanded. Attended and Unattended visibility were verified separately.

## Full-view comparison evidence

The source screenshots and browser captures were inspected together in the same comparison context. Both implementations preserve the reference's shared portal frame, selected navigation treatment, white content surface, metric-card geometry, restrained grayscale palette, segmented period control, table density, status chips, and content hierarchy. The descriptive lines under each page title are intentionally absent because the repository's UI rule requires all subtitle-style copy to be removed.

Agent Analytics preserves the four-plus-two metric-card layout and paired lower tables. Merchant Analytics preserves the three-card summary, full-width Quick Insights strip, black performance-table header, ten visible rows, and pagination. The shared production shell's existing sidebar width and profile label are retained instead of copying the screenshot's older shell variant.

## Focused comparison evidence

- Sidebar: `artifacts/agent-analytics-desktop.png` and `artifacts/merchant-analytics-desktop.png` confirm that Agents is now a true group with Agent List and Analytics, both Agents and Merchants can remain open, and the active child uses the existing pill treatment.
- Metric controls: desktop and mobile captures confirm that the Agent selector and range control are 42 px high; mobile periods remain 32 px within the 42 px group.
- Merchant table: `artifacts/merchant-analytics-desktop.png` confirms the black header, green statuses, black performance bars, aligned detail icons, ten-row density, and pagination.
- Responsive flow: the two mobile captures confirm single-column metric cards and contained horizontal table scrolling; the final Agent page width equals its `390 px` viewport.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Fonts and typography: Poppins is used throughout with the reference's title, metric, label, and compact table hierarchy; no clipped or unintended wrapped labels remain.
- Spacing and layout rhythm: 24 px desktop and 16 px mobile page padding, 8–9 px radii, light borders, card gaps, and section spacing match the reference language and current portal shell.
- Colors and visual tokens: the shared neutral shell, dark selected navigation, black table header, blue insight rule, green success, red disabled, and orange negative trends are represented without decorative drift.
- Image quality and asset fidelity: the existing PAYwizard raster logo is reused; interface icons come from the existing Material Symbols Rounded library. No placeholders, custom SVG art, CSS drawings, or gradients were introduced.
- Copy and content: reference labels and sample values are retained, except for the intentionally removed page subtitles. Agent List is now named consistently in the title, breadcrumb, and navigation.
- Accessibility and responsiveness: filters have accessible labels, period buttons expose pressed state, pagination has navigation labels, detail buttons have merchant-specific labels, focus rings are visible, and mobile has no page-level horizontal overflow.

## Primary interactions tested

- Agents and Merchants expand independently and persist their state across refreshes.
- Agent selector filters both tables and recalculates summary values.
- 7D/30D/90D updates summary values, badges, and Merchant trend copy.
- View All / Show Less expands and contracts Agent tables.
- Merchant pagination, page size, and detail action operate with mock data.
- Both Analytics pages are available under all three Portal Access Profiles.
- Split Rules is hidden and direct-route guarded for Attended and Unattended Providers.
- Mobile navigation drawer opens with both relevant groups visible.
- Browser console errors on both Analytics pages: none.

## Comparison history

- Pass 1 found a P2 Merchant-table mismatch: the performance fill was inline and therefore rendered as a pale empty track. Fix: `.performance-fill` now uses `display: block`; post-fix evidence is `artifacts/merchant-analytics-desktop.png`, where every reference bar is visibly black.
- Pass 1 found a P2 mobile containment issue on Agent Analytics: lower grid items forced the body to `456 px` at a `390 px` viewport. Fix: the section and lower grid now opt into shrinking with `min-width: 0`; post-fix browser measurement is `390 px` body width at a `390 px` viewport and table overflow remains inside `.table-scroll`.
- Pass 2 found no remaining actionable P0/P1/P2 differences.

## Implementation checklist

- [x] Add both Analytics destinations and screenshot-aligned content.
- [x] Convert Agents into a persistent independent group.
- [x] Add Merchant Analytics for all three profiles.
- [x] Restrict Split Rules to WizarPOS Provider in navigation and route guards.
- [x] Verify desktop, mobile, interactions, accessibility states, and browser console.

## Follow-up polish

- P3: real service data and production destination routes for View All / merchant details remain intentionally outside this fixed-data prototype scope.

final result: passed

---

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
