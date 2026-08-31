# Customer Alerts 产品需求文档

| 项目 | 内容 |
| --- | --- |
| 需求名称 | Customer Alerts for Store and Terminal Monitoring |
| 关联需求 | GitHub Issue #1 |
| 文档状态 | Draft |
| 原型范围 | `1.terminalmanage_nayax.html` Alerts、`39.customer_alerts.html` |
| 目标版本 | MVP |

## 1. 背景

商户及其服务组织当前需要依赖人工巡检终端状态、交易、库存和温度数据，无法在异常持续达到业务阈值时及时获知，也缺少统一的告警查看、确认、关闭和审计入口。

本需求在单终端管理页增加 Alerts 能力，并在 Portal Settings 下提供统一 Alert Center。用户可在权限范围内创建监控规则、接收通知、处理告警，并追溯完整事件过程。

## 2. 产品目标

1. 让有权限的客户侧用户针对 Store 或 Terminal 配置 Customer Alert Rule。
2. 在单终端页面提供与当前终端直接相关的告警和规则，缩短定位路径。
3. 在 Alert Center 汇总当前角色可见资源范围内的告警和当前账户拥有的规则。
4. 将“异常是否仍存在”“用户是否已经查看”“用户是否结束处理”明确区分，避免把确认或人工关闭误认为系统恢复。
5. 支持 Portal Alerts 和 Email 通知，并允许 Active 告警按配置重复发送。

## 3. 非目标

- 不提供多条件组合规则；一条 Alert Rule 只包含一个 Condition 和一个 Monitoring Target。
- 不允许用户手动将告警标记为 Resolved。
- 不暴露 Paywizard 内部 Platform-managed Alert Rule 的配置与所有权。
- 不在本期实现短信、电话、Webhook 等通知渠道。
- 不将原型中的角色切换器、样例数据和 `Run next monitoring check` 作为生产功能交付。
- 不调整 Terminal 页面其他模块、侧栏或移动端导航。

## 4. 核心术语

| 术语 | 定义 |
| --- | --- |
| Alert Rule | 对单一 Monitoring Target 持续评估一个 Condition 的规则，包含触发、恢复及通知配置。 |
| Monitoring Target | 被监控资源，仅支持一个 Store 或一个 Terminal；Merchant 只作为授权上下文或 Rule Owner。 |
| Alert Incident | 同一规则异常条件的一次连续发生过程。 |
| Rule Owner | 通过 Manage Alerts 权限控制规则的服务商、代理商或商户账户。 |
| Acknowledgement | 用户确认已看到告警，不改变告警监控状态。 |
| Resolution | 系统确认恢复条件满足后结束告警。 |
| Manual Closure | 有权限用户结束人工处理，但不声明监控信号已经恢复。 |
| Portal Alerts | Portal 内的告警通知渠道；存量内部值 `Portal Inbox` 在界面统一显示为 Portal Alerts。 |

## 5. 用户角色与权限

### 5.1 角色

- Service Provider：查看并管理其客户资源树中的 Merchant、Store 和 Terminal。
- Agent：查看并管理其代理范围内的 Merchant、Store 和 Terminal，不可看到上级 Service Provider。
- Merchant：查看自身及其 Store、Terminal，不可看到 Service Provider、Agent 或其他 Merchant。
- Store：仅查看当前 Store 及其 Terminal，不可看到上级组织和其他 Store。
- View-only 用户：可以查看告警、查看 Timeline、确认告警，但不能创建或修改规则，也不能人工关闭告警。

### 5.2 Monitoring Range 权限矩阵

| 当前角色 | 系统自动注入且不展示的上下文 | 可选 Monitor Scope | 可见目标字段 |
| --- | --- | --- | --- |
| Service Provider | 当前 Service Provider；直连商户场景不显示 Agent | Store、Terminal | Merchant、Store、Terminal |
| Agent | 当前 Service Provider、Agent | Store、Terminal | Merchant、Store、Terminal |
| Merchant | 当前 Service Provider、Agent、Merchant | Store、Terminal | Store、Terminal |
| Store | 当前 Service Provider、Agent、Merchant、Store | Store、Terminal | Terminal |

