import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Forgot password",
  description: "Reset your RentHub password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </div>
    </>
  );
}
