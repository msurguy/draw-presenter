import { BrushPoint, ContourConfig, LineRect } from '../types';
/**
 * Build a smooth closed outline around a stack of line rects
 * (annotation-local CSS px). Returns a closed polyline ready for
 * brush.spline, starting near the top-left and running clockwise.
 */
export declare function buildContour(lines: LineRect[], config: ContourConfig, seed: number, lineHeight: number): BrushPoint[];
