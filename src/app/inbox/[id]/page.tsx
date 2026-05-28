import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendMessage } from "../../actions";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");
  const { id } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      userA: true,
      userB: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();
  if (conversation.userAId !== me.id && conversation.userBId !== me.id) notFound();

  const other =
    conversation.userAId === me.id ? conversation.userB : conversation.userA;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/inbox" className="text-[var(--text-muted)] hover:text-orange-600 transition-colors">
          ← Inbox
        </Link>
        <span className="text-[var(--border)]">/</span>
        <Link href={`/${other.username}`} className="font-semibold hover:text-orange-600 transition-colors">
          {other.displayName}
          <span className="font-normal text-[var(--text-muted)] ml-1">@{other.username}</span>
        </Link>
      </div>

      {/* ── Message thread ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 min-h-[360px] flex flex-col gap-3 shadow-sm">
        {conversation.messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">
            No messages yet. Say hi 👋
          </div>
        )}
        {conversation.messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm " +
                  (mine
                    ? "rounded-br-sm bg-orange-600 text-white"
                    : "rounded-bl-sm bg-[var(--surface-hover)] text-[var(--foreground)]")
                }
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                <div className={`mt-1 text-[10px] ${mine ? "text-orange-200" : "text-[var(--text-subtle)]"}`}>
                  {m.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Reply form ── */}
      <form action={sendMessage} className="flex gap-2">
        <input type="hidden" name="recipientId" value={other.id} />
        <input
          name="body"
          placeholder="Write a message…"
          required
          maxLength={2000}
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
        />
        <button className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 active:scale-[0.98] transition-all">
          Send
        </button>
      </form>
    </div>
  );
}
