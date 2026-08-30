# Design QA — Alerts rule modal layout unification

- Source visual truth: the user-provided Terminal Create Alert Rule screenshot and the accepted Alerts modal treatment
- Implementation screenshots: `/tmp/alert-rule-unified-terminal-2048.png`, `/tmp/alert-rule-unified-terminal-390-expanded.png`, `/tmp/alert-rule-unified-center-service-provider-1440.png`, `/tmp/alert-rule-unified-center-agent-1440.png`, `/tmp/alert-rule-unified-center-merchant-1440.png`, `/tmp/alert-rule-unified-center-store-1440.png`, and `/tmp/alert-rule-unified-center-store-390-expanded.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at `deviceScaleFactor: 1`

## Findings

No actionable P0, P1, or P2 issues remain. Terminal and Alert Center rule dialogs now share the same restrained single-page form language: plain functional section headings, a consistent 20 px section rhythm, 12 px field rhythm, 6 px label spacing, and 36 px controls with 8 px radii. Terminal fields use one meaningful column; Alert Center keeps two columns only where the visible Monitoring Range hierarchy benefits from them. Mobile states collapse cleanly without dialog or document-level horizontal overflow.

## Interaction and accessibility verification

- Numbered step markers and the visual Channels fieldset box are absent while the channel choices retain fieldset semantics through a screen-reader-only legend.
- Terminal SN remains next to the Condition heading on desktop and wraps naturally below it on mobile.
- External email recipient controls exist only while Email is selected. Temporarily disabling Email preserves in-dialog recipients, while saving without Email excludes them from the rule.
- Repeat frequency exists only while Repeat while Open is selected and returns to the same row on desktop or the following row on mobile.
- Empty validation and recipient containers consume no layout height; validation, target capability checks, editing, permissions, fixed footer actions, and existing `data-alert-*` interfaces remain intact.
- All four Alert Center role views expose only their permitted Monitoring Range fields and retain the established 860 px dialog width; Terminal retains 680 px.

## Verification

- Alerts E2E: 6/6 passed, including conditional Email and Repeat expansion, recipient preservation/removal, edit behavior, role ranges, and layout assertions.
- Screenshot QA: 6/6 passed, producing seven reviewed captures across Terminal and all four Alert Center roles.
- Alerts plus Terminal Type, DEX, and Product Map regression: 20/29 passed. The nine failures are the unchanged four DEX and five Product Map baseline failures; all Alerts and Terminal Type tests passed.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts Timeline simplification

- Source visual truth: the previously accepted Timeline capture in `/tmp/alerts-timeline-center-2048.png` and the user-approved simplified process plan
- Implementation screenshots: `/tmp/alerts-timeline-simple-center-2048.png`, `/tmp/alerts-timeline-simple-center-1440.png`, `/tmp/alerts-timeline-simple-center-390.png`, and `/tmp/alerts-timeline-simple-terminal-2048.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at `deviceScaleFactor: 1`
- Same-viewport comparison: `/tmp/alerts-timeline-simple-compare-2048.png`

## Findings

No actionable P0, P1, or P2 issues remain. The dialog now reads as one restrained process: a single text context line, a chronological neutral timeline, low-weight process actions, and one Close button in the fixed footer. Removing metadata icons, colored event symbols, the state pill, and the duplicated acknowledgement summary materially reduces visual competition. Desktop and mobile layouts remain within the viewport without document-level horizontal overflow.

## Interaction and accessibility verification

- Events render from Opened through the latest outcome; equal timestamps preserve their original write order.
- The latest event keeps a modest weight emphasis without a card, colored marker, or additional border.
- Run next monitoring check and Close incident remain functional text actions below the process. The fixed footer contains only Close.
- Progressive timestamps, automatic recovery, manual closure, permissions, Escape, focus restoration, post-check focus, and `aria-live` announcements remain unchanged.
- Timeline semantics remain an ordered list, event timestamps remain `<time>` elements, and the latest event remains programmatically focusable when the simulation action disappears.

