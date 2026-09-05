import { AnimationEngine, BrushTimeline } from '../animation/engine';
import { AnnotationConfig, BrushAnnotation, HideMode } from '../types';
export declare class BrushAnnotationImpl implements BrushAnnotation {
    readonly element: HTMLElement;
    /** Captured at creation time — setAnimationEngine() only affects new annotations. */
    readonly engine: AnimationEngine;
    readonly timeline: BrushTimeline;
    private config;
    private overlay;
    private stopObserving;
    private seedValue;
    private built;
    private showing;
    private removed;
    /** Line rects relative to the element's own border box (translation-proof) */
    private lastRelativeLines;
    private revealState;
    private groups;
    private fadeTween;
    private wipeTween;
    constructor(el: HTMLElement, config: AnnotationConfig);
    /** Build geometry + art without playing (used by annotationGroup). */
    prepare(): void;
    /** Mark as showing without driving the timeline (group master drives it). */
    beginShowing(): void;
    show(): Promise<void>;
    hide(mode?: HideMode): Promise<void>;
    /** Play the timeline backwards to progress 0 and resolve when it lands. */
    private reverseToStart;
    remove(): void;
    isShowing(): boolean;
    refresh(): void;
    update(partial: Partial<AnnotationConfig>): void;
    private cancelFade;
    private cancelWipe;
    /**
     * Measure line rects with every brushmark overlay inside the element
     * hidden — each annotation's canvas would otherwise contribute a
     * full-element rect to the Range (multiple annotations can share a host).
     */
    private measureLines;
    private toRelative;
    private onLayoutChange;
    private rebuildPreservingProgress;
    /** Measure, build geometry, render art, refill the timeline. */
    private build;
}
