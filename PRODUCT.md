# PAYwizard Portal prototypes

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Paywizard operations uses Maintain to manage service providers and platform resources. Service providers, merchants and stores use their own Portal contexts. These interactive prototypes support product review and sales demonstrations.

## Product Purpose

Represent terminal-management and payment workflows with consistent, navigable desktop interfaces. Service-provider billing connects terminal events, agreed fees, operations review and quarterly customer payments.

## Capabilities and Constraints

Keep the existing static HTML/CSS/JavaScript architecture. Preserve the separate Maintain and Portal identities and each account's scope. This repository's payment execution is simulated; production integrations are not established by a prototype.

## Brand Commitments

Extend the existing PAYwizard interface and shared navigation. Follow AGENTS.md and docs/design/ui-standard.md. Do not introduce a new visual identity or migrate UI frameworks.

## Evidence on Hand

GLOSSARY.md defines domain terms. docs/adr/0018-provider-quarterly-billing-from-terminal-fees.md and docs/adr/0019-allow-operations-to-revise-unpaid-provider-bills.md record the user-confirmed billing rules. Existing Billing and Payment Channel pages supply reusable controls and checkout styling.

## Accessibility & Inclusion

Desktop keyboard interaction, visible focus, searchable selectors and visible, focused validation errors are required by the project UI rules. Mobile-browser verification is outside this project's requested scope.
