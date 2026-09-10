import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const artifactRequire = createRequire(path.resolve(process.env.ARTIFACT_WORKDIR || '/private/tmp/paywizard-evidence-export', 'builder.cjs'));
const { Workbook, SpreadsheetFile } = await import(pathToFileURL(artifactRequire.resolve('@oai/artifact-tool')).href);
const E = require('./customer-alert-evidence.js');
const C = require('./customer-alert-evidence-cases.js');
const output = path.resolve('outputs/alert-evidence-20260910');
await fs.mkdir(output, { recursive: true });
const wb = Workbook.create();
const rows = C.rows();
function sheet(name, headers, records, widths) {
  const ws = wb.worksheets.add(name);
  ws.showGridLines = false;
  ws.getRangeByIndexes(0, 0, records.length + 1, headers.length).values = [headers, ...records];
  const range = ws.getRangeByIndexes(0, 0, records.length + 1, headers.length);
  range.format.font = { name: 'Arial', size: 11, color: '#20242B' };
  range.format.wrapText = true;
  range.format.verticalAlignment = 'top';
  range.format.rowHeight = name === 'Matrix' ? 95 : name === 'Observations' ? 110 : 75;
  widths.forEach((width, index) => ws.getRangeByIndexes(0, index, records.length + 1, 1).format.columnWidthPx = width);
  const header = ws.getRangeByIndexes(0, 0, 1, headers.length);
  header.format.fill = '#191B20';
  header.format.font = { name: 'Arial', size: 11, bold: true, color: '#FFFFFF' };
  header.format.rowHeight = 32;
  header.format.horizontalAlignment = 'center';
  header.format.verticalAlignment = 'center';
  const table = ws.tables.add(`A1:${String.fromCharCode(64 + headers.length)}${records.length + 1}`, true, `${name}Table`);
  table.style = 'TableStyleLight1';
  records.forEach((record, index) => {
    const lines = Math.max(...record.map((value, col) => String(value).split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil([...line].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 14 : 7), 0) / (widths[col] - 20))), 0)));
    ws.getRangeByIndexes(index + 1, 0, 1, headers.length).format.rowHeight = Math.max(name === 'Matrix' ? 42 : 30, lines * 13 + 12);
  });
  ws.freezePanes.freezeRows(1);
  return ws;
}
sheet('Matrix', ['Case ID', 'Condition', 'Rule Target', 'Incident Target', 'Scenario / Lifecycle', 'State', 'Observed Evidence', 'Template ID', 'Observation / Timeline evidence', 'Action'], rows.map(r => [r.id, r.conditionLabel, r.scope, r.target, `${r.scenario}\n${r.stage}`, r.state, r.evidence, r.key, r.eventEvidence, r.action]), [320,220,100,180,300,90,490,180,490,260]);
sheet('Templates', ['Template ID', 'English template', 'Variables'], Object.entries(E.templates).map(([key, text]) => [key, text, [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]))].join(', ') || '—']), [240,800,350]);
sheet('Observations', ['Scenario ID', 'Condition', 'Scenario', 'Rule parameters (JSON)', 'Observation (JSON)', 'Outcome', 'Base template', 'Full BIN details'], C.scenarios.map(r => { const e = E.evaluate(r.condition, r.parameters, r.observation); return [`${r.condition}.${r.id}`, E.conditions[r.condition], r.label, JSON.stringify(r.parameters), JSON.stringify(r.observation), e.outcome, e.key, e.details.join('\n') || '—']; }), [300,220,300,360,600,110,200,500]);
const contract = [
  ['Scope', 'Customer Alerts center and Terminal Alerts; SLA excluded. 8 Conditions.'],
  ['Coverage', `${C.scenarios.length} observation scenarios × 2 target scopes × 5 lifecycle stages + 80 historical/action snapshots = ${rows.length} cases. Infinite input values use typed parameters and boundary examples.`],
  ['Store', 'Store evaluates each terminal independently. Incident identity: Rule ID + Terminal ID + continuous occurrence. One incident per rule/terminal even with multiple affected BINs.'],
  ['Product matching', 'Match stable Product ID on each terminal. Evaluate every matching BIN. Never match by product label or require the same BIN number.'],
  ['Lifecycle', 'Active: abnormal or recovery pending. Default recovery: 2 consecutive normal observations. Unknown/abnormal resets to 0. Closed stays Closed, freezes list evidence; later observations go to timeline. Resolved retains recovery snapshot.'],
  ['Acknowledgement', 'Independent of observation and monitoring state. Does not change evidence, recovery count or threshold. Manual/archival closure reasons belong in timeline, not observed evidence.'],
  ['None', 'No incident exists. Normal, pending and unknown observations do not create incidents. Matrix shows — in Observed Evidence; diagnostic observation is in its own column.'],
  ['Unknown / partial', 'No new incident or recovery. Missing one required BIN value makes the terminal evaluation unknown; do not infer stock=0, normality or partial totals.'],
  ['Baseline / scheduling', 'No prior approved transaction without an authoritative monitoring baseline is unknown. Freshness, business-hours elapsed durations and time-window scheduling must be supplied upstream; this prototype does not invent a scheduling service.'],
  ['BINs', 'Sort by BIN ID; show first 3 and +N more in the list. Full affected BINs appear in detail. Normal result requires every monitored BIN valid and normal.'],
  ['Boundaries', 'Offline/no transaction trigger at >= threshold. Inventory triggers strictly below threshold; equality is normal. Sold Out triggers at 0. Temperature outside inclusive [lower,upper] triggers. Compare raw values before display rounding.'],
  ['History migration', 'Preserve IDs, actions and old evidence. Known demo observations regenerated explicitly; arbitrary legacy strings are retained as Previous evidence, not parsed into invented measurements.'],
  ['Demo', 'Synthetic observation inputs. Engine, templates, case page and workbook use the same JS modules. No production telemetry, scheduling or notification service is implied.'],
  ['Source', 'scripts/customer-alert-evidence.js; scripts/customer-alert-evidence-cases.js; docs/prd/customer-alert-evidence.md. Decisions confirmed in this conversation, 2026-09-10.'],
  ...Object.entries(E.variables).map(([key, value]) => [`Variable: ${key}`, value]),
  ...Object.entries(E.reasons).map(([key, value]) => [`Reason: ${key}`, value])
];
sheet('Contract', ['Item', 'Definition'], contract, [260,1050]);
wb.recalculate();
console.log((await wb.inspect({ kind: 'table', range: 'Matrix!A1:J3', tableMaxRows: 3, tableMaxCols: 10, maxChars: 1600 })).ndjson);
for (const name of ['Matrix', 'Templates', 'Observations', 'Contract']) {
  const range = name === 'Matrix' ? 'A1:G5' : name === 'Templates' ? 'A1:C6' : name === 'Observations' ? 'A1:F4' : 'A1:B6';
  const preview = await wb.render({ sheetName: name, range, scale: 1, format: 'png' });
  await fs.writeFile(path.join(output, `${name}-preview.png`), new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(output, 'Customer-Alerts-Evidence-Matrix.xlsx'));
await fs.writeFile(path.join(output, 'evidence-matrix.json'), JSON.stringify(rows, null, 2));
console.log(`Exported ${rows.length} cases and ${Object.keys(E.templates).length} templates`);
