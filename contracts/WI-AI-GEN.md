# WI-AI-GEN — AI content suggestions in the post composer

## Goal
A creator writing a post can get an AI-suggested title (and/or caption) generated from
the post body, via the shared AI service.

## Context
The post composer is `src/app/dashboard/post-composer.tsx` (a `"use client"` component
with the new-post form). The shared AI service from WI-AI-CORE lives in `src/lib/ai/`
and exposes `getAiProvider().complete(prompt)`. This contract adds a server action (and/
or route) that calls `complete()` and a button in the composer to use it. Keys are
server-side only, so the browser must call a server action or API route — never the AI
SDK directly.

Next.js 16 is non-standard here — read `AGENTS.md`. The composer is a client component;
the AI call must happen on the server.

## Allowed scope (may edit)
- `src/app/actions/ai.ts` (new: a server action, e.g. `suggestTitle(body)`)
- `src/app/api/ai/suggest/route.ts` (optional alternative/addition to the action)
- `src/app/dashboard/post-composer.tsx` (the "Suggest title" button + wiring)

## Reference (read-only, for context)
- `src/lib/ai/` (the `AiProvider` interface + `getAiProvider()` — consume, do not edit)
- `src/lib/auth.ts` (`getCurrentUser` for an auth check in the action)
- `AGENTS.md`

## Success criteria
- [ ] A server-side entry point (`suggestTitle`, and optionally `suggestCaption`) calls
      `getAiProvider().complete(...)` with a prompt built from the post body.
- [ ] The composer has a control that requests a suggestion and fills it into the title
      (and/or caption) field. A pending/disabled state is shown while it runs.
- [ ] The action verifies the caller is an authenticated creator before calling the AI.
- [ ] No AI SDK or API key is referenced in client code; the browser only calls the
      server action/route.
- [ ] `npm run build` and `npm run lint` pass.

## Abort criteria — stop and roll back if any hold
- [ ] The change would require editing a file outside **Allowed scope** (notably
      `src/lib/ai/` — that belongs to WI-AI-CORE).
- [ ] WI-AI-CORE is not yet ACCEPTED (the `src/lib/ai/` interface does not exist) — do
      not stub a fake AI client; abort.
- [ ] The verification cannot be run or does not pass and is not recoverable within scope.

## Verification (required evidence)
```
npm run build
npm run lint
# Manual (with a key in .env.local):
npm run dev
#  - As a creator, open the dashboard composer, type a body, click "Suggest title"
#  - A generated title appears in the field
#  - Flip AI_PROVIDER between openai/gemini and confirm both work
```
Evidence to report:
- [ ] Build + lint output.
- [ ] Note/screenshot of a generated suggestion.

## Dependencies
- Depends on: WI-AI-CORE (ACCEPTED)
- Unblocks: none

## Parallelism
- Safe to run in parallel with: WI-AI-MOD (disjoint scope).

## Required report (on finish)
- **Final state:** ACCEPTED or ABORTED
- **Summary of changes:** ...
- **Files changed:** ... (must be a subset of Allowed scope)
- **Verification evidence:** ...
- **If ABORTED:** which abort criterion fired, and confirmation the workspace was discarded
- **Risks / follow-ups:** ...
