import { ReactNode } from 'react';
import { BrushTimeline } from '../animation/engine';
import { AnnotationConfig, BrushAnnotation as BrushAnnotationHandle } from '../types';
export interface GroupContextValue {
    register(order: number, annotation: BrushAnnotationHandle): void;
    unregister(annotation: BrushAnnotationHandle): void;
    nextOrder(): number;
}
export declare const GroupContext: import('react').Context<GroupContextValue | null>;
export interface BrushAnnotationProps extends AnnotationConfig {
    /** Declarative visibility (default true: draws on mount) */
    show?: boolean;
    /** Wrapper tag — inline elements measure wrapped lines correctly */
    as?: keyof React.JSX.IntrinsicElements;
    /** Called with the annotation's timeline (adopt it, don't re-parent) */
    onTimeline?: (tl: BrushTimeline) => void;
    className?: string;
    children: ReactNode;
}
export declare function BrushAnnotation({ show, as: Tag, onTimeline, className, children, ...config }: BrushAnnotationProps): import("react").JSX.Element;
