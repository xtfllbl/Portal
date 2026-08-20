# Product Design QA

- Source visual truth: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-ac6f7577-5122-497c-845f-1f7e2389370e.png`
- Focused table reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-4778c42a-60ba-41a9-9ec8-3aef2beb3d7b.png`
- Quick-add reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-a5896a35-beb6-4ffc-ae98-4e7c02574e9f.png`
- Filter-popover reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-f9169311-4061-44cc-8fed-7d34de8a7a0d.png`
- TCI/lifecycle reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-d41cb917-5b47-48e8-9893-ff460b2f08a6.png`
- Wide-table source visual: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-aac85220-c84d-44fa-b83d-14b507edaa23.png`
- Duplicate-scrollbar defect reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-d763f588-b2da-4138-ba47-662c257b19d9.png`
- Bottom-transition defect reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-87112e52-8dfe-45be-86ce-d70598f69590.png`
- Missing-bottom-control defect reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-ccd96235-0781-47e4-98c3-1a7ec03a6392.png`
- Table-density reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-c6721b29-6d07-48d0-a41e-4bde79c14762.png`
- INACT color reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-1c2a9bf6-dd87-4877-89b4-5d33e1266074.png`
- Horizontal-density reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-1f8de1d6-7966-450b-a295-60a6cd3c6cb8.png`
- Floating-scroll interaction reference: `12.transaction_list.html`
- Implementation: `2.resellermerchantterminal.html`
- Implementation screenshot: `/tmp/terminal-management-compact-1920x853.png`
- Full comparison: `/tmp/terminal-management-reference-vs-compact.png`
- Focused table comparison: `/tmp/terminal-table-header-reference-vs-compact.png`
- Quick-add comparison: `/tmp/terminal-quick-add-reference-vs-compact.png`
- Filter-popover comparison: `/tmp/terminal-filter-reference-vs-compact.png`
- TCI/lifecycle implementation: `/tmp/terminal-tci-lifecycle-table.png`
- TCI/lifecycle comparison: `/tmp/terminal-tci-lifecycle-reference-vs-implementation.png`
- Floating-scroll implementation screenshot: `/tmp/reseller-terminal-floating-scrollbar-1920x853.png`
- Floating-scroll full comparison: `/tmp/terminal-floating-scrollbar-comparison.png`
- Floating-scroll focused comparison: `/tmp/terminal-floating-scrollbar-focused-comparison.png`
- Adapted floating-scroll screenshot: `/tmp/reseller-terminal-floating-adapted-1920x853.png`
- Native-scroll-visible implementation state: `/tmp/reseller-terminal-native-scroll-visible-2556x853.png`
- Duplicate-scrollbar adaptation comparison: `/tmp/reseller-terminal-scrollbar-adaptation-comparison.png`
- Bottom-transition implementation: `/tmp/reseller-terminal-bottom-switch-1282x379.png`
- Bottom-transition comparison: `/tmp/reseller-terminal-bottom-switch-comparison.png`
- Inline-scroll implementation: `/tmp/reseller-terminal-inline-scroll-bottom-1920x853.png`
- Inline-scroll focused implementation: `/tmp/reseller-terminal-inline-bottom-1258x410.png`
- Inline-scroll comparison: `/tmp/reseller-terminal-inline-scrollbar-comparison.png`
- Compact-table implementation: `/tmp/reseller-terminal-compact-table.png`
- Compact-table comparison: `/tmp/reseller-terminal-compact-comparison.png`
- Gray-INACT implementation: `/tmp/reseller-terminal-inact-gray.png`
- Gray-INACT comparison: `/tmp/reseller-terminal-inact-gray-comparison.png`
- Horizontal-density implementation: `/tmp/reseller-terminal-horizontal-density.png`
- Horizontal-density comparison: `/tmp/reseller-terminal-horizontal-density-comparison.png`
- Merchant Detail OPC reference: `/var/folders/90/1k3tg5152wz0c3mwwscb01tw0000gn/T/codex-clipboard-6320b411-3fae-4278-a446-fc9db7abe8e0.png`
- Merchant Detail OPC implementation: `/tmp/merchant-detail-opc-dot-1920x853.png`
- Merchant Detail OPC focused implementation: `/tmp/merchant-detail-opc-dot-focused.png`
- Merchant Detail OPC comparison: `/tmp/merchant-detail-opc-comparison.png`
- Viewport: 1920 × 853 CSS px, device scale factor 1.
- Source pixels: 3840 × 1706 px, normalized from 2× to the 1920 × 853 implementation viewport.
- State: Service Provider `wizarpos`, Terminal List active, filters closed, first table page.

