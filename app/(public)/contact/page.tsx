import { Clock, Mail, MapPin, Phone, MessageCircleQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/layout";
import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact us",
  description: "Get in touch with the RentHub team — support, feedback, partnerships and more.",
  path: "/contact",
});

const FAQS = [
  {
    q: "How do I reset my password?",
    a: "On the sign-in page, tap 'Forgot password' and enter the email address linked to your account. You'll receive a secure reset link — if you don't see it within a few minutes, check your spam folder.",
  },
  {
    q: "A listing looks wrong or suspicious. What should I do?",
    a: "Use the 'Report' button on the property page — it takes two seconds. Our team reviews every report, and you can also email us directly with the property link.",
  },
  {
    q: "How do I get my building verified as a landlord?",
    a: "Register as a landlord, add your company and address details, and submit. The platform owner reviews every registration — you'll be notified the moment your building is verified and appears in explore.",
  },
  {
    q: "I'm an agent. How do I get assigned work?",
    a: "Once your agent account is verified, the owner assigns properties to you. You'll see your assigned buildings in your dashboard, where you can process tenant requests and mark taken units.",
  },
  {
    q: "How are rent payments handled?",
    a: "Payments run through the platform's secure payment flow, and every payment generates a receipt you can access anytime from your dashboard.",
  },
];

export default function ContactPage() {
  return (
    <div>
      <PublicPageHero
        title="Contact us"
        subtitle="Questions, feedback, or need help with your account? Our team is here for you — every message gets a human response."
        image={PAGE_IMAGES.interior}
      />

      <div className="container max-w-3xl py-10">
        {/* Contact channels */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <Mail className="size-5 text-primary" />
              <h2 className="mt-2 font-semibold">Email</h2>
              <p className="mt-1 text-sm text-muted-foreground">hello@renthub.co.ke</p>
              <p className="text-sm text-muted-foreground">support@renthub.co.ke</p>
              <p className="mt-2 text-xs text-muted-foreground">We reply within one business day.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Phone className="size-5 text-primary" />
              <h2 className="mt-2 font-semibold">Phone & WhatsApp</h2>
              <p className="mt-1 text-sm text-muted-foreground">+254 700 000 000</p>
              <p className="mt-2 text-xs text-muted-foreground">Mon–Sat, 8:00 am – 6:00 pm EAT.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <MapPin className="size-5 text-primary" />
              <h2 className="mt-2 font-semibold">Office</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kilimani Business Park,
                <br />
                Nairobi, Kenya
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Visits by appointment.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Clock className="size-5 text-primary" />
              <h2 className="mt-2 font-semibold">Support hours</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Monday – Saturday: 8:00 am – 6:00 pm EAT
                <br />
                Sunday & public holidays: urgent issues only
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Message CTA */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Tell us what you need help with — account issues, listing problems, payments,
              partnerships or press. Please include any property links or order references so we
              can help you faster.
            </p>
            <a
              href="mailto:support@renthub.co.ke?subject=RentHub%20support%20request"
              className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Email support
            </a>
          </CardContent>
        </Card>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <MessageCircleQuestion className="size-5 text-primary" /> Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border bg-card">
                <summary className="cursor-pointer list-none px-5 py-4 font-medium transition-colors hover:bg-muted/40">
                  {f.q}
                </summary>
                <p className="border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
