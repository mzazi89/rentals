import "server-only";

import {
  fetchPublicProperties,
  fetchPropertyBySlug,
  fetchSimilarProperties,
  fetchVerifiedAgents,
  fetchAgentById,
  countActiveListingsForAgent as countListings,
  incrementPropertyViews as incrementViews,
  isFavorited,
} from "@/lib/db/queries";
import type { Property, PropertyFilters } from "@/types";

export type { PropertyWithRelations, AgentWithProfile } from "@/lib/db/queries";

export const PUBLIC_STATUSES = ["available"];

/** Public property listing (paginated, filterable). */
export async function getPublicProperties(filters: PropertyFilters = {}) {
  return fetchPublicProperties(filters);
}

export async function getFeaturedProperties(limit = 6) {
  const { properties } = await fetchPublicProperties({
    featuredOnly: true,
    pageSize: limit,
    sort: "most_popular",
  });
  return properties;
}

export async function getPropertyBySlug(slug: string, viewerId?: string | null) {
  const property = await fetchPropertyBySlug(slug);
  if (property && viewerId) {
    property.is_favorited = await isFavorited(viewerId, property.id);
  }
  return property;
}

export async function getSimilarProperties(
  property: Pick<Property, "id" | "property_type_id" | "city">,
  limit = 3
) {
  return fetchSimilarProperties(property, limit);
}

export function incrementPropertyViews(propertyId: string): Promise<void> {
  return incrementViews(propertyId);
}

export async function getVerifiedAgents(limit = 8) {
  return fetchVerifiedAgents(limit);
}

export async function getAgentById(id: string) {
  return fetchAgentById(id);
}

export async function countActiveListingsForAgent(agentId: string): Promise<number> {
  return countListings(agentId);
}
