"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPortfolio, addPosition, deletePosition } from "@/lib/api";

type Position = {
  id: number;
  symbol: string;
  quantity: number;
  entry_price: number;
  notes: string | null;
  created_at: string;
};

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const data = await getPortfolio();
      setPositions(data.positions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(quantity);
    const p = parseFloat(entryPrice);
    if (!symbol.trim() || isNaN(q) || q <= 0 || isNaN(p) || p <= 0) return;
    setSubmitting(true);
    try {
      await addPosition({ symbol: symbol.trim(), quantity: q, entry_price: p, notes: notes.trim() || null });
      setSymbol("");
      setQuantity("");
      setEntryPrice("");
      setNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePosition(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>← Home</Link>
        <h1 style={{ fontSize: "1.5rem" }}>Portfolio</h1>
      </header>
      {error && (
        <div style={{ padding: "0.5rem 1rem", background: "rgba(239,68,68,0.2)", color: "#fca5a5", marginBottom: "1rem", borderRadius: 6 }}>
          {error}
        </div>
      )}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Add position</h2>
        <form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
          <input
            placeholder="Symbol (e.g. BTC)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: 100 }}
          />
          <input
            type="number"
            step="any"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: 100 }}
          />
          <input
            type="number"
            step="any"
            placeholder="Entry price"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", width: 120 }}
          />
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", flex: 1, minWidth: 120 }}
          />
          <button type="submit" disabled={submitting} style={{ padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 6, cursor: submitting ? "not-allowed" : "pointer" }}>
            Add
          </button>
        </form>
      </section>
      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Positions</h2>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : positions.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No positions. Add one above or ask the assistant to analyze your portfolio after adding data.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Symbol</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Quantity</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Entry price</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Notes</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem" }}>{p.symbol}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem" }}>{p.quantity}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem" }}>{p.entry_price}</td>
                    <td style={{ padding: "0.5rem", color: "var(--muted)" }}>{p.notes || "—"}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <button onClick={() => handleDelete(p.id)} style={{ padding: "0.25rem 0.5rem", background: "transparent", color: "#f87171", border: "1px solid #f87171", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
