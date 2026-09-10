# Unattended Terminal Advertising

## Scope and confirmed decisions

The user requested a functional portal prototype on 2026-09-10, with the following confirmed decisions:

- Existing management accounts manage advertising; no separate advertiser account or review workflow is added.
- An advertising set requires only a Name as its identifying information. The editor has no Advertiser field; existing advertiser metadata is retained for compatibility.
- The editor previews media directly on the right, with Q3V (UPT) and Q3min model selection. No editor Preview button or preview popup is needed.
- The editor follows the existing Billing Setup form/preview layout and portal icon conventions.
- Each terminal uses one advertising display mode at a time: Payment-screen Advertising or Full-screen Advertising.
- Advertising is a standalone top-level navigation item immediately above APP Management.
- Terminal Details has no Advertising tab.
- Playback Statistics, playback event collection, and statistics export are excluded.
- The Advertising page has no Local demo badge.

The main entry is **Advertising**. Its breadcrumb is also Advertising. Settings → Branding continues to own Terminal Logo.

Canonical decision map: [无人值守终端广告配置与播放闭环](https://github.com/xtfllbl/Portal/issues/2). Product choices below, beyond the user-confirmed decisions above, are reviewable prototype defaults.

## Page and account scope

`45.advertising.html` uses the existing shared portal header and sidebar. It contains Campaigns, Media Library, and Deployments. WizarPOS Provider, Full-Service Provider, and Unattended Provider can access it in the Role Simulator. Other profiles hide the menu, reject direct routes, and redirect on profile switches. Existing provider management stands in for operations and agent workflows; this is not server-side authentication or a new agent permission model. Merchant/store advertising permissions remain unavailable in this first prototype.

Deployments can link to a terminal’s Basic Information by SN. Terminal Details has no Advertising tab or advertising actions. Previously shared advertising URLs containing an SN can still filter campaigns and deployments by that SN; All Terminals exits that filter. The advertising directory contains demonstration terminals and does not modify existing terminal or Product Map data.

## Campaigns and editing

Campaigns can be searched by name and filtered by Draft/Published; the list has no Advertiser column or separate Preview action. Clicking the campaign name or Edit opens its draft and starts the inline preview. Preview Active in Deployments plays the acknowledged version. Duplicate copies the editable configuration and clears publication and target assignment, except a terminal-specific entry preselects its terminal.

New Campaign creates a draft with Payment-screen Advertising, sequential playback, contain fit, always-active schedule, and no targets. Only Name is required when saving a draft; publication still validates playlist, schedule and targets. Save Draft permits an incomplete playlist/target selection and stores only the editable draft. It never changes the published or active version. Cancel, back navigation, and portal navigation protect unsaved changes; browser refresh/close uses native leave protection.

Review & Publish validates the whole campaign, then shows campaign, mode, next version, target count, playlist count, and schedule. Cancel makes no changes. Publish checks referenced browser media, snapshots both the playlist and its asset metadata, increments the version, and queues demo deployments. Storage failures are shown without reporting success. A target already assigned to another non-stopped campaign blocks publication with the conflicting SNs; use Stop Campaign before reassigning.

### Display and playback

| Setting | Payment screen | Full screen |
|---|---|---|
| Content | Image carousel only | Image carousel OR video playlist |
| Advertising area | Central Ready for Payment area | Whole screen |
| Preserved frame | SN/time, payment brands, Terminal Logo, merchant footer | Restored when advertising exits |
| Start | While ready/idle | After configurable 5–600 seconds idle; default 30 |
| Wake | Payment request | Touch anywhere, or payment request |
| Sound | None | Always muted |

The model selector changes the preview only; it neither filters Target Terminals nor changes the campaign or its deployment. The logical display is rendered at its native resolution and projected onto the corresponding product photograph:

| Preview model | Native display | Source |
|---|---|---|
| Q3V (UPT) | 480 × 800, portrait, 4-inch | User-supplied `datasheet-Q3V (UPT)英文.pdf`, Display specification, page 1 |
| Q3min | 480 × 480, square, 4-inch | User-supplied `datasheet-Q3 min NAMA.pdf`, Display specification, page 1 |

The outer shells use the original embedded product photographs and transparency masks extracted from those PDFs. Their perspective does not alter the logical native pixel size. Payment-screen layout adapts to the shorter square display; Fit entire image preserves media proportions and Fill area crops to the selected advertising area. These are portal previews; the datasheets establish screen size and physical appearance, not an exact OPC payment-screen layout. Asset provenance is recorded in `assets/advertising/SOURCES.md`.

Playlist: Add Media selects compatible library assets. Each image displays for 3–120 whole seconds (default 8). Video plays to its natural end. Chevron icon buttons reorder items; the close icon removes an item from the draft. Each has an accessible action label, and the first/last unavailable moves are disabled. Mode changes retain incompatible items and visibly mark them; publication is blocked until corrected. Shuffle rebuilds a shuffled order each cycle. Fit entire image preserves the full image; Fill area may crop edges. Campaign schedules use UTC start-inclusive/end-exclusive bounds; Always active removes date gating.

The inline Terminal Preview starts the current playlist immediately for evaluation. Changes to playback settings, playlist or model update it directly. Name edits and target changes do not restart playback. A full-screen touch stops media and returns to Ready for Payment; Replay starts the playlist again. A hidden browser tab pauses media; returning resumes playback unless the preview was already woken for payment. Leaving the editor disposes its player. Missing/failed/incompatible media and inactive schedules show the default payment screen. Schedule boundaries are observed while the preview is mounted.

The separate Media Library and Preview Active dialogs retain their existing preview controls. Start Payment interrupts playback; Return to Idle demonstrates the configured full-screen delay, and Restart Preview starts playback immediately. Closing a dialog stops its player. Neither preview records playback events.

Name and Display Mode share a simple basic configuration section. Playlist, Schedule and Target Terminals use divider-separated sections. The right preview uses the neutral panel style from Billing Setup. On narrow screens, it appears immediately after the basic fields, followed by the playlist. Form and action buttons are 40px tall; back, reorder, add and replay controls use SVG icons.

## Media Library

Upload accepts JPG, PNG, and WebP up to 10 MB and MP4/WebM up to 50 MB, with a required media name and advertiser. It decodes the file before saving to capture dimensions and duration and rejects unreadable media. Browser codec support is not evidence of OPC decoder compatibility. Seeded SVG samples are application assets, not accepted uploads.

Files persist in IndexedDB; metadata persists in a separate advertising localStorage record. Files are local to the current browser/origin. Upload failure keeps the dialog open with its reason. Preview plays an asset. Delete requires confirmation and is blocked for assets referenced by drafts, published snapshots, or active device versions, preserving cached playback and historical meaning.

## Deployments and updates

Each row shows terminal SN, store, campaign, requested version, active version, status, UTC update time, and actions. Publishing means queued, not downloaded. Editing or publishing never silently activates a new version.

Simulate Sync opens a clearly labeled simulation with these outcomes:

| Outcome | Result |
|---|---|
| Online and idle | Atomically activates the complete requested snapshot |
| Offline | Waiting for connection; retains active snapshot |
| Payment in progress | Waiting for idle; retains active snapshot |
| Download failure | Download failed; retains active snapshot; retry through Simulate Sync |

There is no physical download, checksum verification, device command, or real acknowledgement in this repository. “Online” in target selection is seeded demo connectivity; simulated sync outcomes do not establish live connectivity.

Stop Campaign queues a stop for all assigned targets; Cancel does nothing. A terminal can keep its active cached version until a successful sync acknowledges the stop. Removing a target in a newly published version also queues a stop. The campaign and its history remain available to edit and republish. Preview Active uses the acknowledged snapshot, preserving the distinction from an editable draft.

Production integration should download a complete manifest and assets, verify them, and switch only at idle, keeping the last valid version after failure. Its actual protocol, retries, storage eviction, hashes, bandwidth limits, decoder constraints, and rollback retention need terminal service/SDK input.

## Scope exclusions

Playback statistics, preview event collection, and statistical CSV export are not part of this feature. Legacy `?view=statistics` links open Campaigns. Existing browser campaign and media data are retained.

## Delivery boundary

This change is a persistent local portal prototype with working uploads, campaign editing, validation, version snapshots, simulated acknowledgements, image/video playback, and wake-up controls. It does not deploy or change real terminals or process payments. A Vercel production deployment was not requested for this change.
