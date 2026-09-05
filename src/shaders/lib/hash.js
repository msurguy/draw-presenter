// Sine-free hashing, after David Hoskins, "Hash without Sine"
// (https://www.shadertoy.com/view/4djSRW, MIT License, © 2014 David Hoskins).
// Stable across GPUs — unlike the classic fract(sin(dot())) trick.
import { chunk } from "./chunk.js";

/** random2(vec2f) -> f32 in [0, 1). */
export const random2 = chunk("random2", [], /* wgsl */ `
// Hash without Sine (David Hoskins, MIT).
fn random2(st: vec2f) -> f32 {
  var p3 = fract(vec3f(st.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`);

/** random22(vec2f) -> vec2f, each component in [0, 1). */
export const random22 = chunk("random22", [], /* wgsl */ `
// Hash without Sine (David Hoskins, MIT).
fn random22(p: vec2f) -> vec2f {
  var p3 = fract(vec3f(p.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.xx + p3.yz) * p3.zy);
}
`);
