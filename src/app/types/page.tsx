import { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { slugify } from "@/lib/slugify";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Id: number;
  Status: string;
  ReactorType: string | null;
  Capacity: number | null;
}

/**
 * Reactor type statistics
 */
interface TypeStats {
  type: string;
  slug: string;
  fullName: string;
  count: number;
  operational: number;
  totalCapacity: number;
}

/**
 * Reactor type full names
 */
const TYPE_FULL_NAMES: Record<string, string> = {
  PWR: "Pressurized Water Reactor",
  BWR: "Boiling Water Reactor",
  PHWR: "Pressurized Heavy Water Reactor",
  GCR: "Gas-Cooled Reactor",
  LWGR: "Light Water Graphite Reactor",
  FBR: "Fast Breeder Reactor",
  HTGR: "High Temperature Gas-Cooled Reactor",
  ABWR: "Advanced Boiling Water Reactor",
  HWGCR: "Heavy Water Gas-Cooled Reactor",
  HWLWR: "Heavy Water Light Water Reactor",
  OCR: "Organic Cooled Reactor",
  APWR: "Advanced Pressurized Water Reactor",
  SGHWR: "Steam Generating Heavy Water Reactor",
  Unknown: "Unknown Type",
};

/**
 * Load reactor type statistics
 */
async function getTypeStats(): Promise<TypeStats[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  const typeMap = new Map<string, TypeStats>();

  reactors.forEach((r) => {
    const type = r.ReactorType || "Unknown";
    const status = r.Status.toLowerCase().replace(/ /g, "_");

    if (!typeMap.has(type)) {
      typeMap.set(type, {
        type,
        slug: slugify(type),
        fullName: TYPE_FULL_NAMES[type] || type,
        count: 0,
        operational: 0,
        totalCapacity: 0,
      });
    }

    const stats = typeMap.get(type)!;
    stats.count++;

    if (status === "operational") {
      stats.operational++;
      stats.totalCapacity += r.Capacity || 0;
    }
  });

  return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Reactor Types | PWR, BWR, PHWR & More | ReactorMap",
  description:
    "Explore different nuclear reactor technologies: PWR, BWR, PHWR, GCR, LWGR, FBR, and more. Compare reactor designs, counts, and global distribution.",
  keywords: [
    "nuclear reactor types",
    "PWR reactor",
    "BWR reactor",
    "PHWR reactor",
    "nuclear technology",
    "reactor design",
  ],
  openGraph: {
    title: "Nuclear Reactor Types",
    description: "Explore different nuclear reactor technologies worldwide.",
    type: "website",
    url: "https://reactormap.com/types",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Reactor Types",
    description: "Explore different nuclear reactor technologies worldwide.",
  },
  alternates: {
    canonical: "https://reactormap.com/types",
  },
};

/**
 * Reactor types index page
 */
export default async function TypesPage() {
  const types = await getTypeStats();

  const totalReactors = types.reduce((sum, t) => sum + t.count, 0);
  const totalCapacity = types.reduce((sum, t) => sum + t.totalCapacity, 0);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nuclear Reactor Types",
    description: `Overview of ${types.length} nuclear reactor technologies`,
    numberOfItems: types.length,
    itemListElement: types.map((type, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: type.fullName,
        url: `https://reactormap.com/type/${type.slug}`,
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
            <li className="text-cream">Reactor Types</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Nuclear Reactor Types
            </h1>
            <p className="text-lg text-silver">
              {types.length} reactor technologies • {totalReactors} reactors • {(totalCapacity / 1000).toFixed(0)} GW operational capacity
            </p>
          </div>

          {/* Type Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {types.map((type) => {
              const percentage = ((type.count / totalReactors) * 100).toFixed(1);

              return (
                <Link
                  key={type.slug}
                  href={`/type/${type.slug}`}
                  className="glass-panel rounded-xl p-6 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-lava/20 rounded text-sm font-mono text-lava">
                      {type.type}
                    </span>
                    <span className="text-silver text-sm">{percentage}%</span>
                  </div>

                  <h2 className="text-lg font-semibold mb-2 group-hover:text-lava transition-colors">
                    {type.fullName}
                  </h2>

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <div className="text-3xl font-mono font-bold text-cream">{type.count}</div>
                      <div className="text-sm text-silver">reactors</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-mono text-green-400">{type.operational}</div>
                      <div className="text-sm text-silver">operational</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lava rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
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
              href="/statuses"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Status →
            </Link>
            <Link
              href="/regions"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              Browse by Region →
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
