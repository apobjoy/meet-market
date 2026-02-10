import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminSeedBadgesSchema } from "@/lib/validate";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AdminSeedBadgesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid inputs." }, { status: 400 });

  if (parsed.data.adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const { eventId, from, to } = parsed.data;
  if (to < from) return NextResponse.json({ error: "Invalid range." }, { status: 400 });

  const rows = [];
  for (let n = from; n <= to; n++) {
    const joinCode = crypto.randomBytes(9).toString("base64url");
    rows.push({ event_id: eventId, badge_number: n, join_code: joinCode });
  }

  const insertRes = await supabaseAdmin.from("badges").insert(rows);
  if (insertRes.error) return NextResponse.json({ error: "Could not create badges (already seeded?)" }, { status: 409 });

  const res = NextResponse.json({ ok: true, created: rows.length });
  res.cookies.set("pb_admin", "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
