"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "CV & Profile" },
  { href: "/dashboard/job-analysis", label: "Job Analysis" },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <nav className="nav-sidebar w-56 border-r border-border p-4">
      <Link href="/" className="nav-logo text-lg font-bold text-brand">
        Jacker
      </Link>
      <ul className="nav-links mt-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`nav-link block rounded-lg px-3 py-2 text-sm transition-colors ${pathname === item.href
                  ? "bg-brand-light text-brand font-medium"
                  : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
