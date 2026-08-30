"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/overlays";

/**
 * Non-disruptive sign-in prompt shown to signed-out visitors when they tap
 * an account-gated action (favourite, book viewing, apply, message agent).
 * They stay on the page and can keep exploring — joining is optional.
 */
export function SignInPrompt({
  open,
  onClose,
  title = "Join RentHub to continue",
  message = "Create a free account to save favourites, book viewings, apply for properties and message agents — or keep browsing for now.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title={title} description={message} size="sm">
      <div className="space-y-3">
        <Link
          href="/signup"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Create free account
        </Link>
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-lg border border-border text-sm font-medium hover:bg-muted"
        >
          I already have an account — Sign in
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Maybe later — keep browsing
        </button>
      </div>
    </Dialog>
  );
}
