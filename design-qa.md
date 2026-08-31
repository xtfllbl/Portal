# Shared Sidebar Navigation Design QA

## Evidence

- Source visual truth: the five user-attached sidebar reference screenshots in this conversation; the attachment surface does not expose local filesystem paths.
- Source pixels: 558 × 1626, 462 × 260, 549 × 580, 504 × 479, and 496 × 790.
- Implementation: `artifacts/sidebar-prepaid-expanded-2026-08-31.jpg`, `artifacts/sidebar-user-expanded-2026-08-31.jpg`, and `artifacts/sidebar-settings-expanded-2026-08-31.jpg`.
- Implementation pixels / CSS size: each focused sidebar capture is 264 × 920 at a 1710 × 952 browser viewport; the browser-reported device scale factor is 2 and the capture API normalized output to CSS pixels.
- Compared states: Prepaid Cards expanded with Card List selected; User Management expanded with Appeals hovered; Settings expanded with its existing children unchanged.
- Combined comparison input: the attached source screenshots and browser-rendered sidebar captures were opened in the active visual review context.

## Findings

No actionable P0, P1, or P2 differences remain for the requested sidebar unification.

- Fonts and typography: every primary menu label renders at the same Poppins 700 weight. Submenu labels retain a consistent smaller hierarchy, and no menu item renders an underline in default, hover, focus, visited, or selected states.
- Spacing and layout rhythm: all primary items share the same 47 px minimum height, padding, 8 px radius, icon alignment, and four-pixel navigation rhythm. Expanded submenus follow the existing shared-shell indentation and circular marker treatment without horizontal overflow.
- Colors and visual tokens: primary and unavailable destinations use the same dark foreground. Hover uses one `#f3f3f4` background, while the current module and destination use the existing dark active token with white foreground.
- Image and icon fidelity: the repository PAYwizard logo remains unchanged and Material Symbols supplies the menu icons. No placeholder or newly fabricated assets were introduced.
- Copy and content: Prepaid Cards contains Card List, Activation, Balance Adjustment, and Loss & Replacement, mapped to pages 14–17. User Management contains User List, Role Management, and Appeals without false links. The Settings submenu remains unchanged.

## Focused Comparison

The sidebar itself is the complete requested component, so each 264 × 920 implementation capture is both the full target view and the focused comparison. Additional page-content crops would not add evidence for typography, menu hierarchy, hover, or selected-state fidelity.

## Comparison History

1. Initial implementation captures showed the Prepaid, User Management, and Settings expanded states with consistent primary typography and interaction styling.
2. No P0/P1/P2 visual mismatch was found, so no visual correction loop was required.

## Functional Verification

- Opened Prepaid Cards, User Management, and Settings in the browser and verified their expanded state and content.
- Verified Card List is selected on page 14 and Card Details; pages 15–17 select their matching submenu destination.
- Verified unavailable destinations remain dark, show the shared hover treatment, and do not navigate.
- Verified Settings still contains SLA Alerts, Alerts, Branding, Service Providers, Payment Channels, Application Parameters, Products, and Product Map Templates.
- Browser console warnings/errors checked: none. Document horizontal overflow: 0 px.
- Automated result: all 12 shared platform-shell tests passed across 47 back-office pages and responsive breakpoints.

## Final Result

final result: passed

---

# Notifications Design QA

## Evidence

- Source visual truth: user-attached Notifications reference screenshot in this conversation.
- Source pixels: 3840 × 1706; system-normalized comparison preview: 2048 × 910.
- Implementation: `artifacts/notifications-compact-header-2048x910.png`.
- Implementation pixels / CSS viewport: 2048 × 910 at device scale factor 1.
- Focused implementation evidence: `artifacts/notifications-content-focus-2048x910.png`.
- Responsive evidence: `artifacts/notifications-implementation-390x844-final.png` at a 390 × 844 CSS viewport.
- Compared state: Notifications page, Leads tab selected, compact title/action header, one Read item, remaining items Unread.
- Combined comparison input: the attached source image and browser-rendered implementation capture were both opened in the active visual review context at the same normalized viewport.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: Poppins family, title hierarchy, uppercase breadcrumb/table headers, weights, line heights, truncation, and compact table copy match the reference and the existing Paywizard shell.
- Spacing and layout rhythm: 264 px sidebar, 70 px topbar, 16 px frame gaps, and 8 px radii remain aligned with the Paywizard shell. Following the user's annotation, the title and actions now share one 62 px header row; tabs start immediately below at y=185 and the table starts at y=261, removing 94 px of unused vertical space.
- Colors and visual tokens: page background, white surfaces, dark table header, cyan outline actions, green Read badge, red Unread badge, and neutral borders match the reference palette.
- Image and icon fidelity: the repository PAYwizard logo is used directly. Material Symbols provides all interface icons; no placeholder, handcrafted SVG, CSS drawing, gradient, or emoji substitutes are present.
- Copy and content: the requested Alerts tab is inserted before Onboarding and Leads. Page and table subtitles were intentionally removed per repository UI rules, while core notification meaning remains in one content line.
- Responsive behavior: the sidebar collapses at 1024 px and hides at 760 px; the page has no document-level horizontal overflow at 2048, 1440, 1024, or 390 px. On mobile, the active Leads tab is brought into view and only the table region scrolls horizontally.

