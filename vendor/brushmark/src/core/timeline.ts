import type { AnimationEngine, BrushTimeline } from "../animation/engine";
import type { AnnotationConfig } from "../types";
import type { RevealGroup, RevealState } from "./reveal";
import { markDirty } from "./reveal";

export const DEFAULT_DURATION = 0.8;

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The timeline instance is created once per annotation and refilled on
 * responsive rebuilds, so references held by user code stay valid.
 */
export function createTimeline(
  config: AnnotationConfig,
  engine: AnimationEngine,
): BrushTimeline {
  return engine.createTimeline({
    paused: true,
    repeat: config.repeat,
    yoyo: config.yoyo,
    ...config.timelineVars,
  });
}

/**
 * (Re)build the tweens driving an annotation's reveal groups. Total duration
 * is split across groups proportionally to stroke length (rough-notation
 * behavior), sequenced in group order.
 */
export function fillTimeline(
  tl: BrushTimeline,
  groups: RevealGroup[],
  state: RevealState,
  config: AnnotationConfig,
): void {
  tl.clear();

  const duration = config.duration ?? DEFAULT_DURATION;
  const ease = config.ease ?? "power2.out";
  const ordered = [...groups].sort((a, b) => a.order - b.order);
  if (config.direction === "rtl") ordered.reverse();

  const totalLength = ordered.reduce((sum, g) => sum + Math.max(1, g.lengthPx), 0);
  const stagger = config.stagger || undefined;

  let position = config.delay ?? 0;
  for (const group of ordered) {
    const share = Math.max(1, group.lengthPx) / totalLength;
    const groupDuration = Math.max(0.02, duration * share);
    tl.to(
      group.progress,
      {
        value: 1,
        duration: groupDuration,
        ease,
        onUpdate: () => markDirty(state),
      },
      position,
    );
    if (stagger?.each !== undefined) {
      position += stagger.each;
    } else if (stagger?.overlap !== undefined) {
      position += groupDuration * (1 - Math.min(1, Math.max(0, stagger.overlap)));
    } else {
      position += groupDuration;
    }
  }

  // Guarantee a final repaint at the true end state (a call, not
  // eventCallback, so user-supplied timelineVars callbacks survive).
  tl.call(() => markDirty(state), undefined, Math.max(position, tl.duration()));
}
