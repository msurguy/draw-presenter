import { getAnimationEngine } from "../animation";
import type { AnimationEngine, BrushTimeline, BrushTween } from "../animation/engine";
import type {
  AnnotationConfig,
  BrushAnnotation,
  HideMode,
  LineRect,
} from "../types";
import { buildStrokes, type BuildContext } from "../geometry/paths";
import {
  measureLineRects,
  padRect,
  rectsEqual,
  resolvePadding,
  unionRect,
} from "../geometry/rects";
import { hashString } from "../geometry/polyline";
import { measureWordBoxes } from "../text/metrics";
import {
  applyOverlayStacking,
  createOverlay,
  placeOverlay,
  removeOverlay,
  type Overlay,
} from "../dom/overlay";
import { observeLayout } from "../dom/observe";
import { estimateStrokeWidth, resolveBrush } from "./brushes";
import { getRenderer } from "./renderer";
import {
  compositeReveal,
  markDirty,
  unregister,
  type RevealGroup,
  type RevealState,
} from "./reveal";
import { createTimeline, fillTimeline, prefersReducedMotion } from "./timeline";

let instanceCounter = 0;

const WORD_GEOMETRY_TYPES = new Set(["underline", "strike-through", "highlight"]);

export class BrushAnnotationImpl implements BrushAnnotation {
  readonly element: HTMLElement;
  /** Captured at creation time — setAnimationEngine() only affects new annotations. */
  readonly engine: AnimationEngine;
  readonly timeline: BrushTimeline;

  private config: AnnotationConfig;
  private overlay: Overlay;
  private stopObserving: () => void;
  private seedValue: number;
  private built = false;
  private showing = false;
  private removed = false;
  /** Line rects relative to the element's own border box (translation-proof) */
  private lastRelativeLines: LineRect[] = [];
  private revealState: RevealState | null = null;
  private groups: RevealGroup[] = [];
  private fadeTween: BrushTween | null = null;
  private wipeTween: BrushTween | null = null;

  constructor(el: HTMLElement, config: AnnotationConfig) {
    this.element = el;
    this.config = { ...config };
    this.seedValue =
      config.seed ??
      (hashString(`${config.type}:${el.textContent?.slice(0, 64) ?? ""}`) +
        instanceCounter++) >>> 0;
    this.overlay = createOverlay(el);
    this.engine = getAnimationEngine();
    this.timeline = createTimeline(this.config, this.engine);
    this.stopObserving = observeLayout(el, () => this.onLayoutChange());
  }

  // -- lifecycle ------------------------------------------------------------

  /** Build geometry + art without playing (used by annotationGroup). */
  prepare(): void {
    if (this.removed) return;
    if (!this.built) this.build();
  }

  /** Mark as showing without driving the timeline (group master drives it). */
  beginShowing(): void {
    if (this.removed || !this.revealState) return;
    this.showing = true;
    this.cancelFade();
    this.cancelWipe();
    this.revealState.alpha.value = 1;
  }

  async show(): Promise<void> {
    if (this.removed) return;
    if (!this.built) this.build();
    if (!this.revealState) return;
    this.showing = true;
    this.cancelFade();
    // A re-show during a wipe cancels the erase and resumes drawing from where
    // the timeline was frozen.
    this.cancelWipe();
    this.revealState.alpha.value = 1;

    if (this.config.animate === false || prefersReducedMotion()) {
      this.timeline.progress(1).pause();
      markDirty(this.revealState);
      return;
    }
    this.timeline.play();
    await this.timeline.then();
  }

  async hide(mode: HideMode = "reverse"): Promise<void> {
    if (this.removed || !this.revealState) return;
    this.showing = false;
    this.cancelFade();
    this.cancelWipe();
    if (mode === "instant") {
      this.timeline.pause(0);
      markDirty(this.revealState);
      return;
    }
    if (mode === "fade") {
      await new Promise<void>((resolve) => {
        this.fadeTween = this.engine.to(this.revealState!.alpha, {
          value: 0,
          duration: 0.35,
          ease: "power1.out",
          onUpdate: () => this.revealState && markDirty(this.revealState),
          onComplete: () => {
            this.timeline.pause(0);
            resolve();
          },
        });
      });
      return;
    }
    // 'wipe' erases from the same edge the strokes drew from (start-first),
    // whereas 'reverse' retraces them backwards (end-first). A wipe freezes the
    // draw wherever it got to and advances a separate erase-front across only
    // the drawn portion — so interrupting a half-finished draw still clears
    // exactly the paint that was laid down, from its start edge.
    if (mode === "wipe") {
      const state = this.revealState;
      const drawn = this.timeline.progress();
      this.timeline.pause(); // freeze the draw front; nothing more is deposited
      if (drawn <= 0) {
        this.timeline.pause(0);
        markDirty(state);
        return;
      }
      const duration = Math.max(0.02, this.timeline.duration() * drawn);
      state.wipe = { value: 0 };
      await new Promise<void>((resolve) => {
        this.wipeTween = this.engine.to(state.wipe!, {
          value: 1,
          duration,
          ease: "power1.out",
          onUpdate: () => this.revealState && markDirty(this.revealState),
          onComplete: () => {
            this.wipeTween = null;
            if (this.revealState) this.revealState.wipe = null;
            this.timeline.pause(0); // reset draw front to 0 for the next show
            if (this.revealState) markDirty(this.revealState);
            resolve();
          },
        });
      });
      return;
    }
    // reverse: the brush un-draws
    await this.reverseToStart();
  }

