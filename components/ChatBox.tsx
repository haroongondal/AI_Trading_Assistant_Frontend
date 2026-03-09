"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { streamChat, type ChatMessage } from "@/lib/api";
import { ChatBubbleSkeleton } from "@/components/Skeleton";

export function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (streaming || messages.length) scrollToBottom();
  }, [streaming, messages.length, scrollToBottom]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError(null);
    setToolStatus(null);
    abortRef.current = new AbortController();
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
          setToolStatus(null);
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
          abortRef.current = null;
          setToolStatus(null);
          setStreaming(false);
          scrollToBottom();
        },
        (err) => {
          abortRef.current = null;
          if (err.message?.includes("abort") || err.name === "AbortError") {
            setStreaming(false);
            return;
          }
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
        },
        abortRef.current.signal,
        (status) => setToolStatus(status)
      );
    } catch (e) {
      abortRef.current = null;
      if (e instanceof Error && e.name === "AbortError") {
        setStreaming(false);
        return;
      }
      setError(e instanceof Error ? e.message : "Unknown error");
      setStreaming(false);
    }
  }, [input, messages, streaming, scrollToBottom]);

  return (
    <>
      {error && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "rgba(239,68,68,0.15)",
            color: "#fca5a5",
            fontSize: "0.875rem",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {toolStatus && (
        <div
          style={{
            flexShrink: 0,
            padding: "0.5rem 1rem",
            color: "var(--muted)",
            fontSize: "0.875rem",
            fontStyle: "italic",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {toolStatus}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {messages.length === 0 && !streaming && (
          <div style={{ marginTop: "2rem", textAlign: "center", color: "var(--muted)", fontSize: "0.95rem" }}>
            <p style={{ marginBottom: "0.5rem" }}>Ask about your portfolio, latest news, or request analysis.</p>
            <p style={{ fontSize: "0.85rem" }}>You can also say &quot;add 2 ETH&quot; or &quot;my goal is long-term growth&quot; to update your portfolio.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              width: "100%",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "0.875rem 1rem",
                borderRadius: 12,
                background: m.role === "user" ? "var(--accent)" : "var(--surface)",
                border: m.role === "assistant" ? "1px solid var(--border)" : "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "0.9375rem",
                lineHeight: 1.5,
              }}
            >
              {m.content || (m.role === "assistant" && streaming && i === messages.length - 1 ? (
                <span style={{ animation: "cursor-pulse 1s ease-in-out infinite" }}>▌</span>
              ) : null)}
            </div>
          </div>
        ))}
        {streaming && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content && (
          <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
            <div style={{ maxWidth: "85%", padding: "0.875rem 1rem" }}>
              <ChatBubbleSkeleton />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{
          flexShrink: 0,
          padding: "1rem",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", maxWidth: 768, margin: "0 auto" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            disabled={streaming}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.9375rem",
            }}
          />
          {streaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              style={{
                padding: "0.75rem 1.25rem",
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                padding: "0.75rem 1.25rem",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </>
  );
}
