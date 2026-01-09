"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TabId = "about" | "privacy" | "terms" | "credits";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "about", label: "About" },
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "credits", label: "Credits" },
];

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabId;
}

/**
 * Info modal with tabs for About, Privacy Policy, Terms of Use, and Credits
 * Uses glass morphism design consistent with the app
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 * @param initialTab - Optional tab to show when modal opens (defaults to "about")
 */
export function InfoModal({ isOpen, onClose, initialTab = "about" }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Sync activeTab when initialTab changes (e.g., when opening to privacy tab)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] z-[101] flex flex-col pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-modal-title"
          >
            <div className="glass-panel rounded-3xl flex flex-col overflow-hidden h-full md:h-auto pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 id="info-modal-title" className="text-lg font-semibold text-cream">ReactorMap</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close dialog"
                >
                  <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 py-3 border-b border-white/5 pointer-events-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(tab.id);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-white/15 text-cream"
                        : "text-silver/70 hover:text-silver hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 md:max-h-[400px] pointer-events-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === "about" && <AboutContent />}
                    {activeTab === "privacy" && <PrivacyContent />}
                    {activeTab === "terms" && <TermsContent />}
                    {activeTab === "credits" && <CreditsContent />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * About tab content
 */
function AboutContent() {
  return (
    <div className="space-y-4 text-sm text-silver/80 leading-relaxed">
      <p className="text-cream/90 text-base">
        ReactorMap is an interactive 3D visualization of nuclear power plants around the world.
      </p>

      <p>
        Explore over 800 nuclear reactors on an interactive globe, track operational status,
        and learn about nuclear energy infrastructure across every continent.
      </p>

      <div className="pt-2">
        <h3 className="text-cream font-medium mb-2">Features</h3>
        <ul className="space-y-1.5 text-silver/70">
          <li className="flex items-start gap-2">
            <span className="text-[#22ff66] mt-1">•</span>
            <span>Track operational reactors with live status indicators</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#ffee00] mt-1">•</span>
            <span>View reactors under construction and planned facilities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00aaff] mt-1">•</span>
            <span>Filter by status: operational, construction, planned, shutdown</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-silver/50 mt-1">•</span>
            <span>Day/night Earth visualization with cloud layers</span>
          </li>
        </ul>
      </div>

      <div className="pt-2">
        <h3 className="text-cream font-medium mb-2">Data Sources</h3>
        <p className="text-silver/70">
          Reactor data is sourced from GeoNuclearData, an open-source database of nuclear
          power plants compiled from IAEA and World Nuclear Association records.
        </p>
      </div>

      <div className="pt-2">
        <h3 className="text-cream font-medium mb-2">Explore</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/countries" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            Browse Countries
          </a>
          <a href="/types" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            Reactor Types
          </a>
          <a href="/statuses" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            By Status
          </a>
          <a href="/regions" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            By Region
          </a>
          <a href="/operators" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            Operators
          </a>
          <a href="/statistics" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            Statistics
          </a>
          <a href="/faq" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            FAQ
          </a>
          <a href="/about" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-silver hover:text-cream transition-colors">
            About
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Privacy Policy tab content
 */
function PrivacyContent() {
  return (
    <div className="space-y-4 text-sm text-silver/80 leading-relaxed">
      <p className="text-silver/60 text-xs">Last updated: January 2026</p>

      <div>
        <h3 className="text-cream font-medium mb-2">Analytics</h3>
        <p>
          We use PostHog to collect anonymous usage analytics. This helps us understand
          how the application is used and improve the user experience. Analytics data includes:
        </p>
        <ul className="mt-2 space-y-1 text-silver/70 ml-4">
          <li>• Pages visited and features used</li>
          <li>• Device type and browser information</li>
          <li>• Approximate geographic location (country level)</li>
          <li>• Session duration and interaction patterns</li>
        </ul>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Cookies</h3>
        <p>
          We use essential cookies to maintain your session and preferences. Analytics
          cookies are used by PostHog to track anonymous usage data.
        </p>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Data We Don&apos;t Collect</h3>
        <ul className="space-y-1 text-silver/70 ml-4">
          <li>• Personal identification information</li>
          <li>• Email addresses or contact details</li>
          <li>• Location data beyond country level</li>
          <li>• Any data you don&apos;t explicitly provide</li>
        </ul>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Third-Party Services</h3>
        <p>
          This application uses external services that have their own privacy policies:
        </p>
        <ul className="mt-2 space-y-1 text-silver/70 ml-4">
          <li>
            • <span className="text-cream/80">PostHog</span> - Analytics (
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#22ff66] hover:underline">
              Privacy Policy
            </a>
            )
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Contact</h3>
        <p className="text-silver/70">
          For privacy-related questions, please open an issue on our GitHub repository.
        </p>
      </div>
    </div>
  );
}

/**
 * Terms of Use tab content
 */
function TermsContent() {
  return (
    <div className="space-y-4 text-sm text-silver/80 leading-relaxed">
      <p className="text-silver/60 text-xs">Last updated: January 2026</p>

      <div>
        <h3 className="text-cream font-medium mb-2">Acceptance of Terms</h3>
        <p>
          By accessing and using ReactorMap, you accept and agree to be bound by these
          Terms of Use. If you do not agree, please do not use this application.
        </p>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Use of Service</h3>
        <p>
          ReactorMap is provided for informational and educational purposes only. You may
          use this service for personal, non-commercial purposes.
        </p>
      </div>

      <div className="bg-[#22ff66]/10 border border-[#22ff66]/20 rounded-xl p-4">
        <h3 className="text-[#22ff66] font-medium mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Notice
        </h3>
        <p className="text-silver/80">
          <strong className="text-cream">This application is for informational purposes only.</strong> Reactor
          status information may be delayed or incomplete. Always refer to
          official sources such as IAEA, national nuclear regulatory authorities, or
          utility operators for authoritative information.
        </p>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Data Accuracy</h3>
        <p>
          While we strive to provide accurate information sourced from GeoNuclearData
          and IAEA records, we make no guarantees about the accuracy, completeness,
          or timeliness of the data displayed.
        </p>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Limitation of Liability</h3>
        <p>
          ReactorMap and its creators shall not be held liable for any damages arising from
          the use or inability to use this service, including but not limited to decisions
          made based on information displayed in this application.
        </p>
      </div>

      <div>
        <h3 className="text-cream font-medium mb-2">Changes to Terms</h3>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the
          application after changes constitutes acceptance of the new terms.
        </p>
      </div>
    </div>
  );
}

/**
 * Credits and attributions tab content
 */
function CreditsContent() {
  return (
    <div className="space-y-4 text-sm text-silver/80 leading-relaxed">
      <p className="text-cream/90">
        ReactorMap is made possible by the following data sources and open resources:
      </p>

      <div className="space-y-4">
        {/* GeoNuclearData */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-cream font-medium mb-1">GeoNuclearData</h3>
          <p className="text-silver/60 text-xs mb-2">Nuclear Reactor Database</p>
          <p className="text-silver/70">
            Nuclear reactor data including locations, capacity, reactor types, and operational
            status is sourced from GeoNuclearData, compiled from IAEA PRIS and World Nuclear
            Association records.
          </p>
          <a
            href="https://github.com/cristianst85/GeoNuclearData"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[#22ff66] hover:underline text-xs"
          >
            github.com/cristianst85/GeoNuclearData
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Solar System Scope */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-cream font-medium mb-1">Solar System Scope</h3>
          <p className="text-silver/60 text-xs mb-2">Earth Textures • CC BY 4.0</p>
          <p className="text-silver/70">
            High-resolution Earth day, night, and cloud textures used for the 3D globe
            visualization.
          </p>
          <a
            href="https://www.solarsystemscope.com/textures/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[#22ff66] hover:underline text-xs"
          >
            solarsystemscope.com/textures
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Open Source */}
        <div className="bg-white/5 rounded-xl p-4">
          <h3 className="text-cream font-medium mb-1">Open Source Technologies</h3>
          <p className="text-silver/60 text-xs mb-2">Libraries & Frameworks</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Next.js", "React", "Three.js", "React Three Fiber", "Framer Motion", "Tailwind CSS"].map((tech) => (
              <span key={tech} className="px-2 py-1 bg-white/5 rounded-lg text-xs text-silver/70">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* License notice */}
      <div className="pt-2 border-t border-white/5">
        <h3 className="text-cream font-medium mb-2">License</h3>
        <p className="text-silver/70">
          Earth textures are used under the Creative Commons Attribution 4.0 International
          License (CC BY 4.0). Proper attribution is provided above.
        </p>
      </div>
    </div>
  );
}

/**
 * Info button component to trigger the modal
 */
interface InfoButtonProps {
  onClick: () => void;
}

export function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="glass-panel w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      title="About ReactorMap"
      aria-label="About ReactorMap - Open information panel"
    >
      <svg className="w-5 h-5 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}
