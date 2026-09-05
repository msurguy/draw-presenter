// Worley (cellular) noise.
import { chunk } from "./chunk.js";
import { random22 } from "./hash.js";

/**
 * worley22(p) -> vec2f(F1, F2): distances to the nearest and second-nearest
 * feature point. Feature points sit at `cell + random22(cell)` (full jitter),
 * so a caller that needs the owning cell can recompute it with the same hash.
 * F2 - F1 ≈ 0 along cell borders — handy for seams.
 */
export const worley22 = chunk("worley22", [random22], /* wgsl */ `
fn worley22(p: vec2f) -> vec2f {
  let n = floor(p);
  let f = fract(p);
  var f1 = 8.0;
  var f2 = 8.0;
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let g = vec2f(f32(i), f32(j));
      let feature = g + random22(n + g);
      let d = distance(feature, f);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return vec2f(f1, f2);
}
`);
