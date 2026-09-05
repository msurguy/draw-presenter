import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushReveal from "../components/BrushReveal.jsx";
import Appear from "../components/Appear.jsx";

export const meta = {
  id: "02-crossed-out",
  title: "Not another bullet deck",
  transition: { kind: "ripple-shader", duration: 1.6 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* The line writes itself, then a red marker strikes it out. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 380, display: "flex", justifyContent: "center" }}>
        <BrushReveal type="crossed-off" brush={{ name: "marker", color: "#c1063e", weight: 4 }} duration={1.2} order={1} delay={2.6} as="div">
          <HersheyText
            font="EMSCasualHand"
            size={116}
            align="center"
            color="var(--ink-bright)"
            strokeWidth={3}
            drawDuration={2.2}
            order={0}
            ease="power1.inOut"
          >
            Death by bullet points
          </HersheyText>
        </BrushReveal>
      </div>

      <Appear effect="fade-up" order={2} delay={3.6} style={{ position: "absolute", left: 120, right: 120, top: 620, textAlign: "center" }}>
        <p style={{ fontSize: 48, color: "var(--accent)" }}>
          Draw it instead.
        </p>
      </Appear>
    </div>
  );
}
