import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Mermaid from "../components/Mermaid.jsx";

export const meta = {
  id: "10-diagram",
  title: "How a slide builds",
  transition: { kind: "blinds-shader", duration: 0.9 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          How a slide builds
        </HersheyText>
      </div>

      {/* Blocks reveal in the order they are first mentioned in the chart —
          one keypress per node. The diagram scales to fit its box. */}
      <Mermaid
        chart={`flowchart LR
  A[slide.jsx] --> B[Hershey draws the text]
  B --> C[Brush paints the marks]
  C --> D[Shader transition]
  D -. next slide .-> A`}
        reveal="steps"
        step={1}
        style={{ position: "absolute", left: 120, top: 300, width: 1680, height: 640 }}
      />
    </div>
  );
}
