"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { streamChat, type ChatMessage } from "@/lib/api";
import { MarkdownMessage } from "@/components/MarkdownMessage";

/** Normalize status lines from the API (legacy markdown italics used *...*). */
function formatAgentStatus(s: string): string {
  const t = s.trim();
  if (t.startsWith("*") && t.endsWith("*") && t.length > 2) {
    return t.slice(1, -1);
  }
  return s;
}

function isGenericAgentStatus(s: string): boolean {
  const t = s.trim().toLowerCase();
  return (
    t === "thinking…" ||
    t === "still thinking…" ||
    t === "planning next step…" ||
    t === "working on your answer…" ||
    t === "composing answer…" ||
    t === "selecting tools…"
  );
}

export function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const specificStatusSinceRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (streaming || messages.length) scrollToBottom();
  }, [streaming, messages, toolStatus, scrollToBottom]);

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
    specificStatusSinceRef.current = null;
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
          specificStatusSinceRef.current = null;
          setStreaming(false);
          scrollToBottom();
        },
        (err) => {
          abortRef.current = null;
          if (err.message?.includes("abort") || err.name === "AbortError") {
            setStreaming(false);
            setToolStatus(null);
            specificStatusSinceRef.current = null;
            return;
          }
          setError(err.message);
          setStreaming(false);
          setToolStatus(null);
          specificStatusSinceRef.current = null;
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
        (status) => {
          const next = formatAgentStatus(status);
          setToolStatus((prev) => {
            const now = Date.now();
            const nextGeneric = isGenericAgentStatus(next);
            if (!nextGeneric) {
              specificStatusSinceRef.current = now;
              return next;
            }
            const prevSpecific = !!prev && !isGenericAgentStatus(prev);
            if (prevSpecific) {
              const since = specificStatusSinceRef.current ?? now;
              if (now - since < 3000) return prev;
              specificStatusSinceRef.current = null;
            }
            return next;
          });
        }
      );
    } catch (e) {
      abortRef.current = null;
      if (e instanceof Error && e.name === "AbortError") {
        setStreaming(false);
        setToolStatus(null);
        specificStatusSinceRef.current = null;
        return;
      }
      setError(e instanceof Error ? e.message : "Unknown error");
      setStreaming(false);
      setToolStatus(null);
      specificStatusSinceRef.current = null;
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
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const streamingHere = m.role === "assistant" && streaming && isLast;
          return (
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
                {!streamingHere ? (
                  m.content ? <MarkdownMessage content={m.content} /> : null
                ) : (
                  <>
                    {m.content ? <MarkdownMessage content={m.content} /> : null}
                    <span style={{ animation: "cursor-pulse 1s ease-in-out infinite" }}>▌</span>
                    {toolStatus ? (
                      <div
                        style={{
                          marginTop: m.content ? "0.45rem" : "0.25rem",
                          paddingTop: m.content ? "0.45rem" : 0,
                          borderTop: m.content ? "1px solid var(--border)" : undefined,
                          fontSize: "0.8125rem",
                          color: "var(--muted)",
                          fontStyle: "italic",
                          lineHeight: 1.4,
                        }}
                      >
                        {toolStatus}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        style={{
          flexShrink: 0,
          position: "sticky",
          bottom: 0,
          zIndex: 20,
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
