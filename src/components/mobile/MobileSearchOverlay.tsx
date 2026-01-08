"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reactor, STATUS_CONFIG } from "@/lib/types";
import { CountryFlag } from "@/components/CountryFlag";

interface MobileSearchOverlayProps {
  reactors: Reactor[];
  onSelectReactor: (reactor: Reactor) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen search overlay for mobile
 * Clean, focused search experience
 */
export function MobileSearchOverlay({
  reactors,
  onSelectReactor,
  isOpen,
  onClose,
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Reactor[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Focus input when overlay opens
   */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  /**
   * Search reactors by name or country
   */
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      const lowerQuery = searchQuery.toLowerCase();
      const filtered = reactors
        .filter(
          (r) =>
            r.name.toLowerCase().includes(lowerQuery) ||
            r.country.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 20);

      setResults(filtered);
    },
    [reactors]
  );

  /**
   * Handle reactor selection
   */
  const handleSelect = (reactor: Reactor) => {
    onSelectReactor(reactor);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-obsidian/98 backdrop-blur-xl flex flex-col"
        >
          {/* Header with search input */}
          <div className="pt-safe px-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search reactors or countries..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-cream placeholder-silver/50 text-base outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {query && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20"
                  >
                    <svg className="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {results.length > 0 ? (
              <div className="p-2">
                {results.map((reactor) => {
                  const status = STATUS_CONFIG[reactor.status];
                  return (
                    <button
                      key={reactor.id}
                      onClick={() => handleSelect(reactor)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-white/10 transition-colors text-left"
                    >
                      <CountryFlag
                        countryCode={reactor.countryCode}
                        className="w-8 h-6 rounded-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-base text-cream truncate">{reactor.name}</p>
                        <p className="text-xs text-silver truncate">{reactor.country}</p>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase flex-shrink-0"
                        style={{
                          backgroundColor: `${status.color}20`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : query.length >= 2 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <svg className="w-16 h-16 text-silver/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-silver">No reactors found for "{query}"</p>
                <p className="text-muted text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <svg className="w-16 h-16 text-silver/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-silver">Search for nuclear reactors</p>
                <p className="text-muted text-sm mt-1">Enter a reactor name or country</p>
              </div>
            )}
          </div>

          {/* Bottom safe area */}
          <div className="pb-safe" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Floating search button for mobile
 * Positioned top-right, opens search overlay
 */
export function MobileSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.2 }}
      onClick={onClick}
      className="fixed top-4 right-4 z-30 w-12 h-12 flex items-center justify-center rounded-full glass-panel shadow-lg active:scale-95 transition-transform pt-safe"
      aria-label="Search reactors"
    >
      <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </motion.button>
  );
}
