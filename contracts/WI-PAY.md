# WI-PAY — Stripe payments for subscriptions and tips

## Goal
Subscriptions and tips are paid for real via Stripe Checkout (test mode); the database
row is written only after Stripe confirms payment via webhook.

## Context
Today `subscribe` and `sendTip` (now in `src/app/actions/subscriptions.ts` and
`src/app/actions/tips.ts`) write DB rows directly with no payment. The README's stated
design: "create a session in `subscribe`, redirect to the URL, then move the DB write
into a webhook handler." The foundation branch already added the needed schema fields
(`User.stripeCustomerId`, `Subscription.status` + `stripeSubscriptionId`,
`Tip.stripePaymentIntentId`) and installed the `stripe` package, plus `.env.example`
entries (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL`).

Next.js 16 is non-standard here — read `AGENTS.md`; webhook routes need the raw request
body for signature verification (do not pre-parse JSON).

## Allowed scope (may edit)
- `src/lib/payments/` (new: Stripe client + helpers)
- `src/app/api/webhooks/stripe/route.ts` (new: webhook handler)
- `src/app/actions/subscriptions.ts` (subscribe → Checkout session + redirect)
- `src/app/actions/tips.ts` (sendTip → Checkout session + redirect)
- `src/app/[username]/page.tsx` (subscribe control + tip form wiring)
- `src/app/dashboard/page.tsx` (earnings reflect confirmed payments)

## Reference (read-only, for context)
- `src/lib/auth.ts` (`getCurrentUser`)
- `src/lib/db.ts` (Prisma singleton `db`)
- `src/lib/subscriptions.ts` (`isSubscribed`)
- `prisma/schema.prisma` (payment fields already added)
- `.env.example`, `README.md`, `AGENTS.md`

## Success criteria
- [ ] `subscribe` creates a Stripe Checkout Session (mode `subscription`, using the
      creator's `monthlyPrice`) and redirects the user to the session URL.
- [ ] `sendTip` creates a Stripe Checkout Session (mode `payment`, one-time, using the
      submitted amount) and redirects to the session URL.
- [ ] A webhook at `POST /api/webhooks/stripe` verifies the Stripe signature and, on
      `checkout.session.completed`, writes the `Subscription` (with
      `stripeSubscriptionId`, `status="active"`) or `Tip` (with `stripePaymentIntentId`)
      row. No row is written before confirmation.
- [ ] Session metadata carries enough context (subscriber/creator ids, tip amount,
      message) for the webhook to write the correct row.
- [ ] Dashboard earnings are computed from rows that exist only post-payment.
- [ ] `npm run build` and `npm run lint` pass.

## Abort criteria — stop and roll back if any hold
- [ ] The change would require editing a file outside **Allowed scope** (e.g.
      `prisma/schema.prisma`, `package.json`, or another `actions/*` module).
- [ ] A contract this one depends on is not yet ACCEPTED.
- [ ] The verification cannot be run or does not pass and is not recoverable within scope.
- [ ] The required schema fields or `stripe` dependency are missing (foundation not
      merged) — abort rather than editing schema or package.json yourself.

## Verification (required evidence)
```
# With STRIPE_SECRET_KEY (test) and NEXT_PUBLIC_BASE_URL set in .env.local:
npm run build
npm run lint
# Manual, with Stripe CLI:
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # prints whsec_... -> STRIPE_WEBHOOK_SECRET
npm run dev
#  - Subscribe to a creator -> redirected to Stripe Checkout -> pay with 4242 4242 4242 4242
#  - Confirm the Subscription row appears ONLY after the webhook fires
#  - Send a tip -> pay -> confirm the Tip row appears after webhook
```
Evidence to report:
- [ ] Build + lint output.
- [ ] Note/log showing the row was written by the webhook (not before redirect).

## Dependencies
- Depends on: foundation branch `feat/payments-ai-foundation` (merged)
- Unblocks: none

## Parallelism
- Safe to run in parallel with: WI-AI-CORE (disjoint scope).

## Required report (on finish)
- **Final state:** ACCEPTED or ABORTED
- **Summary of changes:** ...
- **Files changed:** ... (must be a subset of Allowed scope)
- **Verification evidence:** ...
- **If ABORTED:** which abort criterion fired, and confirmation the workspace was discarded
- **Risks / follow-ups:** ...
