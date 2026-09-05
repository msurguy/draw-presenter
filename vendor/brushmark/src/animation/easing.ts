import type { EaseFunction, EaseInput } from "./engine";

/**
 * GSAP-style named eases for the built-in engine. Families: linear/none,
 * power1..power4, sine, expo, circ, back, elastic, bounce. Suffixes .in /
 * .out / .inOut; a bare family name means .out (gsap convention).
 */

export type EaseDir = "in" | "out" | "inOut";

/** "power2.out" → { family: "power2", dir: "out" }. Strips "(…)" params. */
export function splitEase(name: string): { family: string; dir: EaseDir } {
  const clean = name.replace(/\(.*\)$/, "").trim();
  const dot = clean.indexOf(".");
  if (dot === -1) return { family: clean, dir: "out" };
  const dir = clean.slice(dot + 1);
  return {
    family: clean.slice(0, dot),
    dir: dir === "in" || dir === "inOut" ? dir : "out",
  };
}

const BACK_S = 1.70158;
const ELASTIC_P = 0.3;

/** Base "in" curve per family. */
const IN: Record<string, EaseFunction> = {
  linear: (t) => t,
  none: (t) => t,
  power1: (t) => t * t,
  power2: (t) => t * t * t,
  power3: (t) => t * t * t * t,
  power4: (t) => t * t * t * t * t,
  sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  circ: (t) => 1 - Math.sqrt(1 - t * t),
  back: (t) => t * t * ((BACK_S + 1) * t - BACK_S),
  elastic: (t) =>
    t === 0 || t === 1
      ? t
      : -Math.pow(2, 10 * (t - 1)) *
        Math.sin(((t - 1 - ELASTIC_P / 4) * (2 * Math.PI)) / ELASTIC_P),
  bounce: (t) => 1 - bounceOut(1 - t),
};

function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function out(f: EaseFunction): EaseFunction {
  return (t) => 1 - f(1 - t);
}

function inOut(f: EaseFunction): EaseFunction {
  return (t) => (t < 0.5 ? f(t * 2) / 2 : 1 - f(2 - t * 2) / 2);
}

const DEFAULT_EASE = out(IN.power2);

const warned = new Set<string>();

/** Resolve an ease input to a function; unknown names warn once and fall back. */
export function parseEase(input: EaseInput | undefined): EaseFunction {
  if (typeof input === "function") return input;
  if (input === undefined) return DEFAULT_EASE;
  const { family, dir } = splitEase(input);
  const base = IN[family];
  if (!base) {
    if (!warned.has(input)) {
      warned.add(input);
      console.warn(
        `brushmark: unknown ease "${input}" on the built-in engine, using "power2.out". ` +
          `Known families: ${Object.keys(IN).join(", ")}.`,
      );
    }
    return DEFAULT_EASE;
  }
  if (family === "linear" || family === "none") return base;
  return dir === "in" ? base : dir === "inOut" ? inOut(base) : out(base);
}
