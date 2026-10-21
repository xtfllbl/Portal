# 开发者账号管理

维护平台 Developer Manage 的静态交互原型。账号、授权和凭证变更在浏览器本地演示，邮件仅记录模拟结果；本轮不修改生产后端或发送真实邮件。

## 已确认的改造（2026-10-21）

通过 grill-with-docs 两轮确认：新增、编辑均改为独立页面；一个开发者可关联多个服务商；每个服务商采用全部商户或指定商户两种互斥范围。用户已确认模式切换、移除服务商、Token 邮件和平台服务的边界，可实施原型改造。领域决策见 [ADR-0016](../adr/0016-developer-merchant-access-per-provider.md)。

本轮取代旧版“单服务商只读、新增编辑弹窗、创建时无条件绑定全部商户”的规则。

## 控件与选择入口优化（已确认）

同日后续评审已逐项确认以下方案，取代上一版相关控件与选择入口；授权及凭证规则不变。

- 服务商绑定列表提供明确的 Add 按钮，点击打开可浏览全部服务商的列表，取代当前多选下拉入口。沿用现有 Service Provider 列表的设计，考虑至少 50 个服务商时的搜索、分页与多选。
- Bind Merchant 的商户选择弹窗移除 MID、BINDING 两列。独立绑定主列表原本没有这两列，无需为此改动其业务字段。
- Webhook、IP 白名单与 Token 邮件的授权、回调及发送规则保持已确认含义；本轮重新选择控件组织方式。

- 视觉评审已选择第一版 Compact Aligned Rows，取代开关样式：回调与 IP 验证使用复选框，紧邻左侧业务名称，右侧统一对齐下划线输入。左列占 25% 且至少 220px、列间距 28px、内容最大宽度 1240px，沿用 Portal 紧凑字号，IP 地址使用圆角标签。
- 回调或 IP 验证关闭时，输入仍显示并禁用，保留内容，隐藏对应必填标记，维持行高与后续内容位置。
- IP 改为可逐项移除的标签输入：Enter、逗号、粘贴多个地址或移出输入时提交标签，逐项校验 IPv4 与重复项；无效输入保留并就地提示，保存时仍统一校验。
- Terminal、ECOMM Token 邮件偏好并排使用复选框。

数据核查与同步：`21.service_provider.html` 原有 8 条实际页面记录，现与开发者页面共用 `scripts/service-provider-catalog.js`，同步 Provider ID、名称与商户数量。保留原有 wizarpos、Northstar 演示目录及绑定 ID，添加列表合计 10 个服务商。原服务商页写死的分页总数不作为目录数据；50 个服务商仅用于容量验收。

同步的商户数量是服务商目录元数据，不代表已导入其商户明细。原型未虚构这些服务商的子商户，授权清单与已授权数量仅按本地已有商户记录计算。MID 仅从商户候选弹窗移除，平台候选仍保留 BINDING。

## 新增与编辑页面

入口为 `50.developer_form.html`，编辑通过 `client` 标识账号。参考 Add Payment Channel：共享 Maintain 侧栏与顶栏、标题前 40px 返回箭头、外层内容卡及内部表单面板、下划线输入、底部 Cancel 与保存操作。

页面顺序：

1. Basic Information：Developer Name、Email、Company Name、Phone Number、Address。
2. Webhooks：Transaction results、Automatic settlements，各自独立复选框与 Callback URL。
3. IP Allowlist：Verify request IP 与 IP Addresses 为同组配置。
4. New Merchant Token Emails：Terminal token 与 ECOMM token 独立复选框。
5. Service Providers：置于底部的服务商绑定列表。

Developer Name、Email、至少一个服务商必填；名称与 Email 创建时分别查重，编辑时只读。其余原有基础资料字段不增加业务限制。服务商可在编辑时添加或移除。

两个 Webhook 复选框默认未选、Token 邮件复选框默认未选；Verify request IP 沿用默认勾选。各项配置均在保存后生效。保存成功返回开发者列表并保留列表筛选、分页及滚动上下文；指定商户通过原有 Bind Merchant 入口继续配置。未保存修改离页时保留项目的放弃修改确认；保存失败保留全部输入并滚动、聚焦可见错误。

## 服务商与商户授权

