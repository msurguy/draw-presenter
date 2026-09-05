import { AnimationEngine } from '../animation/engine';
import { RevealDirection, StrokeSpec } from '../types';
import { ArtLayer } from './renderer';
export interface RevealGroup {
    /** Tween target */
    progress: {
        value: number;
    };
    order: number;
    strokes: StrokeSpec[];
    lengthPx: number;
}
export interface RevealState {
    overlayCtx: CanvasRenderingContext2D;
    widthCss: number;
    heightCss: number;
    dpr: number;
    layers: ArtLayer[];
    groups: RevealGroup[];
    direction: RevealDirection;
    /** Global fade multiplier (used by hide('fade')) */
    alpha: {
        value: number;
    };
    /**
     * Active left-to-right erase (hide('wipe')): fraction 0→1 of each stroke's
     * *already-drawn* portion cleared from its start edge, while the far (drawn)
     * edge stays frozen. null when not wiping. Unlike reversing the timeline,
     * this never reveals paint the draw never reached.
     */
    wipe: {
        value: number;
    } | null;
    /** Engine whose ticker drives this state's repaints */
    engine: AnimationEngine;
    dirty: boolean;
}
/**
 * Composite the current progress state onto the overlay canvas.
 *
 * Model: strokes are grouped into snapshot LAYERS (spatially independent art)
 * and reveal GROUPS (animate as one). Groups never share strokes, and strokes
 * of different groups within one layer don't overlap spatially — so each
 * layer is composited exactly once per frame, masked by the union of its
 * groups' dash/sweep shapes at their individual progress values.
 */
export declare function compositeReveal(state: RevealState): void;
export declare function markDirty(state: RevealState): void;
export declare function unregister(state: RevealState): void;
