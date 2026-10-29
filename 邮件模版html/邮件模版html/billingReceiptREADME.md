# 支付成功收据邮件

入口：`billingReceiptSamples.html`。通用模板：`billingPaymentReceipt.html`。六份 Sample HTML 可直接在浏览器或 Live Server 打开；同名 JSON 是渲染输入示例。

## 已确认规则

- 参考 Spark 对话 19977 的 Receipt 信息结构；保留金额、付款日期、费用描述、备注、卡种尾号和 Invoice。视觉以 Spark 中邮件 19977 的实际呈现为准：Paywizard | wizarPOS 左上标识、桌面右上 RECEIPT（手机端移至品牌下方）、居中金额、Description/Amount 双列、蓝色期数、浅黄虚线备注及左右排列的付款方式与 Invoice。标识复用本地既有邮件资料 `../邮件HTML/HTML文件/wizarpos-logo.png` 的黑蓝色 WizarPOS 图片，与现有邮件使用的 Paywizard 官方 Logo 图片组成统一品牌区，覆盖全部六种收据场景。预览使用同目录 `billingReceiptLogo.png`；正式发送必须通过 `logoUrl` 指定 wizarPOS 图片的托管 HTTPS 地址或 CID 内嵌附件地址。
- 一次性成功付款、分期首期、后续自动扣款、最后一期均生成收据。每封对应一次成功支付；失败不生成成功收据。逾期逐期补扣也各自生成。
- 商户与独立账单统一发送至付款人在 checkout 填写的邮箱；后续分期使用授权时保存的付款邮箱。不是 Send Link 的收件人，也不默认取商户账户邮箱。
- 独立支付省略整个商户信息行，不留空标签，无登录按钮。
- 显示本次成功实付金额，不把合同总金额当成本次支付额。付款时间必须包含明确时区。
- Fixed-term monthly 显示本次期数及总期数；仍有逾期款时提示逐期收取，否则显示后端提供的下一扣款金额和日期。全部期数已付清时提示结束，不再显示下一扣款。
- 新收据显示本期Billing Period及Installment，账期按原合同计划确定，含起止两日；提前付款或补扣不改变归属。不沿用Monthly Subscription，不根据实际付款时间推算账期或下一付款日期。
- eSIM 的 Included data 仅在有值时显示；空备注整块省略。费用描述应来自账单业务描述，不能固定成终端 SaaS。

## 渲染

模板遵循现有 `${variable}` 形式。`${merchantRows}`、`${paymentRows}`、`${installmentSection}` 和 `${notesSection}` 为可信渲染器生成的 HTML 片段；不能直接接收用户提供的 HTML。其余变量均进行 HTML 转义。

```sh
python3 renderBillingReceipt.py billingReceiptStandaloneMonthlySample.json /tmp/receipt.html
```

`renderBillingReceipt.py` 是可运行的参考渲染器，使用 Python 标准库，无额外依赖。服务端可按同样规则移植到实际模板引擎；邮件正文不依赖 JavaScript。金额字符串应由支付结果按币种格式化，paymentReference 使用成功交易的唯一标识；paymentMethod 只包含卡种及尾号，不能传完整卡号或 CVC。

建议邮件主题：`Payment receipt — {invoiceNumber}`。投递系统按成功支付唯一标识去重，重试投递复用同一收据和付款时快照，避免后续扣款改变历史收据的期数及余额信息。模板本身不实现发送或去重。

## 验证范围

六种场景：商户一次性、独立一次性、商户首期、独立 eSIM 后续分期、最后一期、逾期补扣成功。验证了桌面 800px 与手机 390px 浏览器排版、无未替换变量、无横向溢出及条件字段。采用内联样式、table 布局、系统字体和移动端媒体查询；尚未在 Outlook/Gmail 等真实邮件客户端投递测试。

本次只提供模板、输入样例、渲染参考和预览文件，未改动支付逻辑或自动发送服务，也未发送任何邮件。示例均为虚构数据。

母版直接打开时，wizarPOS 图片使用同目录 `billingReceiptLogo.png`，避免将未替换的变量作为图片 URL。渲染器在生成邮件时仍按 `logoUrl` 替换为指定 HTTPS/CID 地址。Paywizard 图片与 `customerAlert.html` 的图片来源保持一致。

## 2026-09-09 演示开发更新

`render_message(data)`现返回subject/html/text；原`render(data)`继续返回HTML。命令行同步输出HTML、纯文本和主题。收据增加Payment ID、collectionStopped及无后续计划分支。44的View emails使用浏览器端事件渲染器查看每笔成功快照，详见[billingFailureREADME.md](billingFailureREADME.md)。没有真实发送。

## 2026-10-29 单期账期

新成功事件保存 `receiptVersion: 2` 和 `billingPeriod: {start: "2026-09-07", end: "2026-10-06"}`（UTC日历日期、含首尾）。运行时和Python参考渲染器均展示 `Billing Period: Sep 7, 2026 – Oct 6, 2026` 与 `Installment: 2 of 6`，实际付款时间独立展示。缺少可信账期时新版显示“—”，不根据付款时间猜测。一次性付款隐藏账期和期号。

旧事件及旧输入不含版本字段时，保留原有 `Billing Cycle: Month X of N` 文案，不改写、不重发。样例文件是可重新生成的虚构演示素材，已更新为新版；更新样例不代表修改用户历史收据。逾期样例特意使用早于实付日期的原账期。

后台历史账单按原始开始日、总期数、期号及原计划日核对后补充账期；原计划信息缺失或冲突时显示“—”。新收据保存日期快照，后续邮件查看或投递重试不重新推算。
