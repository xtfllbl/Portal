# Paywizard Portal

Paywizard Portal provides operational and customer-facing management for payment terminals and unattended machines.

## Language

**Billing Payment Receipt**:
A confirmation of one successful payment against a Billing Record, addressed to the payer email supplied at checkout. For fixed-term billing, each successful installment has its own receipt; full completion means all agreed installments have been paid.
_Avoid_: Payment link invitation, contract total, invoice payment request

**Local Billing Demo**:
The default and only selectable billing experience in the portal. Records and payment outcomes belong to the current browser; there is no demo-mode selector. Sharing a local demo link allows another browser to demonstrate the bill independently; it does not share an authoritative payment outcome.
_Avoid_: Shared billing state, real payment, synchronized payment link

**Shared Billing Demo**:
A simulated billing experience in which operations and external payers refer to one authoritative Billing Record across devices. Payment outcomes and fixed-term collection progress are shared, while payment execution remains simulated.
_Avoid_: Local Billing Demo, real payment processing

**Billing Record**:
A payment obligation collected as a one-time payment or a Fixed-term Billing Contract. It is either a Merchant Billing Record or a Standalone Billing Record.
_Avoid_: Payment Link, Payment Attempt

**Merchant Billing Record**:
A payment obligation assigned to a merchant, visible in the portal to that merchant's account users when such accounts exist. A payment through a shared link is recorded against this same obligation rather than creating a separate merchant billing record.
_Avoid_: Payment Link, Customer Alert

**Standalone Billing Record**:
A Billing Record created and managed by operations without assignment to a merchant or inclusion in a merchant's billing view, payable by an external customer through a Billing Payment Link. It supports both one-time payment and a Fixed-term Billing Contract.
_Avoid_: Unassigned merchant, temporary merchant, reusable checkout link

**Billing Payment Link**:
A shareable entry to the payment page for a specific Billing Record, provided by an operations user so the payer can pay without signing in to the portal.
_Avoid_: Portal login link, reusable product checkout link

**Public Billing Payment Page**:
A payer-facing page opened from a Billing Payment Link without portal sign-in, presenting the associated billing information and payment form.
_Avoid_: Platform Back-office Page, Public Onboarding Page

**Fixed-term Billing Contract**:
A payment obligation with an agreed monthly installment amount and a fixed number of installments, with or without merchant assignment. Collection ends when all agreed installments have been paid; the contract does not automatically renew.
_Avoid_: Indefinite subscription, auto-renewal

**Recurring Payment Authorization**:
A payer's explicit consent to retain a payment method and use it to collect the remaining scheduled installments of a Fixed-term Billing Contract. It does not authorize collection beyond the agreed contract term.
_Avoid_: Auto-renewal consent, saving a card number

**Billing Link Recipient**:
The email recipient chosen by an operations user when sending a Billing Payment Link. The recipient address does not determine or change the associated Billing Record's merchant assignment.
_Avoid_: Billing owner, merchant account identity

**Billing Payment Link Email**:
An email addressed to a Billing Link Recipient that provides the Billing Payment Link for a specific Billing Record and invites the recipient to review the bill and complete payment or recurring payment authorization. For a Merchant Billing Record, it also provides the merchant portal entry for account users to review and pay the same bill; a Standalone Billing Record has no merchant portal entry.
_Avoid_: Billing Payment Receipt, payment confirmation

**Billing Link Expiry**:
The end of the period during which a Billing Payment Link can be used for initial payment or recurring payment authorization. It does not end an existing Fixed-term Billing Contract or revoke an existing Recurring Payment Authorization.
_Avoid_: Contract end date, authorization cancellation

**Billing Overview**:
The operations view for managing issued Billing Records, including merchant and standalone obligations. Billing Setup handles creation and drafts; merchant users view their own bills through Billing & Payments.
_Avoid_: Payment attempt list, merchant billing view

