import { AnnotationConfig, LineRect, StrokeSpec } from '../types';
export interface BuildContext {
    /** Padded line rects, annotation-local CSS px */
    lines: LineRect[];
    /** Per-line word boxes (annotation-local), if word geometry is available */
    wordBoxes: LineRect[][] | null;
    config: AnnotationConfig;
    seed: number;
    fontSize: number;
    lineHeight: number;
    /** Resolved final strokeWeight multiplier (weight × font scale) */
    weightFinal: number;
    /** Estimated painted stroke width in CSS px (for mask sizing) */
    strokeWidthEstimate: number;
}
export declare function buildStrokes(ctx: BuildContext): StrokeSpec[];
