import { ChatBubbleSkeleton } from "@/components/Skeleton";

export default function ChatLoading() {
  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 800, margin: "0 auto" }}>
      <header style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 60, height: 20, background: "var(--surface)", borderRadius: 4 }} />
        <div style={{ width: 140, height: 24, background: "var(--surface)", borderRadius: 4 }} />
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <ChatBubbleSkeleton />
        <ChatBubbleSkeleton />
      </div>
      <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ height: 44, background: "var(--surface)", borderRadius: 8 }} />
      </div>
    </main>
  );
}
