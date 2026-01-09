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
 * Reactor type information with descriptions
 */
const REACTOR_TYPE_INFO: Record<string, { name: string; fullName: string; description: string }> = {
  pwr: {
    name: "PWR",
    fullName: "Pressurized Water Reactor",
    description: "The most common type of nuclear reactor. Uses ordinary water under high pressure as both coolant and moderator. The primary cooling water is kept under pressure to prevent boiling.",
  },
  bwr: {
    name: "BWR",
    fullName: "Boiling Water Reactor",
    description: "The second most common reactor type. Water boils inside the reactor core, and steam is used directly to drive the turbine. Simpler design than PWR but requires radiation shielding for turbine.",
  },
  phwr: {
    name: "PHWR",
    fullName: "Pressurized Heavy Water Reactor",
    description: "Uses heavy water (deuterium oxide) as coolant and moderator. Can use natural uranium fuel. The CANDU reactor from Canada is the most common design.",
  },
  gcr: {
    name: "GCR",
    fullName: "Gas-Cooled Reactor",
    description: "Uses carbon dioxide or helium gas as coolant and graphite as moderator. Primarily developed in the UK. Can operate at higher temperatures than water-cooled reactors.",
  },
  lwgr: {
    name: "LWGR",
    fullName: "Light Water Graphite Reactor",
    description: "Uses ordinary water as coolant and graphite as moderator. Primarily developed in the Soviet Union. The RBMK design (Chernobyl) is the most well-known example.",
  },
  fbr: {
    name: "FBR",
    fullName: "Fast Breeder Reactor",
    description: "Uses fast neutrons to breed fissile material from fertile material. Can produce more fuel than it consumes. Often uses liquid sodium as coolant.",
  },
  htgr: {
    name: "HTGR",
    fullName: "High Temperature Gas-Cooled Reactor",
    description: "Advanced reactor using helium gas coolant and graphite moderator. Operates at very high temperatures, enabling efficient electricity generation and industrial heat applications.",
  },
  abwr: {
    name: "ABWR",
    fullName: "Advanced Boiling Water Reactor",
    description: "Third-generation BWR with improved safety and efficiency. Features internal recirculation pumps and digital control systems. Developed jointly by GE, Hitachi, and Toshiba.",
  },
  hwgcr: {
    name: "HWGCR",
    fullName: "Heavy Water Gas-Cooled Reactor",
    description: "Uses heavy water as moderator and gas (usually CO2) as coolant. Combines features of heavy water and gas-cooled reactor designs.",
  },
  hwlwr: {
    name: "HWLWR",
    fullName: "Heavy Water Light Water Reactor",
    description: "Uses heavy water as moderator and light water as coolant. Combines advantages of both water types for improved neutron economy.",
  },
  ocr: {
    name: "OCR",
    fullName: "Organic Cooled Reactor",
    description: "Uses organic compounds (like polyphenyls) as coolant and moderator. Can operate at low pressure and high temperature. Experimental design.",
  },
  apwr: {
    name: "APWR",
    fullName: "Advanced Pressurized Water Reactor",
    description: "Third-generation PWR with enhanced safety features and improved efficiency. Features larger core, better steam generators, and passive safety systems.",
  },
  sghwr: {
    name: "SGHWR",
    fullName: "Steam Generating Heavy Water Reactor",
    description: "British design using heavy water moderator with boiling light water coolant. Combines features of heavy water and boiling water reactors.",
  },
  unknown: {
    name: "Unknown",
    fullName: "Unknown Reactor Type",
    description: "Reactor type not specified in the database.",
  },
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
 * Get all unique reactor types
 */
async function getReactorTypes(): Promise<{ type: string; slug: string; count: number }[]> {
  const reactors = await getReactors();
  const typeMap = new Map<string, number>();

  reactors.forEach((r) => {
    const type = r.reactorType || "Unknown";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      slug: slugify(type),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get reactors for a specific type
 */
async function getReactorsByType(typeSlug: string): Promise<{
  type: string;
  info: { name: string; fullName: string; description: string };
  reactors: Reactor[];
} | null> {
  const reactors = await getReactors();
  const types = await getReactorTypes();

  const typeData = types.find((t) => t.slug === typeSlug);
  if (!typeData) return null;

  const typeReactors = reactors.filter(
    (r) => slugify(r.reactorType || "Unknown") === typeSlug
  );

  const info = REACTOR_TYPE_INFO[typeSlug] || {
    name: typeData.type,
    fullName: typeData.type,
    description: `${typeData.type} nuclear reactor technology.`,
  };

  return {
    type: typeData.type,
    info,
    reactors: typeReactors,
  };
}

/**
 * Generate static params for all reactor types
 */
export async function generateStaticParams() {
  const types = await getReactorTypes();
  return types.map((t) => ({
    slug: t.slug,
  }));
}

/**
 * Generate dynamic metadata for each type page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getReactorsByType(slug);

  if (!data) {
    return {
      title: "Reactor Type Not Found | ReactorMap",
    };
  }

  const { type, info, reactors } = data;
  const operational = reactors.filter((r) => r.status === "operational").length;
  const totalCapacity = reactors
    .filter((r) => r.status === "operational" && r.capacity)
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  const description = `${info.fullName} (${type}) - ${reactors.length} reactors worldwide. ${operational} operational with ${totalCapacity.toLocaleString()} MW capacity. ${info.description.slice(0, 100)}...`;

  return {
    title: `${info.fullName} (${type}) | ${reactors.length} Reactors | ReactorMap`,
    description,
    keywords: [
      type,
      info.fullName,
      "nuclear reactor type",
      "nuclear technology",
      "reactor design",
    ],
    openGraph: {
      title: `${info.fullName} (${type}) Reactors`,
      description,
      type: "website",
      url: `https://reactormap.com/type/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${info.fullName} Reactors`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/type/${slug}`,
    },
  };
}

/**
 * Reactor type detail page
 */
export default async function TypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getReactorsByType(slug);

  if (!data) {
    notFound();
  }

  const { type, info, reactors } = data;

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

  // Sort countries by reactor count
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
    name: `${info.fullName} (${type}) Reactors`,
    description: `List of ${reactors.length} ${type} nuclear reactors worldwide`,
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
        name: "Reactor Types",
        item: "https://reactormap.com/types",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: info.fullName,
        item: `https://reactormap.com/type/${slug}`,
      },
    ],
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
              <Link href="/types" className="hover:text-cream transition-colors">Types</Link>
            </li>
            <li>/</li>
            <li className="text-cream">{type}</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-lava mb-2">
              <span className="px-2 py-1 bg-lava/20 rounded text-sm font-mono">{type}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              {info.fullName}
            </h1>
            <p className="text-lg text-silver mb-4">
              {info.description}
            </p>
            <p className="text-silver">
              {stats.total} reactors • {sortedCountries.length} countries • {stats.totalCapacity.toLocaleString()} MW operational capacity
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
                            {reactor.reactorModel && <span>{reactor.reactorModel}</span>}
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
            Data source: IAEA PRIS database • Updated regularly
          </p>
        </div>
      </main>
    </>
  );
}