**Billing Collection Stop**:
A permanent end to new collection attempts against a Billing Record, covering overdue and future installments while retaining successful payments and unpaid amounts in its history. It does not waive the underlying debt, mark unpaid amounts as paid, or automatically refund previous payments; an already submitted attempt may still settle.
_Avoid_: Temporary pause, payment completion, automatic refund

**Billing Link Renewal**:
An extension of a Billing Payment Link's validity that retains its existing URL and Billing Record. It does not create a new obligation, reset paid installments, or extend a Fixed-term Billing Contract.
_Avoid_: Contract renewal, new billing record, replacement payment link

**Billing Payment Retry**:
A platform-operations-confirmed attempt to collect due, unpaid installments using the payment method retained after the payer's first successful payment, under the existing Recurring Payment Authorization, oldest first and stopping at the first failure. It is unavailable to the payer or after Billing Collection Stop, does not change the retained card, and does not extend the contract.
_Avoid_: Payer-triggered retry, card replacement, automatic retry, link renewal

**Billing Collection Status**:
The collection state of an issued Billing Record: Pending before payment or authorization, Active for authorized installments proceeding normally, Overdue for overdue unpaid installments or failed collection, Paid when fully settled, or Stopped after Billing Collection Stop.
_Avoid_: Payment attempt result, link validity

**Billing Link Status**:
The payment entry's usability: Valid while available within its validity period, Expired after that period, Used after successful payment or recurring authorization, or Disabled after Billing Collection Stop. A Used link can present the bill's result without allowing duplicate initial payment or authorization.
_Avoid_: Billing Collection Status, recurring collection status

**Platform Back-office Page**:
A page used by authorized Paywizard operators or organization users to manage platform resources and workflows within the shared administrative navigation context.
_Avoid_: Public Onboarding Page, prototype index

**Public Onboarding Page**:
A customer- or merchant-facing page that supports lead submission, merchant application, or application-progress tracking without exposing the platform administrative navigation context.
_Avoid_: Platform Back-office Page

**Module Entry Page**:
The primary destination for a back-office module in shared navigation; detail, edit, and task pages remain part of the module but are not separate navigation destinations.
_Avoid_: every page in a module

**Portal Access Profile**:
A named presentation of portal visibility and interaction rules used to demonstrate a provider, merchant, or store experience. Provider profiles are WizarPOS Provider, Full-Service Provider, Attended Provider, and Unattended Provider; merchant profiles are Attended Merchant, Unattended Merchant, and Billing-only Merchant; store profiles are Attended Store and Unattended Store.
_Avoid_: Login Role, Security Role, Permission Set

**Attended Merchant**:
The Portal Access Profile for a merchant whose payment terminals are operated by an attendant, with access to its merchant-management experience and billing.
_Avoid_: Attended Provider, Service Provider

**Unattended Merchant**:
The Portal Access Profile for a merchant whose payment terminals operate without an attendant, with access to its merchant-management experience and billing.
_Avoid_: Unattended Provider, Service Provider

**Billing-only Merchant**:
The Portal Access Profile limited to viewing and paying the merchant's bills, without access to other portal modules.
_Avoid_: Read-only Merchant, External Payer

**Customer Account**:
A service provider, agent, merchant, or store account that forms an isolated ownership and access boundary for Customer Alerts. Paywizard operators select a Customer Account when performing Delegated Rule Creation; they do not assume that account's login role.
_Avoid_: Role Simulator, Monitoring Target

**Attended Store**:
The Portal Access Profile for a store whose payment terminals are operated by an attendant, with a narrower set of portal capabilities than its corresponding Attended Merchant profile.
_Avoid_: Attended Merchant, Attended Provider

**Unattended Store**:
The Portal Access Profile for a store whose payment terminals operate without an attendant, with a narrower set of portal capabilities than its corresponding Unattended Merchant profile.
_Avoid_: Unattended Merchant, Unattended Provider

**WizarPOS Provider**:
The Portal Access Profile representing a WizarPOS-exclusive service provider across attended terminals, unattended terminals, and card readers.
_Avoid_: Administrator, Superuser

