import { noiseLib } from "./noise.wgsl.js";

// Iris: a glowing ring rides the edge of a circular clip-path reveal.
// `progress` is the eased radius fraction shared with the DOM clip.
export const irisShader = /* wgsl */ `
struct Params {
  progress: f32,
  cx: f32,
  cy: f32,
  aspect: f32,
  width: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let s = vec2f(params.aspect, 1.0);
  let c = vec2f(params.cx, params.cy);
  let d = length((uv - c) * s);
  let md = maxDist(c, params.aspect);
  let radius = params.progress * md * 1.02;
  let w = max(params.width, 0.004);
  let x = d - radius; // < 0 inside the revealed disc

  let core = exp(-x * x / (w * w * 0.04));
  let glow = exp(-x * x / (w * w)) * 0.5;
  let inner = 0.22 * exp(x / (w * 2.0)) * step(x, 0.0);
  let sparkle = hash(vec2f(atan2(uv.y - c.y, (uv.x - c.x) * params.aspect) * 60.0, floor(params.progress * 90.0))) * 0.3 + 0.7;

  let alpha = clamp((core * sparkle + glow + inner) * endsFade(params.progress), 0.0, 1.0);
  let color = vec3f(params.r, params.g, params.b);
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