## Verification

- Alerts E2E: 6/6 passed, including chronological order, compact metadata, action placement, lifecycle behavior, focus, and announcements.
- Screenshot QA: 4/4 passed across Alert Center desktop/mobile and Terminal desktop states.
- Alerts plus Terminal Type, DEX, and Product Map regression: 20/29 passed. The nine failures are the unchanged four DEX and five Product Map baseline failures; all Alerts and Terminal Type tests passed.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts tabs and Timeline redesign

- Source visual truth: the accepted Alerts table treatment and the previous incident-detail captures in `/tmp/alerts-lifecycle-detail-fixed-2048.png` and `/tmp/alerts-lifecycle-detail-390.png`
- Implementation screenshots: `/tmp/alerts-timeline-center-2048.png`, `/tmp/alerts-timeline-center-1440.png`, `/tmp/alerts-timeline-center-390.png`, and `/tmp/alerts-timeline-terminal-2048.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at `deviceScaleFactor: 1`
- Same-viewport comparisons: `/tmp/alerts-timeline-compare-2048.png` and `/tmp/alerts-timeline-compare-390.png`

## Findings

No actionable P0, P1, or P2 issues remain. Both Alerts surfaces now use the concise `Alerts` and `Rules` tabs. The redesigned Timeline replaces the three summary cards with compact inline metadata and presents a newest-first audit trail with event-specific Material Symbols, a neutral connector, right-aligned desktop times, and stacked mobile times. The dialog stays within every tested viewport and creates no document-level horizontal overflow.

## Comparison history

- Pass 1 found a P2 sample-data ordering issue: one resolved demo incident could render a recovery check later than its resolution because its fallback timestamp used the current prototype date.
- Fix: resolved samples now derive the recovery-check fallback from their stored recovery timestamp, while newly simulated checks retain strictly increasing one-minute timestamps.
- Pass 2 recaptured desktop and mobile states and confirmed correct ordering, density, modal bounds, and responsive wrapping.

## Interaction and accessibility verification

- Equal timestamps preserve actual write order in reverse, so the latest appended outcome appears first and Resolved precedes its triggering Recovery check.
- Opened, Acknowledged, Recovery check, Recovery reset, Resolved, and Manual closure use the approved event icons and distinct result colors without decorative cards or dividers.
- Consecutive prototype checks generate incrementing one-minute timestamps and refresh the Timeline immediately.
- After a check, focus remains on `Run next monitoring check`; when that action disappears, focus moves to the newest event. An `aria-live` region announces the result.
- Close Incident, Escape, dialog closing, permissions, and focus restoration retain their existing behavior.

## Verification

- Alerts E2E: 6/6 passed, including tab labels, event sorting, icon mapping, progressive timestamps, focus, and live announcements.
- Screenshot QA: 4/4 passed across Alert Center desktop/mobile and Terminal desktop states.
- Alerts plus Terminal Type, DEX, and Product Map regression: 20/29 passed. The nine failures are the unchanged four DEX and five Product Map baseline failures; all Alerts and Terminal Type tests passed.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts action icons and tooltips

- Source visual truth: the accepted compact 30 × 30 px Alerts action treatment and the prior captures in `/tmp/alerts-simplified-center-2048.png` and `/tmp/alerts-simplified-terminal-2048.png`
- Implementation screenshots: `/tmp/alerts-tooltips-center-2048.png`, `/tmp/alerts-tooltips-center-1440.png`, `/tmp/alerts-tooltips-center-390.png`, and `/tmp/alerts-tooltips-terminal-2048.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at `deviceScaleFactor: 1`
- Combined same-viewport comparisons: `/tmp/alerts-tooltips-compare-center.png` and `/tmp/alerts-tooltips-compare-terminal.png`

## Findings

No actionable P0, P1, or P2 issues remain. Close Incident now uses `stop_circle`, which is visually distinct from acknowledgement and Closed status. Hover and keyboard focus reveal an immediate, readable function label above or below the action; viewport clamping keeps it clear of desktop and mobile edges and the tooltip is not clipped by the table scroller.

