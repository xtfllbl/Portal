# 终端分配入口审查

日期：2026-10-10。目的：区分物理终端分配、已有配置绑定和硬件入库，避免重复配置能力。

## 已确认

- **Terminal Assignment**：将物理 S/N 分配到商户／门店。Leads 的 Assign/New Merchant 属于此类，新增具体 Terminal Scenario 和两个 SUPPORT 开关。
- **Terminal Configuration Binding**：把已有 TCI 配置关联到 S/N。商户详情 Assign Terminal 属于此类，删除能力快捷开关，能力仍由配置页编辑。
- Leads 使用一组设置应用到本批选中 S/N。场景初始为空且必选，六种场景及默认值、联动规则与完整配置页一致，已分配终端保持原设置。

## 其他入口：复核及用户决定

| 入口 | 当前行为与缺口 | 建议 | 状态 |
| --- | --- | --- | --- |
| Device Management 总览残留 Create Terminal | 旧 `#addTerminalBtn` / `#addTerminalModal` / `#addTerminalForm` 仍在代码，但页面 CSS 将祖先 `.hero-actions` 设为 `display: none !important`；Chrome 实际按钮宽高为 0，无可见入口 | 从可达候选中撤下，不自行恢复 | 已向用户更正，未修改 |
| Attended / Unattended 终端详情 → Basic Information → Terminal Type 编辑 | 原来有场景编辑，未联动新能力；`1.terminalmanage.html`、`1.terminalmanage_nayax.html`、`scripts/terminal-type.js` | 统一场景编辑及两个能力开关 | 已实施；用户确认 Save 一起保存、Cancel 放弃 |

## 已核对的其他入口

| 入口 | 结论 |
| --- | --- |
| Device Management Terminal List → 未激活 S/N → Bind → Bind to Store | 选择商户／门店后跳到 `5.merchant_add_device_iso.html`，下一页已有场景与能力，弹窗无需重复 |
| Merchant Detail（含 No Store）→ Add Device | 进入同一完整配置页，已有三项 |
| Add Merchant → Device 步骤 | 已有 S/N、场景与能力 |
| Add Merchant 的 merchant-only 模式 | 只创建商户，未分配 S/N |
| Add Store → Quick Terminal Payment Setup | 选择支付通道／MID，未分配硬件 |
| Merchant Detail → Assign Terminal / Replace Terminal | 绑定／换绑已有 TCI 配置，能力由配置页维护 |
| Device Settings → 输入 S/N → Assign & Deploy | 完整配置页内执行绑定，场景与能力已存在 |
| Partners → Terminal List → Transfer Terminal | 将库存终端转给 Partner，未分配到商户／门店 |
| Leads → PSP 页签 | 现有动作只有 View Detail，无 Assign/New Merchant |
| Leads → Onboard → `38.Merchant_onboard.html` | 创建商户申请，独立于终端 S/N 分配 |
| Partners / Leads → Sharing Landing Page | 收集终端 S/N 和申请资料，未直接分配到 Portal 商户／门店 |
| `old/` 旧页面及商户详情旧 device-modal | 当前导航无可达的有效分配行为，不列作本次候选 |

首次只读检查把隐藏 Create Terminal 残留误列作候选；用户反馈找不到后，源码和实际 Chrome 复核确认不可见，已撤回。审查覆盖可达页面及相关提交处理。未恢复隐藏入口，也未改库存流转或公开资料表单；暂不创建 ADR，本次取舍可逆且没有架构迁移。
