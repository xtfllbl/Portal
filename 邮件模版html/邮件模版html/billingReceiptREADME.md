# 支付成功收据邮件

入口：`billingReceiptSamples.html`。通用模板：`billingPaymentReceipt.html`。六份 Sample HTML 可直接在浏览器或 Live Server 打开；同名 JSON 是渲染输入示例。

## 已确认规则

- 参考 Spark 对话 19977 的 Receipt 信息结构；保留金额、付款日期、费用描述、备注、卡种尾号和 Invoice。视觉以 Spark 中邮件 19977 的实际呈现为准：Paywizard | wizarPOS 左上标识、桌面右上 RECEIPT（手机端移至品牌下方）、居中金额、Description/Amount 双列、蓝色期数、浅黄虚线备注及左右排列的付款方式与 Invoice。标识复用本地既有邮件资料 `../邮件HTML/HTML文件/wizarpos-logo.png` 的黑蓝色 WizarPOS 图片，与现有邮件使用的 Paywizard 官方 Logo 图片组成统一品牌区，覆盖全部六种收据场景。预览使用同目录 `billingReceiptLogo.png`；正式发送必须通过 `logoUrl` 指定 wizarPOS 图片的托管 HTTPS 地址或 CID 内嵌附件地址。
- 一次性成功付款、分期首期、后续自动扣款、最后一期均生成收据。每封对应一次成功支付；失败不生成成功收据。逾期逐期补扣也各自生成。
- 商户与独立账单统一发送至付款人在 checkout 填写的邮箱；后续分期使用授权时保存的付款邮箱。不是 Send Link 的收件人，也不默认取商户账户邮箱。
- 独立支付省略整个商户信息行，不留空标签，无登录按钮。
- 显示本次成功实付金额，不把合同总金额当成本次支付额。付款时间必须包含明确时区。
- Fixed-term monthly 显示本次期数及总期数；仍有逾期款时提示逐期收取，否则显示后端提供的下一扣款金额和日期。全部期数已付清时提示结束，不再显示下一扣款。
- 不沿用旧邮件的 Monthly Subscription 或不明确的服务覆盖日期范围，不自行推算下一付款日期。
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
