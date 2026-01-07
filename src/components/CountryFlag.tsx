"use client";

import * as Flags from "country-flag-icons/react/3x2";
import { FunctionComponent, SVGProps } from "react";

interface CountryFlagProps {
  countryCode: string;
  className?: string;
}

type FlagComponent = FunctionComponent<SVGProps<SVGSVGElement> & { title?: string }>;

/**
 * Renders a country flag SVG based on ISO 2-letter country code
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "SE", "JP")
 * @param className - Optional CSS classes for styling
 * @returns Flag SVG component or null if code not found
 */
export function CountryFlag({ countryCode, className = "w-5 h-4" }: CountryFlagProps) {
  // Get the flag component for this country code
  const code = countryCode.toUpperCase();
  const FlagComponent = (Flags as Record<string, FlagComponent>)[code];

  if (!FlagComponent) {
    // Fallback for unknown country codes
    return (
      <span
        className={`inline-flex items-center justify-center bg-white/10 rounded text-[8px] text-muted ${className}`}
        title={countryCode}
      >
        {countryCode}
      </span>
    );
  }

  return <FlagComponent className={className} title={countryCode} />;
}
