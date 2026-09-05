// Line-drawing helpers: turn a scalar field into anti-aliased strokes.
import { chunk } from "./chunk.js";

/**
 * strokeEdge(x, center, width, edge) -> 0..1 coverage of a band of `width`
 * around `center`, softened by `edge` on both sides. Feed it a distance (or
 * any field) and it draws the `center` level set as a line.
 */
export const strokeEdge = chunk("strokeEdge", [], /* wgsl */ `
fn strokeEdge(x: f32, center: f32, width: f32, edge: f32) -> f32 {
  let lo = smoothstep(center - edge, center + edge, x + width * 0.5);
  let hi = smoothstep(center - edge, center + edge, x - width * 0.5);
  return clamp(lo - hi, 0.0, 1.0);
}
`);
