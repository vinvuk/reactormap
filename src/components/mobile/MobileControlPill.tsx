"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MobileControlPillProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMyLocation: () => void;
  onResetView: () => void;
  isLocating: boolean;
  isHidden: boolean;
}

/**
 * Floating pill-shaped control bar for mobile
 * Contains essential controls: zoom in/out, location, reset
 * Auto-hides when bottom sheet is fully expanded
 */
export function MobileControlPill({
  onZoomIn,
  onZoomOut,
  onMyLocation,
  onResetView,
  isLocating,
  isHidden,
}: MobileControlPillProps) {
  const buttons = [
    {
      id: "zoomIn",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: onZoomIn,
      label: "Zoom in",
    },
    {
      id: "zoomOut",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      ),
      onClick: onZoomOut,
      label: "Zoom out",
    },
    {
      id: "location",
      icon: isLocating ? (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      ),
      onClick: onMyLocation,
      label: "My location",
    },
    {
      id: "reset",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: onResetView,
      label: "Reset view",
    },
  ];

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto pb-safe"
          aria-label="Globe controls"
        >
          <div
            className="glass-panel rounded-full px-2 py-2 flex items-center gap-1 shadow-lg"
            role="toolbar"
          >
            {buttons.map((btn) => (
              <button
                key={btn.id}
                onClick={btn.onClick}
                className="w-11 h-11 flex items-center justify-center rounded-full text-silver active:bg-white/20 active:scale-95 transition-all touch-manipulation"
                aria-label={btn.label}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
