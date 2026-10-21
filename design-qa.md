# 原型中心双平台入口验收

日期：2026-10-21。

## 设计依据与证据

- 用户选择第二组第一版，并要求移除内容区大标题、两处中文说明，实际调整页面并优化进入按钮。
- 精修参考：`/Users/beaver/.codex/generated_images/01a15d62-007b-7873-ac28-143e3621cc8e/exec-eab59138-c752-4eb4-9f99-e32c75f602c1.png`，1671 × 941 像素。
- 实际页面：`http://127.0.0.1:8876/#prototypes`。
- 主截图：[implementation.png](docs/design/prototype-hub/implementation.png)，1672 × 941 像素，CSS 视口 1672 × 941；截图与 CSS 为 1:1，无密度缩放，参考图宽度差 1 像素不作为偏差。
- 桌面补充：[implementation-1280.png](docs/design/prototype-hub/implementation-1280.png)，1280 × 800 像素及 CSS 视口；商户分组选中。
- 主状态：服务商分组，WizarPOS Provider 选中。参考与实现已在同一次图像检查中并列查看；完整截图中标题、角色、图标与按钮均可辨认，无需另裁局部图。

## 视觉检查

- 字体：沿用 Arial / PingFang SC；平台标题 30px，角色 16px，页签和按钮 14px；两侧标题同一基线，无名称截断。
- 布局：等宽双栏、24px 栏间距、32px 内边距；主视口卡片均为 662 × 458px。移除大标题及中文说明后收紧卡片高度，并在可用内容区内居中。
- 按钮：按本轮要求将参考图的通栏大按钮调整为 166 × 40px 短按钮，底部靠右，同一基线；保留深色主操作、右箭头、悬停、焦点、按下及跳转忙碌状态。减少动作占据的视觉面积属于本轮优化。
- 色彩：使用原有 `--ink`、`--blue`、`--line` 和白色表面；选中态以蓝色边框、淡蓝背景和原生单选状态共同表达。
- 素材：复用真实 PAYwizard Logo 和原有箭头 SVG。运维图标采用 Google Material Symbols Rounded 的官方 settings SVG，与项目图标体系一致，保留 Apache 2.0 授权文件；没有自绘图形或栅格占位。
- 文案：首页不展示需求卡片、需求搜索、大号“原型中心”或两处中文说明；头部导航“原型中心”保留。只保留两个平台名称、必要的角色类型、角色名称和进入按钮。
- 桌面：1672px 与 1280px 两档检查通过，1280px 下文档无横向溢出，四个商户名称均完整显示，两侧按钮均高 40px 且同一基线。

## 交互检查

- 10 种 Portal 身份全部通过实际浏览器选择、点击与落点检查；账单商户进入 `42.billing_payments.html`，其他身份进入 Transactions 并显示所选身份。
- Maintain 进入 Transactions，显示 WizarPOS Maintain 与运维导航。
- 角色分类支持鼠标和左右方向键、Home / End；角色使用原生 radio，跨分组保留各自选择。
- 明确进入平台时使用已有角色存储键，清除本标签页旧代入上下文，防止入口选择被旧会话覆盖；没有新增权限体系。
- “全部页面”搜索 `50.developer_manage` 返回正确页面；邮件搜索、支付成功收据选择及 iframe 预览检查通过。
- 本次浏览器开发日志未发现 error。存储被禁用的错误分支保留选择并定位、聚焦错误提示，但未在浏览器人为禁用存储验证。
- `node --check scripts/prototype-hub.js`、`git diff --check`、`npm run build` 通过。

## 组件映射

入口按钮、角色类型和角色单选分别对应 PrimeVue v4 Button、Tabs、RadioButton 模式，以现有静态 HTML/CSS/JavaScript 实现。角色卡片是 label + 原生 radio 的组合，整块可选。Tabs / RadioButton 官方页面本次访问不可用，键盘和选中行为按项目规范与原生控件实际核查；不宣称安装或使用了组件库。

## 修正记录与结论

- 首轮视觉检查发现旧 settings 素材是实心图标，与选定稿的线框风格不符；已替换为官方 Rounded 线框素材，并在最终截图复核。
- 参考稿的较大面板、字号和通栏按钮按本轮“界面也要调整、优化按钮”的要求有意收紧，保留已选择的信息架构和视觉方向。
- 无待修复 P0 / P1 / P2 问题；仅完成本地静态原型检查，未部署线上。

final result: passed
