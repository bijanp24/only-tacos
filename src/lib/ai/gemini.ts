import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProvider, CompleteOptions, ModerationVerdict } from "./types";

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
  const modelName = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

  return {
    name: "gemini",

    async complete(prompt: string, opts?: CompleteOptions): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(opts?.system ? { systemInstruction: opts.system } : {}),
        generationConfig: {
          temperature: opts?.temperature,
          maxOutputTokens: opts?.maxTokens,
        },
      });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    },

    async moderate(text: string): Promise<ModerationVerdict> {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      });
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
