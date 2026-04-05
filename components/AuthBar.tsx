"use client";

import { useCallback, useEffect, useState } from "react";
import { getGoogleLoginUrl, getMe, logoutApi, type CurrentUser } from "@/lib/api";
import { HeaderNav } from "@/components/HeaderNav";

export function AuthBar() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onLogout = async () => {
    await logoutApi();
    setUser(null);
  };

  if (user === undefined) {
    return (
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
          padding: "0.5rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          fontSize: "0.85rem",
          color: "var(--muted)",
        }}
      >
        <HeaderNav />
        <span>…</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        position: "sticky",
        top: 0,
        zIndex: 40,
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.5rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexWrap: "wrap",
      }}
    >
      <HeaderNav />
      {user ? (
        <>
          <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            Signed in as <strong style={{ color: "var(--text)" }}>{user.name}</strong>
            {user.email ? ` (${user.email})` : ""}
          </span>
          <button
            type="button"
            onClick={onLogout}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8125rem",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            Sign in to use your own portfolio and notifications
          </span>
          <a
            href={getGoogleLoginUrl()}
            style={{
              display: "inline-block",
              padding: "0.4rem 0.9rem",
              fontSize: "0.8125rem",
              borderRadius: 6,
              background: "var(--accent)",
              color: "white",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign in with Google
          </a>
        </>
      )}
    </div>
  );
}
