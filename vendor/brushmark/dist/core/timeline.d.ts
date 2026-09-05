import { AnimationEngine, BrushTimeline } from '../animation/engine';
import { AnnotationConfig } from '../types';
import { RevealGroup, RevealState } from './reveal';
export declare const DEFAULT_DURATION = 0.8;
export declare function prefersReducedMotion(): boolean;
/**
 * The timeline instance is created once per annotation and refilled on
 * responsive rebuilds, so references held by user code stay valid.
 */
export declare function createTimeline(config: AnnotationConfig, engine: AnimationEngine): BrushTimeline;
/**
 * (Re)build the tweens driving an annotation's reveal groups. Total duration
 * is split across groups proportionally to stroke length (rough-notation
 * behavior), sequenced in group order.
 */
export declare function fillTimeline(tl: BrushTimeline, groups: RevealGroup[], state: RevealState, config: AnnotationConfig): void;
