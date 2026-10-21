# 开发者账号管理复刻说明

将运维平台 Developer Manage 的完整可见流程复刻到当前 Portal 的 MAINTAIN 菜单，使用当前 Portal 样式与静态 HTML/CSS/JavaScript 架构。账号、绑定与凭证变更在浏览器本地演示；邮件发送仅提供模拟结果，不请求运维生产接口。

## 已确认范围

2026-10-21 确认包含列表、Email 搜索、分页、密钥显隐、新增、编辑、Resend Email、Reset Secret、Bind Merchant、Bind Plat、Allowlist，以及绑定页进入的商户和平台 Token 页面。

- 列表列为 Client ID、Developer Name、Email、Date & Time、Created By、Client Secret、Actions。Email 按源码精确匹配；默认每页 20 条。
- 新增字段为 Developer Name、Email、Company Name、Phone Number、Address、Service Provider、Notify URL、Settle URL、Verify Allowlist、IP、Terminal 自动发送新商户 Token 邮件、ECOMM 自动发送新商户 Token 邮件。
- Developer Name、Email、Service Provider 必填，创建后在编辑时只读。Developer Name 和 Email 创建时分别检查重复。
- Verify Allowlist 默认 Yes；两种自动发送 Token 邮件选项默认 No。关闭验证时隐藏 IP 输入，保留已保存地址。
- Client Secret 和 Token 默认遮蔽中间字符，保留首尾各四位，可切换显隐。
- 不增加删除开发者、状态开关或源码中未启用的操作。

## 绑定与凭证规则

| 场景 | 复刻行为 |
| --- | --- |
| 创建开发者 | 生成 Client ID、Client Secret；自动绑定所选 Service Provider 及其现有启用的代理商、商户；模拟发送凭证邮件。 |
| Bind Merchant | 独立子页，按 Paywizard ID、Merchant Name 搜索和分页；绑定弹窗支持多选。候选仅来自当前开发者所属 Service Provider 的启用商户。 |
| Bind Plat | Plat 指 Service Provider 或 Agent。独立子页，按 Plat ID、Plat Name 搜索；每次单选一个，可累计绑定多个。候选为所属启用 Service Provider 及其启用代理商。 |
| 绑定关系 | 当前开发者已有绑定不重复提交。同一对象可绑定多个开发者，其他开发者的绑定不构成独占冲突。 |
| Unbind | 确认后仅移除当前开发者与该对象的关系，不级联解绑，也不删除共享 Token。 |
| 商户 Token | 展示 Paywizard ID、ECOMM Token、Terminal Token；分别支持显隐、Reset、Send。 |
| 平台 Token | 展示 Plat ID 及其 Token，支持显隐、Reset、Send。 |
| Token Reset | 同一对象和类型的 Token 跨开发者共享；确认文案明确影响所有使用者。重置更新共享值，不自动发送邮件。 |
| Token Send | 确认后模拟将当前 Token 发送给所选开发者已保存的 Email。 |
| Resend Email | 确认后模拟重发当前 Client ID 和 Client Secret，不更换密钥。 |
| Reset Secret | 确认后更换当前开发者的 Client Secret，并模拟向其 Email 发送新凭证。 |

两种 Auto Send 选项表示新商户流程中的邮件偏好，不解释为人工绑定时自动发送邮件。本次不扩展商户创建页面或增加邮件配置流程。

## 已确认的白名单差异处理

2026-10-21 确认统一新增/编辑与独立 Allowlist 页的规则：

- 仅接受有效 IPv4，禁止重复；新增/编辑允许逗号分隔多地址，独立 Allowlist 页逐条添加。
- 启用 Verify Allowlist 时至少保留一个地址。删除最后一项时阻止操作，提示先到编辑页关闭验证。
- 关闭验证后保留地址，仍可在 Allowlist 页管理，允许删空。
- 两个入口读取和保存同一份地址列表；保存失败保留输入和原有已保存状态。

