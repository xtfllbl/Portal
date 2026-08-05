# Development Notes

- Current project UI development is based on PrimeVue: https://primevue.dev/

---

# Design QA

- Source visual truth path: user-provided inline screenshots 2 and 3 in the current conversation.
- Implementation screenshots:
  - `/tmp/paywizard-tsys.png`
  - `/tmp/paywizard-fiserv.png`
  - `/tmp/paywizard-tsys-tip.png`
  - `/tmp/paywizard-fiserv-tip.png`
  - `/tmp/paywizard-elavon.png`
  - `/tmp/paywizard-elavon-tooltip-error.png`
  - `/tmp/paywizard-oxpay.png`
- Viewport: 1920 × 1400 desktop.
- States: all six processor selections; focused captures for TSYS, FISERV, ELAVON, and OXPAY parameter groups.

**Full-view comparison evidence**

- The processor parameter area retains the existing Add Device page shell while matching the supplied three-column, underline-input layout.
- Every XML fieldset is represented as a tab in source order.
- Processor badges, template selector, tab treatment, field density, and default values remain visually aligned with the supplied references.

**Focused region comparison evidence**

- TSYS Tip & Taxes uses the supplied Enable/Disable segmented-control treatment and three-column field arrangement.
- FISERV Tip & Taxes uses the same control language and displays its XML default `010015020`.
- Field rows stay clean without XML comment or validation metadata beneath the controls.

**Required fidelity surfaces**

- Fonts and typography: existing prototype type stack and hierarchy preserved; tab, label, value, and helper levels are distinct.
- Spacing and layout rhythm: three-column desktop grid, horizontal tab rail, underline controls, and responsive two/one-column fallbacks verified.
- Colors and visual tokens: existing neutral palette preserved; selected segmented states use the reference black treatment.
- Image quality and asset fidelity: no image assets are required in the changed parameter area.
- Copy and content: fieldset names, labels, defaults, and options match the supplied XML files; comment and validation metadata are not displayed.

**Findings**

- No actionable P0, P1, or P2 visual or interaction mismatches remain.

**Patches made**

- Replaced hand-authored processor fields with XML-derived schemas.
- Added all TSYS, FISERV, ELAVON, NUVEI ATTD, NUVEI UPT, and OXPAY fieldsets, fields, defaults, select options, and validation metadata.
- Added a repeatable XML-to-JavaScript generator for processor parameter data.
- Kept required markers while removing XML comments and all visible validation metadata.
- Added segmented Enable/Disable controls and processor-aware app versions.
- Removed unsupported Worldpay selection from this XML-backed prototype.

**Verification**

- XML schema equality: passed.
- TSYS: 8 fieldsets and 80 fields.
- FISERV: 9 fieldsets and 85 fields.
- ELAVON: 9 fieldsets and 76 fields.
- NUVEI ATTD: 8 fieldsets and 38 fields.
- NUVEI UPT: 8 fieldsets and 57 fields.
- OXPAY: 4 fieldsets and 18 fields.
- TSYS MCC options: 294.
- State options: 51.
- Processor/version switching, tab switching, and segmented-control value changes: passed.
- ELAVON System ID tooltip, Terminal ID tooltip, suffix extraction, automatic zero-padding, error states, and recovery after correction: passed.

final result: passed

---

# Design QA — DEX Compact History and Settings Layout

- Source visual truth: the user-provided Nayax DEX screenshots and the approved compact flow, supported by the Nayax DEX Administration reference at `https://nayax-u.nayax.com/scenario/overview-of-dex-administration-operations-906`.
- Implementation target: `1.terminalmanage_nayax.html?tab=dex&sn=WP6267UQ36002376`.
- Implementation screenshot: `/tmp/paywizard-dex-compact.png`.
- State: seeded DEX history with the latest parsed read selected; DEX Settings verified separately in Fixed Times mode and at 390 × 844.

## Full-view and focused comparison

- The DEX tab now begins with one left-aligned command row, followed by a single inline automation summary and the history table.
- The former Machine Audit heading, Snapshot explanation, persistent success banner, five metadata cards, and six KPI cards are absent.
- Parsed Data / RAW DATA follows the history table directly, matching the requested read-history-first inspection flow.
- Fixed Times uses a constrained `time input + 36px delete icon` grid; the input and delete control stay within the modal body without overlap.

## Required fidelity surfaces and verification

- Fonts and typography: existing Paywizard control and table typography is retained; redundant Snapshot headings and card labels are removed: passed.
- Spacing and layout rhythm: command row, inline summary, history, and file view form one compact vertical sequence: passed.
- Colors and visual tokens: existing neutral borders, blue selection state, and status colors are unchanged: passed.
- Image quality and assets: the time removal action uses the existing local delete SVG asset at 16px: passed.
- Copy and content: success feedback is delivered by toast; Queued, Reading, Warning, Failed, and No Data remain eligible for the inline status region: passed.
- Interaction and accessibility: history selection, Parsed/RAW tabs, settings tabs, Escape focus restoration, and responsive modal controls remain available: passed.
- Fixed-time control geometry: delete button begins at least 6px after the time input and remains inside the scroll body: passed.
- Mobile modal geometry at 390 × 844: no document overflow and modal bounds remain within the viewport: passed.
- DEX-focused Playwright tests: 3 passed.
- Browser visual inspection: compact command row and history-first layout passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — DEX Automation, Notifications, and Read History

