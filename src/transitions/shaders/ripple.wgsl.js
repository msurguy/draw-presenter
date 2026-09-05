import { noiseLib } from "./noise.wgsl.js";

// Ripple: concentric rings trail behind an expanding circular reveal, like a
// drop hitting water. `progress` is the eased radius fraction of the DOM clip.
export const rippleShader = /* wgsl */ `
struct Params {
  progress: f32,
  cx: f32,
  cy: f32,
  aspect: f32,
  rings: f32,
  intensity: f32,
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
  let x = d - radius; // < 0 behind the front

  let behind = step(x, 0.0);
  let wave = 0.5 + 0.5 * cos(x * params.rings * 6.2831853);
  let decay = exp(x * 5.0);
  let rings = pow(wave, 3.0) * decay * behind * 0.5;
  let front = exp(-x * x / (0.018 * 0.018)) * 0.55;
  let bloom = exp(-x * x / (0.12 * 0.12)) * 0.12;

  let alpha = clamp((rings + front + bloom) * params.intensity * endsFade(params.progress), 0.0, 1.0);
  let color = vec3f(params.r, params.g, params.b);
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
