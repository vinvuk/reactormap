import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Nuclear Power Statistics - ReactorMap";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Generate Open Graph image for statistics page
 * @returns ImageResponse with statistics-themed OG image
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

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#f5f5f0",
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          Nuclear Power Statistics
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "flex",
            gap: 60,
            marginTop: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#22ff66" }}>439</div>
            <div style={{ fontSize: 18, color: "#a0a0a8" }}>Operational</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#ffee00" }}>64</div>
            <div style={{ fontSize: 18, color: "#a0a0a8" }}>Construction</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#00aaff" }}>81</div>
            <div style={{ fontSize: 18, color: "#a0a0a8" }}>Planned</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#f5f5f0" }}>400</div>
            <div style={{ fontSize: 18, color: "#a0a0a8" }}>GW Capacity</div>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            color: "#505058",
          }}
        >
          <span>reactormap.com/statistics</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
