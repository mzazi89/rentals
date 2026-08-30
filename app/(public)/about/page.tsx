import { BadgeCheck, Building2, Handshake, Home, KeyRound, ShieldCheck, Users } from "lucide-react";
import { PublicPageHero, PAGE_IMAGES } from "@/components/public-page-hero";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About RentHub",
  description:
    "RentHub is Kenya's rental marketplace and property management platform — connecting verified landlords, professional rent agents and tenants.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div>
      <PublicPageHero
        title="About RentHub"
        subtitle="Kenya's rental marketplace and property management platform — built to make renting simple, safe and transparent for everyone."
        image={PAGE_IMAGES.facade}
      />

      <div className="container max-w-3xl py-10">
        {/* Story */}
        <section>
          <h2 className="text-2xl font-bold">Our story</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
            <p>
              Finding a place to rent in Kenya has always meant endless drives from one building
              to the next, stacks of photocopied applications, and the constant worry of whether
              a listing — or a landlord — is genuine. RentHub was built to end that chaos.
            </p>
            <p>
              We started with a simple observation: tenants want to browse trusted homes from
              their phone, landlords want to manage their buildings without drowning in
              paperwork, and professional rent agents want a clear, structured way to do their
              job. The rental market in Kenya is vibrant and growing, yet it runs on word of
              mouth and informal processes. RentHub brings structure to that energy.
            </p>
            <p>
              Today, RentHub is a full rental platform: verified landlords, trusted agents,
              structured buildings with real floors and house numbers, online viewings and
              applications, digital leases, rent payments with receipts, and one place to manage
              it all. Every building is checked by our team before it appears in explore, and
              every landlord is verified by the platform owner.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mt-10 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-bold">Our mission</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            To make finding, securing and managing a rental home in Kenya as trustworthy and
            effortless as possible — so that every tenant finds a home they can trust, every
            landlord runs their buildings with clarity, and every agent works on a level playing
            field.
          </p>
        </section>

        {/* Values */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">What we stand for</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Trust first",
                desc: "Agents are verified, landlords are checked by the owner, and buildings are reviewed before they appear in explore. You always know who you're dealing with.",
              },
              {
                icon: Handshake,
                title: "Simplicity",
                desc: "Book viewings, submit applications, sign leases and pay rent online — no paper chasing, no back-and-forth phone tag.",
              },
              {
                icon: Home,
                title: "Built for Kenya",
                desc: "From bedsitters in Kilimani to apartments in Westlands and houses in Kitisuru — the platform is designed around how Kenyans actually rent.",
              },
              {
                icon: Users,
                title: "Everyone wins",
                desc: "Tenants get choice and safety, agents get structure and visibility, landlords get control over every floor and unit.",
              },
            ].map((v) => (
              <div key={v.title} className="rounded-xl border bg-card p-5">
                <v.icon className="size-6 text-primary" />
                <h3 className="mt-3 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Who RentHub is for</h2>
          <div className="mt-5 space-y-4">
            {[
              {
                icon: Home,
                title: "Tenants",
                body: "Browse every verified building, compare prices across counties and neighbourhoods, save favourites, book viewings, apply online and track your lease and rent payments — all from one account.",
              },
              {
                icon: KeyRound,
                title: "Landlords",
                body: "Add your floors and house numbers once, and keep every unit accurate. See everything related to your property — applications, viewings, payments — in one dashboard, and let verified agents handle the day-to-day.",
              },
              {
                icon: BadgeCheck,
                title: "Rent agents",
                body: "Get work assigned to you by the owner, manage the buildings you're responsible for, process tenant requests, and mark taken rooms in every building — with your commissions tracked in one place.",
              },
              {
                icon: Building2,
                title: "Property owners",
                body: "Run the platform: add buildings, verify landlords and agents, assign work, review every listing, and keep the marketplace safe and honest.",
              },
            ].map((r) => (
              <div key={r.title} className="flex items-start gap-4 rounded-xl border bg-card p-5">
                <r.icon className="mt-0.5 size-6 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Promise */}
        <section className="mt-10 rounded-xl border bg-muted/30 p-6">
          <h2 className="font-semibold">Our promise to you</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• Payments are processed securely through the platform's verified payment flow — never ask you to pay an individual directly.</li>
            <li>• Agents and landlords go through verification before they can operate on the platform.</li>
            <li>• Your personal information is never exposed publicly.</li>
            <li>• Every report is reviewed, and every concern gets a human response.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
