# 关联交易原型实现与验收

日期：2026-09-15。

## 已实现

- `12.transaction_list.html`：Actions 内新增 Related Transactions 和 Terminal Details，复用原有 Transaction Details、Send Receipt 和后续交易操作。无终端控制权时 Terminal Details 禁用。
- `11.transaction_detail_redesign.html`：按隐藏的 `recordKey` 加载当前记录；用户界面只展示支付来源提供的 Transaction ID。摘要下方、技术字段上方显示相同关联表。技术字段只读取当前记录，不复用另一笔的固定 payload。
- 共用 `scripts/transaction-records.js` 数据和关系查询、`scripts/related-transactions.js` 表格及居中弹窗；`styles/related-transactions.css` 隔离列表全局表格样式。表头 34px、11px 字体。
- 从任意成员进入，遍历直接支付引用取得原始、同级及后续记录；跨状态，不继承列表过滤。Current 底色与文字同时标识当前笔，Applies To 指向直接对象，Original Transaction 单独标识根记录。
- 不新增金额汇总。关系仅采用同 MID、同支付通道的明确内部 ID／唯一外部引用；缺失、冲突、重复身份、循环引用不猜测合组。
- 列表返回恢复 Tab、已应用筛选、分页及滚动位置；弹窗 Escape／关闭恢复 Actions 焦点。
- 小票随当前记录更新，无可用小票时禁用入口。成功演示记录提供生成的小票文本下载；发送入口沿用原型模拟提示，不发送真实邮件。
- 新建演示后续交易保存到当前浏览器标签页的 sessionStorage，刷新与进入详情可继续查看。原有操作额度查询只使用成功的直接子交易，避免失败记录参与旧计算。

## 演示入口

| 场景 | Transaction ID |
| --- | --- |
| 预付卡消费、小费调整、成功／失败退款 | PT20260916001834 |
| Fiserv Visa 消费与两次部分退款 | 84607420342 |
| Fiserv Mastercard 预授权、增额、完成、结算后部分退款 | 84607420410 |
| TSYS Mastercard 预授权、完成、结算前撤销 | M2100037527371558913 |
| 无明确关联 | TXN-99882716105 |

列表对应记录的 Actions → Related Transactions 可直接演示。详情示例：`11.transaction_detail_redesign.html?recordKey=fiserv-mc-refund-001`。

## 验证结果

- `node --test tests/unit/related-transactions.test.cjs`：11 项通过，覆盖多层／同级／全状态、商户与通道隔离、歧义引用、迟到记录、循环、可见范围、未知 ID、重复身份、刷新保存与冲突引用。
- `npm run build` 与 `git diff --check` 通过。
- 浏览器桌面实际验收：居中弹窗、34px 表头、Current 底色、关闭焦点；Completed／Failed 均能查看完整组；失败记录筛选不影响组成员；返回 Failed 第 2 页／筛选恢复；50 条长列表恢复横向 1345.5px、纵向 3233.5px 位置及每页条数；详情切换、刷新与小票对应当前 ID；Failed 小票禁用；未知 ID 显示不可用。
- Card／QR／Prepaid 三类筛选回归通过。
- 已验证原有退款最大可退金额仍排除失败退款；创建 USD 0.25 演示退款经同 MID 其他终端执行，详情与刷新后显示正确关联。
- 开发专用页面 `tests/fixtures/related-transactions.html` 验证加载失败→Retry、原单补传、权限过滤示例、27 笔分页及长 ID。该页面不进入静态构建产物。

## 实施边界

这是静态交互原型，未部署，也没有真实支付、真实邮件、生产关系查询或服务端权限。演示数据将 Processor Time 统一约定为 UTC；生产需按真实时区转换。旧页面日期控件本身未接入日期过滤，本次保留其行为。

前端分页基于完整的可见演示集合；生产必须由服务端限定权限、返回准确总数与完整性并支持分页查询。测试中的可见性回调用于验证过滤行为，不构成安全授权。

生产上线前仍须核查内部记录 ID 与支付引用映射、失败记录保存、历史覆盖、跨终端关系以及真实小票可用性。相同卡号、金额、RRN 或外部订单号不用于推断关系。

## 视觉统一修订（2026-09-15）

根据用户截图，仅调整关联弹窗与交易详情的展示：删除内容区重复面包屑，保留共享顶栏导航；移除详情 1320px 宽度上限，内容撑满主区域。卡片采用共享 `--pw-page-radius: 8px`；关联、小票及发送小票弹窗采用 Agent List／Terminal List 现有 12px 圆角。按钮 6px、输入框 8px，均为 40px 高。

继承共享 Poppins 字体，页面标题对齐 25px／600，正文 13px，字段标签 11px，关联表维持 34px 表头及 11px 字体。此轮曾将金额缩为 32px 并去掉渐变；用户后续明确要求恢复原设计，以下修正覆盖这项调整。

