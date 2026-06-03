# WI-PAY-LIFECYCLE — keep subscriptions in sync with Stripe over time

## Goal
The local `Subscription` row stays accurate for the whole life of a Stripe subscription —
renewals extend it, failed payments and cancellations update its status — not just at the
first checkout.

## Context
WI-PAY handles only the **initial** payment: the webhook at
`src/app/api/webhooks/stripe/route.ts` reacts to `checkout.session.completed` and writes a
`Subscription` with `status="active"` and `expiresAt = now + 30 days`. After that, Stripe
keeps charging the card monthly and emits further events that are currently ignored, so the
local DB drifts from Stripe (the source of truth):

- a successful renewal (`invoice.paid`) is not reflected, so `expiresAt` lapses and
  `isSubscribed()` wrongly returns false for a paying subscriber;
- a failed renewal (`invoice.payment_failed`) never sets `status="past_due"`;
- a cancellation (`customer.subscription.deleted`) never sets `status="canceled"`, so
  access continues after the subscription ends.

The schema already has the fields needed: `Subscription.status`
(`active | canceled | past_due`) and `Subscription.stripeSubscriptionId` (the match key).
Tips are one-time payments and have no lifecycle — they are out of scope.

Next.js 16 is non-standard here — read `AGENTS.md`. The webhook needs the raw request body
for signature verification (already handled via `req.text()`); do not change that.

## Allowed scope (may edit)
- `src/app/api/webhooks/stripe/route.ts` (add handlers for the new event types)
- `src/lib/subscriptions.ts` (only if `isSubscribed` needs to also respect
  `status` — e.g. treat `canceled`/`past_due` as not subscribed)

## Reference (read-only, for context)
- `src/lib/payments/stripe.ts`, `src/lib/payments/checkout.ts`
- `prisma/schema.prisma` (`Subscription.status`, `stripeSubscriptionId`)
- `src/lib/db.ts`, `AGENTS.md`

## Success criteria
- [ ] On `invoice.paid` for a subscription, the matching `Subscription` (by
      `stripeSubscriptionId`) has `status="active"` and `expiresAt` pushed forward one
      period (e.g. +30 days, or from the invoice's period end if available).
- [ ] On `invoice.payment_failed`, the matching `Subscription` is set `status="past_due"`.
- [ ] On `customer.subscription.deleted`, the matching `Subscription` is set
      `status="canceled"`.
- [ ] Handlers are idempotent (duplicate webhook deliveries do not corrupt state) and
      ignore events with no matching local row (return 200, do not throw).
- [ ] The existing `checkout.session.completed` behavior is unchanged.
- [ ] If `isSubscribed` is touched, a `canceled`/`past_due` subscription is treated as not
      active; otherwise it is left unchanged.
- [ ] `npm run build` and `npm run lint` pass.

## Abort criteria — stop and roll back if any hold
- [ ] The change would require editing a file outside **Allowed scope** (e.g.
      `prisma/schema.prisma`, `checkout.ts`, or any `actions/*` module).
- [ ] WI-PAY is not yet merged (the webhook / schema fields do not exist) — abort rather
      than recreating them.
- [ ] The verification cannot be run or does not pass and is not recoverable within scope.

## Verification (required evidence)
```
npm run build
npm run lint
# Manual, with the Stripe CLI (test mode):
stripe listen --forward-to localhost:3000/api/webhooks/stripe
#  - Subscribe, then trigger renewal/failure/cancel events, e.g.:
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
#  - Confirm the local Subscription.status / expiresAt change to match.
```
Evidence to report:
- [ ] Build + lint output.
- [ ] Note/log showing status/expiresAt updated for each of the three events.

## Dependencies
- Depends on: WI-PAY (merged)
- Unblocks: none

## Parallelism
- Safe to run in parallel with: any contract not touching the Stripe webhook or
  `src/lib/subscriptions.ts`.

## Required report (on finish)
- **Final state:** ACCEPTED or ABORTED
- **Summary of changes:** ...
- **Files changed:** ... (must be a subset of Allowed scope)
- **Verification evidence:** ...
- **If ABORTED:** which abort criterion fired, and confirmation the workspace was discarded
- **Risks / follow-ups:** ...
