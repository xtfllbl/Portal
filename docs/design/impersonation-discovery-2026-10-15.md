# Impersonation design discovery

Status: design 1 selected on 2026-10-15 with a preference for simplicity. Static interactive prototype implemented and desktop-reviewed. Updated after user review: role-only rows and existing role pages.

## Selected implementation

- Entry: `48.impersonate.html`, linked from the shared MAINTAIN menu.
- Destination: existing `12.transaction_list.html` for Full-Service Provider, Full-Service Merchant and Unattended Store; existing `42.billing_payments.html` for Billing-only Merchant. Open in a new tab with the exact existing profile navigation and page behavior. The old `48.impersonate_portal.html` path only consumes the one-time handoff and immediately replaces itself; it renders no Dashboard or module list. End impersonation clears the tab identity and returns to the originating selection.
- Reuse: `scripts/entity-hierarchy-data.js` now supplies the unchanged Device Management fixture and the impersonation directory. The latter adds a second illustrative provider without changing the former's data.
- One role per user; direct users only; search by user name, email or role; plain Role text is sufficient for operations staff. The table contains User, Email, Role and Action only; no permission expansion, Permissions column, role picker, descendants toggle or confirmation step.
- Browser evidence: [operations page](impersonation/implementation-desktop-final.png), [Portal identity](impersonation/implementation-portal.png). Detailed checks: [design QA](../../design-qa.md).
- The new directory and session are fictional UI demonstrations. Linked business pages retain their existing fixtures and operation behavior; real authentication, authorization, audit and entity-level business-data filtering are not implemented.

## Entity account counts

Each hierarchy node shows its direct user account count at the right edge, reusing Device Management's muted 11 px, semibold, tabular-number count styling and darker selected state. The count is based on the same direct membership as the right-hand user list, before user-search filtering. It excludes descendant accounts, remains visible when a branch is collapsed, and shows 0 for entities without direct accounts. Tree search changes node visibility only, not the counts. Example: Tianfu Merchant = 4, each of its two Stores = 1; the parent remains 4 rather than 6. No additional columns or controls are introduced.

## Production new-tab correction

The first production browser smoke reproduced a failed `window.open()` result and the directory's popup-blocked error. Localhost had succeeded, so local-only verification was insufficient. The hosting response contained no popup-restricting CSP. The exact browser setting or extension responsible was not established.

The entry is now a native anchor styled with the existing 36 px action button. The synchronous activation handler prepares the one-time handoff URL and lets the browser perform ordinary `target="_blank"` navigation. There is no programmatic `window.open()` or null-return popup inference. `rel="opener"` intentionally retains the same-origin End impersonation return behavior. Storage failures cancel navigation and retain the visible, focused error. Keyboard activation, middle-click and context-menu preparation use the same handler.

Production verification on the same browser and origin, with no browser setting changes: Alice Chen opened existing Transactions with the Full-Service Merchant banner, no directory error; End impersonation closed the target tab. Release `dpl_DprnuC3kTNjDwtu1YkVieykoEndH` is READY/production. Eight focused Node tests pass, including the blocked-programmatic-popup seam and storage failure cancellation.

## Existing-role mapping confirmed in the latest review

| Example user | Role shown in directory | Existing profile | Landing page |
| --- | --- | --- | --- |
| Olivia Scott | Full-Service Provider | `full-service` | Transactions |
| Alice Chen | Full-Service Merchant | `full-service-merchant` | Transactions |
| Lucas Wu | Unattended Store | `unattended-store` | Transactions |
| Brian Lee / Grace Wu | Billing-only Merchant | `billing-merchant` | Billing & Payments |

Billing-only is determined by the user's role, not merely the Merchant entity type. Agent Admin retains the previous Full-Service Provider mapping; no new Agent profile is invented. Existing Dashboard entries remain unavailable placeholders, as in the current project.

The directory, shared shell and pages use the same tab-local profile during impersonation. Transactions, terminal links, uptime, advertising and operating-hours controls must not read the originating operations profile instead. The shared Role Simulator preference is not overwritten. Provider impersonation also uses provider mode on Agent List, preventing that page's operations context from replacing the impersonated profile.

The original generated concepts and screenshots below document exploration, not the latest permission layout. Latest browser evidence: [simple user rows](impersonation/revised-directory.png), [existing merchant portal](impersonation/revised-merchant.png), [billing-only portal](impersonation/revised-billing.png).

## Confirmed brief

