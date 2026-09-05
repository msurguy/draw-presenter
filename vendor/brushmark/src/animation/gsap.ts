import { gsap } from "gsap";
import type {
  AnimationEngine,
  BrushTimeline,
  BrushTimelineVars,
  BrushTween,
  BrushTweenVars,
  EngineTicker,
} from "./engine";

/**
 * GSAP engine adapter. Timelines returned to users are REAL
 * gsap.core.Timeline instances (BrushTimeline is structurally satisfied by
 * gsap's types), so ScrollTrigger via timelineVars, adopting
 * annotation.timeline into your own timelines, etc. all work natively.
 *
 *   import { setAnimationEngine } from "brushmark";
 *   import { gsapEngine } from "brushmark/gsap";
 *   setAnimationEngine(gsapEngine);
 */
export const gsapEngine: AnimationEngine = {
  name: "gsap",
  createTimeline(vars?: BrushTimelineVars): BrushTimeline {
    return gsap.timeline(vars as gsap.TimelineVars);
  },
  to(target: object, vars: BrushTweenVars): BrushTween {
    return gsap.to(target, vars as gsap.TweenVars);
  },
  ticker: gsap.ticker,
};

// Compile-time proof that gsap's objects satisfy the engine contracts. If a
// future gsap version drifts, this entry fails to build — core stays clean.
const _timelineAssert: BrushTimeline = null as unknown as gsap.core.Timeline;
const _tweenAssert: BrushTween = null as unknown as gsap.core.Tween;
const _tickerAssert: EngineTicker = gsap.ticker;
void _timelineAssert;
void _tweenAssert;
void _tickerAssert;
