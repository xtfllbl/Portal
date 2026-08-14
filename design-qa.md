# Leads and Merchant List Unified Admin Shell QA

## Coverage

- Rebuilt the Leads and Merchant List shells against `38.Merchant_onboard.html`: Poppins, the supplied Paywizard/SANDBOX asset, Material Symbols, 16px page rhythm, 264px sidebar, 70px topbar, compact menus, 8px surfaces, dark table heads, and matching controls.
- Removed the Merchant List legacy intrinsic-width conflict that pushed header actions outside the viewport. Wide data remains horizontally scrollable inside the table wrapper without creating page-level overflow.
- Added real bidirectional Leads, Onboarding, and Merchant List links on all three pages, with one correct `aria-current="page"` state per page.
- Added viewport-aware Action tooltips across all three tables. Hovering or keyboard-focusing an icon now names View, Edit, Review/Continue Review, Create Merchant, Share, Copy, More, or merchant-detail actions without being clipped by a table scroll container.
- Matched the remaining content typography to the Onboarding source tokens: 13px base; 25px/600 desktop and 21px/600 mobile titles; 14px/13px navigation; 12px breadcrumb and filters; and 11px/600 table headers with 11px/400 body cells. Leads Process IDs no longer use a mismatched monospace face, and Merchant List DBA links/IDs no longer inherit the legacy oversized 16px/13px rules. Legacy large-radius and large-type rules in both business modals are now explicitly normalized.
- Rebuilt Merchant List filtering as one ordered toolbar. It renders all six fields plus Reset/Search on one line at 1440px and above, a deliberate 4+4 layout at 1320px/1024px, two columns at 390px, and six single fields followed by a two-button row at 320px.
- Preserved Leads UPT/PSP tabs, filters, export/share actions and Landing Page modal; preserved Merchant List dynamic records, row actions, Add Merchant, Onboard Wizard, and Custom eReceipt.
- Applied the shared 236px, 74px icon-rail, and hidden-mobile sidebar behavior at 1320px, 1040px, and 760px respectively.
- Restored vertical scrolling inside the UPT Leads content panel so the complete table and pagination remain reachable; the table wrapper continues to own horizontal scrolling only.
- Simplified Merchant List DBA cells to a single 11px semibold blue merchant-name link. Legacy second-line Paywizard IDs were removed from both static rows and dynamically inserted onboarding merchants.

## Visual evidence

- Leads desktop: `artifacts/admin-leads-unified-1440.png`.
- Merchant List desktop: `artifacts/admin-merchant-list-unified-1440.png`.
- Merchant List medium-width filter layout: `artifacts/admin-merchant-list-filters-1320.png`.
- Leads mobile: `artifacts/admin-leads-unified-390.png`.
- Merchant List mobile: `artifacts/admin-merchant-list-unified-390.png`.
- Leads pagination after vertical scroll: `artifacts/admin-leads-pagination-1440.png`.
- Merchant List single-line DBA treatment: `artifacts/admin-merchant-list-dba-1440.png`.
- Visual review confirms the oversized 310px Merchant List sidebar, oversized logo/menu rows, off-screen page actions, and mobile color-bar artifacts are removed.

## Automated result

- `tests/merchant-admin-navigation.spec.js`: 10 passed in Chromium.
- Covered three-way navigation, active-menu semantics, exact responsive sidebar/topbar dimensions at 2048px, 1440px, 1024px and 390px, exact title/table font sizes, weights and line heights, Poppins/logo/table-head tokens, zero page-level horizontal overflow, Leads tabs/filter/share modal, and Merchant List Add Merchant/row-menu/Custom eReceipt behavior.
- Existing `tests/merchant-onboarding.spec.js`: 19 passed after the navigation changes.
- `git diff --check` and targeted browser console/page-error checks passed.

final result: passed

---

# Partner Sidebar Density Fix QA — 2026-08-14

## Evidence

- Source visual truth: live `5.merchant_manage_iso.html` shared administration sidebar.
- Source screenshot: `/tmp/merchant-sidebar-reference.png`.
- Implementation screenshot: `/tmp/partner-sidebar-fixed.png`.
- Viewport: 1920 x 853 CSS px; both screenshots are 1920 x 853 px at device scale factor 1.
- State: Merchant List selected in the reference; Partners and Partner List selected in the implementation.
- Full-view evidence: both pages were captured from the same browser, viewport, shared stylesheet, and page-shell state.
- Focused evidence: sidebar row geometry was measured in-browser. Both pages render every menu and submenu row at 47px. The Partner navigation is 457px high for nine visible rows; the Merchant reference is 645px high for thirteen visible rows.

## Findings and fix history

1. P1 initial issue: legacy `.nav { flex: 1 }` stretched the Partner page's CSS Grid navigation tracks across the remaining sidebar height, producing oversized gray and black menu blocks.
2. Fix: scoped the Partner sidebar to block layout and reset `.pw-nav` to `flex: none`, `align-content: start`, and visible overflow while retaining the shared `merchant-admin-unified.css` menu styling.
3. Post-fix evidence: Dashboard, Transactions, Agents, Merchants, Partners, Partner List, Device Management, APP Management, and Remote Diagnostic all measure 47px high with the same icon, typography, spacing, radius, and active-state tokens as the Merchant reference.
4. Automated regression: `tests/partner-information.spec.js` passes 4/4, including a sidebar-density assertion, terminal lifecycle behavior, all UPT sample data, and responsive layouts.

## Fidelity surfaces

- Fonts and typography: shared Poppins family, weights, sizes, and line heights match the Merchant reference.
- Spacing and layout rhythm: compact 47px rows and 4px grid gaps are restored; no full-height track stretching remains.
- Colors and visual tokens: active black, hover gray, white active copy, border, and panel colors come directly from the shared stylesheet.
- Image quality and assets: the existing PAYwizard raster logo and Material Symbols remain unchanged.
- Copy and content: Partner-specific navigation labels and active states are unchanged.

## Blocking evidence limitation

### Partner detail Tab typography follow-up

- Source visual truth: user-provided Partner Profile / Terminal List crop and the shared Poppins UI hierarchy.
- Implementation screenshot: `/tmp/partner-tabs-typography-final.png`, 1920 x 853 px at a 1920 x 853 CSS viewport and device scale factor 1.
- Initial P2 finding: `.detail-tab` used 15px / 800, then inherited 400 from the shared button shorthand, making the labels alternately oversized or too light compared with the global interface.
- Fix: scoped both tabs after the shared stylesheet to Poppins 13px / 600, 17.55px line height, zero letter spacing, dark active text, and muted inactive text while retaining the 48px target height.
- Post-fix browser evidence: both tabs compute to Poppins 13px / 600; tab switching works and Partner tests pass 4/4.
- Fonts/typography, spacing, colors, assets, and copy were checked; no remaining P0/P1/P2 implementation mismatch was found in the Tab region.

- Browser security policy rejected navigation to the generated data-URL comparison canvas, and the environment has no ImageMagick montage utility. The two screenshots were opened and reviewed individually, but a single combined comparison image could not be produced without bypassing that policy.
- No visual P0/P1/P2 implementation issue remains; the block is limited to the required combined-evidence artifact.

final result: blocked

---

# Partner Information Terminal Lifecycle QA — 2026-08-14

## Evidence

- Source visual truth: the user-provided `26.partner_information.html` Partner List / Terminal List screenshot in this conversation at 3840 × 1936 px, with the existing `5.*` Merchant Administration shell as the required style reference.
- Browser-rendered desktop implementation: `/tmp/partner-information-terminal-1440.png` at 1440 × 900 CSS/image px, device scale factor 1.
- Browser-rendered mobile implementation: `/tmp/partner-information-terminal-390.png` at 390 × 844 CSS/image px, device scale factor 1.
- State: `台州联创电子有限公司` selected, `Terminal List` active, no terminal filters applied.
- Full-view evidence compared the supplied Partner page composition with the browser-rendered unified shell at matching Terminal List state. The desktop capture keeps the hierarchy, dark Partner hero, tabs, lifecycle statistics, filters, table, and pagination visible together.
- No separate focused crop was required because status badges, summary values, header labels, date columns, filters, and shell geometry remain readable in the native desktop capture.

## Findings

- No remaining P0, P1, or P2 findings.
- **Fonts and typography:** Poppins, the 25px/600 page title, 14px/13px navigation, 12px breadcrumb, compact table copy, and uppercase table headers match the shared `5.*` administration tokens. Terminal status and statistic labels remain readable without clipping.
- **Spacing and layout rhythm:** The page uses the shared 16px frame gap, 264px sidebar, 70px top bar, 8px surfaces, low-elevation borders, and compact control geometry. The four desktop statistic cards collapse to two columns at 1040px and one column at 390px.
- **Colors and visual tokens:** The shared neutral shell and dark active-navigation treatment are preserved. Inbound, Outbound, Assigned, and Activated use distinct semantic badge treatments without introducing unrelated colors.
- **Image and icon fidelity:** The supplied PAYwizard Sandbox logo is used directly, and the shell uses the same Material Symbols icon family as `5.*`. No new raster placeholders or generated imagery were required.
- **Copy and content:** `Stock Type` is replaced by `Terminal Status`; `Initial Contact Date` and `Onboarding Date` are removed; `Assigned Date` is placed immediately after `Outbound Date`. The four requested lifecycle summary labels and cumulative Assigned count are present.
- **Interactions:** SN and status filtering, Enter-to-search, reset, Partner/Profile tab switching, Add Partner, and Edit remain operational. The summary values remain fixed at 11 total, 6 inventory, 3 assigned including activated, and 1 activated while filtering.
- **Responsive behavior:** Desktop and mobile document overflow is zero. The wide terminal table owns horizontal scrolling, while the page, shell, hierarchy, statistic cards, controls, and pagination remain within the viewport.

