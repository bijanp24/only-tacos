import type { AiProvider } from "./types";
import { createOpenAiProvider } from "./openai";
import { createGeminiProvider } from "./gemini";

export type { AiProvider, CompleteOptions, ModerationVerdict } from "./types";

// One provider instance per AI_PROVIDER value, built lazily on first use so a
// missing key only errors when the AI is actually called (not at import time).
const cache = new Map<string, AiProvider>();

export function getAiProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  const existing = cache.get(name);
  if (existing) return existing;

  let provider: AiProvider;
  switch (name) {
    case "openai":
      provider = createOpenAiProvider();
      break;
    case "gemini":
      provider = createGeminiProvider();
      break;
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${name}". Expected "openai" or "gemini".`,
      );
  }
  cache.set(name, provider);
  return provider;
}
