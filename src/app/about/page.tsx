import { Metadata } from "next";
import Link from "next/link";

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "About ReactorMap | Data Sources & Methodology",
  description:
    "Learn about ReactorMap, our data sources from IAEA PRIS, methodology, and how we track 811+ nuclear reactors worldwide on an interactive 3D globe.",
  keywords: [
    "about ReactorMap",
    "IAEA PRIS",
    "nuclear reactor data",
    "nuclear power database",
  ],
  openGraph: {
    title: "About ReactorMap",
    description: "Learn about ReactorMap and our data sources.",
    type: "website",
    url: "https://reactormap.com/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About ReactorMap",
    description: "Learn about ReactorMap and our data sources.",
  },
  alternates: {
    canonical: "https://reactormap.com/about",
  },
};

/**
 * About page component
 */
export default function AboutPage() {
  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About ReactorMap",
    description: "Information about ReactorMap and its data sources",
    mainEntity: {
      "@type": "WebApplication",
      name: "ReactorMap",
      description: "Interactive 3D map of nuclear reactors worldwide",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
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
        name: "About",
        item: "https://reactormap.com/about",
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
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
              View Map
            </Link>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="max-w-4xl mx-auto px-4 py-3 text-sm text-silver">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cream transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li className="text-cream">About</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <article className="prose prose-invert prose-lg max-w-none">
            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-6">
              About ReactorMap
            </h1>

            <p className="text-xl text-silver leading-relaxed mb-8">
              ReactorMap is an interactive 3D visualization of the world&apos;s nuclear power plants.
              Explore 811+ reactors across 41 countries, from operational facilities generating
              clean energy to historical plants that shaped the nuclear age.
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 text-cream">Data Sources</h2>
              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-2 text-lava">IAEA PRIS Database</h3>
                <p className="text-silver mb-4">
                  Our primary data source is the International Atomic Energy Agency&apos;s
                  Power Reactor Information System (PRIS). This is the world&apos;s most
                  comprehensive database of nuclear power reactors, maintained by the IAEA
                  since 1969.
                </p>
                <p className="text-silver mb-4">
                  PRIS contains detailed information on every power reactor in the world,
                  including technical specifications, operational history, and current status.
                </p>
                <a
                  href="https://pris.iaea.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lava hover:text-lava-light transition-colors"
                >
                  Visit IAEA PRIS →
                </a>
              </div>

              <div className="glass-panel rounded-xl p-6 mt-4">
                <h3 className="text-xl font-semibold mb-2 text-lava">Wikidata & Wikipedia</h3>
                <p className="text-silver mb-4">
                  We enrich our data with information from Wikidata and Wikipedia, including
                  operator information, ownership details, and descriptive text about each facility.
                </p>
              </div>

              <div className="glass-panel rounded-xl p-6 mt-4">
                <h3 className="text-xl font-semibold mb-2 text-lava">Community Corrections</h3>
                <p className="text-silver">
                  We welcome corrections from industry professionals and enthusiasts.
                  If you spot an error, please let us know and we&apos;ll verify and update our data.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 text-cream">Reactor Statuses</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#22ff66]" />
                    <span className="font-semibold">Operational</span>
                  </div>
                  <p className="text-sm text-silver">Reactor is actively generating power</p>
                </div>
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#ffee00]" />
                    <span className="font-semibold">Under Construction</span>
                  </div>
                  <p className="text-sm text-silver">Reactor is currently being built</p>
                </div>
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#00aaff]" />
                    <span className="font-semibold">Planned</span>
                  </div>
                  <p className="text-sm text-silver">Reactor is approved for construction</p>
                </div>
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff9900]" />
                    <span className="font-semibold">Suspended</span>
                  </div>
                  <p className="text-sm text-silver">Construction or operation temporarily halted</p>
                </div>
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#888888]" />
                    <span className="font-semibold">Shutdown</span>
                  </div>
                  <p className="text-sm text-silver">Reactor permanently closed</p>
                </div>
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff4444]" />
                    <span className="font-semibold">Cancelled</span>
                  </div>
                  <p className="text-sm text-silver">Project was cancelled before completion</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 text-cream">Technology</h2>
              <p className="text-silver mb-4">
                ReactorMap is built with modern web technologies:
              </p>
              <ul className="list-disc list-inside text-silver space-y-2">
                <li><strong>Next.js 16</strong> - React framework with App Router</li>
                <li><strong>Three.js</strong> - 3D graphics and WebGL rendering</li>
                <li><strong>React Three Fiber</strong> - React renderer for Three.js</li>
                <li><strong>Tailwind CSS</strong> - Utility-first styling</li>
                <li><strong>TypeScript</strong> - Type-safe development</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 text-cream">Explore the Data</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/countries"
                  className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
                >
                  Browse by Country
                </Link>
                <Link
                  href="/statuses"
                  className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
                >
                  Browse by Status
                </Link>
                <Link
                  href="/types"
                  className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
                >
                  Browse by Reactor Type
                </Link>
                <Link
                  href="/regions"
                  className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
                >
                  Browse by Region
                </Link>
                <Link
                  href="/operators"
                  className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
                >
                  Browse by Operator
                </Link>
              </div>
            </section>
          </article>

          {/* Data Source */}
          <p className="mt-12 text-sm text-muted text-center">
            Data source: IAEA PRIS database • Updated regularly
          </p>
        </div>
      </main>
    </>
  );
}
