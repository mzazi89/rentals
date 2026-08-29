"use client";

/**
 * Image helpers (client-side). Uploads go through the storage abstraction
 * (lib/storage.ts) — local /uploads in dev, Vercel Blob in production.
 */
export { optimizeImage, uploadImageFile, uploadProfileImage } from "@/lib/storage";
export type { StorageBucket } from "@/lib/storage";
