"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p style={{ margin: "0 0 0.6rem" }}>{children}</p>,
        ul: ({ children }) => <ul style={{ paddingLeft: "1.1rem", margin: "0 0 0.7rem" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: "1.1rem", margin: "0 0 0.7rem" }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: "0.2rem" }}>{children}</li>,
        code: ({ children }) => (
          <code
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.12rem 0.35rem",
              fontSize: "0.86em",
            }}
          >
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
