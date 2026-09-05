import type {
  AnnotationConfig,
  BracketSide,
  BrushPoint,
  LineRect,
  StrokeSpec,
} from "../types";
import { buildContour } from "./contour";
import {
  applyPressure,
  createRng,
  ellipsePoints,
  jitterPerpendicular,
  polylineLength,
  resample,
} from "./polyline";
import { unionRect } from "./rects";

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
  /**
   * VENDOR PATCH (draw-presenter): maps element-local CSS px (the space
   * config.paths.strokes are authored in) into annotation-local geometry
   * space — which is viewport-scaled when ancestors carry CSS transforms.
   */
  pathTransform?: { x: number; y: number; scaleX: number; scaleY: number };
}

const JITTER_FREQ = 1.4;

/**
 * How far watercolor spreads beyond its polygon: bleed pushes the wash
 * outward and texture scatter adds sparse outer layers. Used to grow the
 * overlay/sweep bounds so paint is never clipped at the canvas edge.
 */
function washReach(ctx: BuildContext): number {
  const fill = ctx.config.brush?.fill;
  const bleed = fill && typeof fill === "object" ? (fill.bleed ?? 0.15) : 0.15;
  const texture = fill && typeof fill === "object" ? (fill.texture ?? 0.6) : 0.6;
  return 28 + bleed * 170 + texture * 15;
}

export function buildStrokes(ctx: BuildContext): StrokeSpec[] {
  const { config } = ctx;
  const iterations = Math.max(1, config.iterations ?? 1);
  const strokes: StrokeSpec[] = [];
  let layer = 0;
  let group = 0;

  const next = { layer: () => layer++, group: () => group++ };

  for (let iter = 0; iter < iterations; iter++) {
    const seed = ctx.seed + iter * 7919;
    switch (config.type) {
      case "underline":
        buildLinePerRow(ctx, strokes, seed, next, (r) => r.y + r.h);
        break;
      case "strike-through":
        buildLinePerRow(ctx, strokes, seed, next, (r) => r.y + r.h / 2);
        break;
      case "highlight":
        buildHighlight(ctx, strokes, seed, next);
        break;
      case "box":
        buildBox(ctx, strokes, seed, next);
        break;
      case "circle":
        buildCircle(ctx, strokes, seed, next, iter);
        break;
      case "contour":
        buildContourStroke(ctx, strokes, seed, next);
        break;
      case "crossed-off":
        buildCrossedOff(ctx, strokes, seed, next);
        break;
      case "bracket":
        buildBrackets(ctx, strokes, seed, next);
        break;
      case "path":
        buildCustomPaths(ctx, strokes, seed, next);
        break;
    }
  }

  // Optional watercolor and/or hatch interior for closed shapes, revealed
  // last. The fill polygon follows the actual shape (ellipse for circle,
  // hull for contour) so paint doesn't spill outside the drawn outline.
  if (config.type === "box" || config.type === "circle" || config.type === "contour") {
    if (ctx.config.brush?.fill) addRegionFill(ctx, strokes, "wash", next);
    if (ctx.config.brush?.hatch) addRegionFill(ctx, strokes, "hatch", next);
    // weight 0 = fill/hatch only, no drawn outline.
    if (
      ctx.config.brush?.weight === 0 &&
      (ctx.config.brush.fill || ctx.config.brush.hatch)
    ) {
      return strokes.filter((s) => s.kind !== "spline");
    }
  }

  return strokes;
}

// ---------------------------------------------------------------------------

function pressureProfile(ctx: BuildContext): ((t: number) => number) | null {
  const p = ctx.config.brush?.pressure;
  if (p === undefined) return null;
  if (typeof p === "number") return () => p;
  if (typeof p === "function") return p;
  const [a, b] = p;
  return (t) => a + (b - a) * t;
}

