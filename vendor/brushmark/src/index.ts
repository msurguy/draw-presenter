import { BrushAnnotationImpl } from "./core/annotation";
import type { AnnotationConfig, BrushAnnotation } from "./types";

export { annotationGroup } from "./core/group";
export { listBrushes, registerBrush } from "./core/brushes";
export {
  setAnimationEngine,
  getAnimationEngine,
  builtinEngine,
} from "./animation";
export type {
  AnimationEngine,
  BrushTimeline,
  BrushTween,
  BrushTimelineVars,
  BrushTweenVars,
  EngineTicker,
  EaseFunction,
  EaseInput,
} from "./animation/engine";
export type {
  AnimationConfig,
  AnnotationConfig,
  AnnotationType,
  BracketSide,
  BrushAnnotation,
  BrushAnnotationGroup,
  BrushConfig,
  ContourConfig,
  HatchConfig,
  HideMode,
  Padding,
  PressureConfig,
  RevealDirection,
  RevealMode,
  StaggerConfig,
  WatercolorFillConfig,
} from "./types";

/**
 * Create a brush annotation for `element`. Call `.show()` to animate it in.
 */
export function annotate(element: HTMLElement, config: AnnotationConfig): BrushAnnotation {
  return new BrushAnnotationImpl(element, config);
}
