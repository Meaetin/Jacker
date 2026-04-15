"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteApplicationProps {
  applicationId: string;
  companyName: string | null;
}

export function DeleteApplication({ applicationId, companyName }: DeleteApplicationProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Delete failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      trigger={
        <button className="delete-application-trigger flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-status-rejected transition-colors hover:bg-red-50/60">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      }
    >
      <div className="delete-dialog-content space-y-4">
        <h3 className="delete-dialog-title font-display text-lg font-semibold text-text-primary">
          Delete Application
        </h3>
        <p className="delete-dialog-message text-sm text-text-secondary">
          Are you sure you want to delete the application for{" "}
          <strong className="text-text-primary">{companyName || "this company"}</strong>?
          This cannot be undone.
        </p>
        {error && (
          <p className="delete-dialog-error text-sm text-status-rejected">{error}</p>
        )}
        <div className="delete-dialog-actions flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => {}}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-status-rejected hover:bg-status-rejected/90 text-white"
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
