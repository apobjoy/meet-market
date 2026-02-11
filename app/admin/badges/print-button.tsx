"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ padding: "10px 14px" }}
    >
      Print / Save PDF
    </button>
  );
}
