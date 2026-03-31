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
  Country: string;
  Status: string;
  Capacity: number | null;
  WikidataOperator: string | null;
}

/**
 * Operator statistics
 */
interface OperatorStats {
  name: string;
  slug: string;
  totalReactors: number;
  operational: number;
  countries: string[];
  totalCapacity: number;
}

/**
 * Load operator statistics
 */
async function getOperatorStats(): Promise<OperatorStats[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  const operatorMap = new Map<string, OperatorStats>();

  reactors.forEach((r) => {
    if (!r.WikidataOperator) return;

    const status = r.Status.toLowerCase().replace(/ /g, "_");

    if (!operatorMap.has(r.WikidataOperator)) {
      operatorMap.set(r.WikidataOperator, {
        name: r.WikidataOperator,
        slug: slugify(r.WikidataOperator),
        totalReactors: 0,
        operational: 0,
        countries: [],
        totalCapacity: 0,
      });
    }

    const stats = operatorMap.get(r.WikidataOperator)!;
    stats.totalReactors++;

    if (!stats.countries.includes(r.Country)) {
      stats.countries.push(r.Country);
    }

    if (status === "operational") {
      stats.operational++;
      stats.totalCapacity += r.Capacity || 0;
    }
  });

  return Array.from(operatorMap.values())
    .filter((o) => o.totalReactors >= 2) // Only operators with 2+ reactors
    .sort((a, b) => b.totalReactors - a.totalReactors);
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Power Operators | Companies & Utilities | ReactorMap",
  description:
    "Explore nuclear power plant operators worldwide. See reactor counts, operational capacity, and fleet composition for major nuclear utilities.",
  keywords: [
    "nuclear operators",
    "nuclear utilities",
    "nuclear power companies",
    "EDF",
    "Rosatom",
    "Exelon",
  ],
  openGraph: {
    title: "Nuclear Power Operators",
    description: "Explore nuclear power plant operators worldwide.",
    type: "website",
    url: "https://reactormap.com/operators",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Power Operators",
    description: "Explore nuclear power plant operators worldwide.",
  },
  alternates: {
    canonical: "https://reactormap.com/operators",
  },
};

/**
 * Operators index page
 */
export default async function OperatorsPage() {
  const operators = await getOperatorStats();

  const totalReactors = operators.reduce((sum, o) => sum + o.totalReactors, 0);
  const totalCapacity = operators.reduce((sum, o) => sum + o.totalCapacity, 0);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nuclear Power Operators",
    description: `List of ${operators.length} nuclear power plant operators`,
    numberOfItems: operators.length,
    itemListElement: operators.slice(0, 20).map((op, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Organization",
        name: op.name,
        url: `https://reactormap.com/operator/${op.slug}`,
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
        name: "Operators",
        item: "https://reactormap.com/operators",
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
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Operators" }]} />

        <Hero
          title="Nuclear Power Operators"
          subtitle={
            <>
              <span className="text-[#22ff66] font-mono font-bold">{operators.length}</span> utilities and companies worldwide
            </>
          }
          stats={[
            { value: operators.length, label: "Operators", highlight: true },
            { value: totalReactors, label: "Reactors" },
            { value: `${(totalCapacity / 1000).toFixed(0)}`, label: "GW Capacity" },
          ]}
        />

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Operator Table */}
          <div className="glass-panel rounded-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-silver">Operator</th>
                    <th className="text-center px-4 py-3 font-medium text-silver">Reactors</th>
                    <th className="text-center px-4 py-3 font-medium text-green-400 hidden sm:table-cell">Operational</th>
                    <th className="text-center px-4 py-3 font-medium text-silver hidden md:table-cell">Countries</th>
                    <th className="text-right px-4 py-3 font-medium text-silver hidden sm:table-cell">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op, index) => (
                    <tr
                      key={op.slug}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/operator/${op.slug}`}
                          className="font-medium hover:text-lava transition-colors flex items-center gap-2"
                        >
                          <span className="text-silver text-sm w-6">{index + 1}.</span>
                          <span className="truncate max-w-[200px] md:max-w-[300px]">{op.name}</span>
                        </Link>
                      </td>
                      <td className="text-center px-4 py-3 font-mono">{op.totalReactors}</td>
                      <td className="text-center px-4 py-3 font-mono text-green-400 hidden sm:table-cell">
                        {op.operational || "-"}
                      </td>
                      <td className="text-center px-4 py-3 text-silver hidden md:table-cell">
                        {op.countries.length}
                      </td>
                      <td className="text-right px-4 py-3 font-mono text-silver hidden sm:table-cell">
                        {op.totalCapacity ? `${op.totalCapacity.toLocaleString()} MW` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

          <DataSource source="IAEA PRIS database & Wikidata" />
        </div>
      </main>
    </>
  );
}
