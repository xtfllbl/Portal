# 终端交易能力开关

日期：2026-10-10。状态：规则已由用户确认，已实施。

## 术语与范围

- 两项终端能力分别为无卡交易、交易路由。用户确认交易路由就是截图中的“A 借 B 还”，指跨终端处理原交易的后续操作，不指按规则选择支付通道。
- 英文界面标签为 `SUPPORT CARDLESS TRANSACTIONS`、`SUPPORT TRANSACTION ROUTING`；开关的无障碍名称保留 `Supports Cardless Transactions`、`Supports Transaction Routing`。术语记录于根 `GLOSSARY.md`。
- 覆盖独立新增／绑定配置页 `5.merchant_add_device_iso.html`、编辑页 `5.merchant_device_settings_iso.html`、Add Merchant 内的终端配置步骤 `5.merchant_add_iso.html`、Leads `29.INTL_PSP_merchant_lead_list.html` 的 Assign/New Merchant 弹窗，以及 `1.terminalmanage.html` / `1.terminalmanage_nayax.html` 的 Terminal Type 编辑弹窗。
- 终端列表的 Bind to Store 会进入上述独立配置页，复用相同规则。只录硬件且无场景的 Create Terminal 弹窗保持现状。
- Card Reader 在现有词汇表中独立于 Attended / Unattended Terminal；Q3MINI-R 模式不显示或保存这两项终端能力，不为其推定场景默认值。

## 已确认的交互

| 场景分类 | 现有场景 | 无卡交易默认值 | 交易路由默认值 |
| --- | --- | --- | --- |
| 无人值守 | Vending Machine、EV Charging、Arcade Machine、Coffee Machine | 开 | 开 |
| 有人值守 | Standalone Terminal、Terminal + ECR | 关 | 关 |

分类与现有 `scripts/terminal-type.js` 的 attendance 字典一致。

1. 初次配置或缺失能力值时按场景填入默认值；绑定／编辑已有配置优先回填保存值，打开页面不会覆盖手动选择。
2. 用户明确修订了最初建议：打开无卡交易时同时打开交易路由；关闭无卡交易时同时关闭并禁用路由。
3. 无卡交易保持开启时，允许用户单独关闭或重新开启交易路由。路由关闭不关闭无卡交易。
4. 跨有人／无人分类切换时重置两项默认值；同一分类内切换场景时保留手动选择。
5. 保存后生效。未保存、返回或关闭表单不写入能力值；再次打开时回填原值。
6. 商户详情 Assign Terminal 只把已有 TCI 配置绑定到 S/N，不提供场景和能力快捷编辑；能力在配置页设置，绑定操作不改写能力值。Leads Assign/New Merchant 是物理 S/N 分配到商户／门店，需明确选择场景；同批选中 S/N 使用一组设置，已有分配保持不变。
7. 复制已有 TCI 配置时继承该配置已保存的能力；复制后仍由目标 TCI 独立保存。
8. 保存失败保留选择，关闭保存确认遮罩后，在实际表单内滚动并聚焦可见错误。Add Merchant 失败时返回终端步骤，阻止完成状态和成功提示。

## 实现与保存边界

