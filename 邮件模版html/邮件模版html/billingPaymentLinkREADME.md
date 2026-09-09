# Billing Payment Link Email

Send Link 使用的英文付款邀请，沿用现有 Billing Payment Receipt 的 WizarPOS Logo、600px 白色卡片、灰色背景、Arial 和 Paywizard 页脚。标题为 **Your bill is ready**，按钮为 **View bill & pay**。付款成功后另发收据；此邮件不表示已收款。

## 文件与预览

- `billingPaymentLink.html`：HTML 模板，`${...}` 占位符须先经 renderer 替换。
- `renderBillingPaymentLink.py`：只渲染，不发送邮件；返回 subject / html / text。
- `billingPaymentLinkSamples.html`：四种场景入口；也可从项目首页 → 邮件模板 → 账单链接打开。
- `billingLink*Sample.json / .html / .txt / .subject.txt`：商户/独立用户 × 一次性/月付的输入、HTML、纯文本及主题。

样例使用 `billing.example.com` 演示地址，不对应真实账单，按钮不能用于实际付款。样例本地 Logo 仅供预览。

```sh
python3 邮件模版html/邮件模版html/renderBillingPaymentLink.py \
  邮件模版html/邮件模版html/billingLinkMerchantMonthlySample.json \
  /tmp/payment-link.html --preview
```

## 变量约定

| 输入 | 含义 |
| --- | --- |
| invoiceNumber | 必填；账单编号，对应 Billing Record 的 invoice |
| issuerName | 必填；发出账单的机构显示名，需和实际发件人匹配 |
| assignment | merchant 或 standalone；收件邮箱不改变账单归属 |
| merchantName | merchant 必填；standalone 无论是否传入都不展示 |
| description | 必填；费用项目名称 |
| amountDue | 必填；本次应付金额，含明确币种，如 CAD 39.90；不能传合同总额代替 |
| recurring | 必填布尔值 |
| monthlyAmount / installmentCount / contractTotal | 月付必填：每月金额、总期数、合同总额；金额由账单系统提供并格式化，模板不计算 |
| paymentUrl | 必填；当前账单的绝对 HTTPS 支付地址，保留完整 token/fragment |
| logoUrl | 正式渲染必填；公开 HTTPS 图片地址或 cid: 附件引用；不传则正式渲染报错 |
| linkExpiryDate | 可选，YYYY-MM-DD；不传则整个到期段落省略，不推断时间或时区 |
| includedData | 可选，已带单位的展示字符串，仅适用的账单传入 |
| notes | 可选；纯文本账单说明，自动 HTML 转义并保留换行 |

模板派生 preheader、detailRows、scheduleSection、notesSection 和 expirySection，不接收调用者提供的 HTML。统一以 Hello, 称呼，不从收件邮箱推测姓名。

月付用于初次付款/授权邀请：本期应付金额突出展示，每月金额、期数、合同总额分开列示；正文说明授权后按账单计划自动扣取剩余月付款项，付清所有约定期数后停止。单期合同不使用“剩余自动扣款”措辞。到期日期指支付链接到期，不是合同结束日期。

## 实际发送接入

本次交付为模板及渲染工具。当前 Send Link 仍是模拟投递，此变更没有接入邮件服务，也没有发出邮件。

后端应读取当前账单及付款资格，按既有 Send Link 规则排除已付清、已授权或链接失效等情况，再使用操作员填写的 Billing Link Recipient 邮箱发送。传入生产 HTTPS paymentUrl、真实 issuerName 和 HTTPS/CID logoUrl，调用 `render(data)`（不使用 `preview=True`），将返回的 subject、html、text 作为 UTF-8 multipart/alternative 邮件内容；CID 图片须同时作为内嵌附件提供。发件地址及 Reply-To 由邮件服务配置，此模板不虚构客服邮箱。

发送成功状态应由邮件服务结果决定，不能以模板渲染成功代替。模板的浏览器排版验证不等于 Outlook/Gmail/Apple Mail 收件箱兼容性验证。