**Full-Service Provider**:
The Portal Access Profile for an ordinary service provider operating both attended and unattended payment businesses. Its capabilities combine those of Attended Provider and Unattended Provider, without WizarPOS-exclusive capabilities.
_Avoid_: WizarPOS Provider, Administrator, All-access Provider

**Attended Provider**:
The Portal Access Profile representing an ordinary service provider whose payment terminals are operated by an attendant.
_Avoid_: Staffed Provider, Normal Provider

**Unattended Provider**:
The Portal Access Profile representing an ordinary service provider whose payment terminals operate without an attendant.
_Avoid_: Nayax Provider, Normal Provider

**Attended Terminal**:
A payment terminal operated in the presence of an attendant as part of the payment interaction.
_Avoid_: Staffed Terminal, Standard Terminal

**Unattended Terminal**:
A self-service payment terminal that completes payment interactions without an attendant.
_Avoid_: Nayax Terminal, Vending Terminal

**Card Reader**:
A payment-acceptance device managed separately from attended and unattended terminals in the portal.
_Avoid_: Attended Terminal, Unattended Terminal

**Role Simulator**:
A sales-demonstration control that applies a Portal Access Profile without asserting that the user has been authenticated or that access is securely enforced.
_Avoid_: Authentication, Authorization, Login

**Agent Analytics**:
A Platform Back-office Page that summarizes agent performance and the merchant activity attributed to agents.
_Avoid_: Agent Dashboard, Agent List Analytics

**Merchant Analytics**:
A Platform Back-office Page that summarizes merchant-network performance and compares individual merchants.
_Avoid_: Merchant Dashboard, Merchant List Analytics

**Prepaid Cards Module**:
A back-office module comprising Card List, Activation, Balance Adjustment, and Loss & Replacement. Card Details belongs to the Card List flow rather than being a separate navigation destination.
_Avoid_: single prepaid card page

**Customer Alert**:
An alert owned by a Customer Account and configured either by an authorized customer-side user or by a Paywizard operator through Delegated Rule Creation for resources within that owner's permitted scope.
_Avoid_: Customer SLA Alert

**Platform-managed Alert**:
A Paywizard-owned alert whose rule is hidden from customer organizations; a resulting incident appears in the customer portal only when Paywizard marks it Customer-visible.
_Avoid_: Customer Alert, Customer Rule

**Alert Rule**:
A single monitored condition applied to a single Monitoring Target, including the criteria for opening and recovering an Alert Incident.
_Avoid_: Multi-condition rule, Alert Incident

**Archived Alert Rule**:
A Customer Alert Rule retained for operational history after deletion and excluded from ordinary customer rule lists and future incident creation.
_Avoid_: Hard-deleted rule, Active Rule

**Monitoring Target**:
The resource whose state an Alert Rule evaluates; Customer Alerts supports one Store or one Terminal. Customer Accounts establish authorization and may own rules, but Service Providers, Agents, and Merchants are not Monitoring Targets.
_Avoid_: Recipient, Rule Owner

**Rule Owner**:
The service provider, agent, merchant, or store account selected as the owner of an Alert Rule. Rule ownership and management are isolated between accounts, including between a Store and its parent Merchant.
_Avoid_: Rule creator, Monitoring Target, Recipient

**Delegated Rule Creation**:
Creation of a Customer Alert by an authorized Paywizard operator on behalf of a selected Rule Owner. The selected service provider, agent, merchant, or store owns the rule; the operator remains the Rule Creator recorded for audit.
_Avoid_: Role Simulation, Platform-managed Alert

**Customer Alerts Operations Manager**:
A Paywizard operations access level that can manage Customer Alert Rules and Incidents across Customer Accounts while preserving each rule's selected Rule Owner and the real operator in its audit trail.
_Avoid_: Rule Owner, Customer Account administrator

