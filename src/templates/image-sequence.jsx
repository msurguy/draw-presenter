import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import Img from "../components/Img.jsx";

export const template = {
  name: "Title + images",
  description: "Three images, each revealed on its own keypress",
  order: 3,
};

export const meta = {
  id: "image-sequence",
  title: "Title + images",
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
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          Three ways to look at it
        </HersheyText>
      </div>

      {/* Each image is its own build step, so → reveals them one at a time.
          Replace the placeholders by dropping files on the asset rows in the
          admin panel (each new slide gets its own copies). */}
      <Appear effect="fade-up" step={1} style={{ position: "absolute", left: 120, top: 330, width: 520 }}>
        <Img src={assets.img1} width={520} />
        <p style={{ marginTop: 24, fontSize: 26, color: "var(--muted)" }}>First, the sketch</p>
      </Appear>

      <Appear effect="fade-up" step={2} style={{ position: "absolute", left: 700, top: 330, width: 520 }}>
        <Img src={assets.img2} width={520} />
        <p style={{ marginTop: 24, fontSize: 26, color: "var(--muted)" }}>Then, the system</p>
      </Appear>

      <Appear effect="fade-up" step={3} style={{ position: "absolute", left: 1280, top: 330, width: 520 }}>
        <Img src={assets.img3} width={520} />
        <p style={{ marginTop: 24, fontSize: 26, color: "var(--muted)" }}>Finally, the detail</p>
      </Appear>
    </div>
  );
}
