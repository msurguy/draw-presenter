// Shatter: the frame cracks into Voronoi cells that fill in one by one from
// their centers (0 → 0.5), with glowing seams, then drop away in another
// order (0.5 → 1). worley22 gives F1/F2 (seams); random hashes pick timings.
import { compose, worley22, random2, random22, coverPhases } from "../../shaders/lib/index.js";

export const shatterShader = compose(worley22, random2, random22, coverPhases, /* wgsl */ `
struct Params {
  progress: f32,
  cells: f32,
  aspect: f32,
  tint: f32,
  seed: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

// Integer cell that owns q (same jitter as worley22, so F1/F2 agree).
fn nearestCell(q: vec2f) -> vec2f {
  let n = floor(q);
  let f = fract(q);
  var best = 8.0;
  var cell = n;
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let g = vec2f(f32(i), f32(j));
      let o = random22(n + g);
      let d = length(g + o - f);
      if (d < best) {
        best = d;
        cell = n + g;
      }
    }
  }
  return cell;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let q = vec2f(uv.x * params.aspect, uv.y) * params.cells + vec2f(params.seed, params.seed * 0.7);
  let w = worley22(q);
  let cell = nearestCell(q);
  let h1 = random2(cell + vec2f(7.3, 1.1)) * 0.8;
  let h2 = random2(cell + vec2f(19.1, 5.7)) * 0.8;

  // 0 at the cell center, ~1 at its border.
  let ratio = 2.0 * w.x / max(w.x + w.y, 1e-4);
  let ph = coverPhases(p);
  let s1 = smoothstep(h1, h1 + 0.2, ph.x);
  let s2 = 1.0 - smoothstep(h2, h2 + 0.2, ph.y);
  let s = select(s1, s2, p > 0.5);
  let cover = step(ratio, s * 1.06);

  // Stained-glass tint per cell over a dark base; seams in the accent color.
  let hue = random2(cell + vec2f(3.7, 9.2));
  let pal = 0.5 + 0.5 * cos(6.2831853 * (vec3f(0.0, 0.33, 0.67) + hue));
  let base = vec3f(0.13, 0.13, 0.14);
  let seamColor = vec3f(params.r, params.g, params.b);
  let seam = 1.0 - smoothstep(0.0, 0.045, w.y - w.x);
  let growing = step(0.001, s) * (1.0 - step(0.999, s));
  let edge = (1.0 - smoothstep(0.0, 0.07, abs(ratio - s * 1.06))) * growing;

  var col = mix(base, pal * 0.7, params.tint);
  col = mix(col, seamColor, max(seam * cover, edge));
  let alpha = clamp(max(cover, edge * 0.7), 0.0, 1.0);
  return vec4f(col * alpha, alpha);
}
`);
