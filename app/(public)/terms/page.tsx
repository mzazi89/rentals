import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of service",
  description: "The terms and conditions governing your use of RentHub.",
  path: "/terms",
});

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Acceptance of terms",
    body: (
      <p>
        By accessing, browsing or creating an account on RentHub, you agree to be bound by these
        terms and our privacy policy. If you do not agree with any part of them, please do not
        use the platform. We may update these terms from time to time; continued use after
        changes are published means you accept the updated terms.
      </p>
    ),
  },
  {
    title: "2. Eligibility and accounts",
    body: (
      <>
        <p>
          You must be at least 18 years old and legally capable of entering into contracts to
          use RentHub. You are responsible for keeping your login details confidential and for
          all activity under your account. You may have only one account unless the platform
          owner approves otherwise.
        </p>
        <p className="mt-2">
          You agree to provide accurate, current information when registering and to update it
          when it changes. Creating accounts for impersonation, fraud or circumventing a
          suspension is prohibited.
        </p>
      </>
    ),
  },
  {
    title: "3. Roles on the platform",
    body: (
      <p>
        RentHub supports four roles: tenants (who browse and rent), rent agents (who manage
        buildings assigned by the owner, process tenant requests and mark taken units),
        landlords (who manage their buildings, floors and house numbers), and the platform owner
        (who adds buildings, verifies users and assigns work). By choosing or being assigned a
        role, you agree to act within its scope.
      </p>
    ),
  },
  {
    title: "4. Listings and property information",
    body: (
      <>
        <p>
          Listings are added by the platform owner or authorised landlords. We work hard to keep
          information accurate, but we do not guarantee that every listing, photo or price is
          error-free, current or available. You must verify important details (exact rent,
          deposit, house number and unit condition) directly before committing.
        </p>
        <p className="mt-2">
          Buildings only appear in explore after the landlord has been verified by the platform
          owner. Listings that are misleading, fraudulent or duplicated may be removed without
          notice.
        </p>
      </>
    ),
  },
  {
    title: "5. Viewings and applications",
    body: (
      <p>
        Viewing requests and rental applications are submitted through the platform and shared
        with the relevant agent and landlord. Submitting an application does not create a
        tenancy. Selection of tenants is at the discretion of the landlord or agent, subject to
        applicable law. We do not guarantee that any application will be accepted.
      </p>
    ),
  },
  {
    title: "6. Leases and tenancy agreements",
    body: (
      <p>
        Any lease or tenancy agreement is a contract between you and the landlord (or the
        landlord's authorised agent) — RentHub is not a party to it. We provide tools to
        manage leases, rent and communications, but the legal relationship, obligations and
        remedies remain between the tenant and the landlord. Always read and keep a copy of
        your signed agreement.
      </p>
    ),
  },
  {
    title: "7. Rent payments and receipts",
    body: (
      <p>
        Where the platform offers rent payment, payments are processed through our secure
        payment flow and each successful payment generates a receipt in your dashboard. RentHub
        is not a bank; payment settlement and any refunds are governed by the payment provider
        and your agreement with the landlord. Never arrange rent or deposit payments outside
        the platform — doing so removes protections and may indicate fraud.
      </p>
    ),
  },
  {
    title: "8. Agent conduct and verification",
    body: (
      <p>
        Agents are verified before operating and receive work assigned by the platform owner.
        Agents agree to handle tenant requests promptly, keep unit statuses accurate, and act
        honestly. Verified status can be withdrawn if an agent is found to misrepresent
        properties, harass users or otherwise breach these terms.
      </p>
    ),
  },
  {
    title: "9. Landlord verification",
    body: (
      <p>
        Landlord registrations are reviewed by the platform owner before buildings are shown in
        explore. Landlords agree to keep floor and unit information accurate, honour agreed
        rents and terms, and respond to legitimate tenant and agent communications.
      </p>
    ),
  },
  {
    title: "10. Prohibited conduct",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Posting false, fraudulent or misleading listings or information.</li>
        <li>Requesting payment outside the platform's payment flow.</li>
        <li>Harassing, threatening or discriminating against any user.</li>
        <li>Attempting to access another user's account or data.</li>
        <li>Scraping, reverse-engineering or abusing the platform's systems.</li>
        <li>Using the platform for any unlawful purpose.</li>
      </ul>
    ),
  },
  {
    title: "11. Fees and commissions",
    body: (
      <p>
        RentHub may charge fees for certain services (for example agent commissions), which will
        be clearly communicated before you incur them. Unless stated otherwise, fees are
        non-refundable once the service has been provided.
      </p>
    ),
  },
  {
    title: "12. Intellectual property",
    body: (
      <p>
        The RentHub name, logo, design, software and content are owned by RentHub or its
        licensors. You may not copy, modify, distribute or commercially exploit them without
        our written permission. You retain ownership of the content you upload, and grant us a
        limited licence to host and display it in order to operate the platform.
      </p>
    ),
  },
  {
    title: "13. Disclaimers and limitation of liability",
    body: (
      <p>
        The platform is provided "as is" and "as available". To the maximum extent permitted by
        law, RentHub disclaims all warranties, and our total liability arising out of or
        relating to your use of the platform shall not exceed the fees you actually paid to us
        in the twelve months preceding the claim. We are not liable for the acts or omissions
        of landlords, agents or tenants using the platform, nor for any tenancy agreement
        entered into between users.
      </p>
    ),
  },
  {
    title: "14. Termination",
    body: (
      <p>
        You may close your account at any time from your profile settings. We may suspend or
        terminate accounts that breach these terms, are inactive, or where required by law.
        Upon termination, your access ends but obligations that should survive (such as
        payment obligations and liability provisions) continue.
      </p>
    ),
  },
  {
    title: "15. Governing law and disputes",
    body: (
      <p>
        These terms are governed by the laws of the Republic of Kenya. Any dispute arising out
        of or relating to these terms shall first be referred to good-faith negotiation; failing
        that, to the courts of Kenya. Nothing in these terms limits any consumer rights you may
        have under applicable law.
      </p>
    ),
  },
  {
    title: "16. Contact",
    body: (
      <p>
        Questions about these terms can be sent to hello@renthub.co.ke. Please allow up to one
        business day for a response.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div>
      <PublicPageHero
        title="Terms of service"
        subtitle="The terms and conditions that govern your use of RentHub. Please read them carefully."
        image={PAGE_IMAGES.dusk}
      />

      <div className="container max-w-3xl py-10">
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          This document is provided as general template text. Have it reviewed and customised
          by a lawyer before launching publicly.
        </p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
              <div className="mt-1.5">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
