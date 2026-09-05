import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushReveal from "../components/BrushReveal.jsx";
import Img from "../components/Img.jsx";

export const meta = {
  id: "07-spotlight",
  title: "Spotlight reveals",
  background: "#202020",
  transition: { kind: "wipe", duration: 0.9, params: { direction: "up" } },
  assets: [
    { key: "plotter", path: "/assets/images/plotter.svg", type: "image" },
    { key: "waves", path: "/assets/images/waves.svg", type: "image" },
    { key: "spiral", path: "/assets/images/spiral.svg", type: "image" },
  ],
};

// Spotlight pattern: everything on stage from the start, dimmed. Each keypress
// paints a hand-drawn mark around the next subject and brightens it — the
// presenter literally circles what to look at. The heading's spray highlight
// un-paints itself once the tour starts (hideOn).
export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <BrushReveal type="highlight" brush={{ name: "spray", color: "#1c76e1" }} duration={1.2} order={1} hideOn={1} as="div" style={{ display: "inline-block" }}>
          <HersheyText font="HersheySerifMed" size={88} align="left" strokeWidth={2.5} drawDuration={1.2} order={0}>
            Guide the eye
          </HersheyText>
        </BrushReveal>
      </div>

      <p style={{ position: "absolute", left: 122, top: 240, fontSize: 28, color: "var(--muted)", maxWidth: 720 }}>
        Three exhibits, one at a time — each keypress circles the next one.
      </p>

      <div style={{ position: "absolute", left: 120, right: 120, top: 400, display: "flex", gap: 90, alignItems: "center", justifyContent: "center" }}>
        <BrushReveal type="circle" brush={{ name: "marker", color: "#ffcc33", weight: 1.6 }} options={{ iterations: 2, padding: 24 }} duration={1.1} step={1} dim as="div">
          <Img src={assets.plotter} width={430} />
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 24, color: "var(--ink-dim)" }}>the machine</div>
        </BrushReveal>

        <BrushReveal type="contour" brush={{ name: "2B", color: "#c93030", weight: 1.5 }} options={{ contour: { inflate: 20, roundness: 0.9 } }} duration={1.2} step={2} dim as="div">
          <Img src={assets.waves} width={430} />
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 24, color: "var(--ink-dim)" }}>the lines</div>
        </BrushReveal>

        <BrushReveal type="circle" brush={{ name: "charcoal", color: "#8fb6e8", weight: 1.4 }} options={{ padding: 20 }} duration={1} step={3} dim as="div">
          <BrushReveal type="box" brush={{ name: "marker", color: "#ffcc33", weight: 1.6 }} duration={1} order={3} as="div">
            <Img src={assets.spiral} width={300} />
          </BrushReveal>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 24, color: "var(--ink-dim)" }}>the result</div>
        </BrushReveal>
      </div>
    </div>
  );
}
