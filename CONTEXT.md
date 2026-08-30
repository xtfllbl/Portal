# Paywizard Portal

Paywizard Portal provides operational and customer-facing management for payment terminals and unattended machines.

## Language

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
The resource whose state an Alert Rule evaluates; the first customer-alert release supports a Store or one Terminal.
_Avoid_: Recipient, Rule Owner

**Rule Owner**:
The service provider, agent, or merchant organization that controls an Alert Rule through users granted Manage Alerts permission.
_Avoid_: Rule creator, Monitoring Target, Recipient

**Rule Creator**:
The individual user recorded in the audit trail as creating an Alert Rule; creating a rule does not make it that user's personal property.
_Avoid_: Rule Owner

**Dynamic Store Target**:
A Store Monitoring Target that evaluates each terminal currently assigned to the Store, automatically includes future assignments, and stops evaluating terminals removed from the Store.
_Avoid_: Terminal snapshot, Store inventory aggregate

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

**Customer-visible Incident**:
An Alert Incident that a customer user may view because that user is an intended recipient or Paywizard explicitly exposed a Platform-managed Alert Incident; visibility does not reveal the owning rule.
_Avoid_: Visible Alert Rule

**Notification**:
One delivery about an Alert Incident to a recipient through a configured channel.
_Avoid_: Alert Incident

**Acknowledgement**:
A customer user's confirmation that an open Alert Incident has been seen; it does not mean that the monitored condition has recovered.
_Avoid_: Recovery, Resolution

**Recovery**:
The observed return of an Alert Incident's monitored condition to normal.
_Avoid_: Acknowledgement
