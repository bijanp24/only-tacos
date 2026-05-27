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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/inbox" className="text-sm text-neutral-500 hover:underline">
          ← Inbox
        </Link>
        <span className="text-neutral-300">·</span>
        <Link href={`/${other.username}`} className="font-medium hover:underline">
          {other.displayName}{" "}
          <span className="text-neutral-500">@{other.username}</span>
        </Link>
      </div>

      <ul className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 min-h-[300px]">
        {conversation.messages.length === 0 && (
          <li className="text-center text-sm text-neutral-500 py-12">
            No messages yet. Say hi.
          </li>
        )}
        {conversation.messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <li key={m.id} className={mine ? "text-right" : "text-left"}>
              <div
                className={
                  "inline-block max-w-[75%] rounded-2xl px-3 py-2 text-sm " +
                  (mine
                    ? "bg-orange-600 text-white"
                    : "bg-neutral-100 text-neutral-900")
                }
              >
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div
                  className={
                    "mt-1 text-[10px] " +
                    (mine ? "text-orange-100" : "text-neutral-500")
                  }
                >
                  {m.createdAt.toLocaleString()}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <form action={sendMessage} className="flex gap-2">
        <input type="hidden" name="recipientId" value={other.id} />
        <input
          name="body"
          placeholder="Write a message..."
          required
          maxLength={2000}
          className="flex-1 rounded border border-neutral-300 px-3 py-2"
        />
        <button className="rounded bg-orange-600 px-4 py-2 text-white font-medium hover:bg-orange-700">
          Send
        </button>
      </form>
    </div>
  );
}