## Comparison result

The main content now uses the unified shell at an appropriately denser scale. The entity tree is 320 px wide and independently scrollable, the hero is 88 px high, statistic cards are 66 px high, and the table header is 36 px high. The right detail panel starts at the same vertical position as the entity tree and no longer inherits the table's full height.

The Terminal List header now matches the supplied light-header reference: `#f5f5f6` background, `#555862` text, a neutral 1 px bottom border, and 11 px semibold labels. Its rendered height is 34 px. Device Service and Payment Service remain centered in approximately 112 px columns; Payment Service has no text overflow.

The quick-add menu and filter popover now use the same compact scale. The quick-add menu is 168 px wide with 12 px single-line actions and no horizontal overflow. The filter popover is 460 × 154 px at desktop size, with 36 px controls and 12 px labels; it switches to one column on phones.

The TID column is now TCI and contains nine stable `TC########` identifiers for all ACTIVE and ASSIGNED rows. The lifecycle column shows seven green ACTIVE, two blue ASSIGNED, and six orange INACT labels while preserving the reference table density and alignment.

The wide Terminal List now uses two synchronized controls for the same `.table-wrapper` horizontal range: a page-specific 10 px floating scrollbar while the table bottom is below the fold, and an 18 px inline control embedded between the final row and pagination at table bottom. The inline control is always rendered and clickable, avoiding reliance on operating-system scrollbars that may auto-hide. The floating control disappears as soon as the inline control enters the content viewport, when the table is not active, or when a coarse-pointer/mobile layout is used.

## Fidelity surfaces

- Typography: Existing Poppins family and hierarchy are preserved; only the requested content-area scales were reduced.
- Spacing: Workspace padding is 16 px, primary gap is 12 px, and the entity/detail column gap is 14 px.
- Colors: The table header uses the requested neutral light palette. The adapted floating scrollbar uses a low-contrast `#dfe3e9` track and `#a6afbd` thumb without the transaction page's heavy white halo. ACTIVE remains green, ASSIGNED remains blue, and INACT now uses neutral gray text `#667085`, background `#f2f4f7`, and border `#d0d5dd`; inventory-only rows use `#fafafa` rather than a warm tint.
- Assets: The existing PAYwizard logo and Material Symbols remain unchanged; no new visual assets were introduced.
- Copy and data: TCI, ACTIVE, ASSIGNED, and INACT use the requested terminology. Terminal identifiers, status metadata, service rules, and accessibility attributes are internally consistent.

## Interaction and runtime checks

- Status filters return 7 ACTIVE, 2 ASSIGNED, and 6 INACT rows; Reset restores all 15 rows.
- TCI filtering combines with Model and returns the expected `TC33000052` record.
- TMS Sync enters loading state and returns to a refreshed `Last sync` label.
- INACT Bind modal and assigned/active terminal navigation remain operational.
- Device statuses remain 11 Online / 4 Offline; Payment statuses are 5 Online / 10 Offline under the refined lifecycle rule.
- Automated responsive checks pass at 1920 × 853, 1040 × 900, and 390 × 844.
- The document has no page-level horizontal overflow; the 1440 px terminal table scrolls only inside `.table-wrapper`.
- Table rows render at 45 px including the separator, down from the previous 50 px rhythm; cell padding is 5 px × 8 px, pagination is 54 px high, and the active page control is 38 px square.
- Both floating and inline scrollbars support thumb/track pointer input plus Arrow, Shift+Arrow, Home, and End keys; both ARIA ranges stay synchronized with `.table-wrapper.scrollLeft`.
- At 1920 × 853 it sits 8 px above the content viewport bottom and exactly matches the table viewport's x-position and width. It remains available at the 1040 px desktop breakpoint and is hidden at 390 px/coarse-pointer layouts.
- Scrolling the real `.pw-device-content` container to the table bottom hides the floating control and reveals the inline scrollbar directly above pagination, preventing duplicate or missing controls.
- The handoff now occurs when `#terminalInlineHScroll` crosses the content viewport boundary. Its 1208 px track mirrors the same 602 px range as the floating control and remains fully clickable at the bottom.
- Browser and Playwright checks reported no console or page-script errors.
- Quick-add and filter open-state captures show no clipping, text wrapping, or document overflow.

