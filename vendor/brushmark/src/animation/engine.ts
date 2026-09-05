/**
 * Engine-agnostic animation contracts.
 *
 * The shapes below mirror the subset of GSAP's API that brushmark uses, and
 * every signature is chosen so `gsap.core.Timeline`, `gsap.core.Tween` and
 * `gsap.ticker` satisfy them STRUCTURALLY — the gsap adapter hands back real
 * gsap objects untouched. The built-in and Anime.js engines implement the
 * same contracts with their own objects.
 *
 * This file must stay free of imports: core brushmark depends only on these
 * types, never on an animation library.
 */

/** Function ease, gsap convention: t in [0,1] → eased value. */
export type EaseFunction = (t: number) => number;
export type EaseInput = string | EaseFunction;

export interface BrushTweenVars {
  /** Duration in seconds (gsap convention). */
  duration?: number;
  /** Named ease ("power2.out", …) or custom function. */
  ease?: EaseInput;
  onUpdate?: () => void;
  onComplete?: () => void;
  /** Numeric target props ({ value: 1 }) plus engine passthrough. */
  [key: string]: unknown;
}

export interface BrushTimelineVars {
  paused?: boolean;
  /** Number of extra cycles; -1 = infinite. */
  repeat?: number;
  yoyo?: boolean;
  onComplete?: (...args: unknown[]) => void;
  onUpdate?: (...args: unknown[]) => void;
  /** Engine passthrough (scrollTrigger, callbacks, …). */
  [key: string]: unknown;
}

/** Returned by AnimationEngine.to() — only kill() is required. */
export interface BrushTween {
  kill(): void;
}

/**
 * Engine-agnostic timeline. Positions may be absolute seconds (numbers) or
 * the relative strings ">" / ">-n" (n seconds of overlap with the previous
 * item). progress() uses gsap semantics: 0..1 of one cycle.
 *
 * When brushmark runs on the gsap engine this IS a real gsap.core.Timeline.
 */
export interface BrushTimeline {
  to(target: object, vars: BrushTweenVars, position?: number | string): this;
  call(
    callback: (...args: unknown[]) => void,
    params?: unknown[],
    position?: number | string,
  ): this;
  add(child: BrushTimeline | object | string, position?: number | string): this;
  clear(): this;
  duration(): number;
  play(from?: number | null): this;
  /** pause(0) seeks to 0 then pauses. */
  pause(atTime?: number): this;
  paused(value: boolean): this;
  paused(): boolean;
  progress(value: number): this;
  progress(): number;
  /** Plays backward from the current position (also un-pauses). */
  reverse(): this;
  restart(): this;
  kill(): this;
  then(onFulfilled?: (result: unknown) => unknown): Promise<unknown>;
}

export type TickerCallback = (time?: number, deltaTime?: number) => void;

/** Per-frame callback source. gsap.ticker satisfies this. */
export interface EngineTicker {
  add(callback: TickerCallback): unknown;
  remove(callback: TickerCallback): void;
}

export interface AnimationEngine {
  /** "builtin" | "gsap" | "anime" — used for the same-engine check in groups. */
  readonly name: string;
  createTimeline(vars?: BrushTimelineVars): BrushTimeline;
  /** Standalone tween (used by hide("fade")). Plays immediately. */
  to(target: object, vars: BrushTweenVars): BrushTween;
  readonly ticker: EngineTicker;
}
