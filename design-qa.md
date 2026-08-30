# Design QA — Merchant Terminal Pre-binding

- Source visual truth: `artifacts/tci-binding/replace-terminal-desktop.png` and the existing Merchant Detail settings menu
- Implementation reference: `artifacts/tci-binding/assign-terminal-desktop.png`
- Pages: `5.merchant_detail_iso.html`, `5.merchant_device_settings_iso.html`
- States reviewed: unbound saved configuration, inline validation, assigned/Pending state, binding history
- Viewports: desktop and 390 × 844 CSS px

## Visual fidelity

Assign Terminal reuses the established binding-dialog header, close control, summary card, form fields, deployment options, overlay, and action footer. Its information hierarchy matches Replace Terminal while removing replacement-only fields. The unbound-row menu adds Assign Terminal immediately after Edit Params; bound rows continue to expose Replace Terminal and Unassign Terminal.

## Responsive verification

- The Assign Terminal dialog stays fully inside the 390 px viewport with zero document-level horizontal overflow.
- Summary fields collapse to one column and the form body scrolls independently when needed.
- The primary Assign & Deploy action remains visible in the footer.
- Close, Cancel, Escape, overlay dismissal, labels, and keyboard focus remain usable.

## Interaction verification

- Unbound configurations expose Assign Terminal and Binding History while hiding Replace Terminal and Unassign Terminal.
- Empty and case-/whitespace-normalized duplicate S/N values produce inline errors.
- Successful assignment preserves TCI, store, Terminal Name, model, and configuration; it updates the row to Pending / Offline and changes the menu to Replace/Unassign.
- Merchant Detail and Device Settings write the same `pw_device_sn_assignments` binding and `pw_device_binding_history` Assigned record.
- Assignment, Terminal Name migration, deployment selections, status, and history survive reload.
- Delete Device, Replace Terminal, Unassign Terminal, Binding History, and OPC status behavior remain covered.
- Scoped Chromium regression: 11 passed.

## Findings

No actionable P0, P1, or P2 issues remain for this feature.

final result: passed

---

# Design QA — Alerts second visual simplification

- Source visual truth: Product Map in `1.terminalmanage_nayax.html` for the terminal content rhythm; `38.Merchant_onboard.html` for the portal shell; DEX Settings for dialog geometry
- Implementation: the Alerts tab in `1.terminalmanage_nayax.html` and `39.customer_alerts.html`
- States reviewed: Terminal incident/rule lists, central incident/rule lists, desktop Create Alert Rule dialog, mobile Create Alert Rule dialog, capability-supported and capability-unsupported targets
- Viewports and density: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at 1×

## Comparison evidence

- Terminal against Product Map: `/tmp/qa2-compare-terminal-2048.png`
- Alert Center against Merchant Onboarding: `/tmp/qa2-compare-portal-2048.png`
- Alert dialog against DEX Settings: `/tmp/qa2-compare-modal-1440.png`
- Mobile Alert Center against Merchant Onboarding: `/tmp/qa2-compare-mobile-390.png`
- Focused final mobile dialog: `/tmp/qa2-impl-center-modal-390.png`
- Source captures: `/tmp/qa2-ref-productmap-2048.png`, `/tmp/qa2-ref-portal-2048.png`, `/tmp/qa2-ref-dex-modal-1440.png`, `/tmp/qa2-ref-portal-390.png`
- Implementation captures: `/tmp/qa2-impl-terminal-2048.png`, `/tmp/qa2-impl-center-2048.png`, `/tmp/qa2-impl-alert-modal-1440.png`, `/tmp/qa2-impl-center-390.png`, `/tmp/qa2-impl-center-modal-390.png`

The source and implementation captures were combined at identical viewport and state before judgment. The modal comparison and mobile modal capture are the focused evidence for field alignment, footer-button geometry, and viewport containment.

## Visual review

- Terminal Alerts has no command-bar divider and no visible section-panel border, radius, background, or padding. Only each data table retains its standard boundary.
- Create Alert Rule and Open Alert Center share the Product Map secondary-button geometry and sit together in the command bar. The link target remains `39.customer_alerts.html?view=incidents`.
- Visible Incidents and Alert Rules use a single title plus a one-line table row structure. Terminal rows no longer render secondary lines.
- The central page has no title note, KPI notes, section notes, table-cell subtitles, or dialog helper subtitles. Target is a dedicated column; opened time and duration share one line.
- Numeric units are part of field labels. Capability coverage is preserved as visually hidden `aria-live` content and still disables Save Rule for unsupported targets.
- The timeline evidence is normal business body copy, rather than subtitle styling.
- Desktop dialog footer buttons remain 112 × 36 px, inline recipient controls remain 38 px high, and mobile actions remain equal width.
- No document-level horizontal overflow or dialog viewport overflow was observed at the three tested viewport sizes. Browser capture reported no page or console errors.

## Interaction and regression verification

- Alerts directed E2E: 4/4 passed, covering creation, shared state, pause, acknowledgement, filtering, timeline, permissions, capability-disabled save, exact geometry, and mobile overflow.
- Related directed E2E: 18/27 passed. Alerts and Terminal Type passed; the nine failures are the existing stale DEX/Product Map expectations and match the prior baseline.
- Full E2E: 111/124 passed. The 13 failures are the existing four DEX, five Product Map, one Merchant Onboarding, and three Partner Information baseline failures; none target Alerts or the changed Alerts selectors.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

