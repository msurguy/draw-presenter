import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import BrushText from "../components/BrushText.jsx";
import Appear from "../components/Appear.jsx";
import ShaderLayer from "../components/ShaderLayer.jsx";
import { dreamShader } from "../shaders/dream.wgsl.js";

export const meta = {
  id: "16-finale",
  title: "Go draw something",
  background: "#07081a",
  transition: { kind: "fade", duration: 1 },
};

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Plotted night sky: nebula, stars, gold moon, breathing contour lines
          (src/shaders/dream.wgsl.js, composed from the snippet library). */}
      <ShaderLayer
        shader={dreamShader}
        uniforms={{ params: { time: 0, aspect: 1.7778, speed: 1, lines: 6, glow: 1, moonx: 0.84, moony: 0.22 } }}
        resolution={[1920, 1080]}
      />

      {/* Soft dark plate behind the words so the lines never fight the text. */}
      <div
        style={{
          position: "absolute",
          left: 200,
          right: 200,
          top: 240,
          height: 640,
          borderRadius: 400,
          background: "radial-gradient(ellipse at center, rgba(7,8,26,0.9) 0%, rgba(7,8,26,0.55) 50%, rgba(7,8,26,0) 74%)",
        }}
      />

      <div style={{ position: "absolute", left: 120, right: 120, top: 300, display: "flex", justifyContent: "center" }}>
        <HersheyText
          font="EMSAllure"
          size={300}
          align="center"
          color="var(--ink-bright)"
          strokeWidth={3.4}
          mode="sequential"
          drawDuration={2.4}
          charEase="sine.inOut"
          order={0}
          delay={0.6}
        >
          Go draw
        </HersheyText>
      </div>

      <div style={{ position: "absolute", left: 40, right: 300, top: 650, display: "flex", justifyContent: "center" }}>
        <BrushText
          font="EMSSwiss"
          size={220}
          align="center"
          brush={{ name: "marker", color: "#ffcc33", weight: 0.42 }}
          duration={2.6}
          jitter={0.35}
          overlap={0.25}
          order={1}
          delay={2.4}
        >
          something!
        </BrushText>
      </div>

      <Appear effect="fade-up" step={1} duration={1} style={{ position: "absolute", left: 120, right: 120, bottom: 70, textAlign: "center" }}>
        <p style={{ fontSize: 28, letterSpacing: 7, textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
          draw-presenter · MIT · github.com/msurguy/draw-presenter
        </p>
      </Appear>
    </div>
  );
}
