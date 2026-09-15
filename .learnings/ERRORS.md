# Errors

Command failures and integration errors.

---

## [ERR-20260915-004] browser map instance probe

**Logged**: 2026-09-15T00:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The browser inspection context could not read the custom Leaflet map instance property from the map element.

### Error
```
TypeError: Cannot read properties of undefined (reading 'getZoom')
```

### Context
- The rendered map, tiles, controls, and marker were visibly initialized.
- The failure affected only an internal instance probe used during visual acceptance.

### Suggested Fix
Verify interaction through visible DOM changes such as tile transforms, popup visibility, and screenshots instead of relying on a custom element property across browser execution contexts.

### Metadata
- Reproducible: unknown
- Related Files: scripts/terminal-location-map.js, tests/terminal-location-map.spec.js
- Pattern-Key: browser.leaflet-instance-probe-unavailable
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T00:00:00+08:00
- **Notes**: Switched browser acceptance to visible DOM and screenshot evidence.

---

## [ERR-20260915-003] Leaflet vendor preparation

**Logged**: 2026-09-15T00:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
A dependency-vendoring command was rejected because it included recursive temporary-directory cleanup.

### Error
```
Rejected: rm -f style commands are not permitted. Use a safer approach.
```

### Context
- The command used a uniquely created temporary directory and attempted to remove it after copying Leaflet assets.
- Rejection occurred before command execution.

### Suggested Fix
Leave the system temporary directory in place and avoid recursive cleanup in the combined command.

### Metadata
- Reproducible: yes
- Related Files: assets/vendor/leaflet
- Pattern-Key: safety.temp-recursive-cleanup-rejected
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T00:00:00+08:00
- **Notes**: Retried without recursive cleanup.

---

## [ERR-20260915-002] image dimension inspection

**Logged**: 2026-09-15T00:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
ImageMagick `identify` is unavailable in this workspace.

### Error
```
zsh: command not found: identify
```

### Context
- Attempted to inspect generated map asset dimensions.

### Suggested Fix
Use the macOS-native `sips` command for local image metadata.

### Metadata
- Reproducible: yes
- Related Files: assets
- Pattern-Key: tooling.identify-unavailable
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T00:00:00+08:00
- **Notes**: Switched to `sips` for image metadata.

---

## [ERR-20260915-001] product-design user context preflight

**Logged**: 2026-09-15T00:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: docs

### Summary
The Product Design user-context documentation showed a preflight command relative to the plugin root, but the script is stored under the skill directory.

### Error
```
python3: can't open file '.../product-design/0.1.55/scripts/user_context_preflight.py': No such file or directory
```

### Context
- Attempted the documented plugin-root path before a Product Design workflow.
- The installed script is at `skills/user-context/scripts/user_context_preflight.py`.

### Suggested Fix
Resolve the script relative to the `user-context/SKILL.md` directory, or update the documentation to include the full skill-relative path.

### Metadata
- Reproducible: yes
- Related Files: skills/user-context/SKILL.md
- Pattern-Key: product-design.user-context-preflight-path
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T00:00:00+08:00
- **Notes**: Located the installed script under the user-context skill and continued with that path.

---
