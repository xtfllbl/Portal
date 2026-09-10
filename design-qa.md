# Branding Logo Management QA

final result: passed

## Evidence and scope

- Source visual truth: user-supplied Branding / Logo Management screenshot in this conversation (3840 × 2271 original, rendered at 2048 × 1211). No local source-image path was supplied.
- Route: `20.provider_custom_email_service.html`.
- Desktop screenshot: `/private/tmp/branding-qa/desktop.png`, 2048 × 1211 pixels and CSS viewport, normalized to the displayed reference size.
- Mobile screenshots: `/private/tmp/branding-qa/mobile.png`, `/private/tmp/branding-qa/mobile-bottom.png`, `/private/tmp/branding-qa/mobile-uploaded.png`, 390 × 844 pixels and CSS viewport.
- States: empty Logo Management, uploaded previews, saved and restored logos, removed logos, Email Setting / Custom SMTP.
- Screenshots use the browser's CDP capture at 1 pixel per CSS pixel. The initial high-level mobile screenshot was incorrectly scaled and replaced with the CDP capture.

## Visual review

The full desktop reference and rendered page were inspected in the conversation. Both have the Branding title, three tabs, two vertically stacked logo sections, left upload cards, right guideline cards and a Save action. The existing project shell is intentionally retained, including its real navigation and access-profile switcher; the screenshot's repeated APP Management rows are not duplicated.

- Typography: existing portal Poppins and heading weights retained for project consistency. Section labels and guidelines remain readable at desktop and mobile sizes.
- Layout: approximately 580/680 px desktop card widths, 16 px column gap and 254 px upload zones preserve the reference's primary card proportions. Removing redundant subtitles and shortening guidelines intentionally reduces vertical height under AGENTS.md. Mobile uses one column without horizontal clipping; bottom Save remains reachable.
- Colors: existing white panels, pale gray upload surfaces, subtle borders and monochrome buttons retained.
- Images: real Paywizard sidebar asset retained by default. Uploaded images use `object-fit: contain`; measured preview sizes are 176 × 44 and 240 × 160. The black/transparent rectangles in the uploaded-state evidence are disposable test fixtures, not supplied brand artwork.
- Copy: Logo Management, System Header Logo, Terminal Logo and both guideline headings retained. JPG/PNG, 2 MB and both target dimensions match the source. Existing Email Service is labeled Email Setting; unimplemented TMS Setting is disabled.
- Focused checks: upload controls, image preview dimensions and action button measurements were inspected separately. Replace/Remove are 36 px on desktop and mobile; Email Save/Send Test Email are both 36 px; mobile tabs are all 52 px. Mobile bottom Save is 36 px and fully visible after scrolling.

No actionable P0/P1/P2 visual findings. No visual fix iteration was needed after the first valid captures. The intentional shell, typography and copy adaptations above follow the user's existing-project requirements.

## Interaction verification

- Default Logo tab; Email tab switches and existing platform/custom SMTP selection and Save marker work.
- PNG input-change and JPEG drag/drop fixtures render previews.
- Wrong type, over-2-MB size and corrupt image receive specific errors.
- Saving retains both logos across reload; System Header Logo appears on Transactions after navigation/reload.
- An already open Transactions tab updates after Save through the shared branding notification.
- Remove plus Save restores the original portal logo in the other tab. All disposable test logos were removed through the UI.
- No warning/error console entries during final page verification.
- JavaScript syntax checks, `git diff --check` and `npm run build` passed.

## Test limitations

The Chrome file chooser opened, but extension file-URL permission prevented `setFiles`. File-input change and drop processing were tested using generated in-page fixtures through the supported browser development capability. Automated native disk selection remains unverified; this is a browser test permission limitation, not a reported app failure. Production deployment, real device distribution, cross-account scoping and cross-device synchronization are outside the agreed local-demo scope.
