# 创建商户：Business Model 与表单布局

2026-09-15 用户确认，适用页面：`5.merchant_add_merchant_only_iso.html`（直接创建及 Onboarding 预填入口）与 `5.merchant_add_iso.html`（一条龙 Merchant 第一步）。

## 已确认规则

- Owner Business Model 为 Full-Service、Attended-Service、Unattended-Service 三类。
- 商户 Business Model 仅为 Attended-Service 或 Unattended-Service。
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

用户授权按三分之一原则补齐示例模式。现有三个 Owner 依次为 Payyou → Full-Service、Valor Training ISO → Attended-Service、Nexus Partners → Unattended-Service。Onboarding 中额外的唯一 Owner 名称按排序继续循环分配，整个样例集合三种模式数量之差不超过一；仅将当前预填 Owner 补入表单选项。

这些是前端演示分配，不声明真实客户的模式。生产环境应由所选 Owner 的权威账户资料提供模式并在服务端校验，不从当前操作者的 Portal Access Profile 推导。业务模式未知时不允许提交不兼容或空模式。
