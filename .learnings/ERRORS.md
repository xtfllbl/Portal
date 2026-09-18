# Errors

Command failures and integration errors.

---

## [ERR-20260916-001] payment brand presentation test

**Logged**: 2026-09-16T12:00:00+08:00
**Priority**: low
**Status**: resolved
**Area**: frontend

### Summary
The first payment-brand formatter preserved the lowercase fixture value `prepaid` instead of the canonical display label `Prepaid`.

### Error
```
Expected detail markup to contain Prepaid; received prepaid.
```

### Context
- Found by the focused `payment-brands.test.cjs` run.
- Card Scheme logos were correct; only the non-scheme Payment Method label casing was affected.

### Suggested Fix
Use the resolved Payment Method label for Prepaid and QR while preserving full source text such as Visa Credit for Card Schemes.

### Metadata
- Reproducible: yes
- Related Files: scripts/payment-brands.js, tests/unit/payment-brands.test.cjs
- Pattern-Key: tests.assertion-mismatch
- Recurrence-Count: 1
- First-Seen: 2026-09-16
- Last-Seen: 2026-09-16

### Resolution
- **Resolved**: 2026-09-16T12:00:00+08:00
- **Notes**: The detail formatter now uses canonical Payment Method labels and preserves Card Scheme descriptors.

---

## [ERR-20260916-001] npm test

**Logged**: 2026-09-16T10:15:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The repository has no generic npm test script.

### Error
```
npm error Missing script: "test"
```

### Context
- Attempted to run the transaction unit tests through a conventional npm script.
- The package defines targeted scripts and the transaction tests use Node's built-in test runner.

### Suggested Fix
Run `node --test tests/unit/related-transactions.test.cjs tests/unit/transaction-detail-model.test.cjs` for this feature, then run the existing build.

### Metadata
- Reproducible: yes
- Related Files: package.json, tests/unit
- Pattern-Key: tests.missing-script
- Recurrence-Count: 1
- First-Seen: 2026-09-16
- Last-Seen: 2026-09-16

### Resolution
- **Resolved**: 2026-09-16T10:15:00+08:00
- **Notes**: Switched to the repository's Node test runner.

---

## [ERR-20260915-009] zsh expanded query strings during Vercel verification

**Logged**: 2026-09-15T15:12:00+08:00
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
An unquoted URL route containing `?tab=basic` was interpreted as a zsh glob before production HTTP checks ran.

### Error
```
zsh: no matches found: /1.terminalmanage.html?tab=basic
```

### Context
- The Vercel deployment had already reached production Ready.
- The failure affected only the follow-up route and artifact verification loop.

### Suggested Fix
Quote each URL containing a query string, or verify static route paths without query parameters before browser acceptance checks.

### Metadata
- Reproducible: yes
- Related Files: none
- Pattern-Key: shell.query-string-glob
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T15:12:00+08:00
- **Notes**: Continued with individually quoted URLs and static artifact comparisons.

---

## [ERR-20260915-008] Vercel protected deployment URL masked artifact check

**Logged**: 2026-09-15T15:00:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: infra

### Summary
The unique Vercel deployment URL returned HTTP 200 after redirects but served the Vercel login page, so a direct artifact comparison failed even though the production alias was correct.

### Error
```
deployment_http=200
deployment_index_match=no
```

### Context
- The unique deployment hostname redirected through Vercel SSO and ended at `Login - Vercel`.
- The production alias returned HTTP 200 and matched `dist/index.html` byte for byte.
- `vercel inspect` independently confirmed the deployment was production and Ready.

### Suggested Fix
Inspect redirect headers and page markers when a Vercel artifact comparison fails. For protected deployment hostnames, verify readiness with `vercel inspect` and verify the public production alias against the local artifact.

### Metadata
- Reproducible: yes
- Related Files: .vercel/project.json, dist/index.html
- Pattern-Key: auth.deployment-protection
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T15:00:00+08:00
- **Notes**: Confirmed the mismatch was the Vercel SSO login page; production alias parity passed.

---

## [ERR-20260915-007] Product Map suite has unrelated UI expectation drift

**Logged**: 2026-09-15T15:25:00+08:00
**Priority**: low
**Status**: pending
**Area**: tests

### Summary
Five Product Map tests still expect controls or metadata that the current page no longer renders, outside the Terminal Name changes.

### Error
```
Expected Fill Machine 100% and .terminal-sn elements were not found; two template-import assertions remained All changes saved.
```

### Context
- Terminal Name assertions in the same suite reached and passed with `Midtown Cooler 01`.
- The changed production lines do not alter the existing Stock menu labels, staged-import implementation, or template title layout.
- The dedicated Terminal Name regression and all directly affected suites pass.

### Suggested Fix
Reconcile the Product Map tests with the currently approved Stock menu, import behavior, and template metadata layout in a separate task.

### Metadata
- Reproducible: yes
- Related Files: tests/products-product-map.spec.js, 1.terminalmanage_nayax.html, 36.product_map_templates.html
- Pattern-Key: tests.ui-baseline-drift
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

