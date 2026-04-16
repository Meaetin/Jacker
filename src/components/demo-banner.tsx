"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";

const DISMISS_KEY = "demo-banner-dismissed";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="demo-banner flex items-center gap-3 rounded-lg bg-brand-light border border-brand/20 px-4 py-3 text-sm">
      <Info className="demo-banner-icon h-4 w-4 flex-shrink-0 text-brand" />
      <span className="demo-banner-text flex-1 text-brand">
        You&apos;re exploring a read-only demo with sample job applications.
        Some actions are disabled.
      </span>
      <a
        href="/login"
        className="demo-banner-signin text-brand font-medium hover:underline whitespace-nowrap"
      >
        Sign in
      </a>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem(DISMISS_KEY, "true");
        }}
        className="demo-banner-dismiss text-brand/40 hover:text-brand transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
