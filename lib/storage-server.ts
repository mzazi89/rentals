import "server-only";

import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { getServerEnv } from "@/lib/env";

/**
 * Delete an uploaded file given its public URL.
 * Local provider: removes the file from public/uploads.
 * Vercel Blob provider: deletes via the Blob API.
 */
export async function deleteUploadedFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("/uploads/")) {
      const filePath = join(process.cwd(), "public", url);
      await unlink(filePath).catch(() => undefined);
      return;
    }
    if (url.startsWith("http") && getServerEnv().blobReadWriteToken === null) {
      const { del } = await import("@vercel/blob");
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
  } catch (err) {
    console.error("[storage] delete failed", err);
  }
}
