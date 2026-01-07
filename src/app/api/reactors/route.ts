import { NextResponse } from "next/server";
import { Reactor, ReactorStatus, ReactorApiResponse } from "@/lib/types";
import { promises as fs } from "fs";
import path from "path";

/**
 * Cached reactor data with timestamp
 */
let cachedData: { reactors: Reactor[]; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (static data)

/**
 * Raw data structure from GeoNuclearData JSON (with Wikipedia enrichment)
 */
interface RawReactor {
  Id: number;
  Name: string;
  Latitude: number | null;
  Longitude: number | null;
  Country: string;
  CountryCode: string;
  Status: string;
  ReactorType: string | null;
  ReactorModel: string | null;
  ConstructionStartAt: string | null;
  OperationalFrom: string | null;
  OperationalTo: string | null;
  Capacity: number | null;
  LastUpdatedAt: string | null;
  Source: string;
  IAEAId: number | null;
  // Wikipedia enrichment fields
  WikipediaUrl?: string;
  WikipediaTitle?: string;
  WikipediaExtract?: string;
  WikipediaThumbnail?: string;
  // Wikidata enrichment fields
  WikidataOperator?: string;
  WikidataOwner?: string;
  WikidataRegion?: string;
  WikidataArchitect?: string;
}

/**
 * Map raw status string to ReactorStatus enum
 * @param rawStatus - Status string from data source
 * @returns ReactorStatus
 */
function mapStatus(rawStatus: string): ReactorStatus {
  const statusMap: Record<string, ReactorStatus> = {
    "Operational": "operational",
    "Under Construction": "under_construction",
    "Planned": "planned",
    "Shutdown": "shutdown",
    "Decommissioning Completed": "shutdown",
    "Suspended Construction": "suspended",
    "Suspended Operation": "suspended",
    "Cancelled Construction": "cancelled",
    "Never Commissioned": "cancelled",
    "Unknown": "shutdown",
  };
  return statusMap[rawStatus] || "shutdown";
}

/**
 * Parse raw reactor data to Reactor interface
 * @param raw - Raw reactor data from JSON
 * @returns Reactor object or null if invalid
 */
function parseReactor(raw: RawReactor): Reactor | null {
  // Skip reactors without coordinates
  if (raw.Latitude === null || raw.Longitude === null) {
    return null;
  }

  return {
    id: String(raw.Id),
    name: raw.Name,
    country: raw.Country,
    countryCode: raw.CountryCode,
    latitude: raw.Latitude,
    longitude: raw.Longitude,
    status: mapStatus(raw.Status),
    reactorType: raw.ReactorType,
    reactorModel: raw.ReactorModel,
    capacity: raw.Capacity,
    constructionStartAt: raw.ConstructionStartAt,
    operationalFrom: raw.OperationalFrom,
    operationalTo: raw.OperationalTo,
    source: raw.Source,
    iaeaId: raw.IAEAId,
    // Wikipedia enrichment
    wikipediaUrl: raw.WikipediaUrl || null,
    wikipediaTitle: raw.WikipediaTitle || null,
    wikipediaExtract: raw.WikipediaExtract || null,
    wikipediaThumbnail: raw.WikipediaThumbnail || null,
    // Wikidata enrichment
    wikidataOperator: raw.WikidataOperator || null,
    wikidataOwner: raw.WikidataOwner || null,
    wikidataRegion: raw.WikidataRegion || null,
    wikidataArchitect: raw.WikidataArchitect || null,
  };
}

/**
 * Load reactor data from local JSON file
 * @returns Array of reactor data
 */
async function loadReactorData(): Promise<Reactor[]> {
  try {
    console.log("Loading reactor data from JSON file...");

    const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const rawData: RawReactor[] = JSON.parse(fileContents);

    console.log(`Loaded ${rawData.length} raw reactor records`);

    // Parse and filter valid reactors
    const reactors = rawData
      .map(parseReactor)
      .filter((r): r is Reactor => r !== null);

    console.log(`${reactors.length} reactors with valid coordinates`);

    // Sort by status priority (reversed so active reactors render LAST and appear on top)
    // In Three.js, later-rendered elements appear on top for overlapping sprites
    const statusPriority: Record<ReactorStatus, number> = {
      cancelled: 0,      // Render first (bottom)
      shutdown: 1,
      suspended: 2,
      planned: 3,
      under_construction: 4,
      operational: 5,    // Render last (top)
    };

    reactors.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      // Secondary sort by capacity (smaller first, so larger renders on top)
      return (a.capacity || 0) - (b.capacity || 0);
    });

    return reactors;
  } catch (error) {
    console.error("Error loading reactor data:", error);
    return [];
  }
}

/**
 * GET handler for reactor data API
 * Returns cached data if available, otherwise loads from file
 */
export async function GET(): Promise<NextResponse<ReactorApiResponse>> {
  try {
    // Check cache
    const now = Date.now();
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        reactors: cachedData.reactors,
        lastUpdated: new Date(cachedData.timestamp).toISOString(),
        totalCount: cachedData.reactors.length,
      });
    }

    // Load data from file
    const reactors = await loadReactorData();

    // Update cache
    cachedData = {
      reactors,
      timestamp: now,
    };

    // Count by status for logging
    const statusCounts = reactors.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    console.log("Reactor status counts:", statusCounts);

    return NextResponse.json({
      reactors,
      lastUpdated: new Date(now).toISOString(),
      totalCount: reactors.length,
    });
  } catch (error) {
    console.error("Error in reactor API:", error);
    return NextResponse.json(
      {
        reactors: [],
        lastUpdated: new Date().toISOString(),
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}
