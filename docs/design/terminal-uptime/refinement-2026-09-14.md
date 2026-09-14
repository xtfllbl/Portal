# Service Uptime 布局与统一状态

日期：2026-09-14。状态：五项修改及 Q25 名称均已确认。正式规格：[Portal #7](https://github.com/xtfllbl/Portal/issues/7)。本记录接续 Q22–Q24，以本轮用户截图及最新指令为准。

## 已确定的设计树

```text
Service Uptime
├─ 位置：地图/硬件/终端信息之后，Terminal Transaction Statistics 正上方
├─ 标题：Payment Service uptime → Service Uptime
├─ 头部：删除装饰图标、Simulated data、独立刷新按钮；保留 View history
├─ 终端服务状态：Online / 一个原因未知的通信缺失状态
│  ├─ Q25 名称：用户选择 Unreachable，统计卡为 Unreachable time
│  ├─ 原 Confirmed offline 与 No report 时长合为一项，不重复计数
│  ├─ 时间条、图例、明细、无障碍名称和筛选同步统一
│  └─ 已知平台采集问题延续 Data unavailable 例外
└─ S/N 链接：参考 Terminal List，蓝色加粗、无常驻下划线
```

## 事实与决定

当前 offline 和 unknown 区间均由原型模拟适配器产生，没有真实 Payment Service 采集能够证明网络或设备故障。此前 Confirmed offline 的用户文案过强，用户明确要求统一处理未收到通信的情况。

Q25 建议名称 Unreachable（无法联系服务），用户明确选择该项。它仅描述通信未收到，不区分网络断开、终端故障等原因。Online 与 Unreachable time 两项替代此前三个统计卡；原 15 分钟 offline 加 45 分钟缺报统一为 1 小时 Unreachable，日率仍为 95.8%。

领域层旧 `offline` 汇总已包含普通 `unreported` 一次，复用此合计可保持数值不变。保留原始样例区间用于核对，不把旧来源差异展示成两种产品状态。相邻且计划、归属、授权边界相同的同类服务区间合并展示；不跨权限边界合并。

用户红框针对摘要头部，因此删除该处的图标、模拟标记及刷新按钮；View history 和页脚时区/更新时间保留。原型数据仍是模拟，详细矩阵和文档保留这一说明。没有新增后台采集、轮询或告警行为。

其他规则沿用：Payment Service 范围、营业内统计、95/90 三档颜色、终端当地 In progress、默认七天、三个月保留、接入起点、版本与历史权限。已同步 [领域术语](../../../CONTEXT.md)、[ADR 0011](../../adr/0011-preserve-effective-operating-hours-for-uptime-history.md)、[PRD](../../prd/terminal-uptime.md)；验收追加在 [修订验收](verification-2026-09-14.md)。
