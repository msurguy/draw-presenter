import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushText from "../components/BrushText.jsx";

export const template = {
  name: "Painted list",
  description: "A title, then three crayon words step down the stage, one per keypress",
  order: 6,
};

export const meta = {
  id: "painted-list",
  title: "Painted list",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={96} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          We design for...
        </HersheyText>
      </div>

      {/* Each word is its own build step and its own crayon color. */}
      <div style={{ position: "absolute", left: 120, top: 288 }}>
        <BrushText font="EMSReadability" size={160} align="left" brush={{ name: "crayon", color: "#ffcc33", weight: 0.1 }} duration={2} step={1}>
          People
        </BrushText>
      </div>

      <div style={{ position: "absolute", left: 616, top: 440 }}>
        <BrushText font="EMSReadability" size={160} align="left" brush={{ name: "crayon", color: "#33ff8b", weight: 0.1 }} duration={2} step={2}>
          Places
        </BrushText>
      </div>

      <div style={{ position: "absolute", left: 1152, top: 640 }}>
        <BrushText font="EMSReadability" size={160} align="left" brush={{ name: "crayon", color: "#8fc9ff", weight: 0.1 }} duration={2} step={3}>
          Things
        </BrushText>
      </div>
    </div>
  );
}
