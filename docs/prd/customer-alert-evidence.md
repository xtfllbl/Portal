# Customer Alerts: Condition、Target 与 Observed Evidence

2026-09-10 确认并落地。适用于 `39.customer_alerts.html` 与 `1.terminalmanage_nayax.html` 的 Alerts；不包含 SLA Alerts。

## 交付与唯一来源

- 研发工作簿：`outputs/alert-evidence-20260910/Customer-Alerts-Evidence-Matrix.xlsx`。
- 全量案例页：`customer-alert-evidence-cases.html`，可从原型首页 Customer Alerts 分组进入。
- 文案及评估：`scripts/customer-alert-evidence.js`，导出 `templates`、`variables`、`reasons`、`evaluate`、`advance`、`target`。
- 观测示例：`scripts/customer-alert-evidence-cases.js`，导出 `scenarios`、`rows`、`sample`。所有数值为明确生成的演示观测。
- 工作簿由 `scripts/export-alert-evidence.mjs` 读取这两个模块生成，没有另外维护一份英文文案。
- 117 个观测场景 × 2 种 Target × 5 个事件阶段，另加 80 个历史/操作快照，共 1250 行。模板表 26 项，包括基础模板、恢复修饰、Target、BIN 明细与旧数据兼容模板。

“全量”指当前 8 类 Condition 的已定义观测分支与合法生命周期组合；数值、名称和时间等无限取值使用变量和边界示例，不按每个值重复列行。通知渠道和确认状态不影响证据模板，按正交规则处理。

## Target 规则

| 规则 Target | 事件 Target | 评估方式 |
| --- | --- | --- |
| Terminal | 该终端 | 每条规则对当前终端评估一次 |
| Store | 门店内具体终端 | 动态逐终端评估，不合并门店库存；未来加入的终端自动进入范围 |

中心 Target 文案为 `{terminalName} · {storeName}`；无终端名称时使用 `Terminal - {terminalId}`，无门店名称时显示 `Store unavailable`。终端页已有上下文，不额外增加重复 Target 列。

同一 Rule＋Terminal 的同一次持续异常只有一个事件。Any BIN、Sold Out 和 Selected Product 多 BIN 异常合并；按 BIN ID 排序，列表最多 3 个明细并追加 `; +N more`，详情和时间线保存完整清单。所有受监控 BIN 均有效且正常时，才能进入恢复。

Selected Product 按稳定 `productId` 匹配每台终端的所有对应 BIN；不按名称、A1 标签或相同槽位匹配。现有演示选择项显式映射到 demo Product ID，未知历史名称不会猜测 ID。部分必需 BIN 数据无效时，整个终端本次评估为 unknown，不展示错误的部分汇总。

## 条件与阈值

| Condition | 输入 | 异常判定 | 正常或特殊边界 |
| --- | --- | --- | --- |
| Payment Service Offline | available、unavailableMinutes、duration（分钟） | 不可用持续时间 ≥ duration | available=true 为正常；已知不可用但未到阈值为 pending，不视为恢复 |
| No Approved Transaction | lastApprovedMinutes、duration（小时） | 距最后成功交易 ≥ duration×60 | 小于阈值正常；从未交易且没有权威监控起算基准为 unknown |
| Machine Stock Below % PAR | bins、threshold（%） | SUM(On Hand)/SUM(PAR)×100 < threshold | 等于阈值正常；不平均各 BIN 百分比 |
| Any BIN Below Quantity | bins、threshold（units） | 任一 On Hand < threshold | 等于阈值正常；所有 BIN 正常才恢复 |
| Selected Product / BIN Below % PAR | productId、bins、threshold（%） | 任一匹配 BIN 的 On Hand/PAR×100 < threshold | Product ID 未匹配为 unknown；其他产品 BIN 不参与 |
| Sold Out | bins | 任一 On Hand=0 | 所有 BIN 库存 >0 正常 |
| Temperature Out of Range | temperature、unit、lower、upper | 小于 lower 或大于 upper | 上下界均包含；C/F 必须与规则一致，不隐式换算 |
| Refrigeration Fault | fault | fault=true | fault=false 正常；缺失不是 false |

