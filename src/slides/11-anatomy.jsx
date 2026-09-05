import React from "react";
import HersheyText from "../components/HersheyText.jsx";

export const meta = {
  id: "11-anatomy",
  title: "Anatomy of a slide",
  transition: { kind: "glitch-shader", duration: 1.2 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="EMSNixish" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0} mode="sequential">
          Anatomy of a slide
        </HersheyText>
      </div>

      {/* Each row is one build step and sits 150px further right and down
          than the last. The gold numeral draws first, then the line. */}
      <div style={{ position: "absolute", left: 160, top: 320, display: "flex", alignItems: "center", gap: 28 }}>
        <HersheyText font="HersheySans1" size={40} align="left" color="var(--accent)" strokeWidth={2.4} drawDuration={0.6} step={1} order={0}>
          01
        </HersheyText>
        <HersheyText font="EMSNixish" size={64} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1} step={1} order={1} mode="sequential">
          meta — id, title, transition
        </HersheyText>
      </div>

      <div style={{ position: "absolute", left: 310, top: 470, display: "flex", alignItems: "center", gap: 28 }}>
        <HersheyText font="HersheySans1" size={40} align="left" color="var(--accent)" strokeWidth={2.4} drawDuration={0.6} step={2} order={0}>
          02
        </HersheyText>
        <HersheyText font="EMSNixish" size={64} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1} step={2} order={1} mode="sequential">
          order — what draws first
        </HersheyText>
      </div>

      <div style={{ position: "absolute", left: 460, top: 620, display: "flex", alignItems: "center", gap: 28 }}>
        <HersheyText font="HersheySans1" size={40} align="left" color="var(--accent)" strokeWidth={2.4} drawDuration={0.6} step={3} order={0}>
          03
        </HersheyText>
        <HersheyText font="EMSNixish" size={64} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1} step={3} order={1} mode="sequential">
          step — one keypress at a time
        </HersheyText>
      </div>

      <div style={{ position: "absolute", left: 610, top: 770, display: "flex", alignItems: "center", gap: 28 }}>
        <HersheyText font="HersheySans1" size={40} align="left" color="var(--accent)" strokeWidth={2.4} drawDuration={0.6} step={4} order={0}>
          04
        </HersheyText>
        <HersheyText font="EMSNixish" size={64} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1} step={4} order={1} mode="sequential">
          one GSAP timeline, scrubbable
        </HersheyText>
      </div>
    </div>
  );
}
