# Link renewal retains the existing URL and billing obligation

The no-automatic-retry restriction below is superseded by [ADR 0008](0008-catch-up-at-next-scheduled-installment.md), confirmed on 2026-09-09. Link renewal and payer-confirmed retry rules otherwise remain in force.

For ordinary link expiry, WizarPOS Provider operations renews the link by choosing a new expiry while retaining its existing URL, so the recipient can return to the original invitation. Renewal keeps the same Billing Record, contract dates and installment progress; it is unavailable for a paid bill, an already authorized bill, or a bill whose collection has been stopped. This extends ADR 0003's expiry rule without changing its separation between link validity and recurring collection authorization.

Renewal defaults to an expiry 30 days after the renewal date, which operations may change. Renew updates validity only; Renew & Send Link also sends the link to the confirmed recipient. The operation records the operator, time, and previous and new expiry. The two actions must have equal button heights.

A delayed first payment retains ADR 0002's original installment dates and oldest-first separate collection, stopping at the first failure. Before payer confirmation, checkout must show the number of installments to be collected now, their individual amounts and the total; renewal must not silently shift the contract dates.

Replacing a compromised link is a separate concern from ordinary renewal and is not included in this decision. Payment execution and email delivery retain the simulated boundary established by the existing demo decisions.

An existing authorization with a failed payment uses payer-confirmed Retry Payment rather than link renewal or repeated initial authorization. The retry collects due unpaid installments oldest first, stopping at the first failure, with no automatic retry, operator-triggered retry or card replacement in this iteration. This also applies when the first attempt failed after authorization was saved.

Overview presents collection status (Pending, Active, Overdue, Paid, Stopped) independently of link status (Valid, Expired, Used, Disabled) and the link expiry date. Used includes existing authorization even when the first payment failed; link expiry never revokes that authorization or stops its remaining collections.