## Interaction and accessibility verification

- Acknowledge, Close incident, View timeline, Pause, Resume, and Edit expose the shared custom Tooltip while preserving their `aria-label`, native `title`, keyboard focus, and existing `data-alert-*` behavior.
- Confirmed `task_alt` status icons are keyboard focusable and expose the acknowledgement actor and timestamp through the same Tooltip and `aria-describedby` relationship.
- Tooltip placement automatically switches above or below the target, remains within an 8 px viewport inset, follows scrolling/resizing, and restores the native title when hidden.
- Close Incident behavior, permissions, lifecycle semantics, modal validation, and 30 × 30 px button geometry are unchanged.

## Verification

- Alerts E2E: 6/6 passed, including hover/focus Tooltip text, placement bounds, `aria-describedby`, icon glyphs, action behavior, and status metadata.
- Screenshot QA: 4/4 passed across Alert Center desktop/mobile and Terminal desktop states.
- Alerts plus Terminal Type, DEX, and Product Map regression: 20/29 passed. The nine failures are the unchanged four DEX and five Product Map baseline failures; all Alerts and Terminal Type tests passed.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts state and table action simplification

- Source visual truth: the prior lifecycle captures in `/tmp/alerts-lifecycle-center-2048.png` and `/tmp/alerts-lifecycle-terminal-2048.png`, plus the accepted 30 × 30 px rule action treatment
- Implementation screenshots: `/tmp/alerts-simplified-center-2048.png`, `/tmp/alerts-simplified-center-1440.png`, `/tmp/alerts-simplified-center-390.png`, and `/tmp/alerts-simplified-terminal-2048.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at `deviceScaleFactor: 1`
- Combined comparisons: `/tmp/alerts-simplified-compare-center.png` and `/tmp/alerts-simplified-compare-terminal.png`

## Findings

No actionable P0, P1, or P2 issues remain. Removing the Acknowledgement column materially reduces table width. Confirmed incidents use a compact `task_alt` icon beside State, while Acknowledge, Close incident, and View timeline use consistent 30 × 30 px Material Symbols controls. Desktop rows remain easy to scan and mobile keeps wide data inside the existing local table scroller without document-level horizontal overflow.

## Interaction and data verification

- Visible Incident Monitoring State is limited to Active, Resolved, and Closed. Recovery checks continue in the background while the visible state remains Active.
- A normal check advances `Active → Active → Resolved`; an abnormal check keeps Active and resets the recovery count. Temperature rules retain their sustained recovery requirements.
- Historical `monitoringState: "Recovering"` records migrate to Active while preserving `recoveryHitCount`, `recoveryChecksRequired`, `nextChecks`, and timeline events.
- The acknowledgement filter and incident-detail acknowledgement data remain available. Confirmed-state icons include actor/time labels, and unconfirmed rows retain screen-reader-only status text.
- Event actions retain their permissions, data attributes, titles, keyboard behavior, and original ordering.

## Verification

- Alerts E2E: 6/6 passed.
- Alerts plus Terminal Type, DEX, and Product Map regression: 20/29 passed. The nine failures are the unchanged four DEX and five Product Map baseline failures; all Alerts and Terminal Type tests passed.
- Full E2E: 113/126 passed. The 13 failures are the unchanged four DEX, five Product Map, one Merchant Onboarding, and three Partner Information baseline failures; none target Alerts.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts incident lifecycle and sample data

- Source visual truth: Terminal Product Map in `/tmp/qa2-ref-productmap-2048.png`; Merchant Onboarding portal shell in `/tmp/qa2-ref-portal-2048.png`; the accepted compact Alerts modal and table treatment
- Implementation screenshots: `/tmp/alerts-lifecycle-terminal-2048.png`, `/tmp/alerts-lifecycle-center-2048.png`, `/tmp/alerts-lifecycle-center-1440.png`, `/tmp/alerts-lifecycle-center-390.png`, `/tmp/alerts-lifecycle-detail-fixed-2048.png`, `/tmp/alerts-lifecycle-detail-390.png`, `/tmp/alerts-lifecycle-close-2048.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at `deviceScaleFactor: 1`
- States: Terminal rules, Alert Center incidents and rules, event timeline, manual closure, and mobile incident details
- Full-view comparisons: `/tmp/alerts-lifecycle-compare-terminal.png` and `/tmp/alerts-lifecycle-compare-center.png`
- Focused icon comparison: `/tmp/alerts-lifecycle-compare-icons.png`

