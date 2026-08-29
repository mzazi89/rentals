import { getCurrentUser } from "@/lib/auth/helpers";
import { fetchConversationsForUser } from "@/lib/db/queries";
import { PageHeader } from "@/components/dashboard";
import { ConversationList, ChatWindow } from "@/components/messaging";

/**
 * Messages page — server-rendered conversation list; the chat window is a
 * client component that polls for new messages (no realtime dependency).
 */
export default async function MessagesPage({
  role,
  title,
  description,
  searchParams,
}: {
  role: string;
  title?: string;
  description?: string;
  searchParams?: { conversation?: string };
}) {
  const user = await getCurrentUser();
  const conversations = user ? await fetchConversationsForUser(user.id) : [];
  const activeId = searchParams?.conversation ?? null;
  const active = conversations.find((c) => c.id === activeId);

  return (
    <div>
      <PageHeader title={title ?? "Messages"} description={description ?? "Chat with tenants and agents."} />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border bg-card lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto">
          <ConversationList conversations={conversations} activeId={activeId} loading={!user} />
        </div>
        <div className="hidden lg:block">
          {active && user ? (
            <ChatWindow
              conversationId={active.id}
              currentUserId={user.id}
              otherName={active.other_name}
              otherAvatar={active.other_avatar}
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
      {active && user ? (
        <div className="lg:hidden">
          <ChatWindow
            conversationId={active.id}
            currentUserId={user.id}
            otherName={active.other_name}
            otherAvatar={active.other_avatar}
          />
        </div>
      ) : null}
    </div>
  );
}
