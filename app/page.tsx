"use client";

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
        <h1 style={{ marginBottom: "0.5rem", fontSize: "1.75rem" }}>AI Trading Assistant</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          RAG, memory, web search, and portfolio-aware notifications powered by
          local Ollama.
        </p>
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
