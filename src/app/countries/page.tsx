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
  Status: string;
  Capacity: number | null;
}

/**
 * Country statistics
 */
interface CountryStats {
  name: string;
  slug: string;
  total: number;
  operational: number;
  underConstruction: number;
  planned: number;
  shutdown: number;
  totalCapacity: number;
}

/**
 * Load country statistics from reactor data
 */
async function getCountryStats(): Promise<CountryStats[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  const countryMap = new Map<string, CountryStats>();

  reactors.forEach((r) => {
    const status = r.Status.toLowerCase().replace(/ /g, "_");

    if (!countryMap.has(r.Country)) {
      countryMap.set(r.Country, {
        name: r.Country,
        slug: slugify(r.Country),
        total: 0,
        operational: 0,
        underConstruction: 0,
        planned: 0,
        shutdown: 0,
        totalCapacity: 0,
      });
    }

    const stats = countryMap.get(r.Country)!;
    stats.total++;

    if (status === "operational") {
      stats.operational++;
      stats.totalCapacity += r.Capacity || 0;
    } else if (status === "under_construction") {
      stats.underConstruction++;
    } else if (status === "planned") {
      stats.planned++;
    } else if (status === "shutdown") {
      stats.shutdown++;
    }
  });

  return Array.from(countryMap.values()).sort((a, b) => b.operational - a.operational);
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Power by Country | All 41 Countries | ReactorMap",
  description:
    "Explore nuclear power plants in 41 countries worldwide. Compare reactor counts, operational capacity, and construction status by country. Interactive data from IAEA.",
  keywords: [
    "nuclear power by country",
    "nuclear reactors by country",
    "nuclear energy countries",
    "nuclear power statistics",
    "IAEA reactor database",
  ],
  openGraph: {
    title: "Nuclear Power by Country",
    description:
      "Explore nuclear power plants in 41 countries worldwide. Compare reactor counts and capacity.",
    type: "website",
    url: "https://reactormap.com/countries",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Power by Country",
    description:
      "Explore nuclear power plants in 41 countries worldwide.",
  },
  alternates: {
    canonical: "https://reactormap.com/countries",
  },
};

/**
 * Countries index page
 */
export default async function CountriesPage() {
  const countries = await getCountryStats();

  const totalReactors = countries.reduce((sum, c) => sum + c.total, 0);
  const totalOperational = countries.reduce((sum, c) => sum + c.operational, 0);
  const totalCapacity = countries.reduce((sum, c) => sum + c.totalCapacity, 0);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nuclear Power by Country",
    description: `List of ${countries.length} countries with nuclear power plants`,
    numberOfItems: countries.length,
    itemListElement: countries.slice(0, 20).map((country, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Country",
        name: country.name,
        url: `https://reactormap.com/country/${country.slug}`,
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
        name: "Countries",
        item: "https://reactormap.com/countries",
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
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Countries" }]} />

        <Hero
          title="Nuclear Power by Country"
          subtitle={
            <>
              <span className="text-[#22ff66] font-mono font-bold">{countries.length}</span> countries operating nuclear power plants worldwide
            </>
          }
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-lava">{countries.length}</div>
              <div className="text-sm text-silver">Countries</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">{totalReactors}</div>
              <div className="text-sm text-silver">Total Reactors</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-green-400">{totalOperational}</div>
              <div className="text-sm text-silver">Operational</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">{(totalCapacity / 1000).toFixed(0)} GW</div>
              <div className="text-sm text-silver">Total Capacity</div>
            </div>
          </div>
        </Hero>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Country Table */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-silver">Country</th>
                    <th className="text-center px-4 py-3 font-medium text-silver">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-green-400 hidden sm:table-cell">Operational</th>
                    <th className="text-center px-4 py-3 font-medium text-yellow-400 hidden md:table-cell">Construction</th>
                    <th className="text-center px-4 py-3 font-medium text-blue-400 hidden md:table-cell">Planned</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-400 hidden lg:table-cell">Shutdown</th>
                    <th className="text-right px-4 py-3 font-medium text-silver hidden sm:table-cell">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country, index) => (
                    <tr
                      key={country.slug}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/country/${country.slug}`}
                          className="font-medium hover:text-lava transition-colors flex items-center gap-2"
                        >
                          <span className="text-silver text-sm w-6">{index + 1}.</span>
                          {country.name}
                        </Link>
                      </td>
                      <td className="text-center px-4 py-3 font-mono">{country.total}</td>
                      <td className="text-center px-4 py-3 font-mono text-green-400 hidden sm:table-cell">
                        {country.operational || "-"}
                      </td>
                      <td className="text-center px-4 py-3 font-mono text-yellow-400 hidden md:table-cell">
                        {country.underConstruction || "-"}
                      </td>
                      <td className="text-center px-4 py-3 font-mono text-blue-400 hidden md:table-cell">
                        {country.planned || "-"}
                      </td>
                      <td className="text-center px-4 py-3 font-mono text-gray-400 hidden lg:table-cell">
                        {country.shutdown || "-"}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-silver hidden sm:table-cell">
                        {country.totalCapacity ? `${country.totalCapacity.toLocaleString()} MW` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap gap-4">
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
