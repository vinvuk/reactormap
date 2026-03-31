"use client";

import { ReactNode } from "react";

/**
 * Stat item configuration for Hero component
 */
export interface HeroStat {
  value: string | number;
  label: string;
  highlight?: boolean;
}

/**
 * Props for Hero component
 */
interface HeroProps {
  title: string;
  subtitle?: string | ReactNode;
  stats?: HeroStat[];
  glowColor?: "green" | "lava";
  maxWidth?: "sm" | "md" | "lg";
  children?: ReactNode;
}

/**
 * Hero section component with glow effect and optional stats
 * Used at the top of index pages for visual impact
 *
 * @param title - Main heading text
 * @param subtitle - Optional subtitle or description
 * @param stats - Optional array of stat objects to display
 * @param glowColor - Color of background glow effect (green or lava)
 * @param maxWidth - Container max width (sm=4xl, md=6xl, lg=7xl)
 * @param children - Optional additional content
 */
export function Hero({
  title,
  subtitle,
  stats,
  glowColor = "green",
  maxWidth = "md",
  children,
}: HeroProps) {
  const glowColorClass = glowColor === "green" ? "bg-[#22ff66]/10" : "bg-lava/10";

  const maxWidthClass = {
    sm: "max-w-4xl",
    md: "max-w-6xl",
    lg: "max-w-7xl",
  }[maxWidth];

  return (
    <div className="relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] ${glowColorClass} rounded-full blur-[100px]`}
        />
      </div>

      <div className={`${maxWidthClass} mx-auto px-4 py-12 relative`}>
        {/* Title and Subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-silver max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-6">
                {index > 0 && <div className="w-px h-8 bg-white/20" />}
                <div>
                  <div
                    className={`text-2xl font-mono font-bold ${
                      stat.highlight ? "text-[#22ff66]" : "text-cream"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-silver">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Content */}
        {children}
      </div>
    </div>
  );
}

export default Hero;
