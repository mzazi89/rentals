import { db } from "@/db";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap() {
  const [properties, agents] = await Promise.all([
    db<{ slug: string; updated_at: string }[]>`select slug, updated_at from properties where status = 'available' order by created_at desc limit 5000`,
    db<{ id: string }[]>`select id from agents where verification_status = 'verified' limit 5000`,
  ]);

  const staticPages = ["", "/properties", "/agents", "/about", "/contact", "/privacy", "/terms", "/safety"].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })
  );

  const propertyPages = properties.map((p) => ({
    url: `${BASE}/properties/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const agentPages = agents.map((a) => ({
    url: `${BASE}/agents/${a.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...propertyPages, ...agentPages];
}
