# 切换前确认与来源行强调

2026-10-16，桌面 Chrome，独立 localhost:8768 测试，未改用户现用 5503 origin 的数据。

- Parameter Source、Parameter Pool、Nuvei UPT 08 实测均为 16px；来源值加粗。
- 静态提示及 View usage record 已移除，平时不留提示占位；下发后的等待回执状态仍可显示。
- 点击 Switch to Merchant Parameters 先打开原生模态 dialog，复用原页确认框视觉。内容询问是否已取得商户正式参数，并说明提交且生效后原参数集进入 Awaiting Settlement、确认出账后才能复用。
- Cancel 和 Esc 实测关闭弹窗，MID 保持 DEMO00000008 且只读；确认后 MID 清空为模板默认值、字段开放编辑；Cancel Switch 恢复原参数。
- 进入和取消编辑不创建下发请求，资源及使用记录仍为 in_use。未更改此前的生效回执和结算边界。
- 页面无 JavaScript error，脚本语法检查、静态构建和 git diff --check 通过。
- 测试 fixture 已恢复；没有真实终端下发或交易。本轮为界面交互调整，未新增重复实现的单元测试。

截图：[来源行](source-row.png)、[正式参数确认弹窗](confirmation.png)。
