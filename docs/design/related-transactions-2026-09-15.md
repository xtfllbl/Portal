# Paywizard 关联交易改造研究

日期：2026-09-15。状态：关联业务范围及入口形式已确认，Actions → Related Transactions 打开居中弹窗，详情内保留关联表。调研与设计已整理为[首版方案](related-transactions-v1.md)，本文件保留调研证据与讨论依据。

## 结论

已确认：Paywizard 关注一笔笔支付交易记录，关联依据是针对交易发生的支付操作，不建立零售或餐饮订单的聚合概念。Transactions 保留逐笔流水，并增加关联入口。

第二轮已确认覆盖现有支持的关联交易类型，关联区呈现有可信引用的成功、失败及处理中记录。列表继续使用 Completed／Failed 两个 Tab；关联区使用独立查询范围，不受入口 Tab 截断。

用户已确认首版不新增金额汇总：保留当前笔金额与关联各笔金额、币种及结果，不新增已收款、累计已退款、退款后金额或可退／可完成额度等组级计算字段。

已确认每笔交易的 Actions 下拉菜单新增 Related Transactions，点击打开居中弹窗；保留 Terminal Details，详情内也保留关联表。两个入口展示完整关联支付过程。用户找到一笔退款后，可以看见原消费、其他退款及后续操作；每笔自己的金额、结果和小票仍有清楚的归属。

当前产品代码已有后续交易查询和历史组件，可以复用部分能力。但现有查询仅覆盖直接成功子单，需要补充反向、多层、跨日期及不同结果的关联查询。先确定产品分组边界，再定数据契约，最后改页面。

本文区分现有代码事实、用户确认的决定与候选方案。附件中的建议尚未自动成为已确认需求。已将支付关联边界写入 `CONTEXT.md` 和 [ADR 0013](../adr/0013-scope-related-transactions-to-payment-references.md)，尚未修改产品页面或支付操作。

## 输入与核查范围

- 用户附件：[支付后台关联交易展示调研与改版建议.docx](/Users/beaver/Documents/支付后台关联交易展示调研与改版建议.docx)。已读取正文及两幅设计示意图；其中对历史 HTML 附件的描述以本地当前源码重新核对。
- 当前原型：[交易列表](../../12.transaction_list.html)、[交易详情](../../11.transaction_detail_redesign.html)。在本地 8998 端口实际查看桌面页面及列表到详情路径。
- 本地产品代码：`/Users/beaver/Paywizard/代码/paywizard/paywizard-portal` 及对应交易服务源码。源码行为不代表已在线上验证，也不证明所有通道数据完整。
- 项目术语与决定：原型根 `CONTEXT.md` 和 `docs/adr/`，以及产品文档 `detailed-design/contexts/transaction-records/CONTEXT.md`。后者已有 Transaction Record 定义；现有 Billing 概念不能直接代替终端支付交易概念。
- 官方资料仅复核与方案有关的生命周期、退款状态和授权金额语义，未重新执行七个平台登录后台的完整竞品测试。

## 现状与差距

| 位置 | 已核查事实 | 对改造的影响 |
| --- | --- | --- |
| 原型列表 | 有 Purchase、Refund、Auth、Incremental、Capture、Tip Adjust 等类型和 `originalTransId` 示例 | 基础关系示例可复用；样例不代表真实数据覆盖 |
| 原型关联计算 | `linkedTransactions` 仅匹配当前 `transId` 的直接子单；退款、完成、增加金额由这些记录计算 | 无法满足退款反查原单、同级退款和多层链；不能直接作为全组汇总 |
| 原型详情导航 | 行菜单跳到固定详情 URL，不带选中 ID；详情是固定 payload | 先打通逐笔身份，再验证关联交互 |
| 原型实际操作 | 从 USD 1.00 的 Tip Adjust 进入后，详情显示固定 EUR 2.50 Purchase | 当前原型不能用“打开了详情”作为逐笔详情验收 |
| 原型详情 | 金额及关键字段后直接接技术字段；Original 是文本字段 | 关联区适合插在摘要和技术字段之间 |
| 产品 Portal | 已有 `FollowupHistory.vue`，在后续交易操作弹窗使用，按退款、小费、授权相关操作分段 | 查看关联记录应独立于是否可以发起后续交易 |
| 产品关联 ID | 历史组件将 `tranLogId` 渲染成普通文本 | 需要明确详情定位 ID，再提供逐笔跳转 |
| 产品后端 | `queryOrderFullInfo` 的子查询只取 `parent_no = 当前 order_no` 且 `state = 2` 的直接子记录 | 当前接口不能承诺“任意一笔进入全部状态的整组交易” |

