# WI-AI-CORE — provider-agnostic AI service (OpenAI + Gemini)

## Goal
A single AI interface the rest of the app depends on, with interchangeable OpenAI and
Gemini implementations selected by an environment variable.

## Context
There is no AI code yet. The foundation branch installed `openai` and
`@google/generative-ai` and added `.env.example` entries (`AI_PROVIDER` = `openai` |
`gemini`, `OPENAI_API_KEY`, `GOOGLE_GEMINI_API_KEY`). This contract builds the seam:
feature code (WI-AI-GEN, WI-AI-MOD) will import this interface and never know which
vendor is behind it — the provider is injected, mirroring the LLM-Workflow
dependency-injection idea. All calls are server-side only (keys never reach the client).

Next.js 16 is non-standard here — read `AGENTS.md` if unsure of an API.

## Allowed scope (may edit)
- `src/lib/ai/` (new directory only):
  - `types.ts` — the `AiProvider` interface
  - `openai.ts` — OpenAI implementation
  - `gemini.ts` — Gemini implementation
  - `index.ts` — factory that returns the provider named by `AI_PROVIDER`

## Reference (read-only, for context)
- `.env.example` (env var names)
- `AGENTS.md`

## Success criteria
- [ ] `types.ts` defines `AiProvider` with at least:
      `complete(prompt: string, opts?): Promise<string>` and
      `moderate(text: string): Promise<{ flagged: boolean; categories: Record<string, unknown> }>`.
      (An optional `embed(text: string): Promise<number[]>` is welcome but not required.)
- [ ] `openai.ts` and `gemini.ts` each implement `AiProvider` against their SDK.
- [ ] `index.ts` exports a `getAiProvider()` factory selecting the implementation from
      `process.env.AI_PROVIDER` (default `openai`), reading keys server-side only.
- [ ] No vendor type leaks across the `AiProvider` boundary — features depend only on the
      interface.
- [ ] `npm run build` and `npm run lint` pass. No TypeScript `any` (use `unknown`).

## Abort criteria — stop and roll back if any hold
- [ ] The change would require editing a file outside `src/lib/ai/`.
- [ ] A contract this one depends on is not yet ACCEPTED.
- [ ] The verification cannot be run or does not pass and is not recoverable within scope.
- [ ] The `openai` or `@google/generative-ai` package is missing (foundation not merged)
      — abort rather than installing it yourself.

## Verification (required evidence)
```
npm run build
npm run lint
# Optional smoke (with a test key in .env.local):
#   write a throwaway script that calls getAiProvider().complete("ping") for each
#   AI_PROVIDER value and prints the result, then delete it.
```
Evidence to report:
- [ ] Build + lint output.
- [ ] If a key was available: sample output from each provider.

## Dependencies
- Depends on: foundation branch `feat/payments-ai-foundation` (merged)
- Unblocks: WI-AI-GEN, WI-AI-MOD

## Parallelism
- Safe to run in parallel with: WI-PAY (disjoint scope).

## Required report (on finish)
- **Final state:** ACCEPTED or ABORTED
- **Summary of changes:** ...
- **Files changed:** ... (must be a subset of `src/lib/ai/`)
- **Verification evidence:** ...
- **If ABORTED:** which abort criterion fired, and confirmation the workspace was discarded
- **Risks / follow-ups:** ...
