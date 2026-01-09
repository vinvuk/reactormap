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

  // Historical events with types for styling
  const historicalEvents = [
    { year: 1954, event: "First commercial nuclear power plant", location: "Obninsk, USSR", type: "milestone" },
    { year: 1956, event: "Calder Hall opens - first grid-connected plant", location: "UK", type: "milestone" },
    { year: 1973, event: "Oil crisis accelerates nuclear expansion", location: "Global", type: "policy" },
    { year: 1979, event: "Three Mile Island accident", location: "USA", type: "accident" },
    { year: 1986, event: "Chernobyl disaster", location: "USSR", type: "accident" },
    { year: 2011, event: "Fukushima Daiichi accident", location: "Japan", type: "accident" },
    { year: 2020, event: "Nuclear included in net-zero plans", location: "Global", type: "policy" },
  ];

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

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#22ff66]/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto px-4 py-12 relative">
            {/* Title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 bg-gradient-to-r from-cream via-white to-cream bg-clip-text text-transparent">
                Nuclear Power Timeline
              </h1>
              <p className="text-xl text-silver">
                <span className="text-[#22ff66] font-mono font-bold">{totalStarted}</span> reactors commissioned across{" "}
                <span className="text-cream">8 decades</span> of nuclear history
              </p>
            </div>

            {/* Main Timeline Visualization */}
            <div className="glass-panel rounded-2xl p-8 mb-12">
              {/* Chart Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-silver">Reactors Commissioned by Decade</h2>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#22ff66]" />
                    Peak Era
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="relative h-64">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-white/5 w-full" />
                  ))}
                </div>

                {/* Bars */}
                <div className="relative flex items-end justify-between gap-3 md:gap-6 h-full pb-16">
                  {decadeStats.map((decade) => {
                    const barHeight = maxStarted > 0 ? (decade.started / maxStarted) * 180 : 0;
                    const isPeak = decade.started === maxStarted;

                    return (
                      <Link
                        key={decade.decade}
                        href={`/decade/${decade.slug}`}
                        className="flex-1 group flex flex-col items-center justify-end"
                      >
                        {/* The bar */}
                        <div
                          className={`
                            w-full max-w-16 rounded-t-lg transition-all duration-300 relative overflow-hidden
                            group-hover:brightness-110
                            ${isPeak ? "shadow-[0_0_30px_rgba(34,255,102,0.4)]" : ""}
                          `}
                          style={{ height: `${Math.max(barHeight, 8)}px` }}
                        >
                          {/* Gradient fill */}
                          <div
                            className={`
                              absolute inset-0
                              ${isPeak
                                ? "bg-gradient-to-t from-[#22ff66] to-[#66ff99]"
                                : "bg-gradient-to-t from-[#22ff66]/70 to-[#22ff66]/30 group-hover:from-[#22ff66]/90 group-hover:to-[#22ff66]/50"
                              }
                            `}
                          />
                        </div>

                        {/* Labels */}
                        <div className="absolute bottom-0 text-center">
                          <div className={`text-xs md:text-sm font-medium ${isPeak ? "text-[#22ff66]" : "text-silver group-hover:text-cream"}`}>
                            {decade.decade}s
                          </div>
                          <div className={`text-sm md:text-lg font-mono font-bold ${isPeak ? "text-[#22ff66]" : "text-cream"}`}>
                            {decade.started}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 pb-12">
          {/* Decade Cards */}
          <h2 className="text-2xl font-semibold mb-6">Explore Each Decade</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {decadeStats.map((decade) => {
              const isPeak = decade.started === maxStarted;
              const context = decadeContext[decade.decade];
              const netChange = decade.started - decade.shutdown;

              return (
                <Link
                  key={decade.decade}
                  href={`/decade/${decade.slug}`}
                  className={`
                    group relative glass-panel rounded-xl p-5 transition-all duration-300
                    hover:bg-white/5 hover:scale-[1.02] hover:shadow-xl
                    ${isPeak ? "ring-1 ring-[#22ff66]/40 bg-[#22ff66]/5" : ""}
                  `}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold group-hover:text-[#22ff66] transition-colors">
                      The {decade.slug}
                    </h3>
                    {isPeak && (
                      <span className="px-2 py-0.5 bg-[#22ff66]/20 text-[#22ff66] text-xs font-medium rounded-full">
                        Peak Era
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-silver mb-4">{context}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-2xl font-mono font-bold text-[#22ff66]">+{decade.started}</div>
                      <div className="text-xs text-silver">Started</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className={`text-2xl font-mono font-bold ${decade.shutdown > 0 ? "text-red-400" : "text-silver"}`}>
                        {decade.shutdown > 0 ? `-${decade.shutdown}` : "0"}
                      </div>
                      <div className="text-xs text-silver">Shutdown</div>
                    </div>
                  </div>

                  {/* Net change indicator */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-silver">Net change</span>
                    <span className={`text-sm font-mono font-bold ${netChange >= 0 ? "text-[#22ff66]" : "text-red-400"}`}>
                      {netChange >= 0 ? "+" : ""}{netChange}
                    </span>
                  </div>

                  {/* Peak year */}
                  {decade.peakYearCount > 0 && (
                    <div className="mt-2 text-xs text-muted">
                      Peak: <span className="text-silver">{decade.peakYear}</span> ({decade.peakYearCount} reactors)
                    </div>
                  )}

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-[#22ff66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Historical Events Timeline */}
          <section className="glass-panel rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-8">Key Events in Nuclear History</h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#22ff66]/50 via-[#22ff66]/30 to-transparent" />

              {/* Events */}
              <div className="space-y-8">
                {historicalEvents.map((event, index) => {
                  const isLeft = index % 2 === 0;
                  const typeColors = {
                    milestone: "bg-[#22ff66] text-obsidian",
                    accident: "bg-red-500 text-white",
                    policy: "bg-blue-500 text-white",
                  };

                  return (
                    <div key={event.year} className={`relative flex items-center gap-4 md:gap-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                      {/* Timeline dot */}
                      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-obsidian border-2 border-[#22ff66] z-10" />

                      {/* Content card */}
                      <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:text-right md:pr-8" : "md:pl-8"}`}>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${typeColors[event.type as keyof typeof typeColors]}`}>
                          {event.type === "milestone" ? "Milestone" : event.type === "accident" ? "Incident" : "Policy"}
                        </div>
                        <div className="font-mono text-[#22ff66] text-lg font-bold">{event.year}</div>
                        <div className="text-cream font-medium">{event.event}</div>
                        <div className="text-sm text-silver">{event.location}</div>
                      </div>

                      {/* Spacer for other side */}
                      <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-[#22ff66]">{totalStarted}</div>
              <div className="text-sm text-silver">Total Commissioned</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">{maxStarted}</div>
              <div className="text-sm text-silver">Peak Decade (1980s)</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">70+</div>
              <div className="text-sm text-silver">Years of Nuclear Power</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-3xl font-mono font-bold text-cream">30+</div>
              <div className="text-sm text-silver">Countries</div>
            </div>
          </div>

          {/* Related Links */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/statistics" className="px-6 py-3 glass-panel rounded-xl hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#22ff66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Statistics
            </Link>
            <Link href="/countries" className="px-6 py-3 glass-panel rounded-xl hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#22ff66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Browse by Country
            </Link>
            <Link href="/types" className="px-6 py-3 glass-panel rounded-xl hover:bg-white/10 transition-all hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#22ff66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Reactor Types
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
