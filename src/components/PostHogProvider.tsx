"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { CookieConsent, getConsentStatus, ConsentStatus } from "./CookieConsent";

/**
 * PostHog analytics provider component with GDPR-compliant cookie consent
 * Only initializes PostHog after user grants consent
 * Uses refs to avoid re-renders that would reset the 3D scene
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initializedRef = useRef(false);

  // Check for existing consent on mount
  useEffect(() => {
    if (initializedRef.current) return;

    const status = getConsentStatus();
    if (status === "granted") {
      initializePostHog();
    }
  }, []);

  /**
   * Initialize PostHog with the configured settings
   */
  const initializePostHog = () => {
    if (initializedRef.current) return;
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage+cookie",
      respect_dnt: true,
      loaded: () => {
        // Capture the initial pageview after initialization
        posthog.capture("$pageview");
      },
    });

    initializedRef.current = true;
  };

  /**
   * Handle consent status change from the banner
   * @param status - The new consent status
   */
  const handleConsentChange = (status: ConsentStatus) => {
    if (status === "granted") {
      initializePostHog();
    }
    // If denied, PostHog was never initialized so nothing to do
  };

  // If no API key configured, just render children without consent banner
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  // Always render children directly - no wrapper changes
  return (
    <>
      {children}
      <CookieConsent onConsentChange={handleConsentChange} />
    </>
  );
}
