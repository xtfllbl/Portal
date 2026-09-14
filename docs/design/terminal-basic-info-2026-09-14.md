# Terminal Basic Information UI 调整

日期：2026-09-14。状态：用户已确认。

- Attended 右侧完整对标 Unattended：复用 Q3 产品图、Terminal Details（SN、Terminal Name、Model、Version、TCI）与可编辑 Terminal Type，替换旧详情及 Group List。Attended 同样有 TCI；原型沿用既有 URL 传入及演示值规则。
- 两页桌面布局左右顶底对齐：地图弹性填充高度，RAM、CPU、Battery、Storage 卡片保持自然高度。窄屏按单列排列。
- Service Uptime 保留彩色状态背景与阈值语义，统一 Portal 字体、卡片边框、圆角、间距及 40px 历史按钮。保留七天摘要、日明细、历史跳转、营业时间统计口径、图例、时区及更新时间。
- 类型编辑复用既有六项选择、键盘操作、按 SN 的会话保存语义；Attended 初始类型为 Standalone Terminal。保存的同一 SN 类型优先于页面默认值。

本次是可逆的界面调整，无新增领域概念或架构决策；不新增 ADR 或术语。

## 验收

- Chrome 实际页面桌面与 390 × 844 手机尺寸已检查；两页桌面地图/详情顶部和硬件/类型卡底部差值均为 0px，手机单列无页面横向溢出。
- Service Uptime 保留七天彩色卡片；View history 与交易入口均为 40px；手机两列，日明细可正常打开关闭。
- Attended 的 TCI 参数展示、交易链接传递、类型编辑与刷新保存已验证。
- `npx playwright test tests/terminal-type-nayax.spec.js tests/terminal-tci-display.spec.js --reporter=line`：8 项通过。
- `node --check` 检查修改的脚本通过；`git diff --check` 通过。此次未部署。
