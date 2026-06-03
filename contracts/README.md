# Contracts — Only-Tacos payments + AI

This directory applies the [LLM-Workflow](https://github.com/bijanp24/LLM-Workflow)
contract pattern to Only-Tacos. Each `WI-*.md` file is an **executor-agnostic unit of
work** — a contract any executor (a human, or any model, run in a parallel worktree)
can fulfill. The template is `CONTRACT_TEMPLATE.md` (copied from LLM-Workflow).

## Why these are safe to run in parallel

The orchestrator already did the **shared-file foundation** (the `feat/payments-ai-foundation`
branch): the `prisma/schema.prisma`, `package.json`, and the monolithic
`src/app/actions.ts` were edited *once*, up front. `actions.ts` is now a barrel that
re-exports feature modules in `src/app/actions/*`, so each contract owns a different
module and the scopes below are **disjoint** — no two parallel contracts touch the same
file.

## Execution order (fork / join)

```
FOUNDATION (done, merged first)
   schema + deps + actions/* split

PHASE 1 — run in parallel
   ├─ WI-PAY       Stripe subscriptions + tips
   └─ WI-AI-CORE   provider-agnostic AI service (OpenAI + Gemini)

PHASE 2 — run in parallel, after WI-AI-CORE is ACCEPTED
   ├─ WI-AI-GEN    content suggestions (consumes the AI service)
   └─ WI-AI-MOD    moderation for posts + DMs (consumes the AI service)
```

## Disjoint-scope map

| Contract | Owns (may edit) | Reads only |
|----------|-----------------|------------|
| WI-PAY | `src/lib/payments/`, `src/app/api/webhooks/stripe/route.ts`, `src/app/actions/subscriptions.ts`, `src/app/actions/tips.ts`, `src/app/[username]/page.tsx`, `src/app/dashboard/page.tsx` | `src/lib/auth.ts`, `src/lib/subscriptions.ts`, `prisma/schema.prisma` |
| WI-AI-CORE | `src/lib/ai/` | `.env.example` |
| WI-AI-GEN | `src/app/dashboard/post-composer.tsx`, `src/app/actions/ai.ts`, `src/app/api/ai/suggest/route.ts` | `src/lib/ai/` |
| WI-AI-MOD | `src/lib/moderation.ts`, `src/app/actions/posts.ts`, `src/app/actions/messages.ts` | `src/lib/ai/`, `prisma/schema.prisma` |

## House rules for every executor

- **Next.js 16 is non-standard here.** Read `AGENTS.md` and, if unsure of an API,
  `node_modules/next/dist/docs/`. Dynamic `params`/`searchParams` are Promises — `await`
  them before use.
- Reuse existing helpers: `getCurrentUser()` (`src/lib/auth.ts`), the Prisma singleton
  `db` (`src/lib/db.ts`), `isSubscribed()` (`src/lib/subscriptions.ts`),
  `findOrCreateConversation()` (`src/lib/conversations.ts`).
- Verify before claiming done: `npm run build` and `npm run lint` must pass.
- Secrets only in `.env.local` (git-ignored). Never commit keys. See `.env.example`.
- If you must touch a file outside your scope, **stop** (BLOCKED) and tell the
  orchestrator — do not expand scope.
