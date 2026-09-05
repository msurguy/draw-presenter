import React from "react";
import HersheyText from "../components/HersheyText.jsx";

export const template = {
  name: "Statement",
  description: "One line of text, centered — a claim, a quote, a question",
  order: 1,
};

export const meta = {
  id: "statement",
  title: "Statement",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* The wrapper spans the stage; the text centers inside it and draws
          stroke by stroke. Size ~120 fits about 22 characters on one line. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 460, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="HersheySerifMed"
          size={120}
          align="center"
          color="var(--ink-bright)"
          strokeWidth={3}
          drawDuration={2}
          stagger={0.03}
          order={0}
        >
          Good design is honest.
        </HersheyText>
      </div>
    </div>
  );
}
