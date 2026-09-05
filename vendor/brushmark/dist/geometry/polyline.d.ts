import { BrushPoint } from '../types';
/** Deterministic PRNG (mulberry32). */
export declare function createRng(seed: number): () => number;
/** Stable 32-bit hash for default seeds. */
export declare function hashString(str: string): number;
/**
 * Smooth seeded 1D value noise in [-1, 1]. `x` is in arbitrary units;
 * features are ~1 unit wide.
 */
export declare function createValueNoise(seed: number): (x: number) => number;
export declare function polylineLength(points: BrushPoint[]): number;
/** Resample a polyline to roughly uniform `spacing`, keeping endpoints. */
export declare function resample(points: BrushPoint[], spacing: number): BrushPoint[];
/**
 * Offset each point perpendicular to the local direction by smooth seeded
 * noise. `amplitude` px, `frequency` = features per 100px of arc length.
 */
export declare function jitterPerpendicular(points: BrushPoint[], amplitude: number, seed: number, frequency?: number): BrushPoint[];
/** One pass of Chaikin corner cutting. */
export declare function chaikin(points: BrushPoint[], closed: boolean): BrushPoint[];
/** Points of an ellipse, slightly overshooting a full turn so ends overlap. */
export declare function ellipsePoints(cx: number, cy: number, rx: number, ry: number, seed: number, irregularity?: number, turns?: number, startAngle?: number): BrushPoint[];
/** Apply a pressure profile fn(t 0..1) to points by arc length. */
export declare function applyPressure(points: BrushPoint[], profile: (t: number) => number): BrushPoint[];
