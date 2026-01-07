"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "volcanic-cookie-consent";

export type ConsentStatus = "granted" | "denied" | null;

/**
 * Get the current cookie consent status from localStorage
 * @returns The consent status or null if not yet decided
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "granted" || stored === "denied") return stored;
  return null;
}

/**
 * Cookie consent banner component
 * Shows a GDPR-compliant consent popup for analytics cookies
 * Stores user preference in localStorage
 */
export function CookieConsent({
  onConsentChange,
}: {
  onConsentChange: (status: ConsentStatus) => void;
}) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const status = getConsentStatus();
    if (status === null) {
      // Small delay to not show immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Handle user consent choice
   * @param granted - Whether the user accepted cookies
   */
  const handleConsent = (granted: boolean) => {
    const status: ConsentStatus = granted ? "granted" : "denied";
    localStorage.setItem(CONSENT_KEY, status);
    setShowBanner(false);
    onConsentChange(status);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 md:max-w-md z-[200] pointer-events-auto"
        >
          <div className="glass-panel rounded-2xl p-5 shadow-2xl border border-white/10">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#ff9900]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-[#ff9900]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-cream font-medium text-sm mb-1">
                  Cookie Preferences
                </h3>
                <p className="text-silver/70 text-xs leading-relaxed">
                  We use analytics cookies to understand how you use Volcanic and
                  improve your experience. No personal data is collected.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleConsent(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-silver/70 hover:text-silver hover:bg-white/5 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => handleConsent(true)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#ff9900] text-obsidian hover:bg-[#ffaa22] transition-colors"
              >
                Accept
              </button>
            </div>

            <p className="text-silver/40 text-[10px] mt-3 text-center">
              <button
                onClick={() => {
                  // Dispatch custom event to open privacy policy modal
                  window.dispatchEvent(new CustomEvent("open-privacy-policy"));
                }}
                className="hover:text-silver/60 underline"
              >
                Learn more in our Privacy Policy
              </button>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
