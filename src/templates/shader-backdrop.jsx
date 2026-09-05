import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import ShaderLayer from "../components/ShaderLayer.jsx";

export const template = {
  name: "Shader backdrop",
  description: "A live WGSL aurora behind centered text (hidden without WebGPU)",
  order: 16,
};

export const meta = {
  id: "shader-backdrop",
  title: "Shader backdrop",
  background: "#1e1e1e",
  transition: { kind: "fade", duration: 0.8 },
};

// Slow drifting aurora bands in the deck palette. `params.time` is written
// every frame by <ShaderLayer timeUniform>. See src/shaders/lib/ for noise
// and drawing snippets you can compose into bigger shaders.
const auroraShader = /* wgsl */ `
struct Params {
  time: f32,
  drift: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.time * params.drift;
  var color = vec3f(0.11, 0.11, 0.12);

  let y1 = 0.35 + 0.12 * sin(uv.x * 4.0 + t);
  let y2 = 0.55 + 0.10 * sin(uv.x * 3.0 - t * 1.3 + 1.7);
  let y3 = 0.75 + 0.08 * sin(uv.x * 5.0 + t * 0.7 + 3.1);

  color += vec3f(0.11, 0.46, 0.88) * 0.35 * exp(-pow((uv.y - y1) * 9.0, 2.0));
  color += vec3f(0.56, 0.71, 0.91) * 0.25 * exp(-pow((uv.y - y2) * 11.0, 2.0));
  color += vec3f(1.0, 0.8, 0.2) * 0.12 * exp(-pow((uv.y - y3) * 14.0, 2.0));

  return vec4f(color, 1.0);
}
`;

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ShaderLayer shader={auroraShader} uniforms={{ params: { drift: 0.6 } }} timeUniform="params.time" resolution={[960, 540]} />

      <div style={{ position: "absolute", left: 120, right: 120, top: 400, display: "flex", justifyContent: "center" }}>
        <HersheyText font="HersheySerifMed" size={150} align="center" strokeWidth={3} drawDuration={2} color="var(--ink-bright)" order={0}>
          Every pixel is code
        </HersheyText>
      </div>

      <Appear effect="fade-up" order={1} delay={0.5} style={{ position: "absolute", left: 120, right: 120, top: 640, textAlign: "center" }}>
        <p style={{ fontSize: 32, color: "var(--muted)" }}>
          a WGSL backdrop under single-stroke text
        </p>
      </Appear>
    </div>
  );
}
