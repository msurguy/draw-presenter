import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import Img from "../components/Img.jsx";

export const template = {
  name: "Blank",
  description: "Title and one line of supporting copy",
  order: 0,
};

export const meta = {
  id: "blank",
  title: "Blank",
  transition: { kind: "fade", duration: 0.8 },
  assets: [
    // { key: "hero", path: "/assets/images/hero.svg", type: "image" },
  ],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0, padding: "90px 120px" }}>
      <HersheyText font="HersheySans1" size={96} align="left" strokeWidth={2.6} drawDuration={1.4}>
        Your title here
      </HersheyText>

      <Appear
        effect="fade-up"
        order={1}
        delay={0.4}
        style={{ position: "absolute", left: 120, top: 320, maxWidth: 700 }}
      >
        <p style={{ fontSize: 30, lineHeight: 1.5, color: "var(--muted)" }}>
          Supporting copy appears after the title draws.
        </p>
      </Appear>

      {/* Revealed on the next keypress:
      <Appear effect="scale" step={1} style={{ position: "absolute", right: 120, bottom: 120 }}>
        <Img src={assets.hero} width={480} />
      </Appear> */}
    </div>
  );
}