原型证据：`12.transaction_list.html:962`、`:978`、`:996`、`:2159`；`11.transaction_detail_redesign.html:166`、`:168`、`:175`。产品代码证据见文末。

## 交互方向

以下基于已确认的支付交易关联边界、逐笔流水列表、全结果展示、双查看入口及首版不新增金额汇总。Actions 入口和居中弹窗形式均已写入首版方案。

### 交易列表

保留每笔操作一行、原有筛选和默认排序。在每笔交易现有 Actions 下拉菜单中保留 Terminal Details，新增 Related Transactions；不新增独立关联列或右侧抽屉。

Actions 菜单项使用 Related Transactions，不预取列表每行的关联计数。打开后的关联区显示包含当前笔的可见总笔数；数量必须来自相同权限范围的查询结果，接口未返回时不能把未知写成 0，也不能在前端当前分页中计数。

点击 Actions 中的 Related Transactions，以已确认的居中弹窗查看关联记录。现有 Transaction Details 入口继续进入该笔详情，详情内也有完整关联表。离开关联查看或从详情返回列表时保留筛选、页码、排序和滚动位置。

### 交易详情

推荐阅读顺序：

1. 当前笔的金额、交易类型、处理结果、时间及关键 ID；小票动作仍对应当前笔。
2. Related Transactions：按处理时间排序的紧凑关联表，显示关联数量及当前笔标记，不增加整组金额汇总卡片。
3. 当前笔已有的 Transaction、Merchant、Card、Original 等详细字段。

关联表默认字段：时间（明确时区）、类型、金额及币种、处理结果、直接作用对象、交易 ID。当前笔同时用底色和 Current 文字标记。终端可作为按需查看字段，跨终端记录不能被丢弃。

例如消费 S001 成功 EUR 100，两次成功退款 R001 EUR 20、R002 EUR 30：

| 当前打开 | 顶部详情 | 关联区 |
| --- | --- | --- |
| S001 | Purchase，EUR 100 | S001、R001、R002，S001 标记 Current |
| R001 | Refund，EUR 20 | 同样三笔，R001 标记 Current |
| R002 | Refund，EUR 30 | 同样三笔，R002 标记 Current |

退款行的 Applies To 均为 S001。若还有退款撤销 V001，则它的 Applies To 应为实际被撤销的退款，而不是一律指向最初消费。

点击同组另一笔时更新 URL、顶部详情、技术字段与小票对象，保持关联区稳定可见。关联表首版聚焦查看与跳转；退款等操作继续沿用现有入口及校验。

### 查询边界

关联区查询不继承列表的日期、交易类型、金额和成功／失败筛选，但必须沿用当前用户的权限边界。列表筛选回答“我在找哪条记录”；关联查询回答“这条记录属于什么支付过程”。

### Completed 和 Failed 两个 Tab 的具体规则

假设 S001 消费成功、R001 退款失败、R002 退款成功，三笔具有明确关联：

| 位置 | 展示内容 |
| --- | --- |
| Completed 列表 | S001、R002，各自为一条流水 |
| Failed 列表 | R001，一条失败退款流水 |
| 从任意一笔打开关联区 | S001、R001、R002，各行展示自身结果，并定位 Current |

关联入口不切换或合并列表 Tab。用户回到列表时恢复原 Tab、日期、筛选、页码及滚动位置。关联区出现失败记录不代表 Completed 列表混入失败流水；列表计数与现有导出仍按原筛选命中记录计算。

平台交易记录只保存最终支付结果，因此关联区只显示 Completed 或 Failed，不记录 Pending。失败记录仍保留其业务类型，例如 Refund + Failed；不应把 Failed 当成退款的替代类型。

页面分别表达正在加载、检索完成且无关联、检索失败可重试、明确历史缺口。已知原单引用但取不到原单时保留允许展示的引用，不伪造原单详情。权限不足不能借关联笔数、金额摘要或错误提示泄露不可见记录。