## Iteration history

- Pass 1: removed the extra Terminal divider and panel styling, moved Open Alert Center into the command bar, flattened table content, and removed visible helper copy.
- Pass 2: combined the source and implementation screenshots, found the now-empty visible coverage step in the dialog, removed it, renumbered the remaining notification step, and recaptured the focused dialog evidence.
- Pass 3: compared the final desktop and mobile dialog captures and found no remaining actionable P0, P1, or P2 visual defects.

## Findings

No actionable P0, P1, or P2 issues remain for the Alerts second visual simplification.

final result: passed

---

# Design QA — Customer Alerts visual correction

- Source visual truth: `38.Merchant_onboard.html` for the portal shell; the DEX and Product Map views in `1.terminalmanage_nayax.html` for terminal content and dialog treatment
- Implementation: `39.customer_alerts.html` and the Alerts tab in `1.terminalmanage_nayax.html`
- States reviewed: default incident view, alert-rule view, Create Alert Rule dialog, filters, responsive navigation, and horizontally scrollable data tables
- Viewports and density: 2048 × 1049 CSS px at 1× for desktop comparison; 1440 × 900 CSS px at 1× for dialog comparison; 390 × 844 CSS px at 1× for mobile comparison

## Comparison evidence

- Full portal comparison: `/tmp/qa-compare-portal-desktop.png`
- Full terminal comparison against DEX: `/tmp/qa-compare-terminal-desktop.png`
- Full terminal comparison against Product Map: `/tmp/qa-compare-productmap-terminal.png`
- Focused dialog-state comparison: `/tmp/qa-compare-modals.png`
- Full mobile portal comparison: `/tmp/qa-compare-mobile.png`
- Reference captures: `/tmp/qa-ref-38-desktop.png`, `/tmp/qa-ref-dex-desktop.png`, `/tmp/qa-ref-productmap-desktop.png`, `/tmp/qa-ref-dex-modal.png`, `/tmp/qa-ref-38-mobile.png`
- Implementation captures: `/tmp/qa-impl-39-desktop.png`, `/tmp/qa-impl-terminal-desktop.png`, `/tmp/qa-impl-terminal-modal.png`, `/tmp/qa-impl-center-modal.png`, `/tmp/qa-impl-39-mobile.png`

The source and implementation captures were combined at matching viewport/state before judging differences. The dialog comparison is the focused-region evidence because it preserves control sizing, footer alignment, and scroll-area geometry at readable scale.

## Five-surface review

- Typography: the central Alerts page uses the same Poppins hierarchy and weights as Merchant Onboarding; Terminal Alerts continues to inherit the terminal shell typography.
- Spacing and geometry: the portal sidebar, top bar, panel inset, KPI grid, filter toolbar, terminal command bar, and independent table panels follow their reference layouts. Desktop dialog footer controls measure 112 × 36 px; inline recipient controls measure 38 px high.
- Color and elevation: the portal uses the existing white/blue shell, compact black CTA, soft gray surfaces, and black table headers; Terminal Alerts uses the existing DEX light panel/table treatment.
- Assets: the portal uses `assets/paywizard-logo.png`; terminal actions and dialogs use the repository's `add-box.svg` and `close.svg` assets or the existing Material Symbols library. No text glyphs, emoji, or handcrafted SVG substitutes were introduced.
- Copy and state: the Alerts title, role guidance, incident/rule states, sample data, permissions, and existing `data-alert-*` interaction hooks remain intact.

## Interaction and responsive verification

- Rule creation, editing, pausing, incident acknowledgement, timeline display, filtering, permission-disabled save, Escape handling, and focus restoration retain their existing JavaScript interfaces.
- The page has no document-level horizontal overflow at the tested desktop and mobile widths. Data tables scroll within their panels on narrow screens.
- The desktop CTA remains compact; the filter toolbar wraps by breakpoint; dialogs stay within the viewport and scroll only their bodies.
- On mobile, dialog footer actions become equal-width controls and the portal shell follows the Merchant Onboarding responsive pattern.
- Browser capture reported no page errors or console errors in the reviewed states.
- Alerts regression: 4/4 passed, including rule/incident behavior, permissions, shared state, responsive geometry, modal bounds, and exact control sizing.
- Directed regression: 18/27 passed. All Alerts and Terminal Type tests passed; the nine failures are stale DEX/Product Map expectations for controls already absent from the current prototype and outside this visual-only change.
- Full E2E: 111/124 passed. The same DEX/Product Map failures recur with four unrelated Merchant Onboarding/Partner Information baseline failures; none target Alerts or the modified Alerts selectors.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

## Iteration history

- Pass 1: compared the implemented portal, terminal tab, desktop dialogs, and mobile portal with their matching references. No actionable P0, P1, or P2 visual differences remained, so no additional visual correction loop was required.

## Findings

No actionable P0, P1, or P2 issues remain for the Alerts visual correction.

final result: passed
