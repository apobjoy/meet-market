import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const adminPassword = body?.adminPassword || "";
  const eventId = body?.eventId || "";

  if (!adminPassword || !eventId) return NextResponse.json({ error: "Missing inputs." }, { status: 400 });
  if (adminPassword !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const nowIso = new Date().toISOString();

  const updateRes = await supabaseAdmin
    .from("events")
    .update({ submissions_close_at: nowIso })
    .eq("id", eventId);

  if (updateRes.error) return NextResponse.json({ error: "Could not close submissions." }, { status: 500 });

  const res = NextResponse.json({ ok: true, submissionsCloseAt: nowIso });
  res.cookies.set("pb_admin", "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
