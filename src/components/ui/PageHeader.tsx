import Link from "next/link";

/**
 * Props for PageHeader component
 */
interface PageHeaderProps {
  backHref?: string;
  backLabel?: string;
  showMapLink?: boolean;
  mapLinkLabel?: string;
  maxWidth?: "sm" | "md" | "lg";
}

/**
 * Standard page header with back navigation and optional map link
 * Used at the top of all content pages
 *
 * @param backHref - URL for back navigation (default: "/")
 * @param backLabel - Label for back link (default: "ReactorMap")
 * @param showMapLink - Whether to show "View on Map" button
 * @param mapLinkLabel - Label for map link button
 * @param maxWidth - Container max width
 */
export function PageHeader({
  backHref = "/",
  backLabel = "ReactorMap",
  showMapLink = true,
  mapLinkLabel = "View on Map",
  maxWidth = "md",
}: PageHeaderProps) {
  const maxWidthClass = {
    sm: "max-w-4xl",
    md: "max-w-6xl",
    lg: "max-w-7xl",
  }[maxWidth];

  return (
    <header className="border-b border-white/10 bg-charcoal/50 backdrop-blur-xl">
      <div
        className={`${maxWidthClass} mx-auto px-4 py-4 flex items-center justify-between`}
      >
        <Link
          href={backHref}
          className="flex items-center gap-2 text-silver hover:text-cream transition-colors"
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
          <span className="font-medium">{backLabel}</span>
        </Link>

        {showMapLink && (
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-lava/20 hover:bg-lava/30 text-lava-light rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            {mapLinkLabel}
          </Link>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