- Source visual truth: the user-approved DEX implementation plan, [Nayax DEX Administration](https://nayax-u.nayax.com/scenario/overview-of-dex-administration-operations-906), and [Nayax DEX/DDCMP attributes](https://nayax-u.nayax.com/article/overview-understanding-machine-attributes-nayax-core-78296#dex).
- Implementation target: `1.terminalmanage_nayax.html?tab=dex&sn=WP6267UQ36002376`.
- Implementation screenshots: `/tmp/paywizard-dex-history.png` and `/tmp/paywizard-dex-settings.png`.
- Viewport: desktop Paywizard portal viewport at device scale factor 1; mobile behavior separately verified at 390 × 844.
- States: latest read history selected, manual Delta read completed with email status, and the three-tab DEX Settings dialog.

## Full-view and focused comparison

- The Nayax source and implementation were inspected together in one comparison pass. The implementation preserves the current Paywizard black terminal header, white cards, compact controls, and blue selection state while adopting Nayax's schedule, Full/Delta, retry, notify, history, parsed, and RAW-data concepts.
- The main page reads in the intended order: read actions, automation summary, read history, then the selected snapshot detail. This removes the previous need to scroll past snapshot content before choosing a historical read.
- The settings dialog remains compact and uses the existing modal button hierarchy; technical controls are separated into Read Schedule, Parsing & Rules, and Email Notifications rather than exposed in one dense form.

## Required fidelity surfaces and verification

- Fonts and typography: existing Paywizard sizes, weights, uppercase table headers, and button typography are retained: passed.
- Spacing and layout rhythm: automation summary, history table, and modal grids align with existing card gutters; the dialog remains inside a 390px viewport: passed.
- Colors and visual tokens: existing neutral cards, blue selected rows/tabs, green success, yellow warning, and red failure states are reused consistently: passed.
- Image quality and assets: no new image assets were required; existing portal assets remain unchanged: passed.
- Copy and content: English labels distinguish Manual/Scheduled, Delta/Full, validation, email delivery, retry, scaling, and RAW attachment behavior: passed.
- Interaction and accessibility: history selection, settings tabs, Escape/focus restoration, manual status flow, RAW switching, and session persistence are covered by Playwright: passed.
- Browser console errors and warnings during final inspection: 0.
- Focused DEX Playwright coverage: 3 passed.
- Full regression suite: 25 passed.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Nayax Terminal Type Details Card

- Source visual truth: the production Terminal Details header, dashboard alignment, and terminal-type states supplied in the current conversation, plus the picker definitions in `12.transaction_list.html`.
- Implementation target: `1.terminalmanage_nayax.html`.
- Inspection surface: live local page in the in-app browser at the existing desktop Paywizard portal viewport.
- States reviewed: expanded and collapsed navigation, compact default `Unattended · Vending Machine` card, production-style Terminal Details, and the independent six-option edit dialog.

## Full-view and focused comparison

- The previously added terminal title and type control remain absent from the black header; the production-style `Back to Device Management` link is added without disturbing online status, terminal metadata, tabs, or synchronization time.
- The unused Group List panel is replaced by a Terminal Type card beneath Terminal Details, keeping this management function in the information area rather than global navigation.
- The visible bottom of the Terminal Type card aligns with the bottom of the left statistics cards in both expanded and collapsed navigation states; opening the editor does not resize either column.
- Terminal Details now follows the production reference: gray title strip, centered terminal image, and four compact rows for SN, Terminal Name, Model, and Version. The obsolete PN, Type, placeholder image, and View Detail action were removed.
- The right stack now relies on Grid stretching rather than a percentage height, preventing the extra gap seen with the collapsed sidebar; Terminal Details uses bounded rows and wraps long values so its image and content remain inside the panel.
- Attended and Unattended options use the exact six SVG path definitions from Transactions with the same blue/green semantic split.
- Terminal Type now uses the same neutral gray border, white shell, gray title strip, typography, and compact header height as Terminal Details. Only the inner current-type panel is semantic: Unattended uses a restrained green surface and Attended uses blue, both with a uniform one-pixel border and no decorative accent rail.
- The edit dialog uses Flex rows with a non-shrinking 36px icon column and a fixed 12px gap before the label. Browser geometry checks across all six rows report no icon/label overlap.

## Required fidelity surfaces and verification

- Fonts and typography: card title, attendance badge, type name, group labels, and option labels follow the existing Basic Information scale: passed.
- Spacing and layout rhythm: the visible Terminal Type bottom matches the left statistics bottom in both sidebar states with no forced-height overflow; the fixed dialog preserves dashboard geometry: passed.
- Colors and visual tokens: the outer card matches Terminal Details exactly; attended blue, unattended green, and current-selection blue remain confined to semantic content: passed.
- Image quality and assets: the six local icon assets reproduce the exact Transactions SVG geometry; the local terminal rendering follows the supplied production device reference; dedicated edit and back assets remain sharp at 16–17px: passed.
- Copy and content: all six Transactions terminal types and both scenario groups are represented exactly: passed.
- Interaction and accessibility: dialog open/cancel/backdrop close, direct selection, Escape, arrow keys, Enter, focus trapping/restoration, session persistence, URL initialization, and ARIA states: passed.
- Mobile layout: at 390px the Dashboard changes to one column, reports no document-level horizontal overflow, and keeps the dialog in the viewport: passed.
- Browser page errors during final inspection: 0.
- `git diff --check`: passed.

## Findings

- The header adds only the requested return action; no unsupported terminal title hierarchy was introduced.
- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Product Map Toolbar Identification

- Source visual truth: Nayax toolbar crop already preserved in `assets/qa/qa-product-map-stock-comparison.png` and the approved hybrid-style plan.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Browser-rendered evidence:
  - `assets/qa/qa-product-map-toolbar-map-open.png` (1695 × 869px)
  - `assets/qa/qa-product-map-toolbar-stock-open.png` (1695 × 869px)
- Combined focused comparison: `assets/qa/qa-product-map-toolbar-identification-comparison.png` (1826 × 620px).
- State: saved eight-BIN Product Map with Map open; Stock open captured separately.

## Findings

- No actionable P0, P1, or P2 visual, interaction, or accessibility findings remain.

## Full-view and focused comparison

![Nayax command toolbar compared with the Paywizard hybrid implementation](assets/qa/qa-product-map-toolbar-identification-comparison.png)

- Map and Stock now read as distinct commands through 18px functional icons, stronger expanded treatment, and consistent 14px chevrons.
- The Map menu uses a single divider between setup and template actions, with no redundant section labels; Stock uses green Fill and red Empty semantics without changing the text hierarchy.
- The implementation preserves Paywizard's white surface, neutral border, blue focus/expanded state, and compact table density while closing the affordance gap with Nayax.

## Comparison history

- First implementation pass rendered the nominal 220px menu at 236px because padding and borders were added outside the content box.
- Fix: applied border-box sizing to the menu panel; the final browser measurement is exactly 220px.
- Post-fix evidence: the final Map and Stock captures show aligned triggers, a lighter shadow, non-wrapping labels, and no table clipping.

## Required fidelity surfaces and verification

- Fonts and typography: 13px command labels, 12px menu actions, and existing project font stack: passed.
- Spacing and layout rhythm: 38px commands/items, 9px trigger radius, 220px menu width, 8–10px internal gaps, and left-aligned popovers: passed.
- Colors and visual tokens: neutral default/hover states, blue expanded/focus state, and restrained semantic Stock colors: passed.
- Image quality and assets: local Apache-licensed Material SVG assets render sharply at 16–18px; no glyph or placeholder fallbacks: passed.
- Copy and content: Add BIN, Add Multiple BINS, Save as Template, Import Template, Fill Machine 100%, and Empty Machine: passed. The confirmation action remains the concise `Empty`.
- Interaction and accessibility: mutual exclusion, Arrow navigation, Escape focus restoration, `aria-expanded`, and decorative icon treatment: passed.
- Regression: Add BIN, Add Multiple BINS, Save as Template, and Import Template entry points open successfully and cancel cleanly: passed.
- Responsive behavior: the 390 × 844 regression pass confirms Map and Stock remain in a non-wrapping horizontal row, the 220px menu stays inside the viewport, and table overflow remains local: passed.
- Playwright regression suite: 13 passed.
- Browser console errors during the final interaction pass: 0.
- `git diff --check`: passed.

final result: passed

---

# Design QA — Product Map Map and Stock Menus

- Source visual truth: the Nayax Product Map toolbar screenshot supplied in the current conversation; normalized source crop from `assets/qa/qa-nayax-product-map-inline-comparison.png` (812 × 675px).
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Browser-rendered evidence:
  - `assets/qa/qa-product-map-map-menu-stock-toolbar.png` (1710 × 876px)
  - `assets/qa/qa-product-map-stock-menu.png` (1710 × 876px)
  - `assets/qa/qa-product-map-stock-confirm.png` (1710 × 876px)
  - `assets/qa/qa-product-map-stock-empty-confirm.png` (1710 × 876px)
- Combined focused comparison: `assets/qa/qa-product-map-stock-comparison.png` (1862 × 620px).
- Viewport: 1710 × 876 CSS pixels at device scale factor 1; source and implementation regions were height-normalized to 620px for comparison.
- State: saved eight-BIN map with the Stock menu open; additional captures cover the Map menu and Fill Machine confirmation.

## Full-view and focused comparison

![Nayax Map and Stock toolbar compared with the Paywizard implementation](assets/qa/qa-product-map-stock-comparison.png)

- The Paywizard toolbar now follows the Nayax hierarchy with separate adjacent `Map` and `Stock` dropdown controls while retaining the portal's established neutral button treatment.
- Add BIN and Add Multiple BINS are the first two Map actions, followed by a divider and template actions; the prior standalone controls are absent.
- Stock exposes Fill Machine 100% and Empty Machine in a compact menu aligned directly beneath its trigger.
- Focused comparison was required because menu hierarchy, trigger spacing, action density, and inventory-table continuity are the acceptance surfaces.

## Comparison history

- First pass found a P2 confirmation-action sizing mismatch: Cancel rendered at 92 × 36px while the stock action rendered at 112 × 36px.
- Fix: standardized both confirmation footer actions to 112 × 36px, 13px type, and 700 weight.
- Follow-up review found a P2 density issue: the redundant header Close action competed with the footer Cancel action, and `Empty Machine` wrapped inside the fixed-width confirmation button.
- Fix: removed the header Close action while retaining Cancel, Escape, and overlay dismissal; shortened the destructive action to `Empty`.
- Post-fix evidence: `assets/qa/qa-product-map-stock-confirm.png` and `assets/qa/qa-product-map-stock-empty-confirm.png` show matched single-line actions and compact headers with no table or modal clipping.

## Required fidelity surfaces and verification

- Fonts and typography: existing portal family, 12px menu actions, 13px confirmation actions, and established heading hierarchy are preserved: passed.
- Spacing and layout rhythm: adjacent toolbar triggers, 170px menu content width, divider spacing, popover alignment, and confirmation footer balance match the existing interface density: passed.
- Colors and tokens: neutral toolbar/menu surfaces, blue focus/active behavior, black primary confirmation, red destructive confirmation, and existing stock progress colors are retained: passed.
- Image quality and assets: no new raster or icon assets are required; existing caret treatment is reused consistently: not applicable.
- Copy and content: Map action ordering, Fill Machine 100%, Empty Machine, confirmation descriptions, and saved-status messages match the approved behavior: passed.
- Accessibility and interaction: mutually exclusive menus, Arrow navigation, Escape, outside-click closure, focus restoration, disabled-state explanation, modal focus trapping, and `aria-expanded` updates: passed.
- Persistence: Fill saves `On Hand = PAR`; Empty saves `On Hand = 0`; refresh persistence, Missing recalculation, Cancel behavior, and failure rollback are covered: passed.
- Browser console errors during final interaction pass: 0.
- Playwright regression suite: 18 passed.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 visual, responsive, accessibility, or interaction findings remain.

final result: passed

---

# Design QA — Product Map Editable Catalog Cells

- Source visual truth: the annotated Product Map validation, Add Multiple BINS, Nayax inline pencil-editing, and editable Product Group screenshots supplied in the current conversation.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Browser-rendered evidence:
  - `assets/qa/qa-product-map-create-rows-typography.png`
  - `assets/qa/qa-product-map-autocomplete-filter.png`
  - `assets/qa/qa-product-map-new-catalog-draft.png`
  - `assets/qa/qa-product-map-quick-edit.png`
- Combined before/after board: `assets/qa/qa-product-map-editable-comparison.png`.
- Viewport: 2048 × 1054 CSS pixels at device scale factor 1.

## Comparison evidence

![Select-only and previous dialog states compared with editable comboboxes and aligned dialog typography](assets/qa/qa-product-map-editable-comparison.png)

- PA Code is optional. An empty value no longer highlights the cell or appears in the external validation summary; a supplied value still accepts exactly two letters or digits and remains unique when present.
- Product Group and Product are editable comboboxes. Typing filters the browser-native suggestion list, exact matches reuse catalog records, and unmatched names create a new Product Group or Product when the Product Map is saved.
- Product suggestions are scoped to the selected Product Group. Changing Product Group clears the prior Product and price so an unrelated catalog value cannot be retained.
- Saved Product and Product Group cells expose a pencil affordance on hover and keyboard focus; activation opens the row editor and focuses the selected field.
- Add Multiple BINS retains the compact dialog. Cancel and Create Rows now share the same 13px, 700-weight button typography and aligned control height.

## Interaction and regression verification

- Blank PA Code save, optional PA uniqueness behavior, and Product Map persistence: passed.
- Existing Product Group/Product selection, type-ahead filtering, default-price copy, and independent terminal price override: passed.
- New Product Group and Product creation from an inline Product Map row, followed by cross-page catalog visibility: passed.
- Quick-edit focus behavior for Product and Product Group, keyboard navigation, and draft cancellation: passed.
- Inactive catalog entries remain visible only for existing mappings and are excluded from new suggestions: passed.
- Browser console errors and warnings during final captures: 0.
- Playwright regression suite: 7 passed.
- JavaScript syntax and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 visual, responsive, accessibility, or interaction findings remain.

final result: passed

# Design QA — Transaction Actions

- Source visual truth path: user-provided Paywizard Transactions / ACTIONS screenshot in the current conversation.
- Implementation screenshots:
  - `assets/qa/qa-transaction-list-initial.png`
  - `assets/qa/qa-transaction-list-sale-menu.png`
  - `assets/qa/qa-transaction-list-refund-modal.png`
  - `assets/qa/qa-transaction-list-auth-menu.png`
- Viewport: 2048 × 900 desktop.
- States: default transaction list, Sale/Purchase ACTIONS menu, Refund form, Auth ACTIONS menu, validation error, successful follow-up transaction, and details navigation.

**Full-view comparison evidence**

- The ACTIONS popover is right-aligned to the row action button and uses the reference white card, subtle border/shadow, gray section headers, compact icon rows, and neutral typography.
- The existing Paywizard page shell, table density, colors, and control styles remain unchanged outside the requested ACTIONS workflow.

**Focused region comparison evidence**

- The Sale/Purchase menu contains the Action group with Transaction Details and Send Receipt, followed by the Terminal group with Refund and Tip Adjust.
- The Auth menu uses the same structure and replaces the terminal actions with Capture and Incremental.
- The Refund modal shows original transaction type, amount, transaction ID, merchant, terminal, and terminal SN before the editable follow-up amount.
- Follow-up iteration uses a compact two-column key/value summary with no per-field cards; Terminal Name is replaced by TID.

**Required fidelity surfaces**

- Fonts and typography: existing Poppins hierarchy is preserved; menu and modal labels use existing weights and sizes.
- Spacing and layout rhythm: menu rows, section headers, modal summary grid, amount control, and footer actions align consistently with the current prototype.
- Colors and visual tokens: existing neutral, dark, green, orange, blue, and purple transaction tokens are reused.
- Image quality and asset fidelity: local official Material Symbols SVG assets render sharply with no missing or fallback icon text.
- Copy and content: Action, Terminal, Transaction Details, Send Receipt, Refund, Tip Adjust, Capture, and Incremental labels match the requested workflow.

**Findings**

- No actionable P0, P1, or P2 visual or interaction issues remain.

**Patches made**

- Replaced network-dependent icon font rendering with local SVG icon assets after the first visual pass exposed fallback icon names.
- Added inline amount validation so Refund and Capture cannot exceed the original transaction amount.
- Added an Auth mock transaction so Capture and Incremental are directly testable in the prototype.
- Removed the modal subtitle and optional reference/note field.
- Replaced six boxed summary cards with a borderless, compact key/value layout.

**Verification**

- JavaScript syntax and `git diff --check`: passed.
- Sale/Purchase action mapping: passed.
- Auth action mapping: passed.
- Refund, Tip Adjust, Capture, and Incremental modal titles, amount labels, currencies, and source summaries: passed.
- Refund amount validation and successful follow-up row creation: passed.
- Transaction Details navigation to `/11.transaction_detail_redesign.html`: passed.
- Local icon loading: 0 broken assets.
- Compact Refund modal screenshot: `assets/qa/qa-transaction-list-refund-modal-compact.png`.
- MID replaces Merchant in the original transaction summary.
- Transaction Channel displays the configured processor channel (TSYS, FISERV, ELAVON, or NUVEI) and is inherited by follow-up transactions.
- Capture modal channel screenshot: `assets/qa/qa-transaction-list-capture-channel.png`.
- Summary order now places MID and TID on the same row; Transaction Channel is shortened to Channel.
- Amount guidance uses a higher-contrast neutral callout with a left accent and semibold text.
- Reordered Refund modal screenshot: `assets/qa/qa-transaction-list-refund-reordered.png`.
- Replaced the amount callout card with a borderless inline calculation row using existing typography and divider tokens.
- Tip Adjust now presents Original sale and New total as two compact values, with only the resulting total emphasized.
- Redesigned Tip Adjust screenshot: `assets/qa/qa-transaction-list-tip-help-redesign.png`.

final result: passed

---

# Design QA — Nayax Product Map and DEX

- Source visual truth: the two Nayax / Paywizard screenshots supplied in the current conversation, the Nayax Product Map field-definition and DEX administration references linked in the approved plan, and the unchanged local Paywizard baseline `1.terminalmanage.html`.
- Implementation target: `1.terminalmanage_nayax.html`.
- Browser-rendered implementation screenshots:
  - `assets/qa/qa-nayax-product-map-viewport.png`
  - `assets/qa/qa-nayax-dex-parsed-viewport.png`
  - `assets/qa/qa-nayax-dex-raw-viewport.png`
- Side-by-side comparison boards:
  - `assets/qa/qa-nayax-product-map-comparison.png`
  - `assets/qa/qa-nayax-dex-parsed-comparison.png`
  - `assets/qa/qa-nayax-dex-raw-comparison.png`
- Viewports: 1440 × 1000 desktop, 820 × 1000 tablet, and 390 × 844 phone.

## Product Map comparison

![Nayax Product Map reference at left and Paywizard implementation at right](assets/qa/qa-nayax-product-map-comparison.png)

- The implementation preserves the Nayax concepts and field order for Product, Product Group, PA Code, MDB Code, PAR, On Hand, and Missing while fitting the existing Paywizard black header, blue active line, neutral cards, compact table, and status colors.
- Product Map adds the required BIN / Slot, SKU, Price, status, actions, summary, search, filters, CRUD controls, CSV controls, and horizontal table scrolling without changing the surrounding terminal-management shell.
- Inventory bars and green / yellow / red states make On Hand and Missing easier to scan while retaining the behavior shown in the Nayax reference.

## Parsed DEX comparison

![Nayax selected-read and DEX-history references at left and Paywizard Parsed DEX at right](assets/qa/qa-nayax-dex-parsed-comparison.png)

- Last Read, Selected Read, and Delta align directly with the Nayax comparison model; the Paywizard implementation adds explicit machine-audit metadata and KPI cards above the same comparison table.
- Full / Delta, source, read time, validation, record count, and history selection remain visible in one workflow.
- The parsed table uses an independent 620px scroll region with a sticky header, preventing a full DEX read from creating an excessively long page.

## RAW DATA comparison

![Existing Paywizard terminal baseline at left and DEX RAW DATA implementation at right](assets/qa/qa-nayax-dex-raw-comparison.png)

- RAW DATA reuses the existing Paywizard terminal card, typography, spacing, neutral controls, and black-primary-button treatment.
- The dark monospace payload surface is visually distinct from parsed business data and keeps search, copy, and download actions immediately available.

## Interaction and state verification

- Removed terminal-level `Setting` and `Parameter Variables` tabs, panels, and script registration; the global sidebar `Settings` item remains.
- Default entry still opens `APP & Parameters > Parameters`; legacy `?tab=settings`, `?tab=params`, and unknown tab values canonicalize to `?tab=appfw`.
- Product Map single add, edit, bulk add, single / bulk delete, search, group and stock filters, uniqueness rules, MDB numeric validation, non-negative numeric validation, `On Hand ≤ PAR`, Missing calculation, and inventory-state thresholds: passed.
- CSV quoted-field parsing, valid-row append, duplicate / invalid-row isolation, no-overwrite behavior, export filename, headers, and complete-map content: passed.
- DEX Delta and Full reads: `Queued → Reading → Parsed` passed; both append to history and update metadata, KPIs, parsed values, and RAW DATA.
- DEX Parsed / RAW tabs, category filtering, PA Code to Product Map association, RAW search, clipboard copy, and download: passed.
- Historical Parsed, Failed, Warning, Stale, and No Data snapshots update the overview, validation state, parsed message, RAW message, and KPI availability as intended.
- Main tab and DEX inner-tab keyboard navigation, modal focus entry, Escape close, focus restoration, ARIA relationships, and live status feedback: passed.
- APP & Parameters parameter preview, Push Task, Basic Information, sidebar, terminal status, and existing action flows: passed.
- Desktop, tablet, and phone widths have no document-level horizontal clipping; Product Map and DEX tables scroll inside their own containers, and DEX grids collapse below 900px.
- Browser console errors / warnings: 0.
- Inline JavaScript syntax, duplicate IDs, and missing `aria-controls` targets: passed.

## Findings

- No actionable P0, P1, or P2 visual, responsive, accessibility, or interaction mismatches remain.
- The narrow-screen shell keeps the project's existing stacked sidebar-first navigation pattern; the requested terminal content remains fully reachable and uncropped.

final result: passed

---

# Design QA — Product Map Inline Editing Revision

- Source visual truth: the latest Nayax Product Map screenshot supplied in the conversation and the existing Paywizard terminal-management shell.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Browser-rendered screenshots:
  - `assets/qa/qa-nayax-product-map-inline-viewport.png`
  - `assets/qa/qa-nayax-product-map-inline-edit.png`
- Side-by-side comparison board:
  - `assets/qa/qa-nayax-product-map-inline-comparison.png`
- Browser viewport for the comparison capture: 1710 × 876; the wide table remains contained by its own horizontal scroll surface.

## Visual comparison

![Nayax Product Map reference at left and revised Paywizard Product Map at right](assets/qa/qa-nayax-product-map-inline-comparison.png)

- Removed the Product Map summary cards, search and filter controls, CSV controls, bulk-selection controls, checkbox column, and visible BIN / Slot column.
- Reordered the table to follow the supplied Nayax reference: Product, Product Category, PA Code, MDB Code, PAR, On Hand, Missing, Price, Status, and Actions.
- Preserved the Nayax-style inventory bars and the current project's green, yellow, and red stock states.
- Kept the terminal black header, blue active-tab line, neutral table surface, black primary buttons, border treatment, and type scale consistent with the surrounding project.

## Interaction verification

- `Add BIN` inserts one editable row directly into the table; no dialog is created or opened.
- `Add Multiple BINS` inserts three editable rows directly into the table; no dialog is created or opened.
- Inline product name, SKU, category, PA Code, MDB Code, PAR, On Hand, and price fields update Missing, stock progress, and status in place.
- Global `Save Changes` commits all valid pending rows atomically; `Cancel Changes` and per-row Cancel discard unsaved edits.
- Existing-row Edit uses the same inline table treatment; it does not open the legacy editor dialog.
- Duplicate PA Code validation was exercised in the browser and correctly blocked saving with an inline error.
- Single-row Delete still uses the existing confirmation flow and updates Product Map / DEX session data after confirmation.
- JavaScript syntax check and duplicate-ID check: passed.
- Responsive CSS review: the toolbar stacks below 900px, controls become full-width below 560px, and the table stays inside its independent scroll container.

## Findings

- No visible Product Map filters, checkbox column, BIN / Slot column, or add modal remain in the revised primary workflow.
- No actionable P0, P1, or P2 mismatch remains against the requested Product-first Nayax table direction.

final result: passed

---

# Design QA — Product Map Top-Row Insertion Revision

- Source visual truth: the user-provided Product Map screenshot in the current conversation, represented by the prior browser capture `assets/qa/qa-nayax-product-map-inline-edit.png` for pixel-aligned comparison.
- Implementation: `1.terminalmanage_nayax.html?tab=productmap`.
- Implementation screenshots:
  - `assets/qa/qa-nayax-product-map-top-insert.png`
  - `assets/qa/qa-nayax-product-map-quantity-dialog.png`
- Full-view comparison: `assets/qa/qa-nayax-product-map-top-insert-comparison.png`.
- Source and implementation captures use the same desktop browser surface and density; both were normalized to 1200 × 675 panels in the 2400 × 675 comparison board.
- State: four unsaved rows inserted directly below the table header; separate quantity-dialog state captured at its default value of 3.

## Findings and fixes

- Earlier P2: draft rows appeared after all existing rows. Fixed by rendering all pending additions before persisted Product Map records.
- Earlier P2: the Product column exposed SKU and a `New BIN` label. Fixed by showing only the product-name input and distinguishing draft rows through a pale blue row background with a subtle left accent.
- Earlier P2: the Status column remained visible after inventory status was already communicated by the On Hand progress color. Fixed by removing Status from the active Product Map header, persisted rows, and inline rows.
- Earlier P1: `Add Multiple BINS` assumed three rows without asking. Fixed with an accessible project-styled quantity dialog, whole-number validation, a 1–50 range, Cancel/Escape behavior, and focus entry.

## Fidelity surfaces

- Fonts and typography: unchanged project font stack, weights, header casing, and numeric emphasis; passed.
- Spacing and layout rhythm: editable rows begin immediately below the header and align with all nine active columns; passed.
- Colors and tokens: draft background, input borders, inventory colors, modal overlay, and black primary actions reuse existing project tokens; passed.
- Image and asset fidelity: no new imagery or approximated assets were introduced; not applicable.
- Copy and content: SKU, `New BIN`, and Status are absent from the active workflow; quantity copy and validation are concise English project copy; passed.

## Interaction verification

- Single Add BIN creates one first-row draft without a dialog: passed.
- Add Multiple BINS opens the quantity dialog; invalid 0 is rejected and entering 4 creates four first-row drafts: passed.
- Product Map save succeeds without SKU and still enforces product name, category, PA Code, MDB Code, price, PAR, On Hand, uniqueness, and stock rules: passed.
- Quantity modal cancel, focus, and no-dialog-after-confirm behavior: passed.
- DEX tab regression and Product Map return navigation: passed.
- JavaScript syntax, duplicate IDs, and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Focused comparison is not separate because the table region is large and legible in the normalized full-view comparison; the quantity dialog is captured separately at readable scale.

final result: passed

---

# Design QA — Product Map Code Rules and Simplified Quantity Dialog

- Source visual truth: the latest Product Map draft-row and quantity-dialog screenshots supplied in the conversation, represented by the prior implementation captures `assets/qa/qa-nayax-product-map-top-insert.png` and `assets/qa/qa-nayax-product-map-quantity-dialog.png` for normalized comparison.
- Implementation: `1.terminalmanage_nayax.html?tab=productmap`.
- Implementation screenshots:
  - `assets/qa/qa-nayax-product-map-empty-draft.png`
  - `assets/qa/qa-nayax-product-map-simple-quantity-dialog.png`
- Side-by-side comparison: `assets/qa/qa-nayax-product-map-rules-comparison.png` at 2400 × 1350; each panel normalized to 1200 × 675 at the same desktop browser density.
- States: one newly inserted empty draft row and the default Add Multiple BINS quantity dialog.

## Findings and fixes

- Earlier P1: PA and MDB examples and validation allowed longer codes. Fixed by converting the seed Product Map to two-character PA Codes and two-digit MDB Codes, enforcing exact lengths, stripping invalid MDB characters, and normalizing PA letters to uppercase.
- Earlier P2: new rows prefilled PA, MDB, PAR, On Hand, and Price and rendered an inventory bar. Fixed so every draft field is empty except On Hand = 0; Missing shows `--` until PAR is entered; draft/edit rows do not render stock progress.
- Earlier P2: the quantity dialog duplicated Cancel with a top Close action, included unnecessary subtitle copy, and used unequal action widths. Fixed by removing the subtitle and header button and setting both footer actions to 132 × 40 px.

## Fidelity surfaces

- Fonts and typography: project font stack, title hierarchy, table labels, and button weights remain unchanged; passed.
- Spacing and layout rhythm: the simpler 440px modal reduces unused vertical space and keeps equal button geometry; the empty draft remains aligned to the nine-column grid; passed.
- Colors and tokens: existing modal overlay, borders, focus ring, draft-row tint, and persisted inventory colors are preserved; passed.
- Image and asset fidelity: no image assets are present or required in this revision; not applicable.
- Copy and content: removed redundant dialog copy and Close label; retained only title, field label, compact range guidance, Cancel, and Create Rows; passed.

## Interaction verification

- New-row values are empty for Product, Category, PA, MDB, PAR, and Price; On Hand is exactly 0: passed.
- New/edit rows contain no inventory progress bar; persisted rows still show progress bars: passed.
- PA Code rejects one or more than two characters, allows two alphanumeric characters, and saves lowercase input as uppercase: passed.
- MDB Code strips non-digits and rejects values that are not exactly two digits: passed.
- Quantity dialog contains no subtitle or header Close button; Cancel and Create Rows both measure 132 × 40 px: passed.
- Quantity dialog Escape behavior and DEX tab regression: passed.
- JavaScript syntax, duplicate IDs, and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.
- The combined comparison board provides readable focused evidence for both changed surfaces, so no additional crop is required.

final result: passed

---

# Design QA — Product Map Validation Placement and Newest-First Ordering

- Source visual truth: the three latest Product Map screenshots supplied in the conversation, covering in-row error overflow, PA/MDB placeholder hints, and a newly saved record at the bottom.
- Implementation: `1.terminalmanage_nayax.html?tab=productmap`.
- Implementation screenshots:
  - `assets/qa/qa-nayax-product-map-validation-summary.png`
  - `assets/qa/qa-nayax-product-map-newest-first.png`
- Delta comparison board: `assets/qa/qa-nayax-product-map-errors-order-comparison.png` at 2700 × 506. The prior empty-draft capture is shown at left, the external validation state at center, and newest-first saved state at right; each panel is normalized to 900 × 506 at the same browser density.

## Findings and fixes

- Earlier P1: row-level error copy overflowed the narrow Actions cell and increased row height. Fixed by moving detailed validation into a full-width alert between the action toolbar and table; invalid inputs retain only their red field borders.
- Earlier P3: `2 chars` and `2 digits` placeholders created repetitive visual noise. Fixed by leaving both PA Code and MDB Code inputs visually empty while retaining exact-length validation.
- Earlier P1: newly saved records were appended below all seed records. Fixed by prepending each newly saved record or batch; later save operations appear above earlier saves and the seed map.

## Fidelity surfaces

- Fonts and typography: the alert uses the existing compact UI font, 12px body text, and semibold title; passed.
- Spacing and layout rhythm: validation occupies its own horizontal region without altering table column widths or draft-row height; passed.
- Colors and tokens: alert background, border, left accent, and invalid field borders reuse existing red semantic tokens; passed.
- Image and asset fidelity: no images or icons were introduced; not applicable.
- Copy and content: detailed errors are grouped by `New row N`; redundant PA/MDB placeholders are absent; the toolbar continues to show the unsaved count rather than duplicating the error message; passed.

## Interaction verification

- Invalid price and duplicate MDB Code produce two red field borders and one external summary; the Actions cell contains only Cancel: passed.
- Editing one invalid row clears only that row's summary entry while preserving errors from other rows: passed by state-model review and targeted handler verification.
- Two sequential saves produce `Product Two`, `Product One`, then the seed data: passed.
- PA/MDB inputs have empty placeholder attributes: passed.
- JavaScript syntax, duplicate IDs, and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.
- The three-panel comparison is sufficient because the changed alert, draft inputs, and first persisted rows are all legible at normalized scale.

final result: passed

---

# Design QA — Products Catalog and Product Map Integration

- Source visual truth: the Paywizard Portal Settings screenshot supplied in the current conversation, the approved Nayax Classic Core category/product workflow, the supplied Nayax Product Map reference, and the existing Paywizard terminal shell.
- Implementation targets: `35.product_management.html`, `scripts/product-catalog.js`, and `1.terminalmanage_nayax.html?tab=productmap` / `?tab=dex`.
- Browser-rendered implementation screenshots:
  - `assets/qa/qa-products-catalog-viewport.png`
  - `assets/qa/qa-product-map-catalog-linked.png`
  - `assets/qa/qa-dex-catalog-linked.png`
- Combined comparison boards:
  - `assets/qa/qa-products-catalog-comparison.png`
  - `assets/qa/qa-product-map-catalog-comparison.png`
- Viewports: 2048 × 1054 desktop, 899 × 900 tablet, and 390 × 844 phone.

## Products catalog comparison

![Existing Paywizard visual language at left and Settings Products implementation at right](assets/qa/qa-products-catalog-comparison.png)

- The new page reuses the Portal logo, left navigation, Settings expansion, breadcrumb top bar, black primary actions, neutral borders, and existing typography from the supplied Paywizard reference.
- The master-detail workspace keeps Product Categories visible beside the selected category's Products table on desktop, then collapses to a single readable column below 900px.
- Category and product creation/editing remain in the right detail surface rather than introducing a large workflow modal.

## Product Map comparison

![Nayax Product Map reference at left and catalog-linked Paywizard Product Map at right](assets/qa/qa-product-map-catalog-comparison.png)

- Product remains the first column and Product Category the second, matching the requested Nayax table direction.
- New rows start at the top with an empty Category selector; Product stays disabled until Category is selected, then lists only Active products in that category.
- Selecting a product copies its Default Retail Price while retaining terminal-level price editing; On Hand defaults to 0 and draft rows do not display inventory progress.
- Existing mappings retain inactive products and show the inactive state without exposing them to new Product selections.

## Interaction and data verification

- Operator-level session catalog seeds Snacks, Candy, and eight products, safely recovers corrupt/incompatible storage, and publishes versioned catalog/map APIs: passed.
- Category fields, VAT rows, product information, identifiers, pricing, nutrition, age verification, tax, tray, and fill fields save and edit in the detail editor: passed.
- Category name/code and Product ID/Barcode/EAN uniqueness, 13-digit EAN, 100-character Product Name, 16-character DEX Name, and non-negative two-decimal pricing validation: passed.
- No-category and empty-category states, category preselection, Active/Inactive filtering, referenced-product archive protection, and non-empty-category deletion protection: passed.
- Product Map Category → Product focus order, active-only options, default price copy, independent price override, exact two-character PA Code, exact two-digit numeric MDB Code, On Hand default, external error summary, bulk-row independence, and newest-first saves: passed.
- DEX uses `DEX Name || Product Name`, labels parsed values as `DEX Product Name`, and keeps historical raw/parsed snapshots immutable after catalog edits: passed.
- Products navigation is present in the Nayax terminal prototype, the scoped Branding Settings prototype, and the prototype index: passed.
- Desktop and mobile pages have no document-level horizontal overflow; Product and Product Map tables scroll only inside their local containers. Products becomes one column below 900px, DEX metadata/KPI grids become two columns on tablet and one on phone: passed.
- Create menu, quantity dialog, delete/archive confirmation, dirty-leave confirmation, Escape behavior, focus trap/restoration, keyboard sequence, and ARIA/live feedback: passed.
- Browser console errors and warnings after final reload: 0.
- Inline JavaScript, shared-store JavaScript, Playwright test syntax, static IDs, and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 visual, responsive, accessibility, data-flow, or interaction mismatches remain.
- The mobile shell preserves the project's existing sidebar-first pattern; category/product content remains reachable and wide tables remain locally scrollable.

final result: passed

---

# Design QA — Product Groups Catalog Simplification

- Source visual truth: the Products list, Product Category editor, Product editor, Pricing, and Product Map screenshots supplied in the current conversation, plus the existing Paywizard Portal shell.
- Implementation targets: `35.product_management.html`, `scripts/product-catalog.js`, and `1.terminalmanage_nayax.html?tab=productmap`.
- Browser-rendered screenshots:
  - `assets/qa/qa-products-groups-list.png`
  - `assets/qa/qa-products-groups-create-menu.png`
  - `assets/qa/qa-product-group-form-simplified.png`
  - `assets/qa/qa-product-form-simplified.png`
  - `assets/qa/qa-product-pricing-first.png`
  - `assets/qa/qa-products-groups-mobile.png`
  - `assets/qa/qa-product-map-groups-linked.png`
- Combined before/after board: `assets/qa/qa-products-groups-comparison.png`.
- Viewports: 2048 × 1054 desktop and 390 × 844 phone.

## Visual comparison

![Previous Product Categories catalog at left and simplified Product Groups catalog at right](assets/qa/qa-products-groups-comparison.png)

- All visible Product Category language is now Product Group across the catalog and Product Map.
- The Create control is a consistent 108 × 40px black action with a 10px radius; its two menu actions align within the page header without the previous oversized outline.
- Product Group editing contains only Product Group Name, Code, Description, and Image. Operator, Status, and VAT sections are absent.
- Product editing has no Operator, Nutrition, or Miscellaneous sections. Pricing starts with required Default Retail Price.
- Product rows now contain one-line product names and omit Product ID and DEX sublines; Barcode / EAN, Default Price, Status, and Actions remain.
- Mobile content collapses to one column without document-level horizontal overflow; the product table retains local horizontal scrolling.

## Interaction and regression verification

- Create menu opens Add Product Group and Add Product; both actions enter the correct right-side editor: passed.
- Product Group create/edit/save retains the simplified field set while preserving shared catalog compatibility: passed.
- Product create/edit/save retains optional Product ID internally but does not expose it as a list filter or column: passed.
- Product Group → Product cascading selection, default-price copy, two-character PA Code, two-digit MDB Code, newest-first Product Map saves, external error summary, and bulk-add focus behavior: passed.
- Referenced products archive instead of hard-delete and remain visible in existing mappings: passed.
- Browser console errors and warnings during final desktop/mobile capture: 0.
- Playwright regression suite: 6 passed.
- JavaScript syntax and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 visual, responsive, accessibility, or interaction findings remain.

final result: passed

---

# Design QA — Currency-Neutral Product Map Pricing

- Source visual truth: the three annotated screenshots supplied in the current conversation, covering the Product Map Price column, Products Default Price column, and Pricing section currency label.
- Implementation targets: `35.product_management.html` and `1.terminalmanage_nayax.html?tab=productmap`.
- Previous-state screenshots:
  - `assets/qa/qa-products-groups-list.png`
  - `assets/qa/qa-product-pricing-first.png`
  - `assets/qa/qa-product-map-groups-linked.png`
- Updated browser-rendered screenshots:
  - `assets/qa/qa-products-price-protocol-number.png`
  - `assets/qa/qa-product-pricing-no-currency.png`
  - `assets/qa/qa-product-map-price-protocol-number.png`
- Combined comparison board: `assets/qa/qa-protocol-price-comparison.png`.
- Viewport and normalization: 2048 × 1054 CSS pixels, device scale factor 1; each before/after pair uses the same viewport and page state.

## Comparison evidence

![Currency-bearing prices at left and currency-neutral protocol values at right](assets/qa/qa-protocol-price-comparison.png)

- Products Default Price values now render as fixed two-decimal protocol numbers such as `1.50`, without `$` or another currency symbol.
- The Product editor Pricing header no longer declares `USD`; the fields remain non-negative decimal values with up to two decimal places.
- Saved Product Map Price cells now render as fixed two-decimal protocol numbers such as `2.25`; draft and edit inputs use the accessible label `Price`, not `Price in USD`.
- The Product Map data model remains integer cents internally, so DEX generation and terminal mapping calculations are unchanged.

## Required fidelity surfaces

- Fonts and typography: unchanged; removing the prefix preserves numeric alignment and table density: passed.
- Spacing and layout rhythm: the three affected regions retain their existing dimensions, column widths, and form grid: passed.
- Colors and tokens: unchanged; no new semantic color or decoration was introduced: passed.
- Image quality and asset fidelity: no image assets are involved in this change: not applicable.
- Copy and content: all visible Product Map-related currency symbols and the `USD` unit were removed while price labels remain clear: passed.

## Verification

- Product Map saved price values: `2.25`, `1.75`, `1.50`, `1.50`, `1.25`, `1.50`, `1.25`, `1.75`: passed.
- Product list Default Price values match the two-decimal numeric pattern with no currency prefix: passed.
- Product editor Pricing section contains no `USD`: passed.
- Product Map catalog linkage, default-price copy, editing, validation, newest-first persistence, dialogs, accessibility behavior, and responsive layout: 6 Playwright tests passed.
- Browser console errors and warnings during final captures: 0.

## Findings

- No actionable P0, P1, or P2 visual, responsive, accessibility, or interaction findings remain.

final result: passed

---

# Design QA — Product Map Template Save and Import

- Source visual truth: the Product Map screenshot supplied in the current conversation, the established Paywizard terminal shell, and the Nayax-style map-template reuse workflow specified in the approved plan.
- Implementation targets: `1.terminalmanage_nayax.html?tab=productmap`, `36.product_map_templates.html`, and `scripts/product-catalog.js`.
- Browser-rendered screenshots:
  - `assets/qa/qa-product-map-template-menu.png`
  - `assets/qa/qa-product-map-save-template.png`
  - `assets/qa/qa-product-map-import-template-preview.png`
  - `assets/qa/qa-product-map-template-staged.png`
  - `assets/qa/qa-product-map-template-management.png`
  - `assets/qa/qa-product-map-template-management-mobile.png`
- Combined workflow board: `assets/qa/qa-product-map-template-comparison.png`.
- Viewports: 2048 × 1054 desktop and 390 × 844 phone, device scale factor 1.

## Visual comparison

![Product Map template menu, save, import preview, staged replacement, and Settings library](assets/qa/qa-product-map-template-comparison.png)

- The Map menu aligns with the existing compact Product Map toolbar and uses the established black/white action hierarchy.
- Save as Template is a compact metadata dialog with balanced read-only summaries, concise fields, and matching action sizes.
- Import Template keeps search and selection on the left and puts compatibility metadata, ordered rows, and the inventory-reset notice in a readable preview pane.
- Applied rows use the existing light-blue unsaved state across the full table, while Cancel Changes and Save Changes remain visible in the toolbar.
- The Settings library follows the Products master/detail layout and preserves independent table scrolling at narrow widths.

## Interaction and regression verification

- Save current map, unique name validation, empty/unsaved-map protection, and template persistence: passed.
- Search, same-model compatibility, disabled incompatible models, ordered preview, and complete replacement staging: passed.
- Imported On Hand reset to 0, Missing recalculation, Cancel restore, Save persistence, and target-terminal IDs: passed.
- Template edit, duplicate, delete confirmation, and product reference protection: passed.
- v1 session storage migration preserves Products and terminal Product Maps while initializing v2 templates: passed.
- Keyboard focus, Escape behavior, ARIA state, desktop/mobile layout, and local table overflow: passed.
- Browser console errors and warnings during final captures: 0.
- Playwright regression suite: 11 passed.
- JavaScript syntax and `git diff --check`: passed.

## Required fidelity surfaces

- Typography, spacing, borders, radii, black actions, blue state treatment, and table density match the existing portal: passed.
- Machine Model, source terminal, BIN count, updated time, codes, PAR, and currency-neutral Price remain legible and correctly grouped: passed.
- No actionable P0, P1, or P2 visual, responsive, accessibility, data-flow, or interaction findings remain.

final result: passed

---

# Design QA — Product Map Template Interaction Refinement

- Source visual truth: the four annotated screenshots supplied in the current conversation and the previously implemented Product Map template states.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap` with shared template metadata from `scripts/product-catalog.js`.
- Previous-state evidence:
  - `assets/qa/qa-product-map-template-menu.png`
  - `assets/qa/qa-product-map-save-template.png`
  - `assets/qa/qa-product-map-import-template-preview.png`
- Revised browser-rendered evidence:
  - `assets/qa/qa-product-map-template-menu-refined.png`
  - `assets/qa/qa-product-map-save-template-refined.png`
  - `assets/qa/qa-product-map-import-template-compact.png`
  - `assets/qa/qa-product-map-import-model-confirm.png`
  - `assets/qa/qa-product-map-save-template-refined-mobile.png`
  - `assets/qa/qa-product-map-import-template-compact-mobile.png`
- Combined before/after board: `assets/qa/qa-product-map-template-refinement-comparison.png`.
- Viewports: 2048 × 1054 desktop and 390 × 844 phone; device scale factor 1 and matching source/implementation density.

## Full-view and focused comparison

![Previous and refined Map menu, Save as Template, and Import Template states](assets/qa/qa-product-map-template-refinement-comparison.png)

- Map now presents a visible caret, rotates it with `aria-expanded`, and uses a narrower menu aligned to the trigger.
- Save as Template replaces Machine Model with a full-width Terminal Name summary and keeps Terminal SN and BINS below it.
- Save and Cancel actions are matched at 124 × 36px with 13px/700 typography and no wrapping.
- Import Template is a compact single-column card picker with no search field or BIN table; selected-template impact remains visible in a concise summary.
- Different-model templates remain selectable and require a second, explicit amber confirmation before import.
- Focused regions were necessary for the caret, action typography, terminal summary wrapping, selected card, and cross-model confirmation; all are readable in the revised captures.

## Comparison history

- Initial revised capture found a P2 typography issue: 112px actions wrapped `Save Template` and `Import Template` onto two lines, and the three-column summary cramped Terminal Name.
- Fix: actions were changed to matched 124 × 36px no-wrap controls; Terminal Name now spans the summary width, with Terminal SN and BINS on the second row.
- Post-fix evidence: `qa-product-map-save-template-refined.png` and both mobile captures show single-line actions and stable responsive layout.

## Required fidelity surfaces and verification

- Fonts and typography: existing portal family and hierarchy retained; no action labels wrap: passed.
- Spacing and layout rhythm: dialog width, footer padding, card gaps, radii, and shadows match the existing compact modal language: passed.
- Colors and tokens: black primary actions, white secondary actions, blue selected state, and amber model-risk state use existing semantic colors: passed.
- Image quality and assets: this change contains no new raster assets; the existing Paywizard shell remains unchanged: not applicable.
- Copy and content: Terminal Name, replacement impact, inventory reset, unsaved state, and MDB compatibility risk are explicit without redundant subtitles: passed.
- Keyboard menu navigation, Escape, focus restoration, ARIA state, same-model import, cross-model two-step confirmation, Cancel Changes, and Save Changes: passed.
- Mobile document width: 390px for a 390px viewport; no document-level overflow.
- Browser console errors and warnings during final captures: 0.
- Playwright regression suite: 11 passed.
- JavaScript syntax and `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Product Map Template Metadata Separation

- Source visual truth: the five annotated screenshots supplied in the latest conversation turn and the preceding template-dialog captures.
- Implementation targets: `1.terminalmanage_nayax.html?tab=productmap`, `36.product_map_templates.html`, and `scripts/product-catalog.js`.
- Previous-state evidence: `assets/qa/qa-product-map-save-template-refined.png`, `assets/qa/qa-product-map-import-template-compact.png`, and `assets/qa/qa-product-map-template-management.png`.
- Revised browser-rendered evidence:
  - `assets/qa/qa-product-map-save-custom-machine.png` (522 × 554px)
  - `assets/qa/qa-product-map-import-simple.png` (560 × 234px)
  - `assets/qa/qa-product-map-template-manager-summary.png` (1144 × 886px)
  - `assets/qa/qa-product-map-template-manager-mobile.png` (700 × 1497px)
- Combined before/after evidence: `assets/qa/qa-product-map-template-metadata-comparison.png`.
- Capture viewports: 1440 × 1000 desktop and 700 × 1000 narrow layout; device scale factor 1. Element captures preserve their rendered CSS size with no density normalization.
- State: eight-row saved map, Save as Template open, one custom `VENDO 721` template selected for import, and template manager detail selected.

## Full-view and focused comparison

![Product Map template metadata refinement](assets/qa/qa-product-map-template-metadata-comparison.png)

- Save summary keeps Terminal Name, Terminal SN, and BINS in a single desktop row. Long terminal names use a single-line ellipsis and retain the full value in the title attribute.
- Machine Model is an explicit user-entered vending-machine field. The saved value appears on Import cards and in template management, while payment-terminal `Q3RU` context remains separate.
- Import consists only of compact selectable template cards and matched footer actions; the prior `BINS ready to import` explanation is absent.
- Template management removes the Open Product Map action and presents four summary cards: Terminal (Name + SN), Machine Model, BINS, and Updated.
- Focused comparison was required because metadata alignment, model labeling, card density, and footer button scale are the core acceptance surfaces.

## Comparison history

- Earlier state had a P2 information-model mismatch: the template model was populated from the payment terminal model and import compatibility messaging compared against `Q3RU`.
- Earlier state also had P2 density drift: terminal metadata wrapped to two rows and import repeated the BIN replacement explanation in a separate module.
- Fixes: introduced a required vending Machine Model field, stopped passing payment-terminal model into template instantiation, aligned the three terminal facts in one row, removed the explanatory import panel, and restructured the manager summary.
- Post-fix evidence: the revised captures and combined board show the requested hierarchy without model conflation or redundant modules.

## Required fidelity surfaces and verification

- Fonts and typography: existing portal family, 13px form/action sizing, 700 action weight, compact 10–13px metadata hierarchy, and single-line labels are consistent: passed.
- Spacing and layout rhythm: summary cards share one baseline; modal footer buttons remain 124 × 36px; import cards and manager summaries retain established gaps, borders, and radii: passed.
- Colors and tokens: existing black primary, white secondary, blue selected state, neutral metadata backgrounds, and border tokens are retained: passed.
- Image quality and assets: no new visible imagery or icon assets are introduced; existing shell assets remain unchanged: not applicable.
- Copy and content: the vending-machine model is named only `Machine Model`; payment-terminal model data is no longer surfaced in template selection: passed.
- Responsiveness: desktop summaries remain four columns and collapse to two columns at narrow width; the wide template table remains inside its local scroll container: passed.
- Accessibility and interaction: labeled required model input, external validation message, modal focus behavior, selectable-card ARIA state, Escape, and focus restoration remain functional: passed.
- Browser console errors and warnings during final captures: 0.
- Playwright regression suite: 11 passed.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: very long Terminal Name values are visually truncated in the single-row modal summary; the full value remains available on hover and the layout stays stable.

final result: passed

---

# Design QA — Template Header and Summary Density

- Source visual truth: the annotated template-detail crop supplied in the latest conversation turn and `assets/qa/qa-product-map-template-manager-summary.png` as the preceding rendered state.
- Implementation target: `36.product_map_templates.html`.
- Implementation screenshot: `assets/qa/qa-product-map-template-sn-header.png` (1144 × 786px element capture).
- Combined before/after evidence: `assets/qa/qa-product-map-template-header-comparison.png` (1600 × 1000px viewport capture).
- Viewport: 1440 × 900 desktop, device scale factor 1; element screenshot preserves rendered CSS size without density normalization.
- State: one selected eight-BIN template with a terminal name, terminal SN, vending-machine model, and updated time.

## Full-view and focused comparison

![Template detail before and after](assets/qa/qa-product-map-template-header-comparison.png)

- Terminal SN now sits beside the template name in the first title row; BINS and Updated remain together on the second title row.
- The Terminal Name summary card no longer repeats SN, so all four cards contain exactly two child rows: one label and one value.
- Duplicate is removed from both the rendered actions and event handling; Edit Details and Delete retain the established button hierarchy.
- The combined board provides both the full detail composition and a readable focused view of header actions and summary-card density.

## Required fidelity surfaces and verification

- Fonts and typography: title, inline SN, secondary metadata, summary labels, and values preserve existing size/weight hierarchy with stable single-line truncation: passed.
- Spacing and layout rhythm: inline title gap, two-line header rhythm, equal card heights, four-column grid, and action spacing are balanced: passed.
- Colors and tokens: muted SN, neutral cards, white secondary action, and red destructive action use existing portal tokens: passed.
- Image quality and assets: no image or icon assets are introduced or modified: not applicable.
- Copy and content: SN appears once in the detail area and all summary cells contain only their intended label and value: passed.
- Accessibility and responsiveness: the title and card values have overflow protection and full-value title attributes; existing responsive grid behavior remains intact: passed.
- Browser console errors during the final capture: 0.
- Summary-card DOM contract: four cards, two child rows per card: passed.
- Targeted Playwright template-management test: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Product Map Cell-Level Editing

- Source visual truth: the Nayax-style Product Map screenshot supplied in the latest conversation turn, where individual values are edited in place and no row-wide Edit action is present.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap` with shared persistence in `scripts/product-catalog.js`.
- Browser-rendered evidence: desktop Product Map default state and focused PA Code cell captured in the in-app browser at the existing Paywizard portal viewport.
- State: eight saved mappings, one active single-cell editor, icon-only row deletion, and no pending Add BIN or template-import changes.

## Visual and interaction comparison

- Clicking Product, Product Group, PA Code, MDB Code, PAR, On Hand, or Price replaces only that cell with a compact 34px editor; the remaining row stays unchanged.
- The focused editor uses the existing blue focus treatment and table density. Escape restores the display state without changing the value.
- Product and Product Group retain the existing searchable catalog behavior. A changed group saves immediately, clears Product, and displays the muted `Select product` prompt.
- Actions contains only the established 32px icon-button treatment with a real local trash asset; the legacy row-wide Edit button is absent.
- Inventory display returns immediately after saving On Hand, including the progress bar and recalculated Missing value.

## Verification

- Enter, blur, catalog selection, Escape, invalid-field retention, external error summary, and switching between cells: passed.
- Blank Product persistence, new Product Group/Product creation, default-price behavior, and page reload: passed.
- Delete icon accessible name/title and confirmation flow: passed.
- Stock/template locking while a cell is active and Add BIN/template staged-save regression: passed.
- Desktop and 390px mobile document overflow checks: passed.
- Browser console errors and warnings during final visual inspection: 0.
- Full Playwright regression suite: 18 passed.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Product Map Simplified Cell Affordance

- Source visual truth: the annotated Product Map crop supplied in the latest conversation turn, specifically requesting removal of the visible per-cell `Edit` label.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Implementation screenshot: `assets/qa/qa-product-map-cell-edit-simplified.png`.
- Viewport: existing desktop Paywizard portal viewport at device scale factor 1; no density normalization required.
- State: eight saved mappings in display mode, with cell-level editing available but no active editor.

## Full-view and focused comparison

- Every editable cell now renders only its value. The prior hover/focus `Edit` text has been removed from the visual tree.
- Hover and keyboard focus retain the existing subtle blue-gray cell background, so editability remains discoverable without adding repeated copy.
- Clicking Product Group still opens only its compact combobox; Escape closes it and restores display mode.
- A focused-region comparison is sufficient because this change is limited to the repeated cell affordance inside the Product Map table.

## Required fidelity surfaces and verification

- Fonts and typography: no auxiliary 10px `Edit` labels remain; product and table value typography is unchanged: passed.
- Spacing and layout rhythm: removing the trailing label leaves each value aligned consistently without changing row height or column width: passed.
- Colors and visual tokens: existing neutral display state and subtle hover/focus background are retained: passed.
- Image quality and assets: no image assets are introduced or changed: not applicable.
- Copy and content: visible cells contain only Product Map data; accessible names still describe each edit action: passed.
- Interaction and accessibility: single-cell click editing, combobox opening, Escape cancellation, keyboard focus, and screen-reader labels remain functional: passed.
- Browser console errors and warnings during final inspection: 0.
- Visible `.pm-cell-edit-label` elements: 0.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Product Map Cell Editor Chevron

- Source visual truth: the annotated Product Group editor crop supplied in the latest conversation turn, where the browser-native dropdown triangle is visually oversized and misaligned.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Implementation screenshot: `assets/qa/qa-product-map-cell-editor-chevron.png`.
- Viewport: existing desktop Paywizard portal viewport at device scale factor 1; no density normalization required.
- State: the first saved row has its Product Group cell editor focused.

## Full-view and focused comparison

- The browser-native datalist indicator is visually suppressed and replaced by the 16px Heroicons chevron-down asset rendered at 14px.
- The chevron is vertically centered 10px from the input edge, uses reduced opacity in the default state, and becomes slightly stronger with `focus-within`.
- Product Group text keeps a 32px right inset, preventing overlap with the icon while preserving the existing 34px editor height.
- Focused comparison was required because arrow scale, alignment, contrast, and input padding are the only changed visual surfaces.

## Required fidelity surfaces and verification

- Fonts and typography: Product Group value sizing, weight, selection highlight, and line height are unchanged: passed.
- Spacing and layout rhythm: 14px icon, 10px right inset, and 32px text reserve align with the compact table editor: passed.
- Colors and visual tokens: muted icon opacity supports the existing neutral/blue focus treatment without competing with the value: passed.
- Image quality and assets: a local, MIT-licensed Heroicons source asset replaces the oversized native glyph; no CSS-drawn or text-glyph icon is used: passed.
- Copy and content: unchanged: passed.
- Interaction and accessibility: the input retains its datalist, autocomplete, keyboard behavior, accessible label, and Escape cancellation; the decorative icon has an empty alt: passed.
- Browser console errors and warnings during final inspection: 0.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed

---

# Design QA — Product Map Stable Cell Editing Layout

- Source visual truth: the display/edit Product Group crops supplied in the latest conversation turn, showing unwanted row and column expansion after entering edit mode.
- Implementation target: `1.terminalmanage_nayax.html?tab=productmap`.
- Implementation screenshots: `assets/qa/qa-product-map-row-display.png` and `assets/qa/qa-product-map-row-editing-stable.png`.
- Viewport: existing desktop Paywizard portal viewport at device scale factor 1; both captures use the same dimensions and scroll position.
- State: identical eight-row map before and after opening the first Product Group editor.

## Full-view and focused comparison

- The Product Map now uses a fixed nine-column layout, so an input's browser intrinsic width cannot resize Product Group or push downstream columns.
- Saved rows have a stable 44px height. Editing controls use a 30px height inside 7px vertical cell padding, matching the display row's occupied height.
- The focused editor, chevron, row separator, neighboring rows, and horizontal scroll position stay aligned when edit mode opens.
- The paired same-viewport captures provide the focused before/after evidence needed to confirm that table geometry no longer shifts.

## Required fidelity surfaces and verification

- Fonts and typography: unchanged between display and edit states: passed.
- Spacing and layout rhythm: fixed column tracks, 44px saved rows, 30px editor, and stable surrounding separators remove the prior layout jump: passed.
- Colors and visual tokens: existing neutral table and blue focus treatment remain unchanged: passed.
- Image quality and assets: the existing local chevron asset remains sharp at 14px; no new assets are introduced: passed.
- Copy and content: unchanged: passed.
- Interaction and accessibility: Product Group opens as a single-cell combobox, Escape closes it without saving, and the table returns to display state: passed.
- Browser console errors and warnings during final inspection: 0.
- `git diff --check`: passed.

## Findings

- No actionable P0, P1, or P2 findings remain.

final result: passed
