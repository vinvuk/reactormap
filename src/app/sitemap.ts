import { MetadataRoute } from "next";

/**
 * Generate sitemap for search engines
 * @returns Sitemap configuration array
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://reactormap.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
