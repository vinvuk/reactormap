"use client";

import { Suspense, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SearchBar } from "@/components/SearchBar";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { MinimalHeader } from "@/components/v3/MinimalHeader";
import { CompactPanel } from "@/components/v3/CompactPanel";
import { MiniControls } from "@/components/v3/MiniControls";
import { InfoModal, InfoButton } from "@/components/v3/InfoModal";
import { StatsPanel } from "@/components/v3/StatsPanel";
import { SceneErrorBoundary } from "@/components/SceneErrorBoundary";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useReactors } from "@/hooks/useReactors";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Reactor, ReactorStatus, LightingMode } from "@/lib/types";
import type { SceneControls } from "@/components/Scene";

// Dynamic import for Scene to avoid SSR issues with Three.js
const Scene = dynamic(
  () => import("@/components/Scene").then((mod) => mod.Scene),
  { ssr: false }
);

/**
 * Main page component wrapper with Suspense boundary for useSearchParams
 */
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen isLoading={true} />}>
      <HomeContent />
    </Suspense>
  );
}

/**
 * Inner content component that uses URL search params
 * Manages global state and coordinates all child components
 */
function HomeContent() {
  const searchParams = useSearchParams();
  const { reactors, isLoading, dataSourceDate } = useReactors();
  const [selectedReactor, setSelectedReactor] = useState<Reactor | null>(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(
    new Set<ReactorStatus>(["operational", "under_construction", "planned", "suspended", "shutdown", "cancelled"])
  );
  const [hoveredReactor, setHoveredReactor] = useState<{
    reactor: { name: string; status: string };
    position: { x: number; y: number };
  } | null>(null);

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<"about" | "privacy" | "terms" | "credits">("about");
  const [isLocating, setIsLocating] = useState(false);
  const [operationalIndex, setOperationalIndex] = useState(0);
  const [initialUrlHandled, setInitialUrlHandled] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>("realistic");
  const [showClouds, setShowClouds] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());

  // Scene ref for camera controls
  const sceneRef = useRef<SceneControls>(null);

  // Mobile detection - force day mode on mobile to avoid city lights confusion
  const isMobile = useIsMobile();
  const effectiveLightingMode = isMobile ? "day" : lightingMode;

  /**
   * Handle initial URL parameter to select reactor on page load
   */
  useEffect(() => {
    if (initialUrlHandled || reactors.length === 0 || !sceneLoaded) return;

    const reactorId = searchParams.get("r");
    if (reactorId) {
      const reactor = reactors.find((r) => r.id === reactorId);
      if (reactor) {
        setSelectedReactor(reactor);
        // Small delay to ensure scene is ready
        setTimeout(() => {
          sceneRef.current?.rotateToLocation(reactor.latitude, reactor.longitude);
        }, 100);
      }
    }
    setInitialUrlHandled(true);
  }, [reactors, sceneLoaded, searchParams, initialUrlHandled]);

  /**
   * Listen for custom event from cookie consent to open privacy policy
   */
  useEffect(() => {
    const handleOpenPrivacy = () => {
      setInfoModalTab("privacy");
      setIsInfoOpen(true);
    };

    window.addEventListener("open-privacy-policy", handleOpenPrivacy);
    return () => {
      window.removeEventListener("open-privacy-policy", handleOpenPrivacy);
    };
  }, []);

  /**
   * Update URL when reactor selection changes
   */
  const updateUrl = useCallback((reactor: Reactor | null) => {
    const params = new URLSearchParams();
    if (reactor) {
      params.set("r", reactor.id);
    }
    const queryString = params.toString();
    window.history.replaceState(
      null,
      "",
      queryString ? `?${queryString}` : window.location.pathname
    );
  }, []);

  /**
   * Handle reactor selection with URL update
   */
  const handleSelectReactor = useCallback((reactor: Reactor | null) => {
    setSelectedReactor(reactor);
    updateUrl(reactor);
  }, [updateUrl]);

  /**
   * Filter reactors by selected countries
   */
  const filteredReactors = useMemo(() => {
    if (selectedCountries.size === 0) return reactors;
    return reactors.filter((r) => selectedCountries.has(r.country));
  }, [reactors, selectedCountries]);

  /**
   * Get list of operational reactors for navigation
   */
  const operationalReactors = useMemo(
    () => filteredReactors.filter((r) => r.status === "operational"),
    [filteredReactors]
  );

  /**
   * Handle scene load completion
   */
  const handleSceneLoadComplete = useCallback(() => {
    setSceneLoaded(true);
  }, []);

  /**
   * Toggle visibility of a reactor status
   * @param status - Status to toggle
   */
  const handleToggleStatus = useCallback((status: string) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  /**
   * Handle reactor hover for tooltip display
   * @param reactor - Hovered reactor info
   * @param screenPos - Screen position for tooltip
   */
  const handleHoverReactor = useCallback(
    (
      reactor: { name: string; status: string } | null,
      screenPos: { x: number; y: number } | null
    ) => {
      if (reactor && screenPos) {
        setHoveredReactor({ reactor, position: screenPos });
      } else {
        setHoveredReactor(null);
      }
    },
    []
  );

  /**
   * Handle reactor selection from search
   */
  const handleSearchSelect = useCallback((reactor: Reactor) => {
    handleSelectReactor(reactor);
    sceneRef.current?.rotateToLocation(reactor.latitude, reactor.longitude);
  }, [handleSelectReactor]);

  /**
   * Handle my location - requires HTTPS in production
   */
  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Check if we're on HTTPS (required for geolocation in production)
    if (typeof window !== "undefined" && window.location.protocol === "http:" && window.location.hostname !== "localhost") {
      alert("Location requires a secure connection (HTTPS)");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sceneRef.current?.rotateToLocation(
          position.coords.latitude,
          position.coords.longitude
        );
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);

        // Provide specific error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location permission denied. Please enable location access in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information unavailable.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Please try again.");
            break;
          default:
            alert("Unable to get your location.");
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 60000
      }
    );
  }, []);

  /**
   * Handle close (panels, search, etc.)
   */
  const handleClose = useCallback(() => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
    } else if (isHelpOpen) {
      setIsHelpOpen(false);
    } else if (isInfoOpen) {
      setIsInfoOpen(false);
    } else if (selectedReactor) {
      handleSelectReactor(null);
    }
  }, [isSearchOpen, isHelpOpen, isInfoOpen, selectedReactor, handleSelectReactor]);

  /**
   * Navigate to next operational reactor
   */
  const handleNextOperational = useCallback(() => {
    if (operationalReactors.length === 0) return;
    const nextIndex = (operationalIndex + 1) % operationalReactors.length;
    setOperationalIndex(nextIndex);
    const reactor = operationalReactors[nextIndex];
    handleSelectReactor(reactor);
    sceneRef.current?.rotateToLocation(reactor.latitude, reactor.longitude);
  }, [operationalReactors, operationalIndex, handleSelectReactor]);

  /**
   * Navigate to previous operational reactor
   */
  const handlePrevOperational = useCallback(() => {
    if (operationalReactors.length === 0) return;
    const prevIndex = (operationalIndex - 1 + operationalReactors.length) % operationalReactors.length;
    setOperationalIndex(prevIndex);
    const reactor = operationalReactors[prevIndex];
    handleSelectReactor(reactor);
    sceneRef.current?.rotateToLocation(reactor.latitude, reactor.longitude);
  }, [operationalReactors, operationalIndex, handleSelectReactor]);

  /**
   * Cycle through lighting modes: realistic -> day -> night -> realistic
   */
  const handleCycleLightingMode = useCallback(() => {
    setLightingMode((prev) => {
      const modes: LightingMode[] = ["realistic", "day", "night"];
      const currentIndex = modes.indexOf(prev);
      return modes[(currentIndex + 1) % modes.length];
    });
  }, []);

  /**
   * Toggle cloud visibility on the globe
   */
  const handleToggleClouds = useCallback(() => {
    setShowClouds((prev) => !prev);
  }, []);

  /**
   * Handle country filter toggle (add/remove from selection)
   * @param country - Country to toggle, or null to clear all
   */
  const handleToggleCountry = useCallback((country: string | null) => {
    if (country === null) {
      setSelectedCountries(new Set());
    } else {
      setSelectedCountries((prev) => {
        const next = new Set(prev);
        if (next.has(country)) {
          next.delete(country);
        } else {
          next.add(country);
        }
        return next;
      });
    }
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setIsSearchOpen(true),
    onClose: handleClose,
    onHelp: () => setIsHelpOpen(true),
    onMyLocation: handleMyLocation,
    onZoomIn: () => sceneRef.current?.zoomIn(),
    onZoomOut: () => sceneRef.current?.zoomOut(),
    onResetView: () => sceneRef.current?.resetView(),
    onNextErupting: handleNextOperational,
    onPrevErupting: handlePrevOperational,
    isSearchOpen,
    isHelpOpen,
  });

  const showLoading = isLoading || !sceneLoaded;

  return (
    <main className="relative min-h-screen overflow-hidden bg-obsidian">
      {/* Loading Screen */}
      <LoadingScreen isLoading={showLoading} />

      {/* 3D Scene */}
      <SceneErrorBoundary>
        <Scene
          ref={sceneRef}
          reactors={filteredReactors}
          selectedReactor={selectedReactor}
          onSelectReactor={handleSelectReactor}
          visibleStatuses={visibleStatuses}
          onLoadComplete={handleSceneLoadComplete}
          isLoading={isLoading}
          onHoverReactor={handleHoverReactor}
          lightingMode={effectiveLightingMode}
          showClouds={showClouds}
        />
      </SceneErrorBoundary>

      {/* Mobile Layout - only visible on mobile */}
      <MobileLayout
        reactors={reactors}
        selectedReactor={selectedReactor}
        onSelectReactor={handleSelectReactor}
        onMyLocation={handleMyLocation}
        onResetView={() => sceneRef.current?.resetView()}
        onZoomIn={() => sceneRef.current?.zoomIn()}
        onZoomOut={() => sceneRef.current?.zoomOut()}
        isLocating={isLocating}
        onSearchSelect={handleSearchSelect}
      />

      {/* Desktop UI Overlay - hidden on mobile */}
      <div className="hidden md:block content-layer pointer-events-none">
        <MinimalHeader
          reactors={reactors}
          visibleStatuses={visibleStatuses}
          onToggleStatus={handleToggleStatus}
          onSearch={() => setIsSearchOpen(true)}
          selectedCountries={selectedCountries}
          onToggleCountry={handleToggleCountry}
          dataSourceDate={dataSourceDate}
        />

        <CompactPanel
          reactor={selectedReactor}
          reactors={filteredReactors}
          onClose={() => handleSelectReactor(null)}
          onSelectReactor={handleSelectReactor}
        />

        <MiniControls
          onMyLocation={handleMyLocation}
          onResetView={() => sceneRef.current?.resetView()}
          onZoomIn={() => sceneRef.current?.zoomIn()}
          onZoomOut={() => sceneRef.current?.zoomOut()}
          onHelp={() => setIsHelpOpen(true)}
          isLocating={isLocating}
          lightingMode={lightingMode}
          onCycleLightingMode={handleCycleLightingMode}
          showClouds={showClouds}
          onToggleClouds={handleToggleClouds}
          isPanelOpen={!!selectedReactor}
        />

        {/* Bottom left buttons - hidden on mobile when panel is open */}
        <div className={`fixed bottom-5 left-5 z-50 pointer-events-auto transition-opacity flex items-center gap-2 ${
          selectedReactor ? "opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto" : ""
        }`}>
          <InfoButton onClick={() => setIsInfoOpen(true)} />
          {/* Stats button */}
          <button
            onClick={() => setIsStatsOpen(true)}
            className="glass-panel p-3 rounded-xl hover:bg-white/10 transition-colors"
            title="View Statistics"
          >
            <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* Stats Panel */}
        <StatsPanel
          reactors={reactors}
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
        />

        {/* Info Modal */}
        <InfoModal
          isOpen={isInfoOpen}
          onClose={() => {
            setIsInfoOpen(false);
            // Reset to default tab when closing
            setInfoModalTab("about");
          }}
          initialTab={infoModalTab}
        />

        {/* Hover Tooltip */}
        {hoveredReactor && (
          <div
            className="fixed pointer-events-none z-50 glass-solid px-3 py-2 rounded-lg"
            style={{
              left: hoveredReactor.position.x + 15,
              top: hoveredReactor.position.y - 30,
            }}
          >
            <p className="text-sm font-medium text-cream">
              {hoveredReactor.reactor.name}
            </p>
            <p className="text-xs text-silver capitalize">
              {hoveredReactor.reactor.status.replace(/_/g, " ")}
            </p>
          </div>
        )}
      </div>

      {/* Desktop Search Modal - hidden on mobile */}
      <div className="hidden md:block">
        <SearchBar
          reactors={reactors}
          onSelectReactor={handleSearchSelect}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </main>
  );
}