Store Target 为动态范围：规则自动覆盖当前及未来归属到该 Store 的 Terminal；Terminal 移出该 Store 后停止评估。Store 角色选择 Store Scope 时，系统自动使用当前 Store。

### 5.3 权限规则

| 操作 | 可见用户 | Manage Alerts 用户 |
| --- | --- | --- |
| 查看告警及 Timeline | 是 | 是 |
| Acknowledge | 是 | 是 |
| 创建规则 | 否 | 是 |
| 编辑规则 | 否 | 是 |
| Pause / Resume 规则 | 否 | 是 |
| Close Incident | 否 | 是 |

## 6. 信息架构

### 6.1 单终端 Alerts

入口：Terminal Management > Terminal > Alerts。

页面包含：

- 顶部操作：Create Alert Rule、Open Alert Center。
- 两个 Tab：Alerts、Rules。
- Alerts 表：State、Condition、Evidence、Opened、Actions。
- Rules 表：Condition、Criteria、Notifications、Status、Modified、Actions。
- 仅显示当前 Terminal 的告警和直接以当前 Terminal 为 Target 的规则。

### 6.2 Alert Center

入口：Portal > Settings > Alerts。

页面包含：

- 页面标题、Create Alert Rule。
- 原型角色转换器；生产环境由登录会话和授权上下文决定角色，不提供手动转换。
- KPI：Active Alerts、Active Rules。
- 两个 Tab：Alerts、Rules。
- 告警搜索与筛选工具栏。
- Alerts 汇总表与 Rules 汇总表。

## 7. 功能需求

### 7.1 Alert Center 角色范围

| 编号 | 需求 |
| --- | --- |
| FR-001 | 系统必须依据当前登录角色计算 Alert Visibility Scope，不得返回上级或范围外资源。 |
| FR-002 | KPI、Alerts、Rules、Store 筛选项、Terminal 筛选项必须使用同一角色范围。 |
| FR-003 | Rules 仅显示当前 Rule Owner 拥有且 Target 位于当前角色范围内的规则。 |
| FR-004 | 客户可查看被明确标记为 Customer-visible 的 Platform-managed Alert Incident，但不可查看其规则。 |
| FR-005 | 角色上下文变化后必须清空无效的搜索和筛选条件，并保留当前 Alerts/Rules Tab。 |

### 7.2 创建与编辑 Alert Rule

#### 单终端入口

- Monitoring Target 固定为当前 Terminal，不展示可编辑 Target 字段。
- Condition 分区标题右侧显示当前 SN。
- 创建时可选择 Condition；编辑时不得改变既有规则的 Target 和 Condition。

#### Alert Center 入口

- 表单顺序为 Monitoring Range、Condition、Notifications。
- Monitoring Range 按当前角色显示允许的下级字段。
- Monitor Scope 仅提供 Store 和 Terminal，默认选择 Terminal。
- Store Scope 必须选择 Store；Terminal Scope 必须选择 Store 和 Terminal。
- 上级字段变化时必须清空所有失效的下游值。
- Target 未完整选择前，Condition 和 Save Rule 必须禁用。
- 编辑规则时仅可回填当前角色范围内的 Target；历史 Target 无法匹配时必须阻止保存，直至用户重新选择有效范围。

#### 通用规则

| 编号 | 需求 |
| --- | --- |
| FR-010 | 一条规则只能配置一个 Condition 和一个 Monitoring Target。 |
| FR-011 | 系统必须依据目标下 Terminal 的能力判断 Condition 是否可用。 |
| FR-012 | Store Target 的能力检查必须动态聚合其下所有 Terminal。 |
| FR-013 | 当没有任何 Terminal 支持所选 Condition 时，Save Rule 必须禁用。 |
| FR-014 | 保存后规则状态默认为 Active，并记录 Rule Owner、Rule Creator 和 Modified 时间。 |
| FR-015 | Pause 后停止新异常评估和通知；Resume 后恢复评估。Pause 不改变既有 Incident 状态。 |
| FR-016 | 所有输入、选择和保存错误必须在当前弹窗内完成校验，不得静默失败。 |