服务商绑定表右上角提供 Add，打开 Add Service Providers 列表弹窗，列为勾选框、Provider ID、SP Name、Merchants。支持按 ID／名称搜索、分页、多选、跨筛选与跨页保留；按最新评审移除 Selected、Clear selection 和已选标签工具区，通过表格复选框取消选择。已添加或未启用服务商禁选，全选跳过不可选项。Add Selected 确认后才加入表单底部列表，取消不改变表单；账号页面保存后才生效。下方绑定表展示服务商、All Merchants (Existing & New)、已授权商户数量、移除操作；移除按钮使用红色垃圾桶图标。新加入服务商默认勾选全部商户，用户可取消。

| 模式 | 现有商户 | 未来新增商户 | Bind Merchant |
| --- | --- | --- | --- |
| 全部商户 | 包含该服务商下全部启用商户，含下级代理商商户 | 自动纳入 | 展示授权，不能逐个解绑 |
| 指定商户 | 仅保留已绑定商户或人工选择商户 | 不自动纳入 | 支持人工绑定、解绑 |

不提供“部分现有商户 + 自动绑定未来新增商户”的组合，不增加独立的新增商户开关。

- 创建时选择指定商户，可暂时为零个商户；先保存服务商配置，再到 Bind Merchant 选择。
- 全部 → 指定：保留切换时当前已授权商户的清单，停止自动纳入未来新增商户；之后可在 Bind Merchant 删减。
- 指定 → 全部：纳入全部现有启用商户及未来新增商户，不自动补发已有商户 Token 邮件。
- 移除服务商：保存前列明服务商名称、受影响商户数量和授权后果；确认保存后撤销该开发者在该服务商下的商户、服务商及代理商绑定，停止其商户后续访问、回调和自动 Token 邮件。共享 Token、其他开发者绑定及历史邮件记录保留。
- 同一商户、服务商或代理商仍可绑定多个开发者，不构成独占冲突。
- 旧版账号按原有商户绑定迁移为指定商户模式，保留凭证、白名单、地址及历史记录，不推断或扩大全量授权。

选择服务商时，仍提供原有的服务商／代理商级服务，初次关联时绑定该服务商及其现有启用代理商。它与商户授权分开表达；不把 Platform Token 解释为商户交易 Token，也不推断未来新代理商自动绑定。

## Bind Merchant 与 Bind Plat

两者保留独立页面和绑定弹窗。绑定页面与候选弹窗增加可搜索服务商筛选，限于开发者已关联的服务商。每行按对象实际所属服务商展示名称，不能用账号的单个服务商名称填充。

Bind Merchant 页面展示 Paywizard ID、Service Provider、Merchant Name、Access、Create Time、Actions。标题后的开发者名称与标题文字基线对齐；移除绑定页的编辑开发者齿轮入口，账号列表的编辑操作保留。绑定按钮恢复原前端的绿色描边、文件加号图标和 Bind Merchant 文案。全部商户行仅提供 Token 操作入口，不能通过逐行解绑制造排除名单；若所有服务商都是全部模式，Bind Merchant 按钮禁用并解释原因。

商户绑定弹窗仅保留勾选框、Paywizard ID、Service Provider、Merchant Name，移除 MID、BINDING。全部模式授权商户与已绑定商户显示勾选且禁用，保留悬停说明；不能在此编辑或取消这些绑定，全选及取消全选均不改变锁定项。其他开发者的绑定不禁选，不再展示其关联数量和开发者名称。按最新评审移除 Selected 数量、Clear selection 与已选标签区；新选择通过行复选框取消，跨服务商筛选、搜索和分页保留。提交集合仅包含本次新增商户，再次验证当前范围与重复绑定；已绑定项不重复提交。

Bind Plat 候选扩展至已关联多个服务商及其启用代理商；保留每次单选、可累计绑定、单独解绑平台关系的流程。普通平台解绑不级联商户；在账号表单移除服务商则按上文撤销整个服务商范围。

## Webhooks

交易结果和终端自动结算回调各自使用开发者级的统一地址，覆盖该开发者实际授权的商户，多个服务商共用。

