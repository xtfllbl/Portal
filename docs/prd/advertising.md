# Unattended Terminal Advertising

## Scope and confirmed decisions

The user requested a functional portal prototype on 2026-09-10, with the following confirmed decisions:

- Existing management accounts manage advertising; no separate advertiser account or review workflow is added.
- An advertising set requires only a Name as its identifying information. The editor has no Advertiser field; existing advertiser metadata is retained for compatibility.
- The editor previews media directly on the right, with Q3V (UPT) and Q3min model selection. No editor Preview button or preview popup is needed.
- Campaigns has no Preview action or campaign preview dialog. The editor retains its inline Terminal Preview; Media Library previews individual assets without a terminal frame.
- All table headers use the current Terminal List’s 34px height and light-gray styling. Campaign row actions use Agent List’s 36px buttons and Material Symbols Rounded icons (edit_square, content_copy, block). Media deletion sits at the cover's upper-right corner: revealed by hover or keyboard focus on desktop, always visible on touch devices.
- The editor follows the existing Billing Setup form/preview layout and portal icon conventions.
- Each terminal uses one advertising display mode at a time: Idle-screen Advertising or Full-screen Advertising.
- Advertising is a standalone top-level navigation item immediately above APP Management.
- Terminal Details has no Advertising tab.
- Playback Statistics, playback event collection, and statistics export are excluded.
- The Advertising page has no Local demo badge.

The main entry is **Advertising**. Its breadcrumb is also Advertising. Settings → Branding continues to own Terminal Logo.

