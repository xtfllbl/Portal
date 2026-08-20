# Design QA — Terminal List Light Header

- Source visual truth: current user-message reference screenshot (light gray table-header crop; the chat attachment has no exposed filesystem path)
- Implementation screenshot: `/Users/beaver/Paywizard/模版资料/应用推送参数原型/terminal-header-light-qa.png`
- Viewport: desktop, 1920 × 797 CSS px, device scale factor 1
- State: L3 Agent `黄角湾城市代理` → `Terminal List`, default filters, no terminal selected
- Density normalization: source and implementation were reviewed at native desktop density; the focused header treatment was compared directly

## Full-view comparison evidence

The Terminal List keeps the existing layout, column widths, toolbar, rows, status indicators, and selection behavior. Only the table header changes from the dark surface to the requested light neutral surface.

## Focused comparison evidence

The rendered header uses `rgb(244, 245, 247)` with `rgb(75, 85, 99)` text, matching the reference's shallow gray background and dark gray labels. The header boundary remains a subtle gray divider and all labels remain legible without changing table density.

## Required fidelity surfaces

- Fonts and typography: existing family, uppercase labels, size, weight, letter spacing, and no-wrap behavior are preserved.
- Spacing and layout rhythm: header padding, column alignment, table radius, and row density are unchanged.
- Colors and visual tokens: the header now uses a light neutral background and dark neutral foreground as shown in the reference.
- Image quality and assets: no image or icon assets were added or replaced.
- Copy and content: all column labels and terminal data remain unchanged.

## Interaction verification

- Header and row select-all/individual checkboxes remain operable.
- Inventory selection and Transfer button behavior are unchanged.
- The table renders without clipping at the tested desktop viewport.
- Inline script syntax and tracked-file whitespace checks pass.

## Findings

No actionable P0, P1, or P2 visual differences remain for the requested table-header treatment.

## Comparison history

- Initial state: dark header was a P1 mismatch against the supplied light-header reference.
- Fix: added a page-scoped, high-specificity light header rule for `thead`, its row, and header cells.
- Post-fix evidence: browser-rendered header is light gray with dark gray text and preserves all existing geometry.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed
