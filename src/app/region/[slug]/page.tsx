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
 * Region definitions with their countries
 */
const REGIONS: Record<string, { name: string; description: string; countries: string[] }> = {
  "north-america": {
    name: "North America",
    description: "Nuclear power in the United States, Canada, and Mexico. The US has the world's largest nuclear fleet.",
    countries: ["United States", "Canada", "Mexico"],
  },
  "south-america": {
    name: "South America",
    description: "Nuclear power development in South America, led by Argentina and Brazil.",
    countries: ["Argentina", "Brazil"],
  },
  europe: {
    name: "Europe",
    description: "Europe has a diverse nuclear landscape, with France leading in nuclear power generation and several countries phasing out nuclear energy.",
    countries: [
      "France", "United Kingdom", "Germany", "Spain", "Belgium", "Sweden",
      "Switzerland", "Finland", "Czech Republic", "Slovakia", "Hungary",
      "Bulgaria", "Romania", "Slovenia", "Netherlands", "Italy", "Lithuania",
      "Austria", "Poland", "Turkey",
    ],
  },
  asia: {
    name: "Asia",
    description: "Asia is the fastest-growing region for nuclear power, with China, India, Japan, and South Korea leading development.",
    countries: [
      "China", "Japan", "South Korea", "India", "Pakistan", "Taiwan",
      "Kazakhstan", "Bangladesh", "Indonesia", "Philippines", "Vietnam",
      "Thailand", "Malaysia", "Uzbekistan",
    ],
  },
  "middle-east": {
    name: "Middle East",
    description: "Emerging nuclear power region with the UAE leading and several countries developing nuclear programs.",
    countries: ["United Arab Emirates", "Iran", "Israel", "Saudi Arabia", "Jordan", "Egypt"],
  },
  russia: {
    name: "Russia & CIS",
    description: "Russia has a major nuclear industry and exports reactor technology worldwide. Includes former Soviet states.",
    countries: ["Russia", "Ukraine", "Belarus", "Armenia", "Kazakhstan", "Uzbekistan"],
  },
  africa: {
    name: "Africa",
    description: "South Africa operates the only commercial nuclear power plant on the African continent.",
    countries: ["South Africa", "Egypt"],
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
 * Get reactors for a specific region
 */
async function getReactorsByRegion(regionSlug: string): Promise<{
  region: { name: string; description: string };
  reactors: Reactor[];
  countries: string[];
} | null> {
  const regionData = REGIONS[regionSlug];
  if (!regionData) return null;

  const reactors = await getReactors();
  const regionReactors = reactors.filter((r) =>
    regionData.countries.includes(r.country)
  );

  // Get unique countries that have reactors
  const countriesWithReactors = [...new Set(regionReactors.map((r) => r.country))];

  return {
    region: { name: regionData.name, description: regionData.description },
    reactors: regionReactors,
    countries: countriesWithReactors,
  };
}

/**
 * Generate static params for all regions
 */
export async function generateStaticParams() {
  return Object.keys(REGIONS).map((slug) => ({ slug }));
}

/**
 * Generate dynamic metadata for each region page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getReactorsByRegion(slug);

  if (!data) {
    return {
      title: "Region Not Found | ReactorMap",
    };
  }

  const { region, reactors, countries } = data;
  const operational = reactors.filter((r) => r.status === "operational").length;
  const totalCapacity = reactors
    .filter((r) => r.status === "operational" && r.capacity)
    .reduce((sum, r) => sum + (r.capacity || 0), 0);

  const description = `Nuclear power in ${region.name}: ${reactors.length} reactors across ${countries.length} countries. ${operational} operational with ${totalCapacity.toLocaleString()} MW capacity.`;

  return {
    title: `Nuclear Reactors in ${region.name} | ${reactors.length} Plants | ReactorMap`,
    description,
    keywords: [
      `nuclear power ${region.name}`,
      `${region.name} nuclear reactors`,
      "nuclear energy",
      "power plants",
    ],
    openGraph: {
      title: `Nuclear Reactors in ${region.name}`,
      description,
      type: "website",
      url: `https://reactormap.com/region/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Nuclear Reactors in ${region.name}`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/region/${slug}`,
    },
  };
}

/**
 * Region detail page
 */
export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getReactorsByRegion(slug);

  if (!data) {
    notFound();
  }

  const { region, reactors, countries } = data;

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
      count: countryReactors.length,
      operational: countryReactors.filter((r) => r.status === "operational").length,
      capacity: countryReactors
        .filter((r) => r.status === "operational" && r.capacity)
        .reduce((sum, r) => sum + (r.capacity || 0), 0),
    }));

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Nuclear Reactors in ${region.name}`,
    description: `List of ${reactors.length} nuclear reactors in ${region.name}`,
    numberOfItems: reactors.length,
    itemListElement: sortedCountries.map((country, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Country",
        name: country.country,
        url: `https://reactormap.com/country/${slugify(country.country)}`,
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
        name: "Regions",
        item: "https://reactormap.com/regions",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: region.name,
        item: `https://reactormap.com/region/${slug}`,
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
              <Link href="/regions" className="hover:text-cream transition-colors">Regions</Link>
            </li>
            <li>/</li>
            <li className="text-cream">{region.name}</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Nuclear Power in {region.name}
            </h1>
            <p className="text-lg text-silver mb-4">
              {region.description}
            </p>
            <p className="text-silver">
              {stats.total} reactors • {countries.length} countries • {stats.totalCapacity.toLocaleString()} MW operational capacity
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

          {/* Countries Table */}
          <h2 className="text-2xl font-semibold mb-4">Countries in {region.name}</h2>
          <div className="glass-panel rounded-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-silver">Country</th>
                    <th className="text-center px-4 py-3 font-medium text-silver">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-green-400">Operational</th>
                    <th className="text-right px-4 py-3 font-medium text-silver hidden sm:table-cell">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCountries.map((country, index) => (
                    <tr
                      key={country.country}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/country/${slugify(country.country)}`}
                          className="font-medium hover:text-lava transition-colors flex items-center gap-2"
                        >
                          <span className="text-silver text-sm w-6">{index + 1}.</span>
                          {country.country}
                        </Link>
                      </td>
                      <td className="text-center px-4 py-3 font-mono">{country.count}</td>
                      <td className="text-center px-4 py-3 font-mono text-green-400">
                        {country.operational || "-"}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-silver hidden sm:table-cell">
                        {country.capacity ? `${country.capacity.toLocaleString()} MW` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Other Regions */}
          <h2 className="text-2xl font-semibold mb-4">Other Regions</h2>
          <div className="flex flex-wrap gap-3 mb-8">
            {Object.entries(REGIONS)
              .filter(([key]) => key !== slug)
              .map(([key, { name }]) => (
                <Link
                  key={key}
                  href={`/region/${key}`}
                  className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
                >
                  {name}
                </Link>
              ))}
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
