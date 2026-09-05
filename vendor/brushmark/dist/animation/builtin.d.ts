import { AnimationEngine, BrushTimeline, BrushTimelineVars, BrushTween, BrushTweenVars, EngineTicker, TickerCallback } from './engine';
declare class RafTicker implements EngineTicker {
    private callbacks;
    private rafId;
    private last;
    private epoch;
    add(callback: TickerCallback): void;
    remove(callback: TickerCallback): void;
    private tick;
}
/** Shared rAF ticker (also reused by the Anime.js adapter). */
export declare const builtinTicker: RafTicker;
export declare class BuiltinTimeline implements BrushTimeline, BrushTween {
    private items;
    /** End of the most recently added item, for ">" / ">-n" positions. */
    private lastEnd;
    /** Playhead in seconds, within [0, totalDuration]. */
    private time;
    private _paused;
    private reversed;
    private repeat;
    private yoyo;
    /** Nested children are sampled by their parent, never ticked. */
    private parent;
    private killed;
    private ticking;
    private vars;
    private thenResolvers;
    constructor(vars?: BrushTimelineVars);
    to(target: object, vars: BrushTweenVars, position?: number | string): this;
    call(callback: (...args: unknown[]) => void, params?: unknown[], position?: number | string): this;
    add(child: BrushTimeline | object | string, position?: number | string): this;
    clear(): this;
    private resolvePosition;
    duration(): number;
    private cycleDuration;
    private totalDuration;
    private iterOf;
    /** Fold repeats/yoyo: absolute time → local time within one cycle. */
    private fold;
    /**
     * Render the state at unfolded time `now` (values depend only on `now`;
     * `prev` is used to detect crossings for call items and completions).
     * Seeks pass suppress=true: values and onUpdate still apply, but call
     * items and completion events don't fire (gsap suppressEvents parity).
     */
    private renderAt;
    private seekTo;
    private tickCb;
    private ensureTicking;
    private stopTicking;
    private advance;
    private completeForward;
    play(from?: number | null): this;
    pause(atTime?: number): this;
    paused(value: boolean): this;
    paused(): boolean;
    progress(value: number): this;
    progress(): number;
    reverse(): this;
    restart(): this;
    kill(): this;
    then(onFulfilled?: (result: unknown) => unknown): Promise<unknown>;
}
export declare const builtinEngine: AnimationEngine;
export {};
