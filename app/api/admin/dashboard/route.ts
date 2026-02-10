import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId") || "";

  if (!eventId) return NextResponse.json({ error: "Missing eventId." }, { status: 400 });

  const eventRes = await supabaseAdmin
    .from("events")
    .select("id,submissions_close_at,is_live")
    .eq("id", eventId)
    .single();

  if (eventRes.error) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (!eventRes.data.is_live) return NextResponse.json({ error: "Event is not live." }, { status: 403 });

  const participantsRes = await supabaseAdmin
    .from("participants")
    .select("id,badge_number,first_name,traffic_light,created_at")
    .eq("event_id", eventId)
    .order("badge_number", { ascending: true });

  if (participantsRes.error) return NextResponse.json({ error: "Could not load participants." }, { status: 500 });

  const picksRes = await supabaseAdmin
    .from("picks")
    .select("picker_participant_id")
    .eq("event_id", eventId);

  if (picksRes.error) return NextResponse.json({ error: "Could not load picks." }, { status: 500 });

  const submittedSet = new Set(picksRes.data.map((r) => r.picker_participant_id));

  const rows = participantsRes.data.map((p) => ({
    participantId: p.id,
    badgeNumber: p.badge_number,
    firstName: p.first_name,
    trafficLight: p.traffic_light,
    registeredAt: p.created_at,
    hasSubmitted: submittedSet.has(p.id),
  }));

  const closeAt = new Date(eventRes.data.submissions_close_at);
  const isClosed = new Date() > closeAt;

  return NextResponse.json({
    ok: true,
    rows,
    submissionsCloseAt: eventRes.data.submissions_close_at,
    isClosed,
  });
}