- 共用 `scripts/terminal-transaction-capabilities.js` 和 `styles/terminal-transaction-capabilities.css`，避免各入口分别维护联动。
- 用户反馈原先两项开关挤在左侧、粗体标签与表单未对齐。本次改为场景／型号行下方的两列设置行，沿用表单 18px 列间距、12px 大写灰色标签与下划线；每列标签在左、开关在右，分别对齐 Terminal Scenario / Device Model。Assign Terminal 在配置摘要下方复用两列设置行，Add Merchant 沿用原容器间距。该次 Assign Terminal 调整已被下文最新范围修订撤销。
- 本轮只调整标签、布局和样式；默认值、依赖联动及保存回填保持不变。仍采用已有 ToggleSwitch 模式，不增加分组标题、说明或新操作。
- 控件参考 [PrimeVue v4 ToggleSwitch](https://v4.primevue.org/toggleswitch/)，采用关联 label、原生 checkbox 与 `role="switch"`；Tab 聚焦、Space 切换，禁用路由不可操作。官方 v4 文档已通过 HTTP 读取核对。尺寸与黑色选中外观复用项目已有部署开关规格（38 × 22px），不安装 UI 框架。
- 当前终端配置保存主要是演示流程。本次仅新增能力的浏览器本地持久化：`pw_terminal_transaction_capabilities` 以 TCI 为主键保存场景、S/N 关联及两个布尔值；绑定已知物理终端时可按 S/N 查找已有能力值，优先匹配 TCI。
- 同时保存场景用于缺失 URL 场景的编辑入口正确回填。TCI 配置优先，保留终端替换／解绑后的配置能力。
- 不改变处理器参数模板、部署、注钥及已有绑定历史规则；未接入真实后台字段或终端下发接口。能力启用不表示任意处理器都支持所有后续交易。
- 开关不等同于 Payment Channel 的 Processor Capabilities 或 Send Payload Data。原交易 Payload Data 传输仍是独立配置。
- 本次可逆的表单扩展未产生需要 ADR 的架构取舍，不新增 ADR。

## 验收

- `npx playwright test tests/terminal-transaction-capabilities.spec.js tests/merchant-terminal-binding.spec.js tests/merchant-onboarding-device.spec.js --workers=2 --reporter=line`：21 项通过。
- 覆盖三套场景表单的默认值、同类保留／跨类重置、键盘联动、路由单独关闭、Card Reader 模式隐藏、保存回填、未保存恢复、Assign Terminal 继承与取消、绑定后进入编辑回填、Add Merchant 完成保存、存储失败后的可见错误与重试。
- 原 Add Merchant 设备专项测试遗漏商户必填数据，修改前 HEAD 同样无法进入 Device 步骤。仅补充测试初始化的 Merchant Fill Mock Data，业务页面校验保持不变。
- Chrome 实际打开新增／绑定页、编辑页、Add Merchant 的 Device 步骤和 Assign Terminal 弹窗，核对两项开关的选中／禁用外观、行内对齐、操作栏完整性及开启无卡交易时路由同步开启；桌面 1710px 下无裁切。
- 桌面 1710 × 950 的专项 7 项再次通过并生成截图：`artifacts/terminal-transaction-capabilities.png`、`artifacts/terminal-transaction-capabilities-error.png`；错误提示完整可见、保留选择。
- 共享脚本及四页内联脚本语法、`npm run build`、构建内资源一致性、`git diff --check` 均通过。仅本地原型改动，未部署。

### 2026-10-10 开关布局修订验收

- 改为与表单同宽的两列设置行，简化可见标签，保留关联标签及原无障碍名称。未改变联动和保存规则。
- 本轮专项 7 项通过；共享脚本语法、构建和 diff 检查通过。
- Chrome 实际核对与用户截图相同的 `TC36000934 / Front Counter` 编辑页、新增页、Add Merchant 的 Device 步骤、Assign Terminal 弹窗。标签、开关和下划线沿两列表单对齐，弹窗无裁切。
- 编辑页 1710px 下两项设置左右边缘与上方字段偏差均为 0px、两项顶部偏差为 0px；1280px 下标签无横向溢出。效果截图：`artifacts/terminal-transaction-capabilities-aligned.png`。

### 2026-10-10 分配入口范围修订

- 用户撤回商户详情 Assign Terminal 弹窗的两个快捷开关：此操作绑定已有配置，能力属于配置，不重复设置。共享模块不再挂载此弹窗，提交也不再写入能力记录；已保存配置保持原值。
- 用户确认 Leads → UPT → Assign/New Merchant 新增 Terminal Scenario（初始为空、必选）和两项 SUPPORT 开关。复用六种场景及依赖规则；选择场景前两个开关禁用。不同场景的终端分批分配；已分配 S/N 禁选且不改动原设置。
- 不增加新步骤；在 Select SN 区域下方增加场景与能力。场景选择复用现有可搜索、可键盘操作的弹层选择器，参考 [PrimeVue v4 Select](https://v4.primevue.org/select/)。开关复用现有 ToggleSwitch 模式，保留静态架构。
- 原型按每个 S/N 将 `scenario`、`cardless`、`routing` 与商户／门店分配记录一次性保存到原有 Leads 本地记录。后续带该 S/N 进入完整配置页时可补回这些设置，已有 TCI 配置优先。Leads 分配仍不创建真实后台商户、门店或 TCI。
- 缺场景、能力依赖不合法或存储失败均阻止保存，保留所有选择，在弹窗滚动容器内定位并聚焦错误。
- 其他入口的审查和待用户决定事项记录在 [终端分配入口审查](terminal-assignment-entry-audit.md)。此前四入口验收包含已撤回弹窗，仅代表历史版本。

### 终端详情统一

- 用户确认两种终端详情的 Terminal Type 编辑新增两项 SUPPORT 开关，并从点场景立即保存改为编辑草稿，Save 一起保存、Cancel／Esc／遮罩关闭放弃修改。场景选项仍用现有六项菜单；460px 弹窗内两项能力使用纵向设置行，标签和开关各自对齐。
- 用户随后修订分隔线：仅在场景选项与能力组之间保留顶部细线，两个能力行之间不放分隔线；能力行底部线移除，底部操作区沿用原有分隔。
- 复用共享控件、默认值与依赖规则。打开时已保存能力记录的场景优先于旧 sessionStorage 场景，再回退 URL／页面默认；保存使用同一能力记录，并尽可能同步旧场景缓存。保存失败不改变主页面场景，也不发出成功事件，草稿和可见错误保留。
- 身份优先级：显式 URL TCI 优先；没有显式 TCI 时，先沿 S/N 找到已有配置的真实保存键，再回退页面 TCI。缺失 TCI 时仅用 S/N 内部键，避免所有缺失值共用 `-`。这避免换绑后按新 S/N 推导 TCI 产生第二份能力记录。
- 保存成功后保留 `terminaltype:changed` 事件，广告资格等既有订阅继续更新；卡片布局和设备身份展示不改动。

### 本次修订验证

- 原能力／绑定专项 14 项通过；加入 Leads 后的关联检查 17 项中 16 项一次通过，另 1 项的搜索断言误计其他原生下拉选项，限定场景弹层后单独重跑通过。
- 终端详情接入后，能力与场景编辑专项 19 项全部通过：包含 Leads 批量设置、搜索／键盘、取消、已分配保留、存储失败、S/N 回填，以及两种详情默认值、共同保存、配置页双向回填和真实配置键保留。
- 已在 Chrome 实际检查 Leads 初始空场景和选场景后的开关，商户详情 Assign Terminal 已无快捷开关。1710 × 950 截图：`artifacts/leads-terminal-assignment-capabilities.png`、`artifacts/terminal-config-binding-without-capabilities.png`。1280 × 800、14 个 S/N 的 Leads 弹窗位于视口内，横向溢出 0px，标签与开关无重叠。
- Chrome 实际检查 Attended / Unattended 详情编辑弹窗：默认状态正确，选 Arcade 后两项开启且不立即保存，Cancel 后主卡片保持原场景。两页弹窗均完整位于桌面视口内，Cancel / Save 均为 40px，标签和开关不重叠。截图：`artifacts/terminal-detail-capabilities-attended.png`、`artifacts/terminal-detail-capabilities-unattended.png`。
- 六个相关页面的内联脚本、三个修改的共享脚本语法、静态构建及 diff 检查通过；仅本地原型改动，未部署。