## Verification

- `tests/partner-information.spec.js`: 3/3 Chromium tests passed.
- Combined `partner|merchant|onboarding` run: 64 passed; one unrelated pre-existing Store modal copy expectation failed because the current page says `Quick Terminal Payment Setup` while the old test expects the former terminal description.
- Browser console warnings/errors: none.
- `git diff --check`: passed.

## Comparison history

1. The source page used a standalone legacy sidebar/topbar and only Inbound/Outbound terminal rows.
2. The implementation moved the page onto the shared `5.*` visual shell and added cumulative lifecycle data, four summary cards, the Assigned date column, and working filters.
3. Desktop and 390px browser passes confirmed the requested shell consistency, readable lifecycle hierarchy, table-local horizontal scrolling, and zero page-level overflow. No further P0/P1/P2 correction was required.

## Follow-up polish

- P3: At medium desktop widths, long Partner names may wrap inside the dark hero while all four action buttons remain on the same row; this is an intentional responsive tradeoff and does not obscure content or controls.

## Result

final result: passed

---

# Merchant Flow Control Geometry Correction QA — 2026-08-14

## Scope and evidence

- Corrected the shared Merchant Flow styling so the 8px system applies only to rectangular page surfaces, cards, and dialogs.
- Removed the global radius override from native inputs, selects, textareas, `.input-field`, `.input`, and specialized search/device controls.
- Verified screenshot: `assets/qa/merchant-form-controls-restored-1440.png` at 1440 x 900, device scale factor 1.
- Visual result: Add Merchant fields and selects again use the original straight underline treatment; the outer page and Merchant Info surfaces retain the unified 8px radius.

## Computed-style audit

- `5.merchant_add_iso.html`: 32 underline controls, all `border-radius: 0px`, top border absent, bottom border solid.
- `5.merchant_add_merchant_only_iso.html`: 14 underline controls, all `border-radius: 0px`, top border absent, bottom border solid.
- The remaining four `5.*` pages retain their own native control geometries (`0px`, `10px`, `12px`, or semantic pill values) rather than inheriting a forced shared radius.
- All six pages report zero page-level horizontal overflow at 1440px.

## Regression results

- `tests/merchant-admin-navigation.spec.js` and `tests/merchant-onboarding.spec.js`: 47 passed.
- Added a regression assertion that underline fields remain square and bottom-border-only, while specialized controls retain their original radius.
- No P0, P1, or P2 visual or interaction findings remain for this correction.

final result: passed

---

# Create Onboarding Application Split Form QA

## Evidence

- Source visual truth: the selected second ImageGen direction, `exec-fc1decee-1647-40dd-be48-5810de152b8a.png`, with the existing `38.Merchant_onboard.html` shell treated as authoritative for brand and navigation.
- Desktop implementation screenshot: `assets/qa/qa-onboarding-create-split-desktop.png` at 1440 x 900.
- Mobile implementation screenshot: `assets/qa/qa-onboarding-create-split-mobile.png` at 390 x 844.
- State: populated `Create Onboarding Application` view opened through `#new-onboarding` with the phone field focused.

## Findings

- No remaining P0, P1, or P2 findings.
- **Structure:** Desktop uses the selected 60/40 split: Merchant & Contact Details on the left and Application Setup on the right, separated by one quiet vertical rule. There are no cards inside either section and no explanatory content was added.
- **Typography:** The existing Poppins Paywizard hierarchy is retained. Section headings are 16px/600 and field labels are 12px/600 uppercase labels above compact 14px values.
- **Controls:** Inputs and selects use the portal's compact 40px outlined treatment with 7px radii, neutral borders, blue focus ring, and red invalid state.
- **Layout:** At 1440px the form measures 1086px, the sections resolve to approximately 60/40, Merchant Details is 2 x 2, and Application Setup is a one-column stack. At 1200px the sections stack, Merchant Details remains two columns, and Application Setup becomes a three-column row.
- **Actions:** Cancel remains left aligned; Save and Save & Share remain grouped on the right immediately after Application Setup. The action area is not sticky or bottom-pinned.
- **Responsive behavior:** At 390px both sections and all fields are single-column, the separator becomes horizontal, and the document width equals the viewport width. At 320px the action group wraps without horizontal overflow.
- **Behavior:** Draft editing, Lead prefill, dynamic country/currency options, required validation, Save, Save & Share, Cancel, URL hash, status transitions, and localStorage behavior remain unchanged.

## Verification

- Focused onboarding Playwright suite: 19 passed.
- Desktop browser console warnings/errors: none.
- Computed-style assertions verify 12px/600 labels, 14px control values, white control backgrounds, 1px borders, 7px radii, and the desktop vertical divider.
- Responsive assertions passed at 2048 x 1138, 1440 x 900, 1200 x 900, 1024 x 900, 390 x 844, and 320 x 844.

## Comparison history

1. The first redesign flattened the form into full-width underline fields, but seven fields remained visually disconnected across a wide page.
2. The selected second direction reorganized the same fields into a controlled-width 60/40 workspace with compact outlined controls and a single divider.
3. Same-input comparison against the selected design confirmed the intended hierarchy, density, section relationship, and action placement; responsive review found no overflow.

## Result

final result: passed

---

# UPT Lead SN Assignment QA

## Evidence

- Source visual truth: the user-provided `Assign/New Merchant` dialog screenshot, extended by the approved Step 3 SN-selection specification.
- Desktop browser capture: `artifacts/upt-lead-sn-assignment-modal-visual.png` at 1920 × 853 px, default desktop viewport, device scale factor 1.
- Mobile browser capture: `artifacts/upt-lead-sn-assignment-modal-390.png` at 390 × 844 CSS/image px, device scale factor 1.
- State: an unassigned UPT Lead with the Assign/New Merchant dialog open and all available SNs selected.

## Findings

- No remaining P0, P1, or P2 findings.
- **Typography and copy:** The dialog preserves the Poppins hierarchy, compact 21px title, 16px step headings and 11–13px control text used by the unified admin shell. Step 3 clearly separates total and selected counts.
- **Spacing and layout:** Desktop uses a compact two-column SN grid within the existing 680px dialog. Mobile collapses the grid to one column, keeps the action buttons visible, and reports zero page-level horizontal overflow.
- **Colors and states:** Unassigned SNs use the normal white selectable card treatment. Persisted assignments use a disabled neutral treatment with their Merchant and Store destination. Error, disabled Save and success-toast states retain existing semantic tokens.
- **Assets:** No new raster or custom-drawn assets were required; existing Material Symbols and native form controls remain unchanged.
- **Behavior:** All available SNs are selected on open; Select All and individual checkboxes update the count; subset saves persist by Process ID; assigned SNs cannot be selected again; later saves accumulate without double counting; all-assigned Leads disable Save.
- **Data consistency:** `Terminal Number` remains the full SN count and the adjacent `Assigned SN` cell is derived from unique persisted assignments. Refreshing the page preserves both assignments and the displayed count.

## Verification

- `tests/merchant-admin-navigation.spec.js`: 20/20 Chromium tests passed after adding batch assignment coverage; combined Admin + Onboarding regression: 39/39 passed.
- Covered missing Merchant/Store/SN validation, partial first assignment, second-store assignment, locked assigned SNs, all-assigned state, persistence, mobile overflow, Add SN, Onboard prefill, detail SN List and sticky Actions.
- Browser console warnings/errors: none.
- `git diff --check`: passed.

## Result

final result: passed

---

# Leads Actions and Onboarding Prefill QA

## Evidence

- Desktop UPT More menu: `artifacts/admin-leads-onboard-menu-1440.png`.
- Desktop Assign/New Merchant dialog: `artifacts/admin-leads-assign-modal-1440.png`.
- Mobile UPT action area: `artifacts/admin-leads-onboard-menu-390.png`.
- Automated coverage: `tests/merchant-admin-navigation.spec.js` (14/14 Chromium tests passed).

## Verified behavior

- Tabs render as `UPT` and `PSP`; existing tab switching, filters, pagination, vertical panel scrolling and horizontal table scrolling remain operational.
- UPT rows expose exactly View, Edit and More at runtime. PSP rows expose only View.
- Terminal Number `0` produces `Add SN`; non-zero values produce `Assign/New Merchant`; `Onboard` is always present for UPT.
- The More menu is a body-level fixed popover and is not clipped by the horizontally scrolling table.
- Assign/New Merchant supports merchant/store selection, temporary new merchant/store inputs, close, Cancel, backdrop close and Escape. Save intentionally does not persist.
- Onboard transfers only merchant name, primary contact, email and country through `paywizard-lead-onboarding-prefill-v1`; phone, channel and currency remain empty.
- Saving creates an independent Onboarding Process ID and persists the Lead source metadata. The temporary prefill payload is then removed.
- Duplicate checks run before navigation and again in the Onboarding route, preventing a second application for the same Lead regardless of application status.
- Desktop and 390px checks report zero page-level horizontal overflow. Browser interactions completed without console errors.

## Visual review

- The menu, modal typography, spacing, 8px radius, neutral border treatment and actions follow the compact `38.Merchant_onboard.html` admin language.
- The modal remains centered above the table, while the menu aligns to the triggering More action and stays readable near the viewport edge.
- Mobile preserves the compact action matrix and table-local horizontal navigation without expanding document width.

