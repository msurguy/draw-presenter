import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const meta = {
  id: "14-section-divider",
  title: "Transitions",
  transition: { kind: "mandala-shader", duration: 1.6, params: { color: "#202020", lineColor: "#ffcc33" } },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, right: 120, top: 420, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="EMSNixish"
          size={150}
          align="center"
          color="var(--ink-bright)"
          strokeWidth={3.2}
          drawDuration={1.5}
          order={0}
          ease="sine.inOut"
        >
          Transitions
        </HersheyText>
      </div>

      <Appear effect="fade-up" order={1} delay={1.2} style={{ position: "absolute", left: 120, right: 120, top: 640, textAlign: "center" }}>
        <p style={{ fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: "var(--muted)" }}>
          20 kinds · WGSL overlays with DOM fallbacks · ← plays them in reverse
        </p>
      </Appear>
    </div>
  );
}
