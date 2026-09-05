import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const template = {
  name: "Two columns",
  description: "Title, then two columns split by a hairline; the right one lands on a keypress",
  order: 8,
};

export const meta = {
  id: "two-column",
  title: "Two columns",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          Before and after
        </HersheyText>
      </div>

      {/* Left column draws with the title; the hairline and right column
          wait for the next keypress. */}
      <div style={{ position: "absolute", left: 120, top: 300 }}>
        <HersheyText font="HersheySerifMed" size={56} align="left" color="var(--accent)" strokeWidth={2.4} drawDuration={0.8} order={1}>
          Before
        </HersheyText>
      </div>
      <Appear effect="fade-up" order={2} delay={0.5} style={{ position: "absolute", left: 120, top: 400, width: 760 }}>
        <p style={{ fontSize: 30, lineHeight: 1.6, color: "var(--muted)" }}>
          Slides made of bullet points. Everything appears at once, nothing
          moves, and the audience reads ahead of you.
        </p>
      </Appear>

      <Appear effect="fade" step={1} order={0} style={{ position: "absolute", left: 958, top: 300, width: 2, height: 560, background: "var(--line)", opacity: 0.5 }}>
        <div />
      </Appear>

      <div style={{ position: "absolute", left: 1040, top: 300 }}>
        <HersheyText font="HersheySerifMed" size={56} align="left" color="var(--brand-2)" strokeWidth={2.4} drawDuration={0.8} step={1} order={1}>
          After
        </HersheyText>
      </div>
      <Appear effect="fade-up" step={1} order={2} delay={0.5} style={{ position: "absolute", left: 1040, top: 400, width: 760 }}>
        <p style={{ fontSize: 30, lineHeight: 1.6, color: "var(--ink-dim)" }}>
          Every line is drawn while you speak. Each keypress paints the next
          idea, so the room looks where the pen is.
        </p>
      </Appear>
    </div>
  );
}