function finalizeLine(
  ctx: BuildContext,
  points: BrushPoint[],
  seed: number,
  wordGaps: Array<[number, number]> | null,
): BrushPoint[] {
  let pts = resample(points, 10);
  pts = jitterPerpendicular(pts, 1 + ctx.fontSize / 40, seed, JITTER_FREQ);
  const profile = pressureProfile(ctx);
  if (profile) pts = applyPressure(pts, profile);
  if (wordGaps && wordGaps.length > 0) {
    // Ease pressure down inside inter-word gaps for a natural pen feel.
    pts = pts.map((p) => {
      for (const [gx1, gx2] of wordGaps) {
        if (p[0] > gx1 && p[0] < gx2) {
          return [p[0], p[1], (p[2] ?? 1) * 0.55] as BrushPoint;
        }
      }
      return p;
    });
  }
  return pts;
}

function wordGapsForLine(ctx: BuildContext, lineIndex: number): Array<[number, number]> | null {
  const boxes = ctx.wordBoxes?.[lineIndex];
  if (!boxes || boxes.length < 2) return null;
  const gaps: Array<[number, number]> = [];
  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    if (b.x - (a.x + a.w) > 1) gaps.push([a.x + a.w, b.x]);
  }
  return gaps;
}

/** Horizontal per-row strokes (underline / strike-through / marker highlight). */
function buildLinePerRow(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
  yOf: (r: LineRect) => number,
  weightMul = 1,
  maskWidthOf?: (r: LineRect) => number,
): void {
  const layer = next.layer();
  const staggerByWord = ctx.config.stagger && ctx.config.stagger.by === "word";
  ctx.lines.forEach((r, i) => {
    const y = yOf(r);
    const rowSeed = seed + i * 131;
    const boxes = staggerByWord ? ctx.wordBoxes?.[i] : null;
    const segments: Array<[number, number]> =
      boxes && boxes.length > 0
        ? boxes.map((b) => [b.x - 2, b.x + b.w + 2])
        : [[r.x, r.x + r.w]];
    for (const [x1, x2] of segments) {
      if (x2 - x1 < 2) continue;
      const pts = finalizeLine(
        ctx,
        [
          [x1, y, 1],
          [x2, y, 1],
        ],
        rowSeed,
        boxes ? null : wordGapsForLine(ctx, i),
      );
      strokes.push({
        kind: "spline",
        polyline: pts,
        curvature: 0.5,
        closed: false,
        layer,
        group: next.group(),
        lengthPx: polylineLength(pts),
        maskWidth: maskWidthOf ? maskWidthOf(r) : ctx.strokeWidthEstimate,
        weightMul,
        reveal: "stroke",
      });
    }
  });
}

function buildHighlight(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
): void {
  if (ctx.config.highlightStyle === "watercolor") {
    const layer = next.layer();
    ctx.lines.forEach((r, i) => {
      const rng = createRng(seed + i * 977);
      const pts: BrushPoint[] = [
        [r.x + rng() * 3, r.y + rng() * 2],
        [r.x + r.w - rng() * 3, r.y + rng() * 2],
        [r.x + r.w - rng() * 3, r.y + r.h - rng() * 2],
        [r.x + rng() * 3, r.y + r.h - rng() * 2],
      ];
      strokes.push({
        kind: "wash",
        polyline: pts,
        curvature: 0,
        closed: true,
        layer,
        group: next.group(),
        lengthPx: r.w,
        maskWidth: 0,
        weightMul: 1,
        reveal: "sweep",
        sweepBox: (() => {
          const reach = washReach(ctx);
          return { x: r.x - reach, y: r.y - reach, w: r.w + reach * 2, h: r.h + reach * 2 };
        })(),
      });
    });
    return;
  }
  // Marker: one fat stroke per line. weightMul converts the desired
  // line-height coverage into a strokeWeight multiplier (marker tip ~2px @ 1).
  const layer = next.layer();
  const staggerByWord = ctx.config.stagger && ctx.config.stagger.by === "word";
  ctx.lines.forEach((r, i) => {
    const y = r.y + r.h / 2;
    const rowSeed = seed + i * 131;
    const boxes = staggerByWord ? ctx.wordBoxes?.[i] : null;
    const segments: Array<[number, number]> =
      boxes && boxes.length > 0
        ? boxes.map((b) => [b.x - 3, b.x + b.w + 3])
        : [[r.x, r.x + r.w]];
    for (const [x1, x2] of segments) {
      if (x2 - x1 < 2) continue;
      let pts = resample(
        [
          [x1, y, 1],
          [x2, y, 1],
        ],
        14,
      );
      pts = jitterPerpendicular(pts, r.h * 0.045, rowSeed, 1);
      const profile = pressureProfile(ctx);
      if (profile) pts = applyPressure(pts, profile);
      strokes.push({
        kind: "spline",
        polyline: pts,
        curvature: 0.5,
        closed: false,
        layer,
        group: next.group(),
        lengthPx: polylineLength(pts),
        maskWidth: r.h * 1.6,
        weightMul: (r.h * 0.42) / Math.max(0.001, ctx.weightFinal),
        reveal: "stroke",
      });
    }
  });
}

