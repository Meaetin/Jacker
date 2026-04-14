"use client";

import { useState } from "react";

interface ParseLogPanelProps {
  rawResponse: unknown;
  success: boolean;
  errorMessage?: string | null;
}

export function ParseLogPanel({
  rawResponse,
  success,
  errorMessage,
}: ParseLogPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="parse-log-panel mt-4">
      <button
        className="parse-log-toggle text-sm text-text-secondary hover:text-text-primary"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide" : "Show"} Parse Log
      </button>

      {open && (
        <div className="parse-log-content card-raised mt-2">
          <p className="text-sm">
            Status:{" "}
            <span className={success ? "text-status-offer" : "text-status-rejected"}>
              {success ? "Success" : "Failed"}
            </span>
          </p>
          {errorMessage && (
            <p className="text-sm text-status-rejected mt-1">{errorMessage}</p>
          )}
          <pre className="parse-log-json mt-2 text-xs overflow-auto max-h-64 bg-surface-overlay p-3 rounded">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
