# 商户自有参数切换验证

日期：2026-10-16。独立预览 origin `http://127.0.0.1:8768`，未修改用户正在使用的 5503 origin 数据。桌面 Chrome 原生窗口，未设置移动端视口。

## 实际页面验证

- 从示例商户 Downtown Location 的 Add Device 创建 NUVEI UPT 资源终端，单选 Nuvei UPT 01，保存后返回 Devices 可检索到新终端。
- 从该行 Settings → Edit Params 进入原 Device Settings。显示 Parameter Pool／参数集名称和 Switch to Merchant Parameters，57 字段从原资源读取且只读，应用版本仍独立可选。
- 点击切换：MID／TID／Merchant Name 为空，Country Code 保持模板默认 124；取消后恢复原 MID 和只读状态。
- 未填 MID 提交，错误自动滚动定位并聚焦。填新 MID／TID 后打开原下发框，取消确认保留输入。取消勾选 Payment Parameters 时阻止切换并保留输入。
- 确认提交后显示 Waiting for terminal confirmation；模拟回执后显示 Merchant Parameters，刷新仍保留新 MID。
- 同一 TCI、商户、门店和 SN 保留。旧使用记录保留原 MID／TID，并出现结束时间及 Awaiting Settlement；手动确认出账后资源 Available、旧记录 Settled、终端仍使用 merchant 来源。
- 新建商户页面用临时本地合成商户／门店配置检查：Devices 显示资源终端，Edit Params 携带 merchantId／storeId／TCI／版本，Back 返回正确商户。检查后已恢复临时 fixture。
- 确认框显示新 MID／TID 和生效后旧交易只读、待出账的说明；无在线／空闲条件或演示状态开关。
- 修改页面未出现 JavaScript error。示例列表未知设备状态不伪造为 Online，也不作为切换提交条件。

截图：[入口](entry.png)、[商户参数生效后](merchant-parameters.png)、[下发确认](confirm.png)。

## 代码检查

- `node --test tests/unit/parameter-pool.test.cjs`：10 项通过。
- 新增状态测试覆盖提交不结束使用、失败保留原参数、成功冻结且不提前释放、重复回执、过期回执、不同商户不能切换、确认出账再分配及旧交易隔离。
- 原测试保留 57 字段校验、资源排他、版本清理、全量 CSV、并发分配及本地保存失败。
- `node scripts/build-static.mjs`：通过。
- 3 个修改 HTML 的内联脚本和 5 个资源脚本语法解析通过；`git diff --check` 通过。

## 验证边界

这是一套浏览器本地存储原型。提交后的成功回执由独立 1.2 秒计时器模拟，失败回执仅测试数据模型，没有连接终端或 Nuvei。旧记录页面只读展示和 usage 归属可在原型中验证；生产退款／撤销／补结算等接口的冻结、商户权限与迟到交易归属需要服务端实现，本轮未接入现有独立模拟交易页。

本轮未新增门店自动配置渠道、真实对账、费用计算、付款或在线检测。测试中没有真实交易或付款。
