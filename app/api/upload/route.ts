import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

const BUCKETS = ["property-images", "profile-images", "documents"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Image upload endpoint (single path for all providers).
 *  - Vercel Blob configured (BLOB_READ_WRITE_TOKEN) → server-side `put()`
 *  - otherwise → Postgres `stored_files`, served from /api/files/[id]
 *    (serverless filesystems are read-only/ephemeral, so local disk is NOT
 *    a viable production provider)
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

    // Database-backed provider (works on read-only serverless filesystems)
    const id = crypto.randomUUID();
    await db`
      insert into stored_files (id, bucket, folder, filename, content_type, size_bytes, data)
      values (${id}, ${bucket}, ${folder}, ${name}, ${file.type}, ${bytes.length}, ${bytes})
    `;
    return NextResponse.json({ url: `/api/files/${id}` });
  } catch (err) {
    console.error("[upload] failed", err);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
