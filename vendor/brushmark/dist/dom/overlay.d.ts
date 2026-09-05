import { LineRect } from '../types';
export interface Overlay {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    /** Viewport position of the overlay's top-left at last placement */
    viewport: LineRect;
    dpr: number;
    /** Undo style mutations made to the host element */
    restore: () => void;
    /** internal: isolation bookkeeping for applyOverlayStacking */
    _isolationTouched: boolean;
}
/**
 * Create the per-annotation overlay canvas INSIDE the target element, which
 * is made position:relative (if static). Anchoring inside the element means
 * the canvas travels with the text through any reflow — content changes
 * above, column resizes, scroll containers — with no position tracking.
 */
export declare function createOverlay(el: HTMLElement): Overlay;
/**
 * Stack the overlay under or over the element's text. `under` gives the
 * canvas z-index:-1 and the element isolation:isolate, so paint (highlight,
 * watercolor wash, hatching) sits below the glyphs but above the element's
 * own background. Safe to call again when config changes.
 */
export declare function applyOverlayStacking(overlay: Overlay, el: HTMLElement, under: boolean, zIndex?: number): void;
/**
 * Size and position the overlay so it covers `target` (viewport CSS px).
 * The offset from the canvas's natural (0,0) spot to the target is measured
 * directly, so any box model / display type of the host works.
 */
export declare function placeOverlay(overlay: Overlay, target: LineRect, dpr: number): void;
export declare function removeOverlay(overlay: Overlay): void;
