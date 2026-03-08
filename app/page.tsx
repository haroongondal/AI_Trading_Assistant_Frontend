import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>
        AI Trading Assistant
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        RAG, memory, web search, and portfolio-aware notifications powered by
        local Ollama.
      </p>
      <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/chat"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent)",
            color: "white",
            borderRadius: 6,
          }}
        >
          Chat
        </Link>
        <Link
          href="/portfolio"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
          }}
        >
          Portfolio
        </Link>
        <Link
          href="/notifications"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
          }}
        >
          Notifications
        </Link>
      </nav>
    </main>
  );
}
