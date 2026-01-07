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
import { SceneErrorBoundary } from "@/components/SceneErrorBoundary";
import { useReactors } from "@/hooks/useReactors";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
  const { reactors, isLoading } = useReactors();
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
  const [infoModalTab, setInfoModalTab] = useState<"about" | "privacy" | "terms" | "credits">("about");
  const [isLocating, setIsLocating] = useState(false);
  const [operationalIndex, setOperationalIndex] = useState(0);
  const [initialUrlHandled, setInitialUrlHandled] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>("realistic");
  const [showClouds, setShowClouds] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Scene ref for camera controls
  const sceneRef = useRef<SceneControls>(null);

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
   * Filter reactors by selected country
   */
  const filteredReactors = useMemo(() => {
    if (!selectedCountry) return reactors;
    return reactors.filter((r) => r.country === selectedCountry);
  }, [reactors, selectedCountry]);

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
   * Handle country filter selection
   */
  const handleSelectCountry = useCallback((country: string | null) => {
    setSelectedCountry(country);
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
          lightingMode={lightingMode}
          showClouds={showClouds}
        />
      </SceneErrorBoundary>

      {/* UI Overlay */}
      <div className="content-layer pointer-events-none">
        <MinimalHeader
          reactors={reactors}
          visibleStatuses={visibleStatuses}
          onToggleStatus={handleToggleStatus}
          onSearch={() => setIsSearchOpen(true)}
          selectedCountry={selectedCountry}
          onSelectCountry={handleSelectCountry}
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
        />

        {/* Info button - bottom left, hidden on mobile when panel is open */}
        <div className={`fixed bottom-5 left-5 z-50 pointer-events-auto transition-opacity ${
          selectedReactor ? "opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto" : ""
        }`}>
          <InfoButton onClick={() => setIsInfoOpen(true)} />
        </div>

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

      {/* Search Modal */}
      <SearchBar
        reactors={reactors}
        onSelectReactor={handleSearchSelect}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </main>
  );
}
