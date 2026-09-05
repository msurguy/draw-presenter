import React from "react";
import BrushText from "../components/BrushText.jsx";

export const template = {
  name: "Brush word",
  description: "A headline painted by a brush that retraces the font, plus a pencil subtitle",
  order: 5,
};

export const meta = {
  id: "brush-word",
  title: "Brush word",
  background: "#202020",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Brush weight scales with size: keep it ~0.4 for a 200px marker
          headline and ~1 for a 50px pencil line, or letters blur together. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 330, display: "flex", justifyContent: "center" }}>
        <BrushText
          font="EMSLeague"
          size={210}
          align="center"
          brush={{ name: "marker", color: "#ffcc33", weight: 0.42 }}
          duration={3}
          jitter={0.4}
          order={0}
        >
          Painted by hand
        </BrushText>
      </div>

      <div style={{ position: "absolute", left: 120, right: 120, top: 640, display: "flex", justifyContent: "center" }}>
        <BrushText
          font="HersheySans1"
          size={54}
          align="center"
          brush={{ name: "2B", color: "#8fb6e8", weight: 1 }}
          duration={2}
          jitter={0.4}
          order={1}
          delay={2.6}
        >
          the brush retraces every pen stroke of the font
        </BrushText>
      </div>
    </div>
  );
}
