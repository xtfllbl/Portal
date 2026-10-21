# Test Cards 原型实施与验证

日期：2026-10-21。范围：静态桌面原型及浏览器本地交互。

## 第二轮修正与当前验收

本轮完成用户确认的三项修正：

- 卡列表只保留面板内一个 Test Card List 标题，Add New Card、Import Cards、Export Cards 同行排列；删除卡列表 Records 徽标，底部分页继续显示数量。
- Card Details 复用 `19.prepaid_card_detail.html` 的单一白色面板、内部返回／标题、四格灰底摘要、页签、表单和右上 Save。提取共享 `styles/prepaid-card-detail-shared.css`，原储值卡详情也接入同一份样式；不改变原页业务。保留测试卡已确认的字段精简、厂商编辑及币种／余额只读行为。
- Save 只在 General 有实际改动时出现；改回原值即隐藏，切到其他页签隐藏，保存后清除未保存状态。原页有效期快捷操作沿用；错误仍在真实滚动区域内显示并聚焦。
- 删除测试交易详情文件、渲染逻辑、Shell 登记、原型中心入口；独立交易列表及卡内 Transactions 的交易号均为普通文本，无替代弹窗或抽屉。原型中心保留五个页面。

列表命名已按最新要求统一为 Test Card List，涵盖主标题、侧栏子菜单、面包屑、浏览器标题及原型中心入口；正式储值卡的 Card List 保持原名。

当前验证：

- `npx playwright test --config=playwright.test-cards.config.cjs --reporter=line`：9 项通过。包含单标题和无徽标、与原卡详情实际计算样式逐项对照、原页接入共享样式前后不变、保存显隐／持久化、页签键盘、厂商编辑、错误定位、所有交易列表无详情入口，以及五个路由加载。
- 详情参考页在对照时禁用新增共享样式，直接以原有 CSS 为依据，避免两页因同一新增样式同时偏离参考。控件沿用现有 Select、Tabs、Button 模式；本轮恢复原页组合结构，不增加 UI 框架或新组件模式。
- Chrome 实际打开卡列表、卡详情、厂商搜索浮层、卡内交易和独立交易列表；核对标题、摘要、控件和交易号呈现。自动化对照视口为 1440×1000，仅验收桌面浏览器。
- `node --test tests/unit/test-card-store.test.cjs`：7 项通过。`npm run build`、JavaScript 语法检查、`git diff --check` 通过；构建产物中已无交易详情文件及入口。本轮未部署。

