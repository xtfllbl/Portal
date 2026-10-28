# 服务商季度账单：界面设计与验收

2026-10-28。静态 HTML/CSS/JavaScript 可交互原型，沿用现有 Maintain / Portal 框架；不安装组件框架。

## 页面与入口

| 使用方 | 页面 | 入口及用途 |
| --- | --- | --- |
| 运维 | `52.service_provider_billing.html` | Maintain → Payment → Service Provider Billing；按服务商、季度、状态查询，生成季度草稿 |
| 运维 | `52.service_provider_bill.html?id=PB-2026Q3-1050` | 核对、调整和发布；Charges / System calculation / Source events / Activity |
| 运维 | `52.service_fee_log.html` | 查看收费事件、设备与归属、触发原因及对应账单 |
| 运维 | `52.service_fee_settings.html` | 为服务商配置计费启用月份、币种与费用，维护未来生效的价格 |
| 服务商 | `52.provider_billing.html` | Portal → Billing & Payments；仅当前服务商已发布的账单 |
| 服务商 | `52.provider_bill.html?id=PB-2026Q3-1047` | 最终收费明细、备注、支付入口与支付记录 |
| 付款人 | `43.billing_payment_link.html#provider.2026-Q3.1047.review` | 复用已有支付页面，展示当前账单版本并模拟付款 |

已有商户收款入口继续使用原页面。Maintain 的 Billing Overview 增加服务商账单入口。服务商账单不向商户和门店角色开放。

## 业务表达

- 按自然季度、UTC 汇总激活费及逐月服务费，先产生草稿，经运维核对后发布。
- 激活依据参数推送成功提交的事件；更换商户或服务商产生新的激活收费，同商户重新绑定不重复收激活费。
- 激活或重新启用的当月免月费，次月开始；解绑不撤回已经触发的费用，并停止未来月费。
- 历史激活费单列；启用月份之前的服务费不补收。事件、系统原算与最终应收分别保留。
- 运维可修改数量、单价、最终金额及条目，金额即时汇总。修改原因只向运维显示，Portal 仅展示最终账单及对客备注。
- 已发布但未付账单仍可调整；正在付款时暂时锁定，付款完成后只读。旧版本付款确认被拒绝，要求重新核对金额。
- 支付链接默认有效 30 天，可延期；零元账单保留且不提供付款入口。

详细领域决定见 [ADR 0018](../../adr/0018-provider-quarterly-billing-from-terminal-fees.md) 和 [ADR 0019](../../adr/0019-allow-operations-to-revise-unpaid-provider-bills.md)。

## 组件选择

| 界面 | 参考模式 | 静态实现及扩展原因 |
| --- | --- | --- |
| 账单、事件与费用列表 | DataTable / Paginator / Tag | 紧凑黑色表头 34px、11px；文字状态、分页与行操作；复用项目框架和语义色 |
| 服务商、季度、事件筛选 | Select | 复用 `payment-channel-picker.js`；支持点选、输入搜索、方向键、Enter、Esc；弹窗内浮层挂载至 dialog |
| 费用与发布表单 | Dialog / InputText / InputNumber / Message | 使用原生 dialog 和项目 pc 控件；字段标签、关闭保护、错误定位与焦点回归 |
| 账单页签 | Tabs | 方向键切换、选中状态、tab / tabpanel 关联 |
| 账单审核工作区 | DataTable + 输入 + 汇总组合 | 业务需要同时显示最终金额与原算差额，标准只读表格无法完成调整；原算和事件放在独立页签 |
| 现有付款页 | 既有支付表单 | 复用卡片输入、验证及页面风格，增加服务商费用汇总、版本检查和付款状态 |

