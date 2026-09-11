# Transactions disclaimer QA — 2026-09-10

final result: passed

Copy update (2026-09-11): the approved sentence is now `Transaction data is for informational purposes only.` The page and both export formats share this text through `transactionDisclaimer`. Layout is unchanged; screenshots and visual review below document the preceding wording.

Alignment update (2026-09-11): the heading and notice now share a text baseline. The notice's paragraph supplies its flex baseline; the information icon remains aligned with the paragraph's first line. Desktop evidence: `/private/tmp/transaction-disclaimer-qa/desktop-baseline.png` (1504 × 1046 CSS viewport). At 390 × 844, the notice still wraps below the heading with no page-level horizontal overflow; all toolbar icon buttons remain 38 px high. Build and whitespace checks passed.

## Evidence and scope

- Route: `12.transaction_list.html` at `http://127.0.0.1:8998/12.transaction_list.html`.
- Source visual truth: `/Users/beaver/.codex/generated_images/01a08a98-b167-70c0-a63e-d78b75708075/exec-b5ce5239-bf6c-441b-ac40-98cfa3f54de2.png` (1504 × 1046 pixels). This combines the user's option 1 placement with option 2 copy.
- Desktop screenshot: `/private/tmp/transaction-disclaimer-qa/desktop.png`, 1504 × 1046 pixels at a 1504 × 1046 CSS viewport, DPR 1. Source and implementation were opened together in the same comparison input without resampling.
- Mobile screenshot: `/private/tmp/transaction-disclaimer-qa/mobile.png`, captured at a 390 × 844 CSS viewport, DPR 1; the browser screenshot output is scaled to 375 × 812 pixels. Mobile was reviewed for responsive behavior, with DOM geometry used for measurements; no mobile source mock was supplied.
- States: Completed and Failed tabs; Completed shown in screenshot evidence.

## Visual review

No actionable P0/P1/P2 findings. The first comparison passed with no subsequent visual fixes. The existing portal shell, table density and typography are retained; their scale differences from the generated concept are intentional because this change is limited to disclaimer placement and copy.

- Fonts and typography: existing Poppins heading retained. The notice uses 12 px text, 18 px line height and the existing information icon. The complete sentence is readable in the desktop comparison; it wraps to two lines on mobile without truncation.
- Spacing and layout: notice sits 18 px after the title and is vertically centered with it. Mobile places the notice 8 px below the title within the same heading group. The prior full-width banner is removed. There is no page-level horizontal overflow at either viewport.
- Colors and tokens: notice uses `#626b7b` on the existing white panel, with no background or border. Existing control colors, radii and table styles are retained.
- Image quality and assets: existing Paywizard logo and existing SVG information icon are reused; no new generated or replacement page assets are introduced.
- Copy: `Transaction data provided by Paywizard is for informational purposes only.` appears once beside the page title and remains visible on both tabs.
- Focused region: the heading, icon, complete sentence and adjacent controls are clearly readable in the full-resolution paired comparison, so an additional cropped source comparison was unnecessary. DOM measurements confirm alignment and wrapping.

## Verification

- Completed/Failed switching retains the notice; the transaction table retains its `aria-describedby="transactionDisclaimer"` association.
- Desktop and mobile toolbar icon buttons are all 38 px high; the two tab buttons are both approximately 27.55 px high.
- The existing CSV/JSON export function was exercised with the updated text, selected columns, filtered records, quoted/multiline values and empty results. Both formats retain the notice. This check uses the actual serializer in an isolated harness; native browser file downloads were not repeated for this copy-only revision.
- No browser warning/error console entries. `npm run build` and `git diff --check` passed.
- Production deployment was not requested or performed.

Implementation checklist complete: inline placement, approved copy, responsive wrapping, export consistency and focused verification.

---

# Branding Logo Management QA

final result: passed

## Evidence and scope

