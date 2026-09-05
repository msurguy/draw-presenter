// Small math helpers shared by the shaders.
import { chunk } from "./chunk.js";

export const TAU = chunk("TAU", [], /* wgsl */ `
const TAU: f32 = 6.283185307179586;
`);

/** rotate2d(radians) -> mat2x2f; use as `rotate2d(a) * v`. */
export const rotate2d = chunk("rotate2d", [], /* wgsl */ `
fn rotate2d(radians: f32) -> mat2x2f {
  let c = cos(radians);
  let s = sin(radians);
  return mat2x2f(vec2f(c, s), vec2f(-s, c));
}
`);

export const saturate = chunk("saturate", [], /* wgsl */ `
fn saturate(v: f32) -> f32 { return clamp(v, 0.0, 1.0); }
`);

/** map(v, inMin, inMax, outMin, outMax) — linear remap, no clamping. */
export const map = chunk("map", [], /* wgsl */ `
fn map(v: f32, inMin: f32, inMax: f32, outMin: f32, outMax: f32) -> f32 {
  return outMin + (outMax - outMin) * (v - inMin) / (inMax - inMin);
}
`);
