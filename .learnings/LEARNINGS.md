# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

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
