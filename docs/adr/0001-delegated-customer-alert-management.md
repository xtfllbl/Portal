# Keep delegated Customer Alert management separate from SLA Alerts

Paywizard operations staff manage customer-owned Alert Rules through an all-customer mode of the Customer Alerts surface, while Platform-managed Rules and Incidents remain in SLA Alerts. A delegated rule is owned by the selected Service Provider, Agent, Merchant, or Store account and records the real Paywizard operator separately, avoiding both customer-role impersonation and accidental mixing of customer and platform alert ownership.

## Consequences

- Operations Viewer and Operations Manager are platform permissions, not Customer Accounts or selectable production roles.
- Customer Alert and SLA Alert lists remain separate even though they may share underlying monitoring infrastructure.
- Rule ownership requires stable account type and ID; names and the Role Simulator cannot enforce isolation.
- Store is a first-class Rule Owner but remains the only organizational type that may also be a Monitoring Target.
