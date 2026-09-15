# 创建商户：Business Model 与表单布局

2026-09-15 用户确认，适用页面：`5.merchant_add_merchant_only_iso.html`（直接创建及 Onboarding 预填入口）与 `5.merchant_add_iso.html`（一条龙 Merchant 第一步）。

## 已确认规则

- Owner Business Model 为 Full-Service、Attended-Service、Unattended-Service 三类。
- 商户 Business Model 为 Full-Service、Attended-Service 或 Unattended-Service。Full-Service Owner 下可选择这三类；Full-Service 商户可同时拥有 Attended 与 Unattended 终端，同一家门店也允许混用。（2026-09-15 用户修正，替代原先商户仅能二选一的规则。）
- 未选择 Owner 时，Business Model 留空且不可操作。
- Full-Service Owner 下初始留空，用户必须选择商户模式；单一模式 Owner 自动带出对应值并锁定。
- 更换 Owner 时保留兼容的已选模式；不兼容时切换至新 Owner 支持的模式，并在字段旁提示变化。清除 Owner 同时清除商户模式。
- Merchant Permissions 保留 Merchant Admin、Merchant Operator、Merchant Viewer，默认 Merchant Admin；本次未引入与业务模式的联动。
- 独立创建提交时校验 Owner 与商户模式的兼容关系，保存 `ownerBusinessModel` 和 `businessModel`，继续现有创建成功后的建店流程。

## 排版

| 行 | 字段 |
| --- | --- |
| 1 | DBA / Contact Name |
| 2 | Email / Phone Number |
| 3 | Country or Region / Currency |
| 4 | Address Line 1 / Address Line 2 |
| 5 | Zip Code / City / State |
| 6 | Owner / Business Model / Merchant Permissions |
| 操作 | 独立创建：Back / Submit；一条龙：Fill Mock Data / Next |

沿用 Portal 字体、配色、侧栏与顶栏，删除商户信息副标题。Owner 行没有分割线或额外顶部留白；两页主操作按钮为黑底白字，表单操作按钮高 40px。填写项使用 1px 浅灰下划线（#d9dde3），聚焦时仅加深为中灰色（#8c939e），保持 1px 且不添加加粗阴影；禁用态使用更浅灰色（#e4e7eb），错误态使用红色细线。表单输入内容、占位文字和下拉选项统一使用 Poppins 13px / 20px、字重 400，商户字段标签统一使用 12px / 18px、字重 600。样式仅作用于这两个创建页面。

下拉支持点选、输入搜索、键盘操作与视口内独立滚动；页面滚动时弹层跟随字段定位，保持输入与选项状态。保存失败时定位并聚焦可见错误，保留输入。按宽桌面及 1280px 桌面页面验收。

## 一条龙流程接入

- 两页通过共享商户表单控制器使用相同的模式联动、搜索下拉与字段校验。
- 进入 Store、Device、Review 前统一校验商户必填项和模式兼容性，Next、鼠标及键盘步骤导航均不可绕过。最终 Onboard Merchant 再次校验，失败时返回 Merchant 并定位错误。
- 返回 Merchant 保留已填写内容；Review 展示 Business Model 和 Merchant Permissions。
- Fill Mock Data 先填 Owner，再填兼容商户模式及权限，示例为 Payyou / Unattended-Service / Merchant Admin；原生字段赋值同步到可搜索下拉的显示值。
- 保留一条龙原有单框电话号码、Country 带出 Currency、Same as Merchant Info、五步导航及设备配置行为。不新增 Business Model 到终端类型的筛选联动。
- 一条龙继续使用原有演示完成机制，不新增商户后端或本地持久化流程。

## 原型数据边界

### 已有商户与商户门户（2026-09-15 确认）

- 有门店、无门店两种商户详情的 Edit Profile 均提供 Business Model，并支持在 Full-Service Owner 下升级为 Full-Service。Owner 与 Business Model 支持点选、搜索和键盘操作。
- 编辑沿用创建规则的兼容选择保留与单一模式锁定。更改模式或 Owner 导致现有终端不兼容时，提示原因并阻止保存；不自动改动终端类型。保存失败时定位并聚焦弹窗内错误，保留输入。
- 业务模式与 Owner 保存到当前浏览器：已创建商户更新原有商户记录；静态样例仅保存按 Merchant ID 隔离的业务模式覆盖，不把样例伪造成新创建商户。
- Full-Service Merchant 门户同时展示 Attended Terminals、Unattended Terminals 和 Uptime Matrix，并沿用两种商户门户的对应功能与权限边界。交易和终端总览识别这一模式。
- 门店设备配置继续支持两类场景，不把 Full-Service 作为第三种终端类型。
- 门户身份沿用原型已有的切换入口。业务模式不代表真实登录鉴权；生产账户解析与服务端访问控制仍需后端实现。

### 示例 Owner 数据

用户授权按三分之一原则补齐示例模式。现有三个 Owner 依次为 Payyou → Full-Service、Valor Training ISO → Attended-Service、Nexus Partners → Unattended-Service。Onboarding 中额外的唯一 Owner 名称按排序继续循环分配，整个样例集合三种模式数量之差不超过一；仅将当前预填 Owner 补入表单选项。

这些是前端演示分配，不声明真实客户的模式。生产环境应由所选 Owner 的权威账户资料提供模式并在服务端校验，不从当前操作者的 Portal Access Profile 推导。业务模式未知时不允许提交不兼容或空模式。

## 2026-09-15 本轮验收

- 独立创建：1280px 桌面确认 Full-Service 三选项弹层完整显示；搜索和 Enter 选择成功；补齐必填项后创建成功，详情回填 Full-Service。
- 一条龙：Fill Mock Data 后改为 Full-Service，可进入 Store 并返回 Merchant，模式选择保留。
- 两种详情：模式回填、Owner 搜索、单一模式锁定和保存通过；静态商户升级后刷新保留 Full-Service；含混合终端的商户改成单一模式被阻止，错误在实际滚动容器内可见并获得焦点。
- Full-Service Merchant：Attended、Unattended、Uptime Matrix 均可进入；同一 Downtown Location 的 Add Device 保持两类终端场景可选。
- `node --test tests/unit/merchant-business-model.test.cjs tests/unit/terminal-uptime.test.cjs`：51 通过；包括 Full-Service 商户不能通过 URL 扩大历史数据范围的检查。
- 修改脚本语法检查、`npm run build`、`git diff --check` 通过。本轮为本地原型修改，未部署。
