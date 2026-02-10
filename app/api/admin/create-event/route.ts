import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminCreateEventSchema } from "@/lib/validate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AdminCreateEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid inputs." }, { status: 400 });

  if (parsed.data.adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const insertRes = await supabaseAdmin
    .from("events")
    .insert({
      title: parsed.data.title,
      starts_at: parsed.data.startsAt,
      submissions_close_at: parsed.data.submissionsCloseAt,
      is_live: true,
    })
    .select("id")
    .single();

  if (insertRes.error) return NextResponse.json({ error: "Could not create event." }, { status: 500 });

  const res = NextResponse.json({ ok: true, eventId: insertRes.data.id });
  res.cookies.set("pb_admin", "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
