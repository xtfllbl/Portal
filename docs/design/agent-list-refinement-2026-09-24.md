# Agent List 层级颜色、操作区与服务商选择

状态：用户已回复“ok”确认本轮 Q1—Q4，静态原型已实现。已确认基础见 [代理商层级改造](agent-list-hierarchy-2026-09-23.md)；本轮规则覆盖其按钮排版及单服务商展示方式。

## 用户已明确的改动

- 代理商仍属于同类实体，L1/L2/L3 用不同颜色增强辨识。
- 重做右侧操作按钮的布局，遵守项目 UI 规范及同类页面已有模式，解决长短文字按钮排列杂乱的问题。
- 在 Agent List 页面标题旁增加服务商选择下拉；平台运维可选择不同服务商，查看其代理商层级。
- 下拉的业务对象是 Service Provider，名称统一为“服务商选择器”，区别于树中的 Agent。
- 依据用户提供的平台 Service Provider 截图选择 10 个服务商，为其补充代理商演示数据。
- 保留之前确认的代理商详情、编辑、新增、启停与密码重置邮件业务含义；本轮没有要求迁移静态架构或接入真实服务。

## 已确认的设计决定

1. L1 蓝色、L2 紫色、L3 青色，仅用于图标与级别标签；名称统一文字色，仍保留级别文字。按用户后续截图反馈，树中禁用代理商仅在名称上加删除线，不显示 Disabled 标签；右侧详情保留状态标签，树节点无障碍名称保留禁用状态。
2. 新增下级、编辑、启停、重置邮件使用统一 40×40px 方形图标按钮，放在代理商名称行右侧，悬停及键盘聚焦展示完整说明；邮件确认保留完整操作名称。
3. 本页默认 Platform Operations 视角，可选择全部 10 家服务商并管理其代理商；普通服务商只显示自己的归属，没有跨服务商选择器。
4. Service Provider 选择器按用户后续截图箭头调整至 Agent List 标题栏右侧，按名称及 ID 搜索；默认 wizarpos。切换时清空代理商搜索、展开新树、选中第一个代理商；未保存时沿用放弃修改/继续编辑保护。

## 已明确的领域词汇

Service Provider、Agent Level 与 Agent Management Context 已补入 [领域词汇表](../../CONTEXT.md)。Agent Level 表示层级，不表示另一种授权角色或账号状态；选择服务商不改变运维操作者身份。

## 数据原则

- 服务商名称及 ID 以用户截图为准；本地原型数据若不一致，应保留来源差异，不能把原型种子当成生产目录。
- 代理商、联系人和邮箱均为演示资料；模拟邮箱使用 example.com。
- 服务商之间的代理商层级与操作对象隔离；不得通过名称或数组顺序推断归属。
- 本次为可逆的界面与样例数据调整，暂不新增 ADR。

## 来源与样例

- 现有共享 Portal Access Profile 未提供平台运维身份；WizarPOS Provider 不能作为运维权限判定。运维演示上下文需要在本页明确，不推导或新增真实认证能力。
- 本地 `21.service_provider.html` 当前仅有 1053—1046 的 8 条种子记录，与用户截图不同。
- 从用户截图选择 10 家：wizarpos（1002）、NA Service Providers（1001）、Noctoptics（1045）、Paynt ISV（1043）、Dippindots（1040）、YoloPago（1039）、ManagePay（1037）、JMSCPOS（1036）、MonclusVending（1029）、Retech Payment Systems（1019）。
- 截图中 Dippindots、MonclusVending 为 Unattended-Service，JMSCPOS 为 Attended-Service，其余所选服务商为 Full-Service；该分类是截图转录，非实时平台查询。
- 共 62 个代理商：保留 wizarpos 原有 8 条，另外 9 家每家 6 条，均有 L1—L3 分支，并包含部分禁用示例。新增联系人、邮箱等为虚构演示资料。

## 组件与实现边界

- 方形图标操作复用原 Agent List 模式，并核对 [PrimeVue v4 Button](https://v4.primevue.org/button/) 的图标按钮、语义色和无障碍名称用法；尺寸属于本项目定制。
- Tooltip 参考 [PrimeVue v4 Tooltip](https://v4.primevue.org/tooltip/)，以原生顶层 popover 实现；支持悬停/键盘聚焦、Esc 关闭及视口边缘定位，滚动和切换对象后关闭。
- 服务商选择复用 `PaywizardUptimeCombobox` 的可搜索单选与键盘模式；v4 Select 文档本轮未能稳定访问，沿用项目已验证模式。切换被取消时恢复之前的值和焦点，不丢表单输入。
- 代理商记录增加稳定的 `providerId`；树、详情、查找、父节点、新增及邮件适配参数都使用服务商归属。邮件异步完成后只更新原代理商的反馈，不串到新的服务商详情。
- 默认入口 `2.agent_list_iso.html` 为运维原型；普通服务商验收入口如 `2.agent_list_iso.html?scope=provider&provider=1036`。参数仅控制原型演示，不代表认证或后端授权，没有添加额外角色演示切换按钮。
- 共享外壳仅为本页读取显式上下文、展示固定身份，并借用对应服务商 profile 的导航布局；不改写全局 profile 存储，不将 WizarPOS Provider 解释为运维权限。
- 原有内存数据、刷新还原和邮件模拟边界保持不变；未接入生产目录、账户权限或邮件服务。

## 验收结果

- `npm run test:e2e -- tests/agent-list.spec.js tests/agents-sidebar-consistency.spec.js --workers=1`：15 项通过。
- 覆盖 10 家服务商切换、名称/ID 搜索、普通服务商固定范围、未保存时取消/确认切换、新增和编辑归属隔离、邮件异步结果隔离、层级颜色、键盘工具提示、原有代理商流程及共享侧栏一致性。
- 1280×720、1440×900、1920×1080 均无横向溢出，名称行右侧按钮均为 40×40px；桌面截图在本地 `artifacts/agent-list/desktop-*.png`。
- 实际 Chrome 页面已目视检查默认运维页、JMSCPOS 切换后的树及详情、服务商选项与键盘操作提示；服务商名称、归属、业务模式和默认选中节点同步。
- 连续新增再编辑验收发现关闭的新增弹窗残留旧表单，已在关闭时释放选择器并清空表单内容，复验通过。
- `npm run build`、两个修改脚本的 `node --check`、`git diff --check` 均通过。未部署生产环境。