## 候选领域用语

Transaction Record 沿用产品文档既有定义，Related Transactions 的支付关系边界及完整查看范围已经确认；Original Transaction 和 Applies To 区分原始交易与直接作用对象，已写入原型 `CONTEXT.md`。代码中的关联对象与交易流水、执行尝试之间的映射仍需核实，不能先假定一一对应；内部字段命名不代表平台具有零售订单概念。

| 用语 | 建议含义 | 易混淆的对象 |
| --- | --- | --- |
| Transaction Record 交易记录 | 对一次已观察支付、退款、撤销或相关操作事实的可查询记录 | 沿用产品词汇；不等同于 Payment Order 或 Transaction Attempt |
| Related Transactions 关联交易 | 针对一笔支付交易及其后续交易发生、由明确支付引用连接的交易记录集合；边界已确认 | 同卡号、同金额、同外部订单号不构成支付关联 |
| Original Transaction 原始交易 | 该支付过程最初的消费或预授权 | 与当前操作直接作用的对象不一定相同 |
| Applies To 直接作用对象 | 当前退款、完成、撤销或调整实际针对的交易 | 不等于表格上一行，也不一定等于最初交易 |
| Transaction Result 交易结果 | 当前这一项操作的处理结果 | 不等于整笔支付状态或结算状态 |

`orderNo` 等代码命名不能直接解释为商户外部订单号；需要以现有字段映射和生成方核对。

## 金额与状态

已确认首版不新增组级金额汇总，只显示各笔来源记录的金额、币种和结果。下列金额场景用于说明为何不能直接累加，以及未来若重新考虑汇总必须验证的前提，不是本版新增金额字段的实施要求。

