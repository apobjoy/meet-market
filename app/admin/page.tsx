"use client";
import { useState } from "react";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState("Traffic Light Party");
  const [startsAt, setStartsAt] = useState("");
  const [subCloseAt, setSubCloseAt] = useState("");

  const [eventId, setEventId] = useState("");
  const [fromNum, setFromNum] = useState("1");
  const [toNum, setToNum] = useState("200");

  async function login() {
    setMsg(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: pw }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error ?? "Login failed.");
    setMsg("Logged in.");
  }

  async function createEvent() {
    setMsg(null);
    const res = await fetch("/api/admin/create-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: pw, title, startsAt, submissionsCloseAt: subCloseAt }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error ?? "Could not create event.");
    setEventId(data.eventId);
    setMsg("Event created. Event ID has been filled in below.");
  }

  async function seedBadges() {
    setMsg(null);
    const res = await fetch("/api/admin/seed-badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: pw, eventId, from: Number(fromNum), to: Number(toNum) }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error ?? "Could not seed badges.");
    setMsg(`Seeded ${data.created} badges.`);
  }

  async function sendResults() {
    setMsg(null);
    const res = await fetch("/api/admin/send-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: pw, eventId }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error ?? "Could not send results.");
    setMsg(`Sent results to ${data.sent} participants (SMS sent: ${data.smsSent}).`);
  }

  const printUrl = eventId ? `/admin/badges?eventId=${encodeURIComponent(eventId)}` : "";

  return (
    <main style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ marginTop: 0 }}>Admin</h1>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <label>
          Admin password
          <input value={pw} onChange={(e) => setPw(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
        </label>
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={login} style={{ padding: "10px 14px" }}>Login</button>
        </div>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Create event</h2>
        <p style={{ marginTop: 0 }}>Use ISO date-time with timezone, e.g. 2026-03-06T19:00:00+11:00</p>

        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
          <label>
            Starts at
            <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
          </label>
          <label>
            Submissions close at
            <input value={subCloseAt} onChange={(e) => setSubCloseAt(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={createEvent} style={{ padding: "10px 14px" }}>Create event</button>
        </div>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Seed badges (1–200)</h2>

        <label>
          Event ID
          <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
          <label>
            From
            <input value={fromNum} onChange={(e) => setFromNum(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
          </label>
          <label>
            To
            <input value={toNum} onChange={(e) => setToNum(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={seedBadges} style={{ padding: "10px 14px" }}>Seed badges</button>
          {eventId ? (
            <a href={printUrl} style={{ padding: "10px 14px", border: "1px solid #222", borderRadius: 8, textDecoration: "none" }}>
              Print badge sheet
            </a>
          ) : null}
        </div>
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
  <h2 style={{ marginTop: 0 }}>Run night</h2>
  <p style={{ marginTop: 0 }}>
    <a href="/admin/dashboard" style={{ textDecoration: "underline" }}>Open live dashboard</a>
  </p>
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <button
      type="button" onClick={async () => {
        setMsg(null);
        const res = await fetch("/api/admin/close-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminPassword: pw, eventId }),
        });
        const data = await res.json();
        if (!res.ok) return setMsg(data?.error ?? "Could not close submissions.");
        setMsg("Submissions closed.");
      }}
      style={{ padding: "10px 14px" }}
    >
      Close submissions now
    </button>

    <button type="button" onClick={sendResults} style={{ padding: "10px 14px" }}>Send results now</button>
  </div>
  <p style={{ marginTop: 10, color: "#444" }}>Sending results only works after submissions are closed.</p>
</section>


      {msg ? <p style={{ marginTop: 14 }}>{msg}</p> : null}
    </main>
  );
}