  /** Play the timeline backwards to progress 0 and resolve when it lands. */
  private reverseToStart(): Promise<void> {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (this.timeline.progress() <= 0 || this.removed) {
          this.engine.ticker.remove(check);
          resolve();
        }
      };
      this.engine.ticker.add(check);
      this.timeline.reverse();
    });
  }

  remove(): void {
    if (this.removed) return;
    this.removed = true;
    this.stopObserving();
    this.cancelFade();
    this.cancelWipe();
    this.timeline.kill();
    if (this.revealState) unregister(this.revealState);
    removeOverlay(this.overlay);
  }

  isShowing(): boolean {
    return this.showing;
  }

  refresh(): void {
    if (this.removed) return;
    this.rebuildPreservingProgress();
  }

  update(partial: Partial<AnnotationConfig>): void {
    if (this.removed) return;
    this.config = { ...this.config, ...partial };
    if (partial.seed !== undefined) this.seedValue = partial.seed;
    this.rebuildPreservingProgress();
  }

  // -- internals ------------------------------------------------------------

  private cancelFade(): void {
    if (this.fadeTween) {
      this.fadeTween.kill();
      this.fadeTween = null;
    }
    if (this.revealState) this.revealState.alpha.value = 1;
  }

  private cancelWipe(): void {
    if (this.wipeTween) {
      this.wipeTween.kill();
      this.wipeTween = null;
    }
    if (this.revealState) this.revealState.wipe = null;
  }

  /**
   * Measure line rects with every brushmark overlay inside the element
   * hidden — each annotation's canvas would otherwise contribute a
   * full-element rect to the Range (multiple annotations can share a host).
   */
  private measureLines(): LineRect[] {
    const overlays = this.element.querySelectorAll<HTMLElement>(".brushmark-overlay");
    const prev: string[] = [];
    overlays.forEach((c, i) => {
      prev[i] = c.style.display;
      c.style.display = "none";
    });
    try {
      return measureLineRects(this.element, this.config.multiline !== false);
    } finally {
      overlays.forEach((c, i) => {
        c.style.display = prev[i];
      });
    }
  }

  private toRelative(lines: LineRect[]): LineRect[] {
    const origin = this.element.getBoundingClientRect();
    return lines.map((l) => ({ x: l.x - origin.left, y: l.y - origin.top, w: l.w, h: l.h }));
  }

  private onLayoutChange(): void {
    if (!this.built || this.removed) return;
    // The overlay lives inside the element, so pure translations need no
    // work at all — only element-relative geometry changes matter.
    const lines = this.measureLines();
    if (rectsEqual(this.toRelative(lines), this.lastRelativeLines)) return;
    this.rebuildPreservingProgress();
  }

  private rebuildPreservingProgress(): void {
    const progress = this.timeline.progress();
    const wasPaused = this.timeline.paused();
    this.build();
    if (!this.revealState) return;
    if (this.config.onResize === "replay" && this.showing) {
      this.timeline.restart();
    } else {
      this.timeline.progress(progress);
      if (wasPaused) this.timeline.pause();
    }
    markDirty(this.revealState);
  }

  /** Measure, build geometry, render art, refill the timeline. */
  private build(): void {
    const el = this.element;
    const config = this.config;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const viewportLines = this.measureLines();
    this.lastRelativeLines = this.toRelative(viewportLines);
    if (viewportLines.length === 0) return;

    const cs = getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize) || 16;
    const lineHeight = viewportLines[0].h || fontSize * 1.2;

    const padding = resolvePadding(config.padding, config.type === "highlight" ? 1 : 4);
    const paddedViewport = viewportLines.map((r) => padRect(r, padding));
    const origin = unionRect(paddedViewport);

    // Word geometry (DOM Range measurement) for line types; falls back silently.
    let wordBoxes: LineRect[][] | null = null;
    if (WORD_GEOMETRY_TYPES.has(config.type)) {
      const raw = measureWordBoxes(el, viewportLines);
      if (raw) {
        wordBoxes = raw.map((line) =>
          line.map((b) => ({ x: b.x - origin.x, y: b.y - origin.y, w: b.w, h: b.h })),
        );
      }
    }

    const resolved = resolveBrush(config.brush, fontSize);
    const ctx: BuildContext = {
      lines: paddedViewport.map((r) => ({
        x: r.x - origin.x,
        y: r.y - origin.y,
        w: r.w,
        h: r.h,
      })),
      wordBoxes,
      config,
      seed: this.seedValue,
      fontSize,
      lineHeight,
      weightFinal: resolved.weightFinal,
      strokeWidthEstimate: estimateStrokeWidth(resolved.name, resolved.weightFinal),
    };
    // VENDOR PATCH (draw-presenter): map element-local CSS px (the space
    // config.paths.strokes are authored in) into annotation-local geometry.
    // getBoundingClientRect is viewport-scaled; offsetWidth is layout px, so
    // the ratio recovers the accumulated ancestor CSS transform scale.
    if (config.type === "path") {
      const elRect = el.getBoundingClientRect();
      ctx.pathTransform = {
        x: elRect.left - origin.x,
        y: elRect.top - origin.y,
        scaleX: el.offsetWidth ? elRect.width / el.offsetWidth : 1,
        scaleY: el.offsetHeight ? elRect.height / el.offsetHeight : 1,
      };
    }
    const strokes = buildStrokes(ctx);
    if (strokes.length === 0) return;

    // Paint that covers the text area (highlight, watercolor wash, hatching)
    // stacks under the glyphs; pure outline/line annotations stay on top.
    const under =
      config.type === "highlight" || !!config.brush?.fill || !!config.brush?.hatch;
    applyOverlayStacking(this.overlay, el, under, config.zIndex);

    // Exact overlay bounds from the generated geometry (+ mask reach).
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const s of strokes) {
      const reach = Math.max(s.maskWidth / 2 + 4, 10);
      for (const p of s.polyline) {
        x1 = Math.min(x1, p[0] - reach);
        y1 = Math.min(y1, p[1] - reach);
        x2 = Math.max(x2, p[0] + reach);
        y2 = Math.max(y2, p[1] + reach);
      }
      if (s.sweepBox) {
        x1 = Math.min(x1, s.sweepBox.x);
        y1 = Math.min(y1, s.sweepBox.y);
        x2 = Math.max(x2, s.sweepBox.x + s.sweepBox.w);
        y2 = Math.max(y2, s.sweepBox.y + s.sweepBox.h);
      }
    }

    // Shift strokes into overlay-local space.
    const shiftX = -x1;
    const shiftY = -y1;
    for (const s of strokes) {
      s.polyline = s.polyline.map((p) => [p[0] + shiftX, p[1] + shiftY, p[2]]);
      if (s.sweepBox) {
        s.sweepBox = { ...s.sweepBox, x: s.sweepBox.x + shiftX, y: s.sweepBox.y + shiftY };
      }
    }

    const widthCss = x2 - x1;
    const heightCss = y2 - y1;
    placeOverlay(
      this.overlay,
      { x: origin.x + x1, y: origin.y + y1, w: widthCss, h: heightCss },
      dpr,
    );

    // Paint the finished art on the shared GL surface.
    const layers = getRenderer().render({
      strokes,
      resolved,
      widthCss,
      heightCss,
      dpr,
      seed: this.seedValue,
    });

    // Reveal groups from stroke group ids.
    const groupIds = [...new Set(strokes.map((s) => s.group))].sort((a, b) => a - b);
    const oldProgress = new Map(this.groups.map((g) => [g.order, g.progress.value]));
    this.groups = groupIds.map((id) => {
      const groupStrokes = strokes.filter((s) => s.group === id);
      return {
        progress: { value: oldProgress.get(id) ?? 0 },
        order: id,
        strokes: groupStrokes,
        lengthPx: groupStrokes.reduce((sum, s) => sum + s.lengthPx, 0),
      };
    });

    const prevAlpha = this.revealState?.alpha.value ?? 1;
    if (this.revealState) unregister(this.revealState);
    this.revealState = {
      overlayCtx: this.overlay.ctx,
      widthCss,
      heightCss,
      dpr,
      layers,
      groups: this.groups,
      direction: this.config.direction ?? "ltr",
      alpha: { value: prevAlpha },
      wipe: null,
      engine: this.engine,
      dirty: false,
    };

    fillTimeline(this.timeline, this.groups, this.revealState, this.config);
    this.built = true;
    compositeReveal(this.revealState);
  }
}
