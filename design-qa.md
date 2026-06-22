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
