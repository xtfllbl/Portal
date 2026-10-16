# Parameter Pool：本次原型接入

2026-10-16。按用户最终确认，仅实现以下四项。保持现有静态 HTML / CSS / JavaScript 原型架构。

## 2026-10-16 评审修订

本轮已按用户确认落实：

- 表头遵循 [UI 规范](ui-standard.md#项目视觉基线) 的黑色默认规则；Parameter Pool 保持 34px／11px 紧凑规格。
- 入口及页面使用 Add Parameter Set / Edit Parameter Set，名称字段与列表列名统一为 Parameter Set Name，面包屑为 Parameter Set。
- 参数页签使用黑色选中文字和下划线。名称／Payment Channel 与下方 Tabs／参数分为两张卡片，间隔 24px，共用底部 Cancel / Save。
- 参数集按 Payment Channel 区分，取消 Template Version 的选择、保存校验及使用记录展示。读取旧数据时兼容清除资源／使用记录上的旧参数版本，保留参数快照、归属、使用记录和交易；本地存储格式版本保持不变。
- Add Device 的 Payment App Version 独立保留；选择参数集不再覆盖或锁定应用版本，仍锁定参数值并支持恢复手填内容。
- 筛选区靠右，最右为黑色放大镜按钮；关键词／状态仅提交后应用，Enter 为同一搜索表单的键盘提交。跨页数据刷新继续使用已经提交的条件。

## 当前实现

### 补充评审修订

- Enable／Disable 分段开关的选中态一并改为黑色，覆盖所有参数页签。
- 两个表单区块增加明确的区块标题，说明基本信息与渠道参数的层级。标题为 Basic Information / Processor Parameters，使用二级标题，Tab 归属下方参数区。
- Usage Records 移除 All Transactions、Completed、Failed、Currencies 四张计数卡；保留归属信息、Transaction Summary 表、交易明细、导出与出账操作。
- Add Device 的 Parameter Source 与参数集选择字段采用本页既有标签、下划线输入外观和两列等宽网格；保留搜索、键盘选择、占用说明与禁选行为。参数集选择字段使用已定义的 Parameter Set 名称。

| 入口 | 文件 | 已实现 |
| --- | --- | --- |
| Maintain → Parameter Pool | `49.parameter_pool.html` | 搜索、状态筛选、资源名称／渠道／MID／TID／状态／当前商户／门店／TCI，录入、编辑和使用记录入口 |
| Add / Edit Parameter Set | `49.parameter_pool_form.html` | 参数集名称、现有 Nuvei 渠道；复用原模板全部 8 组、57 个字段，保存即录入 |
| Usage Records | `49.parameter_pool_usage.html` | 按次选择使用记录，固定归属与使用期间，完整交易汇总、列选择、分页、全量 CSV 导出和确认线下出账 |
| 商户 → 门店 → Add Device → Processor Parameters | `5.merchant_add_device_iso.html` | NUVEI UPT 增加 Parameter Source；单选一个资源；原 57 个参数只读填充；保存占用资源并建立使用记录 |

## 交互与规则

- 资源状态：Available、In Use、Awaiting Settlement。仅 Available 可编辑或分配；占用项展示商户、门店、TCI 并禁选。新增终端保存前不占用资源。
- Payment Channel 来自现有维护数据；本次只开放实际对应 NUVEI UPT 的 Nuvei 渠道（`channelType=Nuvei`，`packageName=com.smartpos.nuvei.smartpay`）。参数集没有版本号，Add Device 的 Payment App Version 属于独立的应用部署选择。
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

复用 `platform-admin-shell.js`、`payment-channel-maintain.css`、`payment-channel-picker.js`。列表采用项目规定的 34px 黑色表头、11px 表头字号、36px 行操作，表单按钮为 40px。标题返回入口沿用 `.pw-page-title-with-back`。

共享选择器增加可选的描述、搜索文本、禁选状态和固定标题；资源为单选，交易列设置使用原有多选能力。弹层使用已有 native popover，不被页面滚动容器裁切；参数分组继续采用 Tabs 模式。确认框使用原有 Dialog 样式。

## 首轮演示与边界（切换扩展前）

- 采用浏览器 `localStorage`，key 为 `paywizard.parameter-pool.v1`。首次展示 10 条合成资源：8 条可用、1 条使用中、1 条待出账，并带历史使用记录。示例 MID/TID 均带 DEMO／D 前缀；未填入实际渠道参数。
- 在 localhost 或 HTTPS 预览，可保存并跨页面查看；没有服务端或真实 Nuvei 连接。现有 Portal Access Profile 的 WizarPOS Provider 可见资源管理及终端资源选择。这是原型身份展示，不是生产权限控制。
- 本次没有接入正式参数切换、交易冻结、门店自动添加渠道、Onboarding、财务对账和真实资金操作。待出账交互通过已有演示记录评审；没有增加“结束使用”或切换按钮。
- 新增终端保留原型原有保存方式；本次持久化的是资源占用与使用记录，未新增真实设备注册／推送接口，也未重写商户设备列表的数据源。
- 第一版方案里的服务端归属校验、终端收款／异步结果上送和正式参数切换，均不属于本次四项 UI 接入的已验证能力。

## 首轮验证

执行 `node --test tests/unit/parameter-pool.test.cjs`，7 项通过；执行 `node scripts/build-static.mjs`，静态构建通过。

在桌面浏览器 1440 × 1000 逐项操作验证：资源搜索与状态筛选、空表单错误定位、新增和编辑、57 个模板字段与页签、使用记录切换、统计与分页、全量导出、历史记录不可确认、确认出账后复用、资源单选／占用项禁选、只读填充／恢复手填、原新增终端保存摘要和新使用记录。

实际下载 CSV 检查跨页 26 笔记录和固定商户归属；新一轮使用显示 0 笔，未混入旧记录。单元测试补充验证并发抢占、重复保存／确认、参数快照、跨币种统计及保存失败。生产支付和真实权限未联调。

验收截图位于 `docs/validation/parameter-pool-2026-10-16/`。验收新增资源及测试终端数据已清理，预览恢复初始 10 条演示资源。

### 本轮修订验证

- `node --test tests/unit/parameter-pool.test.cjs`：8 项通过，包括旧参数版本清理后保存及历史快照／交易保留。
- `npm run build`：静态构建通过。
- 桌面 Chrome 1710 × 896 实测：黑色表头 34px／11px，搜索／保存按钮 40px，卡片间距 24px，8 个 Tab／57 个字段保留；关键词和状态改变不即时过滤，点击放大镜后应用。状态和渠道下拉支持搜索、方向键和 Enter 选中。
- 实际完成无版本新增、编辑保存、跨 Tab 必填错误自动切回／滚动定位／聚焦／保留输入；使用记录中没有 Template Version。
- Add Device 选择参数集后，应用版本仍可选且数值保留，参数为只读；切回 Manual Entry 恢复手填参数。没有执行真实终端注册或支付部署。
- 临时预览的测试新增数据已清理，恢复 10 条初始资源。
- 本次复用项目 Payment Channel 的搜索表单、选择器及 Tabs 模式，分别对应 PrimeVue v4 InputText／Select／Button／Tabs 参考；两卡片是局部布局组合。官方 v4 页面本轮访问失败，采用项目已验证模式，未引入框架或宣称组件库实现验收。

截图：[`01-parameter-pool.png`](../validation/parameter-pool-2026-10-16-review/01-parameter-pool.png)、[`02-edit-parameter-set.png`](../validation/parameter-pool-2026-10-16-review/02-edit-parameter-set.png)、[`03-device-app-version.png`](../validation/parameter-pool-2026-10-16-review/03-device-app-version.png)。

### 补充修订验证

- 桌面 Chrome 逐个切换全部 8 个参数页签，检查 15 组 Enable／Disable 选中态均为黑底白字，实际切换 AVS Postal Code 后状态正确；57 个参数字段保留。
- 表单使用页级标题和两个带名称的 section／h2，Basic Information 在上，Processor Parameters 与其下 Tab 在下，共用原有 Cancel／Save。
- Usage Records 的四张计数卡和对应渲染／专用样式已移除；实际页面仍显示 4 行交易汇总及 26 笔交易的分页明细。
- Add Device 两个选择器复用本页 `.field` 和 `.form-grid.two`，继承标签样式；触发器保留搜索选择实现并适配本页 `.input-field` 外观。实测与原 Processor 选择器同为 39px 高、13px 字体、透明背景、单条 1px 底线、无圆角、8px 2px 10px 内边距；两列等宽、间距 18px。
- 搜索占用参数集可见商户／门店／TCI 且禁止选中；使用方向键／Enter 选择可用参数集后参数只读、应用版本仍可选；切回 Manual Entry 恢复原手填值。未保存或分配测试终端。
- `node --test tests/unit/parameter-pool.test.cjs`：8 项通过；`npm run build`：通过。本次仅调整既有分段选择、区块布局和下拉触发器外观，沿用此前确认的组件模式与交互。

补充截图位于 [`parameter-pool-2026-10-16-followup`](../validation/parameter-pool-2026-10-16-followup/)。


## 商户自有参数切换扩展（2026-10-16）

用户补充确认后，新增原 Edit Params 内的切换入口和本地状态流转；以下替代首轮“未接入正式参数切换／未回写设备列表”的原型范围描述。生产集成边界不变。

入口：Merchant → Store → Devices → Settings → Edit Params → Processor Parameters → Switch to Merchant Parameters。新表单以原 NUVEI UPT 的 57 字段默认值初始化，填写商户 MID／TID 等参数，沿用 Redeploy Parameters／Confirm & Deploy。取消编辑恢复资源只读参数，取消确认保留新输入。

使用中的资源参数保持只读；下发时必须包含 Payment Parameters，但不检测、不拦截在线／交易忙闲状态，由运维人工判断时机。等待回执期间旧使用继续有效，资源仍不可重用。生效后在同一 TCI 下显示 Merchant Parameters，旧使用记录变为 Awaiting Settlement；财务 Confirm Settlement 后资源才恢复 Available。

本次增加 terminalConfigurations 和 switchRequests 的本地演示数据，资源分配后回写商户 Devices 列表，按商户／门店／TCI 定位，切换和出账后终端仍保留。旧格式中使用中的记录可恢复为资源配置，缺失的真实硬件信息不由系统伪造。Payment App Version 仍是原有独立字段。页面不显示在线检查开关或模拟结果控制器。

组件复用原表单 InputText／Select／Tabs、原按钮和确认 Dialog；来源状态与切换按钮组成一个局部区块，按钮 40px，无新增页面或流程分支。

原型提交后以独立的 1.2 秒模拟成功回执演示完成；刷新待确认页会继续模拟回执。真正的终端生效确认、超时与失败回执接入、交易入口退款／撤销等权限禁止，需要服务端与终端研发实现。`canFollowUp` 是使用归属及冻结规则的可测试模型，未接入现有独立模拟交易页面的操作按钮。使用记录页面提供只读提示和原有统计／导出。未新增对账、手续费、付款或自动支付渠道验证。

测试及截图见 [本轮验证](../validation/parameter-switch-2026-10-16/README.md)。

### 切换前确认修订

来源行三个文本统一放大至 16px；删除其下静态说明和 View usage record 链接。点击切换先询问是否已取得正式参数，确认后才初始化默认值并开放编辑；弹窗说明新参数提交并生效后进入 Awaiting Settlement，出账后才可复用。取消和 Esc 保持原参数。沿用既定状态边界和人工判断时机，无新增在线检测。见 [本轮界面验证](../validation/parameter-switch-readiness-2026-10-16/README.md)。

### 来源标识显示修订（最新）

前一版的 16px 来源大字已由紧凑的预配置标识替代：浅灰描边横条内显示配置图标、Preconfigured Parameters 与参数集名称。进入商户参数编辑后整条隐藏，Cancel Switch 移到标题右侧；取消恢复原标识和只读参数，切换生效后也不再显示。待确认进度及字段校验错误独立保留，不随来源信息隐藏。见 [显示状态验收](../validation/parameter-source-style-2026-10-16/README.md)。
