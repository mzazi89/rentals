import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Account suspended",
  path: "/account-suspended",
  noIndex: true,
});

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <ShieldAlert className="size-12 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">Account suspended</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your account has been suspended. This usually happens after a policy violation.
        Contact support at support@renthub.co.ke if you believe this is a mistake.
      </p>
      <Link href="/" className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Back to RentHub
      </Link>
    </div>
  );
}
