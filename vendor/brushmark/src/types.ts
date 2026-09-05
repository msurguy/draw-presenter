import type { BrushTimeline, BrushTimelineVars, EaseInput } from "./animation/engine";

export type AnnotationType =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "contour"
  | "strike-through"
  | "crossed-off"
  | "bracket"
  /** VENDOR PATCH (draw-presenter): caller-supplied stroke polylines */
  | "path";

export type BracketSide = "left" | "right" | "top" | "bottom";

export type Padding =
  | number
  | [vertical: number, horizontal: number]
  | [top: number, right: number, bottom: number, left: number];

/** A point in annotation-local CSS pixels: [x, y, pressure?] */
export type BrushPoint = [number, number, number?];

export type PressureConfig =
  | number
  | [min: number, max: number]
  | ((t: number) => number);

export interface WatercolorFillConfig {
  color?: string;
  /** 0–255 fill opacity, default 80 */
  opacity?: number;
  /** 0–1 bleed intensity, default 0.15 */
  bleed?: number;
  /** 0–1 texture strength, default 0.6 */
  texture?: number;
  /** 0–1 border intensity, default 0.4 */
  border?: number;
}

export interface HatchConfig {
  /** Distance between hatch lines in px (scaled with font size) */
  distance?: number;
  /** Hatch angle in degrees */
  angle?: number;
  /** 0–1 randomness */
  rand?: number;
  /** Brush used for hatch lines (defaults to the main brush) */
  brush?: string;
  color?: string;
  weight?: number;
}

export interface BrushConfig {
  /** Brush name: any of listBrushes() or a registerBrush()-ed custom brush */
  name?: string;
  color?: string;
  /**
   * Stroke weight multiplier (p5.brush strokeWeight semantics, default 1).
   * Scaled by font size when scaleWithFont is true.
   */
  weight?: number;
  /** Scale stroke weight with the target's font size (default true) */
  scaleWithFont?: boolean;
  /** Pressure along the stroke: constant, [start,end] ramp, or fn of t 0..1 */
  pressure?: PressureConfig;
  /** Hand-tremor wobble intensity (p5.brush wiggle), false to disable */
  wiggle?: number | false;
  /** Named p5.brush vector field to distort strokes, false for none */
  field?: string | false;
  /** Watercolor fill for closed shapes / highlight, false for none */
  fill?: WatercolorFillConfig | false;
  /** Hatch fill for closed shapes, false for none */
  hatch?: HatchConfig | false;
}

export type RevealMode = "auto" | "stroke" | "sweep" | "fade";
export type RevealDirection = "ltr" | "rtl" | "center-out";
export type HideMode = "reverse" | "fade" | "instant" | "wipe";

export interface StaggerConfig {
  by: "line" | "word" | "stroke";
  /** Gap in seconds between the start of consecutive items (default: contiguous) */
  each?: number;
  /** Fraction 0–1 of overlap between consecutive items (alternative to each) */
  overlap?: number;
}

export interface ContourConfig {
  /** Extra outward inflation in px beyond padding (default 6) */
  inflate?: number;
  /** 0–1 corner roundness (default 0.8) */
  roundness?: number;
  /** Hand-drawn irregularity amplitude multiplier (default 1) */
  irregularity?: number;
  /** Shape when the text fits a single line */
  singleLine?: "auto" | "ellipse" | "box";
}

export interface AnimationConfig {
  /** false renders the finished annotation instantly */
  animate?: boolean;
  /** Total duration in seconds (GSAP convention), default 0.8 */
  duration?: number;
  /** Delay in seconds before the animation starts */
  delay?: number;
  /** GSAP-style ease: "power2.out", "elastic", custom function… */
  ease?: EaseInput;
  /** Number of passes drawn with jittered offsets (rough-notation style) */
  iterations?: number;
  direction?: RevealDirection;
  stagger?: StaggerConfig | false;
  /** Timeline repeat (-1 = infinite) */
  repeat?: number;
  yoyo?: boolean;
  /** Extra vars merged into the annotation's timeline (scrollTrigger, callbacks…). Engine-specific keys are passed through to the active engine. */
  timelineVars?: BrushTimelineVars;
  revealMode?: RevealMode;
  /** Seed for deterministic art; defaults to a stable per-annotation hash */
  seed?: number;
  /** 'snap' keeps progress across responsive re-layouts, 'replay' restarts */
  onResize?: "snap" | "replay";
}

