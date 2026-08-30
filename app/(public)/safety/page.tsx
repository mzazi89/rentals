import {
  AlertTriangle,
  BadgeCheck,
  CreditCard,
  Eye,
  FileCheck2,
  HandCoins,
  MessageSquareWarning,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/layout";
import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Rental safety guide",
  description: "How to stay safe when searching, viewing and paying for rentals on RentHub.",
  path: "/safety",
});

const TIPS = [
  {
    icon: HandCoins,
    tone: "text-destructive",
    title: "Never send money outside the platform",
    body: "If anyone asks you to pay via M-Pesa, bank transfer or cash directly to them instead of through RentHub, stop and report them immediately. Scammers often ask for 'reservation fees' on fake listings — a genuine landlord or agent will never push you off-platform to pay.",
  },
  {
    icon: BadgeCheck,
    tone: "text-success",
    title: "Check verification badges",
    body: "Prefer verified agents and verified properties. Our team screens agents' identification and agency details before verification, and landlords are reviewed by the platform owner before their buildings appear in explore. If someone tells you they are 'verified' but you can't see a badge, be suspicious.",
  },
  {
    icon: Eye,
    tone: "text-primary",
    title: "Always view before you pay",
    body: "Book a viewing and physically inspect the property before paying any deposit or signing a lease. Check that the house number, floor and unit you were shown match what the listing promised. Never pay a deposit for a property you have not seen in person.",
  },
  {
    icon: CreditCard,
    tone: "text-primary",
    title: "Pay only through RentHub",
    body: "In-platform payments are verified and you'll receive a receipt in your dashboard. Off-platform payments cannot be protected, traced or recovered. If a price or deal sounds too good to be true, it usually is.",
  },
  {
    icon: UserCheck,
    tone: "text-success",
    title: "Meet the agent or landlord in person",
    body: "Arrange your viewing with the named agent or landlord on the listing. If you're unsure, meet in a public place first and ask to see identification and any agency or ownership documentation before you commit to anything.",
  },
  {
    icon: FileCheck2,
    tone: "text-primary",
    title: "Read the lease before you sign",
    body: "Check the rent, deposit, payment date, notice period and any additional charges carefully. Make sure the names match the people you've been dealing with, and keep a copy of the signed agreement. Never sign a blank or incomplete lease.",
  },
  {
    icon: MessageSquareWarning,
    tone: "text-warning",
    title: "Keep communication on the platform",
    body: "Use RentHub's messaging so there is a record of what was agreed. If someone insists on moving to WhatsApp or email for everything, that may be a way to avoid accountability — keep the paper trail.",
  },
  {
    icon: AlertTriangle,
    tone: "text-destructive",
    title: "Spot the common scams",
    body: "Beware of: listings priced far below the market, landlords who are 'out of the country' and need rent sent immediately, requests for 'inspection fees' or 'holding fees' before you have seen the property, and anyone who pressures you to decide in minutes. All of these are classic red flags.",
  },
  {
    icon: ShieldCheck,
    tone: "text-success",
    title: "Report suspicious activity",
    body: "Use the report button on any property or agent profile — it takes seconds and is anonymous to the other party. Our moderation team investigates every report, and repeat offenders are removed from the platform.",
  },
];

export default function SafetyPage() {
  return (
    <div>
      <PublicPageHero
        title="Rental safety guide"
        subtitle="A few minutes of caution can save you from a costly mistake. Keep these tips in mind throughout your rental journey."
        image={PAGE_IMAGES.dusk}
      />

      <div className="container max-w-3xl py-10">
        <div className="space-y-4">
          {TIPS.map((t) => (
            <Card key={t.title}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <t.icon className={`mt-0.5 size-5 shrink-0 ${t.tone}`} />
                  <div>
                    <h2 className="font-semibold">{t.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="font-semibold">What to do if something goes wrong</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Stop all communication and do not send any more money.</li>
              <li>Report the property, agent or landlord through the platform's report button.</li>
              <li>Save every message, receipt and screenshot as evidence.</li>
              <li>Contact the RentHub support team at support@renthub.co.ke with the details.</li>
              <li>If you have lost money to fraud, report the matter to the police and your payment provider as soon as possible.</li>
            </ol>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Have a question about a listing?{" "}
          <Link href="/contact" className="font-medium text-primary underline">
            Contact our team
          </Link>{" "}
          — we're happy to help.
        </p>
      </div>
    </div>
  );
}
