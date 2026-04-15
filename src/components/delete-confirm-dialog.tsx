"use client";

import { useState } from "react";
import type { Application } from "@/types/application";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  application: Application | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteConfirmDialog({
  open,
  application,
  onConfirm,
  onClose,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="delete-confirm-content space-y-4">
        <div className="delete-confirm-header">
          <h3 className="text-lg font-semibold text-text-primary font-display">
            Delete Application
          </h3>
        </div>
        <p className="delete-confirm-warning text-text-secondary text-sm">
          Are you sure you want to delete{" "}
          <span className="font-medium text-text-primary">
            {application?.company ?? "Unknown Company"}
          </span>{" "}
          —{" "}
          <span className="font-medium text-text-primary">
            {application?.role ?? "Unknown Role"}
          </span>
          ? This cannot be undone.
        </p>
        <div className="delete-confirm-actions flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="button"
            className="btn-danger"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
