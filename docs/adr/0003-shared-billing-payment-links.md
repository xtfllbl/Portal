# Public payment links and portal views share billing state

The prototype must support sharing a billing payment link to another device and reflecting the payment result in the merchant's existing portal bill. Public checkout and portal payment therefore refer to the same merchant billing record in shared persistence; per-browser storage or an independent bill snapshot in the URL cannot be the authoritative payment state.

Payment execution and email delivery remain simulated in this iteration. The local prototype uses shared SQLite persistence behind the Vite server; an Internet hosting target remains unselected; full subscription management is outside this iteration's scope.

Possession of the link permits viewing and paying its specific bill without merchant identity verification, including payment by a merchant's finance colleague. It grants no access to other bills or portal functions, and the payer's contact email does not change bill ownership.

Payment Link Expire Date is configurable. Expiry prevents initial payment or authorization but does not cancel an existing recurring authorization or its subsequent collections. Reopening a paid or authorized link shows the corresponding result rather than allowing duplicate payment or authorization.
