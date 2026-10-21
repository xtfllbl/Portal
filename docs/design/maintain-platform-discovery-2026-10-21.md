# Portal 与 Maintain 平台入口拆分

状态：已按 Q1–Q5 的确认实施，完成本地构建、针对性测试与桌面浏览器检查；尚未部署。

## 最新修正（2026-10-21）

用户在首次交付后确认以下修正，覆盖先前「四列布局」和「Maintain 保留四个预付卡入口」的决定：

- 身份切换器分上下两个平台区域：上方标注 PORTAL，保留既有三列 Portal 身份；下方标注 MAINTAIN，独立展示 WizarPOS Maintain。
- Maintain 的 Prepaid Cards 菜单只有 Card List；Card Details 仍属于其详情流程。Activation、Balance Adjustment、Loss & Replacement 只属于 Portal。
- 用户已确认：Maintain 的 Card List / Card Details 内也不提供通往上述三页的 Add New Card、Import Cards、Adjust balance、Replace Card、New Adjustment 入口；移除空 More actions 菜单。Portal 保留既有入口和页面功能。
- Maintain 直达三页或从这三页切换到 Maintain 时进入 Transactions；Card List / Card Details 仍可作为共有页面保留。

## 已确认

- Portal 与运维是两个平台。右上角现有身份切换中分上下 PORTAL / MAINTAIN 两区，WizarPOS Maintain 位于第二行；左上角展示 PAYwizard / MAINTAIN 标识。
- WizarPOS Provider 下移除 Maintain 菜单组。
- Maintain 按正式环境当前运维菜单的分组、名称与相对顺序组织。已有对应原型的入口可用，未实现的入口置灰且不可点击。
- Q1：正式菜单之外、属于运维平台的已有原型继续保留，归入相应分组；三个 Portal 专属预付卡页面不迁入 Maintain。
- Q2：Transactions、Remote Diagnostic、预付卡 Card List 及其详情等共有功能保留 Portal 入口，在 Maintain 中复用已有原型与业务流程、演示数据。
- 本次仍使用静态 HTML/CSS/JavaScript；展示身份不代表真实生产鉴权角色。

## 正式菜单基线

2026-10-21 在浏览器现有已登录标签页 `https://portal.paywizard.biz/maintain/` 中展开四个分组核查。以下是该正式环境会话当前可见的菜单，不宣称覆盖其他角色的全部资源。只读取菜单，未操作业务数据。

| 分组 | 顺序 | 正式菜单 | 原型对应及现状 |
| --- | --- | --- | --- |
| Payment | 1 | Transactions | `12.transaction_list.html`，可复用 |
| Payment | 2 | Settlement Info | 暂无对应入口，置灰 |
| Payment | 3 | Billing Overview | `44.billing_overview.html` |
| Payment | 4 | Payment Channel | `47.payment_channel.html` |
| Payment | 5 | Service Fee Log | 暂无对应入口，置灰 |
| Payment | 6 | Service Fee Report | 暂无对应入口，置灰 |
| Payment | 7 | Cached Transaction | 暂无对应入口，置灰 |
| Operations | 1 | Leads | `29.INTL_PSP_merchant_lead_list.html` |
| Operations | 2 | Service Provider | `21.service_provider.html` |
| Operations | 3 | Developer Manage | `50.developer_manage.html`，包含全部绑定、白名单、Token 子页 |
| Operations | 4 | Onboarding | `38.Merchant_onboard.html`，已有运维列表及审核闭环 |
| Operations | 5 | Device Manage | Provider 设备总览与正式运维库存/配置差异管理并不等价，置灰 |
| Operations | 6 | Merchant List | `5.merchant_manage_iso.html` |
| Operations | 7 | Processor Template | `3.Processor_template_new.html`，现原型菜单名为 Application Parameters |
| Operations | 8 | Remote Diagnostic | `13.remote_control.html` |
| Operations | 9 | SLA Alerts | `32.sla_alert_rules.html` |
| Operations | 10 | Customer Alerts | `39.customer_alerts.html?role=operations-manager`，必须使用全客户运维模式 |
| Prepaid Cards | 1 | Card List | `14.prepaid_card_list.html` |
| System | 1 | Role Permission | 当前为不可用占位，置灰 |
| System | 2 | Email Configuration | 暂无对应入口，置灰 |
| System | 3 | Terminal Logs | `24.maintain_terminal_log.html`，已有全局列表，S/N 为可选筛选 |
| System | 4 | Err Txn Logs | 暂无对应入口，置灰 |
| System | 5 | Account Management | 当前为不可用占位，置灰 |
| System | 6 | Log Management | 暂无对应入口，置灰 |
| System | 7 | Password Rule Config | 暂无对应入口，置灰 |
| System | 8 | Reginal | 正式环境当前拼写；暂无对应入口，置灰 |
| System | 9 | Currency Settings | 暂无对应入口，置灰 |
| System | 10 | Billing Setup | `41.billing_setup.html` |
| System | 11 | Var Push Log | 暂无对应入口，置灰 |
| System | 12 | Appeals | 当前为不可用占位，置灰 |

