"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Custom 404 Not Found page
 * Displays a nuclear-themed error page with animation
 * @returns The 404 page component
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-emerald-500/20 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center"
      >
        {/* Atom icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            className="opacity-60"
          >
            <defs>
              <linearGradient id="atom404" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#22ff66" }} />
                <stop offset="100%" style={{ stopColor: "#00aa44" }} />
              </linearGradient>
            </defs>
            {/* Electron orbits */}
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#atom404)" strokeWidth="1.5" opacity="0.6" />
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#atom404)" strokeWidth="1.5" opacity="0.6" transform="rotate(60 50 50)" />
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#atom404)" strokeWidth="1.5" opacity="0.6" transform="rotate(120 50 50)" />
            {/* Nucleus */}
            <circle cx="50" cy="50" r="8" fill="url(#atom404)" opacity="0.8" />
          </svg>
        </motion.div>

        {/* 404 text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-8xl md:text-9xl font-display font-bold text-cream/20 mb-4"
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-2xl md:text-3xl font-display text-cream mb-4"
        >
          Reactor Offline
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-silver/70 mb-8 max-w-md mx-auto"
        >
          This reactor has been decommissioned. The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </motion.p>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-cream transition-all duration-200 hover:scale-105"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Globe
          </Link>
        </motion.div>
      </motion.div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
    </main>
  );
}
