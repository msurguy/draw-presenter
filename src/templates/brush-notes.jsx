import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import BrushReveal from "../components/BrushReveal.jsx";
import SvgIcon from "../components/SvgIcon.jsx";

export const template = {
  name: "Brush notes",
  description: "A paragraph with painted highlights; icons get circled on the next keypress",
  order: 12,
};

export const meta = {
  id: "brush-notes",
  title: "Brush notes",
  transition: { kind: "fade", duration: 0.8 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Heading draws, then a gold marker underlines the whole block. */}
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <BrushReveal type="underline" brush={{ name: "marker", color: "#ffcc33", weight: 2 }} duration={0.8} order={1} options={{ padding: 2 }} as="div">
          <HersheyText font="HersheySans1" size={92} align="left" strokeWidth={2.6} drawDuration={1.3} order={0}>
            Say it with paint
          </HersheyText>
        </BrushReveal>
      </div>

      {/* Real DOM text with painterly annotations on key phrases. */}
      <Appear effect="fade" order={2} style={{ position: "absolute", left: 120, top: 300, maxWidth: 1100, fontSize: 34, lineHeight: 1.7, color: "var(--text)" }}>
        <p>
          Brush strokes paint{" "}
          <BrushReveal type="highlight" brush={{ name: "pen", color: "#8a6a10" }} options={{ highlightStyle: "watercolor" }} duration={1.2} order={3}>
            over live text
          </BrushReveal>{" "}
          — graphite, marker, watercolor, spray — while the words stay{" "}
          <BrushReveal type="underline" brush={{ name: "2B", color: "#c93030", weight: 1.4 }} options={{ stagger: { by: "word" } }} duration={1.1} order={4}>
            selectable, responsive text
          </BrushReveal>
          .
        </p>
      </Appear>

      {/* Next keypress: marks drawn AROUND line-art icons — circle, contour, box. */}
      <div style={{ position: "absolute", left: 120, top: 720, display: "flex", gap: 110, alignItems: "center" }}>
        <BrushReveal type="circle" brush={{ name: "2B", color: "#c93030", weight: 1.6 }} options={{ iterations: 2, padding: 14 }} duration={1} step={1} order={0}>
          <SvgIcon src="/assets/icons/bolt.svg" size={120} />
        </BrushReveal>
        <BrushReveal type="contour" brush={{ name: "charcoal", color: "#f0efec", weight: 1.2 }} options={{ contour: { inflate: 14, roundness: 0.8 } }} duration={1.1} step={1} order={1}>
          <SvgIcon src="/assets/icons/pen.svg" size={120} />
        </BrushReveal>
        <BrushReveal type="box" brush={{ name: "pen", color: "#8fb6e8", weight: 1.5 }} options={{ padding: 12 }} duration={0.9} step={1} order={2}>
          <SvgIcon src="/assets/icons/gear.svg" size={120} />
        </BrushReveal>
      </div>
    </div>
  );
}
