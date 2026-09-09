# Stopping collection permanently closes a bill to further payment

Operations needs to stop further collection against an issued Billing Record. The agreed action permanently stops subsequent collection, including payment through its existing link, instead of temporarily pausing automatic charges; it preserves successful payments, unpaid amounts and any previously recorded stop reason, does not mark the unpaid amounts as Paid, and does not automatically refund previous payments. This extends ADR 0003's earlier exclusion of subscription management with a narrowly scoped permanent collection stop, available to WizarPOS Provider alongside issued-bill management in Billing Overview.

Stopping collection immediately prevents new payment attempts. An attempt already submitted is allowed to settle, and its outcome remains recorded without automatic refund; a late success must not reopen collection. Confirmation shows the paid and remaining amounts and does not require a stop reason (updated by user request on 2026-09-09).

The stop covers both overdue installments and installments not yet due. Historical unpaid amounts remain visible, but this bill cannot collect them again; collection stop does not itself waive the underlying debt. Any subsequently agreed collection requires a new Billing Record.

Every issued, unsettled bill is eligible, including one-time bills, expired links, bills awaiting authorization and active or overdue installment contracts. Drafts and fully paid bills are ineligible. Stopped bills display Stopped in operations and a stopped result on their existing public payment page.
