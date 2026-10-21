# 终端日志列表与详情调整

日期：2026-10-21。状态：本地实现及桌面页面验收完成。

## 筛选样式修正

用户指出初版筛选区和按钮仍与其他页面不一致。初版只验证了尺寸和功能，没有完成同类列表的外观对照，初版的样式一致性验收结论不成立。

本次实际打开 `47.payment_channel.html` 和 `50.developer_manage.html` 对照后，日志列表直接采用同一 `pc-filters`、`pc-button pc-icon`、`pc-button pc-primary pc-icon`：无筛选区外框或底色、固定 215px 宽控件、12px 间距、整组靠右，Reset / Search 使用 40px 方形纯图标按钮。删除日志页原有的灰色容器、内边距及拉伸网格。标题至筛选区也采用相同的 28px 间距。

修正后再次在 Chrome 打开日志列表：筛选区实测 padding 0、border 0、透明背景、flex-end 对齐、gap 12px，三个控件宽 215px、两个按钮均为 40×40px，圆角 7px，与参考页面共享样式一致。重新验证 High 搜索及 Enter 选择得到两条记录、Reset 恢复六条、Socket 搜索得到一条、图标操作进入对应详情且可返回。`npm run build`、`git diff --check` 通过；列表截图已更新。

## 已确认的范围

- 只调整 `24.maintain_terminal_log.html` 与 `24.terminal_log_detail.html`，继续使用静态 HTML/CSS/JavaScript 和共享 Maintain 导航。
- 用户 Q1 确认“不用调整这个”：保持现有六列及信息位置，Terminal Name 仍位于 S/N 下方，描述仍位于 Title 下方。此项最新确认覆盖本次区域的一般去副标题规则；不增加名称列，不将描述移到详情。
- 用户 Q2 确认“其实只有 terminal_upload，都统一”：列表 Source 全部显示 Terminal Upload，详情 JSON 的 stage 统一为 `terminal_upload`。Device Driver、Network Service、Application、Power Monitor、Health Check 不再作为本页日志来源。
- 原有六条记录的 S/N、Terminal Name、日期时间、级别、标题、描述保持一致。S/N 和标题仍支持模糊搜索，级别精确匹配；输入即筛选、Search 执行筛选、Reset 清空筛选。标题链接和行操作均进入同一条日志详情。
- 保留原有直接进入详情时的默认演示记录与返回列表行为。此轮不改变筛选状态的持久化行为。

## 设计与实现

- 复用 `platform-admin-shell` 与 `payment-channel-maintain.css` 的页面框架、按钮、表格和焦点样式；新增 `terminal-logs.css` 只承载两页局部布局和级别颜色。
- DataTable 模式：黑色 34px 表头、11px 表头字号、紧凑行、桌面窄视口下表格内部横向滚动。
- Button 模式：筛选操作 40px、行操作 36px、详情标题前返回按钮 40px；统一为 Material Symbols Rounded 图标。
- Select 模式：复用现有 `PaywizardPaymentChannelPicker`，支持直接选择、搜索、已选状态、方向键、Enter、Esc、独立选项滚动与顶层浮层。
- Tag 模式：列表与详情复用同一套文字级别和颜色，Critical / High / Medium / Low / Info 均有明确文字。
- 详情保留四个字段与 JSON 区，改用规则网格、清晰边框、等宽 S/N 与日志排版。没有新增业务控件或领域流程。
- 尝试读取 PrimeVue v4 的 Select、DataTable、Tag 官方页面，但访问失败。本次沿用项目已有静态组件模式，不宣称完成当前官方 API 或全部组件行为核验。
- `Terminal Log` 术语已记录到根 `GLOSSARY.md`。布局可逆、无难以撤回的架构取舍，不新增 ADR。

## 验证

- 桌面 Chrome 实际打开两条路由，目视检查列表、筛选栏、详情、级别标签与内容换行；未核查手机浏览器。
- 页面实测：表头高度 34px、字号 11px；两个筛选按钮均为 40px；行操作 36px；返回按钮 40px。
- 级别输入 High 后 Enter 选中，列表显示两条 High；再次打开保持选中，搜索无结果不会丢失已有选择，Esc 可关闭。
- 输入不存在的 S/N 时显示空结果提示；Reset 恢复全部记录；标题 Socket 筛选与 Search 正常。
- 逐条打开六条日志，核对 S/N、时间、标题、级别及 `stage: terminal_upload`，返回链接均恢复列表与 Maintain 上下文。
- 页面检查期间控制台未见 warning / error；`node --check scripts/terminal-logs.js`、`npm run build`、`git diff --check` 通过。
- JSON 继续为静态演示内容，本次验证不代表真实日志接口或终端上传验证。

截图：[列表](../validation/terminal-logs/list.png)、[详情](../validation/terminal-logs/detail.png)。
