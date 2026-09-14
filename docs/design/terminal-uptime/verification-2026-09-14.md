# Terminal Uptime 修订验收记录

日期：2026-09-14。范围：本地静态原型，使用显式标记的模拟数据。现行规格见 [PRD](../../prd/terminal-uptime.md)，确认依据见 [Q22–Q24](revision-2026-09-14.md)。首版验收档案保留，不将旧截图中的 Incomplete 或颜色规则作为当前行为。

## 后续 Q25 布局与状态统一验收（当前版本）

用户进一步确认 Unreachable 名称，以下结果覆盖本页后面旧记录中的模块位置、三项时长与摘要按钮。

| 检查 | 实际结果 |
| --- | --- |
| 位置与名称 | 默认 Basic Information；Service Uptime 的前一元素为 dash-grid，后一元素为 txn-section，截图确认它紧邻 Terminal Transaction Statistics 上方。 |
| 精简头部 | 摘要仅有 Service Uptime 标题和 View history，装饰图标、Simulated data 和 Refresh 按钮及摘要刷新事件均已删除。 |
| 状态统一 | 主终端 Sep 7 详情只显示 Online 22h 20m、Unreachable time 1h 40m；时间轴及明细均为 Unreachable，无 Confirmed offline 或 No report。 |
| 数值与相邻区间 | 新增测试以相邻 15 分钟旧 offline 加 45 分钟 unknown 验证：统一为 1 小时 Unreachable，在线率仍为 23/24，详情仅两个统计卡；展示合并后原始证据不被改写。 |
| 筛选统一 | With Unreachable time 返回 8 台含不可联系时长的样例；With unavailable data 仅返回 1 台已知采集异常样例，二者含义不再重叠。 |
| 终端链接 | 桌面实测 S/N 为 rgb(0,111,214)、font-weight 800、无常驻下划线，与 Terminal List 一致；日格表头仍为 34px。 |
| 手机摘要 | 390 × 844 预览（实际 CSS 宽 354px）中，模块在终端信息之后、交易统计之前；四格加三格可读，View history 为 40px。 |
| 手机详情 | 两项统计并排、无页面横向溢出；详情表自身滚动，底部三个操作均为 40px。 |
| 自动化 | `node --test tests/unit/terminal-uptime.test.cjs`：31 项通过、0 失败。 |
| 构建及语法 | 静态构建、修改的三个展示脚本语法检查及 git diff --check 通过。 |

完整决定见 [Q25 布局与统一状态](refinement-2026-09-14.md)。本轮没有修改计算分母、营业时间、权限或历史保留规则；所有数据仍是模拟，尚未部署生产。

## Q22–Q24 阶段的验收档案

以下记录对应 Q25 之前的同日版本，其位置、标签与按钮观察仅保留作历史证据。

## 自动化与构建

- `node --test tests/unit/terminal-uptime.test.cjs`：30 项通过，0 失败。
- 本轮新增验证 95%/90% 分级边界、显示精度不跨阈值、当地跨日移除进行中标签、当天缺报与未来区间分离、平台采集故障例外、全部缺报历史日为 0%、跨日重开推进观测但保留配置、两页共用访问范围。
- 既有营业内统计、秒级离线、DST 23/25 小时、跨夜与日期例外、接入/保留范围、换店/解绑权限、版本保存、历史纠正、并发冲突及存储失败测试继续通过。
- `npm run build` 静态构建成功；修改的五个 JavaScript 文件通过 `node --check`；`git diff --check` 通过。

## 浏览器实际页面

通过 Browser 操作 `http://127.0.0.1:8766/` 下的现有页面。默认桌面及 1440 × 900 预览均检查；后者受浏览器缩放影响，实际 CSS 宽 1309px。手机设置 390 × 844，实际 CSS 视口 354 × 767；完成后已恢复默认视口。

| 场景 | 实际结果 |
| --- | --- |
| 终端首页 | 无参数进入 `1.terminalmanage_nayax.html` 默认选中 Basic Information；七天摘要直接位于地图和硬件信息上方，原终端图片和详情仍保留。 |
| 显式页签 | `?tab=appfw` 仍选中 APP & Parameters。 |
| 七天日期一致 | 主终端摘要和 View history 的固定 S/N 矩阵均为 Sep 7–Sep 13；当时纽约为 Sep 13、上海为 Sep 14，按终端当地日期显示正确，页脚标明 America/New York。 |
| 页面互通 | 摘要日格就地打开抽屉；抽屉 View history 带 S/N 和所选日期进入矩阵同一天。矩阵 S/N、摘要 View history 往返保留 `scope=store:s-midtown&access=view`。 |
| 新接入终端 | `?sn=NYC-Q3-0043` 摘要仅有 Sep 10–Sep 13，没有接入前状态格。 |
| 绿色/黄色/红色 | 实际日格 98%、95.8% 为绿；94.1%、93.7%、93% 为黄；87.5%、86.1% 为红。90% 与 95% 精确边界由领域测试验证。 |
| 历史缺报 | NYC-Q3-0042 Sep 9 显示绿色 95.8%；Online 23h、Confirmed offline 15m、No report 45m，合计 24h；缺报说明明确已计入离线、原因未确认，没有重复扣减或 Incomplete。 |
| 已知采集故障 | WP2013Q321000018 Sep 8 显示 Data unavailable，无百分比；详情说明营业内 12h 无法评估，时间轴及分段列表保留 Collection unavailable。 |
| 今天 | 主终端 Sep 13 显示暂计 92.4% + In progress，未来区间标为 Upcoming；过去日期没有进行中标记。 |
| 手动刷新 | 实际点击后更新时间从 `2026-09-14T02:07:18.881Z` 推进到 `2026-09-14T02:07:36.230Z`；Uptime 脚本无轮询，唯一计时器用于关闭 Toast。 |
| 桌面规格 | 日期表头约 34px / 11px；摘要和详情操作按钮 40px；矩阵微型时间条占满日格可用宽度，七列可见。 |
| 手机布局 | 矩阵七列同时可见，页面未撑宽；摘要为四格加三格，日期与百分比清晰，今天保留 In progress 文字。 |
| 手机详情 | 当天百分比、三项时长和时间轴可读；明细表在自身容器横向滚动，页面不溢出；Previous day、Next day、View history 均 40px。 |
| 时区下拉 | 手机输入 Shanghai 可见 Asia/Shanghai 候选，弹层未被弹窗裁切；按 Escape 后保留 America/New York。 |
| 错误定位 | 草稿 Monday 起止均设为 08:00 后 Save 被阻止，焦点自动落在 hoursError；错误底边约 621px，底部操作区从 646px 开始，错误完整可见。Cancel 后未保存草稿。 |
| 只读配置 | 门店只读入口中时间表可查看、编辑控件禁用且不显示 Save；下钻与返回保留只读上下文。 |

## 交付边界

本轮完成可交互原型、现行规格、领域术语与 ADR 修订；未接入真实 Payment Service 采集、网络质量指标、服务端权限或生产历史清理。未修改既有 Customer Alerts/SLA Alerts 的触发或通知规则。本轮未提交 Git commit，未部署生产。