这是本次明确选择的行为调整。原源码的独立 Allowlist 页仅检查非空且允许删空；后端启用验证时保存空列表会使所有调用 IP 不匹配。

## 页面与交互

- 使用共享 Portal 顶栏、侧栏和 MAINTAIN 导航；Developer Manage 仅在当前 MAINTAIN 适用的运维展示身份下开放。
- 以 Payment Channel 的内容卡、搜索栏与分页为基线；黑色表头高 34px、字号 11px，行操作高 36px，表单按钮高 40px；图标统一 Material Symbols Rounded。
- 新增/编辑采用弹窗，固定头尾、内容内部滚动。绑定、白名单和 Token 保留独立子页，标题前使用统一返回按钮，返回时保留上级筛选和分页。
- 选择器支持点选、输入搜索、键盘、独立滚动和视口边缘定位；绑定候选支持分页和每页数量切换，多选保留跨搜索、跨页选择，并可集中查看和逐项取消。
- 校验错误在实际滚动容器内定位并聚焦，保留输入；保存期间避免重复提交。取消未保存修改时沿用项目保护交互。
- 组件参考 PrimeVue v4 的 DataTable、Paginator、Dialog、ConfirmDialog、Select、MultiSelect、Menu 和 Message 模式；使用既有静态组件实现，不引入框架。
- 使用虚构演示数据和演示凭证，不从截图或源码配置提取真实密钥。

本次已核查 [Select](https://v4.primevue.org/select/)、[Dialog](https://v4.primevue.org/dialog/)、[ConfirmDialog](https://v4.primevue.org/confirmdialog/)、[Paginator](https://v4.primevue.org/paginator/) 官方说明。DataTable、MultiSelect、Menu 的官方页面本次未能读取，沿用项目已有静态实现及其键盘交互，并完成相关回归；不宣称已核验研发组件的全部 API。

## 验收

在桌面浏览器逐页检查列表、新增/编辑、全部更多菜单、绑定选择与解绑、商户/平台 Token 显隐重置发送、白名单两入口同步，以及导航返回。覆盖空结果、重复账号、非法/重复 IP、删除最后一条 IP、取消确认、搜索后保留多选、键盘操作、弹层不被裁切和错误滚动聚焦。

构建及针对性测试与实际页面视觉验收分别记录。本地演示结果不代表真实邮件、生产鉴权或真实凭证已变更。

## 源码依据

运维前端根目录：`/Users/beaver/Paywizard/代码/paywizard/paywizard-maintain`。

- `src/views/oam/cm/index.vue`：列表、主表单、默认值、编辑限制及更多菜单。
- `src/views/oam/cm/bindMerchant.vue`、`bindPlat.vue`：绑定列表、选择和解绑。
- `src/views/oam/cm/merchantToken.vue`、`platToken.vue`、`clientSecretInfo.vue`：Token 操作与遮蔽。
- `src/views/oam/cm/allowlist.vue`：独立白名单入口。
- `src/apis/oam.ts`：对应 API 路由。

后端根目录：`/Users/beaver/Paywizard/代码/paywizard/server`。

- `ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/controller/SysClientDefController.java`：创建自动绑定、凭证邮件、重发与重置。
- `ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/service/impl/SysClientDefServiceImpl.java`：创建唯一性、所属服务商候选范围、白名单保存。
- `ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/service/impl/OpenClientPlatServiceImpl.java`：多开发者关系、自动绑定和非级联解绑。
- `ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/service/impl/SysPlatTokenServiceImpl.java`：共享 Token、重置和绑定验证。
- `ovstrade-openapi/src/main/resources/mapper/SysClientDefMapper.xml`：候选所属范围、启用条件及当前关系排除。
- `ovstrade-openapi/src/main/java/cn/wizarovs/cloud/open/aspect/OpenTokenVerifyV2Aspect.java`：启用验证且空白名单时拒绝请求。

本次为可逆的原型复刻与明确的校验统一，不新增架构决策记录。
