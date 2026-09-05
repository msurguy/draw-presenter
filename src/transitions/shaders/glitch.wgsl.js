import { noiseLib } from "./noise.wgsl.js";

// Glitch: horizontal slabs, scanlines, a tear band and static that peak in the
// middle of the transition. The DOM base flickers between the two slides.
export const glitchShader = /* wgsl */ `
struct Params {
  progress: f32,
  intensity: f32,
  bands: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let env = pow(sin(clamp(p, 0.0, 1.0) * PI), 0.6);
  let seed = floor(p * 28.0);
  let accent = vec3f(params.r, params.g, params.b);

  // Random slabs per band.
  let band = floor(uv.y * params.bands + hash(vec2f(seed, 3.0)) * 3.0);
  let h = hash(vec2f(band, seed));
  let slab = step(h, env * params.intensity * 0.9);
  let x0 = hash(vec2f(band, seed + 11.0));
  let w = 0.15 + 0.7 * hash(vec2f(band, seed + 23.0));
  let inside = step(x0, uv.x) * step(uv.x, x0 + w);
  let pick = hash(vec2f(band, seed + 41.0));
  var col = accent;
  if (pick < 0.3) {
    col = vec3f(0.1, 0.9, 1.0);
  } else if (pick < 0.55) {
    col = vec3f(1.0, 0.15, 0.45);
  } else if (pick < 0.75) {
    col = vec3f(0.05, 0.05, 0.05);
  }
  var alpha = slab * inside * (0.35 + 0.5 * hash(vec2f(band, seed + 5.0)));

  // Fine scanlines.
  let scan = step(0.5, fract(uv.y * 270.0)) * 0.10 * env;
  alpha = max(alpha, scan);

  // Occasional full-width tear in the accent color.
  let tearY = hash(vec2f(seed, 77.0));
  let tear = step(abs(uv.y - tearY), 0.012 * env) * step(0.4, hash(vec2f(seed, 91.0)));
  col = select(col, accent, tear > 0.5);
  alpha = max(alpha, tear * 0.9);

  // Static.
  let grain = step(0.985 - env * 0.03, hash(floor(uv * vec2f(640.0, 360.0)) + seed));
  col = select(col, vec3f(1.0), grain > 0.5 && tear < 0.5);
  alpha = max(alpha, grain * 0.6 * env);

  alpha = clamp(alpha * endsFade(p), 0.0, 1.0);
  return vec4f(col * alpha, alpha); // premultiplied
}
`;
