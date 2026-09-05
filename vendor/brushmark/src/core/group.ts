import { getAnimationEngine } from "../animation";
import type { BrushTimelineVars } from "../animation/engine";
import type { BrushAnnotation, BrushAnnotationGroup } from "../types";
import type { BrushAnnotationImpl } from "./annotation";

/**
 * Sequence several annotations on one master timeline. Each child's own
 * timeline is adopted in order, one after another (or overlapping by
 * `vars.overlap` seconds). The master is built eagerly so it can be
 * scrubbed or nested before ever playing.
 */
export function annotationGroup(
  annotations: BrushAnnotation[],
  vars?: BrushTimelineVars & { overlap?: number },
): BrushAnnotationGroup {
  const { overlap = 0, ...timelineVars } = vars ?? {};
  const engine = annotations.length
    ? (annotations[0] as BrushAnnotationImpl).engine
    : getAnimationEngine();
  const master = engine.createTimeline({ paused: true, ...timelineVars });

  for (const a of annotations) {
    const impl = a as BrushAnnotationImpl;
    if (impl.engine !== engine) {
      throw new Error(
        "brushmark: annotationGroup() requires all annotations to share one animation engine — " +
          `found "${impl.engine.name}" and "${engine.name}". Call setAnimationEngine() before creating them.`,
      );
    }
    impl.prepare();
    // Nested timelines must not be individually paused.
    impl.timeline.paused(false);
    master.add(impl.timeline, overlap > 0 ? `>-${overlap}` : ">");
  }

  return {
    timeline: master,
    annotations,
    async show() {
      for (const a of annotations) (a as BrushAnnotationImpl).beginShowing();
      master.play(0);
      await master.then();
    },
    hide() {
      master.pause(0);
      for (const a of annotations) void a.hide("instant");
    },
  };
}
