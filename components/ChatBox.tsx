"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { getChatModels, streamChat, type ChatMessage, type ChatModelOption } from "@/lib/api";
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
  const genericChatError = "Something went wrong. Please try again.";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [models, setModels] = useState<ChatModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("local-llama31");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitToast, setRateLimitToast] = useState<string | null>(null);
  const [animatingDown, setAnimatingDown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const specificStatusSinceRef = useRef<number | null>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitial = messages.length === 0 && !streaming;

  const showRateLimitToast = useCallback((message: string) => {
    setRateLimitToast(message);
    if (rateLimitTimerRef.current) {
      clearTimeout(rateLimitTimerRef.current);
    }
    rateLimitTimerRef.current = setTimeout(() => {
      setRateLimitToast(null);
      rateLimitTimerRef.current = null;
    }, 8000);
  }, []);

  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (streaming || messages.length) scrollToBottom();
  }, [streaming, messages, toolStatus, scrollToBottom]);

  useEffect(() => {
    let active = true;
    getChatModels()
      .then((data) => {
        if (!active) return;
        setModels(data.models || []);
        const nonLocal = (data.models || []).find((m) => m.enabled && m.id !== "local-llama31");
        const local = (data.models || []).find((m) => m.enabled && m.id === "local-llama31");
        setSelectedModel(nonLocal?.id || local?.id || "local-llama31");
      })
      .catch(() => {
        if (!active) return;
        setModels([]);
        setSelectedModel("local-llama31");
      });
    return () => {
      active = false;
    };
  }, []);

  const autoresizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 200;
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }, []);

  useEffect(() => {
    autoresizeTextarea();
  }, [input, autoresizeTextarea]);

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
    // Trigger the one-time "slide down to bottom" animation on the first send.
    if (isInitial) {
      setAnimatingDown(true);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(() => {
        setAnimatingDown(false);
        animTimerRef.current = null;
      }, 550);
    }
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
        selectedModel,
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
          setError(genericChatError);
          setStreaming(false);
          setToolStatus(null);
          specificStatusSinceRef.current = null;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant" && !last.content) {
              next[next.length - 1] = { ...last, content: genericChatError };
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
        },
        (rateMsg) => {
          showRateLimitToast(rateMsg);
          setStreaming(false);
          setToolStatus(null);
          specificStatusSinceRef.current = null;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant" && !last.content) {
              return next.slice(0, -1);
            }
            return next;
          });
        },
        (fullText) => {
          assistantContent = fullText;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              next[next.length - 1] = { ...last, content: fullText };
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
      setError(genericChatError);
      setStreaming(false);
      setToolStatus(null);
      specificStatusSinceRef.current = null;
    }
  }, [input, isInitial, messages, selectedModel, streaming, scrollToBottom, showRateLimitToast]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  const composerClass = isInitial
    ? "chat-composer chat-composer-centered"
    : animatingDown
    ? "chat-composer chat-composer-animating"
    : "chat-composer chat-composer-bottom";

  return (
    <main className="chat-shell">
      {error && <div className="chat-error">{error}</div>}

      {rateLimitToast && (
        <div
          role="alert"
          aria-live="polite"
          className="chat-toast chat-toast-warning"
        >
          <span className="chat-toast-icon" aria-hidden="true">!</span>
          <span className="chat-toast-text">{rateLimitToast}</span>
          <button
            type="button"
            className="chat-toast-close"
            aria-label="Dismiss"
            onClick={() => {
              if (rateLimitTimerRef.current) {
                clearTimeout(rateLimitTimerRef.current);
                rateLimitTimerRef.current = null;
              }
              setRateLimitToast(null);
            }}
          >
            x
          </button>
        </div>
      )}

      <div className={`chat-body ${isInitial ? "chat-body-initial" : ""}`}>
        {!isInitial && (
          <div className="chat-messages">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const streamingHere = m.role === "assistant" && streaming && isLast;
              return (
                <div key={i} className={`chat-row ${m.role === "user" ? "chat-row-user" : "chat-row-assistant"}`}>
                  <div className={`chat-bubble ${m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
                    {!streamingHere ? (
                      m.content ? <MarkdownMessage content={m.content} /> : null
                    ) : (
                      <>
                        {m.content ? <MarkdownMessage content={m.content} /> : null}
                        <span style={{ animation: "cursor-pulse 1s ease-in-out infinite" }}>▌</span>
                        {toolStatus ? <div className="chat-tool-status">{toolStatus}</div> : null}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {isInitial && (
          <div className="chat-hero">
            <h1 className="chat-hero-title">How can I help you trade smarter?</h1>
            <p className="chat-hero-subtitle">
              Ask about your portfolio, latest news, or request analysis. Say
              things like &quot;I bought 20,000 PKR of HBL&quot; or &quot;$500 of AAPL&quot; and your
              portfolio will be updated automatically.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className={composerClass}
        >
          <div className="chat-composer-inner">
            <div className="chat-composer-row">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask anything..."
                disabled={streaming}
                rows={1}
                className="chat-input"
              />
              {streaming ? (
                <button type="button" onClick={stopStreaming} className="chat-btn chat-btn-stop">
                  Stop
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="chat-btn chat-btn-send">
                  Send
                </button>
              )}
            </div>
            <div className="chat-composer-meta">
              <select
                id="chatbox-model"
                aria-label="Model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={streaming}
                className="chat-model-select"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.enabled}>
                    {`${m.provider}: ${m.label}`}
                  </option>
                ))}
              </select>
              <span className="chat-composer-hint">
                Enter to send · Shift + Enter for new line
              </span>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
