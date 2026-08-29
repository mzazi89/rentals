"use client";

export type StorageBucket = "property-images" | "profile-images" | "documents";

/** Downscale & re-encode an image before upload (client-side optimization). */
export async function optimizeImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");

  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  image.close();
  if (!blob) throw new Error("Image processing failed.");

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Upload an image through the app's upload endpoint. The server writes to
 * the local filesystem (dev) or Vercel Blob (production) — the client never
 * needs storage credentials. Returns the public URL.
 */
export async function uploadImageFile(
  file: File,
  bucket: StorageBucket,
  folder: string
): Promise<string> {
  const optimized = await optimizeImage(file);
  const form = new FormData();
  form.append("file", optimized);
  form.append("bucket", bucket);
  form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }
  return data.url;
}

/** Upload a profile avatar (smaller). */
export function uploadProfileImage(file: File, userId: string): Promise<string> {
  return uploadImageFile(file, "profile-images", userId);
}
