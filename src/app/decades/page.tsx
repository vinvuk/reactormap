import { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

/**
 * Raw reactor data from JSON file
 */
interface RawReactor {
  Status: string;
  OperationalFrom: string | null;
  OperationalTo: string | null;
}

/**
 * Load reactor data
 */
async function getReactorData(): Promise<RawReactor[]> {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  return JSON.parse(fileContents);
}

/**
 * Decade statistics
 */
interface DecadeStats {
  decade: string;
  slug: string;
  started: number;
  shutdown: number;
  net: number;
  peakYear: number;
  peakYearCount: number;
}

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Power Timeline | History by Decade | ReactorMap",
  description:
    "Explore the history of nuclear power decade by decade. From the first commercial reactors in the 1950s to modern construction in the 2020s.",
  keywords: [
    "nuclear power history",
    "nuclear reactor timeline",
    "nuclear power by decade",
    "nuclear energy history",
  ],
  openGraph: {
    title: "Nuclear Power Timeline",
    description: "Explore the history of nuclear power decade by decade.",
    type: "website",
    url: "https://reactormap.com/decades",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Power Timeline",
    description: "Explore the history of nuclear power decade by decade.",
  },
  alternates: {
    canonical: "https://reactormap.com/decades",
  },
};

/**
 * Decades index page
 */
export default async function DecadesPage() {
  const reactors = await getReactorData();
  const decades = ["1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];

  const decadeStats: DecadeStats[] = decades.map((decade) => {
    const startYear = parseInt(decade);
    const endYear = startYear + 10;

    // Count reactors started and shutdown in this decade
    const started = reactors.filter((r) => {
      if (!r.OperationalFrom) return false;
      const year = new Date(r.OperationalFrom).getFullYear();
      return year >= startYear && year < endYear;
    }).length;

    const shutdown = reactors.filter((r) => {
      if (!r.OperationalTo) return false;
      const year = new Date(r.OperationalTo).getFullYear();
      return year >= startYear && year < endYear;
    }).length;

    // Find peak year
    const yearCounts = new Map<number, number>();
    for (let y = startYear; y < endYear; y++) {
      yearCounts.set(y, 0);
    }

    reactors.forEach((r) => {
      if (r.OperationalFrom) {
        const year = new Date(r.OperationalFrom).getFullYear();
        if (year >= startYear && year < endYear) {
          yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
        }
      }
    });

    let peakYear = startYear;
    let peakYearCount = 0;
    yearCounts.forEach((count, year) => {
      if (count > peakYearCount) {
        peakYear = year;
        peakYearCount = count;
      }
    });

    return {
      decade,
      slug: `${decade}s`,
      started,
      shutdown,
      net: started - shutdown,
      peakYear,
      peakYearCount,
    };
  });

  const maxStarted = Math.max(...decadeStats.map((d) => d.started));
  const totalStarted = decadeStats.reduce((sum, d) => sum + d.started, 0);

  // Historical context for each decade
  const decadeContext: Record<string, string> = {
    "1950": "Dawn of commercial nuclear power",
    "1960": "First wave of nuclear expansion",
    "1970": "Oil crisis drives nuclear growth",
    "1980": "Peak construction era",
    "1990": "Post-Chernobyl slowdown",
    "2000": "Nuclear renaissance begins",
    "2010": "Post-Fukushima reassessment",
    "2020": "Climate-driven revival",
  };

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nuclear Power Timeline by Decade",
    description: "History of nuclear power plant construction and operation",
    numberOfItems: decadeStats.length,
    itemListElement: decadeStats.map((d, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        name: `Nuclear Power in the ${d.slug}`,
        url: `https://reactormap.com/decade/${d.slug}`,
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
        name: "Decades",
        item: "https://reactormap.com/decades",
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
            <li className="text-cream">Timeline</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              Nuclear Power Timeline
            </h1>
            <p className="text-lg text-silver">
              {totalStarted} reactors commissioned across 8 decades of nuclear history
            </p>
          </div>

          {/* Timeline Visualization */}
          <div className="glass-panel rounded-xl p-6 mb-8">
            <div className="flex items-end justify-between gap-2 h-48">
              {decadeStats.map((decade) => {
                const heightPercent = maxStarted > 0 ? (decade.started / maxStarted) * 100 : 0;
                const isPeak = decade.started === maxStarted;

                return (
                  <Link
                    key={decade.decade}
                    href={`/decade/${decade.slug}`}
                    className="flex-1 group"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-full rounded-t transition-colors ${
                          isPeak ? "bg-[#22ff66]" : "bg-[#22ff66]/50 group-hover:bg-[#22ff66]/70"
                        }`}
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />
                      <div className="mt-2 text-center">
                        <div className="text-xs text-silver">{decade.decade}s</div>
                        <div className={`text-sm font-mono ${isPeak ? "text-[#22ff66] font-bold" : "text-cream"}`}>
                          {decade.started}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Decade Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {decadeStats.map((decade) => {
              const isPeak = decade.started === maxStarted;

              return (
                <Link
                  key={decade.decade}
                  href={`/decade/${decade.slug}`}
                  className={`glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors ${
                    isPeak ? "ring-1 ring-[#22ff66]/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold">The {decade.slug}</h2>
                    {isPeak && (
                      <span className="px-2 py-0.5 bg-[#22ff66]/20 text-[#22ff66] text-xs rounded-full">
                        Peak Era
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-silver mb-3">{decadeContext[decade.decade]}</p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="text-xl font-mono text-[#22ff66]">+{decade.started}</div>
                      <div className="text-xs text-silver">Started</div>
                    </div>
                    <div>
                      <div className="text-xl font-mono text-red-400">{decade.shutdown > 0 ? `-${decade.shutdown}` : "0"}</div>
                      <div className="text-xs text-silver">Shutdown</div>
                    </div>
                  </div>
                  {decade.peakYearCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-silver">
                      Peak year: <span className="text-cream">{decade.peakYear}</span> ({decade.peakYearCount} reactors)
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Historical Events */}
          <section className="glass-panel rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Key Events in Nuclear History</h2>
            <div className="space-y-4">
              {[
                { year: 1954, event: "First commercial nuclear power plant (Obninsk, USSR)" },
                { year: 1956, event: "Calder Hall opens in UK - first grid-connected plant" },
                { year: 1973, event: "Oil crisis accelerates nuclear expansion" },
                { year: 1979, event: "Three Mile Island accident (USA)" },
                { year: 1986, event: "Chernobyl disaster (USSR)" },
                { year: 2011, event: "Fukushima Daiichi accident (Japan)" },
                { year: 2020, event: "Nuclear included in many countries' net-zero plans" },
              ].map(({ year, event }) => (
                <div key={year} className="flex items-start gap-4">
                  <span className="font-mono text-lava w-12">{year}</span>
                  <span className="text-silver">{event}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <div className="flex flex-wrap gap-4">
            <Link href="/statistics" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
              View Statistics →
            </Link>
            <Link href="/countries" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
              Browse by Country →
            </Link>
            <Link href="/types" className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors">
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
