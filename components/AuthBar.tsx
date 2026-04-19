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
      <div className="app-topbar">
        <HeaderNav />
        <span className="app-topbar-muted">…</span>
      </div>
    );
  }

  return (
    <div className="app-topbar">
      <HeaderNav />
      {user ? (
        <>
          <span className="app-topbar-muted">
            Signed in as <strong style={{ color: "var(--text)" }}>{user.name}</strong>
            {user.email ? ` (${user.email})` : ""}
          </span>
          <button type="button" onClick={onLogout} className="app-btn-ghost">
            Log out
          </button>
        </>
      ) : (
        <>
          <span className="app-topbar-muted">Sign in to use your own portfolio and notifications</span>
          <a href={getGoogleLoginUrl()} className="app-btn-primary">
            Sign in with Google
          </a>
        </>
      )}
    </div>
  );
}