## Result

final result: passed

---

# UPT Lead Shell, Add SN and Onboarding Prefill QA

## Evidence

- Visual source: the user-provided PAYwizard Merchant Information, Add SN, and fixed Actions screenshots, with `38.Merchant_onboard.html` as the shell reference.
- Desktop shell capture: `artifacts/upt-lead-detail-shell-2048.png` at 2048 × 1138 CSS px.
- Add SN capture: `artifacts/upt-lead-add-sn-2048.png` at 2048 × 1138 CSS px.
- Sticky Actions capture: `artifacts/upt-lead-sticky-actions-2048.png` at 2048 × 1138 CSS px.
- Automated regression: `npx playwright test tests/merchant-admin-navigation.spec.js tests/merchant-onboarding.spec.js --reporter=line` — 38 passed.

## Findings

- No remaining P0, P1, or P2 findings.
- The UPT detail shell now starts at viewport origin and matches the Onboarding shell: 264px desktop sidebar, 70px top bar, 47px menu items, 16px frame spacing, matching logo and breadcrumb treatment.
- Add SN supports comma/newline batches, uppercase normalization, exact 16-character alphanumeric validation, batch duplication checks, cross-Lead duplication checks, and atomic persistence through `paywizard-upt-lead-overrides-v1`.
- Persisted SNs update the Lead Terminal Number immediately, survive refresh, change the More action to Assign/New Merchant, and appear in the detail SN List with the same count.
- Onboard now resolves the merged Lead by Process ID and prefills merchant name, contact, email, phone, country, currency, and Lead Owner; Payment Channel intentionally remains empty.
- Sticky Actions use matching odd/even/hover backgrounds and a one-pixel separator instead of the previous broad shadow. UPT and PSP business columns continue to scroll independently.
- The 390px shell/detail layout has no page-level horizontal overflow. Browser console and page error checks were clean.

## Result

final result: passed

---

# UPT Lead Detail and Sticky Actions QA

## Evidence

- Sticky UPT Actions after horizontal scrolling: `artifacts/admin-leads-sticky-actions-1440.png`.
- UPT Merchant Information detail: `artifacts/upt-lead-detail-1440.png`.
- SN List modal with five serial numbers: `artifacts/upt-lead-sn-list-1440.png`.
- Responsive detail view: `artifacts/upt-lead-detail-390.png`.
- Browser coverage: 2048px, 1440px, 1024px and 390px through `tests/merchant-admin-navigation.spec.js`.

## Findings

- UPT and PSP Actions cells remain pinned to the right edge while all preceding columns move inside the table scroll container. The pinned header and cells use opaque backgrounds, a divider and a light left shadow, so scrolled content does not show through.
- All 10 visible UPT Leads resolve to distinct `leadProcessId` detail records. The existing list values remain unchanged, while the six read-only information sections contain complete, stable sample data.
- Every non-zero Terminal Number has the same number of unique 16-character serial numbers. The zero-terminal record opens the same modal with `No Data Found` and `Total Count 0`.
- The SN dialog closes through Cancel, overlay click or Escape. Invalid IDs show a dedicated not-found state without leaking another Lead's data.
- At 390px, detail fields collapse to one column, the sidebar is removed according to the shared admin shell, and document width does not exceed the viewport.
- No browser console errors or page-level horizontal overflow were found.

## Result

final result: passed

---

# Merchant Onboarding Progress Tracking and Audit QA

## Coverage

- Fixed the Onboarding table to render by numeric Process ID descending. Status and `lastUpdate` mutations no longer move existing applications; invalid/non-numeric Process IDs remain at the end and newly allocated IDs appear first.
- Removed the Merchant List success banner and the Add Merchant prefill information strip while retaining the newly created row highlight, source validation errors, and all prefilled values.
- Moved the shared Status history `Expand` / `Collapse` control directly beside its heading instead of aligning it to the far edge.
- Added append-only `statusHistory` events for platform creation/share, merchant draft/submission/resubmission, operations review, return, and approval. Repeated saves in the same state update `lastUpdate` without duplicating a lifecycle node.
- Added the shared six-stage progress component and full chronological event timeline to submitted merchant pages, platform read-only View pages, and the external progress-only page. `Merchant Created` now follows `Approved` as the final platform milestone.
- Split the share dialog into Merchant Application Link and Application Progress Link sections, each with independent Copy Link and Open Page actions.
- Confirmed the external page exposes only merchant name, payment channel, Process ID, current status, milestones, and event timestamps. It renders no form, contact details, attachments, section decisions, or review comments.
- Verified Returned → Merchant Submit → Under Review loops remain visible as separate events and retain submission-version metadata.
- Refined the share dialog to titles and controls only, added a post-decision Back to Onboarding action, and removed the merchant guidance cards once an application has been submitted.
- Added deterministic prerequisite migration for incomplete legacy histories. Inferred events are marked `Migrated estimate` only in the platform audit view.
- Refined final outcomes so Approved is a reinforced green milestone and Returned is presented as a reinforced red `Changes Requested` milestone with a standard edit icon. Completed prerequisite milestones remain green in both outcomes.
- Moved returned-section comments from the section header into a full-width `Review feedback` block beneath the section content, with multiline wrapping shared by merchant and platform View modes.
- Made Status history natively collapsible across all progress surfaces. Merchant and platform View pages default to collapsed; the external progress-only page defaults to expanded and remains user-collapsible.
- Reduced Status history to two semantic event colors: red only for `Returned`; Draft, Shared, Merchant Started, Submitted, Under Review, resubmission, Approved, and Merchant Created are green.
- Changed the Approved-only `Create Merchant` action to open the real Add Merchant form with the application ID. The application remains Approved while the operator reviews or edits the prefilled data; `Merchant Created` is written only after a successful form submission.
- Prefilled DBA, contact, email, split phone number, permissions, owner, country, currency, and reliable Nuvei DBA address fields. Elavon address fields remain blank when the application does not contain a reliable address.
- Persisted successfully created merchants in `paywizard-platform-merchants-v1`, added them to the top of Merchant List with a success highlight, generated a stable MID without overwriting an existing one, and blocked duplicate creation from the same application.
- Simplified the share title to `Application links` and removed the merchant progress subtitle while keeping the external tracking page's concise context.

## Visual and responsive evidence

- Dual-link share dialog: `assets/qa/qa-onboarding-dual-share-dialog.png`.
- External desktop progress page: `assets/qa/qa-onboarding-public-progress.png`.
- External mobile progress page: `assets/qa/qa-onboarding-public-progress-mobile.png`.
- Platform View with audit history: `assets/qa/qa-onboarding-platform-audit-view.png`.
- Refined Returned merchant progress state: `assets/qa/qa-onboarding-returned-progress-refined.png`.
- Merchant Created list state: `assets/qa/qa-onboarding-merchant-created.png`.
- Browser inspection found no actionable P0, P1, or P2 visual issues. The 390 × 844 progress page measured zero horizontal overflow; the timeline converts to a vertical mobile flow while keeping timestamps readable.
- The refreshed Returned capture confirms a compact default-collapsed history, 20px welcome-to-progress gap, green prerequisite milestones, a red `Changes Requested` outcome, correctly clipped section corners, and long feedback at the bottom of the affected section.

## Automated result

- `tests/merchant-onboarding.spec.js`: 19 passed in Chromium.
- Added assertions for exact initial Process ID order, stable order after conflicting status/update-time changes, non-numeric IDs at the end, removed prompt modules, retained created-row highlighting, and a maximum 16px title-to-toggle gap.
- Covered both Nuvei and Elavon prefill mappings, Approved-state preservation before submission, editable prefilled values, required-field validation, successful Merchant Created persistence, Merchant List insertion/highlighting, generated MID, status history, duplicate prevention, ordinary blank Add Merchant access, and 1440px/390px responsive layout.
- The repository-wide run reached 61 passing tests; 9 failures remain in unrelated pre-existing DEX/Product Map expectations and do not touch the onboarding or Merchant List files changed here.
- JavaScript syntax checks and `git diff --check` passed with no console/page errors in the targeted browser run.

final result: passed

---

# Merchant Review State Polish QA

## Evidence

- Source visual truth: the three current-task annotated screenshots covering Issue-state uploads, the Application Information status layout, and the public-page privacy strip.
- Browser-rendered captures: `artifacts/merchant-review-issue-upload-and-nav-fixed.png` and `artifacts/merchant-public-privacy-note-removed.png`.
- Channels checked: Nuvei and Elavon review/public variants through the shared review and public-page implementations.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Issue-state upload cards now inherit the module's red border and neutral-red background, including cards that previously retained the green `has-file` treatment.
- Pass, Pending, and Issue badges occupy a dedicated right-side grid column on the same navigation row as the section title; badge text does not wrap or fall onto a separate line.
- The green privacy/security strip was removed from both public merchant pages, closing the gap so the channel form follows the three guidance cards directly.
- Automated coverage asserts the exact Issue upload colors, navigation badge placement/no-wrap behavior, privacy-strip absence in both channels, and existing responsive/console behavior.
- Targeted Playwright regression: 22 tests passed across the Onboarding, Nuvei, and Elavon suites.

final result: passed

---

# Merchant Onboarding State Lifecycle QA

## Coverage

- Verified the state-specific action matrix for Draft, Awaiting Merchant, Merchant Draft, Merchant Submit, Under Review, Approved, and Returned.
- Verified Draft creation/editing, first-share locking, merchant draft persistence, submission, partial review persistence, approval, return, correction, and resubmission.
- Verified `mode=view` opens the correct Nuvei or Elavon application with all merchant fields and attachments read-only and without review controls.
- Verified entering review does not change status; the first Pass/Issue interaction changes Merchant Submit to Under Review.
- Verified Returned public applications remove Save Draft and retain only the resubmission path.

