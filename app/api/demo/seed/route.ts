import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";

/**
 * DEMO SEED (development only) — clearly labelled demo data.
 * Creates demo users (tenant / agent / landlord), sample properties with
 * placeholder photos, a demo lease and a pending rent record.
 * Guarded by DEMO_SEED_SECRET or NODE_ENV=development.
 */
const DEMO_PASSWORD = "RentHubDemo2026!";

const DEMO_IMAGES: Record<string, string> = {
  "2 Bedroom Apartment in Kilimani": "https://sc02.alicdn.com/kf/A03cfe2ccb9d64dbca44af6bf3d655a13K.png",
  "Studio Apartment in Westlands": "https://sc02.alicdn.com/kf/A56c08c1202dd4c0fbcb2be0202261d65A.png",
  "3 Bedroom Maisonette in Kileleshwa": "https://sc02.alicdn.com/kf/A2cc822cffabc464a87ac3e7101e8c94fl.png",
  "Bedsitter in South C": "https://sc02.alicdn.com/kf/A15fd775336f044d390177653f0c25090w.png",
  "4 Bedroom House in Ruaka": "https://sc02.alicdn.com/kf/A2ba1cafdf6df4118b4a8dc583c41748bJ.png",
  "Executive Office Space in Upperhill": "https://sc02.alicdn.com/kf/A1492ee1909414873991549348764b790o.png",
};

const DEMO_PROPERTIES = [
  { title: "2 Bedroom Apartment in Kilimani", neighborhood: "Kilimani", city: "Nairobi", county: "Nairobi", monthly_rent: 45000, deposit_amount: 45000, bedrooms: 2, bathrooms: 2, furnished: true, description: "Modern 2-bedroom apartment in the heart of Kilimani. Fully furnished, secure compound with CCTV, backup generator and ample parking. Walking distance to Yaya Centre and major transport routes." },
  { title: "Studio Apartment in Westlands", neighborhood: "Westlands", city: "Nairobi", county: "Nairobi", monthly_rent: 28000, deposit_amount: 28000, bedrooms: 1, bathrooms: 1, furnished: false, description: "Bright studio apartment in Westlands, close to Sarit Centre and the Westgate Mall. Water included, prepaid electricity, secure parking available. Perfect for young professionals." },
  { title: "3 Bedroom Maisonette in Kileleshwa", neighborhood: "Kileleshwa", city: "Nairobi", county: "Nairobi", monthly_rent: 75000, deposit_amount: 75000, bedrooms: 3, bathrooms: 3, furnished: false, description: "Spacious 3-bedroom maisonette with a private garden in Kileleshwa. Borehole water, ample parking for two cars, 24-hour security. Minutes from Riverside and the CBD." },
  { title: "Bedsitter in South C", neighborhood: "South C", city: "Nairobi", county: "Nairobi", monthly_rent: 12000, deposit_amount: 12000, bedrooms: 1, bathrooms: 1, furnished: false, description: "Clean bedsitter in South C with water and electricity included in rent. Shared compound amenities, close to Green Park bus terminus. Ideal for students and young workers." },
  { title: "4 Bedroom House in Ruaka", neighborhood: "Ruaka", city: "Nairobi", county: "Kiambu", monthly_rent: 60000, deposit_amount: 60000, bedrooms: 4, bathrooms: 3, furnished: false, description: "Family-friendly 4-bedroom house in a gated community in Ruaka. Borehole water, backup generator, playground and 24-hour security. Near USIU and major shopping malls." },
  { title: "Executive Office Space in Upperhill", neighborhood: "Upperhill", city: "Nairobi", county: "Nairobi", monthly_rent: 90000, deposit_amount: 180000, bedrooms: 0, bathrooms: 2, furnished: true, description: "Premium executive office space in Upperhill with fibre internet, meeting rooms and a modern lobby. Ideal for startups and corporate offices. All utilities included." },
];

