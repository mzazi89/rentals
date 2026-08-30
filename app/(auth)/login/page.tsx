import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth/helpers";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your RentHub account.",
  path: "/login",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // A genuinely valid session reaching here goes straight to the dashboard
  // instead of showing the form (session checked server-side).
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your rentals.</p>
      <div className="mt-6">
        <Suspense fallback={<div className="skeleton h-40" />}>
          <LoginForm />
        </Suspense>
      </div>
      <div className="mt-5 space-y-1 border-t pt-4 text-sm">
        <p className="text-muted-foreground">
          New to RentHub?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot your password?
        </Link>
      </div>
    </>
  );
}
