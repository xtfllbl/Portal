# Customer Alerts 历史记录 Rule ID 补全

用户要求每条告警都必须有数字 Rule ID；空白或 `—` 不属于合法展示状态。

## 根因与修复

旧原型迁移恢复了历史告警的 Rule Owner，但将缺失的 `ruleId` 保留为空。旧版硬删除规则时也未保留规则引用。新增编号列只读取已有规则的 `ruleNumber`，因此两类记录都显示 `—`。

修复在编号分配之前补全关联：已知演示事件按条件、终端、触发时间和归属校验后复用规则；其他孤立历史记录保留原关联键，并创建只读归档引用。原规则无法恢复的记录不会套用其他客户的规则配置。所有引用再统一分配持久化数字编号，归档引用不启用监控、收件人或重复通知。历史状态、确认信息与时间线保留。

## 验证证据

- 最小复现命令：`npx playwright test tests/customer-alert-rule-id.spec.js -g 'legacy incident always' --workers=1 --repeat-each=2`。修复前连续两次失败，均为期望 `/^\d+$/`，实际 `"—"`；单例耗时约 0.8 秒。
- 单变量探针只补 `r-merchant-no-transaction` 关联后，显示 `100008` 并通过，确认问题位于缺失关联而非数字格式或样式。临时探针已移除。
- 修复后运行 `npx playwright test tests/customer-alert-rule-id.spec.js tests/customer-alert-owner-migration.spec.js tests/customer-alerts.spec.js --workers=2`，27 项通过。覆盖旧 source 保留／已移除、已删除规则、编号完整性、刷新幂等、原历史保留、归档搜索、跨页面一致性和原有 Alerts 行为。
- 在用户实际打开的 `http://127.0.0.1:5501/39.customer_alerts.html?role=operations-manager` 检查：30 条 Alerts，缺号为 0；终端页 13 条 Alerts，缺号为 0。原有数字编号未改变。
- 两页在桌面与 390 × 844 手机尺寸检查；新增归档引用可按数字 ID 搜索并只读查看。JavaScript 语法及 `git diff --check` 通过，无残留诊断日志。

本次为本地原型修复，未执行生产部署。
