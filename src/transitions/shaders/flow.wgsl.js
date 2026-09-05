// Flow: smoke advected by a curl field rolls across the stage until it covers
// the frame (0 → 0.5), then thins out and clears (0.5 → 1).
import { compose, snoise2, coverPhases, along } from "../../shaders/lib/index.js";

export const flowShader = compose(snoise2, coverPhases, along, /* wgsl */ `
struct Params {
  progress: f32,
  dirx: f32,
  diry: f32,
  aspect: f32,
  turbulence: f32,
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn fbm3(p: vec2f) -> f32 {
  var v = 0.0;
  var a = 0.5;
  var q = p;
  for (var i = 0; i < 3; i++) {
    v += a * snoise2(q);
    q = q * 2.1 + vec2f(5.2, 1.3);
    a *= 0.5;
  }
  return v * 0.5 + 0.5;
}

// Divergence-free flow: rotated gradient of a noise potential.
fn curl(p: vec2f) -> vec2f {
  let e = 0.05;
  let dx = snoise2(p + vec2f(e, 0.0)) - snoise2(p - vec2f(e, 0.0));
  let dy = snoise2(p + vec2f(0.0, e)) - snoise2(p - vec2f(0.0, e));
  return vec2f(dy, -dx) / (2.0 * e);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = params.progress;
  let q = vec2f(uv.x * params.aspect, uv.y);
  let dir = normalize(vec2f(params.dirx, params.diry));
  let a = along(q, dir, params.aspect);

  let t = p * 1.6;
  let adv = curl(q * 1.3 + vec2f(t * 0.6, -t * 0.35)) * params.turbulence * 0.06;
  let w = q + adv;
  let drift = dir * t * 0.5;
  let n1 = fbm3(w * 2.2 - drift);
  let n2 = fbm3(w * 2.2 - drift + vec2f(9.0, 3.0));

  let ph = coverPhases(p);
  let th1 = mix(-0.6, 1.7, ph.x);
  let th2 = mix(-0.6, 1.7, ph.y);
  let f1 = a + (n1 - 0.5) * 0.7;
  let f2 = a + (n2 - 0.5) * 0.7;
  let c1 = smoothstep(0.0, 0.25, th1 - f1);
  let c2 = 1.0 - smoothstep(0.0, 0.25, th2 - f2);
  let cover = select(c1, c2, p > 0.5);

  let n = select(n1, n2, p > 0.5);
  let color = vec3f(params.r, params.g, params.b);
  let col = color * (0.55 + 0.7 * n);
  let alpha = cover;
  return vec4f(col * alpha, alpha);
}
`);
