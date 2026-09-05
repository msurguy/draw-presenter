import { noiseLib } from "./noise.wgsl.js";

// Light leak: warm soft blobs drift across the frame over a crossfade, peaking
// mid-transition like a film light leak.
export const leakShader = /* wgsl */ `
struct Params {
  progress: f32,
  intensity: f32,
  aspect: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
${noiseLib}

fn blob(q: vec2f, c: vec2f, radius: f32) -> f32 {
  let d = q - c;
  return exp(-dot(d, d) / (radius * radius));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let env = sin(clamp(p, 0.0, 1.0) * PI);
  let a = params.aspect;
  let q = uv * vec2f(a, 1.0);
  let color = vec3f(params.r, params.g, params.b);
  let warm2 = color * vec3f(1.0, 0.55, 0.35);
  let warm3 = mix(color, vec3f(1.0, 1.0, 1.0), 0.5);

  let b1 = blob(q, vec2f(mix(-0.4, a + 0.4, p), 0.25 + 0.1 * sin(p * 6.0)), 0.32);
  let b2 = blob(q, vec2f(mix(a + 0.3, -0.3, p * 0.8 + 0.1), 0.8), 0.42);
  let b3 = blob(q, vec2f(a * 0.5 + 0.4 * cos(p * 3.0), mix(1.2, -0.2, p)), 0.28);
  let wsum = b1 + b2 + b3;
  let blobCol = (b1 * color + b2 * warm2 + b3 * warm3) / max(wsum, 1e-4);

  let grain = hash(floor(uv * vec2f(640.0, 360.0)) + floor(p * 60.0)) * 0.08;
  let veil = 0.07 * env * params.intensity;
  let alpha = clamp((wsum * 0.55 + grain) * params.intensity * env + veil, 0.0, 0.82);
  let col = mix(color, blobCol, clamp(wsum, 0.0, 1.0));
  return vec4f(col * alpha, alpha); // premultiplied
}
`;
