import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const template = {
  name: "Section divider",
  description: "One word centered, a small caption fades in under it",
  order: 3,
};

export const meta = {
  id: "section-divider",
  title: "Section divider",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Size 120 fits about 22 characters; use a bigger size for one word. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 440, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="EMSNixish"
          size={140}
          align="center"
          color="var(--ink-bright)"
          strokeWidth={3}
          drawDuration={1.5}
          order={0}
          ease="sine.inOut"
        >
          Part two
        </HersheyText>
      </div>

      <Appear
        effect="fade-up"
        order={1}
        delay={1.2}
        style={{ position: "absolute", left: 120, right: 120, top: 640, textAlign: "center" }}
      >
        <p style={{ fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: "var(--muted)" }}>
          where the real work starts
        </p>
      </Appear>
    </div>
  );
}
