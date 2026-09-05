import { LineRect, Padding } from '../types';
export interface ResolvedPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export declare function resolvePadding(padding: Padding | undefined, fallback?: number): ResolvedPadding;
/**
 * Measure the target's per-line rects in viewport CSS px.
 * Uses a Range so block elements also report one rect per wrapped line.
 */
export declare function measureLineRects(el: HTMLElement, multiline: boolean): LineRect[];
export declare function unionRect(rects: LineRect[]): LineRect;
export declare function padRect(r: LineRect, p: ResolvedPadding): LineRect;
export declare function rectsEqual(a: LineRect[], b: LineRect[], epsilon?: number): boolean;
