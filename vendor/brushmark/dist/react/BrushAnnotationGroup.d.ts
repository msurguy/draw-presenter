import { ReactNode } from 'react';
import { BrushTimeline } from '../animation/engine';
export interface BrushAnnotationGroupProps {
    /** Play the sequenced group when true (default true) */
    show?: boolean;
    /** Seconds of overlap between consecutive annotations */
    overlap?: number;
    onTimeline?: (tl: BrushTimeline) => void;
    children: ReactNode;
}
/**
 * Sequences child <BrushAnnotation>s in render order on one master timeline.
 */
export declare function BrushAnnotationGroup({ show, overlap, onTimeline, children, }: BrushAnnotationGroupProps): import("react").JSX.Element;
