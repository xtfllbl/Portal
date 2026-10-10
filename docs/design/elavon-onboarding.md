# Elavon EU onboarding 表单修改规格

2026-10-10 用户确认并实施。沿用静态 HTML/CSS/JavaScript；内部填写、公开填写、审核和查看均复用 `27.Merchant_onboard_elavon.html`，保持六个板块。

## 确认规则

| 位置 | 新增内容 | 规则 |
| --- | --- | --- |
| Business Information | Company Registration No. | 必填，独立于 VAT ID/TAX Identification Number |
| Business Information | Company Registration Address | 必填，公司注册地址 |
| Business Information | Company Registration Date | 必填，普通文本输入，手动填写；不限制格式或未来日期 |
| Business Information | Business Registration / Tax Certificate (within 3 years) | 必填，注册证明或税务证明任选一种；文件须在最近三年内签发，作为资料说明供审核，不增加日期字段或自动识别 |
| Signatory | Signatory Residential Address、Zip Code、City | 三项均必填，邮编允许字母和数字 |
| Additional Owner/s | Full Residential Address | 每个 additional owner 卡片必填；不扩展主 owner 卡片 |

## 文件交互

证书、Passport、2nd KYC、Bank Transfer Receipt 四项均支持多文件，**每项 1–10 个**，格式为 PDF/JPG/JPEG/PNG。浏览选择与拖放均追加文件，展示文件清单并允许逐项删除。超出数量或格式错误时拒绝本次选择、保留已有文件、显示并定位错误；最后一个文件移除后恢复必填校验。

保留护照有效且清晰、2nd KYC 最近三个月住宅地址证明、银行转账收据最近三个月且金额可为零的原有说明。审核、查看以及已提交申请继续遵守现有只读与退回板块规则。

内部直接草稿保存文字与选择；公开申请保存文件名、格式和大小，并支持恢复后追加和删除。保持原型边界，不上传真实文件内容到服务器。旧申请不自动填充新增字段；可编辑板块提交时执行新增校验。

## 组件及复用

先阅读 `docs/design/ui-standard.md`，复用现有字段网格、文本框、上传卡片、动态 owner 模板及 Portal 外壳。新增日期使用标准文本输入；文件区域由上传卡片、文件清单与逐项移除组成。保存和提交按钮为 40px，移除按钮为 36px，使用 Material Symbols Rounded。

Nuvei 与 Elavon 共用 `scripts/merchant-onboarding-uploads.js`、`styles/merchant-onboarding-uploads.css` 和已有 Store 文件数组接口；Nuvei 已确认业务规则保持一致。编辑区域去掉板块副标题。

PrimeVue v4 InputText/FileUpload 官方文档访问未成功，本次采用已验证的原生输入与既有 Nuvei 交互，不声称已核验组件 API。此为可逆表单调整，不创建 ADR。

## 验证

- Elavon、Nuvei 和共享 onboarding 流程本轮 42 项测试通过，覆盖新增字段、手填日期、四项上传限制、超限保留、草稿恢复、公开提交错误定位、审核查看只读和退回重提。
- 运行时排除上一轮已在旧版本确认的两项无关失败：申请创建页面包屑文案、Add Store 的支付配置提示文案。
- 已打开具体 Elavon 桌面页面检查公司注册信息、Signatory、Additional Owner 地址与上传布局。截图保存在 `artifacts/elavon-business-2026-10-10.png`、`artifacts/elavon-additional-owner-2026-10-10.png`、`artifacts/elavon-signatory-2026-10-10.png`。
- 静态构建、共享上传脚本语法与 `git diff --check` 通过。
