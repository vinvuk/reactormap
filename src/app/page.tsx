import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import HomeClient from "@/components/HomeClient";

/**
 * Raw reactor data shape for server-side stats calculation
 */
interface RawReactor {
  Status: string;
  Country: string;
  Capacity: number | null;
  ReactorType: string | null;
}

/**
 * Load reactor data for SEO stats (server-side only)
 * @returns Array of raw reactor records
 */
async function getReactorStats() {
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  const operational = reactors.filter((r) => r.Status.toLowerCase() === "operational");
  const underConstruction = reactors.filter((r) => r.Status.toLowerCase() === "under construction");
  const planned = reactors.filter((r) => r.Status.toLowerCase() === "planned");
  const totalCapacity = operational.reduce((sum, r) => sum + (r.Capacity || 0), 0);
  const countries = new Set(operational.map((r) => r.Country)).size;

  return {
    total: reactors.length,
    operational: operational.length,
    underConstruction: underConstruction.length,
    planned: planned.length,
    totalCapacityGW: Math.round(totalCapacity / 1000),
    countries,
  };
}

/**
 * Homepage — server component wrapping the interactive 3D map client component
 * Provides crawlable SEO content below the fold for search engines
 */
export default async function Home() {
  const stats = await getReactorStats();

  return (
    <>
      {/* Interactive 3D Map (client-side) */}
      <HomeClient />

      {/* Server-rendered SEO content — visible below the full-screen map */}
      <section className="bg-obsidian text-cream px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] mb-6">
            Nuclear Power Plant Map
          </h1>
          <p className="text-lg text-silver max-w-3xl mb-12 leading-relaxed">
            Explore {stats.total}+ nuclear reactors worldwide on an interactive 3D globe.
            ReactorMap tracks {stats.operational} operational reactors across {stats.countries} countries,
            with {stats.underConstruction} under construction and {stats.planned} planned.
            Total operational capacity: {stats.totalCapacityGW} GW.
            Data sourced from the IAEA PRIS database, updated for 2026.
          </p>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-mono font-bold text-[#22ff66]">{stats.operational}</div>
              <div className="text-sm text-silver mt-1">Operational Reactors</div>
            </div>
            <div className="border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-mono font-bold text-[#ffee00]">{stats.underConstruction}</div>
              <div className="text-sm text-silver mt-1">Under Construction</div>
            </div>
            <div className="border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-mono font-bold text-[#00aaff]">{stats.planned}</div>
              <div className="text-sm text-silver mt-1">Planned</div>
            </div>
            <div className="border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-mono font-bold text-cream">{stats.countries}</div>
              <div className="text-sm text-silver mt-1">Countries</div>
            </div>
          </div>

          {/* Browse links — keyword-rich internal linking */}
          <h2 className="text-2xl font-semibold mb-6">Browse Nuclear Reactors</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div>
              <h3 className="text-lg font-medium mb-3">By Region</h3>
              <ul className="space-y-2 text-silver">
                <li><Link href="/region/north-america" className="hover:text-cream transition-colors">North America</Link></li>
                <li><Link href="/region/europe" className="hover:text-cream transition-colors">Europe</Link></li>
                <li><Link href="/region/asia" className="hover:text-cream transition-colors">Asia</Link></li>
                <li><Link href="/region/middle-east" className="hover:text-cream transition-colors">Middle East</Link></li>
                <li><Link href="/region/russia" className="hover:text-cream transition-colors">Russia &amp; CIS</Link></li>
                <li><Link href="/region/africa" className="hover:text-cream transition-colors">Africa</Link></li>
                <li><Link href="/region/south-america" className="hover:text-cream transition-colors">South America</Link></li>
                <li><Link href="/regions" className="text-[#22ff66] hover:underline text-sm">View all regions →</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">By Status</h3>
              <ul className="space-y-2 text-silver">
                <li><Link href="/status/operational" className="hover:text-cream transition-colors">Operational Reactors</Link></li>
                <li><Link href="/status/under-construction" className="hover:text-cream transition-colors">Under Construction</Link></li>
                <li><Link href="/status/planned" className="hover:text-cream transition-colors">Planned Reactors</Link></li>
                <li><Link href="/status/shutdown" className="hover:text-cream transition-colors">Shutdown Reactors</Link></li>
                <li><Link href="/statuses" className="text-[#22ff66] hover:underline text-sm">View all statuses →</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">More Data</h3>
              <ul className="space-y-2 text-silver">
                <li><Link href="/statistics" className="hover:text-cream transition-colors">Global Nuclear Statistics 2026</Link></li>
                <li><Link href="/countries" className="hover:text-cream transition-colors">Reactors by Country</Link></li>
                <li><Link href="/types" className="hover:text-cream transition-colors">Reactor Technologies</Link></li>
                <li><Link href="/operators" className="hover:text-cream transition-colors">Operators</Link></li>
                <li><Link href="/decades" className="hover:text-cream transition-colors">Timeline by Decade</Link></li>
                <li><Link href="/faq" className="hover:text-cream transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>

          {/* Descriptive content targeting long-tail search queries */}
          <div className="prose prose-invert max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">About ReactorMap</h2>
            <p className="text-silver leading-relaxed mb-4">
              ReactorMap is a free, interactive nuclear power plant map that visualizes every
              commercial nuclear reactor in the world. The database includes {stats.total}+ reactors
              across {stats.countries} countries — from the first commercial plant at Calder Hall (1956)
              to the latest units under construction in China, India, Turkey, and Egypt.
            </p>
            <p className="text-silver leading-relaxed mb-4">
              Each reactor page shows capacity in MW, reactor type (PWR, BWR, PHWR, LWGR, and more),
              operational dates, operator, coordinates, and location on the 3D globe.
              Filter the map by status to see only operational, under construction, planned,
              or shutdown nuclear power plants.
            </p>
            <p className="text-silver leading-relaxed">
              All data is sourced from the IAEA Power Reactor Information System (PRIS),
              enriched with Wikipedia and Wikidata. ReactorMap is updated regularly to reflect
              the latest changes in the global nuclear fleet.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
