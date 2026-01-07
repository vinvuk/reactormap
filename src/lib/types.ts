/**
 * Nuclear reactor data structure from GeoNuclearData
 */
export interface Reactor {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  status: ReactorStatus;
  reactorType: string | null;
  reactorModel: string | null;
  capacity: number | null;
  constructionStartAt: string | null;
  operationalFrom: string | null;
  operationalTo: string | null;
  source: string;
  iaeaId: number | null;
  // Wikipedia enrichment fields
  wikipediaUrl: string | null;
  wikipediaTitle: string | null;
  wikipediaExtract: string | null;
  wikipediaThumbnail: string | null;
  // Wikidata enrichment fields
  wikidataOperator: string | null;
  wikidataOwner: string | null;
  wikidataRegion: string | null;
  wikidataArchitect: string | null;
}

/**
 * Reactor operational status levels
 */
export type ReactorStatus =
  | "operational"        // Green - actively generating power
  | "under_construction" // Yellow - being built
  | "planned"            // Blue - approved/planned
  | "shutdown"           // Gray - permanently closed
  | "suspended"          // Orange - temporarily halted
  | "cancelled";         // Red - project cancelled

/**
 * Status configuration for visualization
 */
export const STATUS_CONFIG: Record<ReactorStatus, {
  label: string;
  color: string;
  glowColor: string;
  description: string;
}> = {
  operational: {
    label: "Operational",
    color: "#22ff66",
    glowColor: "rgba(34, 255, 102, 0.5)",
    description: "Reactor is actively generating power",
  },
  under_construction: {
    label: "Under Construction",
    color: "#ffee00",
    glowColor: "rgba(255, 238, 0, 0.5)",
    description: "Reactor is currently being built",
  },
  planned: {
    label: "Planned",
    color: "#00aaff",
    glowColor: "rgba(0, 170, 255, 0.5)",
    description: "Reactor is approved and planned for construction",
  },
  suspended: {
    label: "Suspended",
    color: "#ff9900",
    glowColor: "rgba(255, 153, 0, 0.6)",
    description: "Construction or operation temporarily halted",
  },
  shutdown: {
    label: "Shutdown",
    color: "#888888",
    glowColor: "rgba(136, 136, 136, 0.4)",
    description: "Reactor permanently closed",
  },
  cancelled: {
    label: "Cancelled",
    color: "#ff4444",
    glowColor: "rgba(255, 68, 68, 0.5)",
    description: "Project was cancelled",
  },
};

/**
 * Common reactor types
 */
export type ReactorTypeCategory =
  | "PWR"    // Pressurized Water Reactor
  | "BWR"    // Boiling Water Reactor
  | "PHWR"   // Pressurized Heavy Water Reactor
  | "GCR"    // Gas-Cooled Reactor
  | "LWGR"   // Light Water Graphite Reactor
  | "FBR"    // Fast Breeder Reactor
  | "HTGR"   // High Temperature Gas Reactor
  | "Other";

/**
 * API response for reactor list
 */
export interface ReactorApiResponse {
  reactors: Reactor[];
  lastUpdated: string;
  totalCount: number;
  dataSourceDate: string; // When the source data was last updated from IAEA
}

/**
 * Lighting mode for globe visualization
 * - realistic: Day/night cycle based on sun position
 * - day: Full illumination across the globe
 * - night: Dark mode with glowing city lights
 */
export type LightingMode = "realistic" | "day" | "night";
