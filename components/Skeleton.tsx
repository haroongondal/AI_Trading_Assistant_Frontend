"use client";

export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shine 1.2s ease-in-out infinite",
        borderRadius: 6,
        ...style,
      }}
    />
  );
}

export function ChatBubbleSkeleton() {
  return (
    <div style={{ display: "flex", gap: "0.75rem", maxWidth: "85%", alignSelf: "flex-start" }}>
      <Skeleton style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
        <Skeleton style={{ height: 16, width: "80%" }} />
        <Skeleton style={{ height: 16, width: "60%" }} />
        <Skeleton style={{ height: 16, width: "40%" }} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "0.5rem" }}>
          <Skeleton style={{ height: 20, width: i === cols - 1 ? 60 : "80%" }} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: 8, marginBottom: "0.75rem" }}>
      <Skeleton style={{ height: 20, width: "40%", marginBottom: "0.5rem" }} />
      <Skeleton style={{ height: 14, width: "30%", marginBottom: "0.75rem" }} />
      <Skeleton style={{ height: 14, width: "100%", marginBottom: "0.25rem" }} />
      <Skeleton style={{ height: 14, width: "90%", marginBottom: "0.25rem" }} />
      <Skeleton style={{ height: 14, width: "70%" }} />
    </div>
  );
}
