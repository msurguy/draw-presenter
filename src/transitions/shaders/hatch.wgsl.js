// Hatch: pen-plotter crosshatch. One set of lines draws in behind a ragged
// front, then a second set at another angle, then the pen floods the gaps
// until the frame is solid ink (0 → 0.5); it un-hatches the same way
// (0.5 → 1).
import { compose, snoise2, random2, rotate2d, strokeEdge, coverPhases } from "../../shaders/lib/index.js";

export const hatchShader = compose(snoise2, random2, rotate2d, strokeEdge, coverPhases, /* wgsl */ `
struct Params {
  progress: f32,
  spacing: f32,
  angle1: f32,
  angle2: f32,
  wobble: f32,
  weight: f32,
  aspect: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hatchSet(q: vec2f, angle: f32, weight: f32, draw: f32, seedv: f32) -> f32 {
  let l = rotate2d(-angle) * q;
  // Hand tremor: a fraction of the line spacing, slow along the stroke.
  let wob = snoise2(l * vec2f(3.0, 12.0) + seedv) * params.wobble * 0.12 / params.spacing;
  let y = (l.y + wob) * params.spacing;
  let row = floor(y);
  let fy = fract(y);
  // Each line draws along its length as \`draw\` advances, staggered per row.
  let delay = random2(vec2f(row, seedv)) * 0.35;
  let len = clamp((draw - delay) / 0.65, 0.0, 1.0);
  let x = clamp((l.x + 1.2) / 2.4, 0.0, 1.0);
  let drawn = step(x, len);
  return strokeEdge(fy, 0.5, weight, 0.08) * drawn;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let q = vec2f(uv.x * params.aspect, uv.y) - vec2f(params.aspect * 0.5, 0.5);
  let ph = coverPhases(p);

  // Phase 1: set A 0–0.45, set B 0.3–0.75, flood 0.65–1. Phase 2 mirrors it.
  let dA = select(clamp(ph.x / 0.45, 0.0, 1.0), 1.0 - clamp((ph.y - 0.55) / 0.45, 0.0, 1.0), p > 0.5);
  let dB = select(clamp((ph.x - 0.3) / 0.45, 0.0, 1.0), 1.0 - clamp((ph.y - 0.25) / 0.45, 0.0, 1.0), p > 0.5);
  let flood = select(clamp((ph.x - 0.65) / 0.35, 0.0, 1.0), 1.0 - clamp(ph.y / 0.35, 0.0, 1.0), p > 0.5);

  let weight = mix(params.weight, 1.3, flood);
  let hA = hatchSet(q, params.angle1, weight, dA, 1.0);
  let hB = hatchSet(q, params.angle2, weight, dB, 7.0);
  let ink = clamp(hA + hB, 0.0, 1.0);

  let color = vec3f(params.r, params.g, params.b) * (0.975 + 0.025 * snoise2(q * 5.0));
  let alpha = ink;
  return vec4f(color * alpha, alpha);
}
`);
