import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Nuclear Power by Country - ReactorMap";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Generate Open Graph image for countries page
 * @returns ImageResponse with countries-themed OG image
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

        {/* Globe icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 30,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22ff66" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#f5f5f0",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Nuclear Power by Country
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#a0a0a8",
            marginBottom: 40,
          }}
        >
          41 countries with nuclear reactors
        </div>

        {/* Top countries */}
        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 18,
            color: "#707078",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22ff66" }} />
            <span>USA: 93</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22ff66" }} />
            <span>France: 56</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22ff66" }} />
            <span>China: 55</span>
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
          reactormap.com/countries
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