### 7.3 支持的监控条件

| Condition | 触发参数 | 主要信号/限制 |
| --- | --- | --- |
| OPC Offline | Unavailable for（分钟） | Payment Service 不可用时触发。 |
| No Approved Transaction | No transaction for（小时）、Opening grace（分钟）、Evaluation schedule | 使用最后一笔 Approved Transaction；MVP 评估计划为 Store business hours。 |
| Machine Stock Below % PAR | Below（% PAR） | 使用全部 Product Map 的 On Hand / PAR。 |
| Any BIN Below Quantity | Below quantity（units） | 逐个评估 Product Map BIN。 |
| Selected Product / BIN Below % PAR | Product / BIN、Below（% PAR） | 使用稳定的 Product Map 位置。 |
| Sold Out | 无 | 任一被监控 BIN 的 On Hand = 0。 |
| Temperature Out of Range | 上下限、持续异常时间、恢复上下限、持续恢复时间 | 仅适用于具有标准化数值温度能力的 Terminal。 |
| Refrigeration Fault | 无 | 仅适用于具有标准化制冷故障状态的 Terminal。 |
| Temperature Data Unavailable | 无 | 温度信号超过预期新鲜度或传感器不可用。 |

### 7.4 通知配置

| 编号 | 需求 |
| --- | --- |
| FR-020 | Portal Alerts 默认启用。 |
| FR-021 | 用户可启用 Email，并添加一个或多个有效外部邮箱地址。 |
| FR-022 | Email 未启用时不显示收件人字段，保存时不得写入或发送外部收件人。 |
| FR-023 | 在当前弹窗内关闭再重新开启 Email 时，应恢复尚未保存的收件人输入。 |
| FR-024 | 启用 Email 但没有有效收件人时不得保存。 |
| FR-025 | Repeat while Open 默认关闭；开启后可选择每 2、4 或 8 小时重复通知。 |
| FR-026 | 重复通知仅在 Incident 为 Active 时发送；Resolved 或 Closed 后停止。 |

### 7.5 Alerts 列表与筛选

Alert Center 支持：

- 关键词搜索：Condition、Store、Terminal。
- State：All、Active、Resolved、Closed。
- Acknowledgement：All、Needs acknowledgement、Acknowledged。
- Store、Terminal、Condition 筛选。

展示规则：

- State 只展示 Active、Resolved、Closed，不展示 Recovering。
- 已确认告警在 State 旁显示紧凑确认图标；确认人和时间通过 Tooltip 和无障碍名称提供。
- 列表不展示 Source 字段。
- Actions 使用图标按钮，并在鼠标悬停或键盘聚焦时即时显示功能名称。

### 7.6 Incident 生命周期

```text
条件持续达到阈值
        │
        ▼
      Active ────── Acknowledge（正交记录，不改变状态）
        │
        ├── 连续恢复检查满足规则 ──► Resolved
        │
        └── Manage Alerts 用户结束处理 ──► Closed
```

| 编号 | 需求 |
| --- | --- |
| FR-030 | 条件达到阈值时创建 Active Incident，并按规则渠道发送通知。 |
| FR-031 | 同一 Rule 与 Target 的同一连续异常只能存在一个 Incident。 |
| FR-032 | Acknowledge 记录确认人和确认时间，不改变 Monitoring State，也不停止重复通知。 |
| FR-033 | 非温度条件默认需要连续两次正常 Recovery Check 后变为 Resolved。 |
| FR-034 | 恢复确认过程中 Incident 仍显示 Active；再次异常时清零恢复进度并记录 Recovery reset。 |
| FR-035 | Temperature Out of Range 按规则配置的恢复区间及持续恢复时间判定 Resolution。 |
| FR-036 | 用户不得手动 Resolve；Resolved 只能由系统确认恢复后产生。 |
| FR-037 | Manage Alerts 用户可对 Active Incident 执行 Manual Closure。 |
| FR-038 | Manual Closure 原因包括 Planned maintenance、Replenishment in progress、False positive、Duplicate incident、Other；Other 必须填写备注。 |
| FR-039 | Closed 不表示系统恢复。系统可在后台继续观察恢复；恢复前同一持续异常不得重新开单，恢复后再次异常可创建新 Incident。 |

