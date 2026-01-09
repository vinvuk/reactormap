import { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";
import { createReactorSlug } from "@/lib/slugify";

/**
 * Raw reactor data structure from JSON
 */
interface RawReactor {
  Id: number;
  Name: string;
  Status: string;
}

/**
 * Generate dynamic sitemap including all reactor pages
 * Creates 812+ URLs (home + all reactors)
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
  ];

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

  return [...staticPages, ...reactorPages];
}