## Findings

No actionable P0, P1, or P2 issues remain. The Terminal and Alert Center rule rows render the same 30 × 30 px Material Symbols controls. The two-dimensional incident state remains legible in dense tables, while the event detail and manual-closure dialogs stay within the viewport at desktop and mobile sizes.

## Comparison history

- Pass 1 found a P2 footer defect: `Run next monitoring check` inherited the fixed 112 px footer-button width and wrapped to three lines.
- Fix: the monitoring-check action now uses a 184 px minimum on desktop; on mobile it takes a full row while `Close Incident` and `Close` share the following row.
- Pass 2 recaptured desktop and mobile incident details and confirmed the action labels, modal geometry, and fixed footer remain readable without horizontal document overflow.

## Interaction and data verification

- Acknowledgement is independent from monitoring state and does not convert an Active incident into a resolved state.
- Standard conditions remain Active until consecutive normal checks resolve them; an abnormal check resets recovery progress. Temperature rules use their configured sustained recovery duration.
- Manual closure requires a standard reason, requires a note for Other, records an audit timeline event, and remains distinct from system resolution while background recovery checks continue.
- Active incidents expose the prototype monitoring-check action; Resolved and recovery-confirmed Closed incidents do not.
- Fresh state contains exactly 12 stable rules and 24 stable incidents across the requested terminal/store/role distribution. Migration preserves user records, removes legacy `state` and `source`, and adds missing stable samples without replacing matching IDs.
- KPI is limited to Active Alerts and Active Rules; state and acknowledgement filters operate independently.

## Verification

- Alerts E2E: 6/6 passed.
- Alerts plus Terminal Type, DEX, and Product Map regression: 20/29 passed. The nine failures are the unchanged four DEX and five Product Map baseline failures; all Alerts and Terminal Type tests passed.
- Full E2E: 113/126 passed. The 13 failures are the unchanged four DEX, five Product Map, one Merchant Onboarding, and three Partner Information baseline failures; none target Alerts.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts role views and table simplification

- Source visual truth: portal shell in `/tmp/qa2-ref-portal-2048.png`; SLA Monitor Range in `/tmp/qa4-source-sla-modal-1440.png`; user-provided action, status, role-range, and Alert Center screenshots
- Implementation screenshots: `/tmp/qa5-alerts-provider-2048.png`, `/tmp/qa5-alerts-merchant-rules-1440.png`, `/tmp/qa5-alerts-merchant-modal-1440-final.png`, `/tmp/qa5-alerts-store-390.png`, `/tmp/qa5-alerts-store-modal-390.png`
- Viewports: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px; all captures use `deviceScaleFactor: 1`, so source and implementation comparisons are normalized at 1×
- States: Service Provider incident view, Merchant rule view and create dialog, Store incident view and create dialog
- Full-view comparison: `/tmp/qa5-compare-portal-provider-2048.png` (4096 × 1049, equal 2048 × 1049 halves)
- Focused range comparison: `/tmp/qa5-compare-range-1440-final.png` (2880 × 900, equal 1440 × 900 halves)

## Findings

No actionable P0, P1, or P2 issues remain. Typography, spacing, colors, native image assets, Material Symbols, and product copy remain aligned with the established portal and Alerts styles. The role switcher fits beside the primary action on desktop and becomes a full-width control above the primary action on mobile. Tables retain their own horizontal scroll region without creating document-level overflow.

