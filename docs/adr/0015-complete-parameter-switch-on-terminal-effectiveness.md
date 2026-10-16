---
status: accepted
---

# Complete a parameter switch only after the terminal confirms effectiveness

For a terminal using a pooled Parameter Set, saving merchant-owned parameters or submitting a deployment request does not end the existing Parameter Usage Record. The switch completes only when the terminal confirms that the new parameters are effective; only then does the old usage end, its transactions become unavailable for merchant follow-up operations, and the usage await offline settlement confirmation.

This boundary was confirmed on 2026-10-16. It accepts a delay between submission and completion to avoid closing a usage while the terminal can still accept payments with the pooled parameters. Offline or failed deployments keep the previous usage active, and completion does not release the Parameter Set: confirmed merchant settlement remains the separate release condition. The static prototype's deployment-request alert is not evidence of terminal effectiveness; real terminal integration remains to be implemented.

Operator readiness is a manual decision. Online/offline status and transaction idleness do not gate submission in this version. This was explicitly confirmed in the second interview round on 2026-10-16. The prototype models a submitted request followed by a simulated applied receipt; it does not establish real terminal effectiveness.
