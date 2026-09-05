import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Mermaid from "../components/Mermaid.jsx";

export const template = {
  name: "Diagram",
  description: "Mermaid flowchart drawn by hand, one block per keypress",
  order: 4,
};

export const meta = {
  id: "diagram",
  title: "Diagram",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          How the work flows
        </HersheyText>
      </div>

      {/* Blocks reveal in the order they are first mentioned in the chart:
          → draws Research, then Sketch with its arrow, and so on. Edit the
          chart text in the inspector; the diagram scales to fit its box. */}
      <Mermaid
        chart={`flowchart LR
  A[Research] --> B[Sketch]
  B --> C[Prototype]
  C --> D[Ship]
  D -. learn .-> A`}
        reveal="steps"
        step={1}
        style={{ position: "absolute", left: 120, top: 300, width: 1680, height: 640 }}
      />
    </div>
  );
}
