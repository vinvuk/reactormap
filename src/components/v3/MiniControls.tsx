"use client";

import { useState } from "react";
import { LightingMode } from "@/lib/types";

interface MiniControlsProps {
  onMyLocation: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onHelp: () => void;
  isLocating: boolean;
  lightingMode: LightingMode;
  onCycleLightingMode: () => void;
  showClouds: boolean;
  onToggleClouds: () => void;
  isPanelOpen?: boolean;
}

/**
 * Control buttons with glass effect - centered row at bottom
 */
export function MiniControls({
  onMyLocation,
  onResetView,
  onZoomIn,
  onZoomOut,
  onHelp,
  isLocating,
  lightingMode,
  onCycleLightingMode,
  showClouds,
  onToggleClouds,
  isPanelOpen = false,
}: MiniControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  /**
   * Get icon for current lighting mode
   */
  const getLightingIcon = () => {
    switch (lightingMode) {
      case "day":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        );
      case "night":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      default: // realistic
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <path strokeWidth={2} d="M12 3a9 9 0 010 18" fill="currentColor" fillOpacity={0.3} />
          </svg>
        );
    }
  };

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
      id: "lighting",
      icon: getLightingIcon(),
      onClick: onCycleLightingMode,
      label: lightingMode === "realistic" ? "Realistic" : lightingMode === "day" ? "Day mode" : "Night mode",
    },
    {
      id: "clouds",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      onClick: onToggleClouds,
      label: showClouds ? "Hide clouds" : "Show clouds",
      active: showClouds,
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
    {
      id: "help",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: onHelp,
      label: "Help",
    },
  ];

  // On mobile, show only essential buttons
  const mobileButtons = buttons.filter(btn =>
    ["zoomIn", "zoomOut", "location", "reset"].includes(btn.id)
  );

  return (
    <nav
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto transition-all duration-300 ${
        isPanelOpen ? "opacity-0 translate-y-4 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto" : ""
      }`}
      aria-label="Globe controls"
    >
      {/* Mobile: Compact layout with essential buttons */}
      <div className="glass-panel rounded-2xl px-1.5 py-1.5 flex items-center gap-0.5 md:hidden" role="toolbar">
        {mobileButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            className={`p-2.5 rounded-lg transition-colors touch-manipulation ${
              btn.active === false
                ? "text-silver/40 active:bg-white/20"
                : "text-silver active:bg-white/20"
            }`}
            aria-label={btn.label}
          >
            <span className="w-5 h-5 block">{btn.icon}</span>
          </button>
        ))}
      </div>

      {/* Desktop: Full button set with tooltips */}
      <div className="glass-panel rounded-2xl px-2 py-2 hidden md:flex items-center gap-1" role="toolbar">
        {buttons.map((btn) => (
          <div key={btn.id} className="relative">
            <button
              onClick={btn.onClick}
              onMouseEnter={() => setHoveredButton(btn.id)}
              onMouseLeave={() => setHoveredButton(null)}
              className={`p-3 rounded-xl transition-colors ${
                btn.active === false
                  ? "text-silver/40 hover:bg-white/10"
                  : "text-silver hover:bg-white/10"
              }`}
              aria-label={btn.label}
            >
              {btn.icon}
            </button>
            {/* Tooltip */}
            {hoveredButton === btn.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 glass-solid rounded-lg whitespace-nowrap pointer-events-none">
                <span className="text-xs text-cream">{btn.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
