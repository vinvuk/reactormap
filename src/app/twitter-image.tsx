import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ReactorMap - Global Nuclear Power Plant Tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Generate Twitter card image for social sharing
 * Creates a branded image with nuclear theme
 * @returns ImageResponse with the Twitter card image
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020206",
          backgroundImage:
            "radial-gradient(circle at 50% 120%, #0a1a0f 0%, #020206 50%)",
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            width: 600,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(34,255,102,0.3) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Atom icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            style={{ filter: "drop-shadow(0 0 12px rgba(34,255,102,0.8))" }}
          >
            <defs>
              <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#22ff66" }} />
                <stop offset="100%" style={{ stopColor: "#00aa44" }} />
              </linearGradient>
            </defs>
            {/* Electron orbits */}
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#glow)" strokeWidth="2" />
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#glow)" strokeWidth="2" transform="rotate(60 50 50)" />
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#glow)" strokeWidth="2" transform="rotate(120 50 50)" />
            {/* Nucleus */}
            <circle cx="50" cy="50" r="10" fill="url(#glow)" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#f5f5f0",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          ReactorMap
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#a0a0a8",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          Global Nuclear Power Tracker
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 20,
            color: "#707078",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#22ff66",
              }}
            />
            <span>800+ Reactors</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ffee00",
              }}
            />
            <span>3D Globe</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#00aaff",
              }}
            />
            <span>Live Status</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#505058",
          }}
        >
          reactormap.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
