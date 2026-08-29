import MessagesPage from "@/components/messages-page";

export const metadata = { title: "Messages" };

export default async function AgentMessagesPage({ searchParams }: { searchParams: { conversation?: string } }) {
  return (
    <MessagesPage role="agent" searchParams={searchParams} />
  );
}
