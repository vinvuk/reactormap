"use client";

import { useState, useCallback } from "react";
import { Reactor } from "@/lib/types";
import { MobileControlPill } from "./MobileControlPill";
import { MobileBottomSheet } from "./MobileBottomSheet";
import { MobileSearchOverlay, MobileSearchButton } from "./MobileSearchOverlay";

interface MobileLayoutProps {
  reactors: Reactor[];
  selectedReactor: Reactor | null;
  onSelectReactor: (reactor: Reactor | null) => void;
  onMyLocation: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isLocating: boolean;
  onSearchSelect: (reactor: Reactor) => void;
}

/**
 * Mobile-only layout wrapper
 * Manages mobile-specific UI state and coordinates components
 * Only rendered on viewports < 768px (md breakpoint)
 */
export function MobileLayout({
  reactors,
  selectedReactor,
  onSelectReactor,
  onMyLocation,
  onResetView,
  onZoomIn,
  onZoomOut,
  isLocating,
  onSearchSelect,
}: MobileLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);

  /**
   * Handle sheet height changes to adjust control visibility
   */
  const handleSheetHeightChange = useCallback((height: number) => {
    setSheetHeight(height);
  }, []);

  /**
   * Handle reactor selection from search
   */
  const handleSearchSelect = useCallback((reactor: Reactor) => {
    onSearchSelect(reactor);
    setIsSearchOpen(false);
  }, [onSearchSelect]);

  /**
   * Handle closing the bottom sheet
   */
  const handleCloseSheet = useCallback(() => {
    onSelectReactor(null);
  }, [onSelectReactor]);

  // Determine if controls should be hidden (sheet is expanded past 80% viewport)
  const isSheetExpanded = sheetHeight > window.innerHeight * 0.8;

  return (
    <div className="md:hidden">
      {/* Floating Search Button */}
      <MobileSearchButton onClick={() => setIsSearchOpen(true)} />

      {/* Control Pill - hidden when sheet is fully expanded */}
      <MobileControlPill
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onMyLocation={onMyLocation}
        onResetView={onResetView}
        isLocating={isLocating}
        isHidden={isSheetExpanded || !!selectedReactor}
      />

      {/* Bottom Sheet for Reactor Details */}
      <MobileBottomSheet
        reactor={selectedReactor}
        reactors={reactors}
        onClose={handleCloseSheet}
        onSelectReactor={onSelectReactor}
        onSheetHeightChange={handleSheetHeightChange}
      />

      {/* Full-screen Search Overlay */}
      <MobileSearchOverlay
        reactors={reactors}
        onSelectReactor={handleSearchSelect}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