### 已确认并实施的归组

- Payment 增加 Parameter Pool（`49.parameter_pool.html` 及 form、usage）。
- Operations 增加 Impersonate（`48.impersonate.html`）。
- Processor Template 菜单采用正式名称，复用现有 Application Parameters 页面族。
- Maintain 的 Prepaid Cards 只保留 Card List；其余三项仅在 Portal 中提供。
- Billing Setup 按正式基线放在 System。

### 已确认并实施的切换与链接行为

- Q4：在当前标签页切换，两端共有的页面保留，其他页面进入目标默认页；默认 Transactions，Billing-only Merchant 默认 Billing & Payments。
- Q5：旧运维专属地址自动使用 Maintain 身份和导航，保留现有地址；共有地址继续使用当前平台上下文。

## 业务等价核查

- Onboarding 已有运维列表、创建邀请及审核入口，并通过 review 模式锁定商户填写字段、支持批准/退回，可在 Maintain 中复用。
- Terminal Logs 已有全局日志列表，不要求从某个终端详情进入，可作为 System 菜单。
- Terminal Logs 现有查看详情指向 `old/opc_log.html`，该详情没有共享壳；已将详情接入 `24.terminal_log_detail.html`，携带所选行的 S/N、时间、级别和标题；详情与返回保留 Maintain 上下文。原型没有正式页的日期范围筛选，本次不据菜单迁移宣称补齐业务能力。
- 正式 Device Manage 是运维全局库存、参数/应用/密钥状态及配置差异管理。现 `2.resellermerchantterminal.html` 只有单服务商的设备树与总览，不据同名启用。Merchant List 内原有终端分配、配置、Parameter Pool 切换链路仍须保留。
- Customer Alerts 必须区分全客户代管与服务商自己的规则；继续遵循 ADR-0001，不与 SLA Alerts 合并。
- Portal Branding 的自定义邮件页面不等同于 System / Email Configuration；Terminal Logs 不等同于 Log Management；Transactions 不充当结算、缓存交易或服务费页面。

## 源码依据与实现注意

- 正式前端根目录：`/Users/beaver/Paywizard/代码/paywizard/paywizard-maintain`。
- `src/apis/user.ts:4-9`、`src/stores/user.ts:167-172`：菜单来自用户信息中的 `resourceTree`。
- `src/layouts/components/sidebar.ts:152-174`：使用后台名称和顺序构造菜单；该文件前部旧静态树仅参与旧名称的路由映射，不能作为正式菜单清单。
- `src/views/home/home.vue:9-21`：正式默认入口是首个可用菜单，本次当前正式菜单的首项为 Transactions。
- 原型共享壳：`scripts/platform-admin-shell.js`；当前 Maintain 内部模块键为 `matintain`，有九个模块入口；修改时同步面包屑和页面族。
- 身份白名单与上下文：`scripts/portal-access-context.js`；共享壳及多个业务脚本目前硬编码 `wizarpos`，必须按运维与服务商职责分别处理，不能只改菜单。
- `scripts/branding-store.js` 会再次应用自定义 Portal logo，Maintain 标识须有明确平台归属，避免被异步覆盖。
- Impersonate 入口当前强制 WizarPOS Provider；迁移须同时保持目标 Portal 新标签页、被代入用户身份和 End impersonation 返回原运维上下文的行为。
- Parameter Pool、Billing Retry、Developer Manage 与 Payment Channel 等页面自身的身份检查，以及商户→终端分配→参数切换链路，均属迁移验收范围。
- 禁用分组仍可展开查看子菜单；禁用项不能导航，键盘状态需明确。