Canonical decision map: [无人值守终端广告配置与播放闭环](https://github.com/xtfllbl/Portal/issues/2). Product choices below, beyond the user-confirmed decisions above, are reviewable prototype defaults.

## Page and account scope

`45.advertising.html` uses the existing shared portal header and sidebar. It contains only Campaigns and Media Library. Deployments and its simulated sync/download/acknowledgement functions are removed. Legacy `?view=deployments` links return to Campaigns. WizarPOS Provider, Full-Service Provider, Unattended Provider, Unattended Merchant, and Unattended Store can access it in the Role Simulator. Other profiles hide the menu and reject direct routes. Advertising uses the shared customer-account directory for Agent, Merchant and Store filters and also retains existing demonstration terminals. Demo account selection and its account-mismatch messages are removed. The target picker shows the complete prototype directory, regardless of former account-switch preferences. Opening a saved campaign clears its obsolete editable `accountKey`; saving and new publications use the selected stores and terminals directly. Published snapshots are retained until republished. The global portal role selector and page visibility rules remain unchanged. This is a prototype presentation, not server-side authentication.

Terminal Details has no Advertising tab or advertising actions. Previously shared advertising URLs containing an SN can still filter campaigns by that SN; All Terminals exits that filter. The advertising directory contains demonstration terminals and does not modify existing terminal or Product Map data.

## Campaigns and editing

Campaigns can be searched by name and filtered by Draft/Published/Stopped; the list has no Advertiser column. Each row has Edit and Duplicate icon actions with accessible labels and the portal's shared hover/focus tooltips; published, non-stopped campaigns also have Stop Campaign. Clicking the campaign name or Edit opens its saved configuration for editing and starts the inline preview. There is no separate campaign Preview action or popup. Duplicate copies the editable configuration and clears publication and target assignment, except a terminal-specific entry preselects its terminal.

New Campaign creates a draft with Idle-screen Advertising, sequential playback, contain fit, continuous playback after publication, and no targets. Only Name is required when saving a draft; publication validates playlist and targets. Selected stores and terminals must exist in the prototype directory. A single Targets warning identifies unavailable selections; obsolete simulated account restrictions do not block Save or Publish. Save Draft is available only before the first publication and permits an incomplete playlist/target selection. Once a campaign has been published, including after it is stopped, the editor hides and disables Save Draft; edits must go through Review & Publish. The draft-save operation also rejects previously published campaigns, including stale copies without publication metadata. Published editors show Published or Stopped with the version, rather than Draft. Unsaved changes remain local to the editor until publication and do not change the published configuration. Cancel, back navigation, and portal navigation protect unsaved changes; browser refresh/close uses native leave protection.

Review & Publish validates the whole campaign. Validation failures, store conflicts and terminal conflicts scroll their error into view and move keyboard focus to it, clear of the sticky footer. Save errors and errors inside the publication dialog receive the same treatment. Successful validation then shows campaign, mode, next version, selected stores/individual terminals, current covered terminal count, and playlist count. Cancel makes no changes. Publish checks referenced browser media, snapshots both the playlist and its asset metadata, increments the version, and updates the campaign’s target assignments. Publication returns to Campaigns. Storage failures are shown without reporting success. A target already assigned to another non-stopped campaign blocks publication with the conflicting SNs; use Stop Campaign before reassigning.

### Display and playback

| Setting | Idle screen | Full screen |
|---|---|---|
| Content | Image carousel only | Image carousel OR video playlist |
| Advertising area | Central Ready for Payment area | Whole screen |
| Preserved frame | SN/time, payment brands, Terminal Logo, merchant footer | Restored when advertising exits |
| Start | While ready/idle | After configurable 5–600 seconds idle; default 30 |
| Wake | Payment request | Touch anywhere, or payment request |
| Sound | None | Always muted |

The model selector changes the preview only; it neither filters Target Terminals nor changes the campaign or its targets. The logical display is rendered at its native resolution and projected onto the corresponding product photograph:

| Preview model | Native display | Source |
|---|---|---|
| Q3V (UPT) | 480 × 800, portrait, 4-inch | User-supplied `datasheet-Q3V (UPT)英文.pdf`, Display specification, page 1 |
| Q3min | 480 × 480, square, 4-inch | User-supplied `datasheet-Q3 min NAMA.pdf`, Display specification, page 1 |

The Q3V preview uses the original front-facing device from the user's latest vending-machine photograph, with the surrounding machine clipped away in the browser. The photograph's hardware details and material remain intact. Its 480 × 800 live display maps to a 453 × 755 rectangle with exactly the same 3:5 ratio, covering the photograph's cashier UI. The Android controls remain below the active LCD. Q3min retains the accepted left-facing illustrative view derived from its PDF reference and its 480 × 480 display projection. Neither the shell nor the content is horizontally reflected. Asset provenance is recorded in `assets/advertising/SOURCES.md`.

These generated product views are illustrative; the datasheets establish native screen size and original hardware layout. Idle-screen layout adapts to the shorter square display. Fit entire image preserves media proportions, while Fill area crops to the selected advertising area. Asset provenance and generation prompts are recorded in `assets/advertising/SOURCES.md` and `assets/advertising/VIEW_PROMPTS.md`.

Playlist: Add Media selects compatible library assets. Each image displays for 3–120 whole seconds (default 8). Video plays to its natural end. Chevron icon buttons reorder items; the close icon removes an item from the draft. Each has an accessible action label, and the first/last unavailable moves are disabled. The first asset determines playlist type: image playlists accept only images, video playlists only videos; clearing the playlist releases the type. Idle screen accepts images only, and a video playlist must be cleared before switching to Idle screen. There is no Content type selector. Playlists always loop in listed order; there is no Playback order control. Fit entire image preserves the full image; Fill area may crop edges. There is no Schedule module. New publications continue until stopped or replaced; obsolete shuffle/schedule settings in saved drafts cannot influence the new version.

The inline Terminal Preview starts the current playlist immediately for evaluation. Changes to playback settings, playlist or model update it directly. Name edits and target changes do not restart playback. A full-screen touch stops media and returns to Ready for Payment; Replay starts the playlist again. A hidden browser tab pauses media; returning resumes playback unless the preview was already woken for payment. Leaving the editor disposes its player. Missing, failed, or incompatible media shows the default payment screen.

Campaign preview is available only inline while editing. Media Preview is separate and shows only the selected image or video in its original proportions, without a device frame, model selector, payment interface, or wake-up controls. Video has native playback controls and starts muted; closing the dialog releases its playback element. Neither preview records playback events.

Name and Display Mode share a simple basic configuration section. Playlist and Targets use divider-separated sections. The right preview uses the neutral panel style from Billing Setup. On narrow screens, it appears immediately after the basic fields, followed by the playlist. Form and action buttons are 40px tall; back, reorder, add and replay controls use SVG icons.

## Store and terminal selection

The chosen design is the inline filter/table approach. Targets contains Stores, Terminals and Selected tabs. Agent, Merchant and Store filters support both direct selection and text search, with cascading choices across the prototype directory. Choosing an agent resets merchant/store filters; choosing a merchant resets the store filter. Typing only filters options; selecting an option commits it. Escape or leaving the field restores the last selected value. Keyboard arrows, Enter and Escape are supported. Search narrows the current table; Select all affects only displayed selectable rows. These controls never discard selections outside the filters. Empty stores can be selected when not already claimed by another published campaign.

Stores and Terminals both display Assignment immediately after the name. Store rows show a whole-store claim or the number of terminals occupied by another campaign, together with campaign names; whole-store claims are visible even with zero current terminals. Current-campaign coverage is distinguished from other campaigns and remains selectable. Targets occupied by other non-stopped campaigns cannot be newly selected, and Select all skips them. Previously saved conflicting selections remain visible and can be unchecked or removed in Selected. Selected tables also show assignment status. Publication still validates conflicts to handle older selections or intervening changes.

A campaign saves stable `targetStores` IDs alongside explicit terminal SN `targets`. Selecting a store establishes a continuing scope: future additions and transfers in inherit its published advertising configuration; transfers out leave the assignment unless separately targeted. Stores and individual terminals from other stores may be combined. Covered terminals are checked and disabled with Included by store; selecting a store removes redundant explicit terminal selections. Removing the store does not restore deduplicated terminal selections.

Selected replaces the old removable chip strip and Selected only link. Its badge counts selected stores plus individually selected terminals. It independently displays all selections in separate Store and Terminal tables, with name, merchant or store, coverage or SN, and one Remove icon per row. Search selected narrows these tables, while Clear all removes the full selection regardless of the search. The Targets heading displays the unique current terminal coverage. Store coverage includes future members, indicated by All terminals. Selected remains available when empty, and shows unavailable saved selections so they can be removed.

Publication validates selected IDs and blocks overlapping terminal assignments or stores already claimed by another non-stopped campaign. Empty stores can publish and enroll terminals later. Published scopes, rather than draft edits, determine membership. Occupied newcomers retain their original campaign; the affected campaign shows Target conflict in Campaigns, and its editor lists the conflicting SNs and owners. Stop Campaign releases existing assignments and disables future enrollment; this action is available on every non-stopped published campaign, including empty-store campaigns. Stopping the conflicting campaign lets the pending store scope cover the released terminal.

The prototype reconciles membership on directory load and advertising state mutations. Its directory is seeded shared prototype data, not a live terminal inventory feed. Real inventory events must call the same reconciliation at integration time. Existing SN selections are retained; missing selections must be explicitly removed before save or publish. Removing Demo account does not change device ownership.

## Media Library

Upload accepts JPG, PNG, and WebP up to 10 MB and MP4/WebM up to 50 MB. Media name is optional: a nonblank name is trimmed and used as the display name; otherwise the selected file's full filename, including its extension, is used. Changing the selected file never fills the optional name field. The form has no Advertiser field or browser-storage/codec notice, and the Upload Media button has no arrow icon. Existing advertiser metadata remains compatible with saved records, while library search uses the display name. Upload decodes the file before saving to capture dimensions and duration and rejects unreadable media. Browser codec support is not evidence of OPC decoder compatibility. Seeded SVG samples are application assets, not accepted uploads.

Files persist in IndexedDB; metadata persists in a separate advertising localStorage record. Files are local to the current browser/origin. Upload failure keeps the dialog open with its reason. Clicking a library card's image, video or name opens Media Preview; the card also supports Enter/Space and has no separate Preview button. Preview displays the asset independently of any terminal model and preserves its image/video proportions. The cover's upper-right trash uses a 32px button with a 16px icon, appears on desktop hover or keyboard focus, and remains visible on touch devices. It is separate from the preview target, so deletion never opens a preview. Delete still requires confirmation and is blocked for assets referenced by drafts or published snapshots. The playlist picker retains Add to Playlist and has no delete action.

## Publication and saved data

The prototype retains published campaign snapshots and a minimal terminal-to-campaign assignment map for conflict protection. There is no Deployments page, device sync simulation, requested/active version table, download status, or Preview Active. Stopping a campaign releases its assignments; its saved configuration remains available to edit and republish. These are portal prototype operations, not physical terminal commands.

Existing browser data upgrades without losing uploaded media, campaign drafts, published configurations, target stores, terminal selections or stopped state. Existing non-stopped assignment owners are retained when overlapping store scopes are reconciled. Legacy acknowledgement records are removed by the one-time migration.

## Scope exclusions

Playback statistics, preview event collection, and statistical CSV export are not part of this feature. Legacy `?view=statistics` links open Campaigns. Existing browser campaign and media data are retained.

## Delivery boundary

This change is a persistent local portal prototype with working uploads, campaign editing, validation, published configurations, store/terminal targeting, image/video playback, and wake-up controls. It does not deploy or change real terminals or process payments. A Vercel production deployment was not requested for this change.
