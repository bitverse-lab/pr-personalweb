"use client";

// Last-resort boundary: replaces the root layout, so it must render its own <html> and cannot rely on site styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center", color: "#1f2937" }}>
        <div style={{ padding: 24 }}>
          <h1 style={{ marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#6b7280" }}>The site hit an unexpected error. Please try again.</p>
          <button type="button" onClick={reset} style={{ padding: "8px 16px", borderRadius: 6, border: 0, background: "#2a52c3", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
