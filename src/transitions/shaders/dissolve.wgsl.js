// Grain-dissolve veil: animated film grain that peaks mid-transition and
// clears. Drawn premultiplied over a DOM crossfade.
export const dissolveShader = /* wgsl */ `
struct Params {
  progress: f32,
  intensity: f32,
  scale: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash(i);
  let b = hash(i + vec2f(1.0, 0.0));
  let c = hash(i + vec2f(0.0, 1.0));
  let d = hash(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.progress;
  // Envelope: nothing at the ends, full veil in the middle.
  let env = sin(clamp(t, 0.0, 1.0) * 3.14159265);

  // Two octaves of animated grain.
  let jitter = vec2f(t * 61.0, t * 17.0);
  let n1 = vnoise(uv * params.scale + jitter);
  let n2 = vnoise(uv * params.scale * 3.1 - jitter * 1.7);
  let n = n1 * 0.65 + n2 * 0.35;

  // Speck coverage rises with the envelope; soft-edged threshold.
  let cover = env * params.intensity;
  let speck = smoothstep(1.0 - cover, 1.0 - cover + 0.18, n);

  let alpha = speck * env * 0.6;
  let color = vec3f(params.r, params.g, params.b);
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
