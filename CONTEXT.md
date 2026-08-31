# Paywizard Portal

Paywizard Portal provides operational and customer-facing management for payment terminals and unattended machines.

## Language

**Platform Back-office Page**:
A page used by authorized Paywizard operators or organization users to manage platform resources and workflows within the shared administrative navigation context.
_Avoid_: Public Onboarding Page, prototype index

**Public Onboarding Page**:
A customer- or merchant-facing page that supports lead submission, merchant application, or application-progress tracking without exposing the platform administrative navigation context.
_Avoid_: Platform Back-office Page

**Module Entry Page**:
The primary destination for a back-office module in shared navigation; detail, edit, and task pages remain part of the module but are not separate navigation destinations.
_Avoid_: every page in a module

**Prepaid Cards Module**:
A back-office module comprising Card List, Activation, Balance Adjustment, and Loss & Replacement. Card Details belongs to the Card List flow rather than being a separate navigation destination.
_Avoid_: single prepaid card page

**Customer Alert**:
An alert owned and configured by an authorized customer-side user for resources within that user's permitted scope.
_Avoid_: Customer SLA Alert

**Platform-managed Alert**:
A Paywizard-owned alert whose rule is hidden from customer organizations; a resulting incident appears in the customer portal only when Paywizard marks it Customer-visible.
_Avoid_: Customer Alert, Customer Rule

**Alert Rule**:
A single monitored condition applied to a single Monitoring Target, including the criteria for opening and recovering an Alert Incident.
_Avoid_: Multi-condition rule, Alert Incident

**Monitoring Target**:
The resource whose state an Alert Rule evaluates; Customer Alerts supports a Merchant, a Store, or one Terminal.
_Avoid_: Recipient, Rule Owner

**Rule Owner**:
The service provider, agent, or merchant organization that controls an Alert Rule through users granted Manage Alerts permission.
_Avoid_: Rule creator, Monitoring Target, Recipient

**Alert Visibility Scope**:
The Merchant, Store, and Terminal subtree accessible from the user's current service provider, agent, merchant, or store role context; resources above or outside that context are not exposed.
_Avoid_: Monitoring Target, Rule Owner

**Rule Creator**:
The individual user recorded in the audit trail as creating an Alert Rule; creating a rule does not make it that user's personal property.
_Avoid_: Rule Owner

**Dynamic Store Target**:
A Store Monitoring Target that evaluates each terminal currently assigned to the Store, automatically includes future assignments, and stops evaluating terminals removed from the Store.
_Avoid_: Terminal snapshot, Store inventory aggregate

**Dynamic Merchant Target**:
A Merchant Monitoring Target that evaluates each terminal currently assigned through any of the Merchant's Stores, automatically following future Store and Terminal assignments.
_Avoid_: Merchant snapshot, fixed terminal list

**Payment Service**:
The terminal service channel that represents connectivity to OPC; its unavailability is the customer-relevant offline condition.
_Avoid_: Device Connection, TMS connectivity

**On Hand**:
Paywizard's current count of sellable units in a BIN and the first-release inventory signal used by Customer Alerts.
_Avoid_: DEX product level

**Temperature Out of Range**:
A numeric-temperature condition available only when Paywizard has normalized readings for the Monitoring Target; it opens after the configured range and sustained-duration criteria are observed.
_Avoid_: Refrigeration Fault, raw DEX event

**Refrigeration Fault**:
A device-reported cooling fault normalized by Paywizard into a customer-facing condition without exposing vendor or DEX event codes.
_Avoid_: Temperature Out of Range, Temperature Data Unavailable

**Temperature Data Unavailable**:
A condition indicating that temperature readings or the temperature sensor are unavailable beyond the expected reporting interval.
_Avoid_: Temperature Out of Range, Refrigeration Fault

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
