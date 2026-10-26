# Leads 新增与编辑原型

2026-10-26，用户确认参照 Portal 的 UPT 完整表单实现 Add 与行内 Edit，采用独立页面，浏览器本地保存，保留 PSP 现状及既有 SN 分配、Onboard 流程。

## 入口与范围

- 列表：`29.INTL_PSP_merchant_lead_list.html`。
- 新增：`29.UPT_merchant_lead_edit.html`；PSP 页签点击 Add 同样创建 UPT，与现有 Portal 一致。
- 编辑：相同页面携带 `leadProcessId`；UPT 可编辑记录提供入口。已发起 Onboard、存在 applyStatus、fastFlag=1 或 status=6 的记录禁止编辑；保存再次核查状态。PSP 仍只提供详情。
- 详情：`28.UPT_merchant_lead_detail.html`，与列表、编辑共用同一 Lead 数据。

## 表单规则

| 区域 | 内容与规则 |
| --- | --- |
| Lead Information | Page Style 固定 UPT；Lead Owner；Status；Lead Resource；Lead Source (Partner)。编辑时 Partner 只读。 |
| Merchant Lead Information | 国家/地区、商户名称、联系人、邮箱必填；邮箱检查格式。省州随国家联动。其余包括行业、值守类型、电话、发货及到货时间、机器类型、Other Service Type、跟进联系方式。 |
| SN List | 新增选择 Partner 后可搜索、勾选、集中查看和逐项移除；更换 Partner 清空原选择。提前显示占用 Lead 与商户名称，占用项禁选，保存再次检查。允许零个 SN。编辑时仅查看。 |
| Decision Maker | 两位决策人的姓名、邮箱、电话；Same as merchant 和 Same as first primary 随来源字段更新。取消勾选后可以继续编辑复制的内容。 |
| Notes | 最长 150 字。 |
| Attachments | 最多 5 个；可选择和移除，仅保存名称、类型和大小，不上传、不存储文件内容，不提供虚假的下载。没有额外类型或大小限制。 |
| Merchant Processing Info | 平均/最低/最高价格、月销售额、附加信息；沿用文本输入，不引入新的数值范围规则。 |

页面沿用 Portal 字段长度。旧演示数据中的 `Mixed`、`Pending`、自由描述机器类型、带货币符号的金额，以及超过当前输入上限的既有姓名，均无损回填；单纯修改其他字段不会清空或截断这些值。

保存先校验，再进行一次提交确认；成功返回列表并反馈，新增放到列表首行。取消或返回时有修改则确认放弃，取消确认保留输入。保存失败保留所有输入，滚动到实际表单容器内的错误并聚焦。列表筛选上下文在编辑返回或取消时恢复；新建成功显示 UPT 新记录。

## 原型数据边界

- 继续使用 `paywizard-upt-lead-overrides-v1`，兼容既有种子数据、SN 增补和分配记录；新增记录也能继续 Add SN、Assign/New Merchant、Onboard。
- 不调用生产接口、不发邮件、不创建真实商户或终端配置。数据仅属于同一浏览器和来源地址。
- Partner 候选沿用当前 Leads；国家复用 `payment-channel-data.js`；机器类型复用现有公开 Lead 表单。省州是本地演示候选，覆盖现有 Lead 地区及常用示例，并非完整全球行政区数据。
- 每个 Partner 提供 5 个独立的演示可用 S/N，同时列出已有 Lead 中的占用 S/N。其可用性仅是原型数据，不代表真实库存。
- Terminal Assignment、终端能力、附件元数据等在编辑时保留。Lead Resource 是获客渠道，Lead Source 是关联 Partner，已写入根 GLOSSARY；本次无难以逆转的架构决策，不新增 ADR。

## 设计映射与源码依据

静态 HTML/CSS/JavaScript，未安装 UI 框架。文本字段参考 InputText / Textarea、选择参考 Select、勾选参考 Checkbox、确认参考 ConfirmDialog；复用 `merchant-creation-selects.js` 和 `uptime-combobox.js` 的搜索、点选、键盘及顶层弹出交互。SN 区域是搜索输入、占用状态、复选列表和可移除标签的组合，因为标准单选不能表达多 SN 和业务占用保护。

官方 v4 域名本次多次访问失败；[InputText](https://primevue.org/inputtext/) 和 [ConfirmDialog](https://primevue.org/confirmdialog/) 官方入口跳转到当前文档可读取，但不能据此宣称核验了 v4 小版本。选择器沿用已验证的项目实现并做实际键盘与视口检查。修正共享选择器在下方空间不足 240px 时仍取另一方向高度的问题，确保下拉不越过视口。

业务依据：`/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/views/merchantAccount/merchantLead/` 下 `merchantLeadsIndex.vue`、`leadDetailV2.vue`、`uptLandingDetail.vue`。本次只读参考真实前端，未修改真实 Portal 仓库。

## 验证

- `tests/leads-editor.spec.js` 覆盖新增、编辑、刷新持久化、列表/详情同步、校验焦点、键盘选择、旧值与终端分配保留、取消保护、筛选恢复、PSP 边界、附件上限、存储失败、SN 并发占用复查、非法/不可编辑记录和桌面布局。
- 与既有 Merchant Admin Leads 回归合计 23 项通过；另有 2 项 Leads 场景/能力专项通过，涵盖 Add SN、分批分配、Onboard 和详情。
- 1600×1000、1280×800 的实际 Chromium 页面截图在 `artifacts/leads-editor/`。检查固定操作栏、40px 按钮、表单滚动、下拉边界；无横向溢出。验收范围仅桌面浏览器。
