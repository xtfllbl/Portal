# Billing Payment Link Email

Send Link 使用的英文付款邀请，与 Billing Payment Receipt 统一使用 **Paywizard | wizarPOS** 品牌区、600px 白色卡片、灰色背景、Arial 和 Paywizard 页脚。Paywizard 图片复用 customerAlert.html 等现有邮件的官方图片地址，右侧保留 wizarPOS 图片；两张图片均提供替代文本。首次出账标题及主题为 **Your Bill Is Ready**，主按钮为 **View Bill & Pay**。商户账单在主按钮后提供等高的描边按钮 **Access Merchant Portal**，正文说明两种入口均可查看并支付同一账单，直接支付无需登录；两个入口均提供可复制 URL。独立账单仅显示直接支付入口，不出现商户门户链接。付款成功后另发收据；此邮件不表示已收款。

## 文件与预览

- `billingPaymentLink.html`：HTML 模板，`${...}` 占位符须先经 renderer 替换。
- `renderBillingPaymentLink.py`：只渲染，不发送邮件；返回 subject / html / text。
- `billingPaymentLinkSamples.html`：四种场景入口；也可从项目首页 → 邮件模板 → 账单链接打开。
- `billingLink*Sample.json / .html / .txt / .subject.txt`：商户/独立用户 × 一次性/月付的输入、HTML、纯文本及主题。

样例使用 `billing.example.com` 与 `portal.example.com` 演示地址，不对应真实账单，按钮不能用于实际付款。样例本地 Logo 仅供预览。

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
| portalUrl | merchant 必填；当前环境的绝对 HTTPS 商户门户地址；standalone 忽略，不展示 |
| logoUrl | 正式渲染必填；wizarPOS 图片的公开 HTTPS 地址或 cid: 附件引用；不传则正式渲染报错 |
| linkExpiryDate | 可选，YYYY-MM-DD；不传则整个到期段落省略，不推断时间或时区 |
| includedData | 可选，已带单位的展示字符串，仅适用的账单传入 |
| notes | 可选；纯文本账单说明，自动 HTML 转义并保留换行 |

模板派生 preheader、invitationText、detailRows、scheduleSection、notesSection、expirySection、portalAction 和 portalFallback，不接收调用者提供的 HTML。统一以 Hello, 称呼，不从收件邮箱推测姓名。

月付用于初次付款/授权邀请：本期应付金额突出展示，每月金额、期数、合同总额分开列示；正文说明授权后按账单计划自动扣取剩余月付款项，付清所有约定期数后停止。单期合同不使用“剩余自动扣款”措辞。到期日期指支付链接到期，不是合同结束日期。

## 实际发送接入

本次交付为模板及渲染工具。当前 Send Link 仍是模拟投递，此变更没有接入邮件服务，也没有发出邮件。

后端应读取当前账单及付款资格，按既有 Send Link 规则排除已付清、已授权或链接失效等情况，再使用操作员填写的 Billing Link Recipient 邮箱发送。传入生产 HTTPS paymentUrl、商户邮件的 HTTPS portalUrl、真实 issuerName 和 HTTPS/CID logoUrl，调用 `render(data)`（不使用 `preview=True`），将返回的 subject、html、text 作为 UTF-8 multipart/alternative 邮件内容；CID 图片须同时作为内嵌附件提供。发件地址及 Reply-To 由邮件服务配置，此模板不虚构客服邮箱。

发送成功状态应由邮件服务结果决定，不能以模板渲染成功代替。模板的浏览器排版验证不等于 Outlook/Gmail/Apple Mail 收件箱兼容性验证。

## 本轮确认（2026-09-09）

保留现有卡片布局；首次出账使用出账标题，不使用催付标题。英文标题、按钮和字段标签统一大小写。四种通知、HTML/纯文本/主题及六种收据样例同步维护。链接到期只描述直接支付链接的有效期，不推断门户支付资格。

## 本轮验证

四种通知与六种收据均通过 800px / 390px 浏览器检查：无横向溢出、品牌图片加载正常；商户邮件两个按钮在两个宽度下均为 54px 高。通知渲染检查覆盖商户门户地址必填、拒绝非 HTTPS 地址、独立账单不展示门户，以及 HTML/纯文本/主题同步。`npm run build` 与 `git diff --check` 通过。尚未进行真实邮件客户端投递测试。

母版直接打开时，wizarPOS 图片使用同目录 `billingReceiptLogo.png`，避免将未替换的变量作为图片 URL。渲染器在生成邮件时仍按 `logoUrl` 替换为指定 HTTPS/CID 地址。Paywizard 图片与 `customerAlert.html` 的图片来源保持一致。

Logo 修正复验：从首页邮件目录分别选择账单链接母版和收据母版，两张图片均成功加载；两份母版及十份样例在 800px / 390px 共 24 项浏览器检查通过，包含两张品牌图片加载、无横向溢出和操作按钮等高。正式渲染的 `logoUrl` CID 覆盖检查通过。
