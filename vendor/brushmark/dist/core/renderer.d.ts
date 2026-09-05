import { StrokeSpec } from '../types';
import { ResolvedBrush } from './brushes';
export interface ArtLayer {
    /** Layer art snapshot, device px, same origin as the overlay */
    canvas: HTMLCanvasElement;
    layer: number;
}
export interface RenderJob {
    strokes: StrokeSpec[];
    resolved: ResolvedBrush;
    /** Content size in CSS px (the overlay canvas size) */
    widthCss: number;
    heightCss: number;
    dpr: number;
    seed: number;
}
/**
 * The single shared WebGL2 surface p5.brush paints on. Annotations render
 * here one at a time (synchronously) and the result is copied out to cheap
 * per-annotation 2D canvases, so the page never holds more than one GL
 * context regardless of how many annotations exist.
 */
declare class SharedGLRenderer {
    private canvas;
    private contextLost;
    private ensureCanvas;
    get lost(): boolean;
    /**
     * Render all strokes of a job, one snapshot per layer (layers may overlap
     * each other, e.g. crossed-off diagonals, so they are masked separately).
     */
    render(job: RenderJob): ArtLayer[];
}
export declare function getRenderer(): SharedGLRenderer;
export {};
