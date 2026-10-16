# Parameter Pool：本次原型接入

2026-10-16。按用户最终确认，仅实现以下四项。保持现有静态 HTML / CSS / JavaScript 原型架构。

| 入口 | 文件 | 已实现 |
| --- | --- | --- |
| Maintain → Parameter Pool | `49.parameter_pool.html` | 搜索、状态筛选、资源名称／渠道／MID／TID／状态／当前商户／门店／TCI，录入、编辑和使用记录入口 |
| Add / Edit Parameter | `49.parameter_pool_form.html` | 资源名称、现有 Nuvei 渠道、既有 NUVEI UPT 模板版本；复用原模板全部 8 组、57 个字段，保存即录入 |
| Usage Records | `49.parameter_pool_usage.html` | 按次选择使用记录，固定归属与使用期间，完整交易汇总、列选择、分页、全量 CSV 导出和确认线下出账 |
| 商户 → 门店 → Add Device → Processor Parameters | `5.merchant_add_device_iso.html` | NUVEI UPT 增加 Parameter Source；单选一个资源；原 57 个参数只读填充；保存占用资源并建立使用记录 |

## 交互与规则

- 资源状态：Available、In Use、Awaiting Settlement。仅 Available 可编辑或分配；占用项展示商户、门店、TCI 并禁选。新增终端保存前不占用资源。
- Payment Channel 来自现有维护数据；本次只开放实际对应 NUVEI UPT 的 Nuvei 渠道（`channelType=Nuvei`，`packageName=com.smartpos.nuvei.smartpay`）。既有版本为 `1.0.41_20260622`，与 Add Device 中的 NUVEI UPT 配置一致。
- 字段定义直接读取 `processor-parameter-data.js` 的 `PROCESSOR_PARAMETER_SCHEMA['NUVEI UPT']`：标签、默认值、必填性、长度、数字约束和选项均沿用。没有渠道参数验证、连通性检测或审批步骤。
- 原新增终端的设备信息、部署选项、参数页签及保存确认继续沿用。选择资源后禁用参数编辑、复制配置及保存参数模板；返回手填会恢复本页之前的手填值。资源保存时再次检查是否被占用或编辑。
- 从两种现有 Merchant Detail 页进入 Add Device 时，继续携带门店，并补带商户 ID／名称，使用记录由此确定归属。
- 每次分配生成新的 usage ID；使用记录保存 merchant ID、store ID、TCI 和参数快照。历史查询不以资源当前商户或 MID/TID 反推归属。
- 使用记录的交易、统计和导出均同时匹配 usage ID、merchant ID、store ID、TCI。同一资源下一次分配的新记录初始为 0 笔；历史记录和原参数快照保留。
- 统计按币种、交易类型、Completed／Failed 分组。包含全部记录，不把消费、预授权、完成、退款、撤销等直接加成“应付款”。无手续费、分润和系统对账界面。
- 明细沿用现有交易字段命名，提供 28 个可选列；导出始终包括全部列、全部页、成功和失败记录，以及使用记录、归属、期间、生成时间和统计。CSV 使用 UTF-8 BOM、引号转义和公式前缀保护。
- Confirm Settlement 仅出现在当前待出账记录上。确认代表人工已在线下出账，记录确认人／时间并将资源恢复 Available。没有付款接口。若确认期间记录变化，要求刷新查看后再确认。
- 浏览器内的资源保存通过 Web Locks 串行处理，再读取最新状态；重复保存同一 TCI 不新增使用记录，历史确认不能释放下一次已经占用的资源。

## 组件来源

复用 `platform-admin-shell.js`、`payment-channel-maintain.css`、`payment-channel-picker.js`。列表采用项目规定的 34px 浅灰表头、11px 表头字号、36px 行操作，表单按钮为 40px。标题返回入口沿用 `.pw-page-title-with-back`。

共享选择器增加可选的描述、搜索文本、禁选状态和固定标题；资源为单选，交易列设置使用原有多选能力。弹层使用已有 native popover，不被页面滚动容器裁切；参数分组继续采用 Tabs 模式。确认框使用原有 Dialog 样式。

## 演示与边界

- 采用浏览器 `localStorage`，key 为 `paywizard.parameter-pool.v1`。首次展示 10 条合成资源：8 条可用、1 条使用中、1 条待出账，并带历史使用记录。示例 MID/TID 均带 DEMO／D 前缀；未填入实际渠道参数。
- 在 localhost 或 HTTPS 预览，可保存并跨页面查看；没有服务端或真实 Nuvei 连接。现有 Portal Access Profile 的 WizarPOS Provider 可见资源管理及终端资源选择。这是原型身份展示，不是生产权限控制。
- 本次没有接入正式参数切换、交易冻结、门店自动添加渠道、Onboarding、财务对账和真实资金操作。待出账交互通过已有演示记录评审；没有增加“结束使用”或切换按钮。
- 新增终端保留原型原有保存方式；本次持久化的是资源占用与使用记录，未新增真实设备注册／推送接口，也未重写商户设备列表的数据源。
- 第一版方案里的服务端归属校验、终端收款／异步结果上送和正式参数切换，均不属于本次四项 UI 接入的已验证能力。

## 验证

执行 `node --test tests/unit/parameter-pool.test.cjs`，7 项通过；执行 `node scripts/build-static.mjs`，静态构建通过。

在桌面浏览器 1440 × 1000 逐项操作验证：资源搜索与状态筛选、空表单错误定位、新增和编辑、57 个模板字段与页签、使用记录切换、统计与分页、全量导出、历史记录不可确认、确认出账后复用、资源单选／占用项禁选、只读填充／恢复手填、原新增终端保存摘要和新使用记录。

实际下载 CSV 检查跨页 26 笔记录和固定商户归属；新一轮使用显示 0 笔，未混入旧记录。单元测试补充验证并发抢占、重复保存／确认、参数快照、跨币种统计及保存失败。生产支付和真实权限未联调。

验收截图位于 `docs/validation/parameter-pool-2026-10-16/`。验收新增资源及测试终端数据已清理，预览恢复初始 10 条演示资源。
