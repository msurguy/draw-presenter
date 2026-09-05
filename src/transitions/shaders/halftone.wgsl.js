// Halftone: a rotated dot screen whose dot size follows a noisy front, so the
// frame fills as a growing print raster (0 → 0.5) and thins back out
// (0.5 → 1).
import { compose, snoise2, random2, rotate2d, coverPhases } from "../../shaders/lib/index.js";

export const halftoneShader = compose(snoise2, random2, rotate2d, coverPhases, /* wgsl */ `
struct Params {
  progress: f32,
  pitch: f32,
  angle: f32,
  aspect: f32,
  dirx: f32,
  diry: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let q = vec2f(uv.x * params.aspect, uv.y) - vec2f(params.aspect * 0.5, 0.5);
  let g = rotate2d(params.angle) * q * params.pitch;
  let cell = floor(g);
  let local = fract(g) - 0.5;
  let d = length(local);

  let dir = normalize(vec2f(params.dirx, params.diry));
  let front = dot(uv - 0.5, dir) + 0.5 + snoise2(uv * vec2f(3.0, 2.0) + 1.7) * 0.12;
  let ph = coverPhases(p);
  let th1 = mix(-0.7, 1.7, ph.x);
  let th2 = mix(-0.7, 1.7, ph.y);
  let k1 = clamp((th1 - front) * 2.0, 0.0, 1.0);
  let k2 = 1.0 - clamp((th2 - front) * 2.0, 0.0, 1.0);
  let k = select(k1, k2, p > 0.5);

  // 0.72+ swallows the cell corners, so k = 1 is a solid fill.
  let radius = k * 0.8;
  let dotv = 1.0 - smoothstep(radius - 0.05, radius + 0.005, d);
  let color = vec3f(params.r, params.g, params.b) * (0.97 + 0.03 * random2(cell));
  let alpha = dotv;
  return vec4f(color * alpha, alpha);
}
`);
