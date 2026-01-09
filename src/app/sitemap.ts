import { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";
import { createReactorSlug, slugify } from "@/lib/slugify";

/**
 * Raw reactor data structure from JSON
 */
interface RawReactor {
  Id: number;
  Name: string;
  Country: string;
  Status: string;
  ReactorType: string | null;
  WikidataOperator: string | null;
}

/**
 * Generate dynamic sitemap for all pages
 * Includes: home, about, index pages, country, status, type, region, operator, and reactor pages
 * @returns Sitemap configuration array
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://reactormap.com";

  // Load reactor data
  const filePath = path.join(process.cwd(), "nuclear_power_plants.json");
  const fileContents = await fs.readFile(filePath, "utf8");
  const reactors: RawReactor[] = JSON.parse(fileContents);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/statistics`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/countries`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/statuses`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/types`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/regions`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/operators`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/decades`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
  ];

  // Decade pages
  const decadeSlugs = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  const decadePages: MetadataRoute.Sitemap = decadeSlugs.map((decade) => ({
    url: `${baseUrl}/decade/${decade}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  // Get unique countries
  const countries = [...new Set(reactors.map((r) => r.Country))];

  // Country pages - high priority for aggregate content
  const countryPages: MetadataRoute.Sitemap = countries.map((country) => ({
    url: `${baseUrl}/country/${slugify(country)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Status pages - high priority for category content
  const statusSlugs = [
    "operational",
    "under-construction",
    "planned",
    "suspended",
    "shutdown",
    "cancelled",
  ];
  const statusPages: MetadataRoute.Sitemap = statusSlugs.map((status) => ({
    url: `${baseUrl}/status/${status}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Reactor type pages
  const reactorTypes = [...new Set(reactors.map((r) => r.ReactorType).filter(Boolean))] as string[];
  const typePages: MetadataRoute.Sitemap = reactorTypes.map((type) => ({
    url: `${baseUrl}/type/${slugify(type)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Region pages
  const regionSlugs = [
    "north-america",
    "south-america",
    "europe",
    "asia",
    "middle-east",
    "russia",
    "africa",
  ];
  const regionPages: MetadataRoute.Sitemap = regionSlugs.map((region) => ({
    url: `${baseUrl}/region/${region}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Operator pages (only operators with 2+ reactors)
  const operatorCounts = new Map<string, number>();
  reactors.forEach((r) => {
    if (r.WikidataOperator) {
      operatorCounts.set(r.WikidataOperator, (operatorCounts.get(r.WikidataOperator) || 0) + 1);
    }
  });
  const operators = Array.from(operatorCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([name]) => name);
  const operatorPages: MetadataRoute.Sitemap = operators.map((op) => ({
    url: `${baseUrl}/operator/${slugify(op)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Reactor pages - prioritize operational reactors
  const reactorPages: MetadataRoute.Sitemap = reactors.map((reactor) => {
    const slug = createReactorSlug(reactor.Name, String(reactor.Id));
    const status = reactor.Status.toLowerCase();

    // Higher priority for operational reactors
    let priority = 0.6;
    if (status === "operational") {
      priority = 0.8;
    } else if (status === "under construction") {
      priority = 0.7;
    }

    return {
      url: `${baseUrl}/reactor/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority,
    };
  });

  return [
    ...staticPages,
    ...decadePages,
    ...countryPages,
    ...statusPages,
    ...typePages,
    ...regionPages,
    ...operatorPages,
    ...reactorPages,
  ];
}
