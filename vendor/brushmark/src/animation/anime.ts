import {
  animate,
  createTimeline,
  type AnimationParams,
  type Timeline as AnimeTimeline,
  type TimelineParams,
} from "animejs";
import type {
  AnimationEngine,
  BrushTimeline,
  BrushTimelineVars,
  BrushTween,
  BrushTweenVars,
  EaseInput,
} from "./engine";
import { splitEase } from "./easing";
import { builtinTicker } from "./builtin";

/**
 * Anime.js v4 engine adapter. Wraps anime timelines behind the GSAP-shaped
 * BrushTimeline facade: seconds → milliseconds, gsap ease names → anime ease
 * names, gsap position params → absolute ms positions (tracked internally).
 *
 *   import { setAnimationEngine } from "brushmark";
 *   import { animeEngine } from "brushmark/anime";
 *   setAnimationEngine(animeEngine);
 */

const EASE_FAMILIES: Record<string, string> = {
  power1: "Quad",
  power2: "Cubic",
  power3: "Quart",
  power4: "Quint",
  sine: "Sine",
  expo: "Expo",
  circ: "Circ",
  back: "Back",
  elastic: "Elastic",
  bounce: "Bounce",
};

const warnedEases = new Set<string>();
let warnedScrollTrigger = false;

function toAnimeEase(
  input: EaseInput | undefined,
): string | ((t: number) => number) | undefined {
  if (input === undefined || typeof input === "function") return input;
  const { family, dir } = splitEase(input);
  if (family === "linear" || family === "none") return "linear";
  const mapped = EASE_FAMILIES[family];
  if (!mapped) {
    if (!warnedEases.has(input)) {
      warnedEases.add(input);
      console.warn(
        `brushmark: unknown ease "${input}" on the anime engine, using "outCubic".`,
      );
    }
    return "outCubic";
  }
  return dir + mapped; // "out" + "Cubic" → "outCubic"
}

function toAnimeTweenParams(vars: BrushTweenVars): AnimationParams {
  const { duration, delay, ease, ...rest } = vars;
  const params: Record<string, unknown> = {
    ...rest,
    duration: (typeof duration === "number" ? duration : 0.5) * 1000,
  };
  if (typeof delay === "number") params.delay = delay * 1000;
  const animeEase = toAnimeEase(ease);
  if (animeEase !== undefined) params.ease = animeEase;
  return params as AnimationParams;
}

function toAnimeTimelineParams(vars: BrushTimelineVars): TimelineParams {
  const { paused, repeat, yoyo, scrollTrigger, ...rest } = vars;
  if (scrollTrigger && !warnedScrollTrigger) {
    warnedScrollTrigger = true;
    console.warn(
      "brushmark: timelineVars.scrollTrigger requires the gsap engine " +
        '(import { gsapEngine } from "brushmark/gsap") — ignored by the anime engine.',
    );
  }
  const params: Record<string, unknown> = { ...rest, autoplay: !paused };
  if (typeof repeat === "number" && repeat !== 0) {
    params.loop = repeat < 0 ? true : repeat;
  }
  if (yoyo) params.alternate = true;
  return params as TimelineParams;
}

class AnimeTimelineWrapper implements BrushTimeline {
  private raw: AnimeTimeline;
  private readonly params: TimelineParams;
  /** End of the most recently added item in seconds, for ">" / ">-n". */
  private lastEnd = 0;

  constructor(vars: BrushTimelineVars) {
    this.params = toAnimeTimelineParams(vars);
    this.raw = createTimeline(this.params);
  }

  /** One cycle in seconds (anime durations include repeats; iteration doesn't). */
  private cycleSec(): number {
    return this.raw.iterationDuration / 1000;
  }

