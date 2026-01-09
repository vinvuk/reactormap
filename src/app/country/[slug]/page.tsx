import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { Reactor, STATUS_CONFIG, ReactorStatus } from "@/lib/types";
import { slugify, createReactorSlug } from "@/lib/slugify";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Id: number;
  Name: string;
  Country: string;
  CountryCode: string;
  Latitude: number;
  Longitude: number;
  Status: string;
  ReactorType: string | null;
  ReactorModel: string | null;
  Capacity: number | null;
  ConstructionStartAt: string | null;
  OperationalFrom: string | null;
  OperationalTo: string | null;
  Source: string;
  IAEAId: number | null;
  WikipediaUrl: string | null;
  WikipediaTitle: string | null;
  WikipediaExtract: string | null;
  WikipediaThumbnail: string | null;
  WikidataOperator: string | null;
  WikidataOwner: string | null;
  WikidataRegion: string | null;
}

/**
 * Load all reactors from JSON file
 */
async function getReactors(): Promise<Reactor[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const rawReactors: RawReactor[] = JSON.parse(fileContents);

  return rawReactors.map((r) => ({
    id: String(r.Id),
    name: r.Name,
    country: r.Country,
    countryCode: r.CountryCode,
    latitude: r.Latitude,
    longitude: r.Longitude,
    status: r.Status.toLowerCase().replace(/ /g, "_") as Reactor["status"],
    reactorType: r.ReactorType,
    reactorModel: r.ReactorModel,
    capacity: r.Capacity,
    constructionStartAt: r.ConstructionStartAt,
    operationalFrom: r.OperationalFrom,
    operationalTo: r.OperationalTo,
    source: r.Source,
    iaeaId: r.IAEAId,
    wikipediaUrl: r.WikipediaUrl,
    wikipediaTitle: r.WikipediaTitle,
    wikipediaExtract: r.WikipediaExtract,
    wikipediaThumbnail: r.WikipediaThumbnail,
    wikidataOperator: r.WikidataOperator,
    wikidataOwner: r.WikidataOwner,
    wikidataRegion: r.WikidataRegion,
    wikidataArchitect: null,
  }));
}

/**
 * Get unique countries with their reactor counts
 */
