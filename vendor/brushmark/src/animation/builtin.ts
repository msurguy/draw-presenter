import type {
  AnimationEngine,
  BrushTimeline,
  BrushTimelineVars,
  BrushTween,
  BrushTweenVars,
  EaseFunction,
  EaseInput,
  EngineTicker,
  TickerCallback,
} from "./engine";
import { parseEase } from "./easing";

/**
 * Zero-dependency default engine: a small GSAP-shaped timeline sampled as a
 * pure function of time (no per-frame integration), so scrubbing, reverse
 * and responsive rebuilds are exact.
 */

// Clamp frame delta so a backgrounded tab doesn't skip the whole animation.
const MAX_DT_MS = 100;

class RafTicker implements EngineTicker {
  private callbacks = new Set<TickerCallback>();
  private rafId: number | null = null;
  private last = 0;
  private epoch = 0;

  add(callback: TickerCallback): void {
    this.callbacks.add(callback);
    if (this.rafId === null && typeof requestAnimationFrame !== "undefined") {
      this.last = performance.now();
      if (!this.epoch) this.epoch = this.last;
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  remove(callback: TickerCallback): void {
    this.callbacks.delete(callback);
  }

  private tick = (now: number): void => {
    const dt = now - this.last;
    this.last = now;
    for (const cb of [...this.callbacks]) cb((now - this.epoch) / 1000, dt);
    this.rafId = this.callbacks.size
      ? requestAnimationFrame(this.tick)
      : null;
  };
}

/** Shared rAF ticker (also reused by the Anime.js adapter). */
export const builtinTicker = new RafTicker();

type TweenItem = {
  kind: "tween";
  start: number;
  duration: number;
  target: Record<string, number>;
  /** `from` is captured at insert time (targets are progress objects). */
  props: { key: string; from: number; to: number }[];
  ease: EaseFunction;
  onUpdate?: () => void;
  onComplete?: () => void;
  lastT: number;
};

type Item =
  | TweenItem
  | { kind: "call"; time: number; fn: () => void }
  | { kind: "child"; start: number; child: BuiltinTimeline };

/** Tween vars that are options, not numeric target properties. */
const RESERVED = new Set(["duration", "delay", "repeat", "repeatDelay", "stagger"]);

const warnedPositions = new Set<string>();
let warnedScrollTrigger = false;

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export class BuiltinTimeline implements BrushTimeline, BrushTween {
  private items: Item[] = [];
  /** End of the most recently added item, for ">" / ">-n" positions. */
  private lastEnd = 0;
  /** Playhead in seconds, within [0, totalDuration]. */
  private time = 0;
  private _paused: boolean;
  private reversed = false;
  private repeat: number;
  private yoyo: boolean;
  /** Nested children are sampled by their parent, never ticked. */
  private parent: BuiltinTimeline | null = null;
  private killed = false;
  private ticking = false;
  private vars: BrushTimelineVars;
  private thenResolvers: Array<() => void> = [];

  constructor(vars: BrushTimelineVars = {}) {
    this.vars = vars;
    this.repeat = typeof vars.repeat === "number" ? vars.repeat : 0;
    this.yoyo = !!vars.yoyo;
    this._paused = !!vars.paused;
    if (vars.scrollTrigger && !warnedScrollTrigger) {
      warnedScrollTrigger = true;
      console.warn(
        "brushmark: timelineVars.scrollTrigger requires the gsap engine " +
          '(import { gsapEngine } from "brushmark/gsap") — ignored by the built-in engine.',
      );
    }
    if (!this._paused) this.ensureTicking();
  }

  // -- building ---------------------------------------------------------------

  to(target: object, vars: BrushTweenVars, position?: number | string): this {
    const delay = typeof vars.delay === "number" ? vars.delay : 0;
    const start = this.resolvePosition(position) + delay;
    const duration = typeof vars.duration === "number" ? vars.duration : 0.5;
    const t = target as Record<string, number>;
    const props: TweenItem["props"] = [];
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === "number" && !RESERVED.has(key)) {
        props.push({ key, from: typeof t[key] === "number" ? t[key] : 0, to: value });
      }
    }
    this.items.push({
      kind: "tween",
      start,
      duration,
      target: t,
      props,
      ease: parseEase(vars.ease as EaseInput | undefined),
      onUpdate: vars.onUpdate,
      onComplete: vars.onComplete,
      lastT: 0,
    });
    this.lastEnd = start + duration;
    return this;
  }

