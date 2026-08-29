import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy policy",
  description: "How RentHub collects, uses and protects your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        This is placeholder legal text. Have it reviewed and customised by a lawyer before
        launching publicly.
      </p>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-semibold text-foreground">1. Data we collect</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Account information: name, email, phone number, role.</li>
            <li>Profile details you choose to provide (e.g. budget preferences, agency details).</li>
            <li>Transactional data: applications, viewings, leases, payments and receipts.</li>
            <li>Technical data: device and usage information for security and analytics.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">2. How we use your data</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>To operate the platform: listings, search, viewings, applications and payments.</li>
            <li>To verify agents and properties.</li>
            <li>To send notifications you have opted into.</li>
            <li>To prevent fraud and keep the platform safe.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">3. What we never do</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>We never sell your personal data.</li>
            <li>We never expose private tenant information publicly.</li>
            <li>We never share your payment details with other users.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">4. Data retention & your rights</h2>
          <p className="mt-1">
            You may request access to, correction of, or deletion of your personal data by
            contacting support. Some data is retained where required by law.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">5. Security</h2>
          <p className="mt-1">
            We use encryption in transit and at rest, role-based access controls, and
            server-side authorization to protect your data.
          </p>
        </section>
      </div>
    </div>
  );
}
