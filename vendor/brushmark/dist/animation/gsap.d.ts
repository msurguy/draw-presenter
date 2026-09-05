import { AnimationEngine } from './engine';
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
export declare const gsapEngine: AnimationEngine;