## Comparison history

- Pass 1 found a P2 empty grid track in the Merchant Monitor Range: hiding the fixed Merchant field left Store at half width.
- Fix: Store now spans the full dialog grid whenever Merchant is injected by role context and therefore hidden.
- Pass 2 recaptured and recombined the same 1440 × 900 state; Monitor Scope, Store, and Terminal now share the same full-width rhythm with no empty track.

## Interaction and accessibility verification

- Four role/account options update the `role` query parameter, preserve the active tab, reset filters, and scope KPI, incident, rule, Store, and Terminal data.
- Monitoring Range exposes only permitted descendant fields for Service Provider, Agent, Merchant, and Store roles.
- Pause/Resume/Edit are 30 × 30 px Material Symbols buttons with `aria-label`, `title`, keyboard focus, and unchanged behavior.
- Status pills have no generated dot; Source is absent from filters, tables, details, search, and migrated storage.
- Chromium reported no page or console errors in the captured desktop and mobile states.

## Verification

- Alerts E2E: 5/5 passed.
- Alerts plus Terminal Type, DEX, and Product Map regression: 19/28 passed. The nine failures are the unchanged stale DEX/Product Map baseline expectations; all Alerts and Terminal Type tests passed.
- Full E2E: 112/125 passed. The 13 failures are the existing four DEX, five Product Map, one Merchant Onboarding, and three Partner Information baseline failures; none target Alerts.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

final result: passed

---

# Design QA — Alerts Monitoring Target refactor

- Source visual truth: Monitor Range in `32.sla_alert_rules.html`; the existing compact Alerts dialog treatment for field density and fixed actions
- Implementation: Terminal and Alert Center Create/Edit Alert Rule dialogs in `1.terminalmanage_nayax.html` and `39.customer_alerts.html`
- States reviewed: fixed Terminal target, incomplete Alert Center range, Merchant/Store/Terminal scopes, direct-provider agent, capability-supported and unsupported targets, historical unmatched target, and mobile dialog scrolling
- Viewports and density: 1440 × 900 and 390 × 844 CSS px at 1×; existing 2048 × 1049 page comparisons remain valid because the surrounding shells were not changed

## Comparison evidence

- SLA Monitor Range and final Alert Center dialog combined at the same viewport: `/tmp/qa4-compare-range-1440.png`
- Source capture: `/tmp/qa4-source-sla-modal-1440.png`
- Alert Center captures: `/tmp/qa4-center-modal-1440.png`, `/tmp/qa4-center-modal-390.png`
- Final Terminal captures: `/tmp/qa4-terminal-modal-1440-final.png`, `/tmp/qa4-terminal-modal-390-final.png`

The reference and implementation were combined before judgment. The Alert Center retains the SLA range hierarchy and two-column rhythm while using the existing Alerts step markers, compact fields, and fixed footer.

## Visual and interaction review

- Terminal dialogs no longer render a Monitoring Target field. The current SN is aligned with the condition-step title on desktop and wraps below it on mobile without becoming a second field.
- Alert Center starts with Service Provider, Agent, Monitor Scope, Merchant, Store, and Terminal. Merchant/Store/Terminal scopes progressively collapse downstream controls to All stores or All terminals.
- The center dialog is 860 px on desktop and a single scrollable column on mobile. The Terminal dialog remains 680 px. Both retain visible fixed footers and equal mobile actions.
- `Portal Alerts` is the only visible portal-channel name; the compatible stored value remains `Portal Inbox`.
- No subtitles or table-cell secondary lines were introduced. Capability coverage remains a visually hidden live status.
- Browser captures reported no document-level horizontal overflow and no page or console errors.

## Verification

- Alerts E2E: 5/5 passed, including hierarchy reset, all three scopes, dynamic Merchant capability aggregation, edit backfill, unknown historical targets, permissions, persistence, and responsive geometry.
- Alerts plus Terminal Type, DEX, and Product Map regression: 19/28 passed. The nine failures are the unchanged stale DEX/Product Map baseline expectations.
- Full E2E: 112/125 passed. The 13 failures are the same existing four DEX, five Product Map, one Merchant Onboarding, and three Partner Information baseline failures; none target Alerts.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

