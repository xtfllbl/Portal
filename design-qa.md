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
