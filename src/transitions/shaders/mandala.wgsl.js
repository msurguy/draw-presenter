// Mandala: a disk of kaleidoscopic line art (rings, petals, stars, gears,
// rays) blooms from a point until it covers the frame (0 → 0.5), then folds
// back (0.5 → 1).
import {
  compose,
  kaleidoscope_full,
  rotate2d,
  starSDF,
  flowerSDF,
  gearSDF,
  raysSDF,
  strokeEdge,
  TAU,
  coverPhases,
  maxDist,
  ease,
} from "../../shaders/lib/index.js";

export const mandalaShader = compose(
  kaleidoscope_full, rotate2d, starSDF, flowerSDF, gearSDF, raysSDF, strokeEdge, TAU, coverPhases, maxDist, ease,
  /* wgsl */ `
struct Params {
  progress: f32,
  segments: f32,
  rings: f32,
  aspect: f32,
  cx: f32,
  cy: f32,
  r: f32,
  g: f32,
  b: f32,
  lr: f32,
  lg: f32,
  lb: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let s = vec2f(params.aspect, 1.0);
  let c = vec2f(params.cx, params.cy);
  let st = (uv - c) * s;
  let md = maxDist(c, params.aspect);

  let ph = coverPhases(p);
  let grow = select(ease(ph.x), 1.0 - ease(ph.y), p > 0.5);
  let radius = grow * md * 1.05;
  let d = length(st);
  let disk = 1.0 - smoothstep(radius - 0.004, radius + 0.004, d);

  // Line art lives in a unit frame that scales with the disk, so the pattern
  // grows with it (and rotates a quarter turn over the transition).
  let u = rotate2d(p * TAU * 0.25) * st / max(radius, 1e-3);
  let l = kaleidoscope_full(u * 0.5 + 0.5, params.segments, 0.0);
  let rr = length(u);

  // Line widths are in unit-disk space; divide by the radius so strokes keep
  // a constant on-screen weight (crisp line-work) instead of fattening as
  // the disk grows. Capped so the first frames don't blow up.
  let ws = min(0.012 / max(radius, 0.02), 0.25);
  let we = ws * 0.35;
  let ringsN = max(params.rings, 1.0);
  let rings = strokeEdge(fract(rr * ringsN), 0.5, ws * ringsN * 0.5, we * ringsN * 0.5) * step(rr, 0.98);
  let petals = strokeEdge(flowerSDF(l, i32(params.segments)), 0.5, ws * 1.6, we * 1.6);
  let star = strokeEdge(starSDF(u * 0.5 / 0.72 + 0.5, i32(params.segments), 0.12), 0.5, ws, we);
  let gear = strokeEdge(gearSDF(u * 0.5 / 0.92 + 0.5, 0.35, i32(params.segments) * 3), 0.5, ws, we);
  let rays = strokeEdge(raysSDF(l, i32(params.segments) * 2), 0.5, ws * 0.8, we) * smoothstep(0.15, 0.4, rr);
  let core = 1.0 - smoothstep(0.03, 0.05, rr);
  let art = clamp(rings * 0.7 + petals + star + gear + rays * 0.6 + core, 0.0, 1.0);

  let base = vec3f(params.r, params.g, params.b);
  let line = vec3f(params.lr, params.lg, params.lb);
  let col = mix(base, line, art);
  let alpha = disk;
  return vec4f(col * alpha, alpha);
}
`);
