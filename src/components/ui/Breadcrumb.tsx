import Link from "next/link";

/**
 * Breadcrumb item configuration
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Props for Breadcrumb component
 */
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  maxWidth?: "sm" | "md" | "lg";
}

/**
 * Breadcrumb navigation component
 * Shows hierarchical page location with links
 *
 * @param items - Array of breadcrumb items (last item is current page)
 * @param maxWidth - Container max width
 */
export function Breadcrumb({ items, maxWidth = "md" }: BreadcrumbProps) {
  const maxWidthClass = {
    sm: "max-w-4xl",
    md: "max-w-6xl",
    lg: "max-w-7xl",
  }[maxWidth];

  return (
    <nav className={`${maxWidthClass} mx-auto px-4 py-3 text-sm text-silver`}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {isLast || !item.href ? (
                <span className={isLast ? "text-cream" : ""}>{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-cream transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
