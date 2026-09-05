import type { AnimationEngine } from "./engine";
import { builtinEngine } from "./builtin";

let current: AnimationEngine = builtinEngine;

/**
 * Select the animation engine driving new annotations. The engine is captured
 * when an annotation is created, so call this before annotate() — existing
 * annotations keep the engine they were created with.
 *
 *   import { gsapEngine } from "brushmark/gsap";
 *   setAnimationEngine(gsapEngine);
 */
export function setAnimationEngine(engine: AnimationEngine): void {
  current = engine;
}

export function getAnimationEngine(): AnimationEngine {
  return current;
}

export { builtinEngine, builtinTicker } from "./builtin";
export type {
  AnimationEngine,
  BrushTimeline,
  BrushTween,
  BrushTimelineVars,
  BrushTweenVars,
  EngineTicker,
  TickerCallback,
  EaseFunction,
  EaseInput,
} from "./engine";