async function getCountries(): Promise<{ name: string; slug: string; count: number }[]> {
  const reactors = await getReactors();
  const countryMap = new Map<string, number>();

  reactors.forEach((r) => {
    countryMap.set(r.country, (countryMap.get(r.country) || 0) + 1);
  });

  return Array.from(countryMap.entries())
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get reactors for a specific country
 */
async function getReactorsByCountry(countrySlug: string): Promise<{
  country: string;
  reactors: Reactor[];
} | null> {
  const reactors = await getReactors();
  const countries = await getCountries();

  const country = countries.find((c) => c.slug === countrySlug);
  if (!country) return null;

  const countryReactors = reactors.filter((r) => r.country === country.name);
  return {
    country: country.name,
    reactors: countryReactors,
  };
}

/**
 * Generate static params for all countries
 */
export async function generateStaticParams() {
  const countries = await getCountries();
  return countries.map((country) => ({
    slug: country.slug,
  }));
}

/**
 * Generate dynamic metadata for each country page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getReactorsByCountry(slug);

  if (!data) {
    return {
      title: "Country Not Found | ReactorMap",
    };
  }

  const { country, reactors } = data;
  const operational = reactors.filter((r) => r.status === "operational").length;
  const totalCapacity = reactors
    .filter((r) => r.status === "operational" && r.capacity)
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  const description = `Explore ${reactors.length} nuclear reactors in ${country}. ${operational} operational reactors with ${totalCapacity.toLocaleString()} MW total capacity. Interactive map and detailed information.`;

  return {
    title: `Nuclear Reactors in ${country} | ${reactors.length} Plants | ReactorMap`,
    description,
    keywords: [
      `nuclear reactors ${country}`,
      `nuclear power plants ${country}`,
      `${country} nuclear energy`,
      "nuclear power",
      "power plants",
    ],
    openGraph: {
      title: `Nuclear Reactors in ${country}`,
      description,
      type: "website",
      url: `https://reactormap.com/country/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Nuclear Reactors in ${country}`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/country/${slug}`,
    },
  };
}

/**
 * Country detail page component
 */
export default async function CountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getReactorsByCountry(slug);

  if (!data) {
    notFound();
  }

  const { country, reactors } = data;

  // Calculate statistics
  const stats = {
    total: reactors.length,
    operational: reactors.filter((r) => r.status === "operational").length,
    underConstruction: reactors.filter((r) => r.status === "under_construction").length,
    planned: reactors.filter((r) => r.status === "planned").length,
    shutdown: reactors.filter((r) => r.status === "shutdown").length,
    totalCapacity: reactors
      .filter((r) => r.status === "operational" && r.capacity)
      .reduce((sum, r) => sum + (r.capacity || 0), 0),
  };

  // Group reactors by status
  const reactorsByStatus = reactors.reduce((acc, reactor) => {
    const status = reactor.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(reactor);
    return acc;
  }, {} as Record<string, Reactor[]>);

  // Sort each group by capacity
  Object.values(reactorsByStatus).forEach((group) => {
    group.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
  });

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Nuclear Reactors in ${country}`,
    description: `List of ${reactors.length} nuclear reactors in ${country}`,
    numberOfItems: reactors.length,
    itemListElement: reactors.slice(0, 10).map((reactor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: reactor.name,
        url: `https://reactormap.com/reactor/${createReactorSlug(reactor.name, reactor.id)}`,
      },
    })),
  };

  const statusOrder: ReactorStatus[] = [
    "operational",
    "under_construction",
    "planned",
    "suspended",
    "shutdown",
    "cancelled",
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Nuclear Reactors in {country}
            </h1>
            <p className="text-lg text-silver">
              {stats.total} reactors • {stats.operational} operational • {stats.totalCapacity.toLocaleString()} MW total capacity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-lava">{stats.operational}</div>
              <div className="text-sm text-silver">Operational</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-yellow-400">{stats.underConstruction}</div>
              <div className="text-sm text-silver">Under Construction</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-blue-400">{stats.planned}</div>
              <div className="text-sm text-silver">Planned</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-gray-400">{stats.shutdown}</div>
              <div className="text-sm text-silver">Shutdown</div>
            </div>
          </div>

          {/* Reactor List by Status */}
          {statusOrder.map((status) => {
            const statusReactors = reactorsByStatus[status];
            if (!statusReactors || statusReactors.length === 0) return null;

            const config = STATUS_CONFIG[status] || {
              label: status.replace(/_/g, " "),
              color: "#888888",
            };

            return (
              <section key={status} className="mb-8">
                <h2
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: config.color }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label} ({statusReactors.length})
                </h2>

                <div className="grid gap-3">
                  {statusReactors.map((reactor) => (
                    <Link
                      key={reactor.id}
                      href={`/reactor/${createReactorSlug(reactor.name, reactor.id)}`}
                      className="glass-panel rounded-lg p-4 hover:bg-white/5 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <h3 className="font-medium group-hover:text-lava transition-colors">
                          {reactor.name}
                        </h3>
                        <div className="text-sm text-silver flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {reactor.reactorType && <span>{reactor.reactorType}</span>}
                          {reactor.wikidataRegion && <span>{reactor.wikidataRegion}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        {reactor.capacity && (
                          <div className="font-mono text-lava-light">{reactor.capacity} MW</div>
                        )}
                        <svg
                          className="w-5 h-5 text-silver group-hover:text-lava transition-colors ml-auto mt-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Data Source */}
          <p className="mt-12 text-sm text-muted text-center">
            Data source: IAEA PRIS database • Updated regularly
          </p>
        </div>
      </main>
    </>
  );
}
