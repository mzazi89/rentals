import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Handshake,
  Home,
  MapPin,
  ShieldCheck,
  Search,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { getSettings } from "@/lib/settings";
import { getFeaturedProperties, getVerifiedAgents, PUBLIC_STATUSES } from "@/lib/queries";
import { PropertyCard, PropertyGrid, PropertyCardSkeleton, PropertySearchBar } from "@/components/properties";
import { AgentCard, type AgentWithProfileCard } from "@/components/agents";

export const dynamic = "force-dynamic";

const HERO_IMAGE = "https://sc02.alicdn.com/kf/Aee86ed55183f40e5b6d3be876c8896816.png";
const CTA_IMAGE = "https://sc02.alicdn.com/kf/Ab8730c0b48284b1ea8fa9315126ccbf10.png";

async function fetchStats() {
  const [properties, agents, tenants, counties] = await Promise.all([
    db<{ n: number }[]>`select count(*)::int as n from properties where status = any(${PUBLIC_STATUSES})`,
    db<{ n: number }[]>`select count(*)::int as n from agents where verification_status = 'verified'`,
    db<{ n: number }[]>`select count(*)::int as n from profiles where role = 'tenant'`,
    db<{ n: number }[]>`select count(distinct county)::int as n from properties where status = any(${PUBLIC_STATUSES})`,
  ]);
  return {
    properties: properties[0]?.n ?? 0,
    agents: agents[0]?.n ?? 0,
    tenants: tenants[0]?.n ?? 0,
    counties: Math.min(10, Math.max(1, counties[0]?.n ?? 1)),
  };
}

export default async function HomePage() {
  const settings = await getSettings();
  const [featured, agents, stats, locations, types] = await Promise.all([
    getFeaturedProperties(4),
    getVerifiedAgents(4),
    fetchStats(),
    db<{ id: string; name: string }[]>`
      select id, name from locations
      where type = 'neighborhood' and is_active = true order by sort_order limit 8
    `,
    db<{ id: string; name: string; icon: string | null }[]>`
      select id, name, icon from property_types
      where is_active = true order by sort_order limit 8
    `,
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80"
        />
        <div className="container relative py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="size-3.5" /> Trusted rental marketplace — Kenya
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-5xl">
              {settings.tagline}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base">
              Search verified rental properties, connect with trusted agents, schedule
              viewings, and manage your rental journey from one platform.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <Suspense fallback={<div className="skeleton h-16 rounded-2xl" />}>
              <PropertySearchBar />
            </Suspense>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-6 text-center sm:grid-cols-4">
            {[
              { value: `${stats.properties}+`, label: "Properties" },
              { value: `${stats.agents}+`, label: "Verified Agents" },
              { value: `${stats.counties}`, label: "Counties" },
              { value: `${stats.tenants}+`, label: "Happy Tenants" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
                <p className="mt-0.5 text-xs text-white/75 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured properties ───────────────────────────────── */}
      <section className="container py-12 sm:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured properties</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hand-picked rentals our agents recommend first.</p>
          </div>
          <Link href="/properties?featuredOnly=true" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <PropertyGrid>
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
          {featured.length === 0 ? (
            <p className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No featured properties yet — check back soon or{" "}
              <Link href="/properties" className="text-primary hover:underline">browse all properties</Link>.
            </p>
          ) : null}
        </PropertyGrid>
      </section>

      {/* ── Popular locations ────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-12 sm:py-16">
          <h2 className="text-2xl font-bold">Popular locations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start your search in Kenya's favourite neighborhoods.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {locations.map((loc) => (
              <Link
                key={loc.id}
                href={`/properties?location=${encodeURIComponent(loc.name)}`}
                className="group flex items-center gap-2 rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <MapPin className="size-4 text-primary" />
                <span className="text-sm font-medium">{loc.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="container py-12 sm:py-16">
        <h2 className="text-2xl font-bold">Browse by type</h2>
        <p className="mt-1 text-sm text-muted-foreground">From bedsitters to villas — find the right fit.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {types.map((t) => (
            <Link
              key={t.id}
              href={`/properties?type=${t.id}`}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <Building2 className="size-6 text-primary" />
              <span className="text-sm font-medium">{t.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-12 sm:py-16">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Search, title: "1. Search", desc: "Filter by location, budget and type to find properties you'll love." },
              { icon: CalendarCheck, title: "2. View & apply", desc: "Book a viewing with the agent, then apply in minutes." },
              { icon: Handshake, title: "3. Move in & pay", desc: "Sign your lease, pay rent securely and track everything online." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border bg-card p-6 shadow-card">
                <s.icon className="size-7 text-primary" />
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verified agents ──────────────────────────────────── */}
      <section className="container py-12 sm:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Trusted agents</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every agent is verified by our team.</p>
          </div>
          <Link href="/agents" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            All agents <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(agents as AgentWithProfileCard[]).map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
          {agents.length === 0 ? (
            <p className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Verified agents will appear here once they join.
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Safety banner ────────────────────────────────────── */}
      <section className="container pb-12">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-sm text-amber-100 sm:flex-row sm:text-left">
          <ShieldCheck className="size-8 shrink-0 text-amber-400" />
          <p>
            <strong>Stay safe.</strong> {settings.safetyTip}{" "}
            <Link href="/safety" className="font-medium underline">Read our rental safety guide →</Link>
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="container pb-16">
        <div className="relative overflow-hidden rounded-2xl p-10 text-center text-white sm:p-14">
          <img
            src={CTA_IMAGE}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-black/70" />
          <div className="relative flex flex-col items-center gap-5">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to find your next home?</h2>
            <p className="max-w-lg text-sm text-white/85">
              Join RentHub today — whether you're renting, letting or listing properties.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-foreground shadow hover:bg-white/90"
              >
                <Users className="size-4" /> Create free account
              </Link>
              <Link
                href="/properties"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/40 px-6 text-sm font-semibold hover:bg-white/10"
              >
                <Home className="size-4" /> Browse properties
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
