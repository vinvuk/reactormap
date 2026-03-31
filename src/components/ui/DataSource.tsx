/**
 * Props for DataSource component
 */
interface DataSourceProps {
  source?: string;
  additionalSources?: string[];
  className?: string;
}

/**
 * Data source footer component
 * Shows attribution for data sources at the bottom of pages
 *
 * @param source - Primary data source (default: "IAEA PRIS database")
 * @param additionalSources - Additional data sources to mention
 * @param className - Additional CSS classes
 */
export function DataSource({
  source = "IAEA PRIS database",
  additionalSources = [],
  className = "",
}: DataSourceProps) {
  const allSources = [source, ...additionalSources].join(" & ");

  return (
    <p className={`mt-12 text-sm text-muted text-center ${className}`}>
      Data source: {allSources} • Updated regularly
    </p>
  );
}

export default DataSource;
