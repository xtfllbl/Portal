---
status: accepted
---

# Scope related transactions to payment references

Paywizard manages payment transaction records. Related Transactions follows explicit references from a transaction to operations performed against it, including subsequent payment relationships. An external retail or restaurant order is not an aggregation boundary; shared order references, card details or amounts do not establish a payment relationship.

This boundary was confirmed on 2026-09-15. It preserves the meaning of payment relationships across integrations without requiring Paywizard to model retail orders or infer split payments. Existing implementation names such as `orderNo` do not introduce a retail-order domain concept. The Transactions list continues to show individual records with an entry to related records. Entering from any member exposes the full visible payment process, including its original transaction, sibling operations and later operations, while preserving each operation's direct target.
