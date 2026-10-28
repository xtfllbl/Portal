# 服务商季度账单：界面设计与验收

2026-10-28。静态 HTML/CSS/JavaScript 可交互原型，沿用现有 Maintain / Portal 框架；不安装组件框架。

## 页面与入口

| 使用方 | 页面 | 入口及用途 |
| --- | --- | --- |
| 运维 | `52.service_provider_billing.html` | Maintain → Billing → Service Provider Billing；按服务商、季度、状态查询，生成季度草稿 |
| 运维 | `52.service_provider_bill.html?id=PB-2026Q3-1050` | 核对、调整和发布；Charges / System calculation / Source events / Activity |
| 运维 | `52.service_fee_log.html` | 已废弃，旧地址转向服务商账单列表；核对依据保留在账单 Source events |
| 运维 | `52.service_fee_settings.html` | 为服务商配置计费启用月份、币种与费用，维护未来生效的价格 |
| 服务商 | `52.provider_billing.html` | Portal → Billing & Payments；仅当前服务商已发布的账单 |
| 服务商 | `52.provider_bill.html?id=PB-2026Q3-1047` | 最终收费明细、备注、支付入口与支付记录 |
| 付款人 | `43.billing_payment_link.html#provider.2026-Q3.1047.review` | 复用已有支付页面，展示当前账单版本并模拟付款 |

已有商户收款入口继续使用原页面。Maintain 的 Billing Overview 增加服务商账单入口。服务商账单不向商户和门店角色开放。Portal 的季度筛选仅列出当前服务商已发布账单的季度，不显示其他服务商或未发布草稿独有的季度；Maintain 保留全部账单的季度选项。

2026-10-28 后续确认：Maintain 新增独立 **Billing** 菜单，按 Billing Overview、Service Provider Billing、Billing Setup 排列；原 Payment / System 中对应入口移入该分组，面包屑和展开状态同步。用户随后明确废弃 Service Fee Log 页面，菜单与账单顶部入口均移除；费用设置仍从服务商账单进入。服务商维度的新布局正在比较，见 [三版方案](provider-layout-options.md)，尚未替换正式列表。

默认激活费 **2.00 / 台 / 次符合条件的启用**，月服务费 **7.99 / 台 / 月**，仍保留各服务商的币种。当前演示费率、收费事件、原始试算和最终账单统一重建为该标准；正常业务中的未来调价与已付锁定规则不变。

服务商 Billing & Payments 旁的数字为当前服务商已发布、金额大于零、尚未支付的账单张数，包含链接过期及支付结果未明的账单；不含草稿、已付或零元无需支付账单。付款成功后递减，归零隐藏。在其他 Portal 页面也显示，跨标签页同步；复用共享菜单数字标签，不改变旧商户 Billing Overview 的关注数量口径。

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

- `WizarPOS Maintain`（`maintain`）：查看全部服务商。Civitronic 的 2026 Q3 为已发布未付账单，可演示调整后保存。
- `Full-Service Provider`（`full-service`）：映射 Cantaloupe Inc，2026 Q3 已发布未付款，可演示查看、付款及支付后只读。
- `Attended Provider`：映射 Techsupport，展示支付链接已到期，运维可延期。
- `Unattended Provider`：映射 Systema Procesa Pago Corp，Q1 为零元账单，另有已付及未付季度账单。
- `WizarPOS Provider`（`wizarpos`）：自有服务商不显示 Billing & Payments，直达列表和详情返回 Transactions；代入 `sp-wizardpos` 实体也适用。Civitronic 是独立第三方，不再作为 WizarPOS 的账单身份。

按用户明确选择，每个示例服务商提供 **2026 Q1–Q4** 四个季度，Q1/Q2 展示已付（Systema Q1 无需支付），Q3/Q4 展示未付。Q4 是预先构造的季度结束演示样本，发布时间为 2027 年 1 月，不表示当前季度可提前正式出账；正常 Generate Bill 仍拒绝未结束季度。演示服务与计费启用月份同步调整，以保持台数、月费和历史激活费可追溯。

演示身份映射只服务于静态原型。数据存放于同源浏览器的 `paywizard.provider-billing.v1`；跨标签页共享，跨浏览器不共享。付款仅模拟成功状态；不连接真实支付通道，不存储完整卡号或 CVC。

用户已同意备份后重建旧演示数据。首次读取 schema 1 时，将原始完整数据保存到 `paywizard.provider-billing.v1.backup-before-2026-four-quarters`，然后写入 schema 2 的四季度样本；已有备份不覆盖，新版本下的后续调整和付款不会在刷新时再次重置。备份写入失败则不替换原数据。本次重建仅涉及服务商演示存储，不修改原商户账单存储。

## 本次调整验证

