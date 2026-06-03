import OpenAI from "openai";
import type { AiProvider, CompleteOptions, ModerationVerdict } from "./types";

// Server-only. Reads OPENAI_API_KEY from the environment; the key never leaves
// the server because this module is only ever imported by server code.
export function createOpenAiProvider(): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set (AI_PROVIDER=openai).");
  }
  const client = new OpenAI({ apiKey });
  const chatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
  const moderationModel =
    process.env.OPENAI_MODERATION_MODEL ?? "omni-moderation-latest";

  return {
    name: "openai",

    async complete(prompt: string, opts?: CompleteOptions): Promise<string> {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (opts?.system) messages.push({ role: "system", content: opts.system });
      messages.push({ role: "user", content: prompt });

      const res = await client.chat.completions.create({
        model: chatModel,
        temperature: opts?.temperature ?? 0.7,
        max_completion_tokens: opts?.maxTokens,
        messages,
      });
      return res.choices[0]?.message?.content?.trim() ?? "";
    },

    async moderate(text: string): Promise<ModerationVerdict> {
      const res = await client.moderations.create({
        model: moderationModel,
        input: text,
      });
      const result = res.results[0];
      return {
        flagged: result?.flagged ?? false,
        categories: (result?.categories ?? {}) as unknown as Record<
          string,
          unknown
        >,
      };
    },
  };
}
