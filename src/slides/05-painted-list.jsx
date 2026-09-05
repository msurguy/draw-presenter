import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushText from "../components/BrushText.jsx";

export const meta = {
  id: "05-painted-list",
  title: "Painted list",
  transition: { kind: "sweep-shader", duration: 0.9 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={96} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          Made for...
        </HersheyText>
      </div>

      {/* Each word is its own build step and its own crayon color. */}
      <div style={{ position: "absolute", left: 120, top: 288 }}>
        <BrushText font="EMSReadability" size={160} align="left" brush={{ name: "crayon", color: "#ffcc33", weight: 0.1 }} duration={2} step={1}>
          Talks
        </BrushText>
      </div>

      <div style={{ position: "absolute", left: 616, top: 440 }}>
        <BrushText font="EMSReadability" size={160} align="left" brush={{ name: "crayon", color: "#33ff8b", weight: 0.1 }} duration={2} step={2}>
          Demos
        </BrushText>
      </div>

      <div style={{ position: "absolute", left: 1112, top: 640 }}>
        <BrushText font="EMSReadability" size={160} align="left" brush={{ name: "crayon", color: "#8fc9ff", weight: 0.1 }} duration={2} step={3}>
          Workshops
        </BrushText>
      </div>
    </div>
  );
}
