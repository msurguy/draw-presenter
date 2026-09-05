import type { BrushPoint, ContourConfig, LineRect } from "../types";
import { chaikin, ellipsePoints, jitterPerpendicular, resample } from "./polyline";

/**
 * Build a smooth closed outline around a stack of line rects
 * (annotation-local CSS px). Returns a closed polyline ready for
 * brush.spline, starting near the top-left and running clockwise.
 */
export function buildContour(
  lines: LineRect[],
  config: ContourConfig,
  seed: number,
  lineHeight: number,
): BrushPoint[] {
  const inflate = config.inflate ?? 6;
  const roundness = config.roundness ?? 0.8;
  const irregularity = config.irregularity ?? 1;

  const rects = lines.map((r) => ({
    x: r.x - inflate,
    y: r.y - inflate,
    w: r.w + inflate * 2,
    h: r.h + inflate * 2,
  }));

  if (rects.length === 1) {
    const r = rects[0];
    const mode = config.singleLine ?? "auto";
    const useEllipse = mode === "ellipse" || (mode === "auto" && r.w / r.h < 4);
    if (useEllipse) {
      // 1.15/1.35 padding factors keep the ellipse clear of ascenders/descenders
      return ellipsePoints(
        r.x + r.w / 2,
        r.y + r.h / 2,
        (r.w / 2) * 1.12,
        (r.h / 2) * 1.35,
        seed,
        irregularity,
      );
    }
    return roundedOutline([r], roundness, irregularity, seed, lineHeight);
  }

  // Force vertical continuity between consecutive line rects.
  for (let i = 0; i < rects.length - 1; i++) {
    const boundary = (rects[i].y + rects[i].h + rects[i + 1].y) / 2;
    rects[i].h = boundary - rects[i].y;
    const delta = boundary - rects[i + 1].y;
    rects[i + 1].y = boundary;
    rects[i + 1].h -= delta;
  }

  // Suppress small horizontal jogs between adjacent lines.
  const jogLimit = 0.6 * lineHeight;
  for (let i = 0; i < rects.length - 1; i++) {
    const a = rects[i];
    const b = rects[i + 1];
    const aRight = a.x + a.w;
    const bRight = b.x + b.w;
    if (Math.abs(aRight - bRight) < jogLimit) {
      const right = Math.max(aRight, bRight);
      a.w = right - a.x;
      b.w = right - b.x;
    }
    if (Math.abs(a.x - b.x) < jogLimit) {
      const left = Math.min(a.x, b.x);
      a.w += a.x - left;
      a.x = left;
      b.w += b.x - left;
      b.x = left;
    }
  }

  return roundedOutline(rects, roundness, irregularity, seed, lineHeight);
}

/**
 * Rectilinear union outline of vertically-stacked rects, corner-cut,
 * smoothed and jittered.
 */
function roundedOutline(
  rects: LineRect[],
  roundness: number,
  irregularity: number,
  seed: number,
  lineHeight: number,
): BrushPoint[] {
  const corners: BrushPoint[] = [];
  const first = rects[0];
  const last = rects[rects.length - 1];

  // Top edge, left → right.
  corners.push([first.x, first.y, 1], [first.x + first.w, first.y, 1]);
  // Right side, stair-stepping down.
  for (let i = 0; i < rects.length - 1; i++) {
    const a = rects[i];
    const b = rects[i + 1];
    const boundary = a.y + a.h;
    if (Math.abs(a.x + a.w - (b.x + b.w)) > 0.5) {
      corners.push([a.x + a.w, boundary, 1], [b.x + b.w, boundary, 1]);
    }
  }
  corners.push([last.x + last.w, last.y + last.h, 1]);
  // Bottom edge, right → left.
  corners.push([last.x, last.y + last.h, 1]);
  // Left side, stair-stepping up.
  for (let i = rects.length - 1; i > 0; i--) {
    const b = rects[i];
    const a = rects[i - 1];
    const boundary = b.y;
    if (Math.abs(b.x - a.x) > 0.5) {
      corners.push([b.x, boundary, 1], [a.x, boundary, 1]);
    }
  }

  const maxRadius = roundness * lineHeight * 0.6;
  const cut = cutCorners(corners, maxRadius);
  const smooth = chaikin(cut, true);
  const sampled = resample([...smooth, smooth[0]], 10);
  return jitterPerpendicular(sampled, 1.5 * irregularity, seed, 1.1);
}

/** Replace each corner with two points `radius` along the adjacent edges. */
function cutCorners(corners: BrushPoint[], maxRadius: number): BrushPoint[] {
  const n = corners.length;
  const out: BrushPoint[] = [];
  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const cur = corners[i];
    const next = corners[(i + 1) % n];
    const inLen = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    const outLen = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const r = Math.min(maxRadius, inLen / 2, outLen / 2);
    if (r < 0.5 || inLen === 0 || outLen === 0) {
      out.push(cur);
      continue;
    }
    out.push(
      [
        cur[0] + ((prev[0] - cur[0]) / inLen) * r,
        cur[1] + ((prev[1] - cur[1]) / inLen) * r,
        1,
      ],
      [
        cur[0] + ((next[0] - cur[0]) / outLen) * r,
        cur[1] + ((next[1] - cur[1]) / outLen) * r,
        1,
      ],
    );
  }
  return out;
}
