import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { slugify, createReactorSlug } from "@/lib/slugify";
import { STATUS_CONFIG } from "@/lib/types";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Id: number;
  Name: string;
  Country: string;
  Status: string;
  ReactorType: string | null;
  Capacity: number | null;
  OperationalFrom: string | null;
  OperationalTo: string | null;
}

/**
 * Decade configuration
 */
const DECADES: Record<string, { name: string; startYear: number; endYear: number; context: string }> = {
  "1950s": {
    name: "1950s",
    startYear: 1950,
    endYear: 1960,
    context: "The dawn of commercial nuclear power. The first nuclear power plants were connected to electrical grids, marking humanity's entry into the atomic age.",
  },
  "1960s": {
    name: "1960s",
    startYear: 1960,
    endYear: 1970,
    context: "The first major wave of nuclear expansion as countries raced to develop nuclear capabilities. Both superpowers and their allies built substantial nuclear fleets.",
  },
  "1970s": {
    name: "1970s",
    startYear: 1970,
    endYear: 1980,
    context: "The oil crisis of 1973 accelerated nuclear construction worldwide. Many countries turned to nuclear as a solution to energy independence.",
  },
  "1980s": {
    name: "1980s",
    startYear: 1980,
    endYear: 1990,
    context: "The peak era of nuclear construction, but also marked by the Chernobyl disaster in 1986, which fundamentally changed public perception of nuclear power.",
  },
  "1990s": {
    name: "1990s",
    startYear: 1990,
    endYear: 2000,
    context: "Post-Chernobyl slowdown in new construction. Many countries reassessed their nuclear programs while existing plants continued operation.",
  },
  "2000s": {
    name: "2000s",
    startYear: 2000,
    endYear: 2010,
    context: "The beginning of the 'nuclear renaissance' with renewed interest in nuclear power as a low-carbon energy source to combat climate change.",
  },
  "2010s": {
    name: "2010s",
    startYear: 2010,
    endYear: 2020,
    context: "The Fukushima accident in 2011 led to another global reassessment. Japan shut down all reactors, Germany accelerated phase-out, while China continued rapid expansion.",
  },
  "2020s": {
    name: "2020s",
    startYear: 2020,
    endYear: 2030,
    context: "Climate-driven nuclear revival. Many countries now view nuclear as essential for achieving net-zero emissions, leading to new construction and lifetime extensions.",
  },
};

/**
 * Load reactor data
 */