## Visual and responsive checks

- Review Issue styling overrides existing green uploaded-file styling, so the entire rejected module—including upload cards—uses the red issue treatment.
- Right-rail Pass, Issue, and Pending badges remain on one line.
- No page-level horizontal overflow at 2048px, 1440px, or 390px in the onboarding creator, review page, and public application page.
- Targeted browser run completed without console errors.

## Automated result

- `tests/merchant-onboarding.spec.js`: 13 passed.
- Full Chromium suite: 56 passed and 9 unrelated pre-existing failures in DEX/Product Map tests; no Merchant Onboarding failures.

## Result

final result: passed

---

# Merchant Onboarding Review and Return Loop Design QA

## Evidence

- Source visual truth: the current-task Onboarding list, Elavon review-form, and action-button screenshots, plus the approved review/return interaction specification.
- Implementations: `38.Merchant_onboard.html`, both `27.Merchant_onboard_*.html` channel forms, both `38.Merchant_onboard_*_public.html` public forms, `scripts/merchant-onboarding-store.js`, `scripts/merchant-review-mode.js`, and `scripts/merchant-public-application.js`.
- Browser-rendered captures: `artifacts/merchant-onboarding-list-review-actions.png`, `artifacts/merchant-onboarding-nuvei-review-mixed.png`, and `artifacts/merchant-onboarding-nuvei-returned-public.png`.
- States reviewed: seeded Merchant Submit rows, mixed Pass/Issue operator review, required issue reason, Returned public application, locked approved sections, and directly editable rejected section.
- Full-view comparison evidence: the list capture was compared with the supplied PAYwizard list screenshot; the channel review capture was compared with the supplied 27-page form screenshot; the returned page was reviewed against the previously approved public-page shell.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Information hierarchy: the review action appears only for reviewable application records and is visually distinct without competing with existing view/edit/share actions. Review decisions live in each section header, while final application decisions remain together after the form.
- Review feedback: approved sections use the existing green semantic range; issue sections use a restrained red surface and place the required correction reason immediately beneath the affected module. The right-side Application Information rail mirrors Pass, Issue, and Pending states.
- Merchant correction flow: the public page introduces one clear Changes requested banner. Failed sections are red and editable; approved sections are green and locked until the merchant explicitly chooses Edit this section.
- Data fidelity: Nuvei and Elavon demonstrations contain realistic merchant, owner, banking, terminal/operation, contact, and attachment metadata. Attachment names remain visible without attempting to persist browser `File` objects.
- Responsive behavior: the portal list, 27 review mode, and public form have no page-level horizontal overflow at the required desktop and 390px viewports. The review side rail hides on mobile and section actions remain usable.
- Interaction and accessibility: review controls are native buttons with accessible names, reasons are labelled text areas, read-only merchant information cannot be edited by the operator, and the final buttons enforce the six-section decision rules.

## Workflow Verification

- Merchant Submit opens the correct channel-specific review URL and immediately becomes Under Review.
- All six sections must pass before Approve Application is enabled.
- Return to Merchant requires all six decisions, at least one Issue, and a non-empty reason for every rejected section.
- Returned public links preserve prior values and submitted attachment metadata; the merchant can edit failed sections, optionally unlock passed sections, save a draft, and resubmit.
- Resubmission increments `submissionVersion`, returns rejected or edited-approved sections to pending, preserves unchanged approved sections, and retains the prior comment in `previousReason` for operator comparison.
- Targeted Playwright regression: 22 tests passed across Onboarding, Nuvei, and Elavon suites. Console/page-error checks and responsive overflow checks passed.

final result: passed

---

# Public Merchant Application Flattening Design QA

## Evidence

- Source visual truth: the current-task annotated Nuvei screenshot (2048 × 910 px), the focused outer-title screenshot (2048 × 112 px), and the Paywizard logo crop reference (492 × 228 px).
- Implementations: `38.Merchant_onboard_nuvei_public.html` and `38.Merchant_onboard_elavon_public.html`.
- Browser-rendered evidence: `artifacts/merchant-public-nuvei-1440.jpg` and `artifacts/merchant-public-elavon-1440.jpg`, each 1710 × 952 image px from the connected browser at a 1710 × 952 CSS viewport. Browser device pixel ratio reported 2; the capture API returned CSS-sized JPEGs, so no further density normalization was needed.
- State: merchant-prefilled public application at the top of the page, with the first channel-specific form section visible.
- Full-view comparison evidence: the annotated source and both implementation captures were reviewed together. The two requested red-boxed regions are absent and the enlarged Paywizard wordmark has balanced topbar spacing. A later requested refinement also removes the privacy strip.
- Focused comparison evidence: the header logo crop, removed status-chip row, removed no-login label, removed onboarding-information heading bar, and the transition into the first form section were inspected at full resolution.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the existing Poppins hierarchy remains consistent; removing the redundant information bar does not leave an orphaned heading or spacing artifact.
- Spacing and layout rhythm: the iframe container is visually neutral, with no border, radius, shadow, title bar, or inner padding. The first channel section aligns directly with the 1240px public-page content grid.
- Colors and visual tokens: existing neutral surfaces and channel-brand colors are preserved; the earlier green privacy treatment was removed in the latest requested refinement.
- Image quality and asset fidelity: the existing `assets/paywizard-logo.png` is reused at a larger scale and intentionally cropped to the PAYwizard wordmark, avoiding the previous undersized logo and excess source-image whitespace. Nuvei and Elavon source logos remain unchanged and sharp.
- Copy and content: “No login required · Merchant application”, all three metadata chips, and both “onboarding information” wrapper titles/helper text are removed exactly as requested.
- Interaction and accessibility: merchant prefill, Save Draft, Submit Application, frame resizing, and local application-status updates remain functional. The public iframe retains a descriptive title.

## Comparison History

1. The source showed redundant status/meta content and an additional card around the entire embedded channel form (P2 hierarchy and density issue).
2. The first implementation pass removed those regions, flattened the iframe container, and enlarged/cropped the supplied Paywizard asset.
3. Browser inspection of both channels confirmed a clean direct transition into the first form section, no missing form content, and no follow-up P0/P1/P2 issue.

## Primary Interactions Tested

- Nuvei and Elavon merchant data prefill.
- Embedded Save Draft and Submit handlers remain attached after the visual simplification.
- 390px responsive regression and page-level overflow coverage.
- Browser console and page errors: none in the targeted public-page tests.
- Targeted Playwright suite: 7 tests passed.
- Full repository suite was also attempted: 37 passed and 22 unrelated existing tests failed (missing legacy source pages and pre-existing DEX/Product Map expectations); the targeted onboarding suite passes independently.

final result: passed

---

# Onboarding Near-Form Action Bar Design QA

## Evidence

- Source visual truth: the current-task 2048 × 1138 screenshot showing the prior bottom-anchored action bar, plus the approved plan to place actions immediately after Application Setup.
- Implementation: `38.Merchant_onboard.html#new-onboarding`.
- Desktop captures: `assets/qa/38-onboarding-actions-near-form-2048x1138.jpg` and `assets/qa/38-onboarding-actions-near-form-1440x900.jpg`, captured from matching CSS-pixel viewports at device scale factor 1.
- Mobile captures: `assets/qa/38-onboarding-actions-near-form-390x844.jpg` and `assets/qa/38-onboarding-actions-near-form-320x844.jpg`, captured from matching CSS-pixel viewports at device scale factor 1.
- State: blank Create Onboarding Application form with Cancel, Save and Save & Share visible.
- Full-view comparison evidence: the original screenshot and revised 2048 × 1138 capture were reviewed together. The previous 612px form-to-action gap is replaced by an 18px gap while the full-height white panel remains intact.
- Focused comparison evidence: action alignment and responsive wrapping were measured in the rendered browser. At 390px all actions share the same row; at 320px Cancel is on the first row and Save/Save & Share share the second row.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: button labels, weights, line heights and icon alignment remain unchanged and readable at every tested viewport.
- Spacing and layout rhythm: the action bar now follows Application Setup by 18px at both 2048px and 1440px widths. Cancel remains left-aligned and the primary action group remains right-aligned without bottom anchoring.
- Colors and visual tokens: neutral Cancel, green Save and blue Save & Share preserve the established PAYwizard hierarchy.
- Image quality and asset fidelity: the existing Paywizard logo and Material Symbols icons are unchanged; no new or approximate assets were introduced.
- Copy and content: all existing labels and action wording are retained.
- Interaction and accessibility: action order remains Cancel, Save, Save & Share in the DOM. Native form validation, draft persistence and share-link generation are unchanged.

## Comparison History

1. The pre-fix browser measurement showed a 612px gap caused by `.form-actions { margin-top: auto; }`, visually separating the controls from the form.
2. Removing the automatic top margin reduced the gap to 18px at 2048 × 1138 and 1440 × 900, resolving the P2 hierarchy issue.
3. Responsive verification found no follow-up P0/P1/P2 issue: 390px keeps one action row, 320px uses the specified two-row layout, and all four tested viewports have 0px page-level horizontal overflow.

## Primary Interactions Tested

- Cancel returns to the onboarding list.
- Save persists and restores the draft.
- Save & Share validates required fields and generates the merchant link.
- Nuvei and Elavon public-page routing/prefill regression coverage remains green.
- Browser console errors: none.
- Playwright suite: 7 tests passed.

