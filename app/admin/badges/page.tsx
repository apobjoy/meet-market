import { supabaseAdmin } from "@/lib/supabaseAdmin";
import QRCode from "qrcode";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default async function BadgeSheetPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const eventId = searchParams.eventId;
  if (!eventId) return <main style={{ padding: 24 }}><h1>Badge Sheet</h1><p>Missing eventId.</p></main>;

  const eventRes = await supabaseAdmin.from("events").select("id,title").eq("id", eventId).single();
  if (eventRes.error) return <main style={{ padding: 24 }}><h1>Badge Sheet</h1><p>Event not found.</p></main>;

  const badgesRes = await supabaseAdmin
    .from("badges")
    .select("badge_number,join_code")
    .eq("event_id", eventId)
    .order("badge_number", { ascending: true });

  if (badgesRes.error) return <main style={{ padding: 24 }}><h1>Badge Sheet</h1><p>Could not load badges.</p></main>;

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://meet-market-zolj.vercel.app");  const badges = await Promise.all(
    badgesRes.data.map(async (b) => {
      const url = `${baseUrl}/join/${encodeURIComponent(b.join_code)}`;
      const qr = await QRCode.toDataURL(url, { margin: 0, scale: 3 });
      return { ...b, qr };
    })
  );

  const pages = chunk(badges, 8);

  return (
    <main style={{ padding: 24 }}>
    <style>{`
  @media print {
    .no-print { display: none; }
    .page { page-break-after: always; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }

  /* More space between badges for guillotining */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 26px;              /* was 14px */
  }

  .badge {
    border: 2px solid #111;
    border-radius: 14px;
    padding: 18px;
    height: 180px;
    position: relative;     /* allow QR to sit top-right */
    overflow: hidden;       /* keep everything inside the border */
    box-sizing: border-box;
  }

  /* Make the number BIG and visible from a distance */
  .num {
    font-size: 92px;        /* was 56px */
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -1px;
    margin-top: 6px;
  }

  .nameblank {
    margin-top: 8px;
    border-bottom: 2px dashed #444;
    height: 30px;
  }

  /* Small QR, top-right corner */
  .qr {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 64px;            /* much smaller */
    height: 64px;
  }
`}</style>

      <div className="no-print" style={{ maxWidth: 860, marginBottom: 16 }}>
        <h1 style={{ marginTop: 0 }}>Printable Badge Sheet</h1>
        <p style={{ marginTop: 0 }}>Event: <strong>{eventRes.data.title}</strong></p>
        <PrintButton />
      </div>

      {pages.map((page, i) => (
        <section key={i} className="page" style={{ marginBottom: 18 }}>
          <div className="grid">
            {page.map((b) => (
             <div key={b.join_code} className="badge">
  <div style={{ fontSize: 12, color: "#444" }}>Piano Bar Geelong</div>

  <img
    className="qr"
    src={b.qr}
    alt={`QR ${b.badge_number}`}
  />

  <div className="num">{b.badge_number}</div>

  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>First name</div>
  <div className="nameblank" />
</div>
<img
  src={b.qr}
  alt={`QR ${b.badge_number}`}
  style={{
    position: "absolute",
    top: 12,
    right: 12,
    width: 70,
    height: 70,
  }}
/>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
