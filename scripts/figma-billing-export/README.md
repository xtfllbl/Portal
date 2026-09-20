# Billing Figma 隔离捕获工具

运行 `python3 scripts/figma-billing-export/server.py`，然后打开 `http://localhost:8766/41.billing_setup.html?state=41-01`。其余页面使用对应 HTML 文件名和已确认的状态编号。

此服务只监听 127.0.0.1:8766。它在返回四个 Billing HTML 时临时注入导出脚本，不写入原型源文件。请只保留一个导出页面标签，避免此独立 origin 内的 localStorage 事件互相影响。不要改用原型日常开发端口。

- `clock.js`：固定时间，设置演示角色，重置此导出 origin 的账单演示数据。
- `fixtures.js`：通过现有 Billing Domain 创建固定账单和状态，付款 ID 固定化。43 使用本地演示链接；没有真实支付或邮件发送。
- `prepare.js`：通过现有页面控件进入每个状态。42-06 只在该导出页面内替换付款服务返回值，触发原有可见错误提示。
- `email.html`：44-10 代表收据的独立 HTML，按 798px 宽捕获后嵌入邮件查看器；此文件含官方捕获脚本，仅在带捕获参数时用于导出。

四页在 URL 带官方 `#figmacapture=...` 参数时加载 Figma 官方 capture.js。Capture ID 一次性使用；不要复用已提交的 ID。

以 1440 × 900 桌面视口、100% 缩放访问。等待 `html[data-export-ready]` 等于所选状态后捕获；若有 `data-export-error`，先排查，不提交错误画面。

30 个状态、已保存节点和待修差异见 [交付记录](../../docs/design/billing-figma/README.md)。已完成桌面本地整理，30 个画板结构检查通过，三个验证 PNG 已重点核对；全部状态最终视觉验收待完成。
