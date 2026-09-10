(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CustomerAlertEvidence = api;
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  const conditions = {
    opc_offline: 'Payment Service Offline', no_approved_transaction: 'No Approved Transaction',
    machine_stock: 'Machine Stock Below % PAR', any_bin: 'Any BIN Below Quantity',
    selected_product: 'Selected Product / BIN Below % PAR', sold_out: 'Sold Out',
    temperature_range: 'Temperature Out of Range', refrigeration_fault: 'Refrigeration Fault'
  };
  const reasons = {
    missing: 'No observation received', stale: 'Observation is out of date', unsupported: 'Condition not supported',
    invalid: 'Observation is invalid', map_missing: 'Product Map is unavailable', empty_map: 'No monitored BINs',
    invalid_par: 'PAR must be greater than 0', product_missing: 'Selected product is not mapped to this terminal',
    product_id_missing: 'Selected Product ID is unavailable', unit_mismatch: 'Temperature unit does not match the rule',
    never_approved: 'No approved transaction recorded; monitoring baseline is unavailable',
    duration_missing: 'Elapsed monitoring time is unavailable', legacy: 'Structured observation is unavailable',
    threshold_invalid: 'Rule threshold is invalid'
  };
  const templates = {
    'offline.abnormal': 'Payment Service unavailable for {elapsed} · Threshold ≥ {threshold}',
    'offline.normal': 'Payment Service available',
    'offline.pending': 'Payment Service unavailable for {elapsed} · Threshold ≥ {threshold} not reached',
    'transaction.abnormal': 'No approved transaction for {elapsed} · Threshold ≥ {threshold}',
    'transaction.normal': 'Last approved transaction {elapsed} ago · Threshold ≥ {threshold}',
    'machine.abnormal': 'On Hand {onHand} / PAR {par} · Stock {percent}% · Threshold < {threshold}%',
    'machine.normal': 'On Hand {onHand} / PAR {par} · Stock {percent}% · Threshold < {threshold}%',
    'bins.abnormal': 'BINs below threshold: {count} · Threshold < {threshold} units · {bins}',
    'bins.normal': 'All monitored BINs meet threshold · Threshold ≥ {threshold} units · BINs checked: {count}',
    'product.abnormal': '{product} · BINs below threshold: {count} · Threshold < {threshold}% · {bins}',
    'product.normal': '{product} · All matching BINs meet threshold · Threshold ≥ {threshold}% · BINs checked: {count}',
    'sold.abnormal': 'BINs with no stock: {count} · {bins}',
    'sold.normal': 'All monitored BINs have stock · BINs checked: {count}',
    'temperature.low': 'Temperature {temperature} °{unit} · Below lower bound {lower} °{unit} · Range {lower}–{upper} °{unit}',
    'temperature.high': 'Temperature {temperature} °{unit} · Above upper bound {upper} °{unit} · Range {lower}–{upper} °{unit}',
    'temperature.normal': 'Temperature {temperature} °{unit} · Within range {lower}–{upper} °{unit}',
    'fault.abnormal': 'Refrigeration fault active', 'fault.normal': 'Refrigeration fault cleared',
    'unavailable': '{condition} not evaluated · {reason}',
    'recovery': '{evidence} · Recovery check {hit}/{required}',
    'reset': '{evidence} · Recovery reset',
    'unavailable_reset': '{evidence} · Recovery check 0/{required}',
    'legacy': 'Observation details unavailable · Previous evidence: {previous}',
    'target': '{terminalName} · {storeName}',
    'bin.quantity': 'BIN {binId}: On Hand {onHand}',
    'bin.ratio': 'BIN {binId}: On Hand {onHand} / PAR {par} ({percent}%)'
  };
  const variables = {
    elapsed: '非负分钟数格式化；不足 1 分钟显示 0m，不用于判断阈值', threshold: '规则阈值；时间按 h/m，库存按 units 或 %',
    onHand: '非负整数；缺失不可转换为 0', par: '正整数；0/负值/缺失不可用于百分比', percent: '100 × On Hand / PAR；展示最多 1 位小数；若舍入会掩盖低于阈值，则显示 <阈值；判断使用未舍入值',
    count: '异常 BIN 数或已检查 BIN 数，依模板含义', bins: '按稳定 BIN ID 排序；列表最多 3 项，超出追加 ; +N more；详情全部',
    product: '产品名称（没有名称则 Product ID）；匹配仅使用 productId', temperature: '有限数值，最多 1 位小数；不隐式转换单位',
    unit: 'C 或 F，与规则一致', lower: '温度下限（含边界为正常）', upper: '温度上限（含边界为正常）',
    condition: '8 种 Condition 的英文标签', reason: '固定原因枚举 reasons，不能自由拼接',
    evidence: '该次观测的基础模板输出', hit: '连续正常次数；异常或无法评估清零', required: '规则要求的连续恢复次数，默认 2',
    previous: '原有自由文案，仅在缺少结构化历史数据时保留；不用于推断观测', terminalName: '事件终端名称，无名称使用 Terminal - {terminalId}',
    storeName: '事件发生时门店名称，无名称显示 Store unavailable', binId: '稳定 BIN ID，不能用产品显示名代替'
  };
  const fmt = value => String(Math.round(value * 10) / 10);
  const percentLabel = (raw, threshold) => raw < threshold && Number(fmt(raw)) >= threshold ? `<${threshold}` : fmt(raw);
  function duration(minutes) { const value = Math.floor(minutes); return value >= 60 ? `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}m` : ''}` : `${value}m`; }
  function render(key, values = {}) {
    if (!templates[key]) throw new Error(`Unknown evidence template: ${key}`);
    return templates[key].replace(/\{(\w+)\}/g, (_, name) => {
      if (values[name] === undefined || values[name] === null) throw new Error(`Missing evidence variable: ${name}`);
      return String(values[name]);
    });
  }
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const positive = value => finite(value) && value > 0;
  const quantity = value => Number.isInteger(value) && value >= 0;
  function result(outcome, key, values = {}, details = []) { return { outcome, key, values, details, text: render(key, values) }; }
  function unavailable(condition, reason) { return result('unknown', 'unavailable', { condition: conditions[condition] || condition, reason: reasons[reason] || reasons.invalid }); }
  function evaluate(condition, p = {}, o) {
    if (!conditions[condition]) return unavailable(condition, 'unsupported');
    if (!o) return unavailable(condition, 'missing');
    if (o.reason) return unavailable(condition, o.reason);
    if (o.supported === false) return unavailable(condition, 'unsupported');
    if (o.stale === true) return unavailable(condition, 'stale');
    if (condition === 'opc_offline') {
      if (!positive(p.duration)) return unavailable(condition, 'threshold_invalid');
      if (typeof o.available !== 'boolean') return unavailable(condition, 'invalid');
      if (o.available) return result('normal', 'offline.normal');
      if (!finite(o.unavailableMinutes) || o.unavailableMinutes < 0) return unavailable(condition, 'duration_missing');
      const values = { elapsed: duration(o.unavailableMinutes), threshold: duration(p.duration) };
      return o.unavailableMinutes >= p.duration ? result('abnormal', 'offline.abnormal', values) : result('pending', 'offline.pending', values);
    }
    if (condition === 'no_approved_transaction') {
      if (!positive(p.duration)) return unavailable(condition, 'threshold_invalid');
      if (o.neverApproved) return unavailable(condition, 'never_approved');
      if (!finite(o.lastApprovedMinutes) || o.lastApprovedMinutes < 0) return unavailable(condition, 'duration_missing');
      const abnormal = o.lastApprovedMinutes >= p.duration * 60;
      return result(abnormal ? 'abnormal' : 'normal', `transaction.${abnormal ? 'abnormal' : 'normal'}`, { elapsed: duration(o.lastApprovedMinutes), threshold: duration(p.duration * 60) });
    }
    if (condition === 'temperature_range') {
      if (!finite(p.lower) || !finite(p.upper) || p.lower >= p.upper || !['C', 'F'].includes(p.unit)) return unavailable(condition, 'threshold_invalid');
      if (o.unit !== p.unit) return unavailable(condition, 'unit_mismatch');
      if (!finite(o.temperature) || o.temperature < (o.unit === 'F' ? -459.67 : -273.15)) return unavailable(condition, 'invalid');
      const phase = o.temperature < p.lower ? 'low' : o.temperature > p.upper ? 'high' : 'normal';
      return result(phase === 'normal' ? 'normal' : 'abnormal', `temperature.${phase}`, { temperature: fmt(o.temperature), unit: o.unit, lower: fmt(p.lower), upper: fmt(p.upper) });
    }
    if (condition === 'refrigeration_fault') {
      if (typeof o.fault !== 'boolean') return unavailable(condition, 'invalid');
      return result(o.fault ? 'abnormal' : 'normal', `fault.${o.fault ? 'abnormal' : 'normal'}`);
    }
    if (!Array.isArray(o.bins)) return unavailable(condition, 'map_missing');
    if (!o.bins.length) return unavailable(condition, 'empty_map');
    let bins = o.bins;
    if (condition === 'selected_product') {
      if (!p.productId) return unavailable(condition, 'product_id_missing');
      bins = bins.filter(bin => bin.productId === p.productId);
      if (!bins.length) return unavailable(condition, 'product_missing');
    }
    bins = [...bins].sort((a, b) => String(a.binId).localeCompare(String(b.binId), 'en', { numeric: true }));
    if (bins.some(bin => !bin.binId || !quantity(bin.onHand)) || new Set(bins.map(bin => bin.binId)).size !== bins.length) return unavailable(condition, 'invalid');
    const ratio = condition === 'machine_stock' || condition === 'selected_product';
    if (ratio && bins.some(bin => !Number.isInteger(bin.par) || bin.par <= 0)) return unavailable(condition, 'invalid_par');
    if (condition !== 'sold_out' && (!Number.isInteger(p.threshold) || p.threshold <= 0 || (ratio && p.threshold > 100))) return unavailable(condition, 'threshold_invalid');
    const details = bins.map(bin => render(ratio ? 'bin.ratio' : 'bin.quantity', { ...bin, percent: ratio ? percentLabel(bin.onHand / bin.par * 100, p.threshold) : '' }));
    if (condition === 'machine_stock') {
      const onHand = bins.reduce((sum, b) => sum + b.onHand, 0), par = bins.reduce((sum, b) => sum + b.par, 0);
      const abnormal = onHand / par * 100 < p.threshold;
      return result(abnormal ? 'abnormal' : 'normal', `machine.${abnormal ? 'abnormal' : 'normal'}`, { onHand, par, percent: percentLabel(onHand / par * 100, p.threshold), threshold: p.threshold }, details);
    }
    const affected = bins.filter(bin => condition === 'sold_out' ? bin.onHand === 0 : ratio ? bin.onHand / bin.par * 100 < p.threshold : bin.onHand < p.threshold);
    const selectedDetails = affected.map(bin => details[bins.indexOf(bin)]);
    const prefix = condition === 'any_bin' ? 'bins' : condition === 'sold_out' ? 'sold' : 'product';
    return result(affected.length ? 'abnormal' : 'normal', `${prefix}.${affected.length ? 'abnormal' : 'normal'}`, {
      count: affected.length || bins.length, threshold: p.threshold || '', product: p.productName || p.productId || '',
      bins: selectedDetails.slice(0, 3).join('; ') + (affected.length > 3 ? `; +${affected.length - 3} more` : '')
    }, affected.length ? selectedDetails : details);
  }
  function advance(incident, evaluated, required = 2) {
    required = Number.isInteger(required) && required > 0 ? required : 2;
    const prior = Number(incident?.recoveryHitCount) || 0;
    if (incident?.monitoringState === 'Resolved') return { ...incident, eventEvidence: evaluated.text, eventType: 'historical', ignored: true };
    const hit = evaluated.outcome === 'normal' ? Math.min(prior + 1, required) : 0;
    let state = incident?.monitoringState || 'None';
    if (state === 'None' && evaluated.outcome === 'abnormal') state = 'Active';
    else if (state === 'Active' && hit >= required) state = 'Resolved';
    let key = evaluated.key, values = evaluated.values;
    if (hit > 0 && hit < required && incident) { key = 'recovery'; values = { evidence: evaluated.text, hit, required }; }
    else if (prior > 0 && evaluated.outcome === 'unknown') { key = 'unavailable_reset'; values = { evidence: evaluated.text, required }; }
    else if (prior > 0 && evaluated.outcome !== 'normal') { key = 'reset'; values = { evidence: evaluated.text }; }
    const evidence = render(key, values);
    return { monitoringState: state, recoveryHitCount: hit, recoveryChecksRequired: required,
      evidence: state === 'Closed' ? incident.evidence : evidence,
      evidenceDetails: state === 'Closed' ? incident.evidenceDetails || [] : evaluated.details,
      evidenceKey: state === 'Closed' ? incident.evidenceKey : key,
      evidenceValues: state === 'Closed' ? incident.evidenceValues : values,
      eventEvidence: evidence, eventDetails: evaluated.details, eventKey: key, eventValues: values,
      eventType: hit >= required ? 'resolved' : hit > 0 ? 'recovery_check' : evaluated.outcome === 'unknown' ? 'not_evaluated' : prior > 0 ? 'recovery_reset' : 'observation',
      recoveryConfirmed: hit >= required, outcome: evaluated.outcome };
  }
  function target(incident) { return render('target', { terminalName: incident.terminalName || `Terminal - ${incident.terminalId || 'unavailable'}`, storeName: incident.store || 'Store unavailable' }); }
  return { conditions, reasons, templates, variables, render, evaluate, advance, target, duration };
});
