import { Metadata } from "next";
import Link from "next/link";

/**
 * FAQ item structure
 */
interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ data
 */
const faqs: FAQItem[] = [
  {
    question: "How many nuclear reactors are there in the world?",
    answer:
      "As of our latest data, there are 811 nuclear reactors tracked worldwide. This includes 439 operational reactors, 64 under construction, 81 planned, and 211 that have been permanently shut down. The data comes from the IAEA PRIS database.",
  },
  {
    question: "Which country has the most nuclear reactors?",
    answer:
      "The United States has the most nuclear reactors with 118 total, followed by France with 74 and China with 78. However, China is rapidly expanding its nuclear fleet with more reactors under construction than any other country.",
  },
  {
    question: "What is the most common type of nuclear reactor?",
    answer:
      "The Pressurized Water Reactor (PWR) is by far the most common type, accounting for about 60% of all nuclear reactors worldwide (484 reactors). The Boiling Water Reactor (BWR) is the second most common with 120 reactors.",
  },
  {
    question: "Where does the reactor data come from?",
    answer:
      "Our primary data source is the International Atomic Energy Agency's Power Reactor Information System (PRIS), the world's most comprehensive database of nuclear power reactors. We also enrich data with information from Wikidata and Wikipedia for operator details and descriptions.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "We regularly sync our data with the IAEA PRIS database. Reactor status changes, new construction starts, and capacity updates are reflected as they become available from official sources.",
  },
  {
    question: "What do the different reactor statuses mean?",
    answer:
      "Operational means the reactor is actively generating power. Under Construction means physical construction is underway. Planned means the project is approved but construction hasn't started. Suspended means work has been temporarily halted. Shutdown means the reactor is permanently closed. Cancelled means the project was terminated before completion.",
  },
  {
    question: "What is reactor capacity measured in?",
    answer:
      "Reactor capacity is measured in megawatts electrical (MWe), which represents the electrical power output. A typical modern reactor has a capacity between 1,000-1,400 MWe. The total global operational nuclear capacity is approximately 400 GW (gigawatts).",
  },
  {
    question: "Which reactor type is the safest?",
    answer:
      "All modern reactor designs must meet strict international safety standards set by the IAEA. Newer Generation III and III+ designs like the AP1000, EPR, and APR1400 incorporate passive safety systems that don't require operator action or external power. The choice of reactor type depends on many factors beyond safety, including cost, efficiency, and fuel availability.",
  },
  {
    question: "What happened to nuclear power after Fukushima?",
    answer:
      "The 2011 Fukushima accident led several countries to reconsider their nuclear programs. Germany accelerated its phase-out, Japan temporarily shut down all reactors (many have since restarted), and new safety requirements were implemented globally. However, many countries continue to expand nuclear power as a low-carbon energy source.",
  },
  {
    question: "Can I use this data for research or projects?",
    answer:
      "The underlying reactor data comes from the IAEA PRIS database, which is publicly available. For academic or research purposes, we recommend citing the IAEA PRIS as the primary source. ReactorMap is an educational visualization tool built on this public data.",
  },
  {
    question: "Why are some reactors missing information?",
    answer:
      "Some older or decommissioned reactors may have incomplete records in the IAEA database. Additionally, some enrichment data from Wikidata may not be available for all facilities. We display all available information and continuously work to improve data completeness.",
  },
  {
    question: "How does nuclear power compare to other energy sources?",
    answer:
      "Nuclear power provides about 10% of global electricity and is the second-largest source of low-carbon power after hydroelectric. A single reactor can power hundreds of thousands of homes and operates 24/7 regardless of weather conditions, unlike solar or wind power.",
  },
];

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: "Nuclear Power FAQ | Common Questions Answered | ReactorMap",
  description:
    "Frequently asked questions about nuclear power plants, reactor types, global statistics, and data sources. Learn about nuclear energy from IAEA data.",
  keywords: [
    "nuclear power FAQ",
    "nuclear reactor questions",
    "how many nuclear reactors",
    "nuclear power facts",
    "IAEA reactor data",
  ],
  openGraph: {
    title: "Nuclear Power FAQ",
    description: "Frequently asked questions about nuclear power plants and reactors.",
    type: "website",
    url: "https://reactormap.com/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Power FAQ",
    description: "Frequently asked questions about nuclear power plants.",
  },
  alternates: {
    canonical: "https://reactormap.com/faq",
  },
};

/**
 * FAQ page component
 */
export default function FAQPage() {
  // FAQ JSON-LD structured data
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
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
        name: "FAQ",
        item: "https://reactormap.com/faq",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
            <li className="text-cream">FAQ</li>
          </ol>
        </nav>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-silver mb-8">
            Common questions about nuclear power plants, reactor types, and our data sources.
          </p>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="glass-panel rounded-xl group"
              >
                <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between gap-4 hover:bg-white/5 rounded-xl transition-colors">
                  <h2 className="text-lg font-medium pr-4">{faq.question}</h2>
                  <svg
                    className="w-5 h-5 text-silver shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-silver leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          {/* Explore Links */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Explore the Data</h2>
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
                Browse by Type
              </Link>
              <Link
                href="/statistics"
                className="px-4 py-2 glass-panel rounded-lg hover:bg-white/10 transition-colors"
              >
                Global Statistics
              </Link>
            </div>
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