- 单笔成功消费后来被退款：保留消费自身的成功结果，整组可以显示部分退款。
- EUR 100 收款、有效成功退款 EUR 20、处理中退款 EUR 10、失败退款 EUR 5：已退款为 20，处理中为 10；在无其他资金调整的这个示例中，退款后金额为 80。它不代表扣除手续费后的净收入或实际银行入账。
- 预授权与实际收款分开。授权 100 后调整到 150，不能把新总额 150 当作新增金额累加成 250。Stripe 的增额接口要求更新后的授权总额，说明金额必须按通道语义解释。[Stripe 官方说明](https://docs.stripe.com/payments/incremental-authorization?platform=web&ui=stripe-hosted)
- 授权 150、完成 120，并不能单凭差值确认还可完成 30；还需知道是否最终完成、是否关闭及渠道确认额度。
- 后续退款失败或退回可能改变资金效果。Adyen 明确区分退款受理后失败和已退资金返回；不能将一次接口成功永久解释为最终到账。[Adyen 官方说明](https://docs.adyen.com/online-payments/refund/)
- 小费调整的最新总额与本次差额必须区分；不同币种分别展示，不能直接求和。
- 不完整数据下的摘要不能伪装为完整支付过程金额；可暂不提供汇总，继续准确展示已知记录。

## 数据支持与实现顺序

### 先利用已有结构核查关系

产品已有交易自身编号、父单引用和后续交易查询。先核查现有关系在发起操作、异步通知、终端补传及失败记录中的保存情况，再判断是否需要持久化支付组标识。无需在本轮直接决定新增独立 Payment 表或全新用户可见 Payment ID。

候选只读查询应支持：以任意内部交易唯一标识进入，取得可见的整组记录、当前笔、已确认根交易及直接关系、准确计数和完整性信息。记录须包含自己的结果、币种、金额语义和逐笔详情定位 ID；关联计数不能只统计当前加载页。首版不要求组级金额摘要字段。列表数量查询应批量返回，避免每一行独立请求。

原始外部引用及其通道／商户账户作用域需要保留；不能仅按 `transId`、RRN、卡号尾号或商户订单号相等自动合组。针对循环引用、缺失父单、迟到数据和重复通知，需要明确终止、去重及补齐规则。

实际产品金额按 `×10000` 整数存储，Portal 使用 Decimal.js 及 currency store 转换。原型的小数 Number 算法只能用于演示，不能直接移植成产品金额计算。`tranLogId` 用于现有逐笔详情，`orderNo` 用于现有后续交易查询；应在接口返回中明确映射，不能拿任一 ID 替代所有用途。

### 避免影响现有交易操作

现有成功子单查询可能参与退款、授权完成等动作的额度计算。关联查看所需的全状态查询，应使用独立只读接口，或在评估全部调用方后扩展现接口；不能简单去掉 `state = 2` 就让失败／处理中记录混入原有操作计算。

### 候选分期

1. 明确组边界、当前笔与直接关系；核实真实字段映射和数据覆盖。
2. 原型打通列表记录到自身详情；增加成功、失败、处理中、多层与孤立引用样例，评审关联区交互。
3. 产品增加完整关联查询，复用可用的历史表格、金额格式化和交易详情能力；打通查看入口与导航状态。
4. 首版保留当前笔金额和关联各笔金额，不新增金额汇总。状态历史及关联导出按后续需求评估，首版主列表保持已确认的逐笔展示。

## 需要共同确认的设计树

### 第一轮已确认

- Q1 关联范围：以支付交易为边界，关联针对该笔交易的后续支付操作。用户明确平台关注支付，不引入零售餐饮订单概念。
- Q2 默认列表：逐笔流水＋关联入口。

### 第二轮已确认

- Q3 已确认：首版覆盖现有支持类型中有明确支付关联的记录，包括退款、撤销、预授权增加／完成及小费调整；这不承诺新增通道操作能力。
- Q4 已同意全结果展示，用户询问两个 Tab 是否受影响。设计说明：保留 Completed／Failed 列表划分，关联区独立查询并逐行展示结果，返回恢复原列表上下文。
- Q5 已确认：首版不新增金额汇总。复核发现 Stripe 有局部已退款金额的界面证据，但没有足够证据支持把附件的多项整组汇总视为通用竞品方案，Paywizard 也尚未证实可准确计算；用户已接受调整后的范围。保留当前笔及关联各笔金额、币种和结果。

### 第三轮已确认

- Q6 已确认并按用户纠正：每笔交易 Actions 下拉菜单中，除 Terminal Details 外增加 Related Transactions；点击后打开居中弹窗。详情内关联表继续保留。
- Q7 已确认完整支付过程：从第二笔退款进入，也展示原消费和同组其他退款；每行用 Applies To 标明直接作用对象。

产品范围及查看形式的讨论已收敛，当前笔切换、返回列表、异常状态和历史缺口规则已整理到[首版方案](related-transactions-v1.md)，其中导航及实现细节标明为配套建议。真实接口的关系覆盖、标识映射与历史数据范围仍是实施前核查项；本次交付为研究与设计文档。

已记录长期支付关联边界 ADR；交易类型、全结果展示和首版无新增金额汇总均记录为用户确认事项。

## 验收重点

- 消费加两次退款：从三笔任意一笔进入，成员相同、Current 准确。
- 预授权、增加、完成、完成后退款：从末端退款进入仍恢复正确上下文和直接作用对象。
- 从 Failed 或跨日期列表进入：关联区不被原筛选截断。
- 失败与处理中记录可见且结果准确；各笔金额保持其原始业务含义，页面不增加组级金额汇总。
- 从 Completed 或 Failed 进入，关联区成员范围一致；返回原 Tab，关联记录不改变列表计数和导出范围。
- 重复回调不增加笔数；真实新尝试保留自身身份。
- 原单缺失、查询错误、无关联分别表达；权限范围外的数据及派生统计不泄露。
- 小票、刷新、直接 URL 访问和返回列表都保持正确的当前笔及导航状态。
- 桌面实看关联入口、紧凑表格、Current 标记、长 ID 和错误定位；依项目最新要求不做手机浏览器验收。

## 官方做法的适用范围

Stripe 官方文档证明用户可从支付详情 Timeline 进入退款条目查看详情，支持把关联过程放在支付详情上下文的设计方向；这不等于证明所有平台都实现了“任意交易进入整组”。[Stripe 退款文档](https://docs.stripe.com/refunds)

Adyen 官方文档将支付的历史状态放在 Payment lifecycle 中。支付操作与其多次状态更新需要分别建模，防止把每次状态变化都展示成新交易。[Adyen 支付生命周期](https://docs.adyen.com/account/payments-lifecycle)

### 金额汇总追加核查

用户提出“汇总能否保证准确，其他平台是否做汇总；若没有我们也不做”。本次核查专门区分单笔金额、退款金额提示、整组累计金额及账户报表，不用 API 字段证明界面存在。

| 平台 | 官方页面能够证明的展示 | 对本次组级金额摘要的结论 |
| --- | --- | --- |
| Stripe | 部分退款后，在 Dashboard Payments 的交易信息图标上可查看已退款金额；详情 Timeline 可查看退款条目 | 有局部退款金额展示，不能说完全没有金额概览；该说明未明确多次退款累计及完整多项汇总的计算口径。[来源](https://support.stripe.com/questions/understanding-refund-statuses?locale=en-GB) |
| Adyen | Payment details 有生命周期、支付事件和交易费用 | 本次资料未证实与附件示意相同的已收款／累计已退／处理中／退款后金额组合。[来源](https://docs.adyen.com/account/manage-payments) |
| Checkout.com | 新退款作为事件出现在支付时间线 | 能证明事件归属，未证实累计退款或退款后净额摘要。[来源](https://support.checkout.com/hc/en-us/articles/14327084057618-Issue-a-full-or-partial-payment-refund) |
| Braintree | 从具体交易详情发起退款并调整退款金额 | 未证实通用详情提供多次退款累计或净额；分期场景的调整金额不是同一证据范围。[来源](https://developer.paypal.com/braintree/articles/control-panel/transactions/refunds-voids-credits) |
| Square | 从 Transactions 选中具体支付，执行金额或商品退款 | 未证实本次需要的支付关联过程累计摘要。[来源](https://squareup.com/help/us/en/article/6116-process-refunds) |
| Authorize.net | New Experience 2.0 描述当前交易金额、结算金额和退款原交易引用 | 属于单笔字段，不能据此宣称存在全链累计退款摘要；拆分付款订单场景不适用于已确认的 Paywizard 边界。[来源](https://support.authorize.net/knowledgebase/article/KA-07950/en-us) |

“未证实”表示本次官方材料证据不足，不表示产品一定没有该功能。Cybersource 的关联场景资料也不能仅凭相关记录与金额字段推定存在通用汇总。附件图 1 和图 2 已标明是建议方案示意，其中的金额卡片不是竞品截图。

目前不能保证 Paywizard 新增组级汇总准确：现有关联接口仅覆盖直接成功子单，最终退款失败／退回的数据覆盖和授权／小费调整金额含义仍需核查。即使前端加法无误，也可能漏掉记录或错用金额语义。用户已确认首版不新增汇总；仍要准确传递各笔金额单位、币种和结果。

## 产品代码证据索引

以下均为本次读取的本地源码快照，行号可能随后续开发改变。

| 证据 | 文件位置 |
| --- | --- |
| 列表与关联查询 API 分离 | [transaction.ts](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/apis/transaction.ts:17)，关联查询从第 30 行开始 |
| 关联返回类型及金额字段 | [transaction.d.ts](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/types/apis/transaction.d.ts:556) |
| 产品列表到详情传 tranLogId | [transactionActionsStore.ts](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/views/transaction/stores/transactionActionsStore.ts:217) |
| 产品详情按当前 ID 查询 | [payment-details.vue](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/views/transaction/payment-details.vue:52) |
| 后续交易历史表格 | [FollowupHistory.vue](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/views/transaction/components/FollowupHistory.vue:27) |
| 历史交易 ID 纯文本 | [FollowupHistory.renderers.tsx](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/src/views/transaction/components/FollowupHistory.renderers.tsx:26) |
| 后端直接成功子单查询 | [MrtOrderDefMapper.xml](/Users/beaver/Paywizard/代码/paywizard/paywizard-trade-Server/ovstrade-openapi/src/main/resources/mapper/MrtOrderDefMapper.xml:138) |
| 产品交易事实术语 | [Transaction Records CONTEXT.md](/Users/beaver/Paywizard/代码/paywizard/detailed-design/contexts/transaction-records/CONTEXT.md:7) |
| 产品金额换算约定 | [Portal AGENTS.md](/Users/beaver/Paywizard/代码/paywizard/paywizard-portal/AGENTS.md:157) |
