import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import Img from "../components/Img.jsx";
import SvgIcon from "../components/SvgIcon.jsx";
import VideoLayer from "../components/VideoLayer.jsx";
import BrushText from "../components/BrushText.jsx";

export const meta = {
  id: "08-combo",
  title: "Mix every medium",
  transition: { kind: "iris-shader", duration: 1, params: { color: "#ffcc33" } },
  assets: [
    { key: "plotter", path: "/assets/images/plotter.svg", type: "image" },
    { key: "waves", path: "/assets/images/waves.svg", type: "image" },
    { key: "spiral", path: "/assets/images/spiral.svg", type: "image" },
    { key: "inset", path: "/assets/video/gold-loop.mp4", type: "video" },
  ],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={92} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          Mix every medium
        </HersheyText>
      </div>

      {/* Row of line-art images, staggered in. */}
      <Appear effect="fade-up" order={1} delay={0.4} stagger={0.15} style={{ position: "absolute", top: 290, left: 120, display: "flex", gap: 60, alignItems: "flex-start" }}>
        <Img src={assets.plotter} width={420} />
        <Img src={assets.waves} width={420} />
        <Img src={assets.spiral} width={280} />
      </Appear>

      <div style={{ position: "absolute", left: 1400, top: 300 }}>
        <BrushText font="HersheyScript1" size={150} align="left" brush={{ name: "marker", color: "#ffcc33", weight: 0.5 }} duration={2} order={2} delay={0.6}>
          Painted
        </BrushText>
      </div>

      {/* Step 1: single-stroke icons draw themselves. */}
      <div style={{ position: "absolute", left: 120, bottom: 140, display: "flex", gap: 70 }}>
        <SvgIcon src="/assets/icons/pen.svg" size={130} draw step={1} order={0} drawDuration={0.9} />
        <SvgIcon src="/assets/icons/bolt.svg" size={130} draw step={1} order={1} drawDuration={0.9} color="var(--accent)" />
        <SvgIcon src="/assets/icons/gear.svg" size={130} draw step={1} order={2} drawDuration={0.9} color="var(--brand-2)" />
      </div>

      {/* Step 2: an inset video card slides in. */}
      <Appear
        effect="fade-left"
        step={2}
        style={{
          position: "absolute",
          right: 120,
          bottom: 120,
          width: 560,
          height: 315,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--surface-hover)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <VideoLayer src={assets.inset} fit="cover" />
      </Appear>
    </div>
  );
}
