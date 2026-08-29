import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-forms";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Reset password",
  description: "Choose a new password for your RentHub account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {searchParams.token
          ? "Your reset link is verified — pick a strong password."
          : "This link needs a valid reset token. Request a new one below."}
      </p>
      <div className="mt-6">
        <ResetPasswordForm token={searchParams.token} />
      </div>
      {!searchParams.token ? (
        <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      ) : null}
    </>
  );
}
