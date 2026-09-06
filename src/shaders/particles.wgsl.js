import { compose, snoise3 } from "./lib/index.js";

// GPU particle simulation (vgpu compute). One thread per particle:
//
//   particles  — Three.js' own instanced storage buffer (xyz position, w = speed).
//                vgpu writes straight into it; Three.js draws from it. No copies.
//   velocities — vgpu-owned scratch (xyz velocity, w = per-particle random).
//   targets    — attractor points (a Hershey word, a torus knot…); particle i
//                is pulled toward targets[i % count] while `attract` > 0.
//
// `attract` blends between a divergence-free curl-noise flow field (0) and a
// damped spring toward the target (1). `burst` is a one-shot radial impulse.
export const particleSimShader = compose(snoise3, /* wgsl */ `
struct Params {
  time: f32,
  dt: f32,
  attract: f32,
  burst: f32,
  noiseScale: f32,
  flowSpeed: f32,
  stiffness: f32,
  spread: f32,
}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> particles: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;
@group(0) @binding(3) var<storage, read> targets: array<vec4f>;

fn potential(p: vec3f) -> vec3f {
  return vec3f(
    snoise3(p),
    snoise3(p + vec3f(31.416, 17.2, 8.1)),
    snoise3(p + vec3f(-12.7, 44.9, 23.3)),
  );
}

// Curl of the noise potential: divergence-free, so particles swirl forever
// instead of clumping.
fn curl(p: vec3f) -> vec3f {
  let e = 0.04;
  let dx = vec3f(e, 0.0, 0.0);
  let dy = vec3f(0.0, e, 0.0);
  let dz = vec3f(0.0, 0.0, e);
  let px = potential(p + dx) - potential(p - dx);
  let py = potential(p + dy) - potential(p - dy);
  let pz = potential(p + dz) - potential(p - dz);
  return vec3f(py.z - pz.y, pz.x - px.z, px.y - py.x) / (2.0 * e);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  let n = arrayLength(&particles);
  if (i >= n) { return; }

  var p = particles[i].xyz;
  var v = velocities[i].xyz;
  let rnd = velocities[i].w;
  let dt = params.dt;
  let t = params.time;

  // --- free flow: ride the curl field, drift slowly, stay near the origin
  let q = p * params.noiseScale + vec3f(t * 0.05, t * 0.03, -t * 0.04);
  let c = curl(q);
  let flow = c * params.flowSpeed * (0.6 + 0.8 * rnd);
  let r = length(p);
  let home = -p * smoothstep(1.6, 3.2, r) * 1.2;            // soft outer wall
  let orbit = vec3f(-p.z, 0.0, p.x) * 0.25;                  // gentle galaxy spin
  let vFree = mix(v, flow + home + orbit, 0.12);

  // --- attract: damped spring toward this particle's target point
  let m = arrayLength(&targets);
  let tgt = targets[i % m].xyz
    + vec3f(sin(rnd * 87.3), cos(rnd * 51.7), sin(rnd * 133.1)) * params.spread;
  let toT = tgt - p;
  let k = params.stiffness * (0.7 + 0.6 * rnd);
  let vAttr = (v + toT * k * dt) * exp(-4.5 * dt) + c * 0.003;

  v = mix(vFree, vAttr, params.attract);

  // --- one-shot radial burst (decays in JS)
  if (params.burst > 0.0) {
    let dir = normalize(p + vec3f(rnd - 0.5, rnd * 0.7 - 0.35, 0.5 - rnd) * 0.01);
    v += dir * params.burst * (0.4 + rnd);
  }

  p += v * dt;

  particles[i] = vec4f(p, length(v));
  velocities[i] = vec4f(v, rnd);
}
`);