截图：[卡列表](card-list-refined.png)、[卡详情](card-detail-refined.png)、[原储值卡详情基线](prepaid-card-detail-reference.png)、[交易列表](transactions-refined.png)。最新范围见[第二轮修正](../../design/test-card-system.md#2026-10-21-第二轮视觉与范围修正)。

下面保留此前版本的实施与测试记录，其中交易详情及双标题相关内容已被本轮决定替代，不作为当前功能范围。

## 首轮列表视觉修正记录

本轮按用户最新确认的视觉基线完成修正：

- 菜单与导航模块名为 Test Cards，删除卡列表上方全部统计及对应代码、样式。
- 卡列表与 Prepaid Cards 使用同一份 `styles/prepaid-card-list-shared.css`：13px 正文、蓝色加粗 UID、12px 加粗显示卡号、金额／币种双行、自动列布局、原状态和行操作。筛选取消额外上方标签，沿用原控件样式，保留测试卡已确认字段。
- 交易列表与现有 Transactions 使用 `styles/transaction-list-shared.css`：内容面板内只有一个 Transactions 标题、12px 正文、50px 单元格、按字段最小宽度布局。现有筛选和只读详情保留。
- 参考源页仅接入共享列表样式及其作用域类，视觉、数据和交互保留。业务数据仍然独立。
- 测试时，参考页禁用新增共享样式文件，使用其原有样式进行比较，避免两页同时受同一错误样式影响。核对字体、字号、字重、颜色、内边距、行距、列布局和操作尺寸，替代首轮仅检查 34px／11px 表头的不足。
- Chromium 在相同 1440×1000 桌面视口完成对照与流程验证；Chrome 实际打开两张修正页面，检查菜单、无统计、单标题、表格和筛选。

`npx playwright test --config=playwright.test-cards.config.cjs --reporter=line`：8 项通过。`npm run build`、JavaScript 语法检查和 `git diff --check` 通过。

当轮截图：[卡列表](card-list-refined.png)、[交易列表](transactions-refined.png)、[只读交易详情](transaction-detail-refined.png)。上述是原型视觉和交互证据，尚未接入真实 TMS 或交易后台，本轮未部署。

## 首轮实施历史记录

以下保留首轮实施、测试与截图记录。旧版菜单、统计和表格尺寸已被本轮要求替代；旧截图和尺寸测试不作为当前视觉验收依据。新要求见[设计基线](../../design/test-card-system.md#2026-10-21-列表视觉修正)。

## 页面与入口

运维平台 TEST CARD 菜单包含 Card List、Activation、Balance Adjustment、Transactions；原型中心也提供“厂商测试卡”入口。

| 页面 | 文件 |
| --- | --- |
| 卡列表 | `51.test_card_list.html` |
| 单卡开卡／批量导入 | `51.test_card_activation.html` |
| 卡详情 | `51.test_card_detail.html?card=04A37C91B25F80` |
| 余额调整 | `51.test_card_adjustment.html` |
| 测试交易查询 | `51.test_card_transactions.html` |
| 只读交易详情 | `51.test_card_transaction_detail.html?id=TC-20261021-001` |

## 实施范围

- 独立测试卡存储键 `paywizard-test-cards-v1`，不读取或写入正式储值卡／交易数据。运维角色展示遵循共享平台原型规则，不构成服务端权限证明。
- 单卡开卡、编辑厂商／状态／有效期、初始额度、余额增减及历史记录均可操作并跨页面和刷新保留。
- 修改厂商保留卡号、币种和余额；测试交易保留发生时的厂商。归属版本可识别改换厂商后又改回的情况，防止旧交易被重新解释为可操作交易。
- CSV 模板下载、文件选择、解析、逐行校验、仅导入有效行，以及当前筛选卡列表 CSV 导出可用；导出对电子表格公式前缀转义。
- 批量导入每批统一一家厂商。Partner 原型与测试卡共同使用 `scripts/partner-catalog.js`，顶层 UPT 厂商新增和编辑可在两处复用；PSP 和下级代理不出现在厂商选择中。
- Transactions 只提供筛选、分页、只读详情、失败原因和显式关联交易，没有后台金融交易发起按钮，也没有额外增加交易导出。
- 终端曾在厂商库存出现、最近厂商归属、贸易商流转、曾绑定门店及旧交易后续操作规则，以原型数据模型和受理规则函数表达，并有独立测试；没有新增交易模拟入口或设备操作入口。
- 采用整数分处理余额；重复 UID、额度为负、过期时间早于激活时间、无效厂商和过时编辑等会拒绝保存。错误在实际滚动容器中定位并聚焦，保留用户输入。

## 组件与桌面检查

- 厂商、状态、币种、交易类型和结果沿用现有 `payment-channel-picker.js` 的 Select 模式，支持点选、搜索、键盘和 top-layer 弹层；修正了向上展开后搜索缩短列表时弹层不重新定位的问题。
- 表格／分页沿用 DataTable／Paginator 模式；项目定制为 34px 黑色表头、11px 表头文字、36px 行操作、40px 表单及筛选操作。
- General／History／Transactions 和 Single Card／Batch Import 使用 Tabs 模式，支持左右方向键、Home、End；余额调整确认采用原生模态 Dialog 并沿用项目样式。
- 本轮 PrimeVue v4 官方文档抓取未成功，实际复用项目已验证组件模式；未安装 UI 框架，未声称与某个研发组件小版本完全一致。
- Chromium 1440×1000 检查全部六页，Chrome 桌面实看列表、精简开卡表单及厂商搜索弹层；检查表头、按钮尺寸、厂商选中状态、空结果、错误定位和只读详情。仅验收桌面。

截图：[卡列表](card-list.png)、[开卡](activation.png)、[余额调整](balance-adjustment.png)、[交易列表](transactions.png)、[交易详情](transaction-detail.png)。截图反映各自验收用浏览器状态，并非真实测试交易。

## 自动化验证

- `node --test tests/unit/test-card-store.test.cjs`：7 项通过。
- `npx playwright test --config=playwright.test-cards.config.cjs --reporter=line`：8 项通过。
- 检查范围涵盖厂商目录复用、贸易商流转、最近厂商、门店绑定后失效、归属变更历史、精确余额计算、过时保存、CSV 导入导出、只读查询、关联交易、错误定位及页面尺寸。
- `npm run build`、JavaScript 语法检查和 `git diff --check` 通过。
- 另外抽查共享组件相关旧回归：支付渠道的地区搜索／键盘、多选 Cross 下拉、低视口弹层，开发者低视口弹窗，以及正式卡汇总币种联动和状态保存，共 6 项通过。

原 Partner 回归测试另有 3 项失败：面包屑大小写、以 Enter 触发 SN 筛选、旧样本状态类名／数量断言。将 `HEAD:26.partner_information.html` 原文通过测试路由返回后，同样 3 项失败，剩余 1 项通过；因此记录为原有基线差异，未为本次功能修改原 Partner 的交互或旧测试期望。

正式卡旧回归 `Card List action deep links select the intended prepaid card` 也失败：卡号已带入正式交易筛选，但旧交易样本返回 0 行；测试路由切回 `HEAD:scripts/platform-admin-shell.js` 后，同一断言仍失败。本次 TEST CARD 的卡片定向查询有独立通过的验证，不修改正式交易样本以迎合该旧断言。

## 证据边界

已验证的是浏览器原型行为。真实扣款／出货、终端协议、TMS 库存历史、服务端厂商隔离、门店绑定切换、交易幂等与并发、真实退款／冲正及统计排除尚待后台和终端实现及联调。本次没有生产部署。
