"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Chat" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/notifications", label: "Notifications" },
];

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 8,
              border: active ? "1px solid transparent" : "1px solid var(--border)",
              background: active ? "var(--accent)" : "var(--surface)",
              color: active ? "white" : "var(--text)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
