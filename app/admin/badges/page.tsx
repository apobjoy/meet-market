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
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .badge {
          border: 2px solid #111;
          border-radius: 14px;
          padding: 14px;
          height: 180px;
          display: grid;
          grid-template-columns: 1fr 90px;
          gap: 12px;
          align-items: center;
        }
        .num {
  font-size: 96px;       /* BIG and readable from distance */
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -1px;
}
        .nameblank { margin-top: 6px; border-bottom: 2px dashed #444; height: 28px; }
        .legend { display: flex; gap: 8px; margin-top: 10px; font-size: 12px; }
        .dot { width: 14px; height: 14px; border-radius: 999px; display: inline-block; }
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
                <div>
                  <div style={{ fontSize: 12, color: "#444" }}>Piano Bar Geelong</div>
                  <div className="num">{b.badge_number}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>First name</div>
                  <div className="nameblank" />
                  <div className="legend">
                    <span><span className="dot" style={{ background: "#2ecc71" }} /> Green</span>
                    <span><span className="dot" style={{ background: "#f1c40f" }} /> Yellow</span>
                    <span><span className="dot" style={{ background: "#e74c3c" }} /> Red</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>Scan QR to register.</div>
                </div>
                <div style={{ justifySelf: "end", textAlign: "right" }}>
                  <img src={b.qr} alt={`QR ${b.badge_number}`} style={{ width: 60, height: 60 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
