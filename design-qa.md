# Prototype center design QA

- Date: 2026-09-07
- Source visual truth: `/Users/beaver/.codex/generated_images/01a07ac1-b4a9-75e1-80ab-19ba132ee437/exec-392a2dc3-cda2-4c6b-8f28-d22c017d4dce.png`
- Implementation: `http://127.0.0.1:5173/index.html`
- Desktop evidence: `/private/tmp/hub-desktop-final.png`
- Mobile evidence: `/private/tmp/hub-mobile-final.png`
- Dialog evidence: `/private/tmp/hub-mobile-dialog.png`
- Desktop viewport: 1488 × 1058 CSS px. Mobile: 390 × 844; additional overflow check at 360 × 800.
- Pixel dimensions: source 1487 × 1058; browser desktop capture 1473 × 1047; mobile capture 375 × 812. The browser backend captures its available content surface slightly smaller than the requested viewport. Images were inspected together at native resolution without resampling; this small frame difference was accounted for when comparing margins.
- State: default collection view, no search or category filter; light theme.
- Full-view comparison: source and desktop capture viewed together in the same comparison input. Both show two columns, ten requirements, text as the primary hierarchy and small previews. Browser screenshots include a native scrollbar; source does not.
- Focused comparison: mobile before `/private/tmp/hub-mobile.png` and after `/private/tmp/hub-mobile-final.png`, inspected at the same viewport. No source mobile mock exists; mobile layout adapts the approved text-first hierarchy.

## Findings and comparison history

1. Initial desktop comparison: no actionable P0/P1/P2 visual differences. The existing brand raster and real prototype captures replace generated approximations. Documents appear only where existing links are available; prepaid retains both phases. Counts use actual entries, and parameter validation distinguishes its page from source resources.
2. Initial mobile check: P2 — thumbnail squeezed the Customer Alerts title into an isolated final character. Fixed mobile cards with a full-width title and the thumbnail beside metadata/actions. The new 390px capture shows complete readable titles without the isolated character; 360px check confirms no horizontal overflow.
3. Final desktop layout retained after the mobile-only fix; final capture recorded. No remaining P0/P1/P2 issues introduced by this redesign.

## Fidelity surfaces

- Typography: Arial/PingFang/system fallbacks; bold 23px desktop requirement names, 19–20px mobile, no truncation. Title is visually dominant; metadata is 13–14px.
- Layout: compact two-column cards with 12px vertical gaps, small right-side previews, aligned search and header navigation. Mobile uses one column and full-width titles.
- Colors: white surface, dark primary text, subtle gray borders, restrained blue selection/focus. No decorative gradients or heavy shadows.
- Images: supplied Paywizard logo and ten actual local prototype screenshots. Previews stay secondary; icons are Heroicons (license retained) plus the existing close asset.
- Copy: requirement names match the approved naming direction; no descriptions or subtitles. Page/document links and original query/hash variants retained. Parameter-specific dialog links distinguish ELAVON and TSYS.

## Interaction validation

- Category filter returns the three device requirements.
- Combined category/search narrows RKMS to one requirement.
- Empty search result and clear-filter recovery work.
- Requirement page-count dialog opens, closes, supports Escape and restores focus to its trigger.
- All-pages navigation and Notifications search return the expected entry.
- Primary Customer Alerts link opens `39.customer_alerts.html`; browser Back returns to the hub.
- Desktop action heights: all 32px within each action group. Mobile: all 36px.
- No horizontal page overflow at desktop, 390px or 360px.
- No browser console errors observed in the verified homepage flow.
- JavaScript syntax validation and production static build passed. Build ran in an isolated temporary copy to preserve the pre-existing modified `dist/index.html`.
- Every original href is retained. Two pre-existing directory targets are absent from the checkout: `1.html` and `4.Select%20Application.html`. This redesign does not repair or replace those historical pages. External document contents/authentication were not tested.

## Follow-up polish

- Optional: resolve the two historical missing pages separately.
- Screenshot previews are static; refresh them when their underlying prototypes materially change.

final result: passed

## Directory and email tabs follow-up — 2026-09-07

Implemented the approved follow-up plan using the existing hub shell. The visual target is the user's requested filename/function table and master-detail email layout; no new concept imagery was introduced.

- Directory: 59 filename/function mappings and their original order/hrefs verified against the pre-change HTML. Numeric prefixes, case and decoded spaces remain visible. The two known missing historical targets remain unchanged.
- Email library: all 26 existing entries and three groups retained in original order. First entry is the default; session selection survives reload. The old email directory redirects to `../../index.html#emails`.
- Preview: original HTML loaded by iframe with an empty sandbox (scripts, forms and top navigation not permitted). Relative sample logos load. Raw templates retain variable placeholders, including the unresolved `${logoUrl}` image variable; this is original template content, not a rendered sample.
- Search: filename query narrows to one page; function query returns matching rows. SLA query returns two emails. Empty email search leaves selected preview visible and clear-filter restores the list.
- Interaction: template click, keyboard Enter, Tab switching, browser Back/Forward, refresh selection, new-window link and legacy redirect verified in Chrome. Independent left-list scrolling and long email scrolling observed.
- Desktop evidence: `/private/tmp/hub-pages-desktop.png`, `/private/tmp/hub-emails-desktop-final.png`; verified email viewport 1440 × 1000 with a 300px left column.
- Mobile evidence: `/private/tmp/hub-pages-mobile.png`, `/private/tmp/hub-emails-mobile-final.png`; 390px phone layout, with additional 360px overflow check. Long filenames stay visible. Directory action links are consistently 36px; email toolbar action is 40px.
- Typography, colors and spacing inherit the existing hub. Table metadata stays in separate columns, without descriptive subtitles. Mobile stacks the short scrollable list above the preview.
- During verification, hash targets initially scrolled the header out of view. Panel DOM ids were separated from route hashes so Tab navigation retains the top-level shell.
- Browser errors inspected: the browser extension's `contentEnd.js` attempted localStorage inside sandboxed frames and was blocked. The iframe remains sandboxed; no permissions were relaxed to accommodate extension code.
- Static production build passed in an isolated temporary directory, including the legacy redirect and every email HTML file. JavaScript syntax and whitespace checks passed. Existing modified dist output was preserved.

Follow-up final result: passed
