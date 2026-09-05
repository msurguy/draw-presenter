import React from "react";
import BrushText from "../components/BrushText.jsx";
import Appear from "../components/Appear.jsx";
import BrushReveal from "../components/BrushReveal.jsx";

export const meta = {
  id: "04-brush-word",
  title: "Brush follows the font",
  background: "#202020",
  transition: { kind: "dissolve-shader", duration: 1.1, params: { color: "#f0efec" } },
};

// The brush literally retraces the Hershey pen strokes: a marker writes the
// headline stroke by stroke, a graphite pencil follows with the subtitle,
// and a pen word lands on the next keypress.
export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 30 }}>
        <BrushReveal type="bracket" brush={{ name: "marker", color: "#ffcc33", weight: 1.6 }} duration={1} order={5} as="div">
          <BrushText
            font="EMSLeague"
            size={210}
            align="center"
            brush={{ name: "crayon", color: "#ff3300", weight: 0.1 }}
            duration={3.4}
            jitter={0.4}
            order={0}
          >
            Painted by hand
          </BrushText>
        </BrushReveal>

        <BrushText
          font="HersheySans1"
          size={54}
          align="center"
          brush={{ name: "2B", color: "#8fb6e8", weight: 1 }}
          duration={2.2}
          jitter={0.4}
          order={1}
          delay={3.1}
        >
          the brush retraces every pen stroke of the font
        </BrushText>

        <Appear effect="fade" order={2} delay={5.3}>
          <div style={{ fontSize: 24, color: "var(--muted)", letterSpacing: 3 }}>
            HERSHEY GLYPHS · P5.BRUSH PIGMENT · ONE TIMELINE
          </div>
        </Appear>

        {/* Next keypress: a pen word slams in, stroke by stroke, then gets underlined. */}
        <BrushReveal type="underline" brush={{ name: "marker", color: "#ffcc33", weight: 1.6 }} duration={1} step={1} order={1} as="div">
          <BrushText
            font="EMSCasualHand"
            size={87}
            align="center"
            brush={{ name: "pen", color: "#fcfcfc", weight: 0.55 }}
            duration={1.6}
            jitter={0}
            overlap={0.25}
            step={1}
            curvature={0}
          >
            with feeling
          </BrushText>
        </BrushReveal>
      </div>
    </div>
  );
}
