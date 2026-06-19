"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface DialogProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
}

export function Dialog({
  trigger,
  children,
  open: controlledOpen,
  onClose,
  contentClassName = "max-w-lg",
  closeOnOverlayClick = true,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  return (
    <>
      {trigger && (
        <div onClick={() => !controlledOpen && setInternalOpen(true)}>
          {trigger}
        </div>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(42, 33, 24, 0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!closeOnOverlayClick) return;
              setInternalOpen(false);
              onClose?.();
            }}
          >
            <motion.div
              className={`dialog-content card w-full mx-4 ${contentClassName}`}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="dialog-close cursor-pointer ml-auto block text-text-secondary hover:text-text-primary transition-colors"
                onClick={() => {
                  setInternalOpen(false);
                  onClose?.();
                }}
              >
                Close
              </button>
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
