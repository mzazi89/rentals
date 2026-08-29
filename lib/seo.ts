import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/env-public";

interface BuildMetadataInput {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
}

/** Consistent metadata builder (title, OG, Twitter, canonical). */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { appUrl } = getPublicEnv();
  const url = input.path ? `${appUrl}${input.path}` : appUrl;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "RentHub",
      type: input.type ?? "website",
      images: input.image ? [{ url: input.image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: input.image ? [input.image] : undefined,
    },
  };
}
