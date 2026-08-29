import "server-only";

import postgres from "postgres";
import { db } from "@/db";
import { getSettings } from "@/lib/settings";
import type {
  Agent,
  Application,
  Amenity,
  BuildingFloor,
  BuildingUnit,
  Conversation,
  Lease,
  Message,
  Notification,
  Payment,
  Profile,
  Property,
  PropertyImage,
  PropertyType,
  RentRecord,
  Viewing,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Property relations assembler                                       */
/* ------------------------------------------------------------------ */

export interface PropertyWithRelations extends Property {
  property_type: PropertyType | null;
  images: PropertyImage[];
  agent: (Partial<Profile> & { agents?: Partial<Agent> | null }) | null;
  owner: Partial<Profile> | null;
  amenity_list: { amenity: { id: string; name: string; icon: string | null } }[];
}

const PROPERTY_COLS = `p.id, p.owner_id, p.agent_id, p.title, p.slug, p.description,
  p.property_type_id, p.status, p.monthly_rent, p.deposit_amount, p.bedrooms,
  p.bathrooms, p.size, p.furnished, p.address, p.neighborhood, p.city, p.county,
  p.latitude, p.longitude, p.approximate_location, p.availability_date, p.featured,
  p.verified, p.rejection_reason, p.views_count, p.created_at, p.updated_at`;

/** Attach types, images, agent, owner and amenities to property rows. */
export async function attachPropertyRelations(
  rows: Property[]
): Promise<PropertyWithRelations[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const agentIds = [...new Set(rows.map((r) => r.agent_id).filter(Boolean))] as string[];
  const ownerIds = [...new Set(rows.map((r) => r.owner_id))];

  const [images, types, amenities, agentProfiles, owners] = await Promise.all([
    db<PropertyImage[]>`
      select * from property_images where property_id = any(${ids}) order by position
    `,
    db<PropertyType[]>`
      select * from property_types where id = any(${rows.map((r) => r.property_type_id).filter(Boolean)})
    `,
    db<{ property_id: string; amenity: { id: string; name: string; icon: string | null } }[]>`
      select pa.property_id, jsonb_build_object('id', a.id, 'name', a.name, 'icon', a.icon) as amenity
      from property_amenities pa join amenities a on a.id = pa.amenity_id
      where pa.property_id = any(${ids})
    `,
    agentIds.length > 0
      ? db<
          (Partial<Profile> & {
            agents?: (Partial<Agent> & { profile?: Partial<Profile> }) | null;
          })[]
        >`
          select pr.id, pr.full_name, pr.avatar_url, pr.role, pr.phone,
            jsonb_build_object(
              'id', ag.id, 'agency_name', ag.agency_name, 'verification_status', ag.verification_status,
              'is_available', ag.is_available, 'areas_served', ag.areas_served, 'bio', ag.bio
            ) as agents
          from profiles pr
          left join agents ag on ag.id = pr.id
          where pr.id = any(${agentIds})
        `
      : Promise.resolve([]),
    db<Partial<Profile>[]>`select id, full_name, avatar_url from profiles where id = any(${ownerIds})`,
  ]);

  const imageMap = groupBy(images, (i) => i.property_id);
  const typeMap = new Map(types.map((t) => [t.id, t]));
  const amenityMap = groupBy(amenities, (a) => a.property_id);
  const agentMap = new Map(agentProfiles.map((a) => [a.id, a]));
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  return rows.map((p) => ({
    ...p,
    property_type: p.property_type_id ? (typeMap.get(p.property_type_id) ?? null) : null,
    images: imageMap.get(p.id) ?? [],
    agent: p.agent_id ? ((agentMap.get(p.agent_id) as PropertyWithRelations["agent"]) ?? null) : null,
    owner: p.owner_id ? (ownerMap.get(p.owner_id) ?? null) : null,
    amenity_list: (amenityMap.get(p.id) ?? []).map((a) => ({ amenity: a.amenity })),
  }));
}

function groupBy<T>(rows: T[], key: (r: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    const arr = map.get(k) ?? [];
    arr.push(row);
    map.set(k, arr);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Property fetching                                                  */
/* ------------------------------------------------------------------ */

export interface PropertyListResult {
  properties: PropertyWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchPublicProperties(filters: {
  q?: string;
  location?: string;
  county?: string;
  neighborhood?: string;
  type?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  verifiedOnly?: boolean;
  featuredOnly?: boolean;
  amenities?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<PropertyListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(24, Math.max(6, filters.pageSize ?? 12));

  const settings = await getSettings();

  // Conditions are assembled with positional parameters via db.unsafe.
  const conds: string[] = ["p.status = 'available'"];
  if (settings.requireLandlordVerification) {
    conds.push(
      "exists (select 1 from landlords ld where ld.id = p.owner_id and ld.verification_status = 'verified')"
    );
  }
  const params: unknown[] = [];
  const param = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };
  const like = (col: string, value: string) => `p.${col} ilike ${param(`%${value}%`)}`;

  if (filters.q) {
    conds.push(like("title", filters.q), like("city", filters.q));
  }
  if (filters.location) {
    conds.push(
      `(p.city ilike ${param(`%${filters.location}%`)} or p.neighborhood ilike ${param(`%${filters.location}%`)} or p.county ilike ${param(`%${filters.location}%`)})`
    );
  }
  if (filters.county) conds.push(like("county", filters.county));
  if (filters.neighborhood) conds.push(like("neighborhood", filters.neighborhood));
  if (filters.type) conds.push(`p.property_type_id = ${param(filters.type)}`);
  if (filters.minRent !== undefined) conds.push(`p.monthly_rent >= ${param(filters.minRent)}`);
  if (filters.maxRent !== undefined) conds.push(`p.monthly_rent <= ${param(filters.maxRent)}`);
  if (filters.bedrooms !== undefined && filters.bedrooms > 0) conds.push(`p.bedrooms >= ${param(filters.bedrooms)}`);
  if (filters.bathrooms !== undefined && filters.bathrooms > 0) conds.push(`p.bathrooms >= ${param(filters.bathrooms)}`);
  if (filters.furnished) conds.push("p.furnished = true");
  if (filters.verifiedOnly) conds.push("p.verified = true");
  if (filters.featuredOnly) conds.push("p.featured = true");

  if (filters.amenities && filters.amenities.length > 0) {
    conds.push(
      `p.id in (select property_id from property_amenities where amenity_id = any(${param(filters.amenities)}) group by property_id having count(distinct amenity_id) = ${param(filters.amenities.length)})`
    );
  }

  const orderBy =
    filters.sort === "lowest_rent"
      ? "p.monthly_rent asc"
      : filters.sort === "highest_rent"
        ? "p.monthly_rent desc"
        : filters.sort === "most_popular"
          ? "p.views_count desc"
          : filters.sort === "recommended"
            ? "p.featured desc, p.views_count desc"
            : "p.created_at desc";

  const whereSql = conds.join(" and ");

  const countResult = await db.unsafe<{ total: number }[]>(
    `select count(*)::int as total from properties p where ${whereSql}`,
    params as never[]
  );
  const total = countResult[0]?.total ?? 0;

  const rows = await db.unsafe<Property[]>(
    `select ${PROPERTY_COLS} from properties p where ${whereSql} order by ${orderBy} limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, pageSize, (page - 1) * pageSize] as never[]
  );

  return { properties: await attachPropertyRelations(rows), total, page, pageSize };
}

export async function fetchPropertyBySlug(slug: string): Promise<PropertyWithRelations | null> {
  const rows = await db<Property[]>`select ${db.unsafe(PROPERTY_COLS)} from properties p where p.slug = ${slug}`;
  if (rows.length === 0) return null;
  const [property] = await attachPropertyRelations(rows);
  return property;
}

export async function fetchPropertyById(id: string): Promise<PropertyWithRelations | null> {
  const rows = await db<Property[]>`select ${db.unsafe(PROPERTY_COLS)} from properties p where p.id = ${id}`;
  if (rows.length === 0) return null;
  const [property] = await attachPropertyRelations(rows);
  return property;
}

export async function fetchSimilarProperties(
  property: Pick<Property, "id" | "property_type_id" | "city">,
  limit = 3
): Promise<PropertyWithRelations[]> {
  const rows = await db<Property[]>`
    select ${db.unsafe(PROPERTY_COLS)}
    from properties p
    where p.status = 'available' and p.id <> ${property.id}
      and (${property.property_type_id ? db`p.property_type_id = ${property.property_type_id}` : db`p.city ilike ${`%${property.city ?? ""}%`}`})
    order by p.views_count desc
    limit ${limit}
  `;
  return attachPropertyRelations(rows);
}

export function incrementPropertyViews(propertyId: string): Promise<void> {
  return db`update properties set views_count = views_count + 1 where id = ${propertyId}`.then(() => undefined);
}

/* ------------------------------------------------------------------ */
/* Agents                                                             */
/* ------------------------------------------------------------------ */

export interface AgentWithProfile extends Partial<Agent> {
  profile?: (Partial<Profile> & { agents?: Partial<Agent> | null }) | null;
  property_count?: number;
}

const AGENT_SELECT = `
  ag.id, ag.agency_name, ag.agency_phone, ag.agency_address, ag.years_experience,
  ag.bio, ag.areas_served, ag.is_available, ag.verification_status,
  jsonb_build_object(
    'id', pr.id, 'full_name', pr.full_name, 'email', pr.email, 'phone', pr.phone,
    'avatar_url', pr.avatar_url, 'created_at', pr.created_at
  ) as profile
`;

export async function fetchVerifiedAgents(limit = 8): Promise<AgentWithProfile[]> {
  const rows = await db<AgentWithProfile[]>`
    select ${db.unsafe(AGENT_SELECT)}
    from agents ag
    join profiles pr on pr.id = ag.id
    where ag.verification_status = 'verified'
    order by ag.created_at desc
    limit ${limit}
  `;
  return rows;
}

export async function fetchAgentById(id: string): Promise<AgentWithProfile | null> {
  const rows = await db<AgentWithProfile[]>`
    select ${db.unsafe(AGENT_SELECT)}
    from agents ag
    join profiles pr on pr.id = ag.id
    where ag.id = ${id}
  `;
  return rows[0] ?? null;
}

export async function countActiveListingsForAgent(agentId: string): Promise<number> {
  if (!agentId) return 0;
  const rows = await db<{ total: number }[]>`
    select count(*)::int as total from properties where agent_id = ${agentId} and status = 'available'
  `;
  return rows[0]?.total ?? 0;
}

/* ------------------------------------------------------------------ */
/* Favorites                                                          */
/* ------------------------------------------------------------------ */

export async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const rows = await db<{ property_id: string }[]>`select property_id from favorites where user_id = ${userId}`;
  return new Set(rows.map((r) => r.property_id));
}

export async function isFavorited(userId: string, propertyId: string): Promise<boolean> {
  const rows = await db<{ property_id: string }[]>`
    select property_id from favorites where user_id = ${userId} and property_id = ${propertyId}
  `;
  return rows.length > 0;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                      */
/* ------------------------------------------------------------------ */

export async function fetchNotifications(userId: string, limit = 50): Promise<Notification[]> {
  return db<Notification[]>`
    select * from notifications where user_id = ${userId}
    order by created_at desc limit ${limit}
  `;
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const rows = await db<{ total: number }[]>`
    select count(*)::int as total from notifications
    where user_id = ${userId} and is_read = false
  `;
  return rows[0]?.total ?? 0;
}

/* ------------------------------------------------------------------ */
/* Conversations & messages                                           */
/* ------------------------------------------------------------------ */

export interface ConversationListItem {
  id: string;
  last_message_at: string | null;
  property_title?: string | null;
  other_name?: string | null;
  other_avatar?: string | null;
  last_message?: string | null;
  unread_count: number;
}

export async function fetchConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const rows = await db<
    {
      id: string;
      last_message_at: string | null;
      property_title: string | null;
      other_name: string | null;
      other_avatar: string | null;
      last_message: string | null;
      unread_count: number;
    }[]
  >`
    select
      c.id,
      c.last_message_at,
      p.title as property_title,
      op.full_name as other_name,
      op.avatar_url as other_avatar,
      lm.body as last_message,
      cm.unread_count
    from conversation_members cm
    join conversations c on c.id = cm.conversation_id
    left join properties p on p.id = c.property_id
    join conversation_members other_cm on other_cm.conversation_id = c.id and other_cm.user_id <> ${userId}
    join profiles op on op.id = other_cm.user_id
    left join lateral (
      select body from messages where conversation_id = c.id order by created_at desc limit 1
    ) lm on true
    where cm.user_id = ${userId}
    order by c.last_message_at desc nulls last
  `;
  return rows;
}

export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  return db<Message[]>`
    select * from messages where conversation_id = ${conversationId}
    order by created_at asc limit 200
  `;
}

export async function fetchConversationPropertyTitle(conversationId: string): Promise<string | null> {
  const rows = await db<{ title: string | null }[]>`
    select p.title from conversations c
    left join properties p on p.id = c.property_id
    where c.id = ${conversationId}
  `;
  return rows[0]?.title ?? null;
}

/* ------------------------------------------------------------------ */
/* Joined row fetchers (used by dashboards)                           */
/* ------------------------------------------------------------------ */

export async function fetchViewingsWithJoins(
  clause: postgres.PendingQuery<postgres.Row[]>
): Promise<(Viewing & { property?: Property | null; tenant?: Partial<Profile> | null })[]> {
  const rows = await db`
    select v.*,
      jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property,
      jsonb_build_object('id', t.id, 'full_name', t.full_name, 'phone', t.phone) as tenant
    from viewings v
    left join properties p on p.id = v.property_id
    left join profiles t on t.id = v.tenant_id
    ${clause}
    order by v.scheduled_at desc
    limit 200
  `;
  return rows as unknown as (Viewing & { property?: Property | null; tenant?: Partial<Profile> | null })[];
}

export async function fetchApplicationsWithJoins(
  clause: postgres.PendingQuery<postgres.Row[]>
): Promise<(Application & { property?: Property | null })[]> {
  const rows = await db`
    select a.*,
      jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug) as property
    from applications a
    left join properties p on p.id = a.property_id
    ${clause}
    order by a.created_at desc
    limit 200
  `;
  return rows as unknown as (Application & { property?: Property | null })[];
}

export async function fetchLeasesWithJoins(
  clause: postgres.PendingQuery<postgres.Row[]>
): Promise<
  (Lease & {
    property?: Property | null;
    tenant?: Partial<Profile> | null;
    landlord?: Partial<Profile> | null;
    agent?: Partial<Profile> | null;
  })[]
> {
  return db`
    select l.*,
      jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'monthly_rent', p.monthly_rent, 'city', p.city, 'neighborhood', p.neighborhood, 'county', p.county, 'deposit_amount', p.deposit_amount) as property,
      jsonb_build_object('id', t.id, 'full_name', t.full_name, 'phone', t.phone, 'avatar_url', t.avatar_url) as tenant,
      jsonb_build_object('id', ld.id, 'full_name', ld.full_name) as landlord,
      jsonb_build_object('id', ag.id, 'full_name', ag.full_name) as agent
    from leases l
    left join properties p on p.id = l.property_id
    left join profiles t on t.id = l.tenant_id
    left join profiles ld on ld.id = l.landlord_id
    left join profiles ag on ag.id = l.agent_id
    ${clause}
    order by l.created_at desc
    limit 200
  `;
}

export async function fetchPaymentsWithJoins(
  clause: postgres.PendingQuery<postgres.Row[]>
): Promise<
  (Payment & {
    property?: Property | null;
    tenant?: Partial<Profile> | null;
  })[]
> {
  const rows = await db`
    select pay.*,
      jsonb_build_object('id', p.id, 'title', p.title) as property,
      jsonb_build_object('id', t.id, 'full_name', t.full_name) as tenant
    from payments pay
    left join properties p on p.id = pay.property_id
    left join profiles t on t.id = pay.tenant_id
    ${clause}
    order by pay.created_at desc
    limit 200
  `;
  return rows as unknown as (Payment & { property?: Property | null; tenant?: Partial<Profile> | null })[];
}

export type { Amenity };
export { db };

/** Properties listed by one agent (optionally status-filtered). */
export async function fetchPropertiesByAgent(
  agentId: string,
  status?: string
): Promise<PropertyWithRelations[]> {
  if (!agentId) return [];
  const rows = await db<Property[]>`
    select ${db.unsafe(PROPERTY_COLS)}
    from properties p
    where p.agent_id = ${agentId}
    ${status ? db`and p.status = ${status}` : db``}
    order by p.created_at desc
  `;
  return attachPropertyRelations(rows);
}


/* ------------------------------------------------------------------ */
/* Building floors & units                                            */
/* ------------------------------------------------------------------ */

export interface FloorWithUnits extends BuildingFloor {
  units: BuildingUnit[];
}

export async function fetchFloorsWithUnits(propertyId: string): Promise<FloorWithUnits[]> {
  const floors = await db<BuildingFloor[]>`
    select * from building_floors where property_id = ${propertyId} order by position, name
  `;
  if (floors.length === 0) {
    // Units without a floor (flat structure)
    const units = await db<BuildingUnit[]>`
      select * from building_units where property_id = ${propertyId} and floor_id is null
      order by unit_number
    `;
    return [{ id: "no-floor", property_id: propertyId, name: "Ground", position: 0, created_at: new Date().toISOString(), units }];
  }
  const ids = floors.map((f) => f.id);
  const units = await db<BuildingUnit[]>`
    select * from building_units where property_id = ${propertyId}
      and (floor_id = any(${ids}) or floor_id is null)
    order by unit_number
  `;
  const unitMap = new Map<string, BuildingUnit[]>();
  for (const u of units) {
    const key = u.floor_id ?? "no-floor";
    const arr = unitMap.get(key) ?? [];
    arr.push(u);
    unitMap.set(key, arr);
  }
  return floors.map((f) => ({ ...f, units: unitMap.get(f.id) ?? [] }));
}

export async function countAvailableUnits(propertyId: string): Promise<number> {
  const rows = await db<{ n: number }[]>`
    select count(*)::int as n from building_units
    where property_id = ${propertyId} and status = 'available'
  `;
  return rows[0]?.n ?? 0;
}
