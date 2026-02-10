import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PicksSchema } from "@/lib/validate";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const joinCode = url.searchParams.get("joinCode") || "";

  if (!joinCode) return NextResponse.json({ error: "Missing joinCode." }, { status: 400 });

  const badgeRes = await supabaseAdmin
    .from("badges")
    .select("id,event_id")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (badgeRes.error || !badgeRes.data) {
    return NextResponse.json({ error: "Invalid badge code." }, { status: 404 });
  }

  const eventId = badgeRes.data.event_id;

  const participantRes = await supabaseAdmin
    .from("participants")
    .select("id,traffic_light")
    .eq("badge_id", badgeRes.data.id)
    .maybeSingle();

  if (participantRes.error || !participantRes.data) {
    return NextResponse.json({ error: "Please join first using your badge QR." }, { status: 403 });
  }

  const eventRes = await supabaseAdmin
    .from("events")
    .select("submissions_close_at,is_live")
    .eq("id", eventId)
    .single();

  if (eventRes.error) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!eventRes.data.is_live) return NextResponse.json({ error: "This event is not live." }, { status: 403 });

  const picksRes = await supabaseAdmin
    .from("picks")
    .select("picked_badge_number")
    .eq("event_id", eventId)
    .eq("picker_participant_id", participantRes.data.id)
    .order("created_at", { ascending: true });

  if (picksRes.error) return NextResponse.json({ error: "Could not load picks." }, { status: 500 });

  const now = new Date();
  const closeAt = new Date(eventRes.data.submissions_close_at);
  const isClosed = now > closeAt;

  return NextResponse.json({
    ok: true,
    picks: picksRes.data.map((r) => r.picked_badge_number),
    submissionsCloseAt: eventRes.data.submissions_close_at,
    isClosed,
    trafficLight: participantRes.data.traffic_light,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PicksSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid picks." }, { status: 400 });

  const { joinCode, picks } = parsed.data;

  const badgeRes = await supabaseAdmin
    .from("badges")
    .select("id,event_id")
    .eq("join_code", joinCode)
    .single();

  if (badgeRes.error) return NextResponse.json({ error: "Invalid badge code." }, { status: 404 });

  const eventId = badgeRes.data.event_id;

  const participantRes = await supabaseAdmin
    .from("participants")
    .select("id,traffic_light")
    .eq("badge_id", badgeRes.data.id)
    .single();

  if (participantRes.error) return NextResponse.json({ error: "Please join first using your badge QR." }, { status: 403 });
  if (participantRes.data.traffic_light === "red") return NextResponse.json({ error: "Red badges cannot submit picks." }, { status: 403 });

  const eventRes = await supabaseAdmin
    .from("events")
    .select("submissions_close_at,is_live")
    .eq("id", eventId)
    .single();

  if (eventRes.error) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!eventRes.data.is_live) return NextResponse.json({ error: "This event is not live." }, { status: 403 });
  if (new Date() > new Date(eventRes.data.submissions_close_at)) return NextResponse.json({ error: "Submissions are closed." }, { status: 403 });

  const uniqueNums = Array.from(new Set(picks)).slice(0, 5);

  await supabaseAdmin
    .from("picks")
    .delete()
    .eq("event_id", eventId)
    .eq("picker_participant_id", participantRes.data.id);

  if (uniqueNums.length === 0) return NextResponse.json({ ok: true, saved: [] });

  const rows = uniqueNums.map((n) => ({
    event_id: eventId,
    picker_participant_id: participantRes.data.id,
    picked_badge_number: n,
  }));

  const insertRes = await supabaseAdmin.from("picks").insert(rows);
  if (insertRes.error) return NextResponse.json({ error: "Could not save picks." }, { status: 500 });

  return NextResponse.json({ ok: true, saved: uniqueNums });
}
