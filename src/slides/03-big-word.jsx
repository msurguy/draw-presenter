import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import BrushReveal from "../components/BrushReveal.jsx";

export const meta = {
  id: "03-big-word",
  title: "Big word",
  transition: { kind: "mosaic-shader", duration: 1, params: { color: "#ffcc33" } },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Size 420 fits roughly 6 characters across the stage. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 250, display: "flex", justifyContent: "center" }}>
        <BrushReveal type="bracket" brush={{ name: "pastel", color: "#ffcc33", weight: 1.6 }} duration={1} order={2} as="div">
          <HersheyText
            font="EMSNixish"
            size={420}
            align="center"
            color="var(--ink-bright)"
            strokeWidth={10}
            drawDuration={1.6}
            order={0}
            mode="sequential"
          >
            Stroke
          </HersheyText>
        </BrushReveal>
      </div>

      <Appear effect="fade-up" order={1} delay={1.4} style={{ position: "absolute", left: 120, right: 120, top: 810, textAlign: "center" }}>
        <p style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "var(--accent)" }}>
          67 single-line fonts · every glyph is a pen path
        </p>
      </Appear>
    </div>
  );
}
