import { BrushTimelineVars } from '../animation/engine';
import { BrushAnnotation, BrushAnnotationGroup } from '../types';
/**
 * Sequence several annotations on one master timeline. Each child's own
 * timeline is adopted in order, one after another (or overlapping by
 * `vars.overlap` seconds). The master is built eagerly so it can be
 * scrubbed or nested before ever playing.
 */
export declare function annotationGroup(annotations: BrushAnnotation[], vars?: BrushTimelineVars & {
    overlap?: number;
}): BrushAnnotationGroup;
