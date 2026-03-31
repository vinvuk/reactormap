import { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { slugify } from "@/lib/slugify";
import { PageHeader, Breadcrumb, Hero, DataSource } from "@/components/ui";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Id: number;
  Name: string;
  Country: string;
  CountryCode: string;
  Status: string;
  ReactorType: string | null;
  Capacity: number | null;
  OperationalFrom: string | null;
  OperationalTo: string | null;
  WikidataOperator: string | null;
}

/**
 * Load reactor data
 */
async function getReactorData(): Promise<RawReactor[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Number of Nuclear Reactors Worldwide 2026 — Statistics by Country | ReactorMap",
  description:
    "How many nuclear power plants are there in the world in 2026? See the number of operational nuclear reactors by country, reactors under construction, total capacity in GW, and reactor types. Updated IAEA PRIS data.",
  keywords: [
    "number of nuclear reactors worldwide 2026",
    "nuclear power plants by country",
    "operational nuclear reactors",
    "nuclear reactors under construction",
    "nuclear power statistics 2026",
    "IAEA PRIS",
    "nuclear capacity by country",
    "number of nuclear power plants in the world",
  ],
  openGraph: {
    title: "Number of Nuclear Reactors Worldwide 2026 — Statistics by Country",
    description: "How many nuclear power plants are there in 2026? Operational reactors by country, capacity, reactor types, and construction pipeline. IAEA PRIS data.",
    type: "website",
    url: "https://reactormap.com/statistics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Number of Nuclear Reactors Worldwide 2026 — Statistics by Country",
    description: "How many nuclear power plants are there in 2026? Operational reactors by country, capacity, reactor types, and construction pipeline. IAEA PRIS data.",
  },
  alternates: {
    canonical: "https://reactormap.com/statistics",
  },
};

/**
 * Statistics page component
 */