- Source visual truth: user-supplied Branding / Logo Management screenshot in this conversation (3840 × 2271 original, rendered at 2048 × 1211). No local source-image path was supplied.
- Route: `20.provider_custom_email_service.html`.
- Desktop screenshot: `/private/tmp/branding-qa/desktop.png`, 2048 × 1211 pixels and CSS viewport, normalized to the displayed reference size.
- Mobile screenshots: `/private/tmp/branding-qa/mobile.png`, `/private/tmp/branding-qa/mobile-bottom.png`, `/private/tmp/branding-qa/mobile-uploaded.png`, 390 × 844 pixels and CSS viewport.
- States: empty Logo Management, uploaded previews, saved and restored logos, removed logos, Email Setting / Custom SMTP.
- Screenshots use the browser's CDP capture at 1 pixel per CSS pixel. The initial high-level mobile screenshot was incorrectly scaled and replaced with the CDP capture.

## Visual review

The full desktop reference and rendered page were inspected in the conversation. Both have the Branding title, three tabs, two vertically stacked logo sections, left upload cards, right guideline cards and a Save action. The existing project shell is intentionally retained, including its real navigation and access-profile switcher; the screenshot's repeated APP Management rows are not duplicated.

- Typography: existing portal Poppins and heading weights retained for project consistency. Section labels and guidelines remain readable at desktop and mobile sizes.
- Layout: approximately 580/680 px desktop card widths, 16 px column gap and 254 px upload zones preserve the reference's primary card proportions. Removing redundant subtitles and shortening guidelines intentionally reduces vertical height under AGENTS.md. Mobile uses one column without horizontal clipping; bottom Save remains reachable.
- Colors: existing white panels, pale gray upload surfaces, subtle borders and monochrome buttons retained.
- Images: real Paywizard sidebar asset retained by default. Uploaded images use `object-fit: contain`; measured preview sizes are 176 × 44 and 240 × 160. The black/transparent rectangles in the uploaded-state evidence are disposable test fixtures, not supplied brand artwork.
- Copy: Logo Management, System Header Logo, Terminal Logo and both guideline headings retained. JPG/PNG, 2 MB and both target dimensions match the source. Existing Email Service is labeled Email Setting; unimplemented TMS Setting is disabled.
- Focused checks: upload controls, image preview dimensions and action button measurements were inspected separately. Replace/Remove are 36 px on desktop and mobile; Email Save/Send Test Email are both 36 px; mobile tabs are all 52 px. Mobile bottom Save is 36 px and fully visible after scrolling.

No actionable P0/P1/P2 visual findings. No visual fix iteration was needed after the first valid captures. The intentional shell, typography and copy adaptations above follow the user's existing-project requirements.

## Interaction verification

- Default Logo tab; Email tab switches and existing platform/custom SMTP selection and Save marker work.
- PNG input-change and JPEG drag/drop fixtures render previews.
- Wrong type, over-2-MB size and corrupt image receive specific errors.
- Saving retains both logos across reload; System Header Logo appears on Transactions after navigation/reload.
- An already open Transactions tab updates after Save through the shared branding notification.
- Remove plus Save restores the original portal logo in the other tab. All disposable test logos were removed through the UI.
- No warning/error console entries during final page verification.
- JavaScript syntax checks, `git diff --check` and `npm run build` passed.

## Test limitations

The Chrome file chooser opened, but extension file-URL permission prevented `setFiles`. File-input change and drop processing were tested using generated in-page fixtures through the supported browser development capability. Automated native disk selection remains unverified; this is a browser test permission limitation, not a reported app failure. Production deployment, real device distribution, cross-account scoping and cross-device synchronization are outside the agreed local-demo scope.

# Advertising Target Selection QA — 2026-09-11

final result: passed

## Evidence and scope

