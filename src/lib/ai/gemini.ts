import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import type { AiProvider, CompleteOptions, ModerationVerdict } from "./types";

// The 2.5+ "flash" models enable a reasoning step ("thinking") by default that
// consumes the maxOutputTokens budget. For these short utility calls (titles,
// JSON moderation) it adds cost/latency and can starve the actual answer, so we
// turn it off. thinkingConfig isn't in the legacy SDK's typed config, hence the
// extension below.
type GeminiGenerationConfig = GenerationConfig & {
  thinkingConfig?: { thinkingBudget: number };
};
const NO_THINKING = { thinkingBudget: 0 } as const;

const MODERATION_CATEGORIES = [
  "harassment",
  "hate",
  "sexual",
  "violence",
  "self_harm",
  "dangerous",
] as const;

// Gemini has no dedicated moderation endpoint, so we ask the model to classify
// and return strict JSON. Strip any code fences the model adds and parse safely.
function parseModerationJson(raw: string): ModerationVerdict {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as {
      flagged?: unknown;
      categories?: unknown;
    };
    const categories =
      parsed.categories && typeof parsed.categories === "object"
        ? (parsed.categories as Record<string, unknown>)
        : {};
    return { flagged: parsed.flagged === true, categories };
  } catch {
    // Unparseable response: fail open (do not flag) but surface the raw text.
    return { flagged: false, categories: { parseError: true, raw } };
  }
}

// Server-only. Reads GOOGLE_GEMINI_API_KEY from the environment.
export function createGeminiProvider(): AiProvider {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not set (AI_PROVIDER=gemini).");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  return {
    name: "gemini",

    async complete(prompt: string, opts?: CompleteOptions): Promise<string> {
      const generationConfig: GeminiGenerationConfig = {
        temperature: opts?.temperature,
        maxOutputTokens: opts?.maxTokens,
        thinkingConfig: NO_THINKING,
      };
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(opts?.system ? { systemInstruction: opts.system } : {}),
        generationConfig,
      });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    },

    async moderate(text: string): Promise<ModerationVerdict> {
      const generationConfig: GeminiGenerationConfig = {
        temperature: 0,
        responseMimeType: "application/json",
        thinkingConfig: NO_THINKING,
      };
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
      const prompt = [
        "You are a strict content-moderation classifier for a SFW platform.",
        "Classify the TEXT for disallowed content and respond with ONLY JSON of the form:",
        `{"flagged": boolean, "categories": {${MODERATION_CATEGORIES.map(
          (c) => `"${c}": boolean`,
        ).join(", ")}}}`,
        "Set flagged to true if any category is true.",
        "",
        `TEXT: """${text}"""`,
      ].join("\n");
      const result = await model.generateContent(prompt);
      return parseModerationJson(result.response.text());
    },
  };
}
