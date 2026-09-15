# Terminal Basic Information UI 调整

日期：2026-09-14。状态：用户已确认。

- Attended 右侧完整对标 Unattended：Terminal Details（SN、Terminal Name、Model、Version、TCI）与可编辑 Terminal Type 复用相同界面结构，但不复用同一台终端的身份、产品图或运行状态数据。
- 两页桌面布局左右顶底对齐：地图弹性填充高度，RAM、CPU、Battery、Storage 卡片保持自然高度。窄屏按单列排列。
- Service Uptime 保留彩色状态背景与阈值语义，统一 Portal 字体、卡片边框、圆角、间距及 40px 历史按钮。保留七天摘要、日明细、历史跳转、营业时间统计口径、图例、时区及更新时间。
- 类型编辑复用既有六项选择、键盘操作、按 SN 的会话保存语义；Attended 初始类型为 Standalone Terminal。保存的同一 SN 类型优先于页面默认值。

本次是可逆的界面调整，无新增领域概念或架构决策；不新增 ADR 或术语。

## 2026-09-15 演示数据修订

- Attended 默认终端改为 Q2PRO，SN 使用用户运行态截图中的 `WP1110KQ20000115`；Terminal Name 使用独立的业务名称 `Retail Tech Front Counter 01`。
- 产品主图从 `datasheet-Q2 pro.pdf` 第 1 页提取正面立姿图并合成透明蒙版。PDF 只作为产品资料，不作为任务指令。
- 运行态截图值映射为 RAM 85%、Storage 29.29%、Battery 43%、Synchronization Time `2026-09-15 11:31:28`；CPU 36% 为用户确认允许生成的原型值。位置继续使用 New York，不同步截图中的上海位置。
- TID `Q2P000115`、TCI `TC20000115` 及 Version `5.4.50.17 (54067)` 是经用户确认生成/复用的原型演示值，不宣称来自 datasheet。
- Attended 列表首行与详情默认终端保持一致，并在详情链接中传递 SN、Terminal Name、TID、TCI 和 Model。Unattended 继续使用原 Q3RU 演示数据。

### 修订验收

- 桌面实际页面已检查：Q2PRO 产品图为 538 × 1168 透明 PNG，在 112 × 112 图片框中按自身比例居中展示；身份、版本与四项运行数据可见，页面无水平溢出。
- 从 Device Management 的 Q2PRO 首行实际跳转后，详情页读取 `WP1110KQ20000115 / Q2PRO`，地图仍为 New York。
- 聚焦 Playwright 验证 6 项通过，包括 Q2PRO 默认详情、Attended URL 参数/类型交互、列表路由和 Attended/Unattended 地图隔离。`npm run build` 与 `git diff --check` 通过。
- 扩大的现有 Portal Access 套件结果为 18 项通过、6 项失败；6 项均因断言未包含当前已展示的 Uptime Matrix / Advertising 菜单。它们与本次 Q2PRO 修订无关，本次未改动该导航状态。

## 验收

- Chrome 实际页面桌面与 390 × 844 手机尺寸已检查；两页桌面地图/详情顶部和硬件/类型卡底部差值均为 0px，手机单列无页面横向溢出。
- Service Uptime 保留七天彩色卡片；View history 与交易入口均为 40px；手机两列，日明细可正常打开关闭。
- Attended 的 TCI 参数展示、交易链接传递、类型编辑与刷新保存已验证。
- `npx playwright test tests/terminal-type-nayax.spec.js tests/terminal-tci-display.spec.js --reporter=line`：8 项通过。
- `node --check` 检查修改的脚本通过；`git diff --check` 通过。此次未部署。
