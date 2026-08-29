import Link from "next/link";
import { Logo } from "@/components/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-16 items-center justify-center border-b bg-background">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div className="w-full max-w-md animate-slide-in rounded-2xl border bg-card p-6 shadow-lift sm:p-8">
          {children}
        </div>
      </main>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">← Back to RentHub</Link>
      </footer>
    </div>
  );
}
