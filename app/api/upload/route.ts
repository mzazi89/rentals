import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BUCKETS = ["property-images", "profile-images", "documents"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Image upload endpoint (single path for all providers).
 *  - Vercel Blob configured (BLOB_READ_WRITE_TOKEN) → server-side `put()`
 *  - otherwise → local filesystem under public/uploads (dev mode)
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const bucket = String(form.get("bucket") ?? "");
    const folder = String(form.get("folder") ?? "").replace(/[^a-zA-Z0-9_-]/g, "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!BUCKETS.includes(bucket as (typeof BUCKETS)[number])) {
      return NextResponse.json({ error: "invalid bucket" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "only image uploads are allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file exceeds the 10MB limit" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const name = `${crypto.randomUUID()}.${ext}`;

    // Vercel Blob provider (production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const { url } = await put(`${bucket}/${folder}/${name}`, bytes, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.type,
      });
      return NextResponse.json({ url });
    }

    // Local provider (development)
    const dir = join(process.cwd(), "public", "uploads", bucket, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${bucket}/${folder}/${name}` });
  } catch (err) {
    console.error("[upload] failed", err);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
