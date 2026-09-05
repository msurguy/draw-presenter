import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const meta = {
  id: "01-title",
  title: "Title",
  background: "#ededed",
  transition: { kind: "hatch-shader", duration: 1.3, params: { spacing: 90, color: "#202020" } },
};

// Light "paper" opener: the name is written in a single-stroke font, then a
// hatch transition inks the page over on the way to the next slide.
export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, right: 120, top: 300, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="EMSTech"
          size={190}
          align="center"
          color="var(--ink-light)"
          strokeWidth={3.2}
          mode="sequential"
          drawDuration={2.2}
          order={0}
        >
          draw-presenter
        </HersheyText>
      </div>

      <div style={{ position: "absolute", left: 120, right: 120, top: 600, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="EMSReadability"
          size={56}
          align="center"
          color="#5c6570"
          strokeWidth={2}
          drawDuration={1.4}
          order={1}
          delay={0.3}
        >
          slides drawn one stroke at a time
        </HersheyText>
      </div>

      <Appear effect="fade-up" order={2} delay={0.8} style={{ position: "absolute", left: 120, right: 120, top: 800, textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#a08a2a", letterSpacing: 5, textTransform: "uppercase" }}>
          press → to begin
        </div>
      </Appear>
    </div>
  );
}
