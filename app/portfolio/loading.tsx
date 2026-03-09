import { Skeleton, TableRowSkeleton } from "@/components/Skeleton";

export default function PortfolioLoading() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Skeleton style={{ width: 60, height: 20 }} />
        <Skeleton style={{ width: 120, height: 28 }} />
      </header>
      <section style={{ marginBottom: "2rem" }}>
        <Skeleton style={{ width: 120, height: 20, marginBottom: "0.75rem" }} />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Skeleton style={{ width: 200, height: 40 }} />
          <Skeleton style={{ width: 100, height: 40 }} />
          <Skeleton style={{ width: 120, height: 40 }} />
        </div>
      </section>
      <section>
        <Skeleton style={{ width: 100, height: 20, marginBottom: "0.75rem" }} />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Symbol</th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>Quantity</th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>Entry price</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton cols={4} />
            <TableRowSkeleton cols={4} />
            <TableRowSkeleton cols={4} />
          </tbody>
        </table>
      </section>
    </main>
  );
}
