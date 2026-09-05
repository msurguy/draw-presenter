// Ornament fields for line art. Every function takes a 0..1 coordinate with
// the shape centred at (0.5, 0.5) and returns a scalar field whose 0.5 level
// set is the outline — draw it with `strokeEdge(field, 0.5, width, edge)`.
// Inside the shape the value is below 0.5, outside above, so the same field
// also works as a soft fill via `smoothstep`.
import { chunk } from "./chunk.js";
import { TAU } from "./math.js";

/** starSDF(st, points, sharpness) — an N-pointed star; sharpness 0..0.2. */
export const starSDF = chunk("starSDF", [TAU], /* wgsl */ `
fn starSDF(st: vec2f, points: i32, sharpness: f32) -> f32 {
  let p = (st - 0.5) * 2.0;
  let turns = atan2(p.y, p.x) / TAU;             // -0.5 .. 0.5
  let seg = fract(turns * f32(points));           // 0..1 within one point
  let tip = abs(seg * 2.0 - 1.0);                 // 1 at a tip, 0 in a valley
  let inner = clamp(1.0 - sharpness * 4.0, 0.15, 0.95);
  let rim = mix(inner, 1.0, tip);                 // polar radius of the outline
  return length(p) / rim * 0.5;
}
`);

/** flowerSDF(st, petals) — a rose curve with N petals. */
export const flowerSDF = chunk("flowerSDF", [], /* wgsl */ `
fn flowerSDF(st: vec2f, petals: i32) -> f32 {
  let p = (st - 0.5) * 4.0;
  let r = length(p) * 2.0;
  let a = atan2(p.y, p.x);
  let lobe = abs(cos(a * f32(petals) * 0.5)) * 0.5 + 0.5;
  return r / (4.0 * lobe);
}
`);

/** gearSDF(st, bite, teeth) — a cog; `bite` 0..1 squares off the teeth. */
export const gearSDF = chunk("gearSDF", [], /* wgsl */ `
fn gearSDF(st: vec2f, bite: f32, teeth: i32) -> f32 {
  let p = (st - 0.5) * 2.0;
  let a = atan2(p.y, p.x);
  let tooth = tanh(bite * 6.0 * sin(f32(teeth) * a));   // -1..1, squarer as bite grows
  let rim = 0.62 + 0.08 * tooth;
  return length(p) / rim * 0.5;
}
`);

/** raysSDF(st, count) — sawtooth around the centre; 0.5 level set = N spokes. */
export const raysSDF = chunk("raysSDF", [TAU], /* wgsl */ `
fn raysSDF(st: vec2f, count: i32) -> f32 {
  let p = st - 0.5;
  let turns = atan2(-p.y, p.x) / TAU + 0.5;
  return fract(turns * f32(count));
}
`);
