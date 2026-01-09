import { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { STATUS_CONFIG, ReactorStatus } from "@/lib/types";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Id: number;
  Status: string;
  Capacity: number | null;
}

/**
 * Status statistics
 */
interface StatusStats {
  status: ReactorStatus;
  slug: string;
  count: number;
  totalCapacity: number;
}

/**
 * Status slug mapping
 */
const STATUS_TO_SLUG: Record<ReactorStatus, string> = {
  operational: "operational",
  under_construction: "under-construction",
  planned: "planned",
  suspended: "suspended",
  shutdown: "shutdown",
  cancelled: "cancelled",
};

/**
 * Load status statistics from reactor data
 */
async function getStatusStats(): Promise<StatusStats[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  const statusMap = new Map<string, StatusStats>();

  // Initialize all statuses
  (Object.keys(STATUS_CONFIG) as ReactorStatus[]).forEach((status) => {
    statusMap.set(status, {
      status,
      slug: STATUS_TO_SLUG[status],
      count: 0,
      totalCapacity: 0,
    });
  });

  reactors.forEach((r) => {
    const status = r.Status.toLowerCase().replace(/ /g, "_") as ReactorStatus;
    const stats = statusMap.get(status);
    if (stats) {
      stats.count++;
      if (r.Capacity) {
        stats.totalCapacity += r.Capacity;
      }
    }
  });

  // Sort by count descending
  return Array.from(statusMap.values())
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Reactor Status | Operational, Under Construction, Planned | ReactorMap",
  description:
    "Browse nuclear reactors by operational status. See counts for operational, under construction, planned, suspended, shutdown, and cancelled reactors worldwide.",
  keywords: [
    "nuclear reactor status",
    "operational reactors",
    "nuclear plants under construction",
    "planned nuclear reactors",
    "shutdown nuclear plants",
  ],
  openGraph: {
    title: "Nuclear Reactor Status Overview",
    description:
      "Browse nuclear reactors by operational status worldwide.",
    type: "website",
    url: "https://reactormap.com/statuses",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Reactor Status Overview",
    description: "Browse nuclear reactors by operational status worldwide.",
  },
  alternates: {
    canonical: "https://reactormap.com/statuses",
  },
};

/**
 * Statuses index page
 */
export default async function StatusesPage() {
  const statuses = await getStatusStats();

  const totalReactors = statuses.reduce((sum, s) => sum + s.count, 0);
  const totalCapacity = statuses.reduce((sum, s) => sum + s.totalCapacity, 0);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nuclear Reactor Status Categories",
    description: `Overview of ${totalReactors} nuclear reactors by operational status`,
    numberOfItems: statuses.length,
    itemListElement: statuses.map((status, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: STATUS_CONFIG[status.status].label,
        url: `https://reactormap.com/status/${status.slug}`,
      },
    })),
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://reactormap.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Status Overview",
        item: "https://reactormap.com/statuses",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-obsidian text-cream">
        {/* Header */}
        <header className="border-b border-white/10 bg-charcoal/50 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-silver hover:text-cream transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">ReactorMap</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-lava/20 hover:bg-lava/30 text-lava-light rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Map
            </Link>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 py-3 text-sm text-silver">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cream transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li className="text-cream">Status Overview</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Reactor Status Overview
            </h1>
            <p className="text-lg text-silver">
              {totalReactors} reactors • {(totalCapacity / 1000).toFixed(0)} GW total capacity
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {statuses.map((status) => {
              const config = STATUS_CONFIG[status.status];
              const percentage = ((status.count / totalReactors) * 100).toFixed(1);

              return (
                <Link
                  key={status.status}
                  href={`/status/${status.slug}`}
                  className="glass-panel rounded-xl p-6 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <h2
                      className="text-2xl font-semibold group-hover:text-lava transition-colors"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </h2>
                  </div>

                  <p className="text-silver text-sm mb-4">{config.description}</p>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-4xl font-mono font-bold" style={{ color: config.color }}>
                        {status.count}
                      </div>
                      <div className="text-sm text-silver">reactors ({percentage}%)</div>
                    </div>
                    {status.totalCapacity > 0 && (
                      <div className="text-right">
                        <div className="text-xl font-mono text-cream">
                          {status.totalCapacity.toLocaleString()}
                        </div>
                        <div className="text-sm text-silver">MW capacity</div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Related Links */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/countries"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Country →
            </Link>
            <Link
              href="/types"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Reactor Type →
            </Link>
            <Link
              href="/regions"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Region →
            </Link>
          </div>

          {/* Data Source */}
          <p className="mt-12 text-sm text-muted text-center">
            Data source: IAEA PRIS database • Updated regularly
          </p>
        </div>
      </main>
    </>
  );
}
