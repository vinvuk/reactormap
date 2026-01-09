import { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Country: string;
  Status: string;
  Capacity: number | null;
}

/**
 * Region definitions
 */
const REGIONS: Record<string, { name: string; countries: string[] }> = {
  "north-america": {
    name: "North America",
    countries: ["United States", "Canada", "Mexico"],
  },
  "south-america": {
    name: "South America",
    countries: ["Argentina", "Brazil"],
  },
  europe: {
    name: "Europe",
    countries: [
      "France", "United Kingdom", "Germany", "Spain", "Belgium", "Sweden",
      "Switzerland", "Finland", "Czech Republic", "Slovakia", "Hungary",
      "Bulgaria", "Romania", "Slovenia", "Netherlands", "Italy", "Lithuania",
      "Austria", "Poland", "Turkey",
    ],
  },
  asia: {
    name: "Asia",
    countries: [
      "China", "Japan", "South Korea", "India", "Pakistan", "Taiwan",
      "Kazakhstan", "Bangladesh", "Indonesia", "Philippines", "Vietnam",
      "Thailand", "Malaysia", "Uzbekistan",
    ],
  },
  "middle-east": {
    name: "Middle East",
    countries: ["United Arab Emirates", "Iran", "Israel", "Saudi Arabia", "Jordan", "Egypt"],
  },
  russia: {
    name: "Russia & CIS",
    countries: ["Russia", "Ukraine", "Belarus", "Armenia", "Kazakhstan", "Uzbekistan"],
  },
  africa: {
    name: "Africa",
    countries: ["South Africa", "Egypt"],
  },
};

/**
 * Region statistics
 */
interface RegionStats {
  slug: string;
  name: string;
  totalReactors: number;
  operational: number;
  underConstruction: number;
  countries: number;
  totalCapacity: number;
}

/**
 * Load region statistics
 */
async function getRegionStats(): Promise<RegionStats[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  return Object.entries(REGIONS).map(([slug, { name, countries }]) => {
    const regionReactors = reactors.filter((r) => countries.includes(r.Country));
    const countriesWithReactors = new Set(regionReactors.map((r) => r.Country));

    return {
      slug,
      name,
      totalReactors: regionReactors.length,
      operational: regionReactors.filter(
        (r) => r.Status.toLowerCase() === "operational"
      ).length,
      underConstruction: regionReactors.filter(
        (r) => r.Status.toLowerCase() === "under construction"
      ).length,
      countries: countriesWithReactors.size,
      totalCapacity: regionReactors
        .filter((r) => r.Status.toLowerCase() === "operational" && r.Capacity)
        .reduce((sum, r) => sum + (r.Capacity || 0), 0),
    };
  }).sort((a, b) => b.totalReactors - a.totalReactors);
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Power by Region | Global Overview | ReactorMap",
  description:
    "Explore nuclear power by geographic region: North America, Europe, Asia, Middle East, Russia, South America, and Africa. Compare reactor counts and capacity.",
  keywords: [
    "nuclear power by region",
    "nuclear reactors worldwide",
    "global nuclear energy",
    "regional nuclear statistics",
  ],
  openGraph: {
    title: "Nuclear Power by Region",
    description: "Explore nuclear power by geographic region worldwide.",
    type: "website",
    url: "https://reactormap.com/regions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Power by Region",
    description: "Explore nuclear power by geographic region worldwide.",
  },
  alternates: {
    canonical: "https://reactormap.com/regions",
  },
};

/**
 * Regions index page
 */
export default async function RegionsPage() {
  const regions = await getRegionStats();

  const totalReactors = regions.reduce((sum, r) => sum + r.totalReactors, 0);
  const totalOperational = regions.reduce((sum, r) => sum + r.operational, 0);
  const totalCapacity = regions.reduce((sum, r) => sum + r.totalCapacity, 0);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nuclear Power by Region",
    description: `Overview of nuclear power across ${regions.length} world regions`,
    numberOfItems: regions.length,
    itemListElement: regions.map((region, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: region.name,
        url: `https://reactormap.com/region/${region.slug}`,
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
            <li className="text-cream">Regions</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Nuclear Power by Region
            </h1>
            <p className="text-lg text-silver">
              {regions.length} regions • {totalReactors} reactors • {totalOperational} operational • {(totalCapacity / 1000).toFixed(0)} GW
            </p>
          </div>

          {/* Region Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {regions.map((region) => {
              const percentage = ((region.totalReactors / totalReactors) * 100).toFixed(1);

              return (
                <Link
                  key={region.slug}
                  href={`/region/${region.slug}`}
                  className="glass-panel rounded-xl p-6 hover:bg-white/5 transition-colors group"
                >
                  <h2 className="text-2xl font-semibold mb-2 group-hover:text-lava transition-colors">
                    {region.name}
                  </h2>

                  <p className="text-sm text-silver mb-4">
                    {region.countries} countries with nuclear power
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-3xl font-mono font-bold text-cream">{region.totalReactors}</div>
                      <div className="text-sm text-silver">total reactors</div>
                    </div>
                    <div>
                      <div className="text-3xl font-mono font-bold text-green-400">{region.operational}</div>
                      <div className="text-sm text-silver">operational</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-silver mb-2">
                    <span>{region.underConstruction} under construction</span>
                    <span>{percentage}% of global</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lava rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {region.totalCapacity > 0 && (
                    <div className="mt-4 text-right">
                      <span className="text-lg font-mono text-cream">
                        {(region.totalCapacity / 1000).toFixed(1)} GW
                      </span>
                      <span className="text-sm text-silver ml-2">capacity</span>
                    </div>
                  )}
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
              href="/statuses"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Status →
            </Link>
            <Link
              href="/types"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Reactor Type →
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
