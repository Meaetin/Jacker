"use client";

import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState({ x, y });

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const ax = x + rect.width > window.innerWidth ? x - rect.width : x;
    const ay = y + rect.height > window.innerHeight ? y - rect.height : y;
    setAdjusted({ x: Math.max(0, ax), y: Math.max(0, ay) });
  }, [x, y]);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClickOutside, handleEscape]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="context-menu"
        style={{ left: adjusted.x, top: adjusted.y }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            className={`context-menu-item ${item.danger ? "context-menu-item-danger" : ""}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
