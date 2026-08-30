import "server-only";

import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/db";

/**
 * Delete an uploaded file given its public URL.
 * DB provider: removes the row from stored_files.
 * Vercel Blob provider: deletes via the Blob API (server token).
 * Local disk (legacy dev): removes the file from public/uploads.
 */
export async function deleteUploadedFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (url.startsWith("/api/files/")) {
      const id = url.split("/").pop();
      if (id) await db`delete from stored_files where id = ${id}`;
      return;
    }
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