  call(
    callback: (...args: unknown[]) => void,
    params?: unknown[],
    position?: number | string,
  ): this {
    const time = this.resolvePosition(position);
    this.items.push({ kind: "call", time, fn: () => callback(...(params ?? [])) });
    this.lastEnd = time;
    return this;
  }

  add(child: BrushTimeline | object | string, position?: number | string): this {
    if (!(child instanceof BuiltinTimeline)) {
      console.warn(
        "brushmark: the built-in engine can only nest built-in timelines — add() ignored.",
      );
      return this;
    }
    const start = this.resolvePosition(position);
    child.parent = this;
    child.stopTicking();
    this.items.push({ kind: "child", start, child });
    this.lastEnd = start + child.totalDuration();
    return this;
  }

  clear(): this {
    this.items = [];
    this.lastEnd = 0;
    return this;
  }

  private resolvePosition(pos: number | string | undefined): number {
    if (typeof pos === "number") return Math.max(0, pos);
    if (pos === undefined) return this.cycleDuration();
    if (pos === ">") return this.lastEnd;
    const rel = /^>([+-]?\d*\.?\d+)$/.exec(pos);
    if (rel) return Math.max(0, this.lastEnd + parseFloat(rel[1]));
    const off = /^([+-])=(\d*\.?\d+)$/.exec(pos);
    if (off) {
      const n = parseFloat(off[2]);
      return Math.max(0, this.cycleDuration() + (off[1] === "-" ? -n : n));
    }
    if (!warnedPositions.has(pos)) {
      warnedPositions.add(pos);
      console.warn(
        `brushmark: unsupported timeline position "${pos}" on the built-in engine, appending at the end.`,
      );
    }
    return this.cycleDuration();
  }

  // -- durations --------------------------------------------------------------

  duration(): number {
    return this.cycleDuration();
  }

  private cycleDuration(): number {
    let end = 0;
    for (const item of this.items) {
      if (item.kind === "tween") end = Math.max(end, item.start + item.duration);
      else if (item.kind === "call") end = Math.max(end, item.time);
      else end = Math.max(end, item.start + item.child.totalDuration());
    }
    return end;
  }

  private totalDuration(): number {
    const cycle = this.cycleDuration();
    if (cycle <= 0) return 0;
    return this.repeat < 0 ? Infinity : cycle * (this.repeat + 1);
  }

  // -- sampling ---------------------------------------------------------------

  private iterOf(t: number, cycle: number): number {
    if (cycle <= 0) return 0;
    const maxIter = this.repeat < 0 ? Number.MAX_SAFE_INTEGER : this.repeat;
    return Math.min(Math.max(Math.floor(t / cycle), 0), maxIter);
  }

  /** Fold repeats/yoyo: absolute time → local time within one cycle. */
  private fold(t: number, cycle: number): number {
    if (cycle <= 0) return 0;
    const iter = this.iterOf(t, cycle);
    const local = t - iter * cycle;
    return this.yoyo && iter % 2 === 1 ? cycle - local : local;
  }

  /**
   * Render the state at unfolded time `now` (values depend only on `now`;
   * `prev` is used to detect crossings for call items and completions).
   * Seeks pass suppress=true: values and onUpdate still apply, but call
   * items and completion events don't fire (gsap suppressEvents parity).
   */
  private renderAt(prev: number, now: number, suppress: boolean): void {
    const cycle = this.cycleDuration();
    const a = this.fold(prev, cycle);
    const b = this.fold(now, cycle);
    const wrapped = this.iterOf(prev, cycle) !== this.iterOf(now, cycle);

    for (const item of this.items) {
      if (item.kind === "tween") {
        const tt =
          item.duration <= 0
            ? b >= item.start
              ? 1
              : 0
            : clamp01((b - item.start) / item.duration);
        if (tt !== item.lastT) {
          const prevT = item.lastT;
          item.lastT = tt;
          const e = item.ease(tt);
          for (const p of item.props) item.target[p.key] = p.from + (p.to - p.from) * e;
          item.onUpdate?.();
          if (!suppress && prevT < 1 && tt >= 1) item.onComplete?.();
        }
      } else if (item.kind === "call") {
        if (suppress) continue;
        // Same-iteration: directional crossing. Wrapped iteration: fire once
        // (brushmark's only calls are idempotent repaint marks).
        const crossed = wrapped
          ? true
          : b >= a
            ? item.time > a && item.time <= b
            : item.time >= b && item.time < a;
        if (crossed) item.fn();
      } else {
        const total = item.child.totalDuration();
        const cap = Number.isFinite(total) ? total : Infinity;
        const ca = Math.min(Math.max(a - item.start, 0), cap);
        const cb = Math.min(Math.max(b - item.start, 0), cap);
        if (ca !== cb) {
          item.child.renderAt(ca, cb, suppress);
          if (!suppress && ca < total && cb >= total) item.child.completeForward();
        }
      }
    }
    if (now !== prev) (this.vars.onUpdate as (() => void) | undefined)?.();
  }

