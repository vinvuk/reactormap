"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  isLoading: boolean;
}

/**
 * Cinematic loading screen with nuclear theme
 * Displays animated logo and loading progress
 * @param isLoading - Whether data is still loading
 */
export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    if (!isLoading && progress >= 100) {
      const timer = setTimeout(() => setShowContent(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = isLoading && p > 80 ? 0.5 : p > 90 ? 1 : 3;
        return Math.min(p + increment, isLoading ? 95 : 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {showContent && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center"
        >
          <div className="text-center">
            {/* Animated Atom Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative mb-10 w-24 h-24 mx-auto"
            >
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="atomGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#22ff66" />
                    <stop offset="100%" stopColor="#00aa44" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Electron orbits */}
                <motion.ellipse
                  cx="50"
                  cy="50"
                  rx="40"
                  ry="15"
                  fill="none"
                  stroke="url(#atomGradient)"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50px 50px" }}
                />
                <motion.ellipse
                  cx="50"
                  cy="50"
                  rx="40"
                  ry="15"
                  fill="none"
                  stroke="url(#atomGradient)"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  initial={{ rotate: 60 }}
                  animate={{ rotate: 420 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50px 50px" }}
                />
                <motion.ellipse
                  cx="50"
                  cy="50"
                  rx="40"
                  ry="15"
                  fill="none"
                  stroke="url(#atomGradient)"
                  strokeWidth="1.5"
                  filter="url(#glow)"
                  initial={{ rotate: 120 }}
                  animate={{ rotate: 480 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "50px 50px" }}
                />

                {/* Nucleus */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="8"
                  fill="url(#atomGradient)"
                  filter="url(#glow)"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-display text-4xl md:text-5xl font-semibold text-cream mb-2"
            >
              ReactorMap
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-silver text-sm tracking-widest uppercase mb-8"
            >
              Global Nuclear Power Tracker
            </motion.p>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="w-48 mx-auto"
            >
              <div className="h-0.5 bg-graphite rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-xs text-muted mt-3 font-mono tracking-wider">
                {progress < 100 ? "Initializing..." : "Ready"}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
