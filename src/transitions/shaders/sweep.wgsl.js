// Glowing sweep bar that travels with the wipe edge, with a soft trail.
export const sweepShader = /* wgsl */ `
struct Params {
  progress: f32,
  width: f32,
  r: f32,
  g: f32,
  b: f32,
  vertical: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let coord = select(uv.x, uv.y, params.vertical > 0.5);
  let cross = select(uv.y, uv.x, params.vertical > 0.5);

  // The wipe edge travels slightly past both ends so the glow fully exits.
  let edge = mix(-params.width * 2.0, 1.0 + params.width * 2.0, params.progress);
  let d = coord - edge;

  // Core line + wide glow, only near the edge.
  let core = exp(-d * d / (params.width * params.width * 0.04));
  let glow = exp(-d * d / (params.width * params.width)) * 0.55;

  // Sparkle along the edge.
  let sparkle = hash(vec2f(cross * 240.0, floor(params.progress * 90.0))) * 0.35 + 0.65;

  // Fade the whole overlay at the very ends of the transition.
  let ends = smoothstep(0.0, 0.06, params.progress) * (1.0 - smoothstep(0.94, 1.0, params.progress));

  let alpha = clamp((core * sparkle + glow) * ends, 0.0, 1.0);
  let color = vec3f(params.r, params.g, params.b);
  return vec4f(color * alpha, alpha); // premultiplied
}
`;