桌面检查确认内容左右与 shell 主区域齐边，重复面包屑不存在；卡片、按钮、输入框和小票弹窗的实际计算尺寸符合上述规格。

## 保留原设计与完整信息的修正（2026-09-15）

- 无关联：详情隐藏整个 Related Transactions 模块；弹窗只展示无关联提示，不展示自身行、1 transaction 或 Original Transaction 标题。已知引用但记录不可用时保留引用不可用提示，同样不列自身行；多笔关联保留完整表格与 Current 标记。
- 恢复原 Amount 卡的 62px 大金额、淡蓝渐变、阴影、分隔线与结果／类型／Terminal 三枚标签；恢复摘要中的 External Order No. 和 Reference Number。保留满宽布局、去重后的顶栏导航及统一容器圆角。
- 恢复全部 9 个原始模块与原有字段结构：Transaction（三列）、Merchant、Card、Amounts、DCC、EMV、Original、Point Of Sale、Extra（下方三列网格）。2026-09-16 标识修订后，页面只展示当前支付记录实际返回的可选字段；字段全部为空的模块不占用页面空间。
- 原始丰富演示 payload 作为独立记录 `TXN-99882716105` 保留，直接打开无参数详情页展示它。带 `recordKey` 或旧版 `transactionId` 参数的详情严格按指定记录加载，不存在的记录不回落到此样例。其他交易不借用该样例的 EMV、DCC、商户、金额或卡信息。
- `scripts/transaction-detail-model.js` 独立保留原始信息结构；原始金额字段与已格式化金额分别使用各自数据，不把格式化小费直接混入原始金额字段，也不将 IDX 标识猜测为外部订单号。
- 新建后续演示交易不会继承上一笔的详细 payload。

- Current 标记放在当前记录的 Type 旁边。当前交易的 Transaction ID 使用不可点击文本；其他交易 ID 可跳转。
- 详情页右上角采用 Back、View Receipt、Send Receipt 三个图文按钮；Back 从列表进入时恢复原 Tab、筛选、分页及滚动状态，直接打开详情时返回普通交易列表。

验证：14 项关系／详情模型测试通过，覆盖原始 9 模块、缺字段保留、原始/显示金额区分、0/false 保留及不同交易间的数据隔离；桌面实际检查原金额设计及下方模块、无关联隐藏和弹窗空态。

## 支付标识与 Mock 数据修订（2026-09-16）

- 每条 Transaction Record 只有一个用户可见的 Transaction ID。它是不透明字符串，支付来源可以采用不同长度、字符集和前缀；页面逻辑不解析其格式。
- 删除 PAYWizard ID、Trans Log ID 和 Trans Index Code。列表字段、筛选、详情、关联弹窗、小票、导出及后续交易提示统一使用 Transaction ID。
- `recordKey` 只用于原型内部查找和关系图，不显示给用户。后续操作同时保存 `originalRecordKey` 和来源返回的 `originalTransactionId`，冲突时不建立关联。
- Reference Number 明确为 RRN，Trace No. 明确为 STAN。RRN mock 使用 12 位数字，STAN 使用 6 位数字；Approval Code 仅在有批准结果时提供。失败记录不生成 Approval Code 或 Batch No.，未进入网络的失败记录也不生成 RRN。
- Batch No. 仅表示结算批次；Invoice No.、External Order No. 和 Checkout ID 不用 Transaction ID 派生或补齐。技术详情中的空字段继续隐藏；头部摘要固定保留 8 个模块，External Order No. 或 Reference Number 没有来源数据时显示 `—`。
- 79 条 mock 记录全部遵守最终结果约束。普通分页数据只生成独立 Purchase 或失败 Purchase；Refund、Incremental Authorization、Auth Completion 和 Void 只出现在有明确父引用的关系链中。
- Fiserv Mastercard 的已结算链路为 Pre-Authorization → Incremental Authorization → Auth Completion → Partial Refund，退款直接作用于 Auth Completion。TSYS Mastercard 的未结算链路为 Pre-Authorization → Auth Completion → Void，撤销直接作用于 Auth Completion。
- Transaction Record 只保存 Completed 或 Failed 最终结果，不展示 Pending。点击其他关联交易 ID 时打开目标详情顶部，深色反白 `Now viewing transaction …` 悬浮提示从页面上方向下滑入并停在顶栏内部的主内容区中央，不占页面布局，约 3 秒后向上收回；当前交易自身 ID 不可点击。
- Card Scheme 与 Payment Method 分开表达：交易列表的银行卡记录只在卡号前展示约 30×18px 的轻量 Visa、Mastercard 品牌标识，未知卡组织使用同尺寸的通用灰色银行卡图标；交易详情在原有卡组织文字前展示同款标识。Prepaid、QR 不展示 Card Scheme Logo。

验证：`node --test tests/unit/related-transactions.test.cjs tests/unit/transaction-detail-model.test.cjs` 15 项通过；`npm run build`、所有相关脚本的 `node --check` 和 `git diff --check` 通过。
