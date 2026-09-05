import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushReveal from "../components/BrushReveal.jsx";
import Img from "../components/Img.jsx";

export const template = {
  name: "Spotlight",
  description: "Three exhibits start dimmed; each keypress circles one and brightens it",
  order: 11,
};

export const meta = {
  id: "spotlight",
  title: "Spotlight",
  background: "#202020",
  transition: { kind: "fade", duration: 0.8 },
  assets: [
    { key: "img1", path: "/assets/images/plotter.svg", type: "image" },
    { key: "img2", path: "/assets/images/waves.svg", type: "image" },
    { key: "img3", path: "/assets/images/spiral.svg", type: "image" },
  ],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySerifMed" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.5} drawDuration={1.2} order={0}>
          Guide the eye
        </HersheyText>
      </div>

      <p style={{ position: "absolute", left: 122, top: 230, fontSize: 28, color: "var(--muted)", maxWidth: 720 }}>
        Three exhibits, one at a time — each keypress circles the next one.
      </p>

      {/* `dim` keeps each exhibit faded until its own step paints the mark. */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 400, display: "flex", gap: 90, alignItems: "center", justifyContent: "center" }}>
        <BrushReveal type="circle" brush={{ name: "marker", color: "#ffcc33", weight: 1.6 }} options={{ iterations: 2, padding: 24 }} duration={1.1} step={1} dim as="div">
          <Img src={assets.img1} width={430} />
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 24, color: "var(--ink-dim)" }}>the machine</div>
        </BrushReveal>

        <BrushReveal type="contour" brush={{ name: "2B", color: "#c93030", weight: 1.5 }} options={{ contour: { inflate: 20, roundness: 0.9 } }} duration={1.2} step={2} dim as="div">
          <Img src={assets.img2} width={430} />
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 24, color: "var(--ink-dim)" }}>the lines</div>
        </BrushReveal>

        <BrushReveal type="box" brush={{ name: "charcoal", color: "#8fb6e8", weight: 1.4 }} options={{ padding: 20 }} duration={1} step={3} dim as="div">
          <Img src={assets.img3} width={300} />
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 24, color: "var(--ink-dim)" }}>the result</div>
        </BrushReveal>
      </div>
    </div>
  );
}
