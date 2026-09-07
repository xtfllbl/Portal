# Recurring billing collects a fixed-term contract

Recurring billing represents a fixed number of monthly installments, not an indefinitely renewing subscription: a contract for EUR 200 per month over 24 months ends after all 24 installments have been paid. Although the existing prototype displays “Auto-renewal”, the user confirmed that collection must stop at the contract limit; future payment authorization wording and status handling must preserve that limit.

The first successful payment collects the first installment immediately, including when the configured contract start date is in the future. Remaining installment dates are anchored to Billing Start Date, not the actual payment date. Each installment has its own charge and payment record; overdue installments are collected oldest first as separate charges, stopping at the first failure. A failed charge retains the contract and authorization, does not increase paid installments, and is not automatically retried in this iteration. Short months use month-end without changing the original monthly anchor.

Portal and public checkout use the same authorization and installment state. Consent covers saving a payment method and the remaining fixed-term installments only, not renewal.