## Comparison history

- Initial reference review: the legacy content scale was visibly oversized inside the new unified shell, the entity column was too wide, and the dark table header conflicted with the supplied light-header target.
- Post-fix review: the frame was reduced by roughly 15–20%, the hierarchy and detail panel now align at the top, the header is light and compact, and no P0, P1, or P2 visual issue remains.
- Popup follow-up: the legacy 560 px filter and oversized quick-add actions were reduced to the current page scale; same-state side-by-side comparisons show the requested density correction without changing behavior.
- TCI/lifecycle follow-up: the focused comparison confirms the new identifier column and three lifecycle labels fit the existing 50 px row rhythm without clipping or crowding. No P0, P1, or P2 issue remains.
- Floating-scroll follow-up: the source showed a wide table whose native horizontal control was far below the visible rows. The revised same-viewport capture adds a low-contrast floating control at the visible table edge; full and focused comparisons confirm correct alignment without obscuring row content. Pointer, keyboard, ARIA, tab-state, responsive, and overflow checks pass. No P0, P1, or P2 issue remains.
- Adaptation correction: the first implementation listened to `.workspace`, but this page actually scrolls through `.pw-device-content`; that P1 mismatch left the floating control visible beside the native scrollbar. The corrected build uses the real scroll viewport for visibility, clipping, horizontal bounds, and bottom positioning. The normalized 1278 × 242 comparison shows the supplied double-scrollbar state above and the corrected single-control state below. The control was also reduced from 14 px to 10 px and its focus treatment changed from a large outline to a subtle 1 px ring. No P0, P1, or P2 issue remains.
- Bottom-transition intermediate correction: a follow-up capture showed the floating control still overlapping the first visible portion of pagination. Switching on `.terminal-pagination` visibility removed that overlap in the 1282 × 379 comparison, but a later capture showed that relying on the browser-native scrollbar could still leave no persistent mouse control; the following correction supersedes this intermediate behavior.
- Missing-control correction: the next bottom-state capture exposed a P1 usability gap: macOS could hide the browser-native scrollbar after the floating control disappeared, leaving no mouse-operable horizontal control. The final implementation adds `#terminalInlineHScroll` between the rows and pagination, hides the inconsistent browser-native track, and synchronizes the inline and floating thumbs to the same table scroll position. The normalized 1258 × 410 comparison shows the missing control in the source and the persistent inline track in the corrected state. Pointer click, drag/track math, keyboard navigation, ARIA values, and float-to-inline handoff are covered. No P0, P1, or P2 issue remains.
- Density follow-up: the supplied table crop showed excessive vertical whitespace. Data rows were reduced from a 50 px to a 45 px rendered rhythm, the header to 34 px, and pagination to 54 px. A later annotated crop showed that the remaining issue was horizontal column allocation rather than row density; the table minimum width is now 1440 px (down from 1810 px originally), with SN 175 px, Terminal Name 195 px, TCI 95 px, Model 82 px, Status 100 px, and service columns 112 px each. The normalized same-size comparison confirms materially smaller inter-column gaps without clipped headers, crowded values, or changes to the floating/inline scrollbar behavior. No P0, P1, or P2 issue remains.
- INACT color follow-up: the focused side-by-side comparison confirms that only the INACT lifecycle treatment changed from orange to a neutral gray palette. ACTIVE and ASSIGNED retain their established green and blue semantics, while all six INACT labels remain legible and aligned on neutral inventory rows. No P0, P1, or P2 issue remains.

## Merchant Detail OPC status consistency

- The `Payment Services` header is standardized to singular `Payment Service`, matching the other terminal lists.
- All 19 device rows use centered 10 px service dots: Online is `#22c55e` with a subtle green ring, while Offline is `#ef4444` with a subtle red ring.
- The repeated Online/Offline pills and visible status words have been removed. The focused same-scale comparison shows the previous pills on the left and the shared dot treatment on the right.
- Every status retains `.online` or `.offline`, `.payment`, `data-service="payment"`, `data-service-status`, `title`, `role="img"`, and a full `aria-label`.
- Static rows and dynamically created rows use the same factory contract. Automated checks found 19 device rows and 19 status dots, including both online and offline states, with no console or page-script errors.
- The full merchant administration navigation regression suite passed at desktop, tablet, and mobile sizes. No P0, P1, or P2 visual issue remains.

final result: passed
