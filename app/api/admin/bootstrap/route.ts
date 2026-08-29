import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";

/**
 * One-time admin bootstrap. Creates the first admin account.
 * Guarded by BOOTSTRAP_SECRET (server-side env). The admin role can never
 * be self-registered through the public signup flow.
 *
 *   curl -X POST http://localhost:3000/api/admin/bootstrap \
 *     -H "Content-Type: application/json" \
 *     -H "x-bootstrap-secret: $BOOTSTRAP_SECRET" \
 *     -d '{"email":"admin@renthub.co.ke","password":"STRONG_PASSWORD","name":"RentHub Admin"}'
 */
export async function POST(request: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "BOOTSTRAP_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("x-bootstrap-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only works once — refuse if an admin already exists.
  const admins = await db<{ n: number }[]>`select count(*)::int as n from profiles where role = 'admin'`;
  if ((admins[0]?.n ?? 0) > 0) {
    return NextResponse.json({ error: "an admin already exists" }, { status: 409 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!body.email || !body.password || body.password.length < 8) {
    return NextResponse.json({ error: "email and a strong password are required" }, { status: 400 });
  }

  try {
    const { user } = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name ?? "RentHub Admin",
      },
    });
    if (!user) throw new Error("signup failed");

    // Promote to admin (public signup can never do this).
    await db`update profiles set role = 'admin', is_onboarded = true where id = ${user.id}`;
    await db`update "user" set role = 'admin' where id = ${user.id}`;
    await db`
      insert into audit_logs (actor_id, actor_role, action, entity, entity_id, metadata)
      values (${user.id}, 'admin', 'admin_bootstrap', 'profiles', ${user.id}, '{"action":"first admin created"}')
    `;

    return NextResponse.json({ ok: true, email: body.email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bootstrap failed" },
      { status: 500 }
    );
  }
}
