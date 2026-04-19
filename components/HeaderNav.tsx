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
    <nav className="app-nav" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} data-active={active ? "true" : "false"}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
