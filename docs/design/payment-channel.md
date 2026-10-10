# 运维 Payment Channel

## 已确认范围（2026-10-10）

- 新增 Maintain → Payment Channel 平台级支付渠道目录，保留 Settings、服务商和商户原有的渠道配置页面。
- 列表复刻用户提供的截图列、可见数据与操作。复用共享 Portal 壳层；表头采用 34px 浅灰、11px 字体，操作采用项目 Material Symbols Rounded。
- Add Payment Channel、Edit Payment Channel 直接使用独立页面，先保留截图字段，后续新增内容另行确认。
- Detail 保留弹窗，显示当前渠道信息。
- Cash、Prepaid Card 只允许详情，不允许编辑或删除。其他渠道支持详情、编辑和删除。
- 删除前弹窗显示渠道名称并确认，确认后删除该渠道记录。
- 原型继续使用静态 HTML/CSS/JavaScript，不引入 UI 框架。

## 截图中的字段

Channel Name、Scenario Type、Channel Type Name、Company Information、Channel Properties、Cost Rate (%)、Fee cap、Service Fee Range、Commission Settlement Period、Payment Package Name、Applicable Regions、Supported Card Types、ECOMM Processor capabilities、Terminal Processor capabilities、Cross-Channel Capabilities (Terminal → ECOMM)、Required parameters。

## 已查明的实现事实

- `scripts/platform-admin-shell.js` 统一生成导航、顶栏及角色可见范围；运维模块键为 `matintain`，仅 wizarpos 视角可见。本次将该菜单显示文字的 Matintain 拼写修正为 Maintain，保留内部模块键。
- 22 为服务商渠道配置，23 与 23 v2 为门店渠道配置，均非本次平台级目录。
- 原型旧代码没有截图字段所需的完整选项字典。用户于 2026-10-10 提供真实前端目录后，已结合源码及已打开的 UAT 页面只读补齐。
- 页面编号暂无强制规则；新增页面可使用 47。

## 已确认的表单与返回行为

- Payment Package Name、Supported Card Types 仅 Card Payment 必填，源码同时规定仅该场景显示这两项及 Required parameters。其他星号字段按截图及源码必填。
- 保存成功返回列表，恢复原搜索条件、页码及滚动位置。Cancel、返回按钮、面包屑返回均不保存。
- 新增、编辑、删除保留在当前浏览器的本地存储中，刷新不重置。失败保留表单或待删除记录，显示并聚焦可见错误。未接入真实增改删接口。

## 字段与选项依据

真实前端根目录：`/Users/beaver/Paywizard/代码/paywizard/paywizard-maintain`。主要来源为 `src/views/pab/pcm/index.vue`、`src/apis/pab.ts`、`src/locales/en-US.json`；UAT 页面为 `https://uat.paywizard.biz/maintain/payment-billing/payment-channel-management`。2026-10-10 通过打开下拉与详情、切换分页进行只读采样，未提交源站表单或删除源站记录，采样后恢复第一页。

| 字段 | 已核对的规则或选项 | 源码位置 |
| --- | --- | --- |
| Scenario Type | 1 Card Payment、2 QR Payment、3 Wallet、4 Loyalty、5 Cash；默认 Card Payment | index.vue:254 |
| Channel Type Name | 按场景联动，切换场景清空渠道类型并更新选项 | index.vue:444、470 |
| Applicable Regions | 249 项完整地区标签，至少选择一项 | index.vue:422、617 |
| Supported Card Types | 0x02 Magnetic Stripe Card、0x05 Contact Card、0x07 Contactless Card | index.vue:226 |
| 三组 capabilities | 共用 24 项字典，均可为空；三个字段独立保存 | index.vue:433、1243、1257、1271 |
| Required parameters | cardholderName、country、billingAddress、postalCode、province、email；多选，可为空，仅 Card Payment 显示 | index.vue:416、1285 |
| Channel Name | 必填，最多 20 字符 | index.vue:961 |
| Company Information / Channel Properties | 必填，分别最多 50 / 20 字符 | index.vue:1030、1054 |
| Cost Rate (%) | 必填，0–99.99，最多两位小数 | index.vue:576、1076 |
| Fee cap | 可空，空值按 0 保存；源码未规定正负范围，不额外增加范围限制 | index.vue:512、1104 |
| Service Fee Range / Commission Settlement Period | 必填，最多 50 字符，保留文本，不增加格式推断 | index.vue:1129、1150 |
| Payment Package Name | Card Payment 必填，最多 150 字符；不增加包名正则 | index.vue:1167 |
| Fiserv 专用配置 | 选择 Fiserv 时显示 app、tppId、serviceId，三项必填 | index.vue:591、1299 |

渠道类型完整标签：

