import gsap from "gsap";
import { shaderOverlay, OVERLAY_ASPECT } from "./overlay.js";
import { isWebGpuSupported } from "../gpu/context.js";
import { dissolveShader } from "./shaders/dissolve.wgsl.js";
import { sweepShader } from "./shaders/sweep.wgsl.js";
import { inkShader } from "./shaders/ink.wgsl.js";
import { burnShader } from "./shaders/burn.wgsl.js";
import { irisShader } from "./shaders/iris.wgsl.js";
import { rippleShader } from "./shaders/ripple.wgsl.js";
import { blindsShader } from "./shaders/blinds.wgsl.js";
import { mosaicShader } from "./shaders/mosaic.wgsl.js";
import { glitchShader } from "./shaders/glitch.wgsl.js";
import { leakShader } from "./shaders/leak.wgsl.js";
// Generative shaders composed from the snippet library in src/shaders/lib/.
import { shatterShader } from "./shaders/shatter.wgsl.js";
import { flowShader } from "./shaders/flow.wgsl.js";
import { mandalaShader } from "./shaders/mandala.wgsl.js";
import { halftoneShader } from "./shaders/halftone.wgsl.js";
import { hatchShader } from "./shaders/hatch.wgsl.js";

// Shader-flavored transitions: a robust DOM reveal underneath plus a WGSL
// overlay driven by the same progress value. With no WebGPU, the overlay is a
// no-op and the DOM base still carries the transition.
//
// Two families:
//   • edge/veil overlays (dissolve, sweep, iris, ripple, light-leak) — the DOM
//     does the actual reveal (crossfade / clip-path) and the shader decorates it.
//   • cover-swap overlays (ink, burn, blinds, mosaic) — the shader fully covers
//     the stage at progress 0.5, the DOM hard-swaps slides while hidden, and
//     the shader clears. Without WebGPU these fall back to a crossfade.

// ----------------------------------------------------------------- helpers

/** "#rgb" | "#rrggbb" | "var(--token)" → { r, g, b } in 0..1. */
function rgb01(value, fallback) {
  let v = String(value || fallback).trim();
  const m = v.match(/^var\((--[\w-]+)\)$/);
  if (m && typeof document !== "undefined") {
    v = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || fallback;
  }
  let hex = v.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) hex = fallback.replace("#", "");
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

const num = (v, def) => (typeof v === "number" && Number.isFinite(v) ? v : def);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const jhash = (x) => {
  const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Farthest-corner distance from (cx, cy) in stage-height units (matches WGSL maxDist). */
function maxDist(cx, cy) {
  const a = OVERLAY_ASPECT;
  let m = 0;
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    m = Math.max(m, Math.hypot((x - cx) * a, y - cy));
  }
  return m;
}

/**
 * Timeline whose overlay is torn down whether it completes (forward or in
 * reverse), is fast-forwarded (progress() → completion) or is killed
 * mid-flight (onInterrupt).
 */
function overlayTimeline(overlay, onComplete) {
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.end();
  };
  const done = () => {
    close();
    onComplete();
  };
  return gsap.timeline({ onComplete: done, onReverseComplete: done, onInterrupt: close });
}

/** Drive `onUpdate(p)` with p 0→1 over `duration` on the timeline. */
function drive(tl, duration, onUpdate, ease = "none") {
  const proxy = { p: 0 };
  tl.to(proxy, { p: 1, duration, ease, onUpdate: () => onUpdate(proxy.p) }, 0);
  return tl;
}

/**
 * Cover-swap base: the shader hides everything at p = 0.5, where the DOM swaps
 * the incoming slide in. Without WebGPU the swap becomes a crossfade so the
 * transition never degrades to a delayed hard cut.
 */
function coverSwap({ incomingEl, duration, reverse, onRevealed, onComplete }, overlay, easeName = "none") {
  const gpu = isWebGpuSupported();
  if (!reverse) gsap.set(incomingEl, { opacity: 0 });
  const ease = gsap.parseEase(easeName);
  const tl = overlayTimeline(overlay, onComplete);
  drive(tl, duration, (raw) => {
    const p = ease(raw);
    overlay.setProgress(p);
    incomingEl.style.opacity = gpu ? (p >= 0.5 ? "1" : "0") : String(clamp01(p));
  });
  tl.call(onRevealed, null, duration * 0.5);
  return tl;
}

/** Circular clip-path reveal with a shader riding the rim (iris, ripple). */
function circleReveal({ incomingEl, duration, reverse, onRevealed, onComplete, params }, overlay, cx, cy) {
  const md = maxDist(cx, cy);
  const ease = gsap.parseEase(params.ease || "power2.inOut");
  const at = `${cx * 100}% ${cy * 100}%`;
  if (!reverse) incomingEl.style.clipPath = `circle(0px at ${at})`;
  const tl = overlayTimeline(overlay, onComplete);
  drive(tl, duration, (raw) => {
    const e = ease(raw);
    const px = e * md * 1.02 * 1080; // stage-height units → stage px
    incomingEl.style.clipPath = `circle(${px.toFixed(1)}px at ${at})`;
    overlay.setProgress(e);
  });
  tl.call(onRevealed, null, duration * 0.4);
  return tl;
}

