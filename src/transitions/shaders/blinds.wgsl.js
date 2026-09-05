import { noiseLib } from "./noise.wgsl.js";

// Venetian blinds: N slats thicken (with a stagger) until they seal the frame
// at 0.5, then thin out from the other edge to reveal the new slide.
export const blindsShader = /* wgsl */ `
struct Params {
  progress: f32,
  count: f32,
  vertical: f32,
  stagger: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let coord = select(uv.y, uv.x, params.vertical > 0.5);
  let n = max(params.count, 1.0);
  let i = floor(coord * n);
  let local = fract(coord * n);

  let stagger = clamp(params.stagger, 0.0, 0.9);
  let delay = stagger * i / max(n - 1.0, 1.0);
  let span = max(1.0 - stagger, 0.05);
  let q1 = smoothstep(0.0, 1.0, clamp((p * 2.0 - delay) / span, 0.0, 1.0));
  let q2 = smoothstep(0.0, 1.0, clamp(((p - 0.5) * 2.0 - delay) / span, 0.0, 1.0));

  // Phase 1: slat grows from its leading edge. Phase 2: it recedes toward the
  // trailing edge.
  let cov1 = step(local, q1);
  let cov2 = step(q2, local);
  let cover = select(cov1, cov2, p > 0.5);

  let shade = 0.8 + 0.2 * smoothstep(0.0, 0.6, local);
  let color = vec3f(params.r, params.g, params.b) * shade;
  let alpha = cover;
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
