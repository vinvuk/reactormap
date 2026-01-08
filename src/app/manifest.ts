import { MetadataRoute } from "next";

/**
 * Generate PWA manifest for installable web app
 * Enables "Add to Home Screen" functionality
 * @returns Manifest configuration object
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReactorMap - Global Nuclear Power Plant Tracker",
    short_name: "ReactorMap",
    description:
      "Explore global nuclear energy infrastructure. Track 800+ nuclear reactors on an interactive 3D globe.",
    start_url: "/",
    display: "standalone",
    background_color: "#020206",
    theme_color: "#22ff66",
    orientation: "any",
    categories: ["education", "utilities"],
    icons: [
      {
        src: "/favicon.svg?v=2",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png?v=2",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
