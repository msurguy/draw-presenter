import { noiseLib } from "./noise.wgsl.js";

// Ink blot: an irregular pool of ink spreads from a point until it covers the
// frame (0 → 0.5), then a hole opens from the same point and the ink drains
// away (0.5 → 1). The DOM swaps slides at the covered midpoint.
export const inkShader = /* wgsl */ `
struct Params {
  progress: f32,
  cx: f32,
  cy: f32,
  aspect: f32,
  scale: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

fn blot(uv: vec2f, c: vec2f, grow: f32, seed: f32) -> f32 {
  let s = vec2f(params.aspect, 1.0);
  let d = length((uv - c) * s);
  let md = maxDist(c, params.aspect);
  let fine = fbm(uv * s * params.scale + vec2f(seed, seed * 0.37));
  let lobes = fbm(uv * s * params.scale * 0.25 + vec2f(seed * 1.3, 2.0));
  let edge = grow * md * 1.6 - (fine * 0.22 + lobes * 0.3) * md;
  return smoothstep(edge + 0.01, edge - 0.01, d);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let c = vec2f(params.cx, params.cy);
  let g1 = smoothstep(0.0, 1.0, clamp(p * 2.0, 0.0, 1.0));
  let g2 = smoothstep(0.0, 1.0, clamp((p - 0.5) * 2.0, 0.0, 1.0));
  let cover = select(blot(uv, c, g1, 1.7), 1.0 - blot(uv, c, g2, 9.1), p > 0.5);

  let s = vec2f(params.aspect, 1.0);
  let tex = fbm(uv * s * params.scale * 2.0 + vec2f(5.0, 1.0));
  let color = vec3f(params.r, params.g, params.b) * (0.86 + 0.14 * tex);
  let alpha = cover;
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
