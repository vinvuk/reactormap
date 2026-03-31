import { ReactNode } from "react";

/**
 * Props for GlassPanel component
 */
interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section";
}

/**
 * Frosted glass effect container component
 * Provides consistent card styling across the application
 *
 * @param children - Content to render inside the panel
 * @param className - Additional CSS classes to apply
 * @param hover - Whether to add hover state (bg-white/5)
 * @param as - HTML element to render as
 */
export function GlassPanel({
  children,
  className = "",
  hover = false,
  as: Component = "div",
}: GlassPanelProps) {
  const hoverClass = hover ? "hover:bg-white/5 transition-colors" : "";

  return (
    <Component className={`glass-panel rounded-xl ${hoverClass} ${className}`}>
      {children}
    </Component>
  );
}

export default GlassPanel;
