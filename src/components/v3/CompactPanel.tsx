"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reactor, STATUS_CONFIG } from "@/lib/types";
import { CountryFlag } from "@/components/CountryFlag";

interface CompactPanelProps {
  reactor: Reactor | null;
  reactors: Reactor[];
  onClose: () => void;
  onSelectReactor: (reactor: Reactor) => void;
}

/**
 * Compact side panel for reactor info
 * Minimal footprint, slides in from right
 */
export function CompactPanel({ reactor, reactors, onClose, onSelectReactor }: CompactPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showClusterList, setShowClusterList] = useState(false);

  /**
   * Find co-located reactors at the same coordinates
   */
  const coLocatedReactors = useMemo(() => {
    if (!reactor) return [];
    return reactors.filter(
      (r) =>
        r.id !== reactor.id &&
        Math.abs(r.latitude - reactor.latitude) < 0.001 &&
        Math.abs(r.longitude - reactor.longitude) < 0.001
    );
  }, [reactor, reactors]);

  const statusConfig = reactor ? STATUS_CONFIG[reactor.status] : null;

  const handleCopyLink = async () => {
    if (!reactor) return;
    const url = `${window.location.origin}?r=${reactor.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  /**
   * Format date string for display
   */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  return (
    <>
      {/* Mobile: slides up from bottom */}
      <AnimatePresence>
        {reactor && (
          <motion.div
            key="mobile-panel"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-3 right-3 bottom-20 max-h-[60vh] z-50 pointer-events-auto md:hidden"
            style={{ touchAction: 'none' }}
          >
            <div
              className="h-full glass-panel rounded-2xl overflow-hidden flex flex-col"
              style={{ touchAction: 'pan-y' }}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Drag handle for mobile */}
              <div className="flex justify-center py-2 border-b border-white/5">
                <div className="w-12 h-1 rounded-full bg-white/30" />
              </div>
              {renderPanelContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: slides in from right, aligned with header */}
      <AnimatePresence>
        {reactor && (
          <motion.div
            key="desktop-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 right-5 bottom-5 w-72 z-40 pointer-events-auto hidden md:block"
          >
            <div className="h-full glass-panel rounded-2xl overflow-hidden flex flex-col">
              {renderPanelContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  /**
   * Render panel content (shared between mobile and desktop)
   * Only called when reactor is truthy
   */
  function renderPanelContent() {
    // These are guaranteed to exist when this function is called
    if (!reactor || !statusConfig) return null;

    return (
      <>
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-semibold text-cream truncate">
                  {reactor.name}
                </h2>
                <p className="text-xs text-silver truncate flex items-center gap-1.5">
                  <CountryFlag countryCode={reactor.countryCode} className="w-4 h-3 rounded-sm flex-shrink-0" />
                  {reactor.country}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status badge and cluster indicator */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
                style={{
                  backgroundColor: `${statusConfig.color}20`,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </span>
              {coLocatedReactors.length > 0 && (
                <button
                  onClick={() => setShowClusterList(!showClusterList)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-silver hover:bg-white/20 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {coLocatedReactors.length + 1} reactors
                  <svg
                    className={`w-3 h-3 transition-transform ${showClusterList ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Co-located reactors list */}
            {showClusterList && coLocatedReactors.length > 0 && (
              <div className="mt-3 p-2 rounded-lg bg-white/5 space-y-1">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Reactors at this site</p>
                {/* Current reactor */}
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/10 border border-white/20">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusConfig.color }}
                  />
                  <span className="text-xs text-cream truncate flex-1">{reactor.name}</span>
                  <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                {/* Other reactors */}
                {coLocatedReactors.map((r) => {
                  const rStatus = STATUS_CONFIG[r.status];
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectReactor(r);
                        setShowClusterList(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/10 transition-colors text-left"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: rStatus.color }}
                      />
                      <span className="text-xs text-silver truncate flex-1">{r.name}</span>
                      <span
                        className="text-[9px] uppercase"
                        style={{ color: rStatus.color }}
                      >
                        {rStatus.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content - scrollable with mobile touch support */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Wikipedia thumbnail */}
            {reactor.wikipediaThumbnail && (
              <div className="rounded-lg overflow-hidden bg-white/5">
                <img
                  src={reactor.wikipediaThumbnail}
                  alt={reactor.name}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Wikipedia extract */}
            {reactor.wikipediaExtract ? (
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-xs text-silver leading-relaxed line-clamp-4">
                  {reactor.wikipediaExtract}
                </p>
                {reactor.wikipediaUrl && (
                  <a
                    href={reactor.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.903-1.543.09-.418-.813-2.227-5.375-2.776-6.668-.549-1.293-1.033-1.16-1.609-.99-.248.073-.637.196-1.009.33l-.182-.457c.596-.25 1.334-.556 2.013-.845 1.066-.45 1.893-.646 2.662.48.759 1.112 1.767 3.842 2.258 5.016.592-1.126 1.994-3.74 2.83-5.138.84-1.4 1.787-1.315 2.503-.74.716.576 1.39 1.17 1.985 1.774l-.164.498c-.495-.387-.98-.74-1.403-.967-.424-.228-.816-.158-1.239.417-.423.576-1.471 3.469-2.473 5.472z"/>
                    </svg>
                    Read more on Wikipedia
                  </a>
                )}
              </div>
            ) : reactor.wikipediaUrl ? (
              <a
                href={reactor.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.903-1.543.09-.418-.813-2.227-5.375-2.776-6.668-.549-1.293-1.033-1.16-1.609-.99-.248.073-.637.196-1.009.33l-.182-.457c.596-.25 1.334-.556 2.013-.845 1.066-.45 1.893-.646 2.662.48.759 1.112 1.767 3.842 2.258 5.016.592-1.126 1.994-3.74 2.83-5.138.84-1.4 1.787-1.315 2.503-.74.716.576 1.39 1.17 1.985 1.774l-.164.498c-.495-.387-.98-.74-1.403-.967-.424-.228-.816-.158-1.239.417-.423.576-1.471 3.469-2.473 5.472z"/>
                </svg>
                <span className="text-xs text-blue-400">View on Wikipedia</span>
              </a>
            ) : null}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              {reactor.capacity && (
                <div className="p-2 rounded-lg bg-white/5 text-center">
                  <p className="text-lg font-semibold text-cream">{reactor.capacity.toLocaleString()}</p>
                  <p className="text-[10px] text-muted">MW capacity</p>
                </div>
              )}
              {reactor.reactorType && (
                <div className="p-2 rounded-lg bg-white/5 text-center">
                  <p className="text-sm font-semibold text-cream truncate">{reactor.reactorType}</p>
                  <p className="text-[10px] text-muted">type</p>
                </div>
              )}
            </div>

            {/* Reactor Model */}
            {reactor.reactorModel && (
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Reactor Model</p>
                <p className="text-sm text-cream">{reactor.reactorModel}</p>
              </div>
            )}

            {/* Operator & Owner */}
            {(reactor.wikidataOperator || reactor.wikidataOwner) && (
              <div className="p-2 rounded-lg bg-white/5 space-y-2">
                {reactor.wikidataOperator && (
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Operator</p>
                    <p className="text-xs text-cream">{reactor.wikidataOperator}</p>
                  </div>
                )}
                {reactor.wikidataOwner && (
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">Owner</p>
                    <p className="text-xs text-cream">{reactor.wikidataOwner}</p>
                  </div>
                )}
              </div>
            )}

            {/* Region */}
            {reactor.wikidataRegion && (
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Region</p>
                <p className="text-xs text-cream">{reactor.wikidataRegion}</p>
              </div>
            )}

            {/* Architect/Designer */}
            {reactor.wikidataArchitect && (
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Designer</p>
                <p className="text-xs text-cream">{reactor.wikidataArchitect}</p>
              </div>
            )}

            {/* Coordinates with Google Maps link */}
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Coordinates</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-cream">
                  {reactor.latitude.toFixed(4)}°, {reactor.longitude.toFixed(4)}°
                </p>
                <a
                  href={`https://www.google.com/maps/@${reactor.latitude},${reactor.longitude},1500m/data=!3m1!1e3`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="View satellite imagery"
                >
                  <svg className="w-3 h-3 text-silver" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="text-[10px] text-silver">Map</span>
                </a>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-2 rounded-lg bg-white/5">
              <p className="text-[10px] text-muted uppercase tracking-wide mb-2">Timeline</p>
              <div className="space-y-2 text-xs">
                {reactor.constructionStartAt && (
                  <div className="flex justify-between">
                    <span className="text-silver">Construction Start</span>
                    <span className="text-cream">{formatDate(reactor.constructionStartAt)}</span>
                  </div>
                )}
                {reactor.operationalFrom && (
                  <div className="flex justify-between">
                    <span className="text-silver">Operational From</span>
                    <span className="text-cream">{formatDate(reactor.operationalFrom)}</span>
                  </div>
                )}
                {reactor.operationalTo && (
                  <div className="flex justify-between">
                    <span className="text-silver">Shutdown</span>
                    <span className="text-cream">{formatDate(reactor.operationalTo)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* IAEA ID with link to PRIS database */}
            {reactor.iaeaId && (
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-[10px] text-muted uppercase tracking-wide mb-1">IAEA ID</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-cream">{reactor.iaeaId}</p>
                  <a
                    href={`https://pris.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx?current=${reactor.iaeaId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    title="View on IAEA PRIS"
                  >
                    <svg className="w-3 h-3 text-silver" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-[10px] text-silver">IAEA</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-muted">GeoNuclearData</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[10px] text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-[10px] text-silver">Share</span>
                </>
              )}
            </button>
          </div>
        </>
      );
  }
}
