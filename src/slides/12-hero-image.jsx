import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import Img from "../components/Img.jsx";

export const meta = {
  id: "12-hero-image",
  title: "Hero image",
  transition: { kind: "halftone-shader", duration: 1.2, params: { color: "#f0efec" } },
  assets: [{ key: "hero", path: "/assets/images/delaunay-wide.svg", type: "image" }],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          Made for plotters
        </HersheyText>
      </div>

      <Appear effect="fade-up" order={1} delay={0.6} style={{ position: "absolute", left: 260, top: 220, width: 1400 }}>
        <Img src={assets.hero} width={1400} />
      </Appear>

      <Appear effect="fade" order={2} delay={1.4} style={{ position: "absolute", left: 120, right: 120, bottom: 70, textAlign: "center" }}>
        <p style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "var(--muted)" }}>
          a Delaunay mesh from scripts/generate-art.mjs · SVG line art stays crisp at any size
        </p>
      </Appear>
    </div>
  );
}