### 7.7 Incident Actions

- Acknowledge：仅 Active 且尚未确认时显示。
- Close incident：仅 Manage Alerts 用户在 Active 状态下显示，图标使用 `stop_circle`。
- View timeline：所有可见 Incident 均可使用。
- 所有图标按钮必须具有 Tooltip、`aria-label`、键盘焦点和可见焦点样式。

### 7.8 Timeline

Timeline 是 Incident 的审计流程查看器：

- 顶部以单行文本展示当前状态、Terminal / Store、Opened 时间及持续时长。
- 事件按从旧到新展示，相同时间按实际写入顺序展示。
- 使用中性圆点和单线连接，不使用状态卡片或彩色事件图标。
- 每条记录只展示事件名称、时间和必要业务内容。
- 支持的事件：Opened、Acknowledged、Recovery check、Recovery reset、Resolved、Closed manually、Recovery observed after closure。
- 弹窗固定底栏仅保留 Close。
- 原型可提供 `Run next monitoring check` 模拟监控结果；生产版本不向客户提供该操作。

### 7.9 Rules 列表

- Alert Center 列：Condition、Target、Criteria、Notifications、Status、Modified、Actions。
- 单终端列：Condition、Criteria、Notifications、Status、Modified、Actions。
- Status 为 Active 或 Paused，不显示前置圆点。
- Manage Alerts 用户可通过 30 × 30 px 图标按钮 Pause、Resume、Edit。
- View-only 用户不显示可修改操作。

## 8. 页面与弹窗体验要求

- 页面继承现有 PAYwizard Portal 或 Terminal Management 的侧栏、顶栏、字体、间距和响应式规则。
- Alert Center 页面不使用独立 Hero 或与门户不一致的视觉外壳。
- 创建/编辑规则弹窗：Alert Center 宽 860 px，Terminal 宽 680 px；不得超出视口。
- 表单不使用数字步骤、额外说明卡、装饰性分割线或可见字段副标题。
- 分区间距 20 px，字段间距 12 px，Label 与控件间距 6 px。
- 输入框、选择框和内联按钮统一为 36 px 高、8 px 圆角。
- Alert Center 的 Monitoring Range 桌面端最多两列；其他分区和 Terminal 弹窗使用单列；移动端全部单列。
- Email、Repeat 及错误区域未启用或为空时不得占据布局高度。
- 弹窗支持 Escape 关闭、关闭后焦点恢复、内容区滚动和固定操作底栏。
- 页面不得产生横向滚动；数据表在移动端使用自身滚动区域。

## 9. 数据要求

### 9.1 Alert Rule

至少包含：

- `id`
- `condition`
- `parameters`
- `targetType`：Store / Terminal
- `targetId`
- `targetName`
- `criteria`
- `channels`
- `recipients`
- `repeatHours`
- `recoveryChecksRequired`
- `status`
- `owner`
- `creator`
- `modified`

### 9.2 Alert Incident

至少包含：

- `id`
- `ruleId`
- `condition`
- `terminalId`、`terminalName`、`store`
- `monitoringState`：Active / Resolved / Closed
- `evidence`
- `opened`、`duration`
- `acknowledgedAt`、`acknowledgedBy`
- `recoveryChecksRequired`、`recoveryHitCount`、`recoveredAt`
- `closedAt`、`closedBy`、`closeReason`、`closeNote`
- `events[]`

### 9.3 兼容要求

- 现有原型继续使用 `paywizard.customerAlerts.v1`；正式实现由后端持久化接口替代，不依赖浏览器 `localStorage`。
- 存量 `Open` 迁移为 Active；`Acknowledged` 迁移为 Active 并保留确认元数据；`Resolved` 保留为 Resolved。
- 存量 `Recovering` 迁移为 Active，并保留恢复进度与 Timeline。
- 删除历史 Incident 的 `source` 字段，不在 UI、筛选、搜索或详情中继续暴露。
- 内部历史渠道值 `Portal Inbox` 需兼容读取，但所有用户可见文案统一为 Portal Alerts。

