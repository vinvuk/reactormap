"use client";

import { useState, useEffect, useCallback } from "react";
import { Reactor, ReactorApiResponse } from "@/lib/types";

/**
 * Hook for fetching and managing nuclear reactor data
 * Handles loading state, errors, and data refresh
 * @returns Reactor data and loading state
 */
export function useReactors() {
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [dataSourceDate, setDataSourceDate] = useState<string | null>(null);

  /**
   * Fetch reactor data from API
   */
  const fetchReactors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/reactors");

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data: ReactorApiResponse = await response.json();

      setReactors(data.reactors);
      setLastUpdated(data.lastUpdated);
      setDataSourceDate(data.dataSourceDate);
    } catch (err) {
      console.error("Error fetching reactors:", err);
      setError(err instanceof Error ? err.message : "Failed to load reactor data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReactors();
  }, [fetchReactors]);

  /**
   * Refresh reactor data
   */
  const refresh = useCallback(() => {
    fetchReactors();
  }, [fetchReactors]);

  return {
    reactors,
    isLoading,
    error,
    lastUpdated,
    dataSourceDate,
    refresh,
  };
}