- `node --test tests/unit/provider-billing.test.cjs`：11 项通过，包含完整四季度的费用一致性、旧数据备份及只迁移一次、未付数量的状态口径。
- 首轮 `npx playwright test tests/provider-billing.spec.js tests/provider-billing-navigation.spec.js tests/billing-checkout.spec.js --workers=2`：24 项通过，其中服务商账单 17 项、原有付款 7 项。覆盖三个 Billing 入口和面包屑、三种普通服务商四季度数据、WizarPOS profile 和代入实体的直达限制、非账单页面及跨标签页提醒、旧数据迁移和表单默认值。
- 修复季度选项范围并新增回归后，重跑 `tests/provider-billing.spec.js` 与 `tests/provider-billing-navigation.spec.js`：18 项全部通过；新增用例验证 Portal 排除其他服务商及未发布账单独有的季度，同时保留 Maintain 的完整季度范围。本轮未再次运行原有 checkout 7 项。按不重复用例计，本次相关通过记录合计 **36 项**（11 项单元、18 项服务商 E2E、首轮 7 项原有 checkout），并非一次运行 36 项。
- `npm run build`、脚本语法及 `git diff --check` 通过。本轮未重新执行全部仓库测试，不能扩大为全仓库无回归结论。
- 本次 **10 张**真实 Chromium 页面截图位于 [provider-billing-update](../../../.impeccable/review/provider-billing-update/)：1440×1000 共 6 张、1280×800 共 2 张，以及与用户截图原始尺寸一致的 3840×1708 / 3840×1706 各 1 张。覆盖 Billing 菜单、2.00 / 7.99 费用、四季度列表、WizarPOS 无入口、付款后数字归零及季度选项范围。未见脚本错误或页面级横向溢出；账单表头实测仍为 34px / 11px。
- 独立 reviewer 初查 9 张截图及源码，未发现实质视觉问题，发现 1 项季度选项范围问题。修复后补充 [provider-quarter-scope-1440.png](../../../.impeccable/review/provider-billing-update/provider-quarter-scope-1440.png) 与回归用例；reviewer 复核该修复的源码、用例及截图，确认已解决，结论为 `ship`。最终复核仅限季度选择器这一项，未重新执行测试，不代表对整个原型作无问题保证。

本次文档交接核对了本地链接、10 张截图文件及尺寸，并对照共享菜单、演示数据迁移、默认费用、未付数量与季度选项的当前源码。上述测试运行和浏览器检查结果来自实现及 review 交接记录；文档交接未重复执行测试或页面验收。

## 首次实现验证记录

以下为首次实现时的历史证据，测试和截图数量不计入上方本次调整记录；其中旧演示数据和旧菜单预期以本次确认及实现为准。

- Chromium 实际页面截图：1440×1000 的运维账单列表、账单审核、事件日志、费用配置、服务商列表与详情；1280×800 的列表、校验错误、费用弹窗、搜索浮层；1280×1000 的付款页。
- 截图在 [`.impeccable/review/`](../../../.impeccable/review/)。已检查共享框架、表头尺寸、桌面溢出、按钮、浮层和错误定位；无需手机浏览器验收。
- 新增单元测试 8 项通过；新增 Playwright 场景 12 项通过，覆盖计费边界、权限展示、调整发布、未来价格、零账单、错误保留与模拟支付；其中 2 项针对独立检查发现的发布弹窗和未来启用费用编辑问题，修复后通过。
- 原有 `billing-checkout.spec.js` 7 项通过。构建通过。
- 最终针对本次功能与原有 checkout 的 Playwright 运行合计 19 项全部通过。补充截图 `publication-error-1280.png`、`future-fees-1280.png` 记录两处修复后的状态。
- 独立 finish reviewer 初查了 11 张截图及相关源码，发现“发布时无效到期日导致弹窗关闭”和“未来启用的费用再次编辑时读取未定义价格”两项问题；修复后复核对应源码与新增的 2 张截图，结论为 `ship`，范围仅限这两项修复清单，不代表对整套原型作无问题保证。
- 扩大到旧 Billing Overview、Billing Setup、Portal access 测试后，共 44 项，27 项通过、17 项失败；不能报告整个旧套件通过。抽取 4 个代表性失败，将相关页面和共享脚本替换为本次修改前的 Git HEAD 内容后仍全部复现，分别涉及旧数据数量、旧草稿流程、旧菜单矩阵、旧角色数量。这只能证明这 4 个样本在原 HEAD 上也失败，不能据此将全部 17 项归为既有问题。未扩大修改这些旧功能。
- 原 Portal 角色测试中“服务商没有 Billing 菜单”的断言已按本需求更新；该用例后续仍在旧商户直达路由断言处失败，未纳入新增流程的通过结论。

首次实现的文档交接另行核对了本地链接、六页共享资源、演示角色的实际显示名称与服务商映射、13 张截图的文件及尺寸，并对照既有框架截图、账单列表和审核截图。上述测试执行结果由实现交接记录提供；文档交接未重复执行测试。

## 交付边界

原型用于产品评审和演示。服务端事件接入、历史数据导入、定时出账、真实权限校验、支付回调及跨端并发锁仍需研发实现。演示脚本中的事件与账单为固定样本；未来价格界面保留版本，但不代替后端事件计算任务。前端隐藏内部记录不构成生产环境的数据权限隔离。

页面截图和自动化验证不代替用户对最终视觉的验收；未部署、未创建 GitHub Issue、未向服务商发送账单。