  private seekTo(t: number): void {
    const total = this.totalDuration();
    const clamped = Math.min(Math.max(t, 0), Number.isFinite(total) ? total : t);
    const prev = this.time;
    this.time = clamped;
    this.renderAt(prev, clamped, true);
  }

  // -- ticking ----------------------------------------------------------------

  private tickCb: TickerCallback = (_time, dtMs) => {
    this.advance(typeof dtMs === "number" ? dtMs : 16.7);
  };

  private ensureTicking(): void {
    if (this.ticking || this.parent || this.killed) return;
    this.ticking = true;
    builtinTicker.add(this.tickCb);
  }

  private stopTicking(): void {
    if (!this.ticking) return;
    this.ticking = false;
    builtinTicker.remove(this.tickCb);
  }

  private advance(dtMs: number): void {
    if (this.killed || this._paused || this.parent) {
      this.stopTicking();
      return;
    }
    const dt =
      (Math.min(Math.max(dtMs, 0), MAX_DT_MS) / 1000) * (this.reversed ? -1 : 1);
    const total = this.totalDuration();
    let next = this.time + dt;
    let doneForward = false;
    let doneReverse = false;
    if (!this.reversed && next >= total) {
      next = Number.isFinite(total) ? total : next;
      doneForward = Number.isFinite(total);
    } else if (this.reversed && next <= 0) {
      next = 0;
      doneReverse = true;
    }
    const prev = this.time;
    this.time = next;
    this.renderAt(prev, next, false);
    if (doneForward) {
      this._paused = true;
      this.stopTicking();
      this.completeForward();
    } else if (doneReverse) {
      this._paused = true;
      this.stopTicking();
    }
  }

  private completeForward(): void {
    (this.vars.onComplete as (() => void) | undefined)?.();
    const resolvers = this.thenResolvers;
    this.thenResolvers = [];
    for (const resolve of resolvers) resolve();
  }

  // -- playback control ---------------------------------------------------------

  play(from?: number | null): this {
    if (this.killed) return this;
    if (typeof from === "number") this.seekTo(from);
    this.reversed = false;
    this._paused = false;
    this.ensureTicking();
    return this;
  }

  pause(atTime?: number): this {
    if (typeof atTime === "number") this.seekTo(atTime);
    this._paused = true;
    this.stopTicking();
    return this;
  }

  paused(value: boolean): this;
  paused(): boolean;
  paused(value?: boolean): this | boolean {
    if (value === undefined) return this._paused;
    this._paused = value;
    if (value) this.stopTicking();
    else this.ensureTicking();
    return this;
  }

  progress(value: number): this;
  progress(): number;
  progress(value?: number): this | number {
    const cycle = this.cycleDuration();
    if (value === undefined) return cycle <= 0 ? 0 : this.fold(this.time, cycle) / cycle;
    this.seekTo(value * cycle);
    return this;
  }

  reverse(): this {
    if (this.killed) return this;
    this.reversed = true;
    this._paused = false;
    this.ensureTicking();
    return this;
  }

  restart(): this {
    if (this.killed) return this;
    this.seekTo(0);
    this.reversed = false;
    this._paused = false;
    this.ensureTicking();
    return this;
  }

  kill(): this {
    this.killed = true;
    this.stopTicking();
    return this;
  }

  then(onFulfilled?: (result: unknown) => unknown): Promise<unknown> {
    const total = this.totalDuration();
    const done = !this.reversed && Number.isFinite(total) && this.time >= total;
    // Resolve with undefined (not `this`) so the timeline's own thenability
    // can't recurse through promise assimilation.
    const p: Promise<unknown> = done
      ? Promise.resolve(undefined)
      : new Promise((resolve) => this.thenResolvers.push(() => resolve(undefined)));
    return onFulfilled ? p.then(onFulfilled) : p;
  }
}

export const builtinEngine: AnimationEngine = {
  name: "builtin",
  createTimeline(vars?: BrushTimelineVars): BrushTimeline {
    return new BuiltinTimeline(vars);
  },
  to(target: object, vars: BrushTweenVars): BrushTween {
    const tl = new BuiltinTimeline();
    tl.to(target, vars, 0);
    return tl.play();
  },
  ticker: builtinTicker,
};
