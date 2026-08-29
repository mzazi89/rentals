import Link from "next/link";
import { ShieldX } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Access denied", path: "/forbidden", noIndex: true });

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <ShieldX className="size-12 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">403 — Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You don't have permission to view this page. If you believe this is a mistake,
        contact support.
      </p>
      <Link href="/dashboard" className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Go to my dashboard
      </Link>
    </div>
  );
}