- Selected design: first displayed inline filtering/table option, refined with the user's confirmed mixed Store/Terminal scopes and an account simulator inside the user menu.
- Source visual truth: `/Users/beaver/.codex/generated_images/01a089d3-081e-7d52-bbef-e5c85976ae14/exec-fb849f3b-5f8a-4313-a931-d39527fb1625.png` (1487 × 1058).
- Implementation: `http://127.0.0.1:8998/45.advertising.html?view=campaigns&campaign=morning-coffee`.
- Desktop evidence: `/private/tmp/ads-target-stores-desktop.png` (1440 × 1024 pixels; 1440 × 1024 CSS viewport).
- Mobile evidence: `/private/tmp/ads-target-stores-mobile.png` (375 × 812 output pixels from the browser's 390 × 844 viewport override). Proportional density difference was treated as capture scaling, not a layout defect. DOM measurement verified no document overflow and 40px action heights.
- Account menu evidence: `/private/tmp/ads-account-menu-mobile.png`.
- Full-view and target-region comparison: source and desktop screenshot were opened together in one comparison input. The two-store table, selection chips, count, controls and preview were legible at full resolution, so their focused regions were reviewed directly in that paired input rather than making another raster crop.
- State compared: Stores tab; one whole store plus one individual terminal from the other store; four unique terminals covered. Existing fixture names Boston Office / Cafeteria Q3 replace the mock's invented Uptown names. The actual page preserves the existing Image fit and complete editor form, which account for its different scroll position and target section height.

## Visual review and comparison history

- Fonts/typography: existing Poppins portal font and established 11–13px form/table density retained; labels, checkboxes and cell text align horizontally, replacing the rejected tree's split-line labels. No table subtitles added.
- Spacing/layout: inline tabs, cascading filters, search, flat table and removable selection chips follow the selected composition. Existing editor/preview grid and footer remain. All selection-strip buttons and editor footer buttons measure 40px on mobile. Narrow tables scroll within their own region; persistent page controls do not overflow the document.
- Colors/tokens: white surfaces, neutral dividers, light table header, charcoal primary actions and subtle selected rows match the shared portal. No new brand palette.
- Assets: existing thumbnails, actual Q3V photograph and Q3min asset are preserved. Q3V native display remains 480 × 800 in the DOM. Existing close icons are reused.
- Copy/content: Targets, Stores/Terminals, Included by store, scope counts and unique covered-terminal count reflect the confirmed behavior. Current account is absent from the main editor.
- [P2, resolved] Mobile user menu initially placed Demo account below all role options, requiring extra scrolling. Moved it immediately below the menu heading, before the role grid. Post-fix evidence is the updated mobile menu screenshot; the selector is visible as soon as the menu opens.
- No remaining actionable P0/P1/P2 findings. No further visual changes were made after the post-fix review.

## Interaction verification

- Whole Midtown Store selection deduplicates its three prior explicit terminal selections. Its terminal checkboxes display Included by store and cannot be individually unchecked while the store remains selected.
- Selecting Cafeteria Q3 in Boston Office alongside Midtown Store yields `1 store · 1 terminal` and four covered terminals. Switching tabs and searching retain the selection.
- Save Draft and reload preserve store IDs and individual SNs. Review & Publish reports the correct combined selection and coverage; the review was cancelled without publishing test changes. Original seeded target selections were restored after testing.
- Provider, nested agent, merchant and store account scopes checked through the existing menu. Merchant context exposes its two stores; store context exposes only its own store and three terminals; level-two agent context exposes only level-two and level-three descendants. Filters above the current account level are omitted.
- Cancelled account switching preserves unsaved edits and the prior context; confirmed switching discards only unsaved edits.
- Image and video pickers enforce a single media type. Idle screen rejects a video playlist and retains Full screen.
- Fresh final preview recorded no browser console errors.
- 15 focused domain/directory tests passed, including future store membership, departures, mixed selection deduplication, draft/publication separation, existing and future conflicts, empty stores, stopping enrollment, and account boundaries.
- Extracted shared account hierarchy was byte-equivalent as JSON to the previous Customer Alerts hierarchy plus its original three agent demo branches.
- Build, JavaScript syntax checks, generated target-picker artifact comparison and `git diff --check` passed.

## Implementation checklist and limits

- Completed: inline selector, continuing store scopes, mixed targets, account menu placement, conflict handling, scoped validation, documentation and focused verification.
- Membership reconciliation uses shared prototype inventory on directory load and advertising state mutations. There is no live device inventory subscription or real terminal acknowledgement in this prototype.
- No production deployment performed.

## Advertising Targets and Deployments cleanup — 2026-09-11

- Removed Deployments navigation, table, simulation handlers, requested/active device state and Preview Active. Kept campaign-level Stop and conflict protection. Existing deployment URLs normalize to Campaigns.
- Browser metadata upgrades from schema 1 to 2, retaining uploaded assets, editable drafts, published configurations, target scopes and original assignment owners. Legacy sync records are retired; domain migration tests cover stopped campaigns and conflicting store membership.
- Agent, Merchant and Store filters now support option browsing and typing to search. Verified direct selection, filtered Enter selection, arrow navigation, Escape restoring a selection, no-results display, parent/child filtering and selection persistence across filter changes.
- Selected badge counts stores plus individual terminal targets. Dedicated selection tables replace chips and Selected only. Verified mixed store + other-store terminal coverage, deduplication, disabled inherited terminals, search, single removal, Clear all and empty state.
- Desktop 1440×1024: Selected tables and preview fit the shared portal; footer buttons are 40px. Mobile 390×844: selected tables adapt to compact entries with visible remove controls; searchable menus fit their fields. Footer and confirmation actions are 40px; row removal controls are consistent.
- Manual browser checks: saved mixed selection survives reload; review summary has no deployment/sync notice; cancelled publication and stop confirmations; old Deployments URL falls back to Campaigns; no console errors in the verification tab. Restored Everyday coffee to its original three individual Midtown terminals after testing.
- Validation: 17 domain/directory tests passed; JavaScript syntax checks and `git diff --check` passed; static build passed. No real terminal commands, publication to hosting, or git commit performed.
- Screenshots: `/private/tmp/ads-selected-review-desktop.png`, `/private/tmp/ads-selected-review-mobile.png`, `/private/tmp/ads-target-search-mobile.png`.

## Advertising demo account placement — 2026-09-11

- Moved Demo account from the global profile menu to the right end of the Advertising tab bar. The same selector remains visible while editing; the global portal role selector is unchanged.
- Consolidated scope validation into one Targets message identifying the current account and directing the user to Demo account or Selected. Save/Publish focuses the same message instead of duplicating it.
- Verified 1440×1024 desktop and 390×844 mobile placement, no page overflow, 40px account control, matching tab heights and 40px switch-confirmation actions. Existing unsaved-change confirmation still restores the current account when cancelled.
- Verified Queens Payment Partners reproduces the scope error exactly once, even after Save and Review & Publish; switching back to Universal Processing removes it. Discarded the temporary unsaved name used for testing, without changing the saved campaign.
- 17 existing domain/directory tests, JavaScript syntax checks, static build and `git diff --check` passed. No console errors. Screenshots: `/private/tmp/ads-account-bar-desktop.png`, `/private/tmp/ads-account-bar-mobile.png`.

## Advertising demo account removal — 2026-09-11

- Supersedes the account-switch placement above: removed Demo account and its stored preference from Advertising behavior. Targets now uses the complete demo inventory, with searchable Agent, Merchant and Store filters. Global portal role visibility is unchanged.
- Opening or duplicating a saved campaign removes its obsolete editable account scope; existing published snapshots remain intact until republished. Missing-target checks, media validation and campaign conflict protection remain.
- Reproduced Lunch break being blocked under Pacific Commerce Network before the change. With the old preference still stored, verified Save Draft, reload and Review & Publish all succeed without an account-range error. Cancelled publication; no campaign was published during verification.
- Verified filtering to Boston Partner Group retains the selected legacy Meat The Bun terminal without an account-key error. No browser console errors.
- Desktop 1440×1024 and mobile 390×844: no selector or leftover account row, no page overflow; desktop footer actions all 40px and mobile tabs all 48px. Screenshots: `/private/tmp/ads-no-account-desktop.png`, `/private/tmp/ads-no-account-mobile.png`.
- 17 domain/directory tests, JavaScript syntax checks, static build and `git diff --check` passed. No deployment or git commit performed.

## Advertising errors, headers and row actions — 2026-09-11

- Reproduced the reported publication conflict: the error began below the desktop viewport and focus remained on the submit button. Editor errors now share one scroll-and-focus path for validation, store/terminal conflicts and save failures; confirmation errors receive the same treatment. Error scroll margins leave space above the sticky footer.
- Matched Campaigns, Stores, Terminals and Selected headers to the live Terminal List's 34px header, 11px type and light-gray surface. Removed the Targets header's 13px vertical padding; its previous measured height was 43.5px.
- Campaign actions use Agent List's Material Symbols Rounded icons and 36px controls: edit_square, content_copy and block, with existing edit/stop colors and shared tooltips. Removed the campaign Preview action, dialog and event handlers. Inline editor preview and Media Library preview remain available.
- At 1440×1024 and 390×844, verified a terminal conflict and empty-target error receive focus and appear above the footer. Desktop Selected and Campaigns headers measure 34px; mobile Campaigns headers also measure 34px. Row actions are all 36px; editor footer actions are all 40px. No page overflow on mobile.
- Verified Edit, Duplicate (cleared targets), Stop confirmation and media-only preview. Discarded temporary selections and the duplicate; cancelled Stop. No saved campaigns, publications or assignments changed in these checks. Browser console had no errors.
- Evidence: `/private/tmp/ads-publish-error-desktop.png`, `/private/tmp/ads-publish-error-mobile.png`, `/private/tmp/ads-actions-desktop.png`.
- JavaScript syntax, 17 existing domain/directory tests, static build and `git diff --check` passed. No deployment or git commit performed.

## Advertising publication editing and target availability — 2026-09-11

- Published campaigns, including stopped campaigns, no longer offer Save Draft. Their working changes must pass Review & Publish; the domain draft-save operation rejects published campaigns and stale copies. Enter in a published editor opens the publication review rather than saving a draft. The status shows Published/Stopped and version.
- Stores, Terminals and Selected display Assignment beside the target name. Whole-store claims are distinguished from occupied member counts and include the owning campaign names; empty claimed stores remain unavailable. Current-campaign ownership is distinguished and does not block editing its own targets.
- Occupied targets cannot be newly selected. Select all skips them; already-selected conflicts remain removable. Existing publication checks still protect against stale selections and later conflicts.
- Browser checks: Midtown Store shows `3 / 3 assigned · Everyday coffee` and is disabled from Lunch break; a search matching only this store also disables Select all. Clearing the filter and selecting all checks 72 available stores while leaving Midtown unchecked. In Everyday coffee the same store shows `3 / 3 in this campaign` and can be selected; its inherited terminal rows remain checked and disabled. Discarded all temporary target edits.
- At 1440×1024 and 390×844, assignment names and counts are readable next to the target name. Mobile assigned-cell bounds fit the viewport even while the remaining table columns scroll. Published mobile footer contains only Cancel and Review & Publish, both 40px; unpublished footer retains three 40px actions. Header remains 34px.
- Evidence: `/private/tmp/ads-store-assignment-desktop.png`, `/private/tmp/ads-store-assignment-mobile.png`, `/private/tmp/ads-published-actions-mobile.png`.
- 20 domain/directory tests passed, covering draft-save eligibility, partial occupancy, own-campaign targets, empty whole-store claims and release on stop. JavaScript syntax, static build and `git diff --check` passed; browser console had no errors. Publication reviews were cancelled and no campaign or assignment was changed by browser verification.