/**
 * VENDOR PATCH (draw-presenter), type "path": paint caller-supplied
 * gestures (config.paths.strokes, element-local CSS px). Each polyline is one
 * reveal group, sequenced in array order — the brush retraces the strokes
 * like a pen. Spatially overlapping strokes (glyph crossings) are packed onto
 * separate snapshot layers so one stroke's reveal mask can't uncover paint a
 * later stroke hasn't laid down yet; layer count is capped to bound memory.
 */
const PATH_LAYER_CAP = 8;

function buildCustomPaths(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
): void {
  const cfg = ctx.config.paths;
  if (!cfg || !cfg.strokes || cfg.strokes.length === 0) return;
  const t = ctx.pathTransform ?? { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  const spacing = Math.max(2, cfg.resample ?? 6);
  const jitterAmp = cfg.jitter ?? 0;
  const profile = pressureProfile(ctx);
  // Tighter than strokeWidthEstimate (which is sized for generous underline
  // masks): glyph strokes sit close together, so the mask hugs the paint.
  const maskWidth = Math.max(12, ctx.strokeWidthEstimate * 0.55);
  const pad = maskWidth * 0.15;

  const layerBoxes: LineRect[][] = [];
  const layerIds: number[] = [];

  cfg.strokes.forEach((raw, i) => {
    if (!raw || raw.length < 2) return;
    let pts: BrushPoint[] = raw.map((p) => [
      p[0] * t.scaleX + t.x,
      p[1] * t.scaleY + t.y,
      p[2],
    ]);
    pts = resample(pts, spacing);
    if (jitterAmp > 0) pts = jitterPerpendicular(pts, jitterAmp, seed + i * 173, JITTER_FREQ);
    if (profile) pts = applyPressure(pts, profile);

    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const p of pts) {
      x1 = Math.min(x1, p[0]);
      y1 = Math.min(y1, p[1]);
      x2 = Math.max(x2, p[0]);
      y2 = Math.max(y2, p[1]);
    }
    const box: LineRect = { x: x1 - pad, y: y1 - pad, w: x2 - x1 + pad * 2, h: y2 - y1 + pad * 2 };
    let li = layerBoxes.findIndex((boxes) =>
      boxes.every(
        (b) => box.x + box.w < b.x || b.x + b.w < box.x || box.y + box.h < b.y || b.y + b.h < box.y,
      ),
    );
    if (li === -1) {
      if (layerBoxes.length < PATH_LAYER_CAP) {
        li = layerBoxes.length;
        layerBoxes.push([]);
        layerIds.push(next.layer());
      } else {
        li = i % layerBoxes.length; // cap reached: accept minor reveal bleed
      }
    }
    layerBoxes[li].push(box);

    strokes.push({
      kind: "spline",
      polyline: pts,
      curvature: cfg.curvature ?? 0.3,
      closed: false,
      layer: layerIds[li],
      group: next.group(),
      lengthPx: polylineLength(pts),
      maskWidth,
      weightMul: 1,
      reveal: "stroke",
    });
  });
}

