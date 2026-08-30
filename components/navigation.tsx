"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="RentHub home">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Building2 className="size-5" />
      </span>
      {!compact ? <span className="text-lg font-bold tracking-tight">RentHub</span> : null}
    </Link>
  );
}

const PUBLIC_LINKS = [
  { href: "/properties", label: "Properties" },
  { href: "/agents", label: "Agents" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const authed = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  // Session-aware: a signed-in visitor sees "Dashboard", not "Sign in".
  const { data: session } = authClient.useSession();
  const signedIn = Boolean(session?.user);

  if (authed) return null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur print-hidden">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === l.href ? "text-primary" : "text-foreground/80"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 hover:bg-muted md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <nav aria-label="Mobile" className="border-t bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t pt-3">
              {signedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border px-4 py-2.5 text-center text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-muted/40 print-hidden">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Kenya's trusted platform connecting landlords, rent agents and tenants.
            Search, view, apply and pay rent — all in one place.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/properties">Browse properties</Link></li>
            <li><Link className="hover:text-foreground" href="/agents">Find agents</Link></li>
            <li><Link className="hover:text-foreground" href="/about">About RentHub</Link></li>
            <li><Link className="hover:text-foreground" href="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/terms">Terms of service</Link></li>
            <li><Link className="hover:text-foreground" href="/privacy">Privacy policy</Link></li>
            <li><Link className="hover:text-foreground" href="/safety">Rental safety</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Get in touch</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hello@renthub.co.ke</li>
            <li>+254 700 000 000</li>
            <li>Nairobi, Kenya</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} RentHub. All rights reserved.</p>
          <p>Made for Kenya 🇰🇪 — KES · Africa/Nairobi</p>
        </div>
      </div>
    </footer>
  );
}
