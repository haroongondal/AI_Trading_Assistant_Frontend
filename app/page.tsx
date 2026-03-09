"use client";

import Link from "next/link";
import { ChatBox } from "@/components/ChatBox";

export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        maxWidth: 800,
        margin: "0 auto",
        background: "var(--bg)",
      }}
    >
      <header style={{ flexShrink: 0, padding: "2rem 2rem 0" }}>
        <h1 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>
          AI Trading Assistant
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          RAG, memory, web search, and portfolio-aware notifications powered by
          local Ollama.
        </p>
        <nav style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            href="/"
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
              color: "var(--text)",
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
              color: "var(--text)",
            }}
          >
            Notifications
          </Link>
        </nav>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: "0 2rem 2rem",
        }}
      >
        <ChatBox />
      </div>
    </main>
  );
}
