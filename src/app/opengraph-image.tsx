import { ImageResponse } from "next/og";

export const alt = "digiduktas — skaitmeninių produktų turgus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share kortelė. Tekstas be lietuviškų diakritikų —
// numatytasis ImageResponse šriftas jų nepiešia patikimai.
export default function Image() {
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
          background: "#faf9f7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 170,
            height: 170,
            borderRadius: 42,
            background: "#f97316",
            color: "#ffffff",
            fontSize: 120,
            fontWeight: 800,
            marginBottom: 44,
          }}
        >
          d
        </div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, color: "#1c1917" }}>
          <span>digi</span>
          <span style={{ color: "#f97316" }}>duktas</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#78716c", marginTop: 22 }}>
          Pirkite ir parduokite skaitmeninius produktus
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#f97316",
            fontWeight: 600,
            marginTop: 40,
          }}
        >
          digiduktas.lt
        </div>
      </div>
    ),
    { ...size },
  );
}
