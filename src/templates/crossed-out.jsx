import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushReveal from "../components/BrushReveal.jsx";
import Appear from "../components/Appear.jsx";

export const template = {
  name: "Crossed out",
  description: "A line draws itself, gets struck through, and the replacement appears",
  order: 4,
};

export const meta = {
  id: "crossed-out",
  title: "Crossed out",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* The text draws stroke by stroke, then (after `delay` seconds) a red
          marker strikes it out. Size ~120 fits about 22 characters. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 380, display: "flex", justifyContent: "center" }}>
        <BrushReveal type="crossed-off" brush={{ name: "marker", color: "#c1063e", weight: 4 }} duration={1.2} order={1} delay={2.4} as="div">
          <HersheyText
            font="EMSCasualHand"
            size={120}
            align="center"
            color="var(--ink-bright)"
            strokeWidth={3}
            drawDuration={2}
            order={0}
            ease="power1.inOut"
          >
            The old way
          </HersheyText>
        </BrushReveal>
      </div>

      <Appear
        effect="fade-up"
        order={2}
        delay={3.4}
        style={{ position: "absolute", left: 120, right: 120, top: 620, textAlign: "center" }}
      >
        <p style={{ fontSize: 44, color: "var(--accent)" }}>
          The new way.
        </p>
      </Appear>
    </div>
  );
}
