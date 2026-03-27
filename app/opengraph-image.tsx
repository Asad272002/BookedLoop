import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1220",
          padding: 64,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 48,
            background:
              "linear-gradient(135deg, rgba(64, 224, 208, 0.18), rgba(255, 255, 255, 0) 55%), radial-gradient(circle at 20% 10%, rgba(99, 102, 241, 0.25), rgba(255, 255, 255, 0) 55%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.18), rgba(255, 255, 255, 0) 55%)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
            color: "white",
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #60a5fa, #34d399)",
                display: "flex",
              }}
            />
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{site.name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.2 }}>
              Turn missed leads into booked clients
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.35, color: "rgba(255,255,255,0.78)", maxWidth: 920 }}>
              Cleaner online presence, better booking flows, review automation, and practical follow‑up systems.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22 }}>
            <div style={{ color: "rgba(255,255,255,0.75)" }}>{site.url.replace(/^https?:\/\//, "")}</div>
            <div
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Book a Free Audit
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

