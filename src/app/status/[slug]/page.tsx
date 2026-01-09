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
 * Status slug mapping for URL-friendly status names
 */
const STATUS_SLUGS: Record<string, ReactorStatus> = {
  operational: "operational",
  "under-construction": "under_construction",
  planned: "planned",
  suspended: "suspended",
  shutdown: "shutdown",
  cancelled: "cancelled",
};

/**
 * Reverse mapping from status to slug
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
 * Get reactors for a specific status
 */
async function getReactorsByStatus(statusSlug: string): Promise<{
  status: ReactorStatus;
  reactors: Reactor[];
} | null> {
  const status = STATUS_SLUGS[statusSlug];
  if (!status) return null;

  const reactors = await getReactors();
  const statusReactors = reactors.filter((r) => r.status === status);

  return {
    status,
    reactors: statusReactors,
  };
}

/**
 * Generate static params for all statuses
 */
export async function generateStaticParams() {
  return Object.keys(STATUS_SLUGS).map((slug) => ({
    slug,
  }));
}

/**
 * Generate dynamic metadata for each status page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getReactorsByStatus(slug);

  if (!data) {
    return {
      title: "Status Not Found | ReactorMap",
    };
  }

  const { status, reactors } = data;
  const config = STATUS_CONFIG[status];
  const totalCapacity = reactors
    .filter((r) => r.capacity)
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  const description = `Explore ${reactors.length} ${config.label.toLowerCase()} nuclear reactors worldwide. ${config.description}. Total capacity: ${totalCapacity.toLocaleString()} MW.`;

  return {
    title: `${config.label} Nuclear Reactors | ${reactors.length} Plants | ReactorMap`,
    description,
    keywords: [
      `${config.label.toLowerCase()} nuclear reactors`,
      "nuclear power plants",
      "nuclear energy",
      "reactor status",
      "power plants",
    ],
    openGraph: {
      title: `${config.label} Nuclear Reactors Worldwide`,
      description,
      type: "website",
      url: `https://reactormap.com/status/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.label} Nuclear Reactors`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/status/${slug}`,
    },
  };
}

/**
 * Status detail page component
 */
export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getReactorsByStatus(slug);

  if (!data) {
    notFound();
  }

  const { status, reactors } = data;
  const config = STATUS_CONFIG[status];

  // Calculate statistics
  const totalCapacity = reactors
    .filter((r) => r.capacity)
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  // Group reactors by country
  const reactorsByCountry = reactors.reduce((acc, reactor) => {
    const country = reactor.country;
    if (!acc[country]) acc[country] = [];
    acc[country].push(reactor);
    return acc;
  }, {} as Record<string, Reactor[]>);

  // Sort countries by reactor count, then sort reactors within each country by capacity
  const sortedCountries = Object.entries(reactorsByCountry)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([country, countryReactors]) => ({
      country,
      reactors: countryReactors.sort((a, b) => (b.capacity || 0) - (a.capacity || 0)),
    }));

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${config.label} Nuclear Reactors`,
    description: `List of ${reactors.length} ${config.label.toLowerCase()} nuclear reactors worldwide`,
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
            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <h1
                className="text-4xl md:text-5xl font-display font-semibold"
                style={{ color: config.color }}
              >
                {config.label} Reactors
              </h1>
            </div>
            <p className="text-lg text-silver mb-2">
              {config.description}
            </p>
            <p className="text-silver">
              {reactors.length} reactors • {sortedCountries.length} countries • {totalCapacity.toLocaleString()} MW total capacity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold" style={{ color: config.color }}>
                {reactors.length}
              </div>
              <div className="text-sm text-silver">Total Reactors</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">
                {sortedCountries.length}
              </div>
              <div className="text-sm text-silver">Countries</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center col-span-2 md:col-span-1">
              <div className="text-3xl font-mono font-bold text-cream">
                {totalCapacity.toLocaleString()}
              </div>
              <div className="text-sm text-silver">Total MW Capacity</div>
            </div>
          </div>

          {/* Status Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(Object.keys(STATUS_CONFIG) as ReactorStatus[]).map((s) => {
              const sConfig = STATUS_CONFIG[s];
              const isActive = s === status;
              return (
                <Link
                  key={s}
                  href={`/status/${STATUS_TO_SLUG[s]}`}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    isActive
                      ? "font-medium"
                      : "hover:bg-white/10"
                  }`}
                  style={{
                    backgroundColor: isActive ? sConfig.color : "transparent",
                    color: isActive ? "#000" : sConfig.color,
                    borderColor: sConfig.color,
                  }}
                >
                  {sConfig.label}
                </Link>
              );
            })}
          </div>

          {/* Reactor List by Country */}
          {sortedCountries.map(({ country, reactors: countryReactors }) => (
            <section key={country} className="mb-8">
              <Link
                href={`/country/${slugify(country)}`}
                className="text-xl font-semibold mb-4 flex items-center gap-2 hover:text-lava transition-colors group"
              >
                {country} ({countryReactors.length})
                <svg
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <div className="grid gap-3">
                {countryReactors.map((reactor) => (
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
          ))}

          {/* Data Source */}
          <p className="mt-12 text-sm text-muted text-center">
            Data source: IAEA PRIS database • Updated regularly
          </p>
        </div>
      </main>
    </>
  );
}
