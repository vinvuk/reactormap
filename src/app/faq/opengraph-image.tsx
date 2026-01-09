import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Nuclear Power FAQ - ReactorMap";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Generate Open Graph image for FAQ page
 * @returns ImageResponse with FAQ-themed OG image
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

        {/* Question mark icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 30,
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(34,255,102,0.2)",
          }}
        >
          <span style={{ fontSize: 48, color: "#22ff66" }}>?</span>
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
          Nuclear Power FAQ
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#a0a0a8",
            marginBottom: 40,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Common questions about nuclear reactors and power plants
        </div>

        {/* Sample questions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            fontSize: 18,
            color: "#707078",
            alignItems: "center",
          }}
        >
          <span>How many nuclear reactors are there?</span>
          <span>Which country has the most reactors?</span>
          <span>What is the most common reactor type?</span>
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
          reactormap.com/faq
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
