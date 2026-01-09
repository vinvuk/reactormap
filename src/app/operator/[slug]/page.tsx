import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { Reactor, STATUS_CONFIG } from "@/lib/types";
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
 * Get all unique operators with reactor counts
 */
async function getOperators(): Promise<{ name: string; slug: string; count: number }[]> {
  const reactors = await getReactors();
  const operatorMap = new Map<string, number>();

  reactors.forEach((r) => {
    if (r.wikidataOperator) {
      operatorMap.set(r.wikidataOperator, (operatorMap.get(r.wikidataOperator) || 0) + 1);
    }
  });

  return Array.from(operatorMap.entries())
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count,
    }))
    .filter((o) => o.count >= 2) // Only include operators with 2+ reactors
    .sort((a, b) => b.count - a.count);
}

/**
 * Get reactors for a specific operator
 */
async function getReactorsByOperator(operatorSlug: string): Promise<{
  operator: string;
  reactors: Reactor[];
} | null> {
  const reactors = await getReactors();
  const operators = await getOperators();

  const operator = operators.find((o) => o.slug === operatorSlug);
  if (!operator) return null;

  const operatorReactors = reactors.filter(
    (r) => r.wikidataOperator && slugify(r.wikidataOperator) === operatorSlug
  );

  return {
    operator: operator.name,
    reactors: operatorReactors,
  };
}

/**
 * Generate static params for all operators
 */
export async function generateStaticParams() {
  const operators = await getOperators();
  return operators.map((o) => ({
    slug: o.slug,
  }));
}

/**
 * Generate dynamic metadata for each operator page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getReactorsByOperator(slug);

  if (!data) {
    return {
      title: "Operator Not Found | ReactorMap",
    };
  }

  const { operator, reactors } = data;
  const operational = reactors.filter((r) => r.status === "operational").length;
  const totalCapacity = reactors
    .filter((r) => r.status === "operational" && r.capacity)
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  const countries = [...new Set(reactors.map((r) => r.country))];

  const description = `${operator} operates ${reactors.length} nuclear reactors across ${countries.length} ${countries.length === 1 ? "country" : "countries"}. ${operational} operational with ${totalCapacity.toLocaleString()} MW capacity.`;

  return {
    title: `${operator} | ${reactors.length} Nuclear Reactors | ReactorMap`,
    description,
    keywords: [
      operator,
      "nuclear operator",
      "nuclear power company",
      "nuclear utility",
    ],
    openGraph: {
      title: `${operator} - Nuclear Reactors`,
      description,
      type: "website",
      url: `https://reactormap.com/operator/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${operator} Nuclear Reactors`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/operator/${slug}`,
    },
  };
}

/**
 * Operator detail page
 */
export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getReactorsByOperator(slug);

  if (!data) {
    notFound();
  }

  const { operator, reactors } = data;

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

  // Group reactors by country
  const reactorsByCountry = reactors.reduce((acc, reactor) => {
    const country = reactor.country;
    if (!acc[country]) acc[country] = [];
    acc[country].push(reactor);
    return acc;
  }, {} as Record<string, Reactor[]>);

  // Sort countries and reactors
  const sortedCountries = Object.entries(reactorsByCountry)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([country, countryReactors]) => ({
      country,
      reactors: countryReactors.sort((a, b) => (b.capacity || 0) - (a.capacity || 0)),
    }));

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: operator,
    description: `Nuclear power plant operator with ${reactors.length} reactors`,
    url: `https://reactormap.com/operator/${slug}`,
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
        name: "Operators",
        item: "https://reactormap.com/operators",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: operator,
        item: `https://reactormap.com/operator/${slug}`,
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
            <li>
              <Link href="/operators" className="hover:text-cream transition-colors">Operators</Link>
            </li>
            <li>/</li>
            <li className="text-cream truncate max-w-[200px]">{operator}</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">
              {operator}
            </h1>
            <p className="text-lg text-silver">
              {stats.total} reactors • {sortedCountries.length} {sortedCountries.length === 1 ? "country" : "countries"} • {stats.totalCapacity.toLocaleString()} MW operational capacity
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
                {countryReactors.map((reactor) => {
                  const statusConfig = STATUS_CONFIG[reactor.status] || {
                    label: reactor.status,
                    color: "#888888",
                  };

                  return (
                    <Link
                      key={reactor.id}
                      href={`/reactor/${createReactorSlug(reactor.name, reactor.id)}`}
                      className="glass-panel rounded-lg p-4 hover:bg-white/5 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: statusConfig.color }}
                        />
                        <div>
                          <h3 className="font-medium group-hover:text-lava transition-colors">
                            {reactor.name}
                          </h3>
                          <div className="text-sm text-silver flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                            {reactor.reactorType && <span>{reactor.reactorType}</span>}
                          </div>
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
                  );
                })}
              </div>
            </section>
          ))}

          {/* Data Source */}
          <p className="mt-12 text-sm text-muted text-center">
            Data source: IAEA PRIS database & Wikidata • Updated regularly
          </p>
        </div>
      </main>
    </>
  );
}
