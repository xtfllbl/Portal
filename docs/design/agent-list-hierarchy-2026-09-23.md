# Agent List 代理商层级改造

状态：两轮方案均已确认，静态原型已实现；确认依据为用户 2026-09-23 的要求、第一轮“其他都 OK”以及第二轮“OK”的回复。

2026-09-24 更新：层级颜色、详情操作排版及多服务商上下文以 [Agent List 界面细化](agent-list-refinement-2026-09-24.md) 为准。下文保留首轮设计及其验收记录。

## 已确认

- 改造 Agent List 页面，左侧参考 Device Management 的树形样式展示代理商上下级关系。
- 树中不展示代理商旗下的商户和门店。
- 右侧展示选中代理商的信息及可执行操作。
- 视觉参考为用户提供的 Agent List、Device Management 层级树和 View Super ISO 截图。
- 沿用项目静态 HTML/CSS/JavaScript 架构及 UI 规范。
- 保留 Service Provider（wizarpos）作为归属根节点，下面展示 L1 → L2 → L3 代理商；服务商不计入代理商级别。
- 代理商节点展示名称和级别，禁用时标识状态，不显示数量。
- 右侧完整展示截图中的 Creation Scope、Basic Information、Cooperation & Region；顶部展示名称、状态和操作，并保留创建时间。移除重复的 View 按钮。
- Edit 将右侧详情切换为原位编辑表单，提供 Save / Cancel，字段位置保持一致；本次补齐可交互的编辑原型。
- Service Provider 可以新增 L1；选中 L1/L2 时提供 Add Sub-agent 并固定当前代理商为上级；L3 不提供新增下级。
- 原 Reset 功能明确为重新发送密码重置邮件：用户经常无法登录且找不到原始邮件，需要运营人员重新发送邮件帮助恢复访问。按钮命名为 Send Password Reset Email。

## 交互规则

- 层级导航
  - Service Provider 根节点只展开/收起，旁边的加号新增 L1；右侧不切换为服务商详情。
  - 首次进入选中第一个代理商；重复点击选中项不取消选择。
  - 按代理商名称即时搜索，保留匹配节点的祖先路径；无匹配时显示空结果，保留当前详情及编辑内容。
  - 折叠仅改变树的展示，不切换右侧代理商；清除搜索后恢复折叠状态。
  - 新增成功后清空搜索、展开祖先并选中新节点；切换对象后展示其详情顶部。
  - 长名称省略显示，悬停显示全名；支持方向键、Home/End 定位及 Enter/Space 选择。
- 代理商详情
  - 归属服务商、上级代理商、级别及创建时间只读；本次不提供迁移代理商入口。
  - 有未保存修改时，切换代理商或退出编辑须选择 Discard Changes / Continue Editing；继续编辑保留输入。
  - 保存后同步树名称与详情；错误在实际滚动容器内定位并聚焦，保留表单输入。
- 代理商操作
  - 启停只修改所选代理商状态，不级联修改下级状态；禁用代理商保留查看及重新启用入口。
  - 密码重置邮件发给当前已保存的 Agent Email 对应账号；发送前确认代理商及邮箱，编辑期间不显示发送入口。
  - 发送期间防止重复提交；成功和失败均在右侧反馈，失败保留重试入口并聚焦错误。
  - 新增表单使用固定归属和级别；未保存时通过 Cancel、Close、Esc 或遮罩退出，均保护已输入内容。

## 领域术语

代理商层级和密码重置邮件使用 [Agent Hierarchy / Agent Password Reset Email](../../CONTEXT.md)；领域词汇保存在根目录词汇表，页面交互决定保存在本记录。

当前是页面组织方式调整，尚无需要记录为 ADR 的架构取舍。

## 改造前的原型事实

- `2.agent_list_iso.html` 的行操作为新增下级、查看、编辑、启用/禁用、Reset；查看、编辑和 Reset 目前仅显示模拟提示。
- 当前 Add 要求选择已有代理商作为上级，不能直接新增一级代理商；本次已确认补齐。
- 用户截图的完整查看面板尚未在当前 Agent List 实现；Business Model 也不在该页现有创建字段中。
- 当前 Reset 提示同时提及 password/email；用户已澄清为重新发送密码重置邮件。

## 组件与实现

- 页面入口仍为 `2.agent_list_iso.html`，沿用 `platform-admin-shell`；局部实现位于 `scripts/agent-list.js` 与 `styles/agent-list.css`。
- 层级导航参考 Device Management 的双栏布局与 Tree 单选模式；代理商业务 L1—L3 独立于服务商根节点。桌面树宽度 320px，较窄桌面为 285px。
- 表单单选复用 `PaywizardUptimeCombobox`，对应 Select 的搜索、点选、键盘及顶层弹层模式；销毁表单时清理其监听器。
- MCC 使用搜索、复选列表和可移除已选项的组合组件，便于集中查看多选内容；搜索不丢失选择。
- 新增及确认使用原生模态 dialog，参考 Dialog / ConfirmDialog 的焦点和关闭模式；按钮统一 40px，沿用 Material Symbols Rounded。
- 本次尝试访问 PrimeVue v4 Tree、Select 和 MultiSelect 文档未成功，因此沿用项目已验证的组件模式；未宣称与某个 PrimeVue 小版本完整一致。

## 原型数据与边界

- 保留原有 8 个代理商名称、上下级、联系人、邮箱、状态和创建时间。缺失的电话、合作时间、年限、业务模式和 MCC 补为演示资料，不代表生产记录。
- 界面授权名称按截图展示 AGENT-ADMIN / AGENT-MANAGER / AGENT-OPS；原型内部继续使用既有 AGT-* 值。
- 本次新增、编辑及启停保存在当前页面内存，刷新恢复种子数据；没有新增真实账号权限或后端持久化。
- 密码重置默认模拟发送结果，不发出网络请求。`PaywizardAgentServices.sendPasswordResetEmail` 预留异步适配入口；模拟成功不代表实际投递，真实发送结果需邮件服务集成后验证。
- 本次不改变代理商业务模式的继承/约束规则，不新增关联商户、门店或终端的联动操作。

## 验证

- `tests/agent-list.spec.js` 覆盖层级搜索与键盘、新增 L1/L2/L3、未保存修改、编辑同步、非级联启停、发送确认/防重/失败重试、选择器和 MCC、表单错误定位、桌面尺寸和页面脚本错误。
- 桌面尺寸为 1280×720、1440×900、1920×1080；截图保存在本地 `artifacts/agent-list/`。
- 另通过实际 Chrome 页面检查详情和原位编辑、搜索弹层、底部操作栏及新增/发送确认。
- 最终结果：9 项 Playwright 测试通过；`npm run build`、`node --check scripts/agent-list.js` 和 `git diff --check` 通过。视觉检查发现并修复保存栏下沿裁切，补充相应位置断言；同时修复切换代理商后详情停留在原滚动位置的问题。