## Focused Comparison

The dense notification region was reviewed separately using `artifacts/notifications-content-focus-2048x910.png`. Header alignment, checkbox sizing, source-icon slots, content column, status badges, dates, row striping, and Detail buttons remain legible and aligned without wrapping or overlap.

## Comparison History

1. Initial capture: `artifacts/notifications-implementation-2048x910.png`.
   - P2: All Notifications was selected although the source showed Leads selected.
   - P2: actions, tabs, and table began about 30 px too high after removing the prohibited subtitle.
2. Fixes:
   - Made Leads the default selected tab.
   - Increased the desktop header spacing while keeping the subtitle removed.
3. Final capture: `artifacts/notifications-implementation-2048x910-final.png`.
   - The selected state and vertical composition now align with the source.
4. Responsive follow-up:
   - P2: the active Leads tab initially sat outside the mobile tab viewport and the tab scrollbar was visible.
   - Brought the active tab into view automatically and hid the tab-strip scrollbar.
   - Verified in `artifacts/notifications-implementation-390x844-final.png`.
5. Annotated whitespace optimization:
   - The user identified the intentionally reserved desktop title-area height as excessive.
   - Collapsed the header from 156 px to 62 px and vertically centered the title and action buttons in the same row.
   - Verified in `artifacts/notifications-compact-header-2048x910.png`; document overflow remains 0 and browser console errors remain empty.

## Functional Verification

- Selected and marked an Alert notification as read; its status changed to Read and persisted.
- Mark All Read applies to the active category.
- Refresh List rehydrates shared and local notification state and returns to its enabled state.
- Alert Detail navigated to `39.customer_alerts.html?view=incidents&incident=i-mid-01` and opened the matching incident dialog.
- Browser console errors checked: none.
- Automated result: 6 Notifications tests passed; 6 Customer Alerts regression tests passed; the earlier combined Notifications, Customer Alerts, and Merchant Admin Navigation run passed 39/40 before correcting its test-only tab text assertion, followed by clean focused reruns.

## Final Result

final result: passed

---

# Terminal Management Width Design QA

## Evidence

- Source visual truth: the user-provided annotated Terminal Management screenshot in this conversation (original 3420 × 1752; normalized preview 2048 × 1049).
- Compared implementation: `1.terminalmanage_nayax.html?tab=dex&sn=WP6267UQ36002376` with DEX selected.
- Desktop evidence: `artifacts/terminal-width-after-2048.png` at 2048 × 1049 and `artifacts/terminal-width-after-3420.png` at 3420 × 1752.
- Responsive evidence: `artifacts/terminal-width-after-mobile-390.png` at 390 × 844.
- Combined comparison input: the annotated source image and both wide-screen browser captures were reviewed together in the active visual context.

## Findings

No actionable P0, P1, or P2 differences remain for the requested width correction.

- Layout and spacing: `.page-wrap` now matches the full platform workspace width, while the terminal card keeps exactly 20 px left and right safety gutters at both wide-screen viewports.
- Overflow: document-level horizontal overflow is 0 px at 3420, 2048, 1440, 1024, and 390 px. Wide tables and Product Map content retain their existing local overflow behavior.
- Responsive behavior: the existing desktop, tablet, and mobile breakpoints remain intact. The Nayax mobile page continues to remove its additional page padding, and the platform drawer opens and closes normally.
- Preserved surfaces: typography, colors, assets, copy, table data, navigation, and business interactions were not changed.

## Comparison History

1. Source screenshot: the 1120 px maximum width centered the terminal card and created large empty bands on both sides of the workspace.
2. Fix: removed the maximum-width constraint, made `.page-wrap` fill the workspace, retained 20 px desktop padding, and made border-box sizing explicit on all three `1.*` pages.
3. Final wide-screen captures: the annotated empty bands are eliminated; measured terminal-card gutters are 20 px on each side and document overflow remains 0 px.

## Functional Verification

- Confirmed the DEX tab remains selected from the query string.
- Opened the DEX Settings menu successfully.
- Opened and closed the mobile navigation drawer successfully.
- Browser console errors checked: none.
- Automated width assertions cover all three pages at 3420, 2048, 1440, 1024, and 390 px.

## Final Result

final result: passed