final result: passed

---

# Create Onboarding Application Layout Refinement QA

## Evidence

- Source visual truth: the current-task annotated screenshot at 2048 × 1138 px, with red outlines around the guidance banner and Internal Commercial Terms module plus the written instruction to remove subtitles and redistribute the three bottom actions.
- Implementation: `38.Merchant_onboard.html#new-onboarding`.
- Desktop implementation: `assets/qa/38-onboarding-create-refined-2048x1138.jpg`, 2048 × 1138 image px from a matching 2048 × 1138 CSS-pixel viewport at device scale factor 1.
- Additional desktop check: `assets/qa/38-onboarding-create-refined-2048x910.jpg`, 2048 × 910 image px from the screenshot-1 viewport used in the preceding onboarding QA pass.
- Mobile implementation: `assets/qa/38-onboarding-create-refined-390x844.jpg` and `assets/qa/38-onboarding-create-refined-mobile-actions-390x844.jpg`, each 390 × 844 image px from a 390 × 844 CSS-pixel viewport at device scale factor 1.
- State: blank Create Onboarding Application form with Merchant & Contact Details, Application Setup and the three bottom actions visible.
- Full-view comparison evidence: the annotated source screenshot and the 2048 × 1138 implementation capture were reviewed together at matching dimensions. The two red-boxed modules are absent and the remaining content preserves the reference portal frame.
- Focused comparison evidence: section headers, subtitle removal, four-column and three-column desktop input grids, the bottom action bar, and the 390 px single-column form/action layout were inspected at full resolution. Browser measurements show the mobile action bar from x=25 to x=365, Cancel at x=25, Save at x=131, and Save & Share ending at x=365.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the existing Poppins hierarchy, weights and antialiasing remain unchanged. Removing the small gray subtitles leaves clean, vertically centered section headings without awkward gaps.
- Spacing and layout rhythm: the two remaining sections now stack at full width. Merchant details retain four aligned desktop fields, and setup uses three equally spaced selects. Cancel anchors the left edge while Save and Save & Share form a right-aligned primary action group; the mobile view retains the same hierarchy without wrapping or clipping.
- Colors and visual tokens: no unnecessary color changes were introduced; neutral cards, charcoal section numbers, green Save and blue Save & Share continue to match PAYwizard.
- Image quality and asset fidelity: the existing PAYwizard logo and repository/Material Symbols icons are unchanged and remain sharp. No new image asset or code-drawn replacement was introduced.
- Copy and content: the guidance banner, template pills, Internal Commercial Terms, Cost Rate and Fee cap are removed. Section helper subtitles are also removed. Required merchant, contact and application-setup fields remain intact.
- Interaction and accessibility: Save, Save & Share and Cancel preserve their existing behavior and accessible button names. Draft restore and channel-specific link generation continue to work after removing the internal-only inputs.

## Comparison History

1. The annotated source identified two major unwanted regions: the channel guidance banner and Internal Commercial Terms. Both regions and their associated unused data fields/styles were removed; the revised desktop capture shows only the two requested form sections.
2. The source showed all three actions clustered at the center, a P2 hierarchy issue for the requested revision. The action bar now uses `space-between`: Cancel is isolated on the left, while Save and Save & Share are grouped on the right. The 2048 × 1138 and 390 × 844 captures confirm the distribution.
3. The mobile comparison found no follow-up P0/P1/P2 issue: the form is one column, all three actions remain on one line, and page-level horizontal overflow is 0 px.

## Primary Interactions Tested

- Cancel returns to the onboarding list.
- Save persists and restores all remaining creator fields.
- Save & Share validates required fields and generates the channel-specific merchant link.
- Nuvei/Elavon public-page routing and prefill regression tests remain green.
- Browser console errors: none.
- Playwright suite: 7 tests passed.

final result: passed

---

# Create Onboarding Application and Merchant Share Pages Design QA

## Evidence

- Source visual truth: the current-task 2048 × 910 PAYwizard Merchant Registration screenshot for portal chrome, spacing, typography and controls; the existing `27.Merchant_onboard_nuvei.html` and `27.Merchant_onboard_elavon.html` channel forms for application content and visual language.
- Implementation: `38.Merchant_onboard.html`, `38.Merchant_onboard_nuvei_public.html`, `38.Merchant_onboard_elavon_public.html`, `styles/merchant-public-application.css`, and `scripts/merchant-public-application.js`.
- Platform creator: `assets/qa/38-onboarding-create-2048x910.jpg`, 2048 × 910 image px from a 2048 × 910 CSS-pixel viewport at device scale factor 1.
- Save-and-share state: `assets/qa/38-onboarding-share-modal-2048x910.jpg`, 2048 × 910 image px at the same viewport and density.
- Nuvei merchant page: `assets/qa/38-onboarding-nuvei-public-1440x900.jpg`, 1440 × 900 image px from a 1440 × 900 CSS-pixel viewport at device scale factor 1.
- Elavon merchant page: `assets/qa/38-onboarding-elavon-public-1440x900.jpg`, 1440 × 900 image px at the same viewport and density.
- Mobile evidence: `assets/qa/38-onboarding-create-390x844.jpg` and `assets/qa/38-onboarding-nuvei-public-390x844.jpg`, each 390 × 844 image px from a 390 × 844 CSS-pixel viewport at device scale factor 1.
- State: blank platform creator, filled Nuvei share-link modal, and prefilled no-login merchant forms for `Northstar Coffee`.
- Full-view comparison evidence: the source portal screenshot and the creator capture were reviewed together at 2048 × 910. The public captures were reviewed against the rendered channel forms they embed, with the source platform sidebar/topbar intentionally removed from the iframe presentation.
- Focused comparison evidence: creator title/breadcrumb, three information groups, bottom actions, share dialog, merchant welcome/guidance/privacy regions, payment-channel logo treatment, prefilled first application section, desktop/mobile overflow and responsive form columns were checked at full resolution.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Poppins and system fallbacks retain the rounded PAYwizard hierarchy. Page headings, section titles, helper copy, floating labels, modal content and merchant guidance have distinct, readable weights and do not wrap into controls.
- Spacing and layout rhythm: portal chrome retains the reference sidebar/topbar/content proportions. The redesigned creator uses a full-width contact row followed by application setup and internal terms, removing the sparse left-panel height from the first iteration. Merchant pages use a centered 1240 px shell and collapse cleanly at 390 px; page-level horizontal overflow is 0 px.
- Colors and visual tokens: white and light-neutral surfaces, charcoal navigation/number tokens, blue sharing actions, green save/security states and red required accents are consistent with the current PAYwizard pages.
- Image quality and asset fidelity: existing PAYwizard, Nuvei and Elavon logo assets are reused at native aspect ratios. Existing repository icons and Material Symbols are used; no visible logo or icon is recreated with inline SVG, CSS drawing, emoji or placeholder artwork.
- Copy and content: the portal title is `Create Onboarding Application`; Assign/New Merchant and the Application Information side rail are absent. The creator explains the generated no-login form, clearly separates merchant-visible prefill data from internal commercial terms, and offers `Save` plus `Save & Share`. Public pages add no-login, save-progress, document, privacy and support guidance without exposing platform navigation.
- Interaction and accessibility: native labels, required validation, channel selection, draft restore, link copy/open, hash routing and responsive controls are keyboard-addressable. Nuvei and Elavon links prefill the supported merchant fields, and internal rates are excluded from the URL.

## Comparison History

1. The first creator comparison found a P2 layout issue: Merchant & Contact Details spanned two grid rows, creating a large empty lower-left area and weakening the information hierarchy. It was changed to a full-width four-column row with Application Setup and Internal Commercial Terms aligned below. The revised 2048 × 910 capture shows balanced density and clear reading order.
2. The first 390 px creator capture found a P2 responsive issue: a more specific desktop selector kept merchant contact fields in two columns. A scoped mobile override now produces a single 310 px column; the revised mobile capture has no clipping or horizontal overflow.
3. The merchant-page pass verified both channel wrappers at 1440 × 900 and Nuvei at 390 × 844. Platform chrome is hidden, the branded no-login guidance remains above the form, channel logos are sharp, prefilled fields are visible, and no further P0/P1/P2 correction is required.

## Primary Interactions Tested

- List filtering/reset and opening the creator through `#new-onboarding`.
- Save and restore with `paywizard-merchant-onboarding-draft`.
- Required validation, `Save & Share`, generated application persistence and `Awaiting Merchant` list state.
- Copy/open link dialog and channel-specific routing to the Nuvei or Elavon public page.
- Nuvei/Elavon no-login presentation, portal-chrome removal and supported field prefill.
- 1440 px and 390 px responsive layouts with no page-level horizontal overflow.
- Browser console errors: none across creator, Nuvei and Elavon pages.
- Playwright suite: 7 tests passed.

## Follow-up Polish

- P3: generated prototype links use the current page origin. After these files are hosted, the same flow automatically produces externally reachable URLs; local `127.0.0.1` links are intentionally limited to local QA.

final result: passed

---

# Merchant Onboarding List and Registration Design QA

## Evidence

