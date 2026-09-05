import { BrushConfig, StrokeSpec } from '../types';
export declare const DEFAULT_BRUSH = "2B";
export declare const DEFAULT_COLOR = "#c93030";
/** Register a custom brush (p5.brush `add` params). Await image brushes. */
export declare function registerBrush(name: string, params: Record<string, unknown>): void | Promise<void>;
/** Names of every available brush (built-ins + registered). */
export declare function listBrushes(): string[];
export declare function estimateStrokeWidth(name: string, weightFinal: number): number;
export interface ResolvedFill {
    color: string;
    opacity: number;
    bleed: number;
    texture: number;
    border: number;
}
export interface ResolvedHatch {
    distance: number;
    angle: number;
    rand?: number;
    brush?: string;
    color?: string;
    weight?: number;
}
export interface ResolvedBrush {
    name: string;
    color: string;
    weightFinal: number;
    wiggle: number | false;
    field: string | false;
    fill: ResolvedFill | false;
    hatch: ResolvedHatch | false;
}
export declare function resolveBrush(config: BrushConfig | undefined, fontSize: number): ResolvedBrush;
/**
 * Execute one StrokeSpec on the active brush canvas. Assumes the caller has
 * set up transforms (annotation-local CSS px space) and seeded the RNG.
 */
export declare function paintStroke(spec: StrokeSpec, resolved: ResolvedBrush): void;
