import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAiProvider } from "@/lib/ai";

export type ModerationTarget = "post" | "message";

// Screens `text` via the shared AI service, records a ModerationResult row, and
// returns the flagged verdict. Moderation is additive: any failure (missing key,
// provider outage) fails open — it logs and returns false rather than blocking
// the user's action.
export async function moderateContent(
  targetType: ModerationTarget,
  targetId: string,
  text: string,
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  try {
    const ai = getAiProvider();
    const verdict = await ai.moderate(trimmed);
    await db.moderationResult.create({
      data: {
        targetType,
        targetId,
        provider: ai.name,
        flagged: verdict.flagged,
        categories: verdict.categories as Prisma.InputJsonValue,
      },
    });
    return verdict.flagged;
  } catch (err) {
    console.error("Moderation failed for", targetType, targetId, err);
    return false;
  }
}
