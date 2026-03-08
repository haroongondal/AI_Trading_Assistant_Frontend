"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { streamChat, type ChatMessage } from "@/lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setStreaming(true);
    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await streamChat(
        text,
        messages,
        (token) => {
          assistantContent += token;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant") {
              next[next.length - 1] = { ...last, content: assistantContent };
            }
            return next;
          });
        },
        () => {
          setStreaming(false);
          scrollToBottom();
        },
        (err) => {
          setError(err.message);
          setStreaming(false);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant" && !last.content) {
              next[next.length - 1] = { ...last, content: `[Error: ${err.message}]` };
            }
            return next;
          });
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStreaming(false);
    }
  }, [input, messages, streaming, scrollToBottom]);

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 800, margin: "0 auto" }}>
      <header style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>← Home</Link>
        <h1 style={{ fontSize: "1.25rem" }}>Trading Assistant</h1>
      </header>
      {error && (
        <div style={{ padding: "0.5rem 1rem", background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          {error}
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)", marginTop: "1rem" }}>
            Ask about your portfolio, latest news, or request analysis. The assistant can search the knowledge base, the web, and recall what you told it.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              background: m.role === "user" ? "var(--accent)" : "var(--surface)",
              border: m.role === "assistant" ? "1px solid var(--border)" : "none",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {m.content || (m.role === "assistant" && streaming && i === messages.length - 1 ? "▌" : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            disabled={streaming}
            style={{
              flex: 1,
              padding: "0.6rem 0.75rem",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            style={{
              padding: "0.6rem 1rem",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: streaming ? "not-allowed" : "pointer",
            }}
          >
            {streaming ? "..." : "Send"}
          </button>
        </div>
      </form>
    </main>
  );
}
