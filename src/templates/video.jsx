import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import VideoLayer from "../components/VideoLayer.jsx";

export const template = {
  name: "Title + video",
  description: "A large looping video card under the title",
  order: 5,
};

export const meta = {
  id: "video",
  title: "Title + video",
  background: "#202020",
  transition: { kind: "fade", duration: 0.8 },
  assets: [{ key: "loop", path: "/assets/video/gold-loop.mp4", type: "video" }],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          Motion study
        </HersheyText>
      </div>

      {/* The card fades in after the title draws. Drop your own clip on the
          asset row in the admin panel; it plays muted and loops. */}
      <Appear
        effect="fade"
        order={1}
        delay={0.6}
        style={{
          position: "absolute",
          left: 120,
          top: 250,
          width: 1680,
          height: 720,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--surface-hover)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        }}
      >
        <VideoLayer src={assets.loop} fit="cover" />
      </Appear>
    </div>
  );
}