function buildBox(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
): void {
  const r = unionRect(ctx.lines);
  const rng = createRng(seed);
  const overshoot = 2 + rng() * 3;
  const corners: BrushPoint[] = [
    [r.x - overshoot * 0.5, r.y, 1],
    [r.x + r.w, r.y, 1],
    [r.x + r.w, r.y + r.h, 1],
    [r.x, r.y + r.h, 1],
    [r.x, r.y - overshoot, 1],
  ];
  let pts = resample(corners, 10);
  pts = jitterPerpendicular(pts, 1.2, seed, JITTER_FREQ);
  const profile = pressureProfile(ctx);
  if (profile) pts = applyPressure(pts, profile);
  strokes.push({
    kind: "spline",
    polyline: pts,
    curvature: 0.35,
    closed: false,
    layer: next.layer(),
    group: next.group(),
    lengthPx: polylineLength(pts),
    maskWidth: ctx.strokeWidthEstimate,
    weightMul: 1,
    reveal: "stroke",
  });
}

function buildCircle(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
  iter: number,
): void {
  const r = unionRect(ctx.lines);
  const rng = createRng(seed);
  const start = -Math.PI / 3 + iter * 0.9 + rng() * 0.4;
  let pts = ellipsePoints(
    r.x + r.w / 2,
    r.y + r.h / 2,
    (r.w / 2) * 1.12,
    (r.h / 2) * 1.35,
    seed,
    1,
    1.06,
    start,
  );
  const profile = pressureProfile(ctx);
  if (profile) pts = applyPressure(pts, profile);
  strokes.push({
    kind: "spline",
    polyline: pts,
    curvature: 0.6,
    closed: false,
    layer: next.layer(),
    group: next.group(),
    lengthPx: polylineLength(pts),
    maskWidth: ctx.strokeWidthEstimate,
    weightMul: 1,
    reveal: "stroke",
  });
}

function buildContourStroke(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
): void {
  let pts = buildContour(ctx.lines, ctx.config.contour ?? {}, seed, ctx.lineHeight);
  const profile = pressureProfile(ctx);
  if (profile) pts = applyPressure(pts, profile);
  strokes.push({
    kind: "spline",
    polyline: pts,
    curvature: 0.55,
    closed: false,
    layer: next.layer(),
    group: next.group(),
    lengthPx: polylineLength(pts),
    maskWidth: ctx.strokeWidthEstimate,
    weightMul: 1,
    reveal: "stroke",
  });
}

function buildCrossedOff(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
): void {
  const r = unionRect(ctx.lines);
  const diagonals: Array<[BrushPoint, BrushPoint]> = [
    [
      [r.x, r.y, 1],
      [r.x + r.w, r.y + r.h, 1],
    ],
    [
      [r.x + r.w, r.y, 1],
      [r.x, r.y + r.h, 1],
    ],
  ];
  diagonals.forEach(([a, b], i) => {
    let pts = resample([a, b], 10);
    pts = jitterPerpendicular(pts, 1.5, seed + i * 337, JITTER_FREQ);
    const profile = pressureProfile(ctx);
    if (profile) pts = applyPressure(pts, profile);
    strokes.push({
      kind: "spline",
      polyline: pts,
      curvature: 0.5,
      closed: false,
      // Diagonals cross, so each needs its own snapshot layer.
      layer: next.layer(),
      group: next.group(),
      lengthPx: polylineLength(pts),
      maskWidth: ctx.strokeWidthEstimate,
      weightMul: 1,
      reveal: "stroke",
    });
  });
}

