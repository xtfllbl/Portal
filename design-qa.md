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
