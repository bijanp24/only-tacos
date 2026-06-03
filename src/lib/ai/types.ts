// The seam every feature depends on. Feature code imports only from here and
// `index.ts` — it never references a vendor SDK or vendor type directly, so the
// provider behind this interface is interchangeable.

export interface CompleteOptions {
  /** Upper bound on generated tokens, if the provider supports it. */
  maxTokens?: number;
  /** Sampling temperature (0 = deterministic). */
  temperature?: number;
  /** Optional system / instruction prompt. */
  system?: string;
}

export interface ModerationVerdict {
  /** True when the provider considers the text disallowed. */
  flagged: boolean;
  /** Provider category -> score/bool. Shape is provider-specific by design. */
  categories: Record<string, unknown>;
}

export interface AiProvider {
  /** Stable identifier for the active provider, e.g. "openai" | "gemini". */
  readonly name: string;
  /** Generate a completion for `prompt`. */
  complete(prompt: string, opts?: CompleteOptions): Promise<string>;
  /** Classify `text` for disallowed content. */
  moderate(text: string): Promise<ModerationVerdict>;
}
