"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  participantId: string;
  badgeNumber: number;
  firstName: string;
  trafficLight: "green" | "yellow" | "red";
  registeredAt: string;
  hasSubmitted: boolean;
};

export default function AdminDashboard() {
  const [pw, setPw] = useState("");
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [closeAt, setCloseAt] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    if (!eventId) return;
    const res = await fetch(`/api/admin/dashboard?eventId=${encodeURIComponent(eventId)}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Could not load dashboard.");
      return;
    }
    setRows(data.rows ?? []);
    setCloseAt(data.submissionsCloseAt ?? null);
    setIsClosed(Boolean(data.isClosed));
    setMsg(null);
  }

  useEffect(() => {
    const t = setInterval(() => refresh(), 8000);
    return () => clearInterval(t);
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const registered = rows.length;
    const submitted = rows.filter((r) => r.hasSubmitted && r.trafficLight !== "red").length;
    const green = rows.filter((r) => r.trafficLight === "green").length;
    const yellow = rows.filter((r) => r.trafficLight === "yellow").length;
    const red = rows.filter((r) => r.trafficLight === "red").length;
    return { registered, submitted, green, yellow, red };
  }, [rows]);

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

  async function closeSubmissionsNow() {
    setMsg(null);
    const res = await fetch("/api/admin/close-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: pw, eventId }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data?.error ?? "Could not close submissions.");
    setMsg("Submissions closed.");
    await refresh();
  }

  return (
    <main style={{ padding: 24, maxWidth: 980 }}>
      <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Admin password
            <input value={pw} onChange={(e) => setPw(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
          </label>
          <label>
            Event ID
            <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={login} style={{ padding: "10px 14px" }}>Login</button>
          <button onClick={refresh} style={{ padding: "10px 14px" }}>Load / Refresh</button>
          <button onClick={closeSubmissionsNow} style={{ padding: "10px 14px" }}>Close submissions now</button>
          <a href="/admin" style={{ padding: "10px 14px", border: "1px solid #222", borderRadius: 8, textDecoration: "none" }}>Back to admin</a>
        </div>

        {closeAt ? (
          <p style={{ marginTop: 10, color: isClosed ? "crimson" : "#444" }}>
            Submissions close at: <strong>{new Date(closeAt).toLocaleString()}</strong>
            {isClosed ? " (closed)" : ""}
          </p>
        ) : null}

        <div style={{ marginTop: 10, fontSize: 13, color: "#444" }}>
          Registered: <strong>{stats.registered}</strong> | Submitted (non-red): <strong>{stats.submitted}</strong> | Green: <strong>{stats.green}</strong> | Yellow: <strong>{stats.yellow}</strong> | Red: <strong>{stats.red}</strong>
        </div>

        {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
      </section>

      <section style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Live list</h2>
        <p style={{ marginTop: 0, color: "#444" }}>Auto-refreshes every ~8 seconds.</p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Badge", "Name", "Light", "Registered", "Submitted?"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.participantId}>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f0f0f0" }}><strong>{r.badgeNumber}</strong></td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f0f0f0" }}>{r.firstName}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f0f0f0" }}>{r.trafficLight}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f0f0f0" }}>{new Date(r.registeredAt).toLocaleTimeString()}</td>
                  <td style={{ padding: "8px 6px", borderBottom: "1px solid #f0f0f0" }}>
                    {r.trafficLight === "red" ? "N/A" : (r.hasSubmitted ? "✅" : "⏳")}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr><td colSpan={5} style={{ padding: 10, color: "#666" }}>No registrations loaded yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
