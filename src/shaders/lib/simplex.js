// Simplex noise, ported to WGSL from the "webgl-noise" reference
// implementation by Ian McEwan, Ashima Arts (MIT License, © 2011 Ashima Arts;
// Stefan Gustavson & contributors, https://github.com/ashima/webgl-noise).
// Output is roughly in [-1, 1].
import { chunk } from "./chunk.js";

const mod289 = chunk("mod289", [], /* wgsl */ `
fn mod289_2(x: vec2f) -> vec2f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_3(x: vec3f) -> vec3f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289_4(x: vec4f) -> vec4f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
`);

const permute = chunk("permute", [mod289], /* wgsl */ `
fn permute3(x: vec3f) -> vec3f { return mod289_3(((x * 34.0) + 1.0) * x); }
fn permute4(x: vec4f) -> vec4f { return mod289_4(((x * 34.0) + 1.0) * x); }
`);

const taylorInvSqrt = chunk("taylorInvSqrt", [], /* wgsl */ `
fn taylorInvSqrt4(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }
`);

/** snoise2(vec2f) -> f32 — 2D simplex noise. */
export const snoise2 = chunk("snoise2", [mod289, permute], /* wgsl */ `
// 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT).
fn snoise2(v: vec2f) -> f32 {
  let C = vec4f(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  var i = floor(v + dot(v, C.yy));
  let x0 = v - i + dot(i, C.xx);
  let i1 = select(vec2f(0.0, 1.0), vec2f(1.0, 0.0), x0.x > x0.y);
  let x12 = x0.xyxy + C.xxzz - vec4f(i1, 0.0, 0.0);
  i = mod289_2(i);
  let p = permute3(permute3(i.y + vec3f(0.0, i1.y, 1.0)) + i.x + vec3f(0.0, i1.x, 1.0));
  var m = max(0.5 - vec3f(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3f(0.0));
  m = m * m;
  m = m * m;
  let x = 2.0 * fract(p * C.www) - 1.0;
  let h = abs(x) - 0.5;
  let ox = floor(x + 0.5);
  let a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  let gx = a0.x * x0.x + h.x * x0.y;
  let gyz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, vec3f(gx, gyz));
}
`);

/** snoise3(vec3f) -> f32 — 3D simplex noise (use z as time). */
export const snoise3 = chunk("snoise3", [mod289, permute, taylorInvSqrt], /* wgsl */ `
// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT).
fn snoise3(v: vec3f) -> f32 {
  let C = vec2f(1.0 / 6.0, 1.0 / 3.0);
  let D = vec4f(0.0, 0.5, 1.0, 2.0);
  var i = floor(v + dot(v, C.yyy));
  let x0 = v - i + dot(i, C.xxx);
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min(g.xyz, l.zxy);
  let i2 = max(g.xyz, l.zxy);
  let x1 = x0 - i1 + C.xxx;
  let x2 = x0 - i2 + C.yyy;
  let x3 = x0 - D.yyy;
  i = mod289_3(i);
  let p = permute4(permute4(permute4(
      i.z + vec4f(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4f(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4f(0.0, i1.x, i2.x, 1.0));
  let n_ = 0.142857142857;
  let ns = n_ * D.wyz - D.xzx;
  let j = p - 49.0 * floor(p * ns.z * ns.z);
  let x_ = floor(j * ns.z);
  let y_ = floor(j - 7.0 * x_);
  let x = x_ * ns.x + ns.yyyy;
  let y = y_ * ns.x + ns.yyyy;
  let h = 1.0 - abs(x) - abs(y);
  let b0 = vec4f(x.xy, y.xy);
  let b1 = vec4f(x.zw, y.zw);
  let s0 = floor(b0) * 2.0 + 1.0;
  let s1 = floor(b1) * 2.0 + 1.0;
  let sh = -step(h, vec4f(0.0));
  let a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  let a1 = b1.xzyw + s1.xzyw * sh.zzww;
  var p0 = vec3f(a0.xy, h.x);
  var p1 = vec3f(a0.zw, h.y);
  var p2 = vec3f(a1.xy, h.z);
  var p3 = vec3f(a1.zw, h.w);
  let norm = taylorInvSqrt4(vec4f(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  var m = max(0.6 - vec4f(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4f(0.0));
  m = m * m;
  return 42.0 * dot(m * m, vec4f(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`);
