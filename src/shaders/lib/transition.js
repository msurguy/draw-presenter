// Helpers for transition overlays. Frame is uv ∈ [0,1]² with a top-left
// origin; "aspect-corrected" space scales x by the stage aspect so distances
// are in stage-height units.
import { chunk } from "./chunk.js";

/** maxDist(c, aspect) — distance from c to the farthest frame corner. */
export const maxDist = chunk("maxDist", [], /* wgsl */ `
fn maxDist(c: vec2f, aspect: f32) -> f32 {
  let s = vec2f(aspect, 1.0);
  let d1 = length((vec2f(0.0, 0.0) - c) * s);
  let d2 = length((vec2f(1.0, 0.0) - c) * s);
  let d3 = length((vec2f(0.0, 1.0) - c) * s);
  let d4 = length((vec2f(1.0, 1.0) - c) * s);
  return max(max(d1, d2), max(d3, d4));
}
`);

/** endsFade(p) — 0 at the very start and end of the transition, 1 between. */
export const endsFade = chunk("endsFade", [], /* wgsl */ `
fn endsFade(p: f32) -> f32 {
  return smoothstep(0.0, 0.04, p) * (1.0 - smoothstep(0.96, 1.0, p));
}
`);

/**
 * coverPhases(p) — cover-swap phases: x = cover progress (0→1 over p 0..0.5),
 * y = clear progress (0→1 over p 0.5..1). The DOM swaps slides at p = 0.5.
 */
export const coverPhases = chunk("coverPhases", [], /* wgsl */ `
fn coverPhases(p: f32) -> vec2f {
  return vec2f(clamp(p * 2.0, 0.0, 1.0), clamp((p - 0.5) * 2.0, 0.0, 1.0));
}
`);

/** ease(x) — smoothstep-shaped ease in/out. */
export const ease = chunk("ease", [], /* wgsl */ `
fn ease(x: f32) -> f32 {
  return x * x * (3.0 - 2.0 * x);
}
`);

/** along(q, dir, aspect) — projection of q onto dir, normalized 0..1 over the frame. */
export const along = chunk("along", [], /* wgsl */ `
fn along(q: vec2f, dir: vec2f, aspect: f32) -> f32 {
  let d = normalize(dir);
  let c1 = dot(vec2f(0.0, 0.0), d);
  let c2 = dot(vec2f(aspect, 0.0), d);
  let c3 = dot(vec2f(0.0, 1.0), d);
  let c4 = dot(vec2f(aspect, 1.0), d);
  let mn = min(min(c1, c2), min(c3, c4));
  let mx = max(max(c1, c2), max(c3, c4));
  return (dot(q, d) - mn) / max(mx - mn, 1e-4);
}
`);
