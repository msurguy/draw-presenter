import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const template = {
  name: "Big word",
  description: "One huge word drawn stroke by stroke, with a small caption",
  order: 2,
};

export const meta = {
  id: "big-word",
  title: "Big word",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Size 420 fits roughly 6 characters across the stage. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 250, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="HersheySansBold"
          size={420}
          align="center"
          color="var(--ink-bright)"
          strokeWidth={5}
          drawDuration={2.4}
          stagger={0.05}
          order={0}
        >
          Craft
        </HersheyText>
      </div>

      <Appear
        effect="fade-up"
        order={1}
        delay={1.4}
        style={{ position: "absolute", left: 120, right: 120, top: 810, textAlign: "center" }}
      >
        <p style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "var(--accent)" }}>
          the part nobody sees, everybody feels
        </p>
      </Appear>
    </div>
  );
}
