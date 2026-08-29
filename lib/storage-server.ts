import "server-only";

import { unlink } from "node:fs/promises";
import { join } from "node:path";

/**
 * Delete an uploaded file given its public URL.
 * Local provider: removes the file from public/uploads.
 * Vercel Blob provider: deletes via the Blob API (server token).
 */
export async function deleteUploadedFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("/uploads/")) {
      const filePath = join(process.cwd(), "public", url);
      await unlink(filePath).catch(() => undefined);
      return;
    }
    if (url.startsWith("http")) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (token) {
        const { del } = await import("@vercel/blob");
        await del(url, { token });
      }
    }
  } catch (err) {
    console.error("[storage] delete failed", err);
  }
}
