import { AnimationEngine } from './engine';
/**
 * Select the animation engine driving new annotations. The engine is captured
 * when an annotation is created, so call this before annotate() — existing
 * annotations keep the engine they were created with.
 *
 *   import { gsapEngine } from "brushmark/gsap";
 *   setAnimationEngine(gsapEngine);
 */
export declare function setAnimationEngine(engine: AnimationEngine): void;
export declare function getAnimationEngine(): AnimationEngine;
export { builtinEngine, builtinTicker } from './builtin';
export type { AnimationEngine, BrushTimeline, BrushTween, BrushTimelineVars, BrushTweenVars, EngineTicker, TickerCallback, EaseFunction, EaseInput, } from './engine';