export default async function StatisticsPage() {
  const reactors = await getReactorData();

  // Calculate statistics
  const operational = reactors.filter((r) => r.Status.toLowerCase() === "operational");
  const underConstruction = reactors.filter((r) => r.Status.toLowerCase() === "under construction");
  const planned = reactors.filter((r) => r.Status.toLowerCase() === "planned");
  const shutdown = reactors.filter((r) => r.Status.toLowerCase() === "shutdown");
  const suspended = reactors.filter((r) => r.Status.toLowerCase() === "suspended");
  const cancelled = reactors.filter((r) => r.Status.toLowerCase() === "cancelled");

  // Capacity calculations
  const totalCapacity = operational.reduce((sum, r) => sum + (r.Capacity || 0), 0);
  const constructionCapacity = underConstruction.reduce((sum, r) => sum + (r.Capacity || 0), 0);
  const plannedCapacity = planned.reduce((sum, r) => sum + (r.Capacity || 0), 0);

  // Country breakdown
  const countryStats = new Map<string, { total: number; operational: number; capacity: number }>();
  reactors.forEach((r) => {
    const existing = countryStats.get(r.Country) || { total: 0, operational: 0, capacity: 0 };
    countryStats.set(r.Country, {
      total: existing.total + 1,
      operational: existing.operational + (r.Status.toLowerCase() === "operational" ? 1 : 0),
      capacity: existing.capacity + (r.Status.toLowerCase() === "operational" ? (r.Capacity || 0) : 0),
    });
  });

  const topCountries = Array.from(countryStats.entries())
    .map(([country, stats]) => ({ country, ...stats }))
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 15);

  // Reactor type breakdown
  const typeStats = new Map<string, number>();
  operational.forEach((r) => {
    const type = r.ReactorType || "Unknown";
    typeStats.set(type, (typeStats.get(type) || 0) + 1);
  });

  const topTypes = Array.from(typeStats.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Timeline data
  const decadeStats = new Map<string, { started: number; shutdown: number }>();
  const decades = ["1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];

  decades.forEach((decade) => {
    decadeStats.set(decade, { started: 0, shutdown: 0 });
  });

  reactors.forEach((r) => {
    if (r.OperationalFrom) {
      const year = new Date(r.OperationalFrom).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const decadeKey = decade.toString();
      if (decadeStats.has(decadeKey)) {
        const stats = decadeStats.get(decadeKey)!;
        stats.started++;
      }
    }
    if (r.OperationalTo) {
      const year = new Date(r.OperationalTo).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const decadeKey = decade.toString();
      if (decadeStats.has(decadeKey)) {
        const stats = decadeStats.get(decadeKey)!;
        stats.shutdown++;
      }
    }
  });

  // Average reactor age
  const ages = operational
    .filter((r) => r.OperationalFrom)
    .map((r) => new Date().getFullYear() - new Date(r.OperationalFrom!).getFullYear());
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

  // Unique countries with operational reactors
  const countriesWithNuclear = new Set(operational.map((r) => r.Country)).size;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Global Nuclear Power Statistics",
    description: `Comprehensive nuclear power statistics: ${operational.length} operational reactors across ${countriesWithNuclear} countries`,
    url: "https://reactormap.com/statistics",
    creator: {
      "@type": "Organization",
      name: "ReactorMap",
    },
    dateModified: new Date().toISOString().split("T")[0],
    distribution: {
      "@type": "DataDownload",
      contentUrl: "https://reactormap.com/sitemap.xml",
      encodingFormat: "application/xml",
    },
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
        name: "Statistics",
        item: "https://reactormap.com/statistics",
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
        <PageHeader maxWidth="lg" />
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Statistics" }]} maxWidth="lg" />

        <Hero
          title="Nuclear Power Statistics"
          subtitle={
            <>
              Comprehensive data on <span className="text-[#22ff66] font-mono font-bold">{reactors.length}</span> nuclear reactors worldwide
            </>
          }
          maxWidth="lg"
        />

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass-panel rounded-xl p-6 text-center">
              <div className="text-4xl font-mono font-bold text-[#22ff66]">{operational.length}</div>
              <div className="text-sm text-silver mt-1">Operational Reactors</div>
            </div>
            <div className="glass-panel rounded-xl p-6 text-center">
              <div className="text-4xl font-mono font-bold text-[#ffee00]">{underConstruction.length}</div>
              <div className="text-sm text-silver mt-1">Under Construction</div>
            </div>
            <div className="glass-panel rounded-xl p-6 text-center">
              <div className="text-4xl font-mono font-bold text-[#00aaff]">{planned.length}</div>
              <div className="text-sm text-silver mt-1">Planned</div>
            </div>
            <div className="glass-panel rounded-xl p-6 text-center">
              <div className="text-4xl font-mono font-bold text-cream">{(totalCapacity / 1000).toFixed(0)}</div>
              <div className="text-sm text-silver mt-1">GW Total Capacity</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Capacity Overview */}
            <section className="glass-panel rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Capacity Overview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-silver">Operational</span>
                    <span className="font-mono text-[#22ff66]">{(totalCapacity / 1000).toFixed(1)} GW</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#22ff66]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-silver">Under Construction</span>
                    <span className="font-mono text-[#ffee00]">{(constructionCapacity / 1000).toFixed(1)} GW</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#ffee00]" style={{ width: `${(constructionCapacity / totalCapacity) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-silver">Planned</span>
                    <span className="font-mono text-[#00aaff]">{(plannedCapacity / 1000).toFixed(1)} GW</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00aaff]" style={{ width: `${(plannedCapacity / totalCapacity) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-mono font-bold">{avgAge}</div>
                    <div className="text-xs text-silver">Avg. Reactor Age (years)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold">{countriesWithNuclear}</div>
                    <div className="text-xs text-silver">Countries with Nuclear</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Status Breakdown */}
            <section className="glass-panel rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Status Breakdown</h2>
              <div className="space-y-3">
                {[
                  { status: "Operational", count: operational.length, color: "#22ff66" },
                  { status: "Under Construction", count: underConstruction.length, color: "#ffee00" },
                  { status: "Planned", count: planned.length, color: "#00aaff" },
                  { status: "Suspended", count: suspended.length, color: "#ff9900" },
                  { status: "Shutdown", count: shutdown.length, color: "#888888" },
                  { status: "Cancelled", count: cancelled.length, color: "#ff4444" },
                ].map(({ status, count, color }) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="flex-1 text-sm text-silver">{status}</span>
                    <span className="font-mono font-medium">{count}</span>
                    <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, width: `${(count / reactors.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <div className="text-3xl font-mono font-bold">{reactors.length}</div>
                <div className="text-sm text-silver">Total Reactors Tracked</div>
              </div>
            </section>
          </div>

          {/* Top Countries */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Top Nuclear Nations</h2>
              <Link href="/countries" className="text-sm text-lava hover:text-lava-light transition-colors">
                View all countries →
              </Link>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-silver">Rank</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-silver">Country</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-silver">Operational</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-silver hidden md:table-cell">Total</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-silver">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {topCountries.map((country, index) => (
                    <tr key={country.country} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-silver">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/country/${slugify(country.country)}`}
                          className="font-medium hover:text-lava transition-colors"
                        >
                          {country.country}
                        </Link>
                      </td>
                      <td className="text-center px-4 py-3 font-mono text-[#22ff66]">{country.operational}</td>
                      <td className="text-center px-4 py-3 font-mono text-silver hidden md:table-cell">{country.total}</td>
                      <td className="text-right px-4 py-3 font-mono">{(country.capacity / 1000).toFixed(1)} GW</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reactor Types */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Reactor Technologies</h2>
              <Link href="/types" className="text-sm text-lava hover:text-lava-light transition-colors">
                View all types →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topTypes.slice(0, 6).map((type) => (
                <Link
                  key={type.type}
                  href={`/type/${slugify(type.type)}`}
                  className="glass-panel rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-2xl font-mono font-bold text-lava">{type.count}</div>
                  <div className="text-sm text-silver mt-1">{type.type}</div>
                  <div className="text-xs text-muted mt-1">
                    {((type.count / operational.length) * 100).toFixed(0)}%
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Nuclear Power Timeline</h2>
            </div>
            <div className="glass-panel rounded-xl p-6">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {decades.map((decade) => {
                  const stats = decadeStats.get(decade)!;
                  const maxHeight = Math.max(...Array.from(decadeStats.values()).map((s) => s.started));
                  const height = maxHeight > 0 ? (stats.started / maxHeight) * 100 : 0;

                  return (
                    <div key={decade} className="text-center">
                      <div className="h-24 flex items-end justify-center mb-2">
                        <div
                          className="w-8 bg-gradient-to-t from-[#22ff66]/40 to-[#22ff66] rounded-t"
                          style={{ height: `${height}%`, minHeight: stats.started > 0 ? "8px" : "0" }}
                        />
                      </div>
                      <div className="text-xs text-silver">{decade}s</div>
                      <div className="text-sm font-mono text-[#22ff66]">+{stats.started}</div>
                      {stats.shutdown > 0 && (
                        <div className="text-xs font-mono text-red-400">-{stats.shutdown}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-6 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#22ff66]" />
                    <span className="text-silver">Reactors Started</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span className="text-silver">Reactors Shutdown</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Explore Data</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/countries" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                Browse by Country
              </Link>
              <Link href="/statuses" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                Browse by Status
              </Link>
              <Link href="/types" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                Browse by Reactor Type
              </Link>
              <Link href="/regions" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                Browse by Region
              </Link>
              <Link href="/operators" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                Browse by Operator
              </Link>
              <Link href="/faq" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
                FAQ
              </Link>
            </div>
          </section>

          <DataSource />
        </div>
      </main>
    </>
  );
}