/**
 * VENDOR PATCH (draw-presenter): config for type "path" — the brush paints
 * caller-supplied gestures (e.g. single-stroke font glyphs) and the reveal
 * mask follows each polyline, so the brush visibly retraces the source paths.
 */
export interface PathsConfig {
  /** Brush gestures in element-local CSS px: arrays of [x, y, pressure?] */
  strokes: BrushPoint[][];
  /** Perpendicular hand-tremor amplitude in px (default 0 — trace exactly) */
  jitter?: number;
  /** Resample spacing in px before painting (default 6) */
  resample?: number;
  /** Spline curvature 0–1 (default 0.3; 0 keeps corners sharpest) */
  curvature?: number;
}

export interface AnnotationConfig extends AnimationConfig {
  type: AnnotationType;
  /** Only for type "path" (vendor patch) */
  paths?: PathsConfig;
  brush?: BrushConfig;
  padding?: Padding;
  /** Annotate each wrapped line separately (default true) */
  multiline?: boolean;
  rtl?: boolean;
  brackets?: BracketSide | BracketSide[];
  /** highlight rendering style (default 'marker') */
  highlightStyle?: "marker" | "watercolor";
  contour?: ContourConfig;
  zIndex?: number;
}

export interface BrushAnnotation {
  /**
   * Measure, build geometry and paint the art without playing — fills the
   * timeline so it can be scrubbed/nested before show() is ever called.
   */
  prepare(): void;
  /** Render (if needed) and play the timeline. Resolves when complete. */
  show(): Promise<void>;
  /**
   * 'reverse' un-draws the strokes (retracing them backwards), 'wipe' erases
   * in the same direction they drew (the starting edge clears first),
   * 'fade' fades the overlay, 'instant' clears.
   */
  hide(mode?: HideMode): Promise<void>;
  /** Remove overlay, observers and tweens. The annotation is dead afterwards. */
  remove(): void;
  isShowing(): boolean;
  /** Force re-measure + re-render (keeps seed and progress) */
  refresh(): void;
  /** Merge new config values and re-render */
  update(partial: Partial<AnnotationConfig>): void;
  /**
   * The paused timeline driving this annotation — adoptable into your own.
   * A real gsap.core.Timeline when using the gsap engine.
   */
  readonly timeline: BrushTimeline;
  readonly element: HTMLElement;
}

export interface BrushAnnotationGroup {
  /** Master timeline — a real gsap.core.Timeline when using the gsap engine. */
  readonly timeline: BrushTimeline;
  show(): Promise<void>;
  hide(): void;
  readonly annotations: BrushAnnotation[];
}

// ---------------------------------------------------------------------------
// Internal geometry model
// ---------------------------------------------------------------------------

export interface LineRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StrokeKind = "spline" | "wash" | "hatch";

/** One brush gesture, in annotation-local CSS px. */
export interface StrokeSpec {
  kind: StrokeKind;
  polyline: BrushPoint[];
  curvature: number;
  closed: boolean;
  /** Strokes on the same layer are snapshotted together (must not overlap between reveal groups) */
  layer: number;
  /** Reveal groups animate as units, in ascending order */
  group: number;
  lengthPx: number;
  /** Mask stroke width in CSS px ('stroke' reveal) */
  maskWidth: number;
  /** Extra strokeWeight multiplier on top of BrushConfig.weight */
  weightMul: number;
  /** Reveal mode resolved for this stroke */
  reveal: Exclude<RevealMode, "auto">;
  /** Sweep axis bbox for 'sweep' reveal */
  sweepBox?: LineRect;
}

export interface BuiltGeometry {
  /** Overlay bbox in viewport CSS px at build time */
  overlayViewport: LineRect;
  /** Margin included around content inside the overlay (CSS px) */
  margin: number;
  strokes: StrokeSpec[];
  /** Measured line rects (annotation-local), for debugging/word geometry */
  lines: LineRect[];
  fontSizePx: number;
}
