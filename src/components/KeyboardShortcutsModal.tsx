"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal showing available keyboard shortcuts
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 */
export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const shortcutGroups = [
    {
      title: "Navigation",
      shortcuts: [
        SHORTCUTS.SEARCH,
        SHORTCUTS.MY_LOCATION,
        SHORTCUTS.RESET_VIEW,
      ],
    },
    {
      title: "Zoom",
      shortcuts: [SHORTCUTS.ZOOM_IN, SHORTCUTS.ZOOM_OUT],
    },
    {
      title: "Reactors",
      shortcuts: [SHORTCUTS.NEXT_ERUPTING, SHORTCUTS.PREV_ERUPTING],
    },
    {
      title: "General",
      shortcuts: [SHORTCUTS.HELP, SHORTCUTS.CLOSE],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="glass-solid rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-cream">
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-silver"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-5 space-y-5">
                {shortcutGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between py-1.5"
                        >
                          <span className="text-silver text-sm">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2.5 py-1 text-xs font-mono text-cream bg-graphite rounded-md border border-white/10">
                            {shortcut.label}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-black/20 border-t border-white/10">
                <p className="text-xs text-muted text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-graphite rounded text-silver">?</kbd> anytime to show this help
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