function buildBrackets(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  seed: number,
  next: { layer: () => number; group: () => number },
): void {
  const r = unionRect(ctx.lines);
  const sides: BracketSide[] = Array.isArray(ctx.config.brackets)
    ? ctx.config.brackets
    : [ctx.config.brackets ?? "right"];
  const stub = Math.min(Math.min(r.w, r.h) * 0.25, ctx.fontSize * 0.8);
  const layer = next.layer();
  sides.forEach((side, i) => {
    let corners: BrushPoint[];
    switch (side) {
      case "left":
        corners = [
          [r.x + stub, r.y, 1],
          [r.x, r.y, 1],
          [r.x, r.y + r.h, 1],
          [r.x + stub, r.y + r.h, 1],
        ];
        break;
      case "right":
        corners = [
          [r.x + r.w - stub, r.y, 1],
          [r.x + r.w, r.y, 1],
          [r.x + r.w, r.y + r.h, 1],
          [r.x + r.w - stub, r.y + r.h, 1],
        ];
        break;
      case "top":
        corners = [
          [r.x, r.y + stub, 1],
          [r.x, r.y, 1],
          [r.x + r.w, r.y, 1],
          [r.x + r.w, r.y + stub, 1],
        ];
        break;
      default:
        corners = [
          [r.x, r.y + r.h - stub, 1],
          [r.x, r.y + r.h, 1],
          [r.x + r.w, r.y + r.h, 1],
          [r.x + r.w, r.y + r.h - stub, 1],
        ];
    }
    let pts = resample(corners, 10);
    pts = jitterPerpendicular(pts, 1, seed + i * 613, JITTER_FREQ);
    const profile = pressureProfile(ctx);
    if (profile) pts = applyPressure(pts, profile);
    strokes.push({
      kind: "spline",
      polyline: pts,
      curvature: 0.3,
      closed: false,
      layer,
      group: next.group(),
      lengthPx: polylineLength(pts),
      maskWidth: ctx.strokeWidthEstimate,
      weightMul: 1,
      reveal: "stroke",
    });
  });
}

/** Fill polygon matching the drawn outline shape (same seed → same shape). */
function regionPolygon(ctx: BuildContext): BrushPoint[] {
  const r = unionRect(ctx.lines);
  switch (ctx.config.type) {
    case "circle":
      return ellipsePoints(
        r.x + r.w / 2,
        r.y + r.h / 2,
        (r.w / 2) * 1.12,
        (r.h / 2) * 1.35,
        ctx.seed,
        1,
        1,
      );
    case "contour":
      return buildContour(ctx.lines, ctx.config.contour ?? {}, ctx.seed, ctx.lineHeight);
    default: {
      const rng = createRng(ctx.seed + 4242);
      return [
        [r.x + rng() * 4, r.y + rng() * 4],
        [r.x + r.w - rng() * 4, r.y + rng() * 4],
        [r.x + r.w - rng() * 4, r.y + r.h - rng() * 4],
        [r.x + rng() * 4, r.y + r.h - rng() * 4],
      ];
    }
  }
}

function addRegionFill(
  ctx: BuildContext,
  strokes: StrokeSpec[],
  kind: "wash" | "hatch",
  next: { layer: () => number; group: () => number },
): void {
  const pts = regionPolygon(ctx);
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const p of pts) {
    x1 = Math.min(x1, p[0]);
    y1 = Math.min(y1, p[1]);
    x2 = Math.max(x2, p[0]);
    y2 = Math.max(y2, p[1]);
  }
  const reach = kind === "wash" ? washReach(ctx) : 25;
  strokes.push({
    kind,
    polyline: pts,
    curvature: 0,
    closed: true,
    layer: next.layer(),
    group: next.group(),
    lengthPx: Math.max(x2 - x1, y2 - y1),
    maskWidth: 0,
    weightMul: 1,
    reveal: "sweep",
    sweepBox: { x: x1 - reach, y: y1 - reach, w: x2 - x1 + reach * 2, h: y2 - y1 + reach * 2 },
  });
}
