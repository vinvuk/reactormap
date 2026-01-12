/**
 * Status color configuration
 */
export const STATUS_COLORS: Record<string, string> = {
  operational: "#22ff66",
  under_construction: "#ffee00",
  planned: "#00e5ff",
  suspended: "#ff9900",
  shutdown: "#aaaaaa",
  cancelled: "#ff4444",
};

/**
 * Status label configuration
 */
export const STATUS_LABELS: Record<string, string> = {
  operational: "Operational",
  under_construction: "Under Construction",
  planned: "Planned",
  suspended: "Suspended",
  shutdown: "Shutdown",
  cancelled: "Cancelled",
};

/**
 * Props for StatusBadge component
 */
interface StatusBadgeProps {
  status: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Status indicator badge component
 * Displays a colored dot with optional label for reactor status
 *
 * @param status - Status key (operational, under_construction, etc.)
 * @param showLabel - Whether to show the text label
 * @param size - Badge size variant
 * @param className - Additional CSS classes
 */
export function StatusBadge({
  status,
  showLabel = true,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/ /g, "_");
  const color = STATUS_COLORS[normalizedStatus] || STATUS_COLORS.shutdown;
  const label = STATUS_LABELS[normalizedStatus] || status;

  const dotSizeClass = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }[size];

  const textSizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`${dotSizeClass} rounded-full flex-shrink-0`}
        style={{ backgroundColor: color }}
      />
      {showLabel && (
        <span className={textSizeClass} style={{ color }}>
          {label}
        </span>
      )}
    </span>
  );
}

export default StatusBadge;