- Source visual truth: current-task attachment screenshot 1 (Onboarding list) and screenshot 2 (Merchant Registration), each 2048 × 910 px.
- Implementation: `38.Merchant_onboard.html`.
- Desktop list capture: `assets/qa/qa-merchant-onboarding-list.jpg`, 2048 × 910 px from a 2048 × 910 CSS-pixel viewport at device scale factor 1.
- Desktop registration capture: `assets/qa/qa-merchant-onboarding-registration.jpg`, 2048 × 910 px from the same viewport and density.
- Mobile list capture: `assets/qa/qa-merchant-onboarding-mobile-list.jpg`, 390 × 844 px from a 390 × 844 CSS-pixel viewport.
- Mobile registration capture: `assets/qa/qa-merchant-onboarding-mobile-registration.jpg`, 390 × 969 px full-page output from a 390 × 844 CSS-pixel viewport.
- State: list with the ten reference-aligned mock records and blank Merchant Registration form with New Merchant disabled.
- Full-view comparison evidence: both user-provided source attachments and the two desktop browser captures were reviewed together in the current visual QA pass at matching 2048 × 910 dimensions.
- Focused comparison evidence: sidebar navigation density and scroll position, list filters/table/status chips/pagination, registration fieldset bounds, three-column field alignment, section rail, and footer actions were checked at full resolution. The browser-measured final registration bounds are Assign/New Merchant `201.75–303.75px`, Application Information `340.75–622.30px`, and footer actions `834–881px`.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Poppins with system fallbacks matches the source's rounded portal typography; heading, breadcrumb, table, label, badge, and button weights preserve the visible hierarchy and wrapping.
- Spacing and layout rhythm: the 264 px sidebar, 16 px outer frame, 70 px top bar, 16 px workspace gap, compact table rows, fieldset positions, and bottom-centered actions align with the reference. Desktop and mobile page-level horizontal overflow are both 0 px; the mobile table scrolls inside its own container.
- Colors and visual tokens: neutral page/card surfaces, charcoal active navigation and table header, blue review/submit actions, green approval/save states, and red required/notification accents match the screenshots.
- Image quality and assets: the existing repository Paywizard raster logo is reused and remains sharp. Icons come from Material Symbols plus the repository chevron asset; no custom inline or handcrafted SVG artwork was introduced.
- Copy and content: visible navigation, filters, table columns and records, statuses, breadcrumbs, form legends, ten requested fields, and Cancel/Save/Submit actions match the supplied screens.
- Interaction and accessibility: filters/reset, hash-based view switching, New Merchant control swapping, draft persistence, required validation, submission-to-list, sidebar disclosure controls, labels, status feedback, and responsive stacking all work with keyboard-addressable native controls.

## Comparison History

1. First desktop pass found a P2 sidebar-density mismatch: lower navigation groups sat too high and Prepaid Cards was fully visible instead of reaching the bottom edge. Menu and submenu row heights/margins were adjusted; the final list and registration captures now match the source navigation rhythm.
2. The first registration pass found a P2 vertical-position mismatch in both fieldsets and the footer actions. Header spacing, assignment/application dimensions, application padding, and action offset were refined. Post-fix browser measurements align the major bounds with screenshot 2 and keep desktop overflow at 0 px.
3. Mobile captures confirmed the sidebar hides cleanly, the form becomes one column, action buttons remain reachable, table overflow stays contained, and no corrective P0/P1/P2 issue remains.

## Primary Interactions Tested

- Merchant Name, Process ID, and Status filtering plus one-click reset.
- New Onboarding opens `#new-onboarding`; Cancel and browser hash navigation return to the list.
- New Merchant toggles between the existing-merchant selector and free-text merchant name.
- Save persists and restores a draft through `paywizard-merchant-onboarding-draft`.
- Submit blocks incomplete data, accepts required data, adds a Merchant Submit row, and returns to the list.
- Browser console errors/warnings: none on desktop or mobile.
- Playwright suite: 5 tests passed.

## Follow-up Polish

- P3: the source uses a visually near-identical proprietary portal font; Poppins plus system fallbacks is retained to keep the standalone page dependable.

final result: passed

---

# Elavon Upload Requirements Follow-up Design QA

## Evidence

- Source visual truth: the three user-provided close-up screenshots in the current request, supported by `tmp/pdfs/elavon-jotform/high-2.png` at 2040 x 2640 px.
- Implementation: `27.INTL_PSP_merchant_lead_elavon_simplified.html`.
- Desktop browser screenshot: `/tmp/elavon-onboarding-qa/implementation-upload-requirements-final.png` at 1710 x 952 px from a 1710 x 952 CSS-pixel viewport, device scale factor 1.
- Mobile screenshot: `/tmp/elavon-onboarding-qa/implementation-mobile.png` at 390 x 5303 px from a 390 x 844 CSS-pixel viewport, device scale factor 1.
- Focused combined comparison: `/tmp/elavon-onboarding-qa/comparison-upload-requirements-final.png` at 2174 x 952 px. The source PDF's signatory/banking region is cropped and normalized to 952 px high beside the browser-rendered implementation.
- State: blank form at the Signatory and Banking Information sections; all three upload controls show their default empty state.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: each upload title is now outside its upload card, the red required marker remains attached to the correct title, and every instruction line follows the source wording and requested breaks.
- Spacing and layout rhythm: the two Signatory uploads are separate vertical blocks in source order, each with its own title, upload surface, and instructions. Bank Transfer Receipt uses the same independent structure. Desktop cards are full width and mobile cards remain within the 390 px viewport.
- Colors and visual tokens: existing Paywizard neutral borders, dashed upload surfaces, magenta interaction states, and semantic required red remain unchanged.
- Image quality and assets: all three controls reuse the repository upload icon; it stays centered and sharp at desktop and mobile sizes.
- Copy and content: passport requirements are no longer combined with second-KYC requirements. Passport, second KYC, and bank receipt each display their own exact explanatory copy, including the requested explicit line breaks.
- Interaction and accessibility: titles are associated with their file inputs, the whole upload surface remains clickable, multiple-file support remains on the two KYC controls, required validation is unchanged, and selected-file feedback still replaces only the upload prompt.

## Comparison History

1. The previous implementation placed both Signatory upload cards in one two-column group and combined their instructions into one shared sentence. The update split them into independent vertical upload fields and restored the source wording and line breaks.
2. The first browser comparison found a P2 alignment issue limited to Bank Transfer Receipt: the existing `.field label` rule overrode the upload card's flex layout, pushing its icon and text out of alignment. A scoped `.field label.upload-card` rule restored the centered vertical layout.
3. The post-fix comparison confirms all three cards use centered column layout, instruction ownership is visually unambiguous, desktop horizontal overflow is 0 px, and the 390 px mobile view has no clipping.

## Verification

- Elavon Playwright suite: 7 tests passed.
- The new focused test verifies each upload requirement belongs to the correct control and preserves the specified line boundaries.
- Desktop browser console errors/warnings: none.
- File-name feedback, required validation, draft exclusion, and complete-form submission continue to pass.

final result: passed

---

# Elavon Onboarding Form Design QA

## Evidence

- Source visual truth: `/Users/beaver/Documents/elavon jotform.pdf` (3-page screenshot PDF).
- Source renders: `tmp/pdfs/elavon-jotform/high-1.png` through `high-3.png`.
- Implementation: `27.INTL_PSP_merchant_lead_elavon_simplified.html`.
- Desktop browser screenshots: `/tmp/elavon-onboarding-qa/implementation-top.png`, `/tmp/elavon-onboarding-qa/implementation-owners.png`, `/tmp/elavon-onboarding-qa/implementation-signatory-banking.png`, and `/tmp/elavon-onboarding-qa/implementation-operation.png` at 1710 x 952 CSS px, device scale factor 1.
- Full desktop screenshots: `/tmp/elavon-onboarding-qa/implementation-desktop-full-blank.png` and `/tmp/elavon-onboarding-qa/implementation-desktop-full.png`; the latter shows two generated additional-owner rows.
- Mobile screenshot: `/tmp/elavon-onboarding-qa/implementation-mobile.png` at 390 x 5148 px from a 390 x 844 CSS-pixel viewport.
- Combined comparisons: `/tmp/elavon-onboarding-qa/comparison-full.png`, `/tmp/elavon-onboarding-qa/comparison-business-owners.png`, and `/tmp/elavon-onboarding-qa/comparison-signatory-operation.png`.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the existing Paywizard hierarchy is retained, while Elavon section titles, labels, optional markers, helper text, and required markers remain readable on desktop and mobile.
- Spacing and layout rhythm: the source fields are organized into six compact Paywizard sections, using a two-column desktop grid and a one-column mobile flow. There is no horizontal overflow at 1440 px or 390 px.
- Colors and visual tokens: neutral cards and inputs, magenta actions/focus treatment, red required markers, and green upload/success feedback remain consistent with the reference Nuvei page.
- Image quality and assets: the repository's vector Elavon logo and existing Paywizard icons render sharply; no source asset was approximated with text or CSS.
- Copy and content: all form elements visible in the three-page Elavon source are represented, including business information, configurable beneficial owners, signatory KYC uploads, banking evidence, vending operation fields, and contact-person information. Nuvei-only address, banking-province, and supporting-document fields are absent.
- Interaction and accessibility: native labels and fieldsets are preserved, required groups validate, connectivity requires at least one option, additional-owner count generates the corresponding required rows, upload cards show selected filenames, invalid fields are revealed and focused, and draft restoration excludes files.

## Primary Interactions Tested

- Additional-owner count creates and removes the exact number of required beneficial-owner rows.
- Ownership and DBA-title dropdowns preserve the confirmed Nuvei enum values used by Elavon.
- Connectivity rejects an empty group and accepts WiFi, Cellular, or Ethernet.
- A complete form submits with only DBA Contact Title, SN Number, and Arrival Time left blank.
- All three required upload controls participate in validation and expose selected-file feedback.
- Save Draft restores standard controls, connectivity, owner count, and dynamic rows while intentionally excluding file inputs.
- Desktop and 390 px mobile layouts have zero horizontal overflow; browser console errors and warnings: none.

