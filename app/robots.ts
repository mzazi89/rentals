import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env-public";

const BASE = getAppUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/signup", "/login", "/account-suspended"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
