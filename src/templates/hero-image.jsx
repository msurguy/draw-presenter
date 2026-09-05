import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import Img from "../components/Img.jsx";

export const template = {
  name: "Hero image",
  description: "A title and one large image with a caption",
  order: 10,
};

export const meta = {
  id: "hero-image",
  title: "Hero image",
  transition: { kind: "fade", duration: 0.8 },
  assets: [{ key: "hero", path: "/assets/images/plotter.svg", type: "image" }],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          The whole picture
        </HersheyText>
      </div>

      {/* Drop your own image on the asset row in the admin panel; it keeps
          its aspect ratio at the given width. */}
      <Appear effect="fade-up" order={1} delay={0.6} style={{ position: "absolute", left: 360, top: 230, width: 1200 }}>
        <Img src={assets.hero} width={1200} />
      </Appear>

      <Appear effect="fade" order={2} delay={1.4} style={{ position: "absolute", left: 120, right: 120, bottom: 70, textAlign: "center" }}>
        <p style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "var(--muted)" }}>
          a caption under the image
        </p>
      </Appear>
    </div>
  );
}
