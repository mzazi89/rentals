import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Stream a stored file (DB-backed image provider).
 * Used when uploads are saved to Postgres (no BLOB_READ_WRITE_TOKEN).
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await db<{ content_type: string; data: Uint8Array }[]>`
      select content_type, data from stored_files where id = ${params.id}
    `;
    if (!rows[0]) {
      return new NextResponse("Not found", { status: 404 });
    }
    const blob = new Blob([rows[0].data as BlobPart], { type: rows[0].content_type });
    return new NextResponse(blob, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[files] read failed", err);
    return new NextResponse("Error", { status: 500 });
  }
}
