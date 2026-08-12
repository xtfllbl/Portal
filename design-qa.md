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
