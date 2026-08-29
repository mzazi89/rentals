import { BadgeCheck, Building2, Handshake, ShieldCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About RentHub",
  description: "RentHub connects verified landlords, trusted rent agents and tenants across Kenya.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">About RentHub</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        RentHub is Kenya's rental marketplace and property management platform. We connect
        verified landlords, professional rent agents and tenants — making it simple to
        search, view, apply, pay and manage rentals from one trusted place.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Trust", desc: "Agents and properties are verified by our team before they go live." },
          { icon: Handshake, title: "Simplicity", desc: "Book viewings, apply and pay rent online — no paperwork chasing." },
          { icon: Building2, title: "For everyone", desc: "From bedsitters to villas, tenants to landlords — built for Kenya." },
        ].map((v) => (
          <div key={v.title} className="rounded-xl border bg-card p-6">
            <v.icon className="size-6 text-primary" />
            <h2 className="mt-3 font-semibold">{v.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border bg-muted/30 p-6">
        <h2 className="font-semibold">Our promise</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Payments are processed securely through verified gateways.</li>
          <li>• Never send money outside the platform without verifying the property and recipient.</li>
          <li>• Your personal information is never exposed publicly.</li>
        </ul>
      </div>
    </div>
  );
}
