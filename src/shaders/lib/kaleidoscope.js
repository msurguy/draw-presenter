// Kaleidoscope: fold the plane into N mirrored wedges around (0.5, 0.5).
import { chunk } from "./chunk.js";
import { TAU } from "./math.js";

/**
 * kaleidoscope_full(coord, segments, phase) -> vec2f. `coord` is in 0..1 with
 * the pivot at 0.5; the result is the coordinate reflected into the first
 * wedge (rotated by `phase`), mirror-wrapped back into 0..1 so it can be used
 * as a lookup into any other 0..1 field.
 */
export const kaleidoscope_full = chunk("kaleidoscope_full", [TAU], /* wgsl */ `
fn kaleidoscope_full(coord: vec2f, segments: f32, phase: f32) -> vec2f {
  let p = coord - 0.5;
  let radius = length(p);
  let wedge = TAU / max(segments, 1.0);
  var angle = atan2(p.y, p.x);
  angle = angle - wedge * floor(angle / wedge);   // into [0, wedge)
  angle = min(angle, wedge - angle);              // mirror the second half
  let k = vec2f(cos(angle + phase), sin(angle + phase)) * radius + 0.5;
  // Triangle-wave wrap: 0..1 stays put, 1..2 reflects back, negatives flip.
  return 1.0 - abs(fract(k * 0.5) * 2.0 - 1.0);
}
`);
