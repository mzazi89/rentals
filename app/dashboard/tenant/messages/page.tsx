import MessagesPage from "@/components/messages-page";

export const metadata = { title: "Messages" };

export default async function TenantMessagesPage({ searchParams }: { searchParams: { conversation?: string } }) {
  return (
    <MessagesPage role="tenant" searchParams={searchParams} />
  );
}
