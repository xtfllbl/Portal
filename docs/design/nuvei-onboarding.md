# Nuvei onboarding 表单修改规格

2026-10-10 用户确认。适用内部填写、公开填写、审核与查看页面；保持静态 HTML/CSS/JavaScript 原型，其他渠道表单不调整。

## 字段与板块

| 位置 | 内容 | 规则 |
| --- | --- | --- |
| 5. Terminal & Vending Machine Information | Terminal type | 每份申请选择一次 Attended 或 Unattended；必填、互斥、不预选 |
| 4. Banking Information | Detailed address of where all the vending machines will be placed | 必填多行文本；包含所有安装或运营地点的详细地址及各地点机器数量；使用用户截图说明 |
| 4. Banking Information | Proof of Inventory | 独立必填上传；说明沿用截图：发票、收据、购买协议或其他售货机购买凭证 |
| 4. Banking Information | Proof of Purchase | 独立必填上传；不增加未提供的说明；允许与 Inventory 分别提交同一凭证 |
| 4. Banking Information | Business Location Lease | 必填上传；保留截图要求：地点明确、双方签署、有效且清晰 |
| 6. Supporting Documents | Void Check / Bank Letter | 替换原 Void Check 标签；保持同一上传项，任意一种即可，也可同时提供 |
| 7. Additional Supporting Documents | 补充说明文件 | 新增选填多文件上传，不增加文字输入字段；提交操作放在表单末尾 |

新增地址与三项证明在 **所有 Terminal type 下均展示且必填**，与 Attended / Unattended 无条件关系。旧记录不会自动生成新地址或凭证；可编辑字段执行当前必填规则，已有审核锁定规则沿用。

## 所有 Nuvei 上传项

- 七个上传项均支持多选、拖放、再次选择追加、文件清单与逐项移除。
- 每项最多 **10 个文件**；必填项至少一个。数量超限或格式不支持时拒绝整批新增文件，保留已有选择，显示并聚焦明确错误；通过减少选择或移除文件后重试。
- 机器照片沿用 JPG/JPEG/PNG/HEIC；原银行证明、驾驶证沿用 PDF/JPG/JPEG/PNG；新增证明及第七板块使用 PDF/JPG/JPEG/PNG。
- 不新增文件大小限制。已保存的附件名称计入 10 个上限；保存后的逐项删除及清空必须体现在记录中。
- 审核、查看、已提交锁定及退回后未解锁的已通过板块，文件只能查看清单，不能追加或移除。
- 第七板块纳入导航、审核记录及逐板块审核，选填附件不改变逐板块审核流程。

## 原型数据与组件映射

内部直接填写页的原有草稿只保存文本和选择，附件不跨刷新保留；公开申请沿用应用记录保存文件名、格式与大小，并在审核和查看中回显。没有新增真实文件存储、下载或渠道提交接口。

Terminal type 采用 RadioButton 模式，地址采用 Textarea 模式；多文件区域组合文件选择、清单、移除按钮与就地错误提示。参考入口为 PrimeVue v4 [RadioButton](https://v4.primevue.org/radiobutton/)、[Textarea](https://v4.primevue.org/textarea/)、[FileUpload](https://v4.primevue.org/fileupload/)；本轮官方页面读取失败，沿用项目已验证的原生单选、文本域、上传卡片与 Material Symbols Rounded 图标，不宣称已核实 v4 组件 API。

新增上传逻辑只在 Nuvei 表单初始化；共享 Store 通过可选上传控制器读取或恢复完整清单，其他渠道沿用原有行为。错误定位同时覆盖内部页面及公开页面 iframe 的外层滚动容器。此次为可逆的表单调整，无需单独 ADR。

## 验收记录

- 桌面 Chrome 打开 `27.Merchant_onboard_nuvei.html`，核查新增地址、三项证明说明、互斥类型、第七板块、导航高亮与 40px 等高操作按钮。
- Nuvei 专项及七板块审核检查：13 项通过，包括多次追加达到 10 个、拒绝第 11 个、格式错误保留选择、拖放、逐项删除、删除已回显必填附件后的校验、公开申请保存与刷新、审核/查看只读、公开 iframe 错误定位与提交。
- 首轮 Nuvei / Elavon / onboarding 组合回归：36 项通过，2 项失败。失败项为创建申请页面 breadcrumb 文案（`tests/merchant-onboarding.spec.js:156`）和 Add Store 终端支付说明文案（当时行 640）。在未修改的 HEAD `85a5807` 上分别复现同样失败，不属于此次表单修改。
- 静态构建、脚本语法、`git diff --check` 通过。截图位于 `artifacts/nuvei-banking-2026-10-10.png`、`artifacts/nuvei-supporting-documents-2026-10-10.png`、`artifacts/nuvei-upload-limit-2026-10-10.png`。
