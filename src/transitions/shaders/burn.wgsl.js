import { noiseLib } from "./noise.wgsl.js";

// Paper burn: a glowing ember front eats across the frame leaving opaque ash
// (0 → 0.5); the ash then flakes away with a grainy, glowing-edged dissolve to
// reveal the new slide (0.5 → 1).
export const burnShader = /* wgsl */ `
struct Params {
  progress: f32,
  dirx: f32,
  diry: f32,
  scale: f32,
  aspect: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let s = vec2f(params.aspect, 1.0);
  let q = uv * s;
  let dir = normalize(vec2f(params.dirx, params.diry));

  // Project onto the travel direction, normalized over the frame's extent.
  let c1 = dot(vec2f(0.0, 0.0), dir);
  let c2 = dot(vec2f(params.aspect, 0.0), dir);
  let c3 = dot(vec2f(0.0, 1.0), dir);
  let c4 = dot(vec2f(params.aspect, 1.0), dir);
  let mn = min(min(c1, c2), min(c3, c4));
  let mx = max(max(c1, c2), max(c3, c4));
  let along = (dot(q, dir) - mn) / max(mx - mn, 1e-4);

  let n = fbm(q * params.scale * 0.5 + vec2f(3.1, 7.7));
  let f = along + (n - 0.5) * 0.45;

  let p = params.progress;
  let q1 = clamp(p * 2.0, 0.0, 1.0);
  let th = mix(-0.3, 1.3, q1);
  let dist = th - f; // > 0 → burned

  let ember = vec3f(params.r, params.g, params.b);
  let hot = mix(ember, vec3f(1.0, 0.35, 0.05), 0.5);
  let ash = vec3f(0.07, 0.065, 0.06);

  // Burned side: bright band right behind the front cooling into ash.
  let glowBand = smoothstep(-0.015, 0.0, dist) * (1.0 - smoothstep(0.0, 0.10, dist));
  var col = mix(ash, hot, glowBand);
  let line = 1.0 - smoothstep(0.0, 0.012, abs(dist - 0.006));
  col = mix(col, ember * 1.3, line * 0.9);

  // Unburned side: translucent ember glow bleeding ahead of the front.
  let ahead = exp(-max(-dist, 0.0) * 45.0) * 0.4 * step(dist, 0.0);
  var alpha = step(0.0, dist) + ahead;
  col = select(col, ember, dist < 0.0);

  // Sparks drifting in the fresh ash.
  let sp = step(0.992, hash(floor(q * 220.0) + floor(p * 40.0)))
    * smoothstep(0.25, 0.02, dist) * step(0.0, dist);
  col = mix(col, vec3f(1.0, 0.8, 0.3), sp * (1.0 - clamp((p - 0.5) * 2.0, 0.0, 1.0)));

  // Phase 2: ash flakes away, edges glowing as they go.
  let q2 = clamp((p - 0.5) * 2.0, 0.0, 1.0);
  let g = fbm(q * params.scale * 1.5 + vec2f(11.0, 5.0));
  let gone = smoothstep(g - 0.15, g + 0.15, q2 * 1.3);
  let edgeBand = smoothstep(0.0, 0.5, gone) * (1.0 - smoothstep(0.5, 1.0, gone));
  col = mix(col, hot * 0.7, select(0.0, edgeBand * 0.6, p > 0.5));
  alpha = alpha * select(1.0, 1.0 - gone, p > 0.5);

  alpha = clamp(alpha, 0.0, 1.0);
  return vec4f(col * alpha, alpha); // premultiplied
}
`;
