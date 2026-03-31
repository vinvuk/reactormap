import { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { STATUS_CONFIG, ReactorStatus } from "@/lib/types";
import { PageHeader, Breadcrumb, Hero, DataSource } from "@/components/ui";

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
  const operationalCount = statuses.find(s => s.status === 'operational')?.count || 0;
  const underConstructionCount = statuses.find(s => s.status === 'under_construction')?.count || 0;

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
        <PageHeader />
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Status Overview" }]} />

        <Hero
          title="Reactor Status Overview"
          subtitle={
            <>
              <span className="text-[#22ff66] font-mono font-bold">{totalReactors}</span> reactors across 6 operational statuses
            </>
          }
          stats={[
            { value: operationalCount, label: "Operational", highlight: true },
            { value: underConstructionCount, label: "Under Construction" },
            { value: `${(totalCapacity / 1000).toFixed(0)}`, label: "GW Capacity" },
          ]}
        />

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
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

          <DataSource />
        </div>
      </main>
    </>
  );
}
