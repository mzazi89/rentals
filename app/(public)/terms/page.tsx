import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of service",
  description: "The terms governing your use of RentHub.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Terms of service</h1>
      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        This is placeholder legal text. Have it reviewed and customised by a lawyer before
        launching publicly.
      </p>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-semibold text-foreground">1. Acceptance of terms</h2>
          <p className="mt-1">
            By creating an account or using RentHub, you agree to these terms. If you do not
            agree, please do not use the platform.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">2. The platform</h2>
          <p className="mt-1">
            RentHub is a marketplace and management platform connecting landlords, rent agents
            and tenants. We facilitate listings, viewings, applications, leases, rent payments
            and communication. We are not a party to any tenancy agreement between users.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">3. User obligations</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Provide accurate information in your profile and listings.</li>
            <li>Never misrepresent a property, your identity or your agency.</li>
            <li>Do not use the platform for fraud, scams or prohibited content.</li>
            <li>Never ask for or make payments outside the platform.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">4. Payments</h2>
          <p className="mt-1">
            Payments are processed by third-party providers. RentHub verifies payment status
            server-side; receipts are generated after successful payment.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">5. Termination</h2>
          <p className="mt-1">
            We may suspend or terminate accounts that violate these terms, defraud other users,
            or harm the platform.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">6. Liability</h2>
          <p className="mt-1">
            RentHub provides the platform "as is". To the maximum extent permitted by law, we
            are not liable for disputes between users, property condition, or damages arising
            from tenancy arrangements.
          </p>
        </section>
      </div>
    </div>
  );
}
