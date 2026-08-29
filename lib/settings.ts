import "server-only";

import { cache } from "react";
import { db } from "@/db";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/constants";

/**
 * Platform settings, merged over defaults. Cached per request.
 * Admin can change these in the database (platform_settings table).
 */
export const getSettings = cache(async (): Promise<AppSettings> => {
  const rows = await db<{ key: string; value: unknown }[]>`
    select key, value from platform_settings
  `;
  const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const s: AppSettings = {
    siteName: String(raw["site.name"] ?? DEFAULT_SETTINGS.siteName),
    tagline: String(raw["site.tagline"] ?? DEFAULT_SETTINGS.tagline),
    currency: String(raw["site.currency"] ?? DEFAULT_SETTINGS.currency),
    currencyLocale: String(raw["site.currency_locale"] ?? DEFAULT_SETTINGS.currencyLocale),
    timezone: String(raw["site.timezone"] ?? DEFAULT_SETTINGS.timezone),
    contactEmail: String(raw["site.contact_email"] ?? DEFAULT_SETTINGS.contactEmail),
    contactPhone: String(raw["site.contact_phone"] ?? DEFAULT_SETTINGS.contactPhone),
    supportEmail: String(raw["site.support_email"] ?? DEFAULT_SETTINGS.supportEmail),
    address: String(raw["site.address"] ?? DEFAULT_SETTINGS.address),
    safetyTip: String(raw["site.safety_tip"] ?? DEFAULT_SETTINGS.safetyTip),
    applicationFee: Number(raw["payments.application_fee"] ?? DEFAULT_SETTINGS.applicationFee),
    bookingFee: Number(raw["payments.booking_fee"] ?? DEFAULT_SETTINGS.bookingFee),
    rentCommissionRate: Number(raw["commissions.rent_rate"] ?? DEFAULT_SETTINGS.rentCommissionRate),
    depositCommissionRate: Number(raw["commissions.deposit_rate"] ?? DEFAULT_SETTINGS.depositCommissionRate),
    requirePropertyVerification:
      String(raw["features.require_property_verification"] ?? "true") === "true",
    requireAgentVerification:
      String(raw["features.require_agent_verification"] ?? "true") === "true",
    requireLandlordVerification:
      String(raw["features.require_landlord_verification"] ?? "true") === "true",
    allowPublicRegistration:
      String(raw["features.allow_public_registration"] ?? "true") === "true",
    allowLandlordRegistration:
      String(raw["features.allow_landlord_registration"] ?? "true") === "true",
    defaultDescription: String(
      raw["seo.default_description"] ?? DEFAULT_SETTINGS.defaultDescription
    ),
    social: {
      facebook: String(raw["social.facebook"] ?? DEFAULT_SETTINGS.social.facebook),
      instagram: String(raw["social.instagram"] ?? DEFAULT_SETTINGS.social.instagram),
      x: String(raw["social.x"] ?? DEFAULT_SETTINGS.social.x),
    },
  };
  return s;
});
