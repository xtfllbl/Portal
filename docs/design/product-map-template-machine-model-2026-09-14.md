# Product Map Template：编辑 Machine Model

2026-09-14，用户确认以下规则。

- 在 Product Map Templates → Edit Details 中，Machine Model 支持自由文本输入，不使用型号枚举。
- 必填，最多 100 字符；保存时去掉首尾空格并转成大写。
- 点击 Save 后，列表、详情和搜索使用新型号；刷新后保留结果。
- 输入为空或超长时阻止保存，在型号字段下显示原因，自动滚动定位并聚焦字段，保留其他输入。
- Cancel 放弃本次编辑。
- 修改型号保留模板 BIN 内容、来源终端及已应用到终端的 Product Map。
- 保持当前终端导入行为：展示所有模板，不新增型号匹配限制。

实现位于 `36.product_map_templates.html` 和 `scripts/product-catalog.js`。持久化沿用当前浏览器原型存储，不代表后端同步或设备下发。

术语记录在根 `CONTEXT.md`；此项为可逆的表单编辑调整，不新增 ADR。

## 验证

- 桌面 Chrome（1710 × 952）实际页面：空格输入阻止保存，错误与焦点位于 Machine Model，描述草稿保留；`  b5x  ` 保存为 `B5X`，刷新和型号搜索正确；改成 `B7X` 后 Cancel 仍为 `B5X`。
- 独立数据检查通过：必填、100/101 字符边界、大小写规范化、刷新持久化、BIN 与来源终端及既有终端 Product Map 保持不变、无型号参数的导入仍可用。
- `npm run build`、`git diff --check` 通过。
- 已有 Playwright 用例运行结果：参数模板保存通过；型号导入用例失败于 `tests/products-product-map.spec.js:591`。该用例点击 Import Template 后立即期待导入完成，未处理当前页面已有的 Overwrite Product Map? 确认弹窗。终端页面和该测试文件均未在此次修改。