库存必须为非负整数，PAR 必须为正整数，重复/缺失 BIN ID 属于无效观测。温度必须有限且不低于绝对零度。无效规则阈值不参与评估。

判定使用原始数值。展示时间为 h/m，数值最多一位小数；百分比舍入若会掩盖低于阈值，显示 `<阈值`，例如真实 24.99% 在 25% 阈值下显示 `Stock <25%`。

## 事件与证据

| 事件阶段 | 新观测 | 结果 |
| --- | --- | --- |
| 无事件 | abnormal | 创建 Active，展示观测 |
| 无事件 | normal / pending / unknown | 不创建事件；案例表 Observed Evidence 为 `—`，诊断观测另列 |
| Active | normal | 连续恢复次数 +1；未满足次数保留 Active 并追加 `Recovery check n/N`；满足后 Resolved |
| Active | abnormal / pending | 保持 Active，清零恢复计数；此前有进度则追加 `Recovery reset` |
| Active | unknown | 保持 Active，不通知新的异常/恢复；清零恢复计数，明确原因 |
| Active | Acknowledge | 不改变观测、恢复或 State |
| Active | Manual Closure | Closed，保留关闭时证据；关闭原因与备注单列时间线 |
| Closed | 后续观测 | 列表证据冻结；新观测及完整 BIN 明细进入时间线；即使恢复也保持 Closed |
| 已归档规则 | 后续评估 | 关闭遗留 Active 事件并停止评估；无 Run next monitoring check 按钮 |
| Resolved | 后续观测 | 保持恢复时快照；同一持续异常不能重开，恢复后的新异常属于新的事件 |

unknown 是评估结果，不增加新的 Incident State。缺失/过期/无效/不支持都不能伪装为正常、零库存或已恢复。恢复默认需要连续两次正常，unknown 会破坏连续性。

上游需提供数据新鲜度判定及计入业务监控时间的持续时长；本次不编造采集频率、从未交易起算时间或工作时段调度。Monitoring Hours 的真实后端调度仍按其独立规格实施。

## 接口与编程约定

`evaluate(condition, parameters, observation)` 返回 `{ outcome, key, values, text, details }`。outcome 为 abnormal、normal、pending、unknown。`advance(incidentOrNull, evaluation, required)` 返回新的状态、恢复计数、列表证据及时间线证据，两者在 Closed 后有意不同。

观测输入：

- 所有条件均可提供 `{ reason }`、`{ stale: true }` 或 `{ supported: false }`；reason 使用模块固定枚举。
- Payment Service：`{ available: boolean, unavailableMinutes?: number }`。
- Approved Transaction：`{ lastApprovedMinutes?: number, neverApproved?: boolean }`。
- 库存：`{ bins: [{ binId, productId?, onHand, par? }] }`；Product ID 对选定产品监控必需，PAR 对百分比监控必需。
- 温度：`{ temperature: number, unit: 'C' | 'F' }`。
- 制冷：`{ fault: boolean }`。

文案只能从模板和结构化值生成；不可解析英文证据判断状态。模板缺少参数会抛出错误，不静默显示 undefined。页面输出需 HTML 转义。工作簿 Templates/Contract 两表列出完整模板与变量含义；Observations 表给出 JSON 输入；Matrix 按 Case ID 的前两段关联 Scenario ID。

## 演示与历史兼容

普通列表新增 4 条代表案例：4 个 BIN 同时缺货、华氏低温、已有事件观测过期、所选产品位于不同 BIN。完整组合留在独立案例页。

修正原种子中库存 75% 却低于 25% 阈值的错误，生成符合阈值的观测。修复部分种子事件不属于其规则 Target 的问题，为历史示例创建正确范围的规则；仅校正新生成的演示种子，已有事件的规则引用、ID、人工操作和历史记录保留。

已知原始演示文案可显式补入结构化演示观测；任意用户历史自由文案保留为 `Previous evidence`，不解析、不伪造数值。保留 `legacyEvidence`；新检查使用当前规则参数及明确的模拟观测生成文案。手动关闭后的列表快照不会被新检查覆盖。

本次实现的是原型中的统一评估/展示函数与手动监控演示，不是生产遥测、定时任务、通知或真实事件存储服务。
