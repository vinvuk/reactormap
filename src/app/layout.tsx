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
    "Interactive 3D map of 811 nuclear reactors worldwide. Real IAEA data showing operational, planned, and shutdown plants.",
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
    "Nuclear reactor tracking",
    "Interactive 3D globe visualization",
    "800+ reactor database",
    "Operational status monitoring",
    "Filter by reactor status",
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
  title: "ReactorMap | Global Nuclear Power Plant Tracker",
  description: "Interactive 3D map of 811 nuclear reactors worldwide. Real IAEA data showing operational, planned, and shutdown plants. Explore global nuclear power infrastructure.",
  keywords: ["nuclear reactor", "nuclear power", "power plant", "energy", "3D visualization", "earth", "globe", "monitor", "IAEA"],
  verification: {
    google: "fPwCdYoPFuOBz_yQ_kxYIRRYDJOje-iijZRlt_88QaU",
  },
  authors: [{ name: "ReactorMap" }],
  creator: "ReactorMap",
  publisher: "ReactorMap",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "ReactorMap | Global Nuclear Power Plant Tracker",
    description: "Interactive 3D map of 811 nuclear reactors worldwide. Real IAEA data showing operational, planned, and shutdown plants.",
    type: "website",
    url: "https://reactormap.com",
    siteName: "ReactorMap",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReactorMap | Global Nuclear Power Plant Tracker",
    description: "Interactive 3D map of 811 nuclear reactors worldwide. Real IAEA data showing operational, planned, and shutdown plants.",
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
