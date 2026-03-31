import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

/**
 * JSON-LD structured data for search engines
 * Helps Google understand the application and display rich results
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ReactorMap",
  description:
    "Interactive 3D nuclear power plant map with 811+ reactors worldwide. Explore operational, under construction, planned, and shutdown nuclear reactors by country, region, and type. IAEA PRIS data updated for 2026.",
  url: "https://reactormap.com",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Requires WebGL.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Interactive 3D nuclear reactor map",
    "811+ reactor database with IAEA PRIS data",
    "Filter by status: operational, under construction, planned, shutdown",
    "Browse by country, region, operator, and reactor type",
    "Detailed reactor pages with capacity, coordinates, and history",
  ],
  screenshot: "https://reactormap.com/opengraph-image",
  author: {
    "@type": "Organization",
    name: "ReactorMap",
    url: "https://reactormap.com",
  },
};

/**
 * Display font - Cormorant Garamond
 * Used for headlines, hero text, and dramatic typography
 */
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Body font - IBM Plex Sans
 * Used for body text, UI elements, and general content
 */
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Monospace font - JetBrains Mono
 * Used for data displays, coordinates, and technical information
 */
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nuclear Power Plant Map — 811+ Reactors Worldwide | ReactorMap",
  description: "Interactive nuclear reactor map showing 811+ power plants across 41 countries. Browse operational, under construction, and planned reactors with capacity, type, and location data from IAEA PRIS. Updated 2026.",
  keywords: ["nuclear power plant map", "nuclear reactor map", "world reactor map", "nuclear power plants", "nuclear energy map", "IAEA PRIS", "nuclear reactors by country", "interactive reactor map"],
  verification: {
    google: "fPwCdYoPFuOBz_yQ_kxYIRRYDJOje-iijZRlt_88QaU",
  },
  authors: [{ name: "ReactorMap" }],
  creator: "ReactorMap",
  publisher: "ReactorMap",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Nuclear Power Plant Map — 811+ Reactors Worldwide | ReactorMap",
    description: "Interactive nuclear reactor map showing 811+ power plants across 41 countries. Browse operational, under construction, and planned reactors with IAEA data.",
    type: "website",
    url: "https://reactormap.com",
    siteName: "ReactorMap",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuclear Power Plant Map — 811+ Reactors Worldwide | ReactorMap",
    description: "Interactive nuclear reactor map showing 811+ power plants across 41 countries. Browse operational, under construction, and planned reactors with IAEA data.",
  },
  metadataBase: new URL("https://reactormap.com"),
  alternates: {
    canonical: "https://reactormap.com",
  },
  other: {
    "theme-color": "#22ff66",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Root layout component that wraps all pages
 * Applies global fonts and styles
 * @param children - Child components to render
 * @returns The root HTML structure with fonts applied
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload critical Earth textures for faster 3D scene loading */}
        <link
          rel="preload"
          href="/textures/earth_day_8k.jpg"
          as="image"
          type="image/jpeg"
        />
        <link
          rel="preload"
          href="/textures/earth_night_8k.jpg"
          as="image"
          type="image/jpeg"
        />
        <link
          rel="preload"
          href="/textures/earth_clouds_8k.jpg"
          as="image"
          type="image/jpeg"
        />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${cormorantGaramond.variable} ${ibmPlexSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