## Iteration history

- Pass 1: implemented the full cascade, target-scope persistence, reverse resolution, display-name compatibility, and responsive layouts.
- Pass 2: combined the SLA and Alerts captures and found that the generic step-number selector was also styling the SN context as a black circle.
- Pass 3: narrowed the selector to the first step span, recaptured desktop and mobile Terminal dialogs, and confirmed no remaining actionable P0, P1, or P2 defects.

## Findings

No actionable P0, P1, or P2 issues remain for the Monitoring Target refactor.

final result: passed

---

# Design QA — Alerts tab and notification refinement

- Source visual truth: Product Map in `1.terminalmanage_nayax.html` for Terminal content rhythm; DEX Settings for dialog geometry; `38.Merchant_onboard.html` for the portal shell
- Implementation: the Alerts tab in `1.terminalmanage_nayax.html`, `39.customer_alerts.html`, `styles/customer-alerts.css`, and `scripts/customer-alerts.js`
- States reviewed: Terminal incident tab, Terminal rule tab, Terminal Create Alert Rule dialog, central incident view, and central mobile dialog
- Viewports and density: 2048 × 1049, 1440 × 900, and 390 × 844 CSS px at 1×

## Comparison evidence

- Terminal Alerts against Product Map: `/tmp/qa3-compare-terminal-2048.png`
- Alert dialog against DEX Settings: `/tmp/qa3-compare-modal-1440.png`
- Alert Center against Merchant Onboarding: `/tmp/qa3-compare-center-2048.png`
- Mobile Alert Center against Merchant Onboarding: `/tmp/qa3-compare-center-390.png`
- Final implementation captures: `/tmp/qa3-terminal-incidents-2048.png`, `/tmp/qa3-terminal-rules-1440.png`, `/tmp/qa3-terminal-modal-1440.png`, `/tmp/qa3-center-2048.png`, `/tmp/qa3-center-390.png`, `/tmp/qa3-center-modal-390.png`

The source and implementation captures were combined at matching viewport sizes before judgment. The focused dialog comparison verifies density, control alignment, footer geometry, and the removal of the portal-user row.

## Visual and interaction review

- Open Alert Center now has no underline in default, visited, hover, or focus states and retains the Product Map secondary-button geometry.
- Terminal incidents and rules are mutually exclusive Tab panels. The active Tab uses the existing Alerts tab treatment, while the table remains the only bordered data surface.
- The Terminal incident table no longer exposes the organization/source column. The central page preserves provenance with shorter account, service-provider, and platform labels while retaining the original stored values for filtering.
- The verified portal-user selector and Add portal user action are absent from both dialogs. Portal Inbox now targets the role account inbox directly; Email continues to require and validate an external recipient.
- Dialog width is 680 px on desktop; its header, body gaps, controls, channels, and recipient action are more compact. Desktop footer actions remain 112 × 36 px and mobile footer actions remain equal width.
- Rule creation/editing, permission checks, capability-disabled Save, incident acknowledgement, timeline, shared state, filtering, Escape, and focus restoration remain functional.
- No document-level horizontal overflow was observed at 390 px. Browser capture reported no page or console errors.

## Verification

- Alerts E2E: 4/4 passed.
- Alerts plus Terminal Type regression: 8/8 passed.
- Static checks: `node --check scripts/customer-alerts.js` and `git diff --check` passed.

## Iteration history

- Pass 1: removed the link underline, introduced Terminal incident/rule Tabs, removed the user-specific Portal Inbox controls, and compacted the dialog.
- Pass 2: reviewed matching combined captures, shortened central provenance labels, removed Terminal provenance, and confirmed no remaining actionable P0, P1, or P2 visual defects.

## Findings

No actionable P0, P1, or P2 issues remain for this refinement.

final result: passed

---

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
