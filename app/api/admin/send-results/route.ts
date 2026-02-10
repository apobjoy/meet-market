import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminSendResultsSchema } from "@/lib/validate";
import { sendResultsEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

function normaliseAuMobile(mobile: string) {
  const t = mobile.trim();
  if (t.startsWith("+")) return t;
  if (t.startsWith("04")) return "+61" + t.slice(1);
  return t;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AdminSendResultsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid inputs." }, { status: 400 });

  if (parsed.data.adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const eventId = parsed.data.eventId;

  const eventRes = await supabaseAdmin.from("events").select("id,title,submissions_close_at").eq("id", eventId).single();
  if (eventRes.error) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  if (new Date() < new Date(eventRes.data.submissions_close_at)) {
    return NextResponse.json({ error: "Submissions are not closed yet." }, { status: 403 });
  }

  const participantsRes = await supabaseAdmin
    .from("participants")
    .select("id,first_name,email,mobile,badge_number,traffic_light")
    .eq("event_id", eventId);

  if (participantsRes.error) return NextResponse.json({ error: "Could not load participants." }, { status: 500 });

  const participants = participantsRes.data.filter((p) => p.traffic_light !== "red");
  const byBadge = new Map<number, (typeof participants)[number]>();
  for (const p of participants) byBadge.set(p.badge_number, p);

  const picksRes = await supabaseAdmin.from("picks").select("picker_participant_id,picked_badge_number").eq("event_id", eventId);
  if (picksRes.error) return NextResponse.json({ error: "Could not load picks." }, { status: 500 });

  const pickMap = new Map<string, Set<number>>();
  for (const row of picksRes.data) {
    const set = pickMap.get(row.picker_participant_id) ?? new Set<number>();
    set.add(row.picked_badge_number);
    pickMap.set(row.picker_participant_id, set);
  }

  const title = eventRes.data.title;
  let sent = 0;
  let smsSent = 0;

  for (const a of participants) {
    const aPicks = pickMap.get(a.id) ?? new Set<number>();
    const matches: Array<{ firstName: string; badgeNumber: number; email: string; mobile: string }> = [];

    for (const pickedNum of aPicks) {
      const b = byBadge.get(pickedNum);
      if (!b) continue;
      const bPicks = pickMap.get(b.id) ?? new Set<number>();
      if (!bPicks.has(a.badge_number)) continue;

      matches.push({ firstName: b.first_name, badgeNumber: b.badge_number, email: b.email, mobile: b.mobile });
    }

    const html = matches.length
      ? `<p>Hi ${a.first_name},</p>
         <p>Your mutual matches from <strong>${title}</strong>:</p>
         <ul>${matches.map(m => `<li><strong>${m.firstName}</strong> (Badge ${m.badgeNumber})<br/>Email: ${m.email}<br/>Mobile: ${m.mobile}</li>`).join("")}</ul>
         <p>Have fun and be respectful. You have only received mutual matches.</p>`
      : `<p>Hi ${a.first_name},</p>
         <p>No mutual matches this round from <strong>${title}</strong>.</p>
         <p>If you enjoyed the night, keep an eye out for the next one.</p>`;

    await sendResultsEmail({ to: a.email, subject: `Your matches from ${title}`, html });
    sent += 1;

    try {
      await sendSms(normaliseAuMobile(a.mobile), `Piano Bar Geelong: your mutual matches from ${title} are in. Check your email for details.`);
      smsSent += 1;
    } catch {
      // SMS optional
    }
  }

  await supabaseAdmin.from("events").update({ results_sent_at: new Date().toISOString() }).eq("id", eventId);

  return NextResponse.json({ ok: true, sent, smsSent });
}