async function getReactorData(): Promise<RawReactor[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

/**
 * Generate static params for all decades
 */
export async function generateStaticParams() {
  return Object.keys(DECADES).map((slug) => ({ slug }));
}

/**
 * Generate metadata for decade page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decade = DECADES[slug];

  if (!decade) {
    return { title: "Decade Not Found | ReactorMap" };
  }

  const reactors = await getReactorData();
  const startedReactors = reactors.filter((r) => {
    if (!r.OperationalFrom) return false;
    const year = new Date(r.OperationalFrom).getFullYear();
    return year >= decade.startYear && year < decade.endYear;
  });

  const description = `Nuclear power in the ${decade.name}: ${startedReactors.length} reactors commissioned. ${decade.context}`;

  return {
    title: `Nuclear Power in the ${decade.name} | ${startedReactors.length} Reactors | ReactorMap`,
    description,
    keywords: [
      `nuclear power ${decade.name}`,
      `nuclear reactor history`,
      `nuclear energy ${decade.name}`,
      "nuclear power timeline",
    ],
    openGraph: {
      title: `Nuclear Power in the ${decade.name}`,
      description,
      type: "website",
      url: `https://reactormap.com/decade/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Nuclear Power in the ${decade.name}`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/decade/${slug}`,
    },
  };
}

/**
 * Decade detail page
 */
export default async function DecadePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decade = DECADES[slug];

  if (!decade) {
    notFound();
  }

  const reactors = await getReactorData();

  // Get reactors started in this decade
  const startedReactors = reactors.filter((r) => {
    if (!r.OperationalFrom) return false;
    const year = new Date(r.OperationalFrom).getFullYear();
    return year >= decade.startYear && year < decade.endYear;
  });

  // Get reactors shutdown in this decade
  const shutdownReactors = reactors.filter((r) => {
    if (!r.OperationalTo) return false;
    const year = new Date(r.OperationalTo).getFullYear();
    return year >= decade.startYear && year < decade.endYear;
  });

  // Group by year
  const byYear = new Map<number, RawReactor[]>();
  startedReactors.forEach((r) => {
    const year = new Date(r.OperationalFrom!).getFullYear();
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(r);
  });

  const yearData = Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, rList]) => ({
      year,
      reactors: rList.sort((a, b) => (b.Capacity || 0) - (a.Capacity || 0)),
    }));

  // Country breakdown
  const countryStats = new Map<string, number>();
  startedReactors.forEach((r) => {
    countryStats.set(r.Country, (countryStats.get(r.Country) || 0) + 1);
  });

  const topCountries = Array.from(countryStats.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Type breakdown
  const typeStats = new Map<string, number>();
  startedReactors.forEach((r) => {
    const type = r.ReactorType || "Unknown";
    typeStats.set(type, (typeStats.get(type) || 0) + 1);
  });

  const topTypes = Array.from(typeStats.entries())
    .sort(([, a], [, b]) => b - a);

  // Total capacity
  const totalCapacity = startedReactors.reduce((sum, r) => sum + (r.Capacity || 0), 0);

  // Find adjacent decades for navigation
  const decadeKeys = Object.keys(DECADES);
  const currentIndex = decadeKeys.indexOf(slug);
  const prevDecade = currentIndex > 0 ? decadeKeys[currentIndex - 1] : null;
  const nextDecade = currentIndex < decadeKeys.length - 1 ? decadeKeys[currentIndex + 1] : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Nuclear Power in the ${decade.name}`,
    description: decade.context,
    url: `https://reactormap.com/decade/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      name: `Reactors commissioned in the ${decade.name}`,
      numberOfItems: startedReactors.length,
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
        name: "Timeline",
        item: "https://reactormap.com/decades",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: decade.name,
        item: `https://reactormap.com/decade/${slug}`,
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
              <Link href="/decades" className="hover:text-cream transition-colors">Timeline</Link>
            </li>
            <li>/</li>
            <li className="text-cream">{decade.name}</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Nuclear Power in the {decade.name}
            </h1>
            <p className="text-lg text-silver max-w-3xl">
              {decade.context}
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-[#22ff66]">{startedReactors.length}</div>
              <div className="text-sm text-silver">Reactors Started</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-red-400">{shutdownReactors.length}</div>
              <div className="text-sm text-silver">Reactors Shutdown</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">{(totalCapacity / 1000).toFixed(0)}</div>
              <div className="text-sm text-silver">GW Capacity Added</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-lava">{topCountries.length}</div>
              <div className="text-sm text-silver">Countries Building</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Top Countries */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Top Countries</h2>
              <div className="space-y-2">
                {topCountries.map(([country, count], index) => (
                  <Link
                    key={country}
                    href={`/country/${slugify(country)}`}
                    className="flex items-center justify-between py-2 hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-silver text-sm w-5">{index + 1}.</span>
                      <span>{country}</span>
                    </span>
                    <span className="font-mono text-[#22ff66]">{count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Reactor Types */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Reactor Types</h2>
              <div className="space-y-2">
                {topTypes.slice(0, 6).map(([type, count]) => (
                  <Link
                    key={type}
                    href={`/type/${slugify(type)}`}
                    className="flex items-center justify-between py-2 hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                  >
                    <span>{type}</span>
                    <span className="font-mono text-lava">{count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Year-by-year breakdown mini chart */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Year by Year</h2>
              <div className="space-y-1">
                {yearData.map(({ year, reactors: rList }) => {
                  const maxInYear = Math.max(...yearData.map((y) => y.reactors.length));
                  const widthPercent = (rList.length / maxInYear) * 100;

                  return (
                    <div key={year} className="flex items-center gap-2">
                      <span className="text-xs text-silver w-10 font-mono">{year}</span>
                      <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                        <div
                          className="h-full bg-[#22ff66]/60 rounded"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-6 text-right">{rList.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reactor List by Year */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Reactors Commissioned</h2>
            {yearData.map(({ year, reactors: rList }) => (
              <div key={year} className="mb-6">
                <h3 className="text-lg font-mono text-lava mb-3">
                  {year} <span className="text-silver text-sm font-sans">({rList.length} reactors)</span>
                </h3>
                <div className="grid gap-2">
                  {rList.slice(0, 10).map((reactor) => {
                    const status = reactor.Status.toLowerCase().replace(/ /g, "_");
                    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
                      label: reactor.Status,
                      color: "#888888",
                    };

                    return (
                      <Link
                        key={reactor.Id}
                        href={`/reactor/${createReactorSlug(reactor.Name, String(reactor.Id))}`}
                        className="glass-panel rounded-lg p-3 hover:bg-white/5 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusConfig.color }}
                          />
                          <div>
                            <span className="font-medium">{reactor.Name}</span>
                            <span className="text-silver text-sm ml-2">{reactor.Country}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {reactor.ReactorType && (
                            <span className="text-silver">{reactor.ReactorType}</span>
                          )}
                          {reactor.Capacity && (
                            <span className="font-mono text-lava-light">{reactor.Capacity} MW</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                  {rList.length > 10 && (
                    <p className="text-sm text-silver text-center py-2">
                      + {rList.length - 10} more reactors
                    </p>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Decade Navigation */}
          <div className="flex items-center justify-between mb-8">
            {prevDecade ? (
              <Link
                href={`/decade/${prevDecade}`}
                className="flex items-center gap-2 px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {DECADES[prevDecade].name}
              </Link>
            ) : (
              <div />
            )}
            <Link
              href="/decades"
              className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
            >
              All Decades
            </Link>
            {nextDecade ? (
              <Link
                href={`/decade/${nextDecade}`}
                className="flex items-center gap-2 px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
              >
                {DECADES[nextDecade].name}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
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