---

## [ERR-20260915-006] optional terminal context overwrote a supplied name

**Logged**: 2026-09-15T15:15:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: frontend

### Summary
The optional Terminal Name logic used only the presence of `sn` to decide whether to read a supplied `terminalName`, overwriting name-only contexts with the default mock name.

### Error
```
Expected: Airport Snacks
Received: Midtown Cooler 01
```

### Context
- Product Map tests intentionally pass a Terminal Name without overriding the default S/N.

### Suggested Fix
Use the provided Terminal Name whenever either `sn` or `terminalName` is present; use the default mock name only when neither parameter is supplied.

### Metadata
- Reproducible: yes
- Related Files: 1.terminalmanage.html, 1.terminalmanage_nayax.html, 1.terminalmanage_CardReader.html
- Pattern-Key: frontend.optional-context-default
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T15:15:00+08:00
- **Notes**: Updated all three terminal context initializers to preserve name-only URL contexts.

---

## [ERR-20260915-005] temporary Playwright config resolved test directory from tmp

**Logged**: 2026-09-15T15:10:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
A temporary Playwright configuration inherited a relative test directory that resolved from `/tmp`, so no tests were discovered.

### Error
```
Error: No tests found.
```

### Context
- The temporary configuration was used only to reuse the verified Vite server already listening on the configured port.

### Suggested Fix
Set `testDir` to the repository's absolute test directory in temporary configurations stored outside the repository.

### Metadata
- Reproducible: yes
- Related Files: playwright.config.js
- Pattern-Key: tests.relative-config-path
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T15:10:00+08:00
- **Notes**: Added the repository's absolute test directory to the temporary configuration.

---

## [ERR-20260915-004] terminal link test expected path without context

**Logged**: 2026-09-15T14:24:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
Two portal-access assertions still expected a bare Attended detail path after the list link began carrying terminal context.

### Error
```
Expected: 1.terminalmanage.html
Received: 1.terminalmanage.html?sn=WP1110KQ20000115&...
```

### Context
- The Q2PRO list entry now passes SN, Terminal Name, TID, TCI, and Model to keep list and detail identities consistent.

### Suggested Fix
Assert the Attended destination and required SN while permitting the confirmed query parameters.

### Metadata
- Reproducible: yes
- Related Files: tests/portal-access-profiles.spec.js, 2.resellermerchantterminal.html
- Pattern-Key: tests.route-query-expectation
- Recurrence-Count: 1
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T14:24:00+08:00
- **Notes**: Updated the two Attended Store assertions to accept the terminal-context query.

---

## [ERR-20260915-003] Playwright web server port collision

**Logged**: 2026-09-15T14:21:00+08:00
**Priority**: low
**Status**: resolved
**Area**: tests

### Summary
The focused Playwright run could not start because its configured web-server port was already occupied.

### Error
```
Error: http://127.0.0.1:8765 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.
```

### Context
- Attempted the focused terminal and portal-access Playwright suites with the default configuration.
- The failure happened before any page assertion ran.

### Suggested Fix
Use the already-running preview with a temporary `reuseExistingServer` configuration, or stop the verified owning process before retrying.

### Metadata
- Reproducible: yes
- Related Files: playwright.config.js
- Pattern-Key: tests.port-collision
- Recurrence-Count: 4
- First-Seen: 2026-09-15
- Last-Seen: 2026-09-15

### Resolution
- **Resolved**: 2026-09-15T14:21:00+08:00
- **Notes**: Continued with a temporary Playwright configuration that reuses the existing server. Recurred during the Terminal Name audit, the map-control layering regression run, and the follow-up location-control spacing check; the verified workaround is to stop the owned preview before rerunning Playwright.

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

## [ERR-20260918-TAD] Browser extension connection timeout

**Logged**: 2026-09-18T01:41:08.133898+00:00
**Priority**: medium
**Status**: resolved
**Area**: tests

### Summary
Browser runtime setup succeeded but Chrome session naming and tab listing repeatedly timed out, preventing visual acceptance of the terminal Advertising tab.

### Error
`js execution timed out; kernel reset, rerun your request`

### Context
Chrome is running and native-host manifest checks passed. The documented extension-installed diagnostic could not read Chrome Local State (EPERM), so extension availability remains unverified. No browser UI checks completed during the initial attempt.

### Suggested Fix
Reconnect the ChatGPT Browser extension, then validate the terminal Advertising tab, media previews, empty state, editor jump and return on desktop. Do not treat build or unit test results as visual acceptance.

### Metadata
- Reproducible: yes
- Related Files: 1.terminalmanage_nayax.html, scripts/terminal-advertising.js
- Pattern-Key: net.timeout

---

### Resolution
- **Resolved**: 2026-09-18
- **Notes**: The existing browser connection recovered in the follow-up turn. Desktop screenshots verified the Advertising tab after Alerts, View Campaign opening the terminal-filtered list with the editor hidden, optional Edit, return to the original Advertising tab, image preview, and draft-only empty state.