  private resolvePosition(pos: number | string | undefined): number {
    if (typeof pos === "number") return Math.max(0, pos);
    if (pos === undefined) return this.cycleSec();
    if (pos === ">") return this.lastEnd;
    const rel = /^>([+-]?\d*\.?\d+)$/.exec(pos);
    if (rel) return Math.max(0, this.lastEnd + parseFloat(rel[1]));
    const off = /^([+-])=(\d*\.?\d+)$/.exec(pos);
    if (off) {
      const n = parseFloat(off[2]);
      return Math.max(0, this.cycleSec() + (off[1] === "-" ? -n : n));
    }
    console.warn(
      `brushmark: unsupported timeline position "${pos}" on the anime engine, appending at the end.`,
    );
    return this.cycleSec();
  }

  /** Seek to a visual (forward-space) time in seconds. */
  private seekVisual(sec: number): void {
    const ms = sec * 1000;
    // When reversed, anime's currentTime runs duration→… inverted.
    this.raw.seek(this.raw.reversed ? this.raw.duration - ms : ms);
  }

  to(target: object, vars: BrushTweenVars, position?: number | string): this {
    const start = this.resolvePosition(position);
    const params = toAnimeTweenParams(vars);
    this.raw.add(target, params, start * 1000);
    this.lastEnd = start + (params.duration as number) / 1000;
    return this;
  }

  call(
    callback: (...args: unknown[]) => void,
    params?: unknown[],
    position?: number | string,
  ): this {
    const time = this.resolvePosition(position);
    this.raw.call(() => callback(...(params ?? [])), time * 1000);
    this.lastEnd = time;
    return this;
  }

  add(child: BrushTimeline | object | string, position?: number | string): this {
    if (!(child instanceof AnimeTimelineWrapper)) {
      console.warn(
        "brushmark: the anime engine can only nest anime-engine timelines — add() ignored.",
      );
      return this;
    }
    const start = this.resolvePosition(position);
    this.raw.sync(child.raw, start * 1000);
    this.lastEnd = start + child.raw.duration / 1000;
    return this;
  }

  clear(): this {
    // Anime timelines can't be emptied; swap in a fresh one. The wrapper
    // identity (what user code holds) stays stable.
    this.raw.cancel();
    this.raw = createTimeline(this.params);
    this.lastEnd = 0;
    return this;
  }

  duration(): number {
    return this.cycleSec();
  }

  play(from?: number | null): this {
    // anime play() forces forward playback and remaps reversed currentTime.
    this.raw.play();
    if (typeof from === "number") this.raw.seek(from * 1000);
    return this;
  }

  pause(atTime?: number): this {
    if (typeof atTime === "number") this.seekVisual(atTime);
    this.raw.pause();
    return this;
  }

  paused(value: boolean): this;
  paused(): boolean;
  paused(value?: boolean): this | boolean {
    if (value === undefined) return this.raw.paused;
    // paused(false) is a no-op by design: it's only called right before a
    // master timeline adopts this one via add()/sync(), and a synced child
    // is driven by its parent regardless of its own paused state. Resuming
    // here would race the child on anime's own engine loop.
    if (value) this.raw.pause();
    return this;
  }

  progress(value: number): this;
  progress(): number;
  progress(value?: number): this | number {
    // iterationProgress is already visual: it inverts when reversed.
    if (value === undefined) return this.raw.iterationProgress;
    this.seekVisual(value * this.cycleSec());
    return this;
  }

  reverse(): this {
    this.raw.reverse();
    return this;
  }

  restart(): this {
    this.raw.restart();
    return this;
  }

  kill(): this {
    this.raw.pause();
    this.raw.cancel();
    return this;
  }

  then(onFulfilled?: (result: unknown) => unknown): Promise<unknown> {
    const p = this.raw.then() as Promise<unknown>;
    return onFulfilled ? p.then(onFulfilled) : p;
  }
}

export const animeEngine: AnimationEngine = {
  name: "anime",
  createTimeline(vars?: BrushTimelineVars): BrushTimeline {
    return new AnimeTimelineWrapper(vars ?? {});
  },
  to(target: object, vars: BrushTweenVars): BrushTween {
    const animation = animate(target, toAnimeTweenParams(vars));
    return { kill: () => animation.cancel() };
  },
  // Frame callbacks (repaint flush, reverse polling) ride the shared rAF
  // ticker — no coupling to anime's internal engine loop needed.
  ticker: builtinTicker,
};
