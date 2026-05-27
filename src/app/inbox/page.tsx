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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inbox</h1>
      {conversations.length === 0 ? (
        <p className="text-neutral-500">
          No conversations yet. Visit a creator&apos;s page to send them a message.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {conversations.map((c) => {
            const other = c.userAId === me.id ? c.userB : c.userA;
            const lastMsg = c.messages[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/inbox/${c.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-neutral-50"
                >
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    🌮
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{other.displayName}</span>
                      <span className="text-xs text-neutral-500">
                        {c.lastMessageAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 truncate">
                      {lastMsg
                        ? (lastMsg.senderId === me.id ? "You: " : "") + lastMsg.body
                        : "No messages yet"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
