import { NextRequest, NextResponse } from "next/server";
import { syncOverdueRent } from "@/lib/rent";

/**
 * Optional cron endpoint to mark overdue rent and notify tenants.
 * Call it daily (e.g. Vercel Cron) with the CRON_SECRET header set.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const count = await syncOverdueRent();
    return NextResponse.json({ ok: true, markedOverdue: count });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}