const DIR_VECTORS = {
  left: [1, 0],
  right: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  diagonal: [1, 1],
};

// ------------------------------------------------------------- transitions

export const shaderTransitions = {
  "dissolve-shader"(args) {
    const { incomingEl, stageEl, duration, params, onRevealed, onComplete } = args;
    const color = rgb01(params.color, "#f0efec");
    const overlay = shaderOverlay(stageEl, dissolveShader, {
      intensity: num(params.intensity, 0.75),
      scale: num(params.scale, 110),
      ...color,
    });
    const tl = overlayTimeline(overlay, onComplete);
    tl.fromTo(incomingEl, { opacity: 0 }, { opacity: 1, duration, ease: "power2.inOut" }, 0);
    drive(tl, duration, (p) => overlay.setProgress(p));
    tl.call(onRevealed, null, duration * 0.4);
    return tl;
  },

  "sweep-shader"(args) {
    const { incomingEl, stageEl, duration, params, onRevealed, onComplete } = args;
    const dir = params.direction || "left";
    const vertical = dir === "up" || dir === "down";
    // Clip semantics match `wipe`: "left" starts at the left edge, "up" starts
    // at the bottom edge. The glow bar's coordinate runs 0→1 left/top→right/
    // bottom, so it is reversed for "right" and "up".
    const clipReversed = dir === "right" || dir === "down";
    const glowReversed = vertical ? dir === "up" : dir === "right";
    const color = rgb01(params.color, "#ffcc33");
    const overlay = shaderOverlay(stageEl, sweepShader, {
      width: num(params.width, 0.06),
      vertical: vertical ? 1 : 0,
      ...color,
    });
    const ease = gsap.parseEase("power2.inOut");
    const tl = overlayTimeline(overlay, onComplete);
    drive(tl, duration, (raw) => {
      const e = ease(raw);
      const pct = (1 - e) * 100;
      incomingEl.style.clipPath = vertical
        ? clipReversed
          ? `inset(0 0 ${pct}% 0)`
          : `inset(${pct}% 0 0 0)`
        : clipReversed
          ? `inset(0 0 0 ${pct}%)`
          : `inset(0 ${pct}% 0 0)`;
      overlay.setProgress(glowReversed ? 1 - e : e);
    });
    tl.call(onRevealed, null, duration * 0.4);
    return tl;
  },

  "ink-shader"(args) {
    const { stageEl, params } = args;
    const color = rgb01(params.color, "#111111");
    const overlay = shaderOverlay(stageEl, inkShader, {
      cx: clamp01(num(params.x, 0.5)),
      cy: clamp01(num(params.y, 0.5)),
      aspect: OVERLAY_ASPECT,
      scale: num(params.scale, 3),
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "burn-shader"(args) {
    const { stageEl, params } = args;
    const [dirx, diry] = DIR_VECTORS[params.direction] || DIR_VECTORS.left;
    const color = rgb01(params.color, "#ffcc33");
    const overlay = shaderOverlay(stageEl, burnShader, {
      dirx,
      diry,
      scale: num(params.scale, 4),
      aspect: OVERLAY_ASPECT,
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "blinds-shader"(args) {
    const { stageEl, params } = args;
    const color = rgb01(params.color, "#202020");
    const overlay = shaderOverlay(stageEl, blindsShader, {
      count: Math.max(1, Math.round(num(params.count, 8))),
      vertical: params.direction === "vertical" ? 1 : 0,
      stagger: clamp01(num(params.stagger, 0.35)),
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "mosaic-shader"(args) {
    const { stageEl, params } = args;
    const color = rgb01(params.color, "#1c76e1");
    const overlay = shaderOverlay(stageEl, mosaicShader, {
      size: Math.max(2, Math.round(num(params.size, 16))),
      aspect: OVERLAY_ASPECT,
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "iris-shader"(args) {
    const { stageEl, params } = args;
    const cx = clamp01(num(params.x, 0.5));
    const cy = clamp01(num(params.y, 0.5));
    const color = rgb01(params.color, "#ffcc33");
    const overlay = shaderOverlay(stageEl, irisShader, {
      cx,
      cy,
      aspect: OVERLAY_ASPECT,
      width: num(params.width, 0.05),
      ...color,
    });
    return circleReveal(args, overlay, cx, cy);
  },

  "ripple-shader"(args) {
    const { stageEl, params } = args;
    const cx = clamp01(num(params.x, 0.5));
    const cy = clamp01(num(params.y, 0.5));
    const color = rgb01(params.color, "#8fb6e8");
    const overlay = shaderOverlay(stageEl, rippleShader, {
      cx,
      cy,
      aspect: OVERLAY_ASPECT,
      rings: num(params.rings, 14),
      intensity: num(params.intensity, 0.9),
      ...color,
    });
    return circleReveal(args, overlay, cx, cy);
  },

  "glitch-shader"(args) {
    const { outgoingEl, incomingEl, stageEl, duration, params, reverse, onRevealed, onComplete } = args;
    const color = rgb01(params.color, "#ffcc33");
    const intensity = clamp01(num(params.intensity, 0.8));
    const overlay = shaderOverlay(stageEl, glitchShader, {
      intensity,
      bands: Math.max(2, Math.round(num(params.bands, 24))),
      ...color,
    });
    if (!reverse) gsap.set(incomingEl, { opacity: 0 });
    const tl = overlayTimeline(overlay, onComplete);
    drive(tl, duration, (p) => {
      overlay.setProgress(p);
      const env = Math.pow(Math.sin(p * Math.PI), 0.6) * intensity;
      const seed = Math.floor(p * 28);
      // Flicker between slides, biased toward the incoming as p grows.
      const visible = p >= 0.85 || (p > 0.12 && jhash(seed * 7.13) < p * 1.1);
      incomingEl.style.opacity = visible ? "1" : "0";
      const jx = (jhash(seed * 3.1 + 1) - 0.5) * 48 * env;
      const jy = (jhash(seed * 5.7 + 2) - 0.5) * 14 * env;
      const done = p >= 0.96;
      incomingEl.style.transform = done ? "" : `translate(${jx.toFixed(1)}px, ${jy.toFixed(1)}px)`;
      if (outgoingEl) outgoingEl.style.transform = `translate(${(-jx * 0.6).toFixed(1)}px, ${(jy * 0.4).toFixed(1)}px)`;
    });
    tl.call(onRevealed, null, duration * 0.5);
    return tl;
  },

  // ---- generative cover-swaps (noise / SDF snippets from src/shaders/lib) --

  "shatter-shader"(args) {
    const { stageEl, params } = args;
    const color = rgb01(params.color, "#ffcc33");
    const overlay = shaderOverlay(stageEl, shatterShader, {
      cells: Math.max(2, num(params.cells, 7)),
      aspect: OVERLAY_ASPECT,
      tint: clamp01(num(params.tint, 0.5)),
      seed: num(params.seed, 3.1),
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "flow-shader"(args) {
    const { stageEl, params } = args;
    const [dirx, diry] = DIR_VECTORS[params.direction] || DIR_VECTORS.left;
    const color = rgb01(params.color, "#8fb6e8");
    const overlay = shaderOverlay(stageEl, flowShader, {
      dirx,
      diry,
      aspect: OVERLAY_ASPECT,
      turbulence: num(params.turbulence, 1),
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "mandala-shader"(args) {
    const { stageEl, params } = args;
    const base = rgb01(params.color, "#202020");
    const line = rgb01(params.lineColor, "#ffcc33");
    const overlay = shaderOverlay(stageEl, mandalaShader, {
      segments: Math.max(3, Math.round(num(params.segments, 8))),
      rings: Math.max(1, Math.round(num(params.rings, 5))),
      aspect: OVERLAY_ASPECT,
      cx: clamp01(num(params.x, 0.5)),
      cy: clamp01(num(params.y, 0.5)),
      ...base,
      lr: line.r,
      lg: line.g,
      lb: line.b,
    });
    return coverSwap(args, overlay);
  },

  "halftone-shader"(args) {
    const { stageEl, params } = args;
    const [dirx, diry] = DIR_VECTORS[params.direction] || DIR_VECTORS.left;
    const color = rgb01(params.color, "#ffcc33");
    const overlay = shaderOverlay(stageEl, halftoneShader, {
      pitch: Math.max(4, num(params.pitch, 28)),
      angle: (num(params.angle, 15) * Math.PI) / 180,
      aspect: OVERLAY_ASPECT,
      dirx,
      diry,
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "hatch-shader"(args) {
    const { stageEl, params } = args;
    const color = rgb01(params.color, "#f0efec");
    const overlay = shaderOverlay(stageEl, hatchShader, {
      spacing: Math.max(4, num(params.spacing, 36)),
      angle1: (num(params.angle1, 35) * Math.PI) / 180,
      angle2: (num(params.angle2, -50) * Math.PI) / 180,
      wobble: num(params.wobble, 1),
      weight: Math.min(1, Math.max(0.05, num(params.weight, 0.28))),
      aspect: OVERLAY_ASPECT,
      ...color,
    });
    return coverSwap(args, overlay);
  },

  "light-leak-shader"(args) {
    const { incomingEl, stageEl, duration, params, onRevealed, onComplete } = args;
    const color = rgb01(params.color, "#ffcc33");
    const overlay = shaderOverlay(stageEl, leakShader, {
      intensity: num(params.intensity, 0.8),
      aspect: OVERLAY_ASPECT,
      ...color,
    });
    const tl = overlayTimeline(overlay, onComplete);
    tl.fromTo(incomingEl, { opacity: 0 }, { opacity: 1, duration, ease: "power1.inOut" }, 0);
    drive(tl, duration, (p) => overlay.setProgress(p));
    tl.call(onRevealed, null, duration * 0.45);
    return tl;
  },
};
