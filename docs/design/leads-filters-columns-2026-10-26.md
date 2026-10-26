# Leads 筛选与列设置

2026-10-26，通过 grill-with-docs 逐轮确认，用户在 Q6 确认完整范围并授权实现。UPT 原型已完成。

## 已确认

- 仅 UPT Leads 补齐用户提供的生产截图中的 Filter，并参考 Transactions 提供简单的列设置。PSP 不属于本次修改范围。
- 列设置只保留勾选显隐、拖拽排序、全选和恢复默认。不提供 Saved Column Views 的命名、添加或切换视图。
- 勾选和排序立即作用于列表，不增加保存步骤。
- 原型在当前浏览器记住列显隐与顺序，刷新或重新进入 Leads 后继续沿用。

### Filter

- UPT 主栏保留 Partner Name、Country Name、SN。
- Status 从主栏移入 Filter 弹层；弹层包含 Merchant Name、Name（联系人姓名）、Merchant Email、Process ID、Status，以及 Reset / Search。
- Merchant Name、Name、Merchant Email 使用包含匹配；Process ID、SN 使用精确匹配。SN 查询该 Lead 的全部 SN 项，包括尚未分配的 SN。
- 不同筛选条件之间为 AND，同时满足才返回记录。
- Search 或 Enter 执行搜索；Reset 清空 UPT 全部筛选条件并恢复列表。
- Status 保留已确认的五个新状态，空值表示全部状态。
- 保留现有编辑返回时恢复筛选上下文的行为，并覆盖本次补充的筛选条件。

### Columns

- 仅 Actions 固定在最右侧且不可隐藏，不列入可调整项。
- 其余现有业务列均可显隐和排序，至少保留一列业务列。
- Select All 显示全部业务列，保留当前顺序。
- Reset 恢复 UPT 的完整列及默认顺序，不清除筛选；完整列包含本轮新增的 Create Time。
- 默认业务列及顺序：Process ID、SP Name、Partner Name、Country Name、Merchant Name、Terminal Number、Assigned SN、Contact Name、Merchant Email、Create Time、Last Update、Past Days、Page Style、Status；最后为固定的 Actions。

## 核查依据

- 实际管理列表为 `29.INTL_PSP_merchant_lead_list.html`；`25.merchant_lead.html` 是公开 Lead 表单。
- 用户提供的生产截图中，UPT 主栏为 Partner Name、Country Name、SN；Filter 内为 Merchant Name、Name、Merchant Email、Process ID、Status，并有 Reset / Search。
- 本地真实 Portal 的 `merchantLeadsIndex.vue` 显示 UPT / PSP 共用高级筛选，PSP 主栏以 Payment Channel 代替 Country Name。Name 对应联系人姓名 `contactPersonName`，Merchant Email 对应联系人邮箱 `contactPersonEmail`。
- 本地后端 `MrtMrchtLeadInfoDao.xml` 的查询中，SN 匹配该 Lead 的 SN 项，不限于已分配终端；SN 与 Process ID 精确匹配，商户名、联系人姓名和邮箱包含匹配。这是源码核查，未验证生产运行行为。
- 原型现有五个 Lead Status 沿用 `leads-add-edit-2026-10-26.md` 的最新确认，不恢复旧状态。
- 原型现有 Export 按钮尚无导出处理；本次需求未包含实现导出，不将列设置自动扩展为导出功能。
- Transactions 的列设置嵌在 `12.transaction_list.html`，可参考交互和样式，但没有独立共享模块；其已有存储归一化会恢复默认列顺序，不可直接照搬实现排序持久化。

## 实现与组件参考

- 在既有静态 HTML/CSS/JavaScript 架构中实现。功能脚本为 `scripts/lead-list-controls.js`，局部样式为 `styles/lead-list-controls.css`，入口仍为 `29.INTL_PSP_merchant_lead_list.html` 的 UPT 页签。
- Filter 与 Columns 参考 Popover；国家和状态复用项目已有可搜索、可点选、支持键盘的 Combobox。列设置组合 Checkbox、拖动手柄与即时表格更新，参考 Transactions 的结构，不加入保存视图。增加 Alt + Arrow Up / Arrow Down 作为键盘排序方式，手柄提示和读屏说明提供操作方法。
- 浮层及嵌套选项使用浏览器顶层弹出能力，支持视口适配、独立滚动、外部点击关闭、Esc 关闭与焦点返回。状态下拉展开时，首次 Esc 只关闭选项，再按 Esc 关闭 Filter。
- UPT 本次修改的筛选输入及主操作统一为 40px；黑色表头维持 34px / 11px。PSP 的原有控件尺寸和筛选操作保留。
- 列配置采用 `paywizard-upt-lead-columns-v1` 存于当前浏览器。恢复时保留保存的顺序、排除无效或重复列并补足新增定义，保证至少显示一列；浏览器无法存储时保留当前设置，在弹层内显示、定位并聚焦错误。
- 表格单元格带有稳定字段标识；调整列之后，Lead 读取和 SN 更新仍按原业务字段识别。原有 Edit、Add SN、Assign/New Merchant、Onboard 继续使用同一 Lead。
- 本次尝试访问 PrimeVue v4 的 Popover、DataTable、Select 官方文档未成功，因此采用已有项目交互作为依据，不宣称核验了 v4 的全部行为。

