"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reactor, STATUS_CONFIG, ReactorStatus } from "@/lib/types";
import { CountryFlag } from "@/components/CountryFlag";

interface StatsPanelProps {
  reactors: Reactor[];
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "summary" | "countries" | "timeline";

/**
 * Statistics dashboard panel with summary, country chart, and timeline
 */
export function StatsPanel({ reactors, isOpen, onClose }: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  /**
   * Calculate comprehensive statistics from reactor data
   */
  const stats = useMemo(() => {
    const operational = reactors.filter((r) => r.status === "operational");
    const underConstruction = reactors.filter((r) => r.status === "under_construction");
    const planned = reactors.filter((r) => r.status === "planned");
    const shutdown = reactors.filter((r) => r.status === "shutdown");

    // Total capacity calculations
    const totalCapacity = operational.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const constructionCapacity = underConstruction.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const plannedCapacity = planned.reduce((sum, r) => sum + (r.capacity || 0), 0);

    // Country breakdown
    const countryStats = new Map<string, { count: number; capacity: number; countryCode: string }>();
    operational.forEach((r) => {
      const existing = countryStats.get(r.country) || { count: 0, capacity: 0, countryCode: r.countryCode };
      countryStats.set(r.country, {
        count: existing.count + 1,
        capacity: existing.capacity + (r.capacity || 0),
        countryCode: r.countryCode,
      });
    });

    const topCountries = Array.from(countryStats.entries())
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, 15);

    // Reactor type breakdown
    const typeStats = new Map<string, number>();
    operational.forEach((r) => {
      const type = r.reactorType || "Unknown";
      typeStats.set(type, (typeStats.get(type) || 0) + 1);
    });

    const reactorTypes = Array.from(typeStats.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Timeline data - reactors by decade
    const timelineData: { decade: string; started: number; shutdown: number; net: number }[] = [];
    const decades = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

    decades.forEach((decade) => {
      const startYear = parseInt(decade);
      const endYear = startYear + 10;

      const started = reactors.filter((r) => {
        if (!r.operationalFrom) return false;
        const year = new Date(r.operationalFrom).getFullYear();
        return year >= startYear && year < endYear;
      }).length;

      const shutdownCount = reactors.filter((r) => {
        if (!r.operationalTo) return false;
        const year = new Date(r.operationalTo).getFullYear();
        return year >= startYear && year < endYear;
      }).length;

      timelineData.push({
        decade,
        started,
        shutdown: shutdownCount,
        net: started - shutdownCount,
      });
    });

    // Average age of operational reactors
    const ages = operational
      .filter((r) => r.operationalFrom)
      .map((r) => {
        const startYear = new Date(r.operationalFrom!).getFullYear();
        return new Date().getFullYear() - startYear;
      });
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    // Status breakdown
    const statusBreakdown = Object.keys(STATUS_CONFIG).map((status) => ({
      status: status as ReactorStatus,
      count: reactors.filter((r) => r.status === status).length,
      ...STATUS_CONFIG[status as ReactorStatus],
    }));

    return {
      totalReactors: reactors.length,
      operational: operational.length,
      underConstruction: underConstruction.length,
      planned: planned.length,
      shutdown: shutdown.length,
      totalCapacity,
      constructionCapacity,
      plannedCapacity,
      topCountries,
      reactorTypes,
      timelineData,
      avgAge,
      statusBreakdown,
      maxCountryCapacity: topCountries[0]?.capacity || 0,
    };
  }, [reactors]);

  const tabs: { id: TabType; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "countries", label: "Countries" },
    { id: "timeline", label: "Timeline" },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 z-[60] glass-panel rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-semibold text-cream">
                  Nuclear Power Statistics
                </h2>
                <p className="text-xs md:text-sm text-silver mt-1">
                  Global nuclear reactor data overview
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 md:px-6 md:pt-4 border-b border-white/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-white/10 text-cream"
                      : "text-silver hover:text-cream hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {activeTab === "summary" && <SummaryTab stats={stats} />}
              {activeTab === "countries" && <CountriesTab stats={stats} />}
              {activeTab === "timeline" && <TimelineTab stats={stats} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Summary tab with key statistics - redesigned layout
 */
function SummaryTab({ stats }: { stats: ReturnType<typeof Object> }) {
  const maxTypeCount = Math.max(...stats.reactorTypes.map((t: { count: number }) => t.count));

  return (
    <div className="space-y-6">
      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Hero stats */}
        <div className="space-y-4">
          {/* Main hero stat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">Operational Now</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-6xl font-bold text-cream font-mono tabular-nums">
                {stats.operational}
              </span>
              <span className="text-lg text-silver">reactors</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-emerald-400 font-mono">{(stats.totalCapacity / 1000).toFixed(0)} GW</span>
              <span className="text-muted">total capacity</span>
            </div>
          </motion.div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-[10px] text-yellow-400 uppercase">Building</span>
              </div>
              <p className="text-2xl font-bold text-cream font-mono">{stats.underConstruction}</p>
              <p className="text-[10px] text-muted mt-0.5">{(stats.constructionCapacity / 1000).toFixed(0)} GW</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[10px] text-blue-400 uppercase">Planned</span>
              </div>
              <p className="text-2xl font-bold text-cream font-mono">{stats.planned}</p>
              <p className="text-[10px] text-muted mt-0.5">{(stats.plannedCapacity / 1000).toFixed(0)} GW</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-[10px] text-gray-400 uppercase">Shutdown</span>
              </div>
              <p className="text-2xl font-bold text-cream font-mono">{stats.shutdown}</p>
              <p className="text-[10px] text-muted mt-0.5">decommissioned</p>
            </motion.div>
          </div>

          {/* Quick facts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-4 rounded-xl bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-cream font-mono">{stats.avgAge}</p>
                <p className="text-[10px] text-muted">avg. reactor age (years)</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-cream font-mono">{stats.topCountries.length}</p>
                <p className="text-[10px] text-muted">countries with nuclear</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column - Breakdowns */}
        <div className="space-y-4">
          {/* Reactor types with visual bars */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="p-4 rounded-xl bg-white/5"
          >
            <h3 className="text-xs font-medium text-cream mb-3 uppercase tracking-wider">Reactor Types</h3>
            <div className="space-y-2">
              {stats.reactorTypes.map((type: { type: string; count: number }, index: number) => (
                <motion.div
                  key={type.type}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-silver w-12 flex-shrink-0 font-mono">{type.type}</span>
                  <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(type.count / maxTypeCount) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
                      className="h-full rounded bg-gradient-to-r from-emerald-500/40 to-emerald-500/60 flex items-center justify-end px-2"
                    >
                      <span className="text-[10px] font-bold text-cream font-mono">{type.count}</span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status breakdown - compact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="p-4 rounded-xl bg-white/5"
          >
            <h3 className="text-xs font-medium text-cream mb-3 uppercase tracking-wider">All Statuses</h3>
            <div className="space-y-2">
              {stats.statusBreakdown.map((status: { status: string; count: number; label: string; color: string }, index: number) => (
                <motion.div
                  key={status.status}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.55 + index * 0.03 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-xs text-silver flex-1">{status.label}</span>
                  <span className="text-xs font-medium text-cream font-mono w-8 text-right">{status.count}</span>
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(status.count / stats.totalReactors) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.03 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-muted">Total reactors tracked</span>
              <span className="text-sm font-bold text-cream font-mono">{stats.totalReactors}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Countries tab with bar chart
 */
function CountriesTab({ stats }: { stats: ReturnType<typeof Object> }) {
  const [sortBy, setSortBy] = useState<"capacity" | "count">("capacity");

  const sortedCountries = useMemo(() => {
    return [...stats.topCountries].sort((a, b) =>
      sortBy === "capacity" ? b.capacity - a.capacity : b.count - a.count
    );
  }, [stats.topCountries, sortBy]);

  const maxValue = sortBy === "capacity" ? stats.maxCountryCapacity : sortedCountries[0]?.count || 0;

  return (
    <div className="space-y-4">
      {/* Header with sort toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-silver">Top 15 nuclear power nations</p>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setSortBy("capacity")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortBy === "capacity"
                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                : "text-silver hover:text-cream"
            }`}
          >
            By Capacity
          </button>
          <button
            onClick={() => setSortBy("count")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sortBy === "count"
                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                : "text-silver hover:text-cream"
            }`}
          >
            By Count
          </button>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-1.5">
        {sortedCountries.map((country: { country: string; count: number; capacity: number; countryCode: string }, index: number) => {
          const value = sortBy === "capacity" ? country.capacity : country.count;
          const percentage = (value / maxValue) * 100;

          return (
            <motion.div
              key={country.country}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="group p-2 rounded-lg transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-muted bg-white/5">
                  {index + 1}
                </div>

                {/* Flag */}
                <CountryFlag
                  countryCode={country.countryCode}
                  className="w-6 h-4 rounded-sm shadow-sm flex-shrink-0"
                />

                {/* Country name */}
                <span className="text-sm text-cream flex-1 truncate font-medium">
                  {country.country}
                </span>

                {/* Stats */}
                <div className="text-right">
                  <span className="text-sm font-semibold text-cream font-mono">
                    {sortBy === "capacity"
                      ? `${(country.capacity / 1000).toFixed(1)}`
                      : country.count}
                  </span>
                  <span className="text-xs text-muted ml-1">
                    {sortBy === "capacity" ? "GW" : "reactors"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 ml-9 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: index * 0.03 + 0.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(34, 255, 102, 0.3) 0%, rgba(34, 255, 102, 0.7) 100%)",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary card */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-cream font-medium">
              {((sortedCountries.reduce((sum: number, c: { capacity: number }) => sum + c.capacity, 0) / stats.totalCapacity) * 100).toFixed(0)}% of global capacity
            </p>
            <p className="text-xs text-silver">Combined from top 15 nations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline tab showing nuclear power history
 */
function TimelineTab({ stats }: { stats: ReturnType<typeof Object> }) {
  const maxStarted = Math.max(...stats.timelineData.map((d: { started: number }) => d.started));

  // Historical events to mark on timeline
  const historicalEvents = [
    { decade: "1970s", year: 1979, event: "Three Mile Island", type: "accident" },
    { decade: "1980s", year: 1986, event: "Chernobyl", type: "accident" },
    { decade: "2010s", year: 2011, event: "Fukushima", type: "accident" },
  ];

  const getEventForDecade = (decade: string) =>
    historicalEvents.find((e) => e.decade === decade);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-silver">
          Nuclear power expansion and contraction by decade
        </p>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-silver">Started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-silver">Shutdown</span>
          </div>
        </div>
      </div>

      {/* Timeline chart */}
      <div className="space-y-3">
        {stats.timelineData.map((decade: { decade: string; started: number; shutdown: number; net: number }, index: number) => {
          const event = getEventForDecade(decade.decade);
          const isPeakDecade = decade.started === maxStarted;

          return (
            <motion.div
              key={decade.decade}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-3 rounded-xl transition-colors ${
                isPeakDecade ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${isPeakDecade ? "text-emerald-400" : "text-cream"}`}>
                    {decade.decade}
                  </span>
                  {isPeakDecade && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                      PEAK ERA
                    </span>
                  )}
                  {event && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {event.event} ({event.year})
                    </span>
                  )}
                </div>
                <div className={`text-sm font-bold ${decade.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {decade.net >= 0 ? "+" : ""}{decade.net} net
                </div>
              </div>

              {/* Dual bar chart */}
              <div className="flex items-center gap-2 h-7">
                {/* Started bar */}
                <div className="flex-1 h-full bg-white/5 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(decade.started / maxStarted) * 100}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                    className="h-full rounded-lg flex items-center px-2"
                    style={{
                      background: isPeakDecade
                        ? "linear-gradient(90deg, rgba(34, 255, 102, 0.3) 0%, rgba(34, 255, 102, 0.6) 100%)"
                        : "linear-gradient(90deg, rgba(34, 255, 102, 0.15) 0%, rgba(34, 255, 102, 0.4) 100%)",
                    }}
                  >
                    <span className="text-[10px] font-medium text-emerald-300">+{decade.started}</span>
                  </motion.div>
                </div>

                {/* Center divider */}
                <div className="w-px h-5 bg-white/20" />

                {/* Shutdown bar */}
                <div className="flex-1 h-full bg-white/5 rounded-lg overflow-hidden flex justify-end relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(decade.shutdown / maxStarted) * 100}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                    className="h-full rounded-lg flex items-center justify-end px-2"
                    style={{
                      background: "linear-gradient(270deg, rgba(255, 68, 68, 0.15) 0%, rgba(255, 68, 68, 0.4) 100%)",
                    }}
                  >
                    {decade.shutdown > 0 && (
                      <span className="text-[10px] font-medium text-red-300">-{decade.shutdown}</span>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Key events timeline */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
        <h4 className="text-sm font-medium text-cream mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Key Events in Nuclear History
        </h4>
        <div className="space-y-2">
          {historicalEvents.map((event) => (
            <div key={event.year} className="flex items-center gap-3 text-xs">
              <span className="font-mono text-amber-400 w-10">{event.year}</span>
              <span className="text-cream">{event.event}</span>
              <span className="text-muted">— Shaped global nuclear policy</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="p-4 rounded-xl bg-white/5 space-y-2">
        <h4 className="text-sm font-medium text-cream">Key Insights</h4>
        <ul className="text-xs text-silver space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">•</span>
            Peak construction occurred in the 1970s-1980s during the first nuclear era
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            Major accidents led to stricter regulations and public opposition
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">•</span>
            New construction is accelerating in Asia, led by China and India
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Animated counter hook for smooth number animations
 */
function useAnimatedCounter(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

/**
 * Stat card component with animated counter
 */
function StatCard({
  label,
  value,
  subValue,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  subValue: string;
  color: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(value, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: delay * 0.1 + 0.2 }}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl md:text-3xl font-semibold text-cream font-mono tabular-nums">
        {animatedValue}
      </p>
      <p className="text-xs text-silver mt-1">{subValue}</p>
    </motion.div>
  );
}
