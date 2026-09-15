# Operating Hours 编辑体验与入口访谈

状态：两轮 Q1–Q5 均由用户回复「ok」确认，设计树已收敛，已实现共享编辑器与页面入口。归属结论同步至领域词汇、ADR 0010 和 PRD。

## 本轮用户明确要求

- Operating Hours 需要更直观的设置方式，探索类似日历的编辑体验。
- Store 与 Terminal 不得混在同一个目标选择框中；先区分设置维度，再选择对应对象，参考项目已有选择方式。
- 设置不能只放在 Uptime Matrix；需考虑商户页面中的门店入口，并在终端详情增加入口。
- 重新评估商户统一时间与门店统一时间的合理性；第一轮已确认门店统一、终端可独立覆盖，商户页面提供管理入口。
- 本项目无需手机浏览器适配或手机验收。

## 已核实的现行领域规则

- [CONTEXT.md](../../../CONTEXT.md) 与 [ADR 0010](../../adr/0010-independent-payment-service-uptime-and-operating-hours.md) 已定义：门店拥有默认时间表，终端默认跟随门店，也可使用完整独立时间表并恢复跟随。
- 独立终端时间表包含周计划、日期例外与地区时区；门店修改不覆盖独立终端配置。
- [PRD 第 7 节](../../prd/terminal-uptime.md) 已包含多时段、跨夜、日期例外、分钟精度、校验和历史版本。本轮改变编辑方式不自动改变这些规则。
- [现有编辑器](../../../46.terminal_uptime.html) 使用混合 Store or terminal 选择器；[编辑逻辑](../../../scripts/terminal-uptime.js) 逐日生成 24 hours / Closed / Custom 和时段输入。
- [商户详情](../../../5.merchant_detail_iso.html) 的门店 Settings 已有 Edit Store Info、Payment Parameter Setting 等入口，适合复用菜单承载门店时间设置。
- [Customer Alerts](../../../39.customer_alerts.html) 的 Monitor Scope 与 Merchant / Store / Terminal 字段分开，可参考其维度与层级模式；[Advertising 目标选择器](../../../scripts/advertising-target-picker.js) 已有 Stores / Terminals 分维度及可搜索的层级筛选，可复用搜索交互。
- [终端摘要](../../../scripts/terminal-uptime-summary.js) 当前只有 View history，没有直接 Operating Hours 入口；门店 Settings 的静态内容与动态菜单均缺少该入口。

## 第一轮已确认

### Q1 时间表归属

维持门店默认时间表与终端完整覆盖，不新增商户时间表继承层。商户页面管理其下门店的时间表。

理由：同一商户可能同时拥有商场内门店、24 小时街边设备及不同时区的门店；门店更接近实际运营场所。商户统一默认层会增加继承来源与修改影响范围的理解成本。

用户已确认。商户详情的门店 Settings 增加 Operating Hours；终端详情提供自身入口与 Follow Store / Custom hours。

### Q2 日历编辑方式

默认使用每周重复的可视化时间表：七列星期、纵向 00:00–24:00，营业时段显示为时间块。拖动创建或调整，点击时间块精确输入；保留全天、休息和复制到其他星期的便捷操作。指定日期的特殊安排使用独立日期日历入口，日期例外优先级沿用现行规则。

用户已确认“每周时间表 + 特殊日期日历”，包括多时段、跨夜、复制与日期例外。

## 第二轮已确认

### Q3 入口位置与目标上下文

门店 Settings 打开当前门店的编辑弹窗；终端详情 Service Uptime 区域增加 Operating Hours 并在当前页面打开编辑弹窗。上述详情入口固定对象，以对象名称展示当前目标。矩阵总入口保留 Store / Terminal 维度选择及权限内层级搜索。Store 用户仍可从其可访问的 Uptime Matrix 直接配置当前门店，无需访问 Merchant 模块。

### Q4 跟随门店时的操作边界

终端处于 Follow Store 时，以只读周视图展示门店名称和有效安排。选择 Custom hours 后复制当前门店完整安排为草稿，才允许编辑；点击或拖动日历不会隐式切换为独立配置。具备门店管理权限时提供 Edit Store hours 入口，明确切换到门店目标并显示受影响终端数量。恢复 Follow Store 后显示门店当前安排，统一由 Save 生效。沿用现行完整覆盖和历史规则。