## 验证

- 新增 6 项端到端验证，覆盖高级条件 AND、Process ID / SN 精确匹配、未分配 SN、国家和状态键盘搜索、Reset、编辑返回、拖动排序、刷新记忆、隐藏 Process ID 后的 SN 操作、最后一列保护、PSP 隔离及存储失败焦点。
- 与 Leads Editor、Merchant Admin 和终端能力关联回归合计 52 项通过。另有 4 项既有 Merchant List 侧栏测试仍要求 Split Rules 入口，与当前侧栏定义不一致；这些用例先在扩展回归中确认失败，最终运行只排除这 4 项，未修改其断言或共享侧栏。
- 静态构建、JavaScript 语法和差异空白检查通过。
- 在 Chrome 打开实际 UPT 列表，检查 Filter 和 Columns；另检查 1600×1000、1280×800 桌面截图中的表头、按钮、弹层、状态选项、已选标记及键盘焦点，未见裁切或页面横向溢出。截图为 `artifacts/leads-editor/filters-{width}.png`、`filter-status-{width}.png`、`columns-{width}.png`。
- 设计扫描的 frame clipping、dark glow 和 marquee 三类误报按此页面豁免并记录理由：新浮层位于浏览器顶层；dark glow 来自未在本页使用的共享 `.up-dialog` 样式；marquee 实为加载期间的共享进度条。共享边框/阴影和其他未使用样式的提示保留，不扩大本次页面修改范围。

以上均为界面行为决策，目前没有需要新增领域术语或 ADR 的事项。

## Create Time 补充（2026-10-26）

用户指出 UPT 列表缺少生产的 Create Time，明确要求新增此列。本要求补充此前“不增加字段”的范围，不恢复生产截图中的旧 Lead 状态。

已核查本地真实前端：`merchantLeadsIndex.vue` 的 `createTime` 列位于 Merchant Email 后、Last Update 前；经 `getLocal` 将接口 UTC 时间转换为浏览器本地时间，格式 `YYYY-MM-DD HH:mm:ss`，缺值显示 `-`。

补列前，原型的十条演示样本及标准新建流程均未保存独立创建时间；`lastUpdate` 和 `updatedAt` 会在后续操作中被覆盖，无法可靠恢复旧记录的真实创建时刻。

用户已确认并完成实现：

- 仅 UPT 补列；默认放在 Merchant Email 后、Last Update 前，日期与时间分两行显示到秒，维持 34px / 11px 紧凑表头。
- Create Time 加入 Columns，默认显示，支持显隐、排序和浏览器记忆。旧个人配置的顺序、显隐完整保留，新列插在其 Last Update 前；Reset 恢复包含新列的完整默认顺序。
- 新建成功时独立写入 UTC 创建时刻，后续 Edit、Add SN、Assign 保留该值；显示时转换到浏览器本地时区。编辑输入不能覆盖创建时间。
- 十条演示样本补固定的示例创建时间，这些时间不代表生产记录。浏览器既有旧记录缺少创建时间时显示 `-`，编辑也不伪造或回填创建时刻；不使用 Last Update / updatedAt 代替。
- 根 GLOSSARY 新增 Lead Creation Time，区分 Lead 首次创建、最后更新、进件开始及 Merchant / Store 创建；没有需要新增 ADR 的取舍。

本轮验证：新增 3 项端到端验证覆盖创建时间持久化与不可变、上海时区转换、旧记录缺值及编辑、旧列配置迁移、显隐/排序记忆和恢复默认；与 Leads Editor、列表控件及 Merchant Admin 关联回归共 43 项通过。沿用此前已明确的 4 项既有侧栏失败排除，不修改其断言。补充验证了横向滚动后新列不被固定 Actions 遮挡。

Chrome 实际页面核查通过，保留当前浏览器已有个人列配置；1600×1000 与 1280×800 默认列截图为 `artifacts/leads-editor/create-time-{width}.png`。静态构建、脚本语法及差异空白检查通过；设计扫描仅余既有共享样式的建议提示，本轮未新增豁免。
