# WI-AI-MOD — AI moderation for posts and direct messages

## Goal
New posts and direct messages are screened by the shared AI service on creation; flagged
content sets `flagged = true` and records a `ModerationResult`.

## Context
The foundation branch added `Post.flagged`, `Message.flagged`, and the `ModerationResult`
model (`targetType`, `targetId`, `provider`, `flagged`, `categories`, `createdAt`). The
shared AI service from WI-AI-CORE exposes `getAiProvider().moderate(text)`. This contract
wraps that in a small helper and calls it from the post and message creation actions
(`src/app/actions/posts.ts`, `src/app/actions/messages.ts`). Both actions already exist
(split out in the foundation refactor).

Next.js 16 is non-standard here — read `AGENTS.md`. All moderation runs server-side.

## Allowed scope (may edit)
- `src/lib/moderation.ts` (new: wraps `getAiProvider().moderate`, writes `ModerationResult`)
- `src/app/actions/posts.ts` (call moderation in `createPost`, set `flagged`)
- `src/app/actions/messages.ts` (call moderation in `sendMessage`, set `flagged`)

## Reference (read-only, for context)
- `src/lib/ai/` (the `AiProvider` interface + `getAiProvider()` — consume, do not edit)
- `src/lib/db.ts` (Prisma singleton `db`)
- `prisma/schema.prisma` (`Post.flagged`, `Message.flagged`, `ModerationResult` already added)
- `AGENTS.md`

## Success criteria
- [ ] `src/lib/moderation.ts` exposes a helper (e.g.
      `moderateContent(targetType, targetId, text)`) that calls
      `getAiProvider().moderate(text)`, persists a `ModerationResult`, and returns the
      `flagged` verdict.
- [ ] `createPost` moderates the post body+title on creation and sets `Post.flagged`
      from the verdict.
- [ ] `sendMessage` moderates the message body on creation and sets `Message.flagged`
      from the verdict.
- [ ] Existing behavior (auth checks, redirects, revalidation) is preserved; moderation
      is additive.
- [ ] `npm run build` and `npm run lint` pass.

## Abort criteria — stop and roll back if any hold
- [ ] The change would require editing a file outside **Allowed scope** (notably
      `src/lib/ai/` (WI-AI-CORE), `prisma/schema.prisma`, or `src/app/actions/ai.ts`
      / `post-composer.tsx` (WI-AI-GEN)).
- [ ] WI-AI-CORE is not yet ACCEPTED (no `src/lib/ai/` interface) — do not stub a fake
      moderator; abort.
- [ ] The `flagged` columns or `ModerationResult` model are missing (foundation not
      merged) — abort rather than editing the schema yourself.
- [ ] The verification cannot be run or does not pass and is not recoverable within scope.

## Verification (required evidence)
```
npm run build
npm run lint
# Manual (with a key in .env.local):
npm run dev
#  - Create a post / send a DM with obviously disallowed text
#  - Confirm the row's `flagged` is true and a ModerationResult row was written
#  - Create benign content -> flagged stays false
```
Evidence to report:
- [ ] Build + lint output.
- [ ] Note/log showing flagged verdict + ModerationResult row for disallowed content.

## Dependencies
- Depends on: WI-AI-CORE (ACCEPTED)
- Unblocks: none

## Parallelism
- Safe to run in parallel with: WI-AI-GEN (disjoint scope).

## Required report (on finish)
- **Final state:** ACCEPTED or ABORTED
- **Summary of changes:** ...
- **Files changed:** ... (must be a subset of Allowed scope)
- **Verification evidence:** ...
- **If ABORTED:** which abort criterion fired, and confirmation the workspace was discarded
- **Risks / follow-ups:** ...
