/**
 * Props for StatDisplay component
 */
interface StatDisplayProps {
  value: string | number;
  label: string;
  highlight?: boolean;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Stat display component for showing metrics
 * Consistent styling for numerical data with labels
 *
 * @param value - The stat value to display
 * @param label - Descriptive label below the value
 * @param highlight - Use reactor green color for emphasis
 * @param color - Custom color (overrides highlight)
 * @param size - Size variant for the value text
 * @param className - Additional CSS classes
 */
export function StatDisplay({
  value,
  label,
  highlight = false,
  color,
  size = "md",
  className = "",
}: StatDisplayProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[size];

  const valueColor = color
    ? color
    : highlight
    ? "#22ff66"
    : undefined;

  return (
    <div className={`text-center ${className}`}>
      <div
        className={`${sizeClasses} font-mono font-bold ${
          !valueColor ? "text-cream" : ""
        }`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div className="text-sm text-silver">{label}</div>
    </div>
  );
}

export default StatDisplay;
