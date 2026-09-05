// Shared WGSL helpers spliced into transition shaders (plain string concat —
// each shader is still a self-contained module for vgpu).
export const noiseLib = /* wgsl */ `
const PI: f32 = 3.14159265;

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

fn fbm(p: vec2f) -> f32 {
  var v = 0.0;
  var amp = 0.5;
  var q = p;
  for (var i = 0; i < 4; i = i + 1) {
    v = v + amp * vnoise(q);
    q = q * 2.03 + vec2f(17.0, 9.0);
    amp = amp * 0.5;
  }
  return v;
}

// Distance from c to the farthest frame corner, in aspect-corrected units
// (x scaled by aspect so circles are round). Frame spans [0,1]x[0,1] in uv.
fn maxDist(c: vec2f, aspect: f32) -> f32 {
  let s = vec2f(aspect, 1.0);
  let d1 = length((vec2f(0.0, 0.0) - c) * s);
  let d2 = length((vec2f(1.0, 0.0) - c) * s);
  let d3 = length((vec2f(0.0, 1.0) - c) * s);
  let d4 = length((vec2f(1.0, 1.0) - c) * s);
  return max(max(d1, d2), max(d3, d4));
}

// Fade the overlay in/out at the very ends of the transition.
fn endsFade(p: f32) -> f32 {
  return smoothstep(0.0, 0.04, p) * (1.0 - smoothstep(0.96, 1.0, p));
}
`;
