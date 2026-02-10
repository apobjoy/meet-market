"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const joinCode = params.code;
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [trafficLight, setTrafficLight] = useState<"green" | "yellow" | "red">("green");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, firstName, email, mobile, trafficLight, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not join.");
        return;
      }
      localStorage.setItem("joinCode", joinCode);
      router.push("/picks");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Join Tonight</h1>
      <p>Badge code: <strong>{joinCode}</strong></p>

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          First name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Mobile
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} style={{ width: "100%", padding: 10 }} placeholder="+614..." />
        </label>

        <label>
          Traffic light
          <select value={trafficLight} onChange={(e) => setTrafficLight(e.target.value as any)} style={{ width: "100%", padding: 10 }}>
            <option value="green">Green (available and looking)</option>
            <option value="yellow">Yellow (available but cautious)</option>
            <option value="red">Red (taken)</option>
          </select>
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I consent to my contact details being shared only with mutual matches from this event.</span>
        </label>

        <button
          onClick={submit}
          disabled={submitting}
          style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #222", background: "#111", color: "#fff" }}
        >
          {submitting ? "Joining..." : "Join"}
        </button>

        {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
      </div>
    </main>
  );
}
