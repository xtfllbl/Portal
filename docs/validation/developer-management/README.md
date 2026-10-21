# 开发者账号管理验收记录

日期：2026-10-21。

## 范围与结果

MAINTAIN → Developer Manage 已接入共享 Portal 框架。四个页面入口为：

- `50.developer_manage.html`：账号列表、筛选分页、新增编辑、密钥显隐、重发和重置。
- `50.developer_binding.html`：`kind=merchant` 为商户绑定，`kind=plat` 为服务商／代理商绑定。
- `50.developer_allowlist.html`：IP 列表、新增删除，与账号编辑共用同一份白名单。
- `50.developer_token.html`：商户 Terminal／ECOMM Token 与平台 Token 的显隐、重置和发送。

新增三个身份字段锁定、自动绑定、所属服务商候选范围、非独占绑定、共享 Token 和邮件模拟均按[复刻说明](../../design/developer-management-replica.md)实现。白名单两入口按用户确认统一 IPv4、重复项及最后一条地址保护规则。编辑仅提交可编辑信息，不能以旧表单快照恢复已经重置的 Client Secret。

## 自动验证

- `tests/developer-management.spec.js`：10 项通过，最终候选分页补齐后重新执行通过。
- `tests/payment-channel-maintain.spec.js`：13 项回归通过，覆盖共享选择器原有单多选、搜索、键盘、低窗口定位、失败保留等行为。
- `npm run build`：通过，四个页面及其资源已进入 `dist/`。
- 新增脚本的 `node --check`、`git diff --check`：通过。

功能测试还覆盖账号重复、创建自动绑定、创建后只读身份、两类 Token、取消重置、跨开发者共享重置、白名单双入口同步、取消未保存修改、候选跨搜索及跨页保留、全选跳过当前绑定、空结果、写入失败保留输入、错误聚焦、失效 URL 和非运维展示身份的导航限制。

标准复跑命令如下；项目测试配置会自行启动 8765 端口的服务器，执行前需先停止同端口的开发预览。本轮使用临时测试配置复用已有预览服务器，不修改仓库测试服务器设置。

```sh
npx playwright test tests/developer-management.spec.js tests/payment-channel-maintain.spec.js
npm run build
```

## 桌面页面检查

在 Chrome 实际打开账号列表、新增弹窗、商户绑定、平台绑定、商户 Token、平台 Token 和白名单页面。检查了 34px／11px 表头、36px 行操作、40px 表单按钮、菜单定位、服务商搜索键盘选择、已选与禁选状态、共享 Token 提示和错误位置。

实际页面检查发现并修正了弹窗表格未继承黑色背景的问题，以及密钥文本的逐行滚动条。自动测试另外以 1366×720 桌面视口检查底部选择器和错误提示位于可视范围、固定操作区仍可操作。未进行手机浏览器检查。

截图：

- [列表与更多菜单](list-menu.png)
- [新增开发者](add-developer.png)
- [商户绑定与已选状态](bind-merchant.png)
- [删除最后一条 IP 的错误定位](allowlist-error.png)

## 验证边界

状态仅保存在本地浏览器，示例账号使用虚构邮箱与演示凭证。发送操作写入本地模拟记录并明确反馈未发送真实邮件；未调用运维生产接口。新商户创建链路不在本次范围，两个 Auto Send 选项仅保存其已确认的邮件偏好。展示身份限制不代表服务端鉴权已验收。未执行生产发布。