这是参考 PrimeVue v4 模式的静态实现，不宣称使用了 PrimeVue 运行时。官方 [Select v4 文档](https://v4.primevue.org/select/) 已查阅；其他既有控件沿用项目共享模式。页面返回按钮 40px，表单按钮 40px，行操作 36px；Material Symbols Rounded 图标、Poppins 字体及共享导航保持一致。

## 与既有界面的对应

六个 `52.*` 页面直接加载共享 `platform-admin-shell.css`、`payment-channel-maintain.css`、`platform-admin-shell.js` 和 `payment-channel-picker.js`，功能样式集中在 `provider-billing.css`。与既有 Maintain 截图及共享源码对照，保留白色内容面板、Poppins、深色主按钮、共享侧栏与顶栏；新增页签和右侧最终金额区仅属于本功能。既有测试卡列表截图用于核对框架，不将其不同表头密度提升为本功能规范；本功能按 [UI 规范](../ui-standard.md) 使用 34px / 11px 表头。

本次是现有界面的扩展，设计记录仅在本文件与 [功能界面说明](../../../.impeccable/surfaces/provider-billing.md) 中维护；不重新定义全局视觉体系，不生成或改写根目录 `DESIGN.md` 与 `.impeccable/design.json`，也不推断新的用户偏好。

## 演示数据

在现有角色选择入口切换角色即可：

- `WizarPOS Maintain`（`maintain`）：查看全部服务商。Civitronic 的 2026 Q3 为待审核草稿，可调整后发布。
- `Full-Service Provider`（`full-service`）：映射 Cantaloupe Inc，2026 Q3 已发布未付款，可演示查看、付款及支付后只读。
- `Attended Provider`：映射 Techsupport，展示支付链接已到期，运维可延期。
- `Unattended Provider`：映射 Systema Procesa Pago Corp，展示零元账单。
- `WizarPOS Provider`（`wizarpos`）：映射 Civitronic，展示历史已付账单，以及运维发布后出现的季度账单。

演示身份映射只服务于静态原型。数据存放于同源浏览器的 `paywizard.provider-billing.v1`；跨标签页共享，跨浏览器不共享。付款仅模拟成功状态；不连接真实支付通道，不存储完整卡号或 CVC。

## 已完成验证

- Chromium 实际页面截图：1440×1000 的运维账单列表、账单审核、事件日志、费用配置、服务商列表与详情；1280×800 的列表、校验错误、费用弹窗、搜索浮层；1280×1000 的付款页。
- 截图在 [`.impeccable/review/`](../../../.impeccable/review/)。已检查共享框架、表头尺寸、桌面溢出、按钮、浮层和错误定位；无需手机浏览器验收。
- 新增单元测试 8 项通过；新增 Playwright 场景 12 项通过，覆盖计费边界、权限展示、调整发布、未来价格、零账单、错误保留与模拟支付；其中 2 项针对独立检查发现的发布弹窗和未来启用费用编辑问题，修复后通过。
- 原有 `billing-checkout.spec.js` 7 项通过。构建通过。
- 最终针对本次功能与原有 checkout 的 Playwright 运行合计 19 项全部通过。补充截图 `publication-error-1280.png`、`future-fees-1280.png` 记录两处修复后的状态。
- 独立 finish reviewer 初查了 11 张截图及相关源码，发现“发布时无效到期日导致弹窗关闭”和“未来启用的费用再次编辑时读取未定义价格”两项问题；修复后复核对应源码与新增的 2 张截图，结论为 `ship`，范围仅限这两项修复清单，不代表对整套原型作无问题保证。
- 扩大到旧 Billing Overview、Billing Setup、Portal access 测试后，共 44 项，27 项通过、17 项失败；不能报告整个旧套件通过。抽取 4 个代表性失败，将相关页面和共享脚本替换为本次修改前的 Git HEAD 内容后仍全部复现，分别涉及旧数据数量、旧草稿流程、旧菜单矩阵、旧角色数量。这只能证明这 4 个样本在原 HEAD 上也失败，不能据此将全部 17 项归为既有问题。未扩大修改这些旧功能。
- 原 Portal 角色测试中“服务商没有 Billing 菜单”的断言已按本需求更新；该用例后续仍在旧商户直达路由断言处失败，未纳入新增流程的通过结论。

文档交接另行核对了本地链接、六页共享资源、演示角色的实际显示名称与服务商映射、13 张截图的文件及尺寸，并对照既有框架截图、账单列表和审核截图。上述测试执行结果由实现交接记录提供；文档交接未重复执行测试。

## 交付边界

原型用于产品评审和演示。服务端事件接入、历史数据导入、定时出账、真实权限校验、支付回调及跨端并发锁仍需研发实现。演示脚本中的事件与账单为固定样本；未来价格界面保留版本，但不代替后端事件计算任务。前端隐藏内部记录不构成生产环境的数据权限隔离。

页面截图和自动化验证不代替用户对最终视觉的验收；未部署、未创建 GitHub Issue、未向服务商发送账单。
