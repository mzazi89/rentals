import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <SearchX className="size-12 text-muted-foreground" />
      <h1 className="mt-4 text-3xl font-bold">404 — Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Back home
        </Link>
        <Link href="/properties" className="rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
          Browse properties
        </Link>
      </div>
    </div>
  );
}
