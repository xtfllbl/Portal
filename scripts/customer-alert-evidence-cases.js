(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./customer-alert-evidence.js'));
  else root.CustomerAlertEvidenceCases = factory(root.CustomerAlertEvidence);
})(typeof window === 'undefined' ? this : window, function (E) {
  'use strict';
  const productOptions = [
    { id: 'demo-product-water', label: 'A1 · Sparkling Water', name: 'Sparkling Water' },
    { id: 'demo-product-cola', label: 'A2 · Cola Zero', name: 'Cola Zero' },
    { id: 'demo-product-trail', label: 'B1 · Trail Mix', name: 'Trail Mix' }
  ];
  const params = {
    opc_offline: { duration: 15 }, no_approved_transaction: { duration: 2 }, machine_stock: { threshold: 25 },
    any_bin: { threshold: 2 }, selected_product: { productId: 'demo-product-water', productName: 'Sparkling Water', product: 'A1 · Sparkling Water', threshold: 30 },
    sold_out: {}, temperature_range: { lower: 2, upper: 8, unit: 'C' }, refrigeration_fault: {}
  };
  function sample(condition, phase = 'abnormal', p = params[condition]) {
    const normal = phase === 'normal';
    if (phase === 'unknown') return { reason: 'stale' };
    if (condition === 'opc_offline') return { available: normal, unavailableMinutes: (p.duration || 15) + 3 };
    if (condition === 'no_approved_transaction') return { lastApprovedMinutes: normal ? 1 : (p.duration || 2) * 60 + 18 };
    if (condition === 'temperature_range') return { temperature: normal ? (p.lower + p.upper) / 2 : p.upper + 2, unit: p.unit || 'C' };
    if (condition === 'refrigeration_fault') return { fault: !normal };
    const ratio = condition === 'machine_stock' || condition === 'selected_product';
    return { bins: [{ binId: condition === 'selected_product' ? 'B3' : 'A1', productId: p.productId || 'demo-product-water', onHand: condition === 'sold_out' ? (normal ? 3 : 0) : ratio ? (normal ? 80 : Math.max(0, p.threshold - 5)) : (normal ? p.threshold : p.threshold - 1), par: 100 }] };
  }
  const scenarios = [];
  function add(condition, id, label, observation, parameters = params[condition]) { scenarios.push({ condition, id, label, observation, parameters }); }
  for (const condition of Object.keys(E.conditions)) {
    add(condition, 'abnormal', '达到异常条件', sample(condition));
    add(condition, 'normal', '正常观测', sample(condition, 'normal'));
    add(condition, 'missing', '尚未收到观测', null);
    add(condition, 'stale', '数据超过上游新鲜度标准', { stale: true });
    add(condition, 'unsupported', '终端不支持该条件', { supported: false });
    add(condition, 'invalid', '无效数据类型或数值', { reason: 'invalid' });
    if (condition !== 'sold_out' && condition !== 'refrigeration_fault') add(condition, 'invalid_threshold', '无效规则阈值', sample(condition), {});
  }
  add('opc_offline', 'threshold_equal', '离线时间恰好等于阈值', { available: false, unavailableMinutes: 15 });
  add('opc_offline', 'below_threshold', '离线但时间尚未达到阈值，不作为恢复', { available: false, unavailableMinutes: 14 });
  add('opc_offline', 'duration_missing', '已知离线但不知道持续时间', { available: false });
  add('no_approved_transaction', 'threshold_equal', '距最后成功交易恰好等于阈值', { lastApprovedMinutes: 120 });
  add('no_approved_transaction', 'never_approved', '从未交易且没有监控起算基准', { neverApproved: true });
  add('no_approved_transaction', 'duration_missing', '最后成功交易时间缺失', {});
  const inventory = ['machine_stock', 'any_bin', 'selected_product', 'sold_out'];
  for (const condition of inventory) {
    add(condition, 'map_missing', 'Product Map 缺失', {});
    add(condition, 'empty_map', '没有监控 BIN', { bins: [] });
    add(condition, 'missing_quantity', 'BIN 库存值缺失', { bins: [{ binId: 'A1', productId: 'demo-product-water', par: 100 }] });
    add(condition, 'negative_quantity', 'BIN 库存为负数', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: -1, par: 100 }] });
    add(condition, 'duplicate_bin', '重复 BIN ID，不能重复计数', { bins: [sample(condition).bins[0], sample(condition).bins[0]] });
  }
  for (const condition of ['machine_stock', 'selected_product']) {
    add(condition, 'par_zero', 'PAR 为 0', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: 0, par: 0 }] });
    add(condition, 'par_missing', 'PAR 缺失', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: 1 }] });
    add(condition, 'threshold_equal', '库存百分比恰好等于阈值，正常', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: params[condition].threshold, par: 100 }] });
    add(condition, 'over_par', '库存超过 PAR，正常', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: 120, par: 100 }] });
    add(condition, 'rounding_boundary', '展示舍入到阈值但实际仍低于阈值', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: params[condition].threshold * 100 - 1, par: 10000 }] });
  }
  add('machine_stock', 'weighted_total', '整机按总库存/总 PAR，不平均各 BIN 百分比', { bins: [{ binId: 'A1', onHand: 1, par: 10 }, { binId: 'B2', onHand: 20, par: 90 }] });
  add('any_bin', 'threshold_equal', '库存数量恰好等于阈值，正常', { bins: [{ binId: 'A1', onHand: 2 }] });
  for (const condition of ['any_bin', 'selected_product', 'sold_out']) {
    for (const count of [2, 3, 4]) add(condition, `multiple_${count}`, `${count} 个 BIN 同时异常；同一终端一个事件`, { bins: Array.from({ length: count }, (_, i) => ({ binId: `B${i + 1}`, productId: 'demo-product-water', onHand: 0, par: 10 })) });
    add(condition, 'partial_invalid', '部分 BIN 已知异常，部分数据缺失；不可完成整体评估', { bins: [{ binId: 'A1', productId: 'demo-product-water', onHand: 0, par: 10 }, { binId: 'A2', productId: 'demo-product-water', par: 10 }] });
  }
  add('selected_product', 'product_missing', '其他产品存在，但所选 Product ID 不存在', { bins: [{ binId: 'A1', productId: 'different-product', onHand: 0, par: 10 }] });
  add('selected_product', 'different_bin', '同一 Product ID 位于不同 BIN；不按 A1 标签匹配', { bins: [{ binId: 'D8', productId: 'demo-product-water', onHand: 1, par: 10 }, { binId: 'A1', productId: 'different-product', onHand: 0, par: 0 }] });
  add('selected_product', 'product_id_missing', '历史规则只有名称，没有稳定 Product ID', sample('selected_product'), { product: 'Unknown label', threshold: 30 });
  for (const unit of ['C', 'F']) {
    const p = unit === 'C' ? { lower: 2, upper: 8, unit } : { lower: 35.6, upper: 46.4, unit };
    for (const [id, value] of [['low', p.lower - 1], ['high', p.upper + 1], ['lower_equal', p.lower], ['upper_equal', p.upper]]) add('temperature_range', `${unit}_${id}`, `${unit}：${id}`, { temperature: value, unit }, p);
  }
  add('temperature_range', 'unit_mismatch', '摄氏规则收到华氏观测，不直接比较', { temperature: 40, unit: 'F' });
  add('temperature_range', 'below_absolute_zero', '温度低于绝对零度', { temperature: -300, unit: 'C' });
  const lifecycle = [
    { id: 'new', label: '尚无事件', state: null },
    { id: 'active', label: '已有 Active 事件', state: { monitoringState: 'Active', recoveryHitCount: 0 } },
    { id: 'recovering', label: '已有 Active，恢复进度 1/2', state: { monitoringState: 'Active', recoveryHitCount: 1 } },
    { id: 'closed', label: '人工关闭后继续观测（列表证据冻结）', state: { monitoringState: 'Closed', recoveryHitCount: 0 } },
    { id: 'closed_recovering', label: '人工关闭后恢复进度 1/2（列表证据冻结）', state: { monitoringState: 'Closed', recoveryHitCount: 1 } }
  ];
  function rows() {
    const expanded = scenarios.flatMap(scenario => ['Terminal', 'Store'].flatMap(scope => lifecycle.map(stage => {
      const evaluated = E.evaluate(scenario.condition, scenario.parameters, scenario.observation);
      const snapshot = E.evaluate(scenario.condition, params[scenario.condition], sample(scenario.condition));
      const before = stage.state ? { ...stage.state, evidence: snapshot.text, evidenceDetails: snapshot.details } : null;
      const after = E.advance(before, evaluated);
      return { id: `${scenario.condition}.${scenario.id}.${scope.toLowerCase()}.${stage.id}`, condition: scenario.condition, conditionLabel: E.conditions[scenario.condition], scope,
        target: E.target({ terminalId: 'DEMO-001', terminalName: 'Demo Terminal', store: 'Demo Store' }),
        scenario: scenario.label, stage: stage.label, before: stage.state?.monitoringState || 'None', state: after.monitoringState,
        outcome: evaluated.outcome, key: after.eventKey, template: E.templates[after.eventKey],
        baseKey: evaluated.key, baseTemplate: E.templates[evaluated.key], values: after.eventValues,
        evidence: after.monitoringState === 'None' ? '—' : after.evidence,
        eventEvidence: after.eventEvidence, details: after.eventDetails,
        observation: scenario.observation, parameters: scenario.parameters,
        action: after.monitoringState === 'None' ? '不创建事件；示例观测仅供诊断' : !stage.state ? '创建 Active 事件' : after.monitoringState === 'Closed' ? '保持 Closed；新观测仅写时间线' : after.monitoringState === 'Resolved' ? '确认恢复；冻结恢复证据' : `保持 Active；恢复进度 ${after.recoveryHitCount}/2` };
    })));
    const snapshots = Object.keys(E.conditions).flatMap(condition => ['Terminal', 'Store'].flatMap(scope => ['resolved_frozen', 'closed_normal', 'archived', 'acknowledged', 'legacy'].map(kind => {
      const normal = kind === 'resolved_frozen' || kind === 'closed_normal';
      const observation = sample(condition, normal ? 'normal' : 'abnormal');
      const e = E.evaluate(condition, params[condition], observation);
      const legacy = kind === 'legacy';
      const key = legacy ? 'legacy' : kind === 'closed_normal' ? 'recovery' : e.key;
      const values = legacy ? { previous: 'Historical observation without structured data' } : kind === 'closed_normal' ? { evidence: e.text, hit: 1, required: 2 } : e.values;
      const evidence = E.render(key, values);
      const state = kind === 'resolved_frozen' ? 'Resolved' : kind === 'closed_normal' || kind === 'archived' ? 'Closed' : 'Active';
      const labels = { resolved_frozen: '已恢复事件不再改写证据；复发创建新事件', closed_normal: '恢复确认中人工关闭，保留当时正常观测', archived: '规则归档后关闭并停止评估', acknowledged: '确认已阅不改变观测证据', legacy: '历史自由文案保留，不推断数值' };
      return { id: `${condition}.snapshot.${scope.toLowerCase()}.${kind}`, condition, conditionLabel: E.conditions[condition], scope,
        target: E.target({terminalName:'Demo Terminal',store:'Demo Store'}), scenario: labels[kind], stage: labels[kind], before: state, state,
        outcome: legacy ? 'unknown' : e.outcome, key, template:E.templates[key], baseKey:key, baseTemplate:E.templates[key], values,
        evidence, eventEvidence: evidence, details:legacy ? [] : e.details, observation:legacy ? null : observation, parameters:params[condition], action:labels[kind] };
    })));
    return [...expanded, ...snapshots];
  }
  return { productOptions, params, sample, scenarios, rows };
});
