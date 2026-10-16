# Learnings

## [LRN-20261016-PPS] correction

**Logged**: 2026-10-16
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
参数集 UI 统一需要覆盖分段开关、区块标题和终端页周边字段，不能只检查 Tab 与卡片间距。

### Details
上轮将 Tab 改黑并分成两张卡片，遗漏了所有 Enable／Disable 选中态仍为绿色；无区块标题使上下关系不明确。终端页的参数来源／参数集选择沿用维护页圆角框，与周边下划线字段不一致。

### Suggested Action
本轮按用户明确要求修正，并在实际参数页签、Usage Records 和 Add Device 中检查选中态、层级标题及相邻控件外观；保留搜索与占用限制。

### Metadata
- Source: user_feedback
- Related Files: styles/parameter-pool.css, scripts/parameter-pool-device.js, 49.parameter_pool_form.html
- Pattern-Key: ui.incomplete-page-parity


### Resolution
- **Resolved**: 2026-10-16
- **Notes**: 已完成黑色分段开关、区块标题、冗余计数卡移除和终端选择器样式对齐，并逐个页签及实际终端页验证。

---

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
