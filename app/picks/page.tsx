"use client";

import { useEffect, useMemo, useState } from "react";

function asNumbers(inputs: string[]) {
  return inputs
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default function PicksPage() {
  const [joinCode, setJoinCode] = useState<string | null>(null);

  const [picks, setPicks] = useState<string[]>(["", "", "", "", ""]);
  const [savedPicks, setSavedPicks] = useState<number[]>([]);
  const [submissionsCloseAt, setSubmissionsCloseAt] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const numbers = useMemo(() => asNumbers(picks), [picks]);

  useEffect(() => {
    const jc = localStorage.getItem("joinCode");
    setJoinCode(jc);

    if (!jc) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/picks?joinCode=${encodeURIComponent(jc)}`);
        const data = await res.json();
        if (!res.ok) {
          setMsg(data?.error ?? "Could not load your current picks.");
          return;
        }

        setSavedPicks(data.picks ?? []);
        setSubmissionsCloseAt(data.submissionsCloseAt ?? null);
        setIsClosed(Boolean(data.isClosed));

        const next = ["", "", "", "", ""];
        (data.picks ?? []).slice(0, 5).forEach((n: number, i: number) => (next[i] = String(n)));
        setPicks(next);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setMsg(null);

    if (!joinCode) return setMsg("Please scan your badge QR to join first.");
    if (isClosed) return setMsg("Submissions are closed.");

    const unique = Array.from(new Set(numbers)).slice(0, 5);
    const preview = unique.length ? unique.join(", ") : "(no picks)";
    const ok = window.confirm(`Confirm your picks: ${preview}

You can edit them any time before submissions close.`);
    if (!ok) return;

    setSending(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, picks: unique }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data?.error ?? "Could not save picks.");

      setSavedPicks(data.saved ?? unique);
      setMsg("Saved. You can still edit your picks until submissions close.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>Your picks</h1>

      {loading ? <p>Loading...</p> : null}

      {!loading && submissionsCloseAt ? (
        <p style={{ marginTop: 0, color: isClosed ? "crimson" : "#444" }}>
          Submissions close at: <strong>{new Date(submissionsCloseAt).toLocaleString()}</strong>
          {isClosed ? " (closed)" : ""}
        </p>
      ) : null}

      {!loading ? (
        <p style={{ marginTop: 0 }}>
          Enter up to five badge numbers. These are only shared if the match is mutual.
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {picks.map((v, i) => (
          <label key={i}>
            Pick {i + 1}
            <input
              inputMode="numeric"
              value={v}
              onChange={(e) => {
                const next = [...picks];
                next[i] = e.target.value;
                setPicks(next);
              }}
              style={{ width: "100%", padding: 10 }}
              disabled={isClosed}
            />
          </label>
        ))}
      </div>

      <button
        onClick={save}
        disabled={sending || isClosed || loading}
        style={{
          marginTop: 14,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #222",
          background: isClosed ? "#777" : "#111",
          color: "#fff",
          cursor: isClosed ? "not-allowed" : "pointer",
        }}
      >
        {sending ? "Saving..." : "Save picks"}
      </button>

      {!loading ? (
        <div style={{ marginTop: 12, fontSize: 13, color: "#444" }}>
          Currently saved: <strong>{savedPicks.length ? savedPicks.join(", ") : "none yet"}</strong>
        </div>
      ) : null}

      {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
    </main>
  );
}
