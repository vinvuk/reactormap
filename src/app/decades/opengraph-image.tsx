import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Nuclear Power Timeline - ReactorMap";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * Generate Open Graph image for decades/timeline page
 * @returns ImageResponse with timeline-themed OG image
 */
export default async function Image() {
  // Decade data for visualization
  const decades = [
    { year: "50s", count: 17 },
    { year: "60s", count: 51 },
    { year: "70s", count: 168 },
    { year: "80s", count: 218 },
    { year: "90s", count: 52 },
    { year: "00s", count: 35 },
    { year: "10s", count: 62 },
    { year: "20s", count: 21 },
  ];

  const maxCount = Math.max(...decades.map((d) => d.count));

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
            marginBottom: 16,
          }}
        >
          Nuclear Power Timeline
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
          8 decades of nuclear history
        </div>

        {/* Timeline bar chart */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            height: 180,
            paddingBottom: 40,
          }}
        >
          {decades.map((decade) => {
            const heightPercent = (decade.count / maxCount) * 100;
            const isPeak = decade.count === maxCount;

            return (
              <div
                key={decade.year}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: `${Math.max(heightPercent * 1.4, 10)}px`,
                    backgroundColor: isPeak
                      ? "#22ff66"
                      : "rgba(34,255,102,0.5)",
                    borderRadius: 4,
                  }}
                />
                <div
                  style={{
                    fontSize: 16,
                    color: isPeak ? "#22ff66" : "#707078",
                    fontWeight: isPeak ? 700 : 400,
                  }}
                >
                  {decade.year}
                </div>
              </div>
            );
          })}
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
          reactormap.com/decades
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
