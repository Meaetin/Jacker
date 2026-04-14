"use client";

import { useState } from "react";

interface DialogProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export function Dialog({ trigger, children, open: controlledOpen, onClose }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  return (
    <>
      <div onClick={() => !controlledOpen && setInternalOpen(true)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="dialog-content card max-w-lg w-full mx-4">
            <button
              className="dialog-close ml-auto block text-text-secondary hover:text-text-primary"
              onClick={() => {
                setInternalOpen(false);
                onClose?.();
              }}
            >
              Close
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
