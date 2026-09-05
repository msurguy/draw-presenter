import React from "react";
import VideoLayer from "../components/VideoLayer.jsx";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const template = {
  name: "Fullscreen video",
  description: "An edge-to-edge muted loop with a lower-third caption",
  order: 15,
};

export const meta = {
  id: "fullscreen-video",
  title: "Fullscreen video",
  background: "#202020",
  transition: { kind: "fade", duration: 0.8 },
  assets: [{ key: "loop", path: "/assets/video/gradient-loop.mp4", type: "video" }],
};

export default function Slide({ assets }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <VideoLayer src={assets.loop} fit="cover" opacity={0.85} />

      {/* Darken the lower third so the caption reads over the video. */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(20,20,20,0.85))" }} />

      <div style={{ position: "absolute", left: 120, bottom: 110 }}>
        <HersheyText font="HersheySerifMed" size={110} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.6} order={0}>
          Motion as backdrop
        </HersheyText>
      </div>

      {/* Next keypress reveals the note. Position the Appear wrapper itself. */}
      <Appear effect="fade-left" step={1} style={{ position: "absolute", right: 120, bottom: 130, maxWidth: 480 }}>
        <div style={{ fontSize: 30, lineHeight: 1.5, color: "var(--ink-dim)", borderLeft: "3px solid var(--accent)", paddingLeft: 24 }}>
          Muted, looping video plays only while its slide is on stage.
        </div>
      </Appear>
    </div>
  );
}
