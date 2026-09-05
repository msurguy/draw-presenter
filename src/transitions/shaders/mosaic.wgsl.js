import { noiseLib } from "./noise.wgsl.js";

// Mosaic: square tiles pop in with random timing until the frame is tiled
// over (0 → 0.5), then pop out in a different random order (0.5 → 1).
export const mosaicShader = /* wgsl */ `
struct Params {
  progress: f32,
  size: f32,
  aspect: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let cols = max(params.size, 2.0);
  let grid = vec2f(cols, max(round(cols / params.aspect), 1.0));
  let id = floor(uv * grid);
  let local = fract(uv * grid);

  let h1 = hash(id + vec2f(0.5, 0.5)) * 0.82;
  let h2 = hash(id + vec2f(31.7, 12.3)) * 0.82;
  let s1 = smoothstep(h1, h1 + 0.18, p * 2.0);
  let s2 = 1.0 - smoothstep(h2, h2 + 0.18, (p - 0.5) * 2.0);
  let size = select(s1, s2, p > 0.5);

  let r = max(abs(local.x - 0.5), abs(local.y - 0.5)) * 2.0;
  let cover = step(r, size);

  let tint = 0.8 + 0.2 * hash(id + vec2f(7.0, 3.0));
  let color = vec3f(params.r, params.g, params.b) * tint;
  let alpha = cover;
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
