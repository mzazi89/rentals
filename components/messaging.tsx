"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/layout";
import { sendMessage, markConversationRead } from "@/app/actions/conversations";
import { getConversationMessages } from "@/app/actions/data";
import type { Message } from "@/types";

export interface ConversationListItem {
  id: string;
  last_message_at: string | null;
  property_title?: string | null;
  other_name?: string | null;
  other_avatar?: string | null;
  last_message?: string | null;
  unread_count: number;
}

export function ConversationList({
  conversations,
  activeId,
  loading,
}: {
  conversations: ConversationListItem[];
  activeId?: string | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
      </div>
    );
  }
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No conversations yet. Message an agent from any property page to get started.
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {conversations.map((c) => (
        <li key={c.id}>
          <a
            href={`?conversation=${c.id}`}
            aria-current={activeId === c.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50",
              activeId === c.id && "bg-primary/5"
            )}
          >
            <Avatar src={c.other_avatar} name={c.other_name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.other_name ?? "Agent"}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.last_message_at)}</span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {c.property_title ? `${c.property_title} · ` : ""}
                  {c.last_message ?? "Start the conversation"}
                </span>
                {c.unread_count > 0 ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {c.unread_count}
                  </span>
                ) : null}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherName,
  otherAvatar,
}: {
  conversationId: string;
  currentUserId: string;
  otherName?: string | null;
  otherAvatar?: string | null;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const load = React.useCallback(async () => {
    try {
      const { messages: fetched } = await getConversationMessages(conversationId);
      setMessages(fetched);
    } catch {
      /* keep previous messages */
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  React.useEffect(() => {
    void load();
    void markConversationRead(conversationId);
    const interval = setInterval(() => void load(), 6000);
    return () => clearInterval(interval);
  }, [conversationId, load]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendMessage({ conversationId, body: text });
      if (result.ok) {
        setBody("");
        await load();
      } else {
        setError(result.error ?? "Could not send message.");
      }
    } catch {
      setError("Network error — please retry.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[420px] flex-col rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b p-3">
        <button aria-label="Back to conversations" onClick={() => router.push("?")} className="rounded-md p-1 hover:bg-muted lg:hidden">
          <ArrowLeft className="size-4" />
        </button>
        <Avatar src={otherAvatar} name={otherName} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{otherName ?? "Agent"}</p>
          <p className="text-xs text-muted-foreground">Property inquiry</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-10 w-2/3" />
            <div className="skeleton h-10 w-1/2" />
          </div>
        ) : messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            No messages yet — say hello!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {timeAgo(m.created_at)}
                    {mine ? (m.is_read ? " · Read" : " · Sent") : null}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Type a message…"
          rows={1}
          aria-label="Message"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          aria-label="Send message"
          className="inline-flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </form>
      {error ? <p className="px-3 pb-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