**Alert Visibility Scope**:
The Merchant, Store, and Terminal subtree accessible from the user's current service provider, agent, merchant, or store role context; resources above or outside that context are not exposed.
_Avoid_: Monitoring Target, Rule Owner

**Rule Creator**:
The individual user recorded in the audit trail as creating an Alert Rule; creating a rule does not make it that user's personal property.
_Avoid_: Rule Owner

**Dynamic Store Target**:
A Store Monitoring Target that evaluates each terminal currently assigned to the Store, automatically includes future assignments, and stops evaluating terminals removed from the Store.
_Avoid_: Terminal snapshot, Store inventory aggregate

**Payment Service**:
The terminal service channel that represents connectivity to OPC; its unavailability is the customer-relevant offline condition.
_Avoid_: Device Connection, TMS connectivity

**Payment Service Offline**:
A Customer Alert condition indicating that the terminal's Payment Service is unavailable for the configured duration.
_Avoid_: OPC Offline, Device Connection

**On Hand**:
Paywizard's current count of sellable units in a BIN and the first-release inventory signal used by Customer Alerts.
_Avoid_: DEX product level

**Temperature Out of Range**:
A numeric-temperature condition available only when Paywizard has normalized readings for the Monitoring Target; its configured criteria are a Celsius or Fahrenheit unit plus lower and upper bounds.
_Avoid_: Refrigeration Fault, raw DEX event

**Refrigeration Fault**:
A device-reported cooling fault normalized by Paywizard into a customer-facing condition without exposing vendor or DEX event codes.
_Avoid_: Temperature Out of Range

**Alert Incident**:
One continuous occurrence of an Alert Rule's abnormal condition, tracked independently from other conditions on the same target.
_Avoid_: Alert Rule, Notification

**Incident Monitoring State**:
The observed condition state of an Alert Incident: Active, Resolved, or Closed; it is independent from whether a user has acknowledged the incident. An Incident remains Active while Recovery Checks are in progress and becomes Resolved only after the Recovery requirements are satisfied.
_Avoid_: Acknowledgement status, Rule status

**Customer-visible Incident**:
An Alert Incident that a customer user may view because that user is an intended recipient or Paywizard explicitly exposed a Platform-managed Alert Incident; visibility does not reveal the owning rule.
_Avoid_: Visible Alert Rule

**Notification**:
One delivery about an Alert Incident to a recipient through a configured channel.
_Avoid_: Alert Incident

**Acknowledgement**:
A customer user's confirmation that an Alert Incident has been seen; it does not change the Incident Monitoring State or mean that the condition has recovered.
_Avoid_: Recovery, Resolution

**Recovery**:
The observed return of an Alert Incident's monitored condition to normal.
_Avoid_: Acknowledgement

**Recovery Check**:
One monitoring evaluation that finds an Alert Incident's condition normal; consecutive Recovery Checks protect Resolution from transient signal changes.
_Avoid_: Acknowledgement, Manual Closure

**Resolution**:
The system-confirmed end of an Alert Incident after its configured Recovery requirements are satisfied.
_Avoid_: Manual Closure, Acknowledgement

**Manual Closure**:
An authorized user's decision to end handling of an Alert Incident without claiming that its monitored condition has recovered.
_Avoid_: Resolution, Recovery

**Contract Installment**:
A single monthly amount due under a Fixed-term Billing Contract, with its own service-anchored due date and payment outcome. Overdue installments remain separate obligations and are never combined into one charge.
_Avoid_: Combined arrears charge, entire contract payment

**Installment Payment Attempt**:
One attempted collection of one Contract Installment. Failed attempts do not count as paid installments; each successful attempt settles only its own installment.
_Avoid_: Contract completion, combined payment

**Installment Catch-up Collection**:
Collection of due, unpaid Contract Installments from the oldest to the current installment, as separate payments that stop at the first failure. It can occur automatically on a normal installment collection date or through a platform-operations-confirmed Billing Payment Retry; it does not collect future installments early or extend the contract.
_Avoid_: Combined arrears charge, contract renewal, daily automatic retry