## 设计树

1. 平台拆分：用户已明确 → 上下平台分区、Maintain 标识、Provider 移除 Maintain。
2. 正式菜单事实：已由线上菜单核查 → 使用四组菜单与原有相对顺序。
3. 已有原型：Q1 已确认保留扩展 → Q3 具体归组已确认并实施。
4. 两端共有能力：Q2 已确认复用 → 按业务等价核查可用入口。
5. 身份切换：Q4 目标页面策略已确认并实施。
6. 旧地址：Q5 运维专属地址策略已确认并实施。
7. 决策已收敛，用户已逐项确认，按共同理解实施。

本次平台入口与菜单布局可逆，不单独新增 ADR；既有 Billing、Parameter Pool、告警与 Impersonation 业务规则继续有效。确认后的导航归属将更新相关功能文档中的历史入口说明。


## 组件与验证

- 导航继续复用共享壳的可折叠菜单；组件模式参考 PrimeVue v4 PanelMenu。身份切换继续复用现有浮层、单选身份按钮与上下平台区域与上方三列 Portal 布局，参考 Popover / Menu；为区分平台，Maintain 使用独立的第二行。未引入组件库。
- 本次尝试读取 PanelMenu、Popover 官方 v4 文档，工具未能访问；沿用项目已有已验证结构，并验证键盘、选中、禁用及桌面视口。未宣称完成官方组件全部 API 核验。
- 32 个菜单项：正式 30 项，扩展 Parameter Pool、Impersonate 两项；17 个可用，15 个置灰。逐一打开全部可用入口，核对 Maintain 身份、当前菜单、内容可见及页面异常。
- `tests/maintain-platform.spec.js` 覆盖平台切换、菜单与禁用、旧链接、品牌异步隔离、Customer Alerts 运维上下文、Parameter Pool 商户链路、Impersonate 新标签页及结束返回、Terminal Logs 详情返回、上下平台浮层的键盘和桌面边缘。
- Developer Manage、Payment Channel 的既有表单、绑定、Token、白名单、保存失败、下拉搜索及离页保护回归通过。账单提醒与渠道排版回归通过；Parameter Pool、Impersonation、Billing Store 的单元检查通过。
- `npm run build`、`git diff --check` 通过。桌面浏览器实际检查 Developer Manage、上下平台分区、System 禁用项、Billing Setup 和 Portal 切回；保持既有紧凑表格与按钮规格。
- 本次变更只涉及静态原型，不代表生产权限、真实支付或后端运维能力已改变。

### 本轮修正验证

Maintain 专项十项通过，覆盖全部 17 个可用菜单、Portal 预付卡三页保留、Maintain 列表与详情的跨页入口移除、直达拦截、跨平台切换落点，以及 PORTAL / MAINTAIN 上下区域和键盘操作。`npm run build`、`git diff --check` 通过。已在桌面浏览器打开 Remote Diagnostic，检查上下平台区域及只含 Card List 的运维预付卡菜单；本轮没有部署。

### 扩展回归的既有差异

`tests/portal-access-profiles.spec.js` 的 `billing and merchant direct links obey role visibility` 在商户身份直达 Agent List 时仍失败：测试期待跳回 Transactions，而 Agent List 自带页面身份会切换为 Platform Operations / WizarPOS Provider。分别运行当前脚本和 `git show HEAD:scripts/platform-admin-shell.js`，两者均停留在 `2.agent_list_iso.html`、展示同样身份，确认是本次之前已有的测试与页面身份差异。本次保留 Agent List 业务与身份规则，不将该失败计为通过。首次交付时 Maintain 专项九项、Developer Manage 十项、Payment Channel 十三项、账单提醒两项、渠道排版一项、相关单元检查二十四项均通过；另三项身份/旧链接检查及一项隔离数据库下的 Billing Overview 身份切换检查通过，共 63 项。Billing Overview 使用独立测试端口与临时数据库，未清理现有开发服务的数据。
