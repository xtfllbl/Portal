# 运维服务商账单：以服务商为入口的三版设计

2026-10-28。用户要求先比较几版界面，再选择正式布局。当前正式账单列表尚未替换；Service Fee Log 入口已按明确要求移除。

## 判断依据

目前的账单列表以发票为中心，服务商只作为筛选项。连续处理某一家服务商的多季度账单时，常驻服务商导航能减少反复筛选，并让费用设置、生成账单与审核始终围绕同一对象。

各服务商是平级收费对象，各自账单覆盖其下属代理商、商户和门店。这里不引入服务商之间的父子组织关系，也不把账单拆给下属对象。下述 B 的树表达“账单目录”，而非新的组织层级；最终选型待用户确认。

## 三版比较

| 方案 | 组织方式 | 适用工作 | 取舍 |
| --- | --- | --- | --- |
| A：服务商工作台，推荐 | 左侧搜索、选择服务商；右侧四季度列表，保留 All service providers | 连续处理多家服务商，又需要比较一家各季度 | 切换成本低；占用一列宽度，单服务商列表去掉重复服务商列 |
| B：服务商账单目录树 | 服务商 → 年份 → 季度；右侧直接展示所选账单费用 | 已知具体服务商及期间，快速查某季度 | 定位直接；展开后目录较长，多季度对比不如 A |
| C：服务商账务总览 | 一行一个服务商，显示未付张数及其币种金额；进入后看该服务商账单 | 先筛待跟进服务商，再逐家处理 | 主表宽度最大；返回并进入另一家比 A 多一步 |

## 预览入口

- [比较页](../../../52.billing_design_options.html)：提供 A / B / C 切换和单独打开。
- 独立方案：[A 服务商工作台](../../../52.service_provider_billing_options.html?layout=a)、[B 账单目录树](../../../52.service_provider_billing_options.html?layout=b)、[C 服务商账务总览](../../../52.service_provider_billing_options.html?layout=c)。
- [未配置费用状态](../../../52.service_provider_billing_options.html?layout=a&provider=1052)。
- [C 的服务商详情](../../../52.service_provider_billing_options.html?layout=c&provider=1047)。

方案使用相同账单数据，服务商名单合并管理目录与既有计费对象，目前共 10 家，不仅显示已有账单的 7 家。未配置费用与已配置但尚未出账分别展示；未配置时仅提供费用设置入口。未付数字仍使用已确认口径，不相加不同币种金额。

A 支持服务商搜索、方向键选择、All service providers、状态和季度筛选。B 支持目录展开/折叠、上下方向键、Home/End、左右层级导航及 Enter 选择。C 支持搜索、仅看有未付账单的服务商、进入与返回。账单可以在当前方案中预览；审核、费用管理、生成账单在新标签页打开现有业务页并带入服务商，保持当前设计预览位置。预览自身不修改账单，现有业务页保存时沿用原有规则。

## 既有控件与参考

沿用共享 Maintain 导航、Poppins、Material Symbols Rounded、pc 控件与 Billing 表格；表头 34px / 11px，表单操作 40px、行操作 36px。A/B 的分栏与独立滚动参考 `2.agent_list_iso.html` 和 `48.impersonate.html`，C 参考 `21.service_provider.html`。

- [PrimeVue v4 Listbox](https://v4.primevue.org/listbox/)：A 的搜索和单选导航模式。
- [PrimeVue v4 Tree](https://v4.primevue.org/tree/)：B 的展开、层级与键盘模式。
- [PrimeVue v4 DataTable](https://v4.primevue.org/datatable/)：列表组织与状态；紧凑规格采用项目规范。

官方文档通过直接 HTTP 获取并核对，未安装组件框架。账单目录是组合组件，因为节点关系是业务中的服务商、账单年份与季度，而非组织树。没有新增全局设计系统或生产接口。

## Service Fee Log 废弃处理

移除正式账单页顶部按钮、Maintain → Payment 菜单，以及现有页面静态旧侧栏中的同名入口。旧 `52.service_fee_log.html` 地址转向服务商账单列表，不再提供独立日志页面。保留账单内部 Source events 和单条事件详情，用于解释原始试算；并未删除计费事件或账单依据。

## 选择状态

推荐 A，最终采用哪版尚未决定。用户选择后再将其用于正式 Service Provider Billing 页面；本次方案之间的切换只存在于独立设计比较页。

## 本次验收与交接

- 实际 Chromium 页面经过两轮有界检查，未见脚本错误或页面级横向溢出。共保留 [10 张截图](../../../.impeccable/review/provider-layout-options/)，包括 A/B/C 各自的 1440×1000 与 1280×800、A 的 3840×1706、未配置费用、C 详情和比较页。桌面检查不代替用户选择或最终视觉验收。
- 首轮运行 `tests/provider-billing.spec.js`、`tests/provider-billing-navigation.spec.js` 和 `tests/provider-billing-options.spec.js`：23 项中 22 项通过，1 项因测试将搜索输入定位为 `textbox` 而失败。改为实际 `searchbox`，并完成方案的局部视觉及可访问性修正后，重跑方案测试，5 项全部通过。其余 18 项服务商回归已有通过记录，本轮未在最终修正后再次全量运行；不能表述为最终同次运行 23 项全部通过。
- 方案测试覆盖服务商搜索与键盘切换、完整目录与未配置状态、目录树季度导航、C 的进入/返回及账单预览、旧日志入口移除与地址跳转，以及服务商上下文传入生成账单和费用设置。构建、相关脚本语法与 `git diff --check` 通过，未执行全仓库回归。
- 独立 reviewer 结论为 **ship：可供选择的比较原型**，未发现阻塞问题，无需新增截图。该结论不表示任何方案已被选为正式布局。检测器提示来自继承的 pc 弹窗边框/阴影及共享页面进度动画，本次不据此扩大为全局视觉改造。

| 视觉证据 | 1440 桌面 | 1280 桌面 |
| --- | --- | --- |
| A | [工作台](../../../.impeccable/review/provider-layout-options/a-1440.png) | [工作台](../../../.impeccable/review/provider-layout-options/a-1280.png) |
| B | [目录树](../../../.impeccable/review/provider-layout-options/b-1440.png) | [目录树](../../../.impeccable/review/provider-layout-options/b-1280.png) |
| C | [总览](../../../.impeccable/review/provider-layout-options/c-1440.png) | [总览](../../../.impeccable/review/provider-layout-options/c-1280.png) |

补充证据：[A 超宽桌面](../../../.impeccable/review/provider-layout-options/a-3840.png)、[A 未配置费用](../../../.impeccable/review/provider-layout-options/a-unconfigured.png)、[C 详情](../../../.impeccable/review/provider-layout-options/c-detail.png)、[比较页](../../../.impeccable/review/provider-layout-options/comparison.png)。

正式应用所选方案时仍需处理三项已知限制：C 的进入详情与返回应补足焦点恢复；B 手动传入不同 `provider` 查询参数时，默认账单仍指向 Cantaloupe 的 Q3，应统一初始化范围；All service providers 的比较视图直接展示 28 张演示账单，尚未分页，正式布局须保留既有分页能力。这些是比较原型的后续实现项，不改变当前选择状态。

文档交接核对了本地链接、10 张截图文件及尺寸，并对照当前方案脚本和测试内容。测试执行、浏览器检查和 reviewer 结论来自本轮实现交接，文档交接未重新执行测试或页面验收。继续使用静态 HTML/CSS/JavaScript；未替换正式列表布局、改写全局 `DESIGN.md` 或 `.impeccable/design.json`，未部署或接入真实支付。
