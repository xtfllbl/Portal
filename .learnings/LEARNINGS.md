# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260916-001] correction

**Logged**: 2026-09-16T12:20:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
Payment-scheme logos in transaction rows are compact identifiers beside the account number, not prominent card artwork.

### Details
The initial 42 by 27 pixel treatment made the logo compete with the masked PAN. The real platform reference uses a roughly text-height logo, with the account number remaining the primary information.

### Suggested Action
Default transaction Card Scheme logos to approximately 30 by 19 pixels and validate their visual hierarchy against a real-platform screenshot.

### Metadata
- Source: user_feedback
- Related Files: styles/payment-brands.css, 12.transaction_list.html
- Tags: transactions, card-scheme, logo, visual-hierarchy
- Pattern-Key: frontend.oversized-brand-logo
- Recurrence-Count: 1
- First-Seen: 2026-09-16
- Last-Seen: 2026-09-16

### Resolution
- **Resolved**: 2026-09-16T12:20:00+08:00
- **Notes**: List and detail Card Scheme logos were reduced to 30 by 19 pixels.

---

## [LRN-20260915-001] correction

**Logged**: 2026-09-15T00:00:00+08:00
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
For a "real map mock", use an interactive map engine with mock coordinates rather than a generated static map image.

### Details
The generated map background looked artificial and could not pan or zoom. The expected prototype experience is a real street map that supports map interactions while the terminal coordinates remain mocked.

### Suggested Action
When terminal-location requirements mention Google Maps, latitude/longitude, zoom, or interaction, confirm the map provider and implement a real map canvas with a fixed demo marker.

### Metadata
- Source: user_feedback
- Related Files: 1.terminalmanage.html, 1.terminalmanage_nayax.html, styles/terminal-basic.css
- Tags: terminal-location, interactive-map, prototype
- Pattern-Key: ui.terminal-location-real-map-mock
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T00:00:00+08:00
- **Notes**: Replaced the generated image maps with locally vendored Leaflet, live OpenStreetMap tiles, interactive controls, and fixed demo coordinates.

---
