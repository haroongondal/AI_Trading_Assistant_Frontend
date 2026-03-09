"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getPortfolio, addPosition, deletePosition, updatePortfolioGoal, getCoins, type Coin } from "@/lib/api";
import { Skeleton, TableRowSkeleton } from "@/components/Skeleton";

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
  const [goal, setGoal] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [coinSearch, setCoinSearch] = useState("");
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getPortfolio();
      setPositions(data.positions);
      setGoal(data.goal ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { coins: list } = await getCoins(coinSearch || undefined);
        setCoins(list);
      } catch {
        setCoins([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [coinSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCoinDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = selectedCoin?.symbol ?? coinSearch.trim().toUpperCase();
    const q = parseFloat(quantity);
    if (!sym || isNaN(q) || q <= 0) return;
    setSubmitting(true);
    try {
      await addPosition({ symbol: sym, quantity: q, notes: notes.trim() || null });
      setSelectedCoin(null);
      setCoinSearch("");
      setQuantity("");
      setNotes("");
      setCoinDropdownOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGoal = async () => {
    setGoalSaving(true);
    try {
      await updatePortfolioGoal(goal.trim() || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save goal");
    } finally {
      setGoalSaving(false);
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

  const openDropdown = () => setCoinDropdownOpen(true);
  const selectCoin = (c: Coin) => {
    setSelectedCoin(c);
    setCoinSearch(c.symbol);
    setCoinDropdownOpen(false);
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          ← Home
        </Link>
        <h1 style={{ fontSize: "1.5rem" }}>Portfolio</h1>
      </header>
      {error && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "rgba(239,68,68,0.2)",
            color: "#fca5a5",
            marginBottom: "1rem",
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Your goal</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
          Describe what you want to achieve (e.g. long-term growth, save for a house).
        </p>
        <textarea
          placeholder="e.g. I want steady growth over 2 years"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onBlur={handleSaveGoal}
          disabled={goalSaving}
          rows={2}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            resize: "vertical",
            fontSize: "0.9375rem",
          }}
        />
        {goalSaving && <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginLeft: "0.5rem" }}>Saving...</span>}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Add position</h2>
        <form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <input
              placeholder="Search coin (e.g. BTC, ETH)"
              value={coinSearch}
              onChange={(e) => {
                setCoinSearch(e.target.value);
                setSelectedCoin(null);
                openDropdown();
              }}
              onFocus={openDropdown}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                width: 200,
                fontSize: "0.9375rem",
              }}
            />
            {coinDropdownOpen && (
              <ul
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  zIndex: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {coins.length === 0 && <li style={{ padding: "0.75rem", color: "var(--muted)" }}>Type to search...</li>}
                {coins.slice(0, 50).map((c) => (
                  <li
                    key={c.id}
                    onClick={() => selectCoin(c)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <strong>{c.symbol}</strong> <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{c.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              width: 120,
              fontSize: "0.9375rem",
            }}
          />
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              flex: 1,
              minWidth: 120,
              fontSize: "0.9375rem",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !(selectedCoin?.symbol || coinSearch.trim()) || !quantity}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: "0.9375rem",
            }}
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Positions</h2>
        {loading ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Symbol</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Quantity</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Entry price</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Notes</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
              </tbody>
            </table>
          </div>
        ) : positions.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No positions. Add one above or ask the assistant in Chat to update your portfolio.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Symbol</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Quantity</th>
                  <th style={{ textAlign: "right", padding: "0.5rem" }}>Entry price</th>
                  <th style={{ textAlign: "left", padding: "0.5rem" }}>Notes</th>
                  <th style={{ width: 80 }} />
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
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "transparent",
                          color: "#f87171",
                          border: "1px solid #f87171",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Delete
                      </button>
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
