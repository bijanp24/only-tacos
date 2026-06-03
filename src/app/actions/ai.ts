"use server";

import { getCurrentUser } from "@/lib/auth";
import { getAiProvider } from "@/lib/ai";

// Server action: turns a draft post body into a short title via the shared AI
// service. Runs server-side only, so no AI key is ever exposed to the browser.
export async function suggestTitle(body: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user || !user.isCreator) {
    throw new Error("Only creators can use AI suggestions.");
  }
  const draft = body.trim().slice(0, 4000);
  if (!draft) {
    throw new Error("Write a post body first, then ask for a title.");
  }

  const ai = getAiProvider();
  const raw = await ai.complete(
    `Write one short, catchy title (max ~8 words) for this taco-themed post.\n` +
      `Return ONLY the title text — no quotes, no preamble.\n\n` +
      `POST BODY:\n"""${draft}"""`,
    {
      system:
        "You write concise, engaging titles for posts on a taco creator platform.",
      temperature: 0.8,
      maxTokens: 32,
    },
  );

  // Models sometimes wrap the title in quotes or add a trailing period.
  return raw
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/[.\s]+$/g, "")
    .trim()
    .slice(0, 100);
}
