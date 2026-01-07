"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reactor, STATUS_CONFIG, ReactorStatus } from "@/lib/types";
import { CountryFlag } from "@/components/CountryFlag";

/**
 * Format capacity in GW
 * @param mw - Capacity in MW
 * @returns Formatted string (e.g., "400 GW")
 */
function formatCapacity(mw: number): string {
  const gw = mw / 1000;
  return `${gw.toFixed(gw >= 100 ? 0 : 1)} GW`;
}

/**
 * Format date string to abbreviated month and year
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted string (e.g., "Mar 2024")
 */
function formatDataSourceDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface MinimalHeaderProps {
  reactors: Reactor[];
  visibleStatuses: Set<string>;
  onToggleStatus: (status: string) => void;
  onSearch: () => void;
  selectedCountries: Set<string>;
  onToggleCountry: (country: string | null) => void;
  dataSourceDate: string | null;
}

/**
 * Minimal header with glass effects - logo, search, filters, time
 */
export function MinimalHeader({
  reactors,
  visibleStatuses,
  onToggleStatus,
  onSearch,
  selectedCountries,
  onToggleCountry,
  dataSourceDate,
}: MinimalHeaderProps) {
  const [time, setTime] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countrySearchRef = useRef<HTMLInputElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Close filter dropdown when clicking outside
   */
  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setShowFilters(false);
        setCountrySearch("");
      }
    };

    // Add listener with slight delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  /**
   * Calculate reactor statistics
   */
  const stats = useMemo(() => {
    const operationalCount = reactors.filter(r => r.status === "operational").length;
    const totalCapacity = reactors
      .filter(r => r.status === "operational" && r.capacity)
      .reduce((sum, r) => sum + (r.capacity || 0), 0);

    return {
      operational: operationalCount,
      total: reactors.length,
      capacity: totalCapacity,
    };
  }, [reactors]);

  /**
   * Get unique countries sorted by reactor count
   */
  const countries = useMemo(() => {
    const countryMap = new Map<string, { country: string; countryCode: string; count: number }>();

    for (const reactor of reactors) {
      const existing = countryMap.get(reactor.country);
      if (existing) {
        existing.count++;
      } else {
        countryMap.set(reactor.country, {
          country: reactor.country,
          countryCode: reactor.countryCode,
          count: 1,
        });
      }
    }

    return Array.from(countryMap.values()).sort((a, b) => b.count - a.count);
  }, [reactors]);

  /**
   * Filter countries by search term
   */
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    const search = countrySearch.toLowerCase();
    return countries.filter(c => c.country.toLowerCase().includes(search));
  }, [countries, countrySearch]);

  /**
   * Check if any filters are active (for indicator badge)
   */
  const hasActiveFilters = useMemo(() => {
    const allStatuses: ReactorStatus[] = ["operational", "under_construction", "planned", "suspended", "shutdown", "cancelled"];
    const someStatusHidden = allStatuses.some(s => !visibleStatuses.has(s));
    return someStatusHidden || selectedCountries.size > 0;
  }, [visibleStatuses, selectedCountries]);

  /**
   * Count of active filter modifications
   * Only counts actively selected items (countries selected + 1 if any status is hidden)
   */
  const activeFilterCount = useMemo(() => {
    const allStatuses: ReactorStatus[] = ["operational", "under_construction", "planned", "suspended", "shutdown", "cancelled"];
    const hasHiddenStatus = allStatuses.some(s => !visibleStatuses.has(s));
    // Count: 1 if any status filter is active, plus number of selected countries
    return (hasHiddenStatus ? 1 : 0) + selectedCountries.size;
  }, [visibleStatuses, selectedCountries]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 16));
      // Get short timezone abbreviation
      const tz = new Intl.DateTimeFormat("en", { timeZoneName: "short" })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value || "UTC";
      setTimezone(tz);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusOrder: ReactorStatus[] = ["operational", "under_construction", "planned", "suspended", "shutdown", "cancelled"];

  return (
    <header className="fixed top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-5 z-50 pointer-events-none">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Stats counter */}
        <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
          <div
            className="glass-panel rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-3"
            aria-label={`${stats.operational} operational reactors, ${formatCapacity(stats.capacity)} total capacity`}
          >
            {/* Operational indicator */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="relative flex items-center justify-center" aria-hidden="true">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full" />
                <div className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="font-mono text-xs sm:text-base font-medium text-cream">{stats.operational}</span>
              <span className="text-[10px] sm:text-xs text-muted hidden sm:inline">active</span>
            </div>

            {/* Separator */}
            <div className="w-px h-3 sm:h-4 bg-white/20 hidden sm:block" aria-hidden="true" />

            {/* Capacity */}
            <div className="items-center gap-1 sm:gap-1.5 hidden sm:flex">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-mono text-xs sm:text-sm text-cream">{formatCapacity(stats.capacity)}</span>
            </div>

            {/* Data source date */}
            {dataSourceDate && (
              <>
                <div className="w-px h-3 sm:h-4 bg-white/20 hidden sm:block" aria-hidden="true" />
                <div className="items-center gap-1 hidden sm:flex" title={`Data source: IAEA PRIS as of ${dataSourceDate}`}>
                  <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] text-muted">{formatDataSourceDate(dataSourceDate)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
          {/* Search */}
          <button
            onClick={onSearch}
            className="glass-panel rounded-xl sm:rounded-2xl p-2.5 sm:px-4 sm:py-3 hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
            title="Search (Press /)"
            aria-label="Search reactors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Combined Filter */}
          <div className="relative" ref={filterContainerRef}>
            <button
              onClick={() => {
                setShowFilters(!showFilters);
                if (!showFilters) setCountrySearch("");
              }}
              className={`glass-panel rounded-xl sm:rounded-2xl p-2.5 sm:px-4 sm:py-3 transition-colors touch-manipulation relative ${
                showFilters ? "bg-white/10" : "hover:bg-white/10 active:bg-white/20"
              } ${hasActiveFilters ? "ring-1 ring-emerald-500/50" : ""}`}
              title="Filter reactors"
              aria-label="Filter reactors"
              aria-expanded={showFilters}
              aria-haspopup="dialog"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {/* Active filter badge */}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-medium text-obsidian flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-2 glass-panel rounded-2xl p-3 w-[280px] sm:w-[320px] max-h-[70vh] flex flex-col"
                  role="dialog"
                  aria-label="Filter reactors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-cream">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          // Reset all filters
                          statusOrder.forEach(s => {
                            if (!visibleStatuses.has(s)) onToggleStatus(s);
                          });
                          onToggleCountry(null);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Status Section */}
                  <div className="mb-3">
                    <h4 className="text-xs text-muted uppercase tracking-wider mb-2">Status</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {statusOrder.map((status) => {
                        const config = STATUS_CONFIG[status];
                        const isVisible = visibleStatuses.has(status);
                        return (
                          <button
                            key={status}
                            onClick={() => onToggleStatus(status)}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left ${
                              isVisible ? "hover:bg-white/10" : "opacity-40 hover:opacity-60"
                            }`}
                            role="checkbox"
                            aria-checked={isVisible}
                            aria-label={`${isVisible ? "Hide" : "Show"} ${config.label} reactors`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${status === "operational" ? "animate-pulse" : ""}`}
                              style={{ backgroundColor: config.color }}
                              aria-hidden="true"
                            />
                            <span className="text-xs text-cream truncate">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/10 mb-3" />

                  {/* Country Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h4 className="text-xs text-muted uppercase tracking-wider mb-2">Country</h4>

                    {/* Country search */}
                    <input
                      ref={countrySearchRef}
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500/50 mb-2"
                    />

                    {/* Selected countries chips */}
                    {selectedCountries.size > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.from(selectedCountries).map((country) => {
                          const countryData = countries.find(c => c.country === country);
                          return (
                            <button
                              key={country}
                              onClick={() => onToggleCountry(country)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-left hover:bg-emerald-500/30 transition-colors"
                            >
                              <CountryFlag
                                countryCode={countryData?.countryCode || ""}
                                className="w-3.5 h-2.5 rounded-sm flex-shrink-0"
                              />
                              <span className="text-[11px] truncate max-w-[80px]">{country}</span>
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          );
                        })}
                        {selectedCountries.size > 1 && (
                          <button
                            onClick={() => onToggleCountry(null)}
                            className="px-2 py-1 rounded-full bg-white/10 text-silver text-[11px] hover:bg-white/20 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    )}

                    {/* Country list */}
                    <div className="overflow-y-auto flex-1 -mx-1 px-1">
                      {filteredCountries.slice(0, 50).map((c) => {
                        const isSelected = selectedCountries.has(c.country);
                        return (
                          <button
                            key={c.country}
                            onClick={() => onToggleCountry(c.country)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left ${
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "hover:bg-white/10 text-cream"
                            }`}
                            role="checkbox"
                            aria-checked={isSelected}
                          >
                            {/* Checkbox indicator */}
                            <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-white/30 hover:border-white/50"
                            }`}>
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-obsidian" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <CountryFlag countryCode={c.countryCode} className="w-4 h-3 rounded-sm flex-shrink-0" />
                            <span className="text-xs flex-1 truncate">{c.country}</span>
                            <span className="text-[10px] text-muted">{c.count}</span>
                          </button>
                        );
                      })}
                      {filteredCountries.length === 0 && (
                        <p className="text-xs text-muted text-center py-3">No countries found</p>
                      )}
                      {filteredCountries.length > 50 && !countrySearch && (
                        <p className="text-[10px] text-muted text-center py-2">Search to see more countries</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time with timezone - compact on mobile */}
          <div
            className="glass-panel rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-1 sm:gap-2"
            aria-label={`Current time: ${time} ${timezone}`}
            role="status"
          >
            <div className="relative flex items-center justify-center" aria-hidden="true">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full" />
              <div className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="font-mono text-[11px] sm:text-sm text-cream">{time}</span>
            <span className="text-[10px] sm:text-xs text-muted hidden sm:inline">{timezone}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
