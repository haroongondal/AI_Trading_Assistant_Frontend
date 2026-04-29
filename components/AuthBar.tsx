"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearAuthToken,
  getGoogleLoginUrl,
  getMe,
  logoutApi,
  persistAuthToken,
  type CurrentUser,
} from "@/lib/api";
import { HeaderNav } from "@/components/HeaderNav";

export function AuthBar() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

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

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const authToken = hashParams.get("auth_token");
      if (authToken) {
        persistAuthToken(authToken);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        void refresh();
      }
    }

    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (!authError) return;
    const reason = params.get("auth_reason");
    if (reason === "invalid_oauth_state") {
      setAuthNotice("Sign-in was blocked by browser privacy settings. Allow cross-site cookies for this site and try again.");
    } else {
      setAuthNotice("Sign-in failed. Please try again.");
    }
  }, [refresh]);

  const onLogout = async () => {
    try {
      await logoutApi();
      clearAuthToken();
      setUser(null);
      setAuthNotice(null);
    } catch {
      // Re-sync from server instead of showing a stale signed-out state.
      await refresh();
      setAuthNotice("Could not log out completely. Please try again.");
    }
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
      {authNotice ? <span className="app-topbar-muted">{authNotice}</span> : null}
    </div>
  );
}
