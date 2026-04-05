"use client";

import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "@/lib/api";
import { CardSkeleton } from "@/components/Skeleton";
import { MarkdownMessage } from "@/components/MarkdownMessage";

type Notification = {
  id: number;
  title: string;
  body: string;
  suggested_action: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark read");
    }
  };

  return (
    <main className="notifications-page" style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Notifications</h1>
      </header>
      {error && (
        <div style={{ padding: "0.5rem 1rem", background: "rgba(239,68,68,0.2)", color: "#fca5a5", marginBottom: "1rem", borderRadius: 6 }}>
          {error}
        </div>
      )}
      {loading ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : notifications.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No notifications. Scheduled jobs will create analysis and suggested next steps here (e.g. after news fetch and portfolio analysis).</p>
      ) : (
        <ul style={{ listStyle: "none" }}>
          {notifications.map((n) => (
            <li
              className="notification-card"
              key={n.id}
              style={{
                padding: "1rem",
                marginBottom: "0.75rem",
                background: n.read ? "var(--surface)" : "rgba(59, 130, 246, 0.1)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{n.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{new Date(n.created_at).toLocaleString()}</p>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <MarkdownMessage content={n.body} />
                  </div>
                  {n.suggested_action && (
                    <p style={{ fontSize: "0.9rem", color: "var(--accent)" }}>Suggested: {n.suggested_action}</p>
                  )}
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    style={{ padding: "0.25rem 0.5rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        @media (max-width: 640px) {
          .notifications-page {
            padding: 1rem !important;
          }
          .notification-card {
            padding: 0.75rem !important;
            margin-bottom: 0.55rem !important;
          }
        }
      `}</style>
    </main>
  );
}