## Comparison History

1. Source pages were rendered at high resolution and compared section-by-section against the live browser output.
2. The first complete implementation comparison found no high-severity structural or visual mismatch; focused owner, signatory/banking, and operation captures confirmed field grouping and copy.
3. The final mobile pass confirmed responsive stacking, readable uploads and helper text, correct dynamic-owner expansion, and no clipped controls.

final result: passed

---

# Nuvei Configurable List Nesting Design QA

## Evidence

- Source visual truth: the user-provided annotated screenshot in the current request, showing that `Additional Owner/s or Guarantor *` must belong inside `Configurable list *`.
- Implementation: `27.INTL_PSP_merchant_lead_nuvei_simplified.html`.
- Focused browser screenshot: `/tmp/nuvei-webpage-audit.aHjX2L/implementation-owner-count-inside-configurable-list.png`.
- Viewport and pixels: 1920 x 853 CSS px / 1920 x 853 image px, device scale factor 1.
- State: additional-owner count set to 2 with both generated owner/guarantor rows visible below the nested count control.
- Full-view evidence: the prior desktop/mobile full-page comparisons remain valid and are retained below; this update changes only the DOM grouping and vertical order inside the existing Owners or Officers section.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the two required labels retain the existing Paywizard font, weights, hierarchy, and red required markers.
- Spacing and layout rhythm: `Configurable list *` now leads the group, followed by its explanation, the nested owner-count field, and then the generated rows. The relationship is visually unambiguous and the page has zero horizontal overflow.
- Colors and visual tokens: borders, focus ring, neutral surfaces, and semantic required color are unchanged.
- Image quality and assets: no assets were added or modified.
- Copy and content: the helper now says rows appear below, matching the new order.
- Interaction and accessibility: `.configurable-list #additional-owner-count` exists exactly once; entering 2 generates two rows, while the existing required validation and draft behavior remain intact.

## Verification

- Nuvei Playwright suite: 6 tests passed.
- Browser inspection: nested control present, generated row count 2, horizontal overflow 0 px, console errors/warnings none.
- Focused screenshot confirms the hierarchy against the annotated source screenshot.

final result: passed

---

# Nuvei Follow-up Field Corrections Design QA

## Evidence

- Source visual truth: the four user-provided screenshots in the current request: Bank Province text-entry requirement, SN Number optional state and WizarPOS serial-number prompt, and the populated Configurable list example.
- Implementation: `27.INTL_PSP_merchant_lead_nuvei_simplified.html`.
- Browser-rendered focused screenshots: `/tmp/nuvei-webpage-audit.aHjX2L/implementation-owner-configurable-list-v2.png` and `/tmp/nuvei-webpage-audit.aHjX2L/implementation-bank-sn-v2.png`.
- Viewport and pixel dimensions: 1920 x 853 CSS px / 1920 x 853 image px, device scale factor 1.
- State: additional-owner count set to 2, producing two dynamic required owner/guarantor rows; banking and terminal sections shown in their blank state.
- Comparison evidence: the current-turn source screenshots and both focused implementation captures were reviewed together. The existing full-page source/implementation comparisons remain recorded in the following QA section because this update changes only three focused controls.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: `Configurable list *`, the SN placeholder, and helper copy reuse the existing Paywizard type hierarchy and remain legible without changing surrounding labels.
- Spacing and layout rhythm: the configurable-list heading and explanation form a clear boundary below the owner-count input. Two generated owner cards retain the established two-column desktop grid and produce zero horizontal overflow.
- Colors and visual tokens: required red markers, neutral borders, white inputs, and magenta focus treatment remain consistent with the page.
- Image quality and assets: no image assets were added or altered by this update.
- Copy and content: Bank Province is now a required free-text input; SN Number explicitly prompts for `WizarPOS 16-digit Serial#`; `Configurable list *` is visible and explains that the generated row count follows the additional-owner quantity.
- Interaction and accessibility: entering 2 generates exactly two rows. Each row exposes 14 required controls across guaranty, identity, ownership, date of birth, address, and split telephone fields. Reducing the count removes surplus rows, and draft restoration continues to rebuild and populate the correct quantity.

## Comparison History

1. Initial automated check used an overly literal accessible-name assertion for the heading and failed to find the red-star text as a separate token; the implementation itself was present and visible.
2. The assertion was corrected to check the heading's exact rendered text. The focused visual captures then confirmed the heading, dynamic rows, Bank Province input, and SN prompt in the live page.

## Verification

- Nuvei Playwright suite: 6 tests passed.
- Desktop browser inspection: Bank Province renders as `INPUT`, SN placeholder matches, additional-owner count 2 generates two rows, and horizontal overflow is 0 px.
- Existing responsive test continues to pass at 390 px.

final result: passed

---

# Nuvei Onboarding Form Design QA

## Evidence

- Source visual truth: `/Users/beaver/Documents/nuvei webpage.pdf` (5-page PDF; pages 1-4 contain the form, page 5 contains the submit footer).
- Source render: `/tmp/nuvei-webpage-audit.aHjX2L/page-1.png` through `page-5.png`.
- Implementation: `27.INTL_PSP_merchant_lead_nuvei_simplified.html`.
- Desktop screenshot: `/tmp/nuvei-webpage-audit.aHjX2L/implementation-desktop-final.png`.
- Mobile screenshot: `/tmp/nuvei-webpage-audit.aHjX2L/implementation-mobile-final-v2.png`.
- Desktop viewport: 1440 x 1000 CSS px, device scale factor 1; full-page output 1440 x 3710 px.
- Mobile viewport: 390 x 844 CSS px, device scale factor 1; full-page output 390 x 5460 px.
- Source pages: 1530 x 1980 px each. For the full-view comparison, pages 1-4 were normalized to 720 x 932 px and stacked to 720 x 3728 px; the desktop implementation was scaled to the same 3728 px height.
- Full-view comparison: `/tmp/nuvei-webpage-audit.aHjX2L/comparison-full-overview.png`.
- Focused comparisons: `/tmp/nuvei-webpage-audit.aHjX2L/comparison-owner-bank.png` and `/tmp/nuvei-webpage-audit.aHjX2L/comparison-terminal-docs.png`.
- State: blank onboarding form with browser-restored radio choices in the visual capture. Requiredness and blank optional fields were validated independently in automated tests.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the existing Paywizard Arial-based hierarchy is preserved. Labels, section headings, helper text, and required markers remain readable and consistent at desktop and mobile widths.
- Spacing and layout rhythm: source fields are grouped into six Paywizard sections with a two-column desktop grid and a one-column mobile flow. Field alignment, card padding, section rhythm, and upload areas are consistent; no horizontal overflow remains at 1440 px or 390 px.
- Colors and visual tokens: the existing neutral Paywizard surfaces, borders, dark headings, pink focus/action color, red required markers, and green success state are preserved. Contrast is consistent with the existing page.
- Image quality and assets: existing Paywizard/Nuvei logos and repository icon assets render sharply. No source logo or icon was replaced by CSS, text symbols, or a generated approximation.
- Copy and content: all source sections, labels, options, required markers, owner/guarantor fields, banking fields, terminal fields, and three required uploads are represented. Non-source processing-profile, government-ID, proof-of-business, additional-information, and declaration fields are removed.
- Interaction and accessibility: labels/legends are associated with controls, radio groups use fieldsets, dynamic additional-owner rows are announced, connectivity has group-level validation, and native validation moves users to the invalid section. Native date controls may display the browser locale while retaining the source date labels; this is an acceptable P3 browser behavior.

## Comparison History

1. Initial implementation comparison found a P1 structure error: the connectivity fieldset closed with the wrong tag, causing Supporting Documents to escape the form column. The closing tag was corrected and all six sections were rechecked as children of the same form.
2. The first mobile comparison found a P2 layout issue: the two supporting-document upload cards remained side-by-side at 390 px. The responsive rule now stacks both cards and keeps country-code/phone pairs aligned horizontally.
3. Post-fix desktop and mobile captures show all six sections in the intended Paywizard frame, correct responsive stacking, zero horizontal overflow, and no browser console errors.

## Primary Interactions Tested

- Additional-owner count creates and removes the correct number of fully required owner rows.
- Connectivity requires at least one of WiFi, Cellular, or Ethernet.
- Complete-form validation passes with only Time Zone, DBA Contact Title, SN Number, and Arrival Time blank.
- Three required file inputs participate in validation and display selected filenames.
- Save Draft restores new text fields, checkbox selections, owner count, and dynamic-owner values while correctly excluding file attachments.
- Section navigation, desktop layout, and 390 px mobile layout were checked; browser console errors: none.

## Follow-up Polish

- P3: native date controls use the operating-system locale instead of visually forcing `MM-DD-YYYY`; retain native controls unless a fixed display format becomes a product requirement.

final result: passed

---

# Save as Template Switch Alignment QA

## Evidence

- Source visual truth: user feedback screenshot and browser capture of the deployed pre-fix state at `assets/qa/qa-product-map-template-switch-before.png`.
- Implementation screenshot: `assets/qa/qa-product-map-template-switch-centered.png`.
- Full-view comparison: `assets/qa/qa-product-map-template-switch-alignment-comparison.png`.
- Viewport and pixel dimensions: 1710 × 879 CSS px / 1710 × 879 image px, device scale factor 1.
- State: Product Map → Map → Save as Template, product information switch off.
- Focused evidence: measured the option row and switch bounding boxes because the visible issue is a precise single-component alignment defect.

