import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JoinSchema } from "@/lib/validate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  const { joinCode, firstName, email, mobile, trafficLight, consent } = parsed.data;

  const badgeRes = await supabaseAdmin
    .from("badges")
    .select("id,event_id,badge_number,claimed_at")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (badgeRes.error) return NextResponse.json({ error: "Badge lookup failed." }, { status: 500 });
  if (!badgeRes.data) return NextResponse.json({ error: "Invalid badge code." }, { status: 404 });
  if (badgeRes.data.claimed_at) return NextResponse.json({ error: "This badge has already been used to register." }, { status: 409 });

  const badge = badgeRes.data;

  const eventRes = await supabaseAdmin.from("events").select("id,is_live").eq("id", badge.event_id).single();
  if (eventRes.error) return NextResponse.json({ error: "Event lookup failed." }, { status: 500 });
  if (!eventRes.data.is_live) return NextResponse.json({ error: "This event is not live." }, { status: 403 });

  const insertRes = await supabaseAdmin
    .from("participants")
    .insert({
      event_id: badge.event_id,
      badge_id: badge.id,
      badge_number: badge.badge_number,
      first_name: firstName,
      email,
      mobile,
      traffic_light: trafficLight,
      consent,
    })
    .select("id")
    .single();

  if (insertRes.error) return NextResponse.json({ error: "Could not create participant (email may already be used)." }, { status: 409 });

  const claimRes = await supabaseAdmin.from("badges").update({ claimed_at: new Date().toISOString() }).eq("id", badge.id).is("claimed_at", null);
  if (claimRes.error) return NextResponse.json({ error: "Could not claim badge." }, { status: 500 });

  return NextResponse.json({ ok: true, participantId: insertRes.data.id });
}
