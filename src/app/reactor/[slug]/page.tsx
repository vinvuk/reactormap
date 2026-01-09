import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { Reactor, STATUS_CONFIG } from "@/lib/types";
import { createReactorSlug, extractIdFromSlug } from "@/lib/slugify";

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
 * Find a reactor by its slug
 */
async function getReactorBySlug(slug: string): Promise<Reactor | null> {
  const id = extractIdFromSlug(slug);
  if (!id) return null;

  const reactors = await getReactors();
  return reactors.find((r) => r.id === id) || null;
}

/**
 * Generate static params for all reactors (SSG)
 * This creates 811 static pages at build time
 */
export async function generateStaticParams() {
  const reactors = await getReactors();
  return reactors.map((reactor) => ({
    slug: createReactorSlug(reactor.name, reactor.id),
  }));
}

/**
 * Generate dynamic metadata for each reactor page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reactor = await getReactorBySlug(slug);

  if (!reactor) {
    return {
      title: "Reactor Not Found | ReactorMap",
    };
  }

  const statusLabel = STATUS_CONFIG[reactor.status]?.label || reactor.status;
  const capacityText = reactor.capacity ? `${reactor.capacity} MW` : "";

  const description = reactor.wikipediaExtract
    ? reactor.wikipediaExtract.slice(0, 155) + "..."
    : `${reactor.name} is a ${statusLabel.toLowerCase()} nuclear reactor in ${reactor.country}${capacityText ? ` with ${capacityText} capacity` : ""}. View details and location on ReactorMap.`;

  return {
    title: `${reactor.name} Nuclear Reactor | ${reactor.country} | ReactorMap`,
    description,
    keywords: [
      reactor.name,
      "nuclear reactor",
      "nuclear power plant",
      reactor.country,
      reactor.reactorType || "reactor",
      statusLabel,
    ].filter(Boolean),
    openGraph: {
      title: `${reactor.name} - ${statusLabel} Nuclear Reactor`,
      description,
      type: "article",
      url: `https://reactormap.com/reactor/${slug}`,
      images: reactor.wikipediaThumbnail
        ? [{ url: reactor.wikipediaThumbnail, alt: reactor.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${reactor.name} - ${statusLabel} Nuclear Reactor`,
      description,
    },
    alternates: {
      canonical: `https://reactormap.com/reactor/${slug}`,
    },
  };
}

/**
 * Format a date string for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Reactor detail page component
 */
