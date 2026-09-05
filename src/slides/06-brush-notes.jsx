import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import BrushReveal from "../components/BrushReveal.jsx";
import SvgIcon from "../components/SvgIcon.jsx";

export const meta = {
  id: "06-brush-notes",
  title: "Brush annotations",
  transition: { kind: "ink-shader", duration: 1.2, params: { color: "#1c76e1" } },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Heading: Hershey strokes draw, then a fat gold marker underlines the
          whole SVG block — brush over single-stroke text. */}
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <BrushReveal type="underline" brush={{ name: "marker", color: "#ffcc33", weight: 2 }} duration={0.8} order={1} options={{ padding: 2 }} as="div">
          <HersheyText font="HersheySans1" size={92} align="left" strokeWidth={2.6} drawDuration={1.3} order={0}>
            Say it with paint
          </HersheyText>
        </BrushReveal>
      </div>

      {/* Real DOM text with painterly annotations on key phrases. */}
      <Appear effect="fade" order={2} style={{ position: "absolute", left: 120, top: 290, maxWidth: 1180, fontSize: 34, lineHeight: 1.7, color: "var(--text)" }}>
        <p>
          brushmark paints{" "}
          <BrushReveal type="highlight" brush={{ name: "pen", color: "#8a6a10" }} options={{ highlightStyle: "watercolor" }} duration={1.2} order={3}>
            real brush strokes
          </BrushReveal>{" "}
          over live text — graphite, marker, watercolor, spray — while the words stay{" "}
          <BrushReveal type="underline" brush={{ name: "2B", color: "#c93030", weight: 1.4 }} options={{ stagger: { by: "word" } }} duration={1.1} order={4}>
            selectable, responsive text
          </BrushReveal>
          .
        </p>
      </Appear>

      {/* Step 1: strokes drawn AROUND SVG shapes — circle, contour, box. */}
      <div style={{ position: "absolute", left: 120, bottom: 130, display: "flex", gap: 110, alignItems: "center" }}>
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

      {/* Step 2: cross out the old way, paint in the new one. */}
      <div style={{ position: "absolute", right: 120, bottom: 150, textAlign: "right" }}>
        <div style={{ fontSize: 40, color: "var(--muted)" }}>
          <BrushReveal type="crossed-off" brush={{ name: "charcoal", color: "#c93030", weight: 1.3 }} duration={0.8} step={2} order={0}>
            bullet points forever
          </BrushReveal>
        </div>
        <Appear effect="fade-up" step={2} order={1} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 44, color: "var(--ink-bright)" }}>
            <BrushReveal type="underline" brush={{ name: "marker", color: "#ffcc33", weight: 2 }} duration={0.8} step={2} order={2}>
              paint over them instead
            </BrushReveal>
          </div>
        </Appear>
      </div>
    </div>
  );
}
