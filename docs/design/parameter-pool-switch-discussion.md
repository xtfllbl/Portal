# 商户自有参数切换：设计讨论

2026-10-16。依据用户指定的 grill-with-docs 讨论；本文件记录已确认规则及实现前核查；切换原型现已接入，验收见文末。

## 已确认的业务边界

- 运维沿用现有商户／门店／终端流程，商户不需要重新开户或更换商户、门店、TCI。
- 参数集没有独立版本概念，Payment App Version 为原页面独立的部署字段。
- 资源阶段结束后，该次使用的历史交易保留归属并禁止商户发起后续交易；商户自有参数用于之后的新交易。
- 使用结束不等于资源立即可再分配。先进入待出账，人工确认出账完成后才恢复可用。
- 财务查看统计、明细和导出，不在本功能中计算手续费、分润或执行付款。

## 实现前的代码事实（历史基线）

- 已有路径为 Merchant → Store → Devices → Settings → Edit Params → Device Settings → Processor Parameters。
- `5.merchant_device_settings_iso.html` 有原参数表单及 Redeploy Parameters / Confirm Deploy，但未加载资源池绑定或提供来源切换。
- 现有 Confirm Deploy 只展示部署请求提示，没有真实生效回执；也没有用于切换的在线／交易空闲检测、暂停受理或失败重试能力。
- 编辑页目前以 schema 默认值生成参数控件，不能视为设备实际配置；尚未按 TCI 加载已存完整参数。NUVEI UPT 的 MID／TID 和商户资料默认空，国家／币种默认 124；密钥索引和终端操作密码是模板字段，不能将其误称为 API Key 或商户密钥。
- `parameter-pool-store.js` 提供分配与确认出账，未实现使用中到待出账的状态转换。
- 新增资源终端当前只保存资源使用关系，没有将新终端回写商户 Devices 列表；动态商户的 Edit Params 跳转也需补齐 TCI／商户上下文。

## 已接受决策：第一轮

用户已回复“ok”，确认下列两点：

1. 在原 Edit Params 页的 Processor Parameters 内增加“切换为商户参数”，复用原参数表单和 Redeploy Parameters 提交入口，商户、门店、TCI 和设备绑定保持不变。
2. 以终端确认新参数已生效作为切换完成边界。只保存或发出下发请求不结束旧使用记录；设备离线或下发失败时保持旧使用中记录。切换成功后结束旧使用、冻结其交易后续操作并进入待出账；财务确认出账后才释放资源。

生效边界记入 ADR 0015。入口位置属于可逆 UI 选择，不另建 ADR。

## 已接受决策：第二轮

2026-10-16 用户回复“3.ok”，并明确第 4 点“无所谓在不在线，这个由我们人工判断”。

3. 新商户参数使用 NUVEI UPT 模板默认值作为录入起点，57 个原字段全部可编辑，MID／TID 及商户资料重新填写。取消切换恢复原资源参数和占用；取消下发确认保留本次输入。
4. 在线、离线及交易忙闲不作为自动判断或提交拦截条件。运维人工选择下发时机，不增加在线检测、自动暂停或空闲探测。此决定不改变第一轮的完成边界：下发请求与参数生效回执是两个事件。

## 本次原型接入

- 在原 Device Settings 的 Processor Parameters 内显示 Parameter Source／参数集和 Switch to Merchant Parameters，沿用 Redeploy Parameters 确认框。
- 新增资源终端保存后进入对应商户门店的 Devices 列表；静态示例商户和新建商户入口均携带完整商户／门店／TCI 上下文，返回页保留商户。
- 提交只创建待确认请求，原使用继续有效；模拟生效回执后更换终端参数并将旧使用置为 Awaiting Settlement。确认出账仍是独立动作。
- 旧交易按 usageId + merchantId + storeId + TCI 保留归属，参数集循环使用不修改旧记录。
- 仅静态原型：本地存储＋模拟成功回执，没有真实终端／Nuvei 连接，也没有生产交易 API 的冻结与权限实现。失败回执的状态保留由单元测试验证，页面不新增演示状态开关。

验证记录：[parameter-switch-2026-10-16](../validation/parameter-switch-2026-10-16/README.md)。


## 切换前确认与来源信息强调（2026-10-16）

用户明确要求移除左侧原说明及 View usage record，将 Parameter Source／Parameter Pool／参数集名称这一行放大；Switch to Merchant Parameters 点击后先确认已取得正式参数，再开放修改。

设计树本轮已由明确指令和此前决策闭合：

- 来源信息：三个文本均为 16px，Parameter Pool 加粗；删除静态提示和本页使用记录链接，记录仍从 Maintain → Parameter Pool 查询。
- 前置确认：Have you received the merchant’s official payment parameters? 操作为 Cancel／Yes, Continue Editing。确认才初始化模板默认值并开放编辑；取消、Esc 或关闭弹窗保持原配置及占用。
- 结算提示：弹窗说明新参数提交并生效后，原参数集进入 Awaiting Settlement，确认出账后才可复用。沿用此前已确认的生效边界，不将确认已取得参数解释为立即结束使用。
- 不增加在线／空闲判断。无 SN 时的 Save Configuration 属于原有未绑定配置场景，未在本次 UI 调整中更改绑定规则。

本轮是既有定义下的交互呈现调整，没有新增领域术语或架构权衡，不另增 glossary 条目或 ADR。


## 来源标识只在资源池表单显示（2026-10-16，最新修订）

用户确认 16px 并列来源文案不符合页面风格，并要求进入商户参数编辑后不再显示整块来源内容。本节替代上一轮的来源行视觉规格。

- 资源池表单：浅灰背景和细边框的紧凑横条，左侧为配置图标＋Preconfigured Parameters 状态标识（12px）和参数集名称（13px），右侧保持切换按钮。明确正在使用预配置参数，复用页面状态 chip 和表单配色；不再显示 Parameter Source／Parameter Pool 三段大字。
- 商户参数编辑：整条预配置来源区域隐藏，包括旧参数集名称；Cancel Switch 放在 Processor Parameters 标题右侧，表单恢复原有结构，不替换成 Merchant Parameters — Editing 一类来源标签。
- 取消编辑：恢复预配置标识、原参数集名称和只读值。等待回执时仅显示必要进度，商户参数生效后也不显示预配置标识。
- 前置正式参数确认、下发与结算状态边界沿用此前已确认规则。本轮是呈现状态修正，没有新领域概念或 ADR。