- Card Payment：Other、Fiserv、Elavon、Tsys、Till、GlobalPayment、NMI、Nuvei、WEX、EG PAY、2C2P、OXPAY。
- QR Payment：PayDataCloud、PIX、M Pay、Cybersource、Paywizard APM、Prompt Pay。
- Wallet：MMG、MTN MOMO、Lynk。
- Loyalty：Factor4、Prepaid card。
- Cash：Cash。

能力完整标签：Purchase、Refund、Reversal、PreAuth、AuthCompletion、BalanceInquiry、Settlement、QueryTransaction、PrintLast、PrintTotal、PrintDetail、PrintParameter、GetPosInfo、VerifyCardPan、IncrementalAuth、AuthVoid、TipAdjust、PartialReversal、Recharge、LoyaltyIssuance、LoyaltyRedemption、ReadCard、Auth、Capture。

### 数据与接口边界

地区、渠道类型、能力与必需参数在真实前端通过接口加载：`/sysCountryDef/countryList`、`/sysChannelType/queryChannelTypeList`、`/sysTranDef/queryList`、`/sysSaasChannelPayParams/querySaasChannelPayParams`。仓库没有这些接口的完整响应字典，因此通过实际可见 UAT 选项补齐标签。本地原型以地区、类型和能力标签作为稳定选择值，不伪造后端数据库 ID 或交易代码，不使用登录凭据、不调用源站接口。Scenario Type 的数字值和卡类型代码沿用源码。

列表、费用及三组能力采用 UAT 可见的 46 条渠道采样，保留截图顺序和时间。Fiserv-WizarPos 的三项专用配置亦由编辑表单只读核对。初始样例的 Required parameters 为空；未读取其他渠道隐藏的参数配置，不能将样例当成后台完整数据导出。

源码费率使用比例值，显示乘 100、提交除 100；本地原型保存的是页面百分比值，未来真实接口适配时必须转换。源码 Fee cap 的 NaN 判定及新增后沿用旧场景类型字典的问题不作为产品规则复制。

## 页面与组件实现

- `47.payment_channel.html`：列表、筛选、分页、详情弹窗与删除确认。
- `47.payment_channel_form.html`：Add 独立页面；`?id=pc-01` 等稳定 ID 对应 Edit 独立页面。两种模式复用同一表单实现，均非弹窗。
- `scripts/payment-channel-data.js`：采样记录与选项；`scripts/payment-channel-maintain.js`：列表、表单、校验及本地存储。
- `scripts/payment-channel-picker.js`、`styles/payment-channel-maintain.css`：统一控件与局部布局。
- 共享导航及首页目录已连接。现金和预付卡即使通过直接编辑 URL 访问，也保持只读。其他角色继续遵守共享 shell 的运维页面访问规则。

选择器参照 [PrimeVue v4 Select](https://v4.primevue.org/select/) 与 [MultiSelect](https://v4.primevue.org/multiselect/)，删除参照 [ConfirmDialog](https://v4.primevue.org/confirmdialog/)，详情参照 Dialog，列表参照 DataTable / Paginator。仍使用静态原型实现。原有广告单选组件缺少多选、集中查看已选项与顶层浮层能力，因此采用搜索输入、勾选列表、已选筛选和清除操作的组合，支持方向键、Enter、Esc、Tab。原生 popover 顶层浮层动态适配视口；原生 dialog 提供模态焦点限制。按钮及列表紧凑规格按项目规范定制。

## 验收

自动化入口：`npx playwright test tests/payment-channel-maintain.spec.js tests/payment-channel-typography.spec.js tests/agents-sidebar-consistency.spec.js --workers=2`，10 项通过。覆盖增改删闭环、刷新保留、取消不保存、筛选与分页返回、系统渠道直接访问保护、地区搜索保留多选、键盘选择、场景联动、Fiserv、费率边界、错误聚焦、存储失败及桌面尺寸。桌面浏览器另行打开实际列表、新增页、编辑页、详情及删除弹窗、地区浮层和首页入口，核查 34px / 11px 表头、36px 行操作、40px 表单操作与错误定位。修正视觉检查发现的固定表单操作栏裁切，并增加按钮完整落在滚动容器内的检查。`npm run build` 与 `git diff --check` 通过。

扩大检查共享 shell 的导航与标题时，13 项中 11 项通过、2 项失败：旧测试期待 Settings 下有 SLA Alerts，以及 Agents 页面标题为 Agents。将浏览器请求替换为 `git show HEAD:scripts/platform-admin-shell.js` 的改动前脚本后，仍显示 Settings 为 Alerts / Branding / Products / Product Map Templates、标题为 Agent List，确认是既有测试与当前页面不一致。本次未改动这些旧规则或测试。

## 文档取舍

本次新增页面及布局选择可逆，暂不创建 ADR。业务术语记录于根 GLOSSARY.md；本文件记录本次范围与交互决定。
