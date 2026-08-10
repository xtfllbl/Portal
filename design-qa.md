# Product Map Templates — Unified Table QA

## Evidence

- Source visual truth: `assets/qa/qa-product-map-template-management.png` (existing six-column product template table) plus the user's instruction to keep both template types visually consistent.
- Implementation screenshot: `assets/qa/qa-product-map-template-unified-table.png`
- Full-view comparison: `assets/qa/qa-product-map-template-unified-table-comparison.png`
- Source pixels: 2048 × 1054; normalized to 1710 × 879 for comparison.
- Implementation pixels / CSS viewport: 1710 × 879 at device scale factor 1.
- State: desktop, parameters-only template selected, eight BIN rows.
- Focused region: not required; the full-view comparison keeps all six headers and row values legible.

## Findings

- No actionable P0, P1, or P2 findings.
- **Layout and spacing:** Both template types use the same six-column table, header height, row height, borders, and column alignment. There is no card grid or explanatory block changing the page density.
- **Typography:** Existing Segoe UI/Helvetica/Arial stack, weights, sizes, capitalization, and hierarchy are unchanged.
- **Colors and tokens:** Existing neutral table surface, borders, muted headers, and foreground colors are unchanged.
- **Image quality:** Not applicable; the table contains no visual assets.
- **Copy and content:** Product, Product Group, and Price remain visible as column headers. Parameters-only rows display `—` in those three cells; PA Code, MDB Code, and PAR retain their stored values. No scope badge or additional message is shown.
- **Overflow:** No horizontal page overflow at the checked desktop viewport.

## Functional checks

- Parameters-only save/render focused Playwright test: passed.
- Verified six headers, eight rows, `—` placeholders, preserved PA/MDB/PAR values, and absence of `0.00`.
- Verified the card grid and parameters-only note are no longer rendered.
- The shared row renderer continues to display saved product snapshots and formatted prices when those values exist.
- Primary navigation and template selection rendered without an application page exception during browser inspection.

## Comparison history

1. The parameters-only view initially retained blank product cells and a misleading `0.00` price.
2. A three-column table and scope badge were introduced, but were rejected because the table felt sparse and the badge wording was undesirable.
3. A BIN card grid was explored, but was more complex than needed.
4. Final implementation restores one consistent six-column table for all templates and uses `—` only where product data was intentionally not saved.

## Result

final result: passed