export default async function ReactorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reactor = await getReactorBySlug(slug);

  if (!reactor) {
    notFound();
  }

  // Fallback for unknown status values
  const statusConfig = STATUS_CONFIG[reactor.status] || {
    label: reactor.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "#888888",
    glowColor: "rgba(136, 136, 136, 0.4)",
    description: "Unknown status",
  };
  const mapUrl = `/?r=${reactor.id}`;

  // JSON-LD structured data for rich snippets
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: reactor.name,
    description: reactor.wikipediaExtract || `${reactor.name} nuclear reactor in ${reactor.country}`,
    address: {
      "@type": "PostalAddress",
      addressCountry: reactor.countryCode,
      addressRegion: reactor.wikidataRegion || undefined,
    },
    additionalType: "https://schema.org/PowerPlant",
  };

  // Only add geo if coordinates are available
  if (reactor.latitude != null && reactor.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: reactor.latitude,
      longitude: reactor.longitude,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
              href={mapUrl}
              className="flex items-center gap-2 px-4 py-2 bg-lava/20 hover:bg-lava/30 text-lava-light rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on Map
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${statusConfig.color}20`,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </span>
              <span className="text-silver">{reactor.country}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
              {reactor.name}
            </h1>

            {reactor.wikipediaExtract && (
              <p className="text-lg text-silver leading-relaxed">
                {reactor.wikipediaExtract}
              </p>
            )}
          </div>

          {/* Image */}
          {reactor.wikipediaThumbnail && (
            <div className="mb-8 rounded-xl overflow-hidden border border-white/10">
              <img
                src={reactor.wikipediaThumbnail}
                alt={reactor.name}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Technical Specifications */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-lava" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Technical Specifications
              </h2>

              <dl className="space-y-3">
                {reactor.capacity && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Capacity</dt>
                    <dd className="font-mono text-lava-light">{reactor.capacity} MW</dd>
                  </div>
                )}
                {reactor.reactorType && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Reactor Type</dt>
                    <dd className="font-mono">{reactor.reactorType}</dd>
                  </div>
                )}
                {reactor.reactorModel && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Model</dt>
                    <dd className="font-mono text-sm">{reactor.reactorModel}</dd>
                  </div>
                )}
                {reactor.iaeaId && (
                  <div className="flex justify-between">
                    <dt className="text-silver">IAEA ID</dt>
                    <dd className="font-mono">{reactor.iaeaId}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Timeline */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-lava" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Timeline
              </h2>

              <dl className="space-y-3">
                {reactor.constructionStartAt && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Construction Started</dt>
                    <dd className="font-mono">{formatDate(reactor.constructionStartAt)}</dd>
                  </div>
                )}
                {reactor.operationalFrom && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Operational From</dt>
                    <dd className="font-mono">{formatDate(reactor.operationalFrom)}</dd>
                  </div>
                )}
                {reactor.operationalTo && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Shutdown Date</dt>
                    <dd className="font-mono">{formatDate(reactor.operationalTo)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-silver">Current Status</dt>
                  <dd style={{ color: statusConfig.color }}>{statusConfig.label}</dd>
                </div>
              </dl>
            </div>

            {/* Location */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-lava" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h2>

              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-silver">Country</dt>
                  <dd>{reactor.country}</dd>
                </div>
                {reactor.wikidataRegion && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Region</dt>
                    <dd>{reactor.wikidataRegion}</dd>
                  </div>
                )}
                {reactor.latitude != null && reactor.longitude != null && (
                  <div className="flex justify-between">
                    <dt className="text-silver">Coordinates</dt>
                    <dd className="font-mono text-sm">
                      {reactor.latitude.toFixed(4)}°, {reactor.longitude.toFixed(4)}°
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Operator Info */}
            {(reactor.wikidataOperator || reactor.wikidataOwner) && (
              <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-lava" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Operator & Owner
                </h2>

                <dl className="space-y-3">
                  {reactor.wikidataOperator && (
                    <div className="flex justify-between">
                      <dt className="text-silver">Operator</dt>
                      <dd>{reactor.wikidataOperator}</dd>
                    </div>
                  )}
                  {reactor.wikidataOwner && (
                    <div className="flex justify-between">
                      <dt className="text-silver">Owner</dt>
                      <dd>{reactor.wikidataOwner}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={mapUrl}
              className="flex items-center gap-2 px-6 py-3 bg-lava hover:bg-lava-light text-obsidian font-semibold rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View on 3D Map
            </Link>

            {reactor.wikipediaUrl && (
              <a
                href={reactor.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 glass-panel hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801.111-.947-.07-.084-.305-.22-.812-.24l-.201-.021c-.052 0-.098-.015-.145-.051-.045-.031-.067-.076-.067-.129v-.427l.061-.045c1.247-.008 4.043 0 4.043 0l.059.045v.436c0 .121-.059.178-.193.178-.646.03-.782.095-1.023.439-.12.186-.375.589-.646 1.039l-2.301 4.273-.065.135 2.792 5.712.17.048 4.396-10.438c.154-.422.129-.722-.064-.895-.197-.172-.346-.273-.857-.295l-.42-.016c-.061 0-.105-.014-.152-.045-.043-.029-.072-.075-.072-.119v-.436l.059-.045h4.961l.041.045v.437c0 .119-.074.18-.209.18-.648.03-1.127.18-1.443.421-.314.255-.557.616-.736 1.067 0 0-4.043 9.258-5.426 12.339-.525 1.007-1.053.917-1.503-.031-.571-1.171-1.773-3.786-2.646-5.71l.053-.036z"/>
                </svg>
                Wikipedia
              </a>
            )}

            {reactor.iaeaId && (
              <a
                href={`https://pris.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx?current=${reactor.iaeaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 glass-panel hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                IAEA PRIS
              </a>
            )}
          </div>

          {/* Data Source */}
          <p className="mt-12 text-sm text-muted text-center">
            Data source: {reactor.source} • Last verified against IAEA PRIS database
          </p>
        </div>
      </main>
    </>
  );
}
