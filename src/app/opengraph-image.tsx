import { ImageResponse } from "next/og";

export const alt = "digiduktas — DI pluginai, kurie atlieka rankų darbą už jus";
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
          background: "#16171a",
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
            background: "#d77d42",
            color: "#16171a",
            fontSize: 120,
            fontWeight: 800,
            marginBottom: 44,
          }}
        >
          d
        </div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, color: "#eceef1" }}>
          <span>digi</span>
          <span style={{ color: "#d77d42" }}>duktas</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#a3a7af", marginTop: 22 }}>
          DI pluginai - leiskite DI dirbti
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#d77d42",
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
