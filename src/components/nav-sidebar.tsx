"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Target, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "CV & Profile", icon: FileText },
  { href: "/dashboard/job-analysis", label: "Job Analysis", icon: Target },
];

interface NavSidebarProps {
  userEmail?: string | null;
}

export function NavSidebar({ userEmail }: NavSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="nav-sidebar flex flex-col w-56 h-screen sticky top-0 bg-surface border-r border-border overflow-y-auto">
      <div className="nav-sidebar-top p-4">
        <Link
          href="/"
          className="nav-logo font-display text-xl font-bold text-brand"
        >
          Jacker
        </Link>
        <ul className="nav-links mt-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm border-l-2 transition-all duration-200 ${
                    pathname === item.href
                      ? "nav-link-active bg-brand-light text-brand font-medium border-brand"
                      : "nav-link-inactive border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="nav-sidebar-bottom mt-auto border-t border-border p-4">
        {userEmail && (
          <div className="nav-user-info flex items-center gap-2">
            <div className="nav-user-avatar flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-light text-brand text-xs font-medium">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <p className="nav-user-email truncate text-xs text-text-secondary">
              {userEmail}
            </p>
          </div>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="nav-signout-button mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
