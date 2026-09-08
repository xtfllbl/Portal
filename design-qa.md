# Rule Owner form QA

final result: passed

Target: docs/design/rule-owner/form-revision/design-1.png (latest selected option 1).
Implementation: 39.customer_alerts.html?role=operations-manager.
Evidence: artifacts/owner-form-desktop.png and artifacts/owner-form-mobile.png.

Compared source and rendered Store-selection state with Harbor Market and the Store menu open. The reference is a modal-only image; the desktop capture includes the surrounding portal. Modal widths differ by display scale. Single-column layout, underlined fields, internal dropdown search, disabled Continue and fixed action footer match the chosen structure.

Initial P2: shared portal styles overrode field label sizes and the Owner Level underline. Fixed with scoped overrides; post-fix desktop and mobile captures inspected. At shorter viewport heights menu rows scroll instead of obscuring the footer.

Browser checks: 1/2/3/4 fields appear immediately for SP/AGT/MCH/STR, downstream controls disabled; 20 service-provider choices; search and selection through Direct merchants / Harbor Market / Riverside; owner passed to rule form; Change restores selections; changing SP clears downstream values and disables Continue. At 390x844 both footer actions measure 40px and remain within viewport; no horizontal document overflow.

Build and JavaScript syntax checks passed. The updated Playwright regression test was not run in this turn; browser interaction checks above were executed through the Browser runtime.

No outstanding P0/P1/P2 findings. P3: reference font is approximated with the existing portal font, and compact viewports display fewer menu rows at once.

## Dropdown layout correction

Previous QA missed that menus participated in document flow and expanded the modal. Corrected to a fixed-position floating menu anchored to its trigger, with viewport bounds, upward opening when space below is insufficient, resize/scroll repositioning, and internal list scrolling. Removed popup scrollIntoView.

Browser verification after viewport layout settled: desktop modal and footer bounding rectangles are exactly identical before/after opening (modal 720 x 313.796875). Mobile at 390 x 844 also has identical before/after modal and footer rectangles; both actions remain 40px high. Search and selection still enable Continue. An initial mobile measurement raced viewport resizing; repeated measurements after layout settled matched exactly. Build and diff checks passed. Regression assertion added for modal/footer geometry; CLI test suite not run in this turn.


## Actual-height positioning and shared modal styling

Implemented the approved correction: use shared modal labels, inputs, spacing, borders and action buttons; remove underline and size overrides. Popup measured at trigger width before choosing direction, remeasured after constraining height; top placement anchors actual bottom 4px above trigger. Search rerenders reposition immediately. Window/visual viewport resize and scrolling reposition; offscreen triggers close their popup.

Verified the reported Baltic Payment Hub / Madrid Retail Agency / Oak & Bean West single-result case in Chrome: popup sits directly above Merchant rather than leaving a 300px gap. Automated picker checks passed at 1440x900 and 390x844 for all four owner levels, zero/one/many result transitions, 4px gaps, equal widths, unchanged modal/footer geometry and 36px action buttons. Existing owner selection, restoration and reset test passed.

Full Customer Alerts suite: 17 passed, 2 failed. Failures: terminal SN text assertion at tests/customer-alerts.spec.js:222; role-scoped rule-save workflow did not close the rule modal at line 649. These are outside the dropdown positioning checks and remain unresolved. No claim of a fully passing suite. Build and JavaScript syntax passed.
