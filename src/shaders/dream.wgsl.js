// Dreamscape: a night sky drawn the way a plotter would — slow nebula wash,
// a twinkling star field, a gold moon, the odd shooting star, and thin
// contour lines (isolines of a drifting noise field) that breathe like the
// topography of a dream. Used as a <ShaderLayer> backdrop; `params.time` is
// written every frame.
import { compose, snoise2, snoise3, random2, random22, strokeEdge } from "./lib/index.js";

export const dreamShader = compose(snoise2, snoise3, random2, random22, strokeEdge, /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  speed: f32,      // overall drift speed
  lines: f32,      // contour density (isolines across the field range)
  glow: f32,       // line + moon glow strength
  moonx: f32,      // moon centre, uv units
  moony: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

const BRAND = vec3f(0.11, 0.46, 0.88);
const BRAND2 = vec3f(0.56, 0.71, 0.91);
const GOLD = vec3f(1.0, 0.8, 0.2);
const INK = vec3f(0.94, 0.94, 0.93);

fn fbm(p: vec2f, t: f32) -> f32 {
  var v = 0.0;
  var a = 0.5;
  var q = p;
  for (var i = 0; i < 4; i++) {
    v += a * snoise3(vec3f(q, t));
    q = q * 2.03 + vec2f(3.1, 7.7);
    a *= 0.5;
  }
  return v;
}

// Star layer: one candidate star per grid cell, twinkling out of phase.
fn stars(q: vec2f, scale: f32, t: f32, brightness: f32) -> f32 {
  let g = q * scale;
  let cell = floor(g);
  let f = fract(g);
  let r = random22(cell);
  let keep = step(0.72, random2(cell + 11.0));
  let pos = 0.15 + 0.7 * r;
  let d = length(f - pos);
  let tw = 0.55 + 0.45 * sin(t * (1.5 + 3.0 * r.x) + r.y * 6.28);
  let core = smoothstep(0.045, 0.0, d);
  let halo = exp(-d * d * 60.0) * 0.35;
  return (core + halo) * tw * keep * brightness;
}

// A streak that fires once per cycle from a random start point.
fn shootingStar(q: vec2f, t: f32) -> f32 {
  let period = 7.3;
  let cycle = floor(t / period);
  let phase = fract(t / period);
  let r = random22(vec2f(cycle, 3.0));
  let start = vec2f(0.2 + r.x * 1.2, 0.05 + r.y * 0.35);
  let dir = normalize(vec2f(0.9, 0.45));
  let len = 0.28;
  let travel = phase * 3.2;                     // moves for the first ~30% of the cycle
  let alive = smoothstep(0.0, 0.03, phase) * (1.0 - smoothstep(0.22, 0.3, phase));
  let head = start + dir * travel;
  let rel = q - head;
  let along = dot(rel, dir);                    // negative = behind the head
  let across = abs(dot(rel, vec2f(-dir.y, dir.x)));
  let tail = smoothstep(-len, 0.0, along) * step(along, 0.0);
  let body = exp(-across * across * 9000.0) * tail;
  let headGlow = exp(-dot(rel, rel) * 3500.0);
  return (body * 0.9 + headGlow) * alive;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.time * params.speed;
  let q = vec2f(uv.x * params.aspect, uv.y);      // stage-height units
  let intro = smoothstep(0.0, 3.5, params.time);  // everything fades in

  // Night sky base.
  let skyTop = vec3f(0.025, 0.03, 0.075);
  let skyBottom = vec3f(0.085, 0.06, 0.15);
  var col = mix(skyTop, skyBottom, smoothstep(0.0, 1.0, uv.y));

  // Nebula wash: two noise fields tinted blue and dusk-gold.
  let n1 = fbm(q * 0.9 + vec2f(t * 0.03, 0.0), t * 0.05) * 0.5 + 0.5;
  let n2 = fbm(q * 1.4 + vec2f(-t * 0.02, 5.0), t * 0.04 + 9.0) * 0.5 + 0.5;
  let neb = smoothstep(0.35, 0.85, n1);
  col += BRAND * neb * 0.28 * intro;
  col += vec3f(0.5, 0.3, 0.45) * smoothstep(0.55, 0.95, n2) * 0.16 * intro;

  // Stars, two parallax layers drifting very slowly.
  var s = stars(q + vec2f(t * 0.004, 0.0), 22.0, params.time, 0.55);
  s += stars(q + vec2f(t * 0.008, 3.0), 11.0, params.time, 0.85);
  col += INK * s * intro;

  // Moon: a plotted circle with a soft gold halo.
  let m = vec2f(params.moonx * params.aspect, params.moony);
  let md = length(q - m);
  let moonR = 0.075;
  let halo = exp(-max(md - moonR, 0.0) * 9.0) * 0.55 * params.glow;
  let rim = strokeEdge(md, moonR, 0.004, 0.002);
  let disc = smoothstep(moonR, moonR - 0.004, md);
  // Craters as a sparse hatch inside the disc.
  let crater = smoothstep(0.35, 0.75, snoise2(q * 60.0 + 3.0)) * disc * 0.18;
  col += GOLD * halo * intro;
  col = mix(col, mix(vec3f(0.12, 0.1, 0.05), GOLD, 0.18) + GOLD * 0.12, disc * intro);
  col += GOLD * (rim * 0.9 + crater) * intro;

  // Contour lines of a drifting field — the plotter topography.
  let field = fbm(q * 1.35 + vec2f(t * 0.05, -t * 0.02), t * 0.06 + 20.0);
  let fv = field * params.lines;
  let aa = fwidth(fv) * 1.1;
  let row = floor(fv + 0.5);
  let line = strokeEdge(fract(fv + 0.5), 0.5, aa * 1.6, aa);
  // Every line has its own ink weight, as if plotted at different pressures.
  let weight = 0.45 + 0.55 * random2(vec2f(row, 1.0));
  // Lines draw in over time, sweeping from left to right with a noisy front.
  let front = smoothstep(0.0, 4.5, params.time - 0.4) * 2.4 - 0.4;
  let drawn = smoothstep(0.25, 0.0, uv.x + snoise2(q * 3.0 + row) * 0.12 - front);
  // Lines warm to gold as they pass near the moon, fade out over the disc.
  let nearMoon = exp(-max(md - moonR, 0.0) * 5.0);
  let lineCol = mix(BRAND2, GOLD, nearMoon);
  let lineA = line * weight * drawn * (1.0 - disc) * (0.55 + 0.45 * neb);
  col += lineCol * lineA * 0.7;
  col += lineCol * lineA * params.glow * 0.6 * exp(-md * 1.2);

  // Shooting star.
  col += INK * shootingStar(q, params.time) * intro;

  // Vignette + faint paper grain so it reads like ink on dark stock.
  let v = 1.0 - smoothstep(0.55, 1.35, length((uv - 0.5) * vec2f(1.35, 1.0)));
  col *= 0.6 + 0.4 * v;
  col += (random2(uv * 1920.0 + params.time) - 0.5) * 0.015;

  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
`);