### Q5 日历编辑细节

Weekly schedule / Special dates 两个页签。周视图拖动按 15 分钟步长调整，点击时间块可精确输入到分钟，已有非整刻时间在读取时不取整。跨夜时间块分布在相邻两天，并显示原始起止与 next day；从任一片段编辑均修改同一个原始时段。复制到其他星期会替换所选日安排，在执行动作中明确说明替换。Special dates 使用月历，点日期设置全天、休息或自定义，并标识已配置的日期；移除例外后恢复周计划。沿用跨夜、相邻日冲突验证与最终有效安排预览。

## 实现与数据边界

- 共享组件：`scripts/operating-hours-editor.js`、`styles/operating-hours-editor.css`。矩阵移除旧的逐日编辑实现，改为调用共享组件。
- 入口：`46.terminal_uptime.html`、`1.terminalmanage_nayax.html`、`5.merchant_detail_iso.html`、`5.merchant_detail_no_store_iso.html`、`5.merchant_device_settings_iso.html`。商户静态菜单与动态新增门店菜单均已接入；商户设备原有 Edit Params 跳转携带明确商户上下文。
- 商户详情的 `82910293 / st_204 / Midtown Location` 与共享目录的 `merchant-kind-world / s-midtown / Midtown Store` 是不同对象，不能按名称合并。商户页面门店以 `portal:{merchantId}:{storeId}` 注册；沿用原始商户、门店 ID，并保存到同一营业时间存储。S/N 冲突时不静默迁移或重写旧归属。
- 注册门店不要求已有终端。新注册终端仅有配置身份，`configurationOnly` 阻止生成演示观测和在线率；不回填历史。门店资料和设备绑定仍由原页面管理，营业时间组件不替代其业务记录。
- 沿用现有演示访问范围，URL 的商户上下文不授予额外权限。生产登录授权、统一组织 ID、设备绑定同步与遥测仍属于后端对接项。
- 保存时刻生效、历史版本、取消丢弃草稿、保存失败保留输入并定位错误等规则沿用现行 PRD。本轮未部署。

## 桌面验收

在真实浏览器打开上述具体页面；保存测试使用独立本地来源 `127.0.0.1:8999`，与日常预览 `8998` 分开。

| 检查 | 结果 |
| --- | --- |
| 周视图首屏 | 1710 × 896 桌面视口；弹窗 1180 × 834，星期表头 34px，保存按钮 40px。七天与 00:00–24:00 同屏，选中星期高亮，右侧精确编辑；固定保存区可见。 |
| 维度与搜索 | Store / Terminal 分开；商户、门店、终端层级联动；输入 0043 并按 Enter 选择 Breakroom Cooler Q3；空门店说明原因且不保留其他店终端。 |
| 输入与错误 | 09:17 保持分钟精度；起止相同阻止保存，错误进入可视区并获得焦点。 |
| 拖选与移动 | 周二空白区域从 08:00 拖至 18:00，生成对应时段并回填输入；00:00–24:00 整日拖选得到 24 hours。周一 08:00–20:00 整块移至周二成功；再移入全天营业的周三时提示冲突，并保留周二原时段。 |
| 跨夜与日期例外 | 周五 22:00–周六 02:00 分两列；拖动周六结束边缘至 04:00 回填原始周五时段；指定周六休息覆盖延续，移除例外恢复 00:00–04:00。 |
| 复制与保存 | 门店周一 09:17–18:00 复制到周二至周五；设置 9 月 18 日休息，保存并重开回填。 |
| 入口与继承 | Brooklyn Market 的门店入口固定该店，设备详情回填同一安排。终端独立改为 10:00 后，门店改为 08:00 不覆盖它；恢复 Follow Store 显示 08:00。影响数量从 3 降为 2。 |
| 新增与空门店 | no-store 页面创建门店后，动态 Settings 含 Operating Hours；零终端门店可打开编辑器，影响数量为 0。 |
| 只读 | access=view 不显示 Save，Follow Store / Custom hours 和时间输入禁用；仍可查看与搜索目标。 |
| 回归 | 41 项领域测试通过，包含 38 项既有回归及 3 项新增身份隔离、无伪造遥测、S/N 冲突测试。修改的 JS 语法检查、npm run build、git diff --check 通过。未检查手机页面，遵循本轮项目要求。 |
