import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy policy",
  description: "How RentHub collects, uses and protects your personal data.",
  path: "/privacy",
});

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Who we are",
    body: (
      <p>
        RentHub is a rental marketplace and property management platform operating in Kenya.
        This policy explains what personal data we collect, why we collect it, and the choices
        you have over it. By using RentHub you agree to the practices described here.
      </p>
    ),
  },
  {
    title: "2. Data we collect",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Account information: name, email address, phone number and your chosen role.</li>
        <li>Profile details you choose to provide: budget preferences, agency or company details, address, avatar.</li>
        <li>Property information you provide as a landlord or agent: building details, floors, house numbers and photos.</li>
        <li>Transactional data: applications, viewings, leases, rent payments, receipts and commission records.</li>
        <li>Communications: messages exchanged through the platform and support correspondence.</li>
        <li>Technical data: device type, browser, approximate location from your IP address, and usage information for security and improvement.</li>
      </ul>
    ),
  },
  {
    title: "3. How we use your data",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>To provide and operate the platform: listings, search, viewings, applications, leases, payments and messaging.</li>
        <li>To verify identities: landlord registration reviews, agent verification and fraud prevention.</li>
        <li>To communicate with you: notifications about your properties, applications, payments and platform updates.</li>
        <li>To improve our service: analytics, debugging and product development.</li>
        <li>To comply with legal obligations and to protect the rights and safety of users.</li>
      </ul>
    ),
  },
  {
    title: "4. Legal basis for processing",
    body: (
      <p>
        We process your data where it is necessary to perform the contract you have with us
        (running your account and the services you use), where you have given consent (such as
        marketing preferences), where we have a legitimate interest (security, fraud
        prevention and service improvement), or where required by law.
      </p>
    ),
  },
  {
    title: "5. How we share your data",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>With the landlord or agent relevant to a property you apply for or view, so they can process your request.</li>
        <li>With service providers who help us operate, such as hosting, storage, email and payment processors — under strict confidentiality obligations.</li>
        <li>With authorities where required by law or to protect against fraud and abuse.</li>
        <li>We never sell your personal data.</li>
      </ul>
    ),
  },
  {
    title: "6. Cookies and technical data",
    body: (
      <p>
        We use cookies and similar technologies to keep you signed in, remember your
        preferences and understand how the platform is used. You can control cookies through
        your browser settings, though some features may not work without them.
      </p>
    ),
  },
  {
    title: "7. Data retention",
    body: (
      <p>
        We keep your data for as long as your account is active or as needed to provide the
        services, comply with legal obligations, resolve disputes and enforce our agreements.
        When you close your account, we delete or anonymise your personal data unless the law
        requires us to keep it.
      </p>
    ),
  },
  {
    title: "8. Security",
    body: (
      <p>
        We use industry-standard safeguards including encrypted connections, secure storage and
        access controls to protect your data. No method of transmission or storage is 100%
        secure, so we cannot guarantee absolute security — but we work continuously to protect
        your information and will notify you and the relevant authorities in the event of a
        meaningful breach.
      </p>
    ),
  },
  {
    title: "9. Your rights",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Access: request a copy of the personal data we hold about you.</li>
        <li>Correction: update or correct inaccurate information (most can be edited in your profile settings).</li>
        <li>Deletion: request deletion of your account and personal data, subject to legal retention requirements.</li>
        <li>Objection and restriction: object to or restrict certain processing.</li>
        <li>Portability: request your data in a structured, machine-readable format where applicable.</li>
      </ul>
    ),
  },
  {
    title: "10. Children",
    body: (
      <p>
        RentHub is not directed at children under 18, and we do not knowingly collect personal
        data from them. If you believe a child has provided us with personal data, contact us
        and we will delete it.
      </p>
    ),
  },
  {
    title: "11. Third-party links",
    body: (
      <p>
        The platform may link to third-party websites or services. This policy does not cover
        their practices; we encourage you to review their privacy policies before sharing any
        data with them.
      </p>
    ),
  },
  {
    title: "12. Changes to this policy",
    body: (
      <p>
        We may update this policy as the platform evolves. Material changes will be announced
        on the platform or by email. Continued use after changes take effect means you accept
        the updated policy.
      </p>
    ),
  },
  {
    title: "13. Contact us",
    body: (
      <p>
        For any privacy question or request, email privacy@renthub.co.ke or write to RentHub,
        Kilimani Business Park, Nairobi, Kenya. We respond within one business day.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <PublicPageHero
        title="Privacy policy"
        subtitle="How RentHub collects, uses and protects your personal data — and the choices you have."
        image={PAGE_IMAGES.facade}
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
