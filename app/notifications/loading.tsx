import { CardSkeleton } from "@/components/Skeleton";

export default function NotificationsLoading() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ width: 60, height: 20, background: "var(--surface)", borderRadius: 4 }} />
        <div style={{ width: 140, height: 28, background: "var(--surface)", borderRadius: 4 }} />
      </header>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </main>
  );
}
