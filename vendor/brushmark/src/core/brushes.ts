import * as brush from "p5.brush/standalone";
import type { BrushConfig, StrokeSpec } from "../types";

export const DEFAULT_BRUSH = "2B";
export const DEFAULT_COLOR = "#c93030";

/** Register a custom brush (p5.brush `add` params). Await image brushes. */
export function registerBrush(
  name: string,
  params: Record<string, unknown>,
): void | Promise<void> {
  return brush.add(name, params);
}

/** Names of every available brush (built-ins + registered). */
export function listBrushes(): string[] {
  return brush.box();
}

/**
 * Rough painted-width estimate (CSS px) at strokeWeight 1 for the built-in
 * brushes: tip diameter + scatter reach both sides. Used to size reveal masks
 * generously — too big is fine, too small clips paint.
 */
const BRUSH_REACH: Record<string, number> = {
  pen: 1.5,
  rotring: 1,
  "2B": 3,
  HB: 2.5,
  "2H": 2.5,
  cpencil: 2.5,
  pastel: 12,
  crayon: 6,
  charcoal: 5,
  spray: 26,
  marker: 3,
};

export function estimateStrokeWidth(name: string, weightFinal: number): number {
  const reach = BRUSH_REACH[name] ?? 8;
  return Math.max(10, reach * weightFinal * 2 + 8);
}

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

export function resolveBrush(config: BrushConfig | undefined, fontSize: number): ResolvedBrush {
  const scale = config?.scaleWithFont === false ? 1 : fontSize / 16;
  const fill = config?.fill
    ? {
        color: config.fill.color ?? config.color ?? DEFAULT_COLOR,
        opacity: config.fill.opacity ?? 80,
        bleed: config.fill.bleed ?? 0.15,
        texture: config.fill.texture ?? 0.6,
        border: config.fill.border ?? 0.4,
      }
    : (false as const);
  const hatch = config?.hatch
    ? {
        distance: (config.hatch.distance ?? 5) * scale,
        angle: config.hatch.angle ?? 45,
        rand: config.hatch.rand,
        brush: config.hatch.brush,
        color: config.hatch.color,
        weight: config.hatch.weight,
      }
    : (false as const);
  return {
    name: config?.name ?? DEFAULT_BRUSH,
    color: config?.color ?? DEFAULT_COLOR,
    weightFinal: (config?.weight ?? 1) * scale,
    wiggle: config?.wiggle ?? false,
    field: config?.field ?? false,
    fill,
    hatch,
  };
}

/**
 * Execute one StrokeSpec on the active brush canvas. Assumes the caller has
 * set up transforms (annotation-local CSS px space) and seeded the RNG.
 */
export function paintStroke(spec: StrokeSpec, resolved: ResolvedBrush): void {
  brush.push();
  try {
    if (resolved.field) brush.field(resolved.field);
    else if (resolved.wiggle !== false && resolved.wiggle > 0) brush.wiggle(resolved.wiggle);
    else brush.noField();

    if (spec.kind === "spline") {
      brush.pick(resolved.name);
      brush.stroke(resolved.color);
      brush.strokeWeight(resolved.weightFinal * spec.weightMul);
      brush.noFill();
      brush.noHatch();
      const pts = spec.closed
        ? [...spec.polyline, spec.polyline[0], spec.polyline[1]]
        : spec.polyline;
      brush.spline(pts as Array<[number, number, number?]>, spec.curvature);
    } else if (spec.kind === "wash") {
      const fill = resolved.fill || {
        color: resolved.color,
        opacity: 80,
        bleed: 0.15,
        texture: 0.6,
        border: 0.4,
      };
      brush.noStroke();
      brush.noHatch();
      brush.fill(fill.color, fill.opacity);
      brush.fillBleed(fill.bleed);
      brush.fillTexture(fill.texture, fill.border);
      brush.polygon(spec.polyline.map((p) => [p[0], p[1]] as [number, number]));
      brush.noFill();
    } else if (spec.kind === "hatch" && resolved.hatch) {
      brush.noStroke();
      brush.noFill();
      brush.hatch(resolved.hatch.distance, resolved.hatch.angle, {
        rand: resolved.hatch.rand ?? 0.1,
      });
      brush.hatchStyle(
        resolved.hatch.brush ?? resolved.name,
        resolved.hatch.color ?? resolved.color,
        resolved.hatch.weight ?? 1,
      );
      brush.polygon(spec.polyline.map((p) => [p[0], p[1]] as [number, number]));
      brush.noHatch();
    }
  } finally {
    brush.pop();
  }
}
