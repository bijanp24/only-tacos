import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function InboxPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/sign-in");

  const conversations = await db.conversation.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: true,
      userB: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
          <div className="text-3xl mb-3">💬</div>
          <p className="text-[var(--text-muted)] text-sm">
            No conversations yet.{" "}
            <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
              Discover creators
            </Link>{" "}
            and send them a message.
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden shadow-sm">
          {conversations.map((c) => {
            const other = c.userAId === me.id ? c.userB : c.userA;
            const lastMsg = c.messages[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/inbox/${c.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-lg">
                    🌮
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold truncate">{other.displayName}</span>
                      <span className="shrink-0 text-xs text-[var(--text-subtle)]">
                        {c.lastMessageAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] truncate mt-0.5">
                      {lastMsg
                        ? (lastMsg.senderId === me.id ? "You: " : "") + lastMsg.body
                        : "No messages yet"}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-[var(--text-subtle)]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