## Findings

- No remaining P0, P1, or P2 findings.
- **Spacing and layout:** Before the fix, the shared stylesheet added an inherited `margin-bottom: 8px` to the switch label, placing its center 4px above the option-row center. The scoped override removes that margin; the measured center offset is now exactly 0px.
- **Typography:** Label typeface, weight, size, and line height are unchanged.
- **Colors and tokens:** Switch track, thumb, border, and option-row colors are unchanged.
- **Image quality:** Not applicable; this control uses existing UI styling and no image assets.
- **Copy and content:** `Include product information` and its accessible label are unchanged.
- **Interaction:** Default state remains off, and the switch remains operable.

## Verification

- Focused Playwright test passed, including default-off behavior, `margin-bottom: 0px`, and center-offset tolerance below 0.5px.
- Browser measurement: pre-fix center offset `-4px`; post-fix center offset `0px`.
- Browser console warnings/errors: none.

## Comparison history

1. P2: the switch was visibly high because the global `label` rule contributed an 8px bottom margin.
2. Fix: added a scoped zero-margin rule for the Save as Template option switch only.
3. Post-fix evidence: centered screenshot and exact bounding-box measurement confirm equal vertical centering without changing other switches.

## Result

final result: passed

---

# Nuvei Dropdown Reference Update QA

## Evidence

- Source visual truth: the four user-provided screenshots in the current request: Type of Ownership open state (658 x 640 px), Simplified onboarding badge (344 x 120 px), Time Zone open state (666 x 602 px), and DBA Contact Title open state (662 x 1002 px).
- Browser-rendered implementation screenshot: `assets/qa/qa-nuvei-dropdown-updates.png` at 1920 x 1080 CSS px / 1920 x 1080 image px, device scale factor 1.
- Focused control screenshot: `assets/qa/qa-nuvei-ownership-dropdown.png` at 1920 x 1080 CSS px / 1920 x 1080 image px, device scale factor 1.
- State: empty Nuvei application at the top of the page, with the Type of Ownership control focused in the focused capture.
- Density normalization: none required for the browser captures. The source screenshots are component close-ups, so comparison was made at the control and copy level rather than treating their crops as full-page layout references.

## Findings

- No remaining P0, P1, or P2 findings.
- **Copy and content:** Type of Ownership now contains the eight screenshot values in the same order. Time Zone contains the seven screenshot values in the same order. DBA Contact Title contains the thirteen screenshot values in the same order. All three placeholders now read `Please Select`.
- **Spacing and layout rhythm:** Removing the badge leaves the heading aligned to the left without an empty visual artifact or changed form width. The select controls retain the existing compact Paywizard spacing and dimensions.
- **Fonts and typography:** No typography tokens changed. The updated labels and option strings use the same Arial/Helvetica stack, control size, weight, and line-height as the rest of the form. Long time-zone text remains available through the native select without changing page layout.
- **Colors and visual tokens:** The magenta badge and its dot were completely removed. Focus treatment on the selects remains the existing Nuvei magenta focus ring.
- **Image quality and asset fidelity:** No image assets were added, replaced, or altered in this scoped update. Existing Paywizard and Nuvei assets remain sharp and unchanged.
- **Accessibility and behavior:** All three fields remain native required selects with associated labels and keyboard operation. Browser inspection found zero `.page-status` elements and the console contained no errors.

## Focused comparison evidence

- Native select popups are browser-owned UI and are not included in the page screenshot. Their exact visible option text and order were therefore verified from the live browser DOM after rendering, while the focused screenshot verifies control placement, focus styling, placeholder copy, and the removed badge state.
- Rendered Type of Ownership sequence: Please Select; Sole Proprietorship; Partnership; Publicly Traded; Not for Profit; Limited Liability; Privately Held; Government; International Organization.
- Rendered Time Zone sequence: Please Select; Atlantic Time Zone; Canada Central Time Zone (Saskatchewan); Central Time Zone; Eastern Time Zone; Mountain Time Zone; Newfoundland Time Zone; Pacific Time Zone.
- Rendered DBA Contact Title sequence: Please Select; Owner; Co owner; President; Legal contact; Secretary/Treasurer; Partner; General Manager; Administrator; Vice President; Director; CEO; Corporate Office Title; Principal.

## Comparison history

1. P2 source mismatch: the initial implementation used generic ownership, time-zone, and contact-title enumerations and displayed an extra Simplified onboarding badge.
2. Fix: replaced all three option sets from the supplied screenshots, matched their order and capitalization, normalized each placeholder to `Please Select`, and removed the badge markup and CSS.
3. Post-fix browser evidence: exact option arrays match the supplied screenshots, `.page-status` count is zero, the page layout remains stable, and there are no console errors.

## Result

final result: passed

---

# Simplified Nuvei Merchant Registration QA

## Evidence

- Source visual truth: `/Users/beaver/Documents/nuvei.pdf` for the Paywizard application shell and `/Users/beaver/Documents/nuvei jotform.pdf` for the simplified content structure.
- Browser-rendered implementation screenshot: `assets/qa/qa-nuvei-simplified-desktop-viewport.png`.
- Full-page implementation evidence: `assets/qa/qa-nuvei-simplified-desktop.png`.
- Full-view side-by-side comparison: `assets/qa/qa-nuvei-simplified-comparison.png`.
- Responsive evidence: `assets/qa/qa-nuvei-simplified-mobile.png`.
- Desktop viewport: 1920 x 1080 CSS px; implementation image 1920 x 1080 px; device scale factor 1.
- Source dimensions: 3840 x 5048 px per full reference capture; normalized to a top-aligned 16:9 crop in the side-by-side comparison so browser chrome, crop, and density do not create false findings.
- Mobile viewport: 390 x 844 CSS px; implementation image 390 x 844 px; device scale factor 1.
- State: empty Nuvei merchant application, Legal Business Information at the top; mobile state at the same top-of-page position.

## Findings

- No remaining P0, P1, or P2 findings.
- **Fonts and typography:** Arial/Helvetica closely matches the compact neutral sans-serif used in the source. The title, section labels, field labels, helper copy, and right-rail hierarchy remain readable at the source-like density with no clipping or unexpected wrapping on desktop. Mobile labels wrap cleanly where needed.
- **Spacing and layout rhythm:** The fixed left navigation, sticky top bar, two-column form layout, narrow right application rail, 14px section rhythm, compact field heights, border radii, and low-elevation surfaces preserve the source Paywizard structure. The simplified grouping intentionally reduces the original 27-section page to seven sections. At 390px the sidebar and right rail are removed, fields collapse to one column, and measured document width equals viewport width with no horizontal overflow.
- **Colors and visual tokens:** The implementation retains the source neutral gray shell and black active navigation treatment. Nuvei magenta is limited to focus, status, active-section, and primary-action states so it reads as channel branding without changing the Paywizard visual system. Text/background contrast remains strong.
- **Image quality and asset fidelity:** The supplied Nuvei organization logo is used directly. The Paywizard brand was extracted from the source capture as a real raster asset rather than redrawn in CSS. Existing project icon assets are used for navigation and actions; no custom inline SVG, CSS illustration, emoji, or placeholder image substitutes are present.
- **Copy and content:** Legal, DBA, owner, banking, document, declaration, and known processing-profile labels follow the Jotform reference and supplied comparison notes. Platform-only pricing, contract, equipment, fulfillment, payment-channel, cost-rate, fee-cap, and configuration fields are intentionally absent.
- **Interactions:** Risk-program and previous-processor conditional fields show and hide correctly; mailing-address conditional logic is present; additional beneficial owners can be added and removed; Save Draft provides a visible confirmation; file cards expose selected-file states; submit blocks on invalid required fields and focuses the first invalid control.
- **Accessibility:** Form controls use associated labels, native required validation, visible focus rings, semantic buttons, descriptive image alt text, and keyboard-operable native controls. Dynamic messages use a status live region.

## Focused evidence

- No additional crop was required because the 1920 x 1080 desktop screenshot keeps the header, navigation, Legal section, DBA section, right application rail, typography, icons, and input geometry readable at native density.
- The full-page screenshot was reviewed separately for owner, banking, document-upload, declaration, and action-bar regions.
- The 390 x 844 screenshot was inspected for header wrapping, single-column control width, mobile spacing, logo treatment, and overflow.

## Primary interaction and browser verification

- Conditional risk field: hidden -> visible on Yes -> hidden on No.
- Previous processor field: hidden -> visible on Yes.
- Beneficial owners: 1 -> 2 through Add Additional Beneficial Owner -> 1 through Remove Owner.
- Save Draft confirmation: visible.
- Invalid submit: blocked with 55 unresolved required controls and focus moved to `#ownership-type`.
- Desktop browser console errors: none.
- Mobile browser console errors: none.

## Comparison history

1. Initial post-build side-by-side pass found no actionable P0/P1/P2 mismatch. The implementation preserves the Paywizard shell while applying the intentional Jotform-driven content reduction.
2. Responsive pass confirmed a 340px form column inside the 390px viewport, hidden desktop navigation/rail, and document scroll width equal to 390px. No responsive fix was required.
3. Interaction pass confirmed conditional fields, repeatable owners, draft feedback, and native validation without console errors. No interaction fix was required.

## Follow-up polish

- P3: Exact wording for any lower-page underwriting question that remains unreadable in the compressed Jotform PDF can be replaced if a higher-resolution source becomes available; this does not block the current structure or form behavior.

## Result

final result: passed