## 10. 非功能要求

### 10.1 权限与安全

- 所有范围过滤和 Manage Alerts 权限必须由服务端校验，不能只依赖前端隐藏。
- 用户不得通过修改 URL、Target ID 或请求参数访问范围外资源。
- 创建、编辑、暂停、恢复、确认、人工关闭均需记录操作者和时间。

### 10.2 可用性与无障碍

- 所有表单控件必须具有关联 Label。
- Tab、Dialog、Tooltip、表格操作必须支持键盘操作。
- 图标按钮必须提供可读的功能名称，不能只依赖图形含义。
- 动态验证、能力检查和监控模拟结果使用 `aria-live` 通知。
- 支持 2048 × 1049、1440 × 900 和 390 × 844 视口，不产生页面级横向溢出。

### 10.3 性能

- Alert Center 首屏 KPI、告警和规则应在同一权限快照下返回，避免口径不一致。
- 大数据量场景需支持服务端分页、排序与筛选；MVP 原型中的前端全量过滤不作为生产方案。

## 11. 验收标准

### 11.1 单终端

- 可在 Terminal Alerts 中切换 Alerts / Rules。
- 创建规则时 Target 固定为当前 SN，页面不出现 Monitoring Target 输入框。
- 新建、编辑、Pause、Resume、Acknowledge、Close incident、View timeline 均按权限正确工作。
- Open Alert Center 跳转到 `39.customer_alerts.html?view=incidents` 对应的 Alerts 视图。

### 11.2 Alert Center

- 不同角色只能看到其资源子树内的 KPI、Alerts、Rules 和筛选项。
- Monitoring Range 不展示当前角色的上级或已知固定层级。
- Store、Terminal 两种目标可以正确创建并在刷新后回填，Monitor Scope 中不出现 Merchant。
- 存量 Merchant Target 规则在读取时按当前 Store 拆分；首个 Store 保留原规则 ID，其余规则使用稳定派生 ID，已有 Incident 按所属 Store 重新关联。
- 角色范围外的历史规则不得被覆盖保存。
- Source 不出现在筛选、表格、详情或存储数据中。

### 11.3 生命周期

- 异常达到阈值创建 Active Incident。
- Acknowledge 后状态仍为 Active，确认信息写入 Timeline。
- 正常检查未达到恢复次数时仍为 Active；达到恢复条件后系统自动 Resolved。
- Manual Closure 后状态为 Closed，并记录原因、备注、用户和时间。
- Closed 与 Resolved 语义和展示不可互换。

### 11.4 通知与表单

- Email 未选择时不显示收件人区域，且保存数据中不包含外部邮箱。
- Email 已选择但无有效收件人时禁止保存。
- Repeat 未选择时不显示频率；选择后可配置 2、4、8 小时。
- 九类 Condition 在无参数、单参数和多参数情况下均无空列、内容溢出或异常留白。

## 12. 原型数据与生产实现边界

以下内容仅用于原型评审：

- 四个固定角色示例账户及 URL `role` 参数。
- 12 条稳定样例规则和 24 条稳定样例 Incident。
- 浏览器 `localStorage` 持久化。
- `Run next monitoring check` 及其预设正常/异常结果。
- 固定演示时间、操作者 `robasz` 和样例邮箱。

生产实现必须接入真实身份权限、资源树、监控数据、规则执行服务、通知服务、审计日志及服务端存储。

## 13. 待确认事项

1. 各 Condition 的生产监控频率、数据延迟和告警送达 SLA。
2. Store business hours 的权威数据源、时区和节假日处理方式。
3. Merchant / Store 动态目标中，部分 Terminal 不支持某项能力时，是跳过不支持终端还是禁止整条规则创建。
4. Alert Center 的默认时间范围、服务端分页大小及排序规则。
5. Email 退信、通知失败、重复通知失败后的重试和用户可见状态。
6. Platform-managed Incident 对客户可见时的脱敏范围和责任边界。
7. Closed Incident 后台确认恢复的最长追踪周期。
