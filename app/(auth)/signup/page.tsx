import Link from "next/link";
import { SignupForm } from "@/components/auth-forms";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create an account",
  description: "Join RentHub as a tenant, rent agent or landlord.",
  path: "/signup",
  noIndex: true,
});

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Join thousands of tenants, agents and landlords.</p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </div>
    </>
  );
}