- 对应地址始终显示，开启回调时可编辑并必填；地址校验为有效 HTTP / HTTPS URL。
- 关闭时不再启用该回调，地址禁用但内容保留以便重新开启；关闭状态不因保留的 URL 阻止保存。
- Settle URL 指终端自动结算信息，不表达商户资金打款。
- 原型只配置回调，不进行真实投递或提供回调日志、重试、事件订阅等额外功能。

## Token 邮件与凭证

Terminal、ECOMM 是开发者级的两个独立邮件偏好，通过复选框表达，适用于其关联的所有服务商。

- 仅在商户新建且该开发者实际自动获得其授权时，按对应开关模拟发送 Token 邮件。
- 指定商户模式不会收到服务商其他新增商户的 Token。
- 人工绑定已有商户、切换全部／指定模式、开启邮件开关均不补发；原有 Send 可手动发送。
- 创建开发者仍生成 Client ID / Client Secret，并模拟发送凭证邮件。
- Resend Email 不更换 Client Secret；Reset Secret 更换密钥并模拟发送新凭证。
- Merchant Token 的 Terminal、ECOMM 类型分开，Platform Token 属于服务商或代理商。相同对象、相同类型 Token 跨开发者共享；Reset 影响所有使用者，不自动邮件；Send 发给开发者已保存 Email。
- Secret 与 Token 默认遮蔽中间字符，保留首尾各四位，支持显隐。

原型观察到新商户记录时，只为全部模式开发者补充绑定并记录允许的模拟邮件，同一商户不重复触发。无商户创建演示开关，不扩展商户创建页面。此本地逻辑不证明生产新增商户事件、鉴权或邮件系统已支持这些规则。

## IP 白名单

沿用已确认规则：只接受有效 IPv4，禁止重复；账号表单以可移除标签展示地址并支持粘贴多个地址，独立 Allowlist 页逐条管理。开启验证时至少一个地址，删除最后一项会提示先到编辑页关闭验证；关闭后保留并禁用标签及输入，独立页仍可管理并允许删空。两个入口读取和保存同一地址列表。

## 组件与验收

操作成功和一般信息使用右上角 Toast，不占据列表上方空间。参考指定 `paywizard-portal` 项目的 `src/components/GlobalToast.vue`、`src/utils/toast.ts` 与 Aura Noir 主题：距离顶部、右侧各 20px，包含状态图标、标题、详情和关闭按钮，默认 3 秒消失。悬停暂停，移出 200ms 后重新计时；原型同时支持键盘聚焦暂停。保存失败、字段校验等需处理的错误仍就地展示并聚焦，不因自动消失而丢失处理入口。原型以静态实现复现交互，不引入 Vue。

参考 PrimeVue v4 的 InputText、ToggleSwitch、Checkbox、MultiSelect、Select、DataTable、Paginator、Dialog、ConfirmDialog、Message 模式，使用本项目静态控件，不安装框架。服务商添加弹窗是 Dialog + DataTable + Checkbox + Paginator 的组合，授权范围、数量和移除后果属于业务扩展；IP 标签输入参考 AutoComplete 多值输入模式，不提供建议目录或限定已有值，IPv4 校验为业务扩展。

本轮读取了 [Select 官方交互说明](https://v4.primevue.org/select)。ToggleSwitch、Checkbox、AutoComplete、DataTable 官方完整页面访问受限，沿用已有静态选择器、表格与原生勾选/开关，按实际浏览器验证，不宣称已核验对应研发组件的全部 API。

紧凑表头 34px / 11px，表单按钮 40px，行操作 36px，统一 Material Symbols Rounded。添加服务商使用浏览器顶层模态列表；筛选和分页下拉仍采用顶层浮层，支持搜索、键盘及独立滚动，避免被表单或弹窗裁切。页面只验收桌面。

回归覆盖：新建／编辑路由、下划线控件、多服务商不同范围、绑定候选限制与跨筛选保留、模式切换、移除确认及凭证保留、新商户模拟事件和邮件边界、旧数据迁移、Webhook 校验、白名单同步、未保存保护、保存失败保留与错误定位、共享 Token、无效路由及较矮桌面视口。实际页面视觉检查与自动测试分别记录。

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

源码描述的是旧版单服务商实现；本轮原型以本文的多服务商规则为准，不能把原型结果当成后端已支持新规则的证据。