export async function GET(request: NextRequest) {
  const secret = process.env.DEMO_SEED_SECRET;
  const dev = process.env.NODE_ENV !== "production";
  if (secret && request.headers.get("x-demo-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!secret && !dev) {
    return NextResponse.json({ error: "demo seed is disabled in production" }, { status: 404 });
  }

  async function ensureUser(email: string, name: string, role: string) {
    const existingProfile = await db<{ id: string }[]>`select id from profiles where email = ${email}`;
    if (existingProfile[0]) return existingProfile[0].id;

    // Auth user may already exist (e.g. a previous partial seed) — reuse it
    // and create the missing profile instead of failing the FK chain.
    const existingUser = await db<{ id: string }[]>`select id from "user" where email = ${email}`;
    let userId = existingUser[0]?.id ?? null;
    if (!userId) {
      const { user } = await auth.api.signUpEmail({ body: { email, password: DEMO_PASSWORD, name } });
      if (!user) throw new Error(`signup failed for ${email}`);
      userId = user.id;
    }

    await db`
      insert into profiles (id, email, full_name, role, status, is_onboarded)
      values (${userId}, ${email}, ${name}, ${role}, 'active', true)
      on conflict (id) do update set role = ${role}, is_onboarded = true
    `;
    await db`update "user" set role = ${role} where id = ${userId}`;
    return userId;
  }

  try {
    const agentId = await ensureUser("agent@demo.renthub.co.ke", "Wanjiku Realty Agent", "agent");
    const landlordId = await ensureUser("landlord@demo.renthub.co.ke", "Demo Landlord", "landlord");
    const tenantId = await ensureUser("tenant@demo.renthub.co.ke", "Demo Tenant", "tenant");

    await db`
      insert into agents (id, agency_name, agency_phone, agency_address, years_experience, id_number, bio, areas_served, verification_status, is_available)
      values (${agentId}, 'Wanjiku Realty', '+254 711 111 111', 'Mara Road, Kilimani, Nairobi', 6, 'DEMO123456',
        'Demo agent profile for development.', ${["Kilimani", "Westlands", "Kileleshwa", "South C", "Ruaka"]}, 'verified', true)
      on conflict (id) do nothing
    `;
    await db`
      insert into landlords (id, company_name, address) values (${landlordId}, 'Demo Estates Ltd', 'Nairobi')
      on conflict (id) do nothing
    `;
    await db`
      insert into tenants (id, preferred_locations, min_budget, max_budget, occupation, employer, monthly_income)
      values (${tenantId}, ${["Kilimani", "Westlands", "Kileleshwa"]}, 20000, 80000, 'Software Engineer', 'Demo Corp', 150000)
      on conflict (id) do nothing
    `;

    const types = await db<{ id: string; name: string }[]>`select id, name from property_types`;
    const typeMap = new Map(types.map((t) => [t.name, t.id]));
    const amenities = await db<{ id: string; name: string }[]>`select id, name from amenities`;
    const amenityMap = new Map(amenities.map((a) => [a.name, a.id]));

    let firstPropertyId: string | null = null;
    for (const demo of DEMO_PROPERTIES) {
      const existing = await db<{ id: string }[]>`select id from properties where title = ${demo.title}`;
      if (existing[0]) {
        firstPropertyId ??= existing[0].id;
        continue;
      }
      const id = crypto.randomUUID();
      const slug = `${demo.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${id.slice(0, 6)}`;
      const typeName = demo.bedrooms >= 4 ? "House" : demo.bedrooms === 3 ? "Maisonette" : demo.bedrooms === 2 ? "Apartment" : demo.bedrooms === 0 ? "Office" : "Studio";
      await db`
        insert into properties (id, owner_id, agent_id, title, slug, description, property_type_id, status,
          monthly_rent, deposit_amount, bedrooms, bathrooms, furnished, neighborhood, city, county,
          latitude, longitude, approximate_location, availability_date, featured, verified)
        values (${id}, ${landlordId}, ${agentId}, ${demo.title}, ${slug}, ${demo.description}, ${typeMap.get(typeName) ?? null}, 'available',
          ${demo.monthly_rent}, ${demo.deposit_amount}, ${demo.bedrooms}, ${demo.bathrooms}, ${demo.furnished},
          ${demo.neighborhood}, ${demo.city}, ${demo.county}, ${-1.2921 + (Math.random() - 0.5) * 0.02},
          ${36.8219 + (Math.random() - 0.5) * 0.02}, true, ${new Date().toISOString().slice(0, 10)}, false, true)
      `;
      firstPropertyId ??= id;
      const image = DEMO_IMAGES[demo.title];
      if (image) {
        await db`
          insert into property_images (property_id, url, position, is_primary)
          values (${id}, ${image}, 0, true)
        `;
      }
      const names = ["Parking", "Security", "Water", "Electricity"];
      if (demo.furnished) names.push("Furnished");
      if (demo.monthly_rent > 40000) names.push("CCTV", "Backup Generator");
      if (demo.neighborhood === "Ruaka") names.push("Borehole");
      if (demo.neighborhood === "Kileleshwa") names.push("Garden");
      for (const n of names) {
        const amenityId = amenityMap.get(n);
        if (amenityId) {
          await db`insert into property_amenities (property_id, amenity_id) values (${id}, ${amenityId}) on conflict do nothing`;
        }
      }
    }

    if (firstPropertyId) {
      const lease = await db<{ id: string }[]>`select id from leases where tenant_id = ${tenantId} limit 1`;
      if (!lease[0]) {
        const start = new Date();
        const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
        const rent = await db<{ monthly_rent: number }[]>`select monthly_rent from properties where id = ${firstPropertyId}`;
        const inserted = await db`
          insert into leases (tenant_id, property_id, landlord_id, agent_id, start_date, end_date, monthly_rent, deposit_amount, payment_day, status)
          values (${tenantId}, ${firstPropertyId}, ${landlordId}, ${agentId},
            ${start.toISOString().slice(0, 10)}, ${end.toISOString().slice(0, 10)},
            ${rent[0]?.monthly_rent ?? 30000}, ${rent[0]?.monthly_rent ?? 30000}, 1, 'active')
          returning id
        `;
        const leaseId = (inserted as unknown as { id: string }[])[0]?.id;
        if (leaseId) {
          await db`
            insert into rent_records (lease_id, tenant_id, property_id, amount_due, amount_paid, due_date, status)
            values (${leaseId}, ${tenantId}, ${firstPropertyId}, ${rent[0]?.monthly_rent ?? 30000}, 0,
              ${new Date().toISOString().slice(0, 10)}, 'pending')
          `;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      note: "Demo data created (dev only — change passwords in production).",
      accounts: [
        { role: "tenant", email: "tenant@demo.renthub.co.ke", password: DEMO_PASSWORD },
        { role: "agent", email: "agent@demo.renthub.co.ke", password: DEMO_PASSWORD },
        { role: "landlord", email: "landlord@demo.renthub.co.ke", password: DEMO_PASSWORD },
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "seed failed" },
      { status: 500 }
    );
  }
}