- Add an Impersonate entry under the operations platform's MAINTAIN menu.
- Reuse the Device Management Entity Hierarchy pattern, covering the entire system: Service Providers, Agents, Merchants and Stores.
- Selecting an entity shows its information and direct users with their single role on the right. The latest review removes separate permission details.
- Each user has exactly one role at a time. Selecting a user selects that user's existing role and effective permissions; no role picker or permission editor is needed.
- Show only users directly belonging to the selected entity. Navigate to child entities using the left hierarchy; do not add an include-descendants toggle.
- Impersonation permits actions within the target user's permissions and ordinary business rules.
- Open Portal in a new browser tab. Keep the operations page's selected entity and search state. Provide a persistent identity banner and End impersonation action in Portal.
- Portal must prominently identify the impersonated identity and role at the top.
- Produce multiple design alternatives using the existing static HTML/CSS/JavaScript architecture and project UI standards.
- This brief supersedes historical entry-point and target-role assumptions from other workspaces.

## Local evidence

- `scripts/platform-admin-shell.js`: shared operations shell and MAINTAIN group (internal key `matintain`).
- `2.resellermerchantterminal.html`: reference hierarchy and compact Terminal List.
- The reference tree currently has one Service Provider root; a system-wide directory needs multiple provider roots.
- User List and Role Permissions menu entries are unavailable placeholders; this prototype does not establish user-role cardinality or direct Store membership.
- `GLOSSARY.md`: Role Simulator and Portal Access Profile are demonstration concepts, not proof of login authorization.
- `docs/adr/0001-delegated-customer-alert-management.md` concerns delegated Alert Rule ownership, not this new login impersonation flow; it remains unchanged.

## Resolved design tree

1. One user → one current role → show that role as plain text, without expandable details; select the user to enter the existing profile experience.
2. Selected entity → direct users only → child users appear after selecting the child entity.
3. Target permissions → ordinary permitted actions → no read-only-only mode or automatic Admin escalation.
4. New Portal tab → persistent user/role/entity identity banner → explicit End impersonation and return to the originating selection.

The user's reference to the tree on the right in their second answer is interpreted as the existing hierarchy navigation: the original brief and screenshot explicitly place it on the left.

No extra reason form, approval step, role selector, descendant toggle or session dashboard is introduced for this design review. Backend authorization, audit and session implementation are not established by visual mockups. No ADR is needed for these readily reversible layout alternatives.

## Visual exploration

Images are numbered by their display order in the review conversation:

1. [Compact table](impersonation/design-1-compact-table.png)
2. [Persistent permission inspector](impersonation/design-2-permission-inspector.png)
3. [Role-grouped directory](impersonation/design-3-role-groups.png)

Generated using the built-in Image Gen tool with the user's original screenshot attached. These are visual concepts, not browser-rendered pages; exact dimensions, keyboard behavior, actual role mapping and session handling have not been implemented or browser-verified. Review checked visible tree placement, direct-user membership, one role per user, permission presentation, entry action and destination identity banner. Shared-shell navigation order and pixel-exact component sizes must be preserved from source when implementing the selected design rather than copied blindly from generated pixels.

- Compact table: direct users and a single role per row, with inline permission expansion and a row-level Impersonate action.
- Persistent detail pane: a compact user list beside the selected user's read-only permission details and one clear Impersonate action.
- Role grouping: direct users grouped by their single role, with shared role permissions displayed once per group and user-specific entry actions.

All directions retain the shared shell and entity tree. Each concept includes a separate destination-header excerpt showing the new Portal tab and its persistent identity banner. This excerpt is a design-review artifact, not an extra panel in the operations product.

## Component mapping

- Hierarchy: PrimeVue v4 Tree single-selection and filtering patterns; reuse project node icons and ancestor-path behavior.
- Users: DataTable compact plain rows; preserve the project's 34 px header, 11 px header type and 36 px row buttons.
- Entry actions: project Button patterns, 40 px for standalone actions.
- Persistent identity banner: Message-like presentation combined with an explicit End impersonation button; it cannot be dismissed independently of ending the session.
- Role: plain table text; the latest user correction removes permission disclosure entirely.

References: https://v4.primevue.org/tree/ , https://v4.primevue.org/datatable/ , https://v4.primevue.org/message/ . These are design references, not installed frameworks.

## Verified market references

- [Zendesk: Assuming end users](https://support.zendesk.com/hc/en-us/articles/4408894200474-Assuming-end-users): selects a user, opens another browser tab, and offers identity restoration at the top or from the original tab.
- [GitLab: User impersonation](https://docs.gitlab.com/administration/admin_area/#user-impersonation): selects a user, starts impersonation, provides a stop action, and records impersonation activity in audit events.

These are reference patterns, not evidence that this project implements equivalent session isolation, authorization or audit capabilities.
