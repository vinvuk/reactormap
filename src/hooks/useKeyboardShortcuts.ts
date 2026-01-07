"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  modifiers?: ("ctrl" | "shift" | "alt" | "meta")[];
  description: string;
  action: () => void;
}

/**
 * Keyboard shortcuts configuration
 */
export const SHORTCUTS = {
  SEARCH: { key: "/", label: "/", description: "Search reactors" },
  CLOSE: { key: "Escape", label: "ESC", description: "Close panel / search" },
  HELP: { key: "?", label: "?", description: "Show keyboard shortcuts" },
  MY_LOCATION: { key: "l", label: "L", description: "Go to my location" },
  ZOOM_IN: { key: "+", label: "+", description: "Zoom in" },
  ZOOM_OUT: { key: "-", label: "-", description: "Zoom out" },
  RESET_VIEW: { key: "r", label: "R", description: "Reset view" },
  NEXT_ERUPTING: { key: "n", label: "N", description: "Next operational reactor" },
  PREV_ERUPTING: { key: "p", label: "P", description: "Previous operational reactor" },
} as const;

interface UseKeyboardShortcutsProps {
  onSearch: () => void;
  onClose: () => void;
  onHelp: () => void;
  onMyLocation: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onNextErupting: () => void;
  onPrevErupting: () => void;
  isSearchOpen: boolean;
  isHelpOpen: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * @param props - Callback functions for each shortcut
 */
export function useKeyboardShortcuts({
  onSearch,
  onClose,
  onHelp,
  onMyLocation,
  onZoomIn,
  onZoomOut,
  onResetView,
  onNextErupting,
  onPrevErupting,
  isSearchOpen,
  isHelpOpen,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        // Only allow Escape in inputs
        if (event.key === "Escape") {
          onClose();
        }
        return;
      }

      // Handle Escape
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Don't handle other shortcuts if modal is open
      if (isSearchOpen || isHelpOpen) {
        return;
      }

      switch (event.key) {
        case "/":
          event.preventDefault();
          onSearch();
          break;
        case "?":
          event.preventDefault();
          onHelp();
          break;
        case "l":
        case "L":
          event.preventDefault();
          onMyLocation();
          break;
        case "+":
        case "=":
          event.preventDefault();
          onZoomIn();
          break;
        case "-":
        case "_":
          event.preventDefault();
          onZoomOut();
          break;
        case "r":
        case "R":
          event.preventDefault();
          onResetView();
          break;
        case "n":
        case "N":
          event.preventDefault();
          onNextErupting();
          break;
        case "p":
        case "P":
          event.preventDefault();
          onPrevErupting();
          break;
      }
    },
    [
      onSearch,
      onClose,
      onHelp,
      onMyLocation,
      onZoomIn,
      onZoomOut,
      onResetView,
      onNextErupting,
      onPrevErupting,
      isSearchOpen,
      isHelpOpen,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
