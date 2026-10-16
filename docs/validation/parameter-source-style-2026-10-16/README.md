# 预配置标识与商户编辑态验证

2026-10-16，桌面 Chrome，独立 localhost:8768 合成 fixture。

- 资源池态使用浅灰横条、配置图标、Preconfigured Parameters 状态标识及 Nuvei UPT 08 名称。标识 12px／600，名称 13px／600，沿用页面灰色边框、黑色正文和 40px 操作按钮；移除 Parameter Source 三段放大文案。
- 确认已取得正式参数并进入编辑后，整个来源横条隐藏，旧名称同时清空；页面不显示 Merchant Parameters — Editing。Cancel Switch 位于 Processor Parameters 标题右侧，参数表单可编辑。
- 取消编辑恢复 Nuvei UPT 08 标识、原 MID 和只读字段。
- 必填校验出错时，来源横条继续隐藏，错误提示正常显示并获焦；提交后正常显示等待回执进度。
- 终端模拟回执完成后，商户参数状态同样隐藏预配置标识。
- 前置确认、手工判断时机、下发及待出账状态模型未改变。本轮未新增单元测试；脚本语法检查、静态构建、git diff --check 通过。
- 测试数据已恢复，没有真实终端下发或支付操作。

截图：[预配置状态](preconfigured.png)、[商户参数编辑状态](merchant-editing.png)。
